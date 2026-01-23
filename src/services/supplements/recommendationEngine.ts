/**
 * Supplement Recommendation Engine
 *
 * Core algorithm for calculating supplement recommendations based on user data.
 * Implements weighted scoring, explanation generation, and confidence assessment.
 */

import {
  AggregatedUserData,
  DataCompleteness,
  SupplementDefinition,
  RecommendationCondition,
  RecommendationFactor,
  SupplementRecommendation,
  RecommendationResult,
  RecommendationConfig,
  DataSource,
} from './types';
import { SUPPLEMENT_DEFINITIONS } from './supplementDefinitions';
import { aggregateUserData, analyzeDataCompleteness, generateDataHash } from './dataAggregator';

const LOG_PREFIX = '[RecommendationEngine]';

// ============================================================================
// CONFIGURATION
// ============================================================================

const DEFAULT_CONFIG: RecommendationConfig = {
  minScoreThreshold: 60, // Show recommendations >= 60%
  maxRecommendations: 25,
  includeNegativeFactors: true,
  averageDaysForDailyData: 14,
};

// ============================================================================
// CONDITION EVALUATION
// ============================================================================

/**
 * Get value from nested object path (e.g., "profile.age" -> data.profile.age)
 */
const getValueByPath = (obj: any, path: string): any => {
  const parts = path.split('.');
  let current = obj;

  for (const part of parts) {
    if (current === null || current === undefined) {
      return undefined;
    }
    current = current[part];
  }

  return current;
};

/**
 * Determine data source from field path
 */
const getDataSourceFromPath = (path: string): DataSource => {
  if (path.startsWith('profile.')) return 'profile';
  if (path.startsWith('supplementProfile.')) return 'supplement_profile';
  if (path.startsWith('dailyAverages.')) return 'daily_checkin';
  if (path.startsWith('nutritionAverages.') || path.startsWith('nutritionGoals.')) return 'nutrition';
  if (path.startsWith('intolerances')) return 'profile';
  return 'calculated';
};

/**
 * Check if a condition is met
 */
const evaluateCondition = (
  condition: RecommendationCondition,
  data: AggregatedUserData
): { met: boolean; value: any; available: boolean } => {
  const value = getValueByPath(data, condition.field);

  // Check if data is available
  const available = value !== null && value !== undefined;

  if (!available) {
    return { met: false, value, available };
  }

  let met = false;

  switch (condition.operator) {
    case 'eq':
      met = value === condition.value;
      break;

    case 'neq':
      met = value !== condition.value;
      break;

    case 'gt':
      met = typeof value === 'number' && value > condition.value;
      break;

    case 'gte':
      met = typeof value === 'number' && value >= condition.value;
      break;

    case 'lt':
      met = typeof value === 'number' && value < condition.value;
      break;

    case 'lte':
      met = typeof value === 'number' && value <= condition.value;
      break;

    case 'in':
      if (Array.isArray(condition.value)) {
        met = condition.value.includes(value);
      }
      break;

    case 'not_in':
      if (Array.isArray(condition.value)) {
        met = !condition.value.includes(value);
      }
      break;

    case 'contains':
      // For intolerances check - search in array of objects
      if (condition.field === 'intolerances' && Array.isArray(data.intolerances)) {
        met = data.intolerances.some((i) =>
          i.name.toLowerCase().includes(condition.value.toLowerCase())
        );
      } else if (Array.isArray(value)) {
        met = value.includes(condition.value);
      }
      break;

    case 'not_empty':
      if (Array.isArray(value)) {
        met = value.length > 0;
      } else {
        met = value !== null && value !== undefined && value !== '';
      }
      break;

    default:
      console.warn(`${LOG_PREFIX} Unknown operator: ${condition.operator}`);
  }

  return { met, value, available };
};

/**
 * Create a recommendation factor from a condition evaluation
 */
const createFactor = (
  condition: RecommendationCondition,
  evaluation: { met: boolean; value: any; available: boolean },
  isPositiveCondition: boolean
): RecommendationFactor => {
  const dataSource = getDataSourceFromPath(condition.field);

  // Calculate contribution
  // Positive conditions: met = +weight, not met = 0
  // Negative conditions: met = -weight, not met = 0
  let contribution = 0;
  if (evaluation.available) {
    if (isPositiveCondition && evaluation.met) {
      contribution = condition.weight;
    } else if (!isPositiveCondition && evaluation.met) {
      contribution = -condition.weight;
    }
  }

  return {
    condition: condition.field,
    met: evaluation.met,
    weight: condition.weight,
    contribution,
    description: condition.description,
    dataSource,
    dataAvailable: evaluation.available,
  };
};

// ============================================================================
// SCORING ALGORITHM
// ============================================================================

/**
 * Calculate recommendation score for a single supplement
 */
const calculateSupplementScore = (
  supplement: SupplementDefinition,
  data: AggregatedUserData,
  config: RecommendationConfig
): SupplementRecommendation => {
  const positiveFactors: RecommendationFactor[] = [];
  const negativeFactors: RecommendationFactor[] = [];

  // Evaluate positive conditions
  let totalPossiblePositive = 0;
  let earnedPositive = 0;

  for (const condition of supplement.positiveConditions) {
    const evaluation = evaluateCondition(condition, data);
    const factor = createFactor(condition, evaluation, true);
    positiveFactors.push(factor);

    totalPossiblePositive += condition.weight;
    if (evaluation.available) {
      if (evaluation.met) {
        earnedPositive += condition.weight;
      }
    }
  }

  // Evaluate negative conditions
  let negativeDeductions = 0;
  let maxPossibleDeduction = 0;

  for (const condition of supplement.negativeConditions) {
    const evaluation = evaluateCondition(condition, data);
    const factor = createFactor(condition, evaluation, false);
    negativeFactors.push(factor);

    maxPossibleDeduction += condition.weight;
    if (evaluation.available && evaluation.met) {
      negativeDeductions += condition.weight;
    }
  }

  // Check contraindications (hard blocks)
  let isContraindicated = false;
  for (const contraindication of supplement.contraindications) {
    const hasIntolerance = data.intolerances.some(
      (i) => i.name.toLowerCase().includes(contraindication.toLowerCase()) &&
             (i.severity === 'severe' || i.severity === 'life_threatening')
    );
    if (hasIntolerance) {
      isContraindicated = true;
      negativeFactors.push({
        condition: 'intolerances',
        met: true,
        weight: 10,
        contribution: -10,
        description: `Kontraindikation: ${contraindication} (schwer/lebensbedrohlich)`,
        dataSource: 'profile',
        dataAvailable: true,
      });
    }
  }

  // Calculate match score
  // Base score from positive conditions (0-100)
  // Then apply negative deductions
  let matchScore = 0;

  if (totalPossiblePositive > 0) {
    // Calculate base score as percentage of possible positive points
    matchScore = (earnedPositive / totalPossiblePositive) * 100;

    // Apply negative deductions (each point reduces score)
    // Scale deductions: each weight point = ~5% reduction
    const deductionFactor = negativeDeductions * 5;
    matchScore = Math.max(0, matchScore - deductionFactor);
  }

  // Hard block for contraindications
  if (isContraindicated) {
    matchScore = 0;
  }

  // Round to integer
  matchScore = Math.round(matchScore);

  // Calculate data quality metrics
  const availableDataPoints = positiveFactors.filter((f) => f.dataAvailable).length +
                              negativeFactors.filter((f) => f.dataAvailable).length;
  const totalPossiblePoints = positiveFactors.length + negativeFactors.length;
  const dataRatio = totalPossiblePoints > 0 ? availableDataPoints / totalPossiblePoints : 0;

  // Determine confidence level
  let confidenceLevel: 'low' | 'medium' | 'high' = 'low';
  if (dataRatio >= 0.8) {
    confidenceLevel = 'high';
  } else if (dataRatio >= 0.5) {
    confidenceLevel = 'medium';
  }

  // Generate primary reasons (top positive factors that were met)
  const primaryReasons = positiveFactors
    .filter((f) => f.met && f.dataAvailable)
    .sort((a, b) => b.weight - a.weight)
    .slice(0, 3)
    .map((f) => f.description);

  // Generate cautions (negative factors that were met)
  const cautions = negativeFactors
    .filter((f) => f.met && f.dataAvailable)
    .map((f) => f.description);

  // Identify missing data
  const missingData = positiveFactors
    .filter((f) => !f.dataAvailable)
    .map((f) => f.description);

  return {
    supplement,
    matchScore,
    positiveFactors,
    negativeFactors,
    primaryReasons,
    cautions,
    dataQuality: {
      available_data_points: availableDataPoints,
      total_possible_points: totalPossiblePoints,
      confidence_level: confidenceLevel,
    },
    missingData,
  };
};

// ============================================================================
// MAIN RECOMMENDATION FUNCTIONS
// ============================================================================

/**
 * Generate recommendations for all supplements
 */
export const generateRecommendations = async (
  userId: string,
  config: Partial<RecommendationConfig> = {}
): Promise<RecommendationResult> => {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };

  console.log(`${LOG_PREFIX} Generating recommendations for user ${userId}`);

  // Aggregate user data
  const userData = await aggregateUserData(userId, {
    averageDays: finalConfig.averageDaysForDailyData,
  });

  // Analyze data completeness
  const dataCompleteness = analyzeDataCompleteness(userData);

  // Generate hash for change detection
  const dataHash = generateDataHash(userData);

  // Calculate scores for all supplements
  const allRecommendations = SUPPLEMENT_DEFINITIONS.map((supplement) =>
    calculateSupplementScore(supplement, userData, finalConfig)
  );

  // Check for contraindicated supplements (have a -10 contribution from contraindication)
  const contraindicatedIds = new Set(
    allRecommendations
      .filter((r) => r.negativeFactors.some((f) => f.contribution === -10))
      .map((r) => r.supplement.id)
  );

  // Filter recommendations:
  // 1. Essential supplements are ALWAYS included (unless contraindicated)
  // 2. Non-essential supplements need to meet the score threshold
  const filteredRecommendations = allRecommendations
    .filter((r) => {
      // Always include essential supplements (unless hard-blocked by contraindication)
      if (r.supplement.isEssential) {
        return !contraindicatedIds.has(r.supplement.id);
      }
      // For non-essential: apply normal threshold
      return r.matchScore >= finalConfig.minScoreThreshold;
    })
    .sort((a, b) => {
      // Sort essential supplements first, then by score
      if (a.supplement.isEssential && !b.supplement.isEssential) return -1;
      if (!a.supplement.isEssential && b.supplement.isEssential) return 1;
      return b.matchScore - a.matchScore;
    })
    .slice(0, finalConfig.maxRecommendations);

  // Generate warnings
  const warnings: string[] = [];

  if (dataCompleteness.overall_percentage < 50) {
    warnings.push(
      'Datenbasis eingeschraenkt: Die Empfehlungen basieren auf weniger als 50% der moeglichen Daten. ' +
      'Vervollstaendige dein Profil fuer genauere Empfehlungen.'
    );
  }

  if (dataCompleteness.missing_critical.length > 0) {
    warnings.push(
      `Wichtige Daten fehlen: ${dataCompleteness.missing_critical.join(', ')}. ` +
      'Diese Angaben sind essenziell fuer praezise Empfehlungen.'
    );
  }

  if (userData.dailyAverages.data_points < 3) {
    warnings.push(
      'Zu wenige taegliche Check-ins fuer zuverlaessige Schlaf-/Stress-Daten. ' +
      'Fuehre regelmaessig taegliche Check-ins durch.'
    );
  }

  if (userData.nutritionAverages.data_points < 3) {
    warnings.push(
      'Zu wenige Ernaehrungsdaten fuer zuverlaessige Naehrstoff-Analysen. ' +
      'Tracke deine Mahlzeiten regelmaessiger.'
    );
  }

  // Generate suggestions
  const suggestions: string[] = [];

  if (!userData.supplementProfile.supplement_onboarding_completed) {
    suggestions.push(
      'Vervollstaendige das Supplement-Profil (GI-Beschwerden, Gelenkprobleme, Sonnenexposition) ' +
      'fuer bessere Empfehlungen.'
    );
  }

  if (dataCompleteness.categories.daily_tracking.percentage < 50) {
    suggestions.push(
      'Fuehre regelmaessig taegliche Check-ins durch, um Schlaf- und Stressdaten zu erfassen.'
    );
  }

  if (dataCompleteness.categories.nutrition_tracking.percentage < 50) {
    suggestions.push(
      'Tracke deine Ernaehrung, um Empfehlungen fuer Vitamine und Mineralstoffe zu verbessern.'
    );
  }

  if (userData.supplementProfile.lab_values === null) {
    suggestions.push(
      'Fuege Laborwerte hinzu (Vitamin D, Eisen, etc.) fuer evidenzbasierte Mikro-Empfehlungen.'
    );
  }

  const result: RecommendationResult = {
    userId,
    generatedAt: new Date().toISOString(),
    recommendations: filteredRecommendations,
    dataCompleteness,
    warnings,
    suggestions,
    dataHash,
  };

  console.log(`${LOG_PREFIX} Generated ${filteredRecommendations.length} recommendations ` +
              `(threshold: ${finalConfig.minScoreThreshold}%, data: ${dataCompleteness.overall_percentage}%)`);

  return result;
};

/**
 * Generate recommendations from pre-aggregated data (for real-time updates)
 */
export const generateRecommendationsFromData = (
  userId: string,
  userData: AggregatedUserData,
  config: Partial<RecommendationConfig> = {}
): RecommendationResult => {
  const finalConfig = { ...DEFAULT_CONFIG, ...config };

  // Analyze data completeness
  const dataCompleteness = analyzeDataCompleteness(userData);

  // Generate hash
  const dataHash = generateDataHash(userData);

  // Calculate scores for all supplements
  const allRecommendations = SUPPLEMENT_DEFINITIONS.map((supplement) =>
    calculateSupplementScore(supplement, userData, finalConfig)
  );

  // Check for contraindicated supplements (have a -10 contribution from contraindication)
  const contraindicatedIds = new Set(
    allRecommendations
      .filter((r) => r.negativeFactors.some((f) => f.contribution === -10))
      .map((r) => r.supplement.id)
  );

  // Filter recommendations:
  // 1. Essential supplements are ALWAYS included (unless contraindicated)
  // 2. Non-essential supplements need to meet the score threshold
  const filteredRecommendations = allRecommendations
    .filter((r) => {
      // Always include essential supplements (unless hard-blocked by contraindication)
      if (r.supplement.isEssential) {
        return !contraindicatedIds.has(r.supplement.id);
      }
      // For non-essential: apply normal threshold
      return r.matchScore >= finalConfig.minScoreThreshold;
    })
    .sort((a, b) => {
      // Sort essential supplements first, then by score
      if (a.supplement.isEssential && !b.supplement.isEssential) return -1;
      if (!a.supplement.isEssential && b.supplement.isEssential) return 1;
      return b.matchScore - a.matchScore;
    })
    .slice(0, finalConfig.maxRecommendations);

  // Generate warnings and suggestions (same as above)
  const warnings: string[] = [];
  const suggestions: string[] = [];

  if (dataCompleteness.overall_percentage < 50) {
    warnings.push(
      'Datenbasis eingeschraenkt: Die Empfehlungen basieren auf weniger als 50% der moeglichen Daten.'
    );
  }

  if (dataCompleteness.missing_critical.length > 0) {
    warnings.push(
      `Wichtige Daten fehlen: ${dataCompleteness.missing_critical.join(', ')}.`
    );
  }

  return {
    userId,
    generatedAt: new Date().toISOString(),
    recommendations: filteredRecommendations,
    dataCompleteness,
    warnings,
    suggestions,
    dataHash,
  };
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get recommendation by supplement ID
 */
export const getRecommendationBySupplement = (
  result: RecommendationResult,
  supplementId: string
): SupplementRecommendation | undefined => {
  return result.recommendations.find((r) => r.supplement.id === supplementId);
};

/**
 * Get recommendations by target area
 */
export const getRecommendationsByTargetArea = (
  result: RecommendationResult,
  targetArea: string
): SupplementRecommendation[] => {
  return result.recommendations.filter((r) =>
    r.supplement.targetAreas.includes(targetArea as any)
  );
};

/**
 * Get top N recommendations
 */
export const getTopRecommendations = (
  result: RecommendationResult,
  count: number = 5
): SupplementRecommendation[] => {
  return result.recommendations.slice(0, count);
};

/**
 * Format match score for display
 */
export const formatMatchScore = (score: number): string => {
  if (score >= 90) return 'Sehr hoch';
  if (score >= 75) return 'Hoch';
  if (score >= 60) return 'Mittel';
  return 'Niedrig';
};

/**
 * Get score color for UI
 */
export const getScoreColor = (score: number): string => {
  if (score >= 90) return '#34C759'; // Green
  if (score >= 75) return '#30D158'; // Light green
  if (score >= 60) return '#FFD60A'; // Yellow
  return '#FF9F0A'; // Orange
};

/**
 * Format explanation text for a recommendation
 */
export const formatRecommendationExplanation = (
  recommendation: SupplementRecommendation
): string => {
  const parts: string[] = [];

  // Match score
  parts.push(`Passgenauigkeit: ${recommendation.matchScore}% (${formatMatchScore(recommendation.matchScore)})`);

  // Primary reasons
  if (recommendation.primaryReasons.length > 0) {
    parts.push('\nWarum dieses Supplement:');
    recommendation.primaryReasons.forEach((reason) => {
      parts.push(`• ${reason}`);
    });
  }

  // Cautions
  if (recommendation.cautions.length > 0) {
    parts.push('\nHinweise:');
    recommendation.cautions.forEach((caution) => {
      parts.push(`⚠️ ${caution}`);
    });
  }

  // Missing data
  if (recommendation.missingData.length > 0) {
    parts.push('\nFehlende Daten fuer genauere Bewertung:');
    recommendation.missingData.forEach((missing) => {
      parts.push(`? ${missing}`);
    });
  }

  // Data quality
  parts.push(`\nDatenqualitaet: ${recommendation.dataQuality.confidence_level === 'high' ? 'Hoch' :
             recommendation.dataQuality.confidence_level === 'medium' ? 'Mittel' : 'Niedrig'}`);

  // Notes from supplement definition
  if (recommendation.supplement.notes.length > 0) {
    parts.push('\nWissenswert:');
    recommendation.supplement.notes.forEach((note) => {
      parts.push(`ℹ️ ${note}`);
    });
  }

  return parts.join('\n');
};
