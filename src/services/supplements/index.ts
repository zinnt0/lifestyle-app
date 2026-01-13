/**
 * Supplement Recommendation System
 *
 * A comprehensive system for generating personalized supplement recommendations
 * based on user profile, daily check-ins, and nutrition data.
 *
 * @module supplements
 *
 * @example
 * ```typescript
 * // In a React component
 * import { useSupplementRecommendations } from '../hooks/useSupplementRecommendations';
 *
 * const SupplementScreen = () => {
 *   const { user } = useAuth();
 *   const {
 *     recommendations,
 *     topRecommendations,
 *     isLoading,
 *     warnings,
 *     dataCompleteness,
 *     refresh,
 *   } = useSupplementRecommendations({
 *     userId: user?.id || null,
 *     minScoreThreshold: 60,
 *   });
 *
 *   if (isLoading) return <Loading />;
 *
 *   return (
 *     <View>
 *       {warnings.length > 0 && <WarningBanner warnings={warnings} />}
 *
 *       <Text>Deine Top-Empfehlungen</Text>
 *       {topRecommendations.map((rec) => (
 *         <SupplementCard
 *           key={rec.supplement.id}
 *           name={rec.supplement.name}
 *           matchScore={rec.matchScore}
 *           reasons={rec.primaryReasons}
 *           cautions={rec.cautions}
 *         />
 *       ))}
 *
 *       <DataCompletenessBar value={dataCompleteness?.overall_percentage} />
 *     </View>
 *   );
 * };
 * ```
 */

// ============================================================================
// TYPES
// ============================================================================

export type {
  // Core types
  TargetArea,
  SubstanceClass,
  IndicationBasis,
  DataSource,

  // User data types
  AggregatedUserData,
  DataCompleteness,

  // Supplement definition types
  RecommendationCondition,
  AdditionalQuery,
  SupplementDefinition,

  // Recommendation result types
  RecommendationFactor,
  SupplementRecommendation,
  RecommendationResult,
  RecommendationConfig,

  // Events
  RecommendationUpdateEvent,

  // User stack types
  UserStackSupplement,
  DailySupplementTracking,
  SupplementStackCache,
  SupplementTrackingCache,
} from './types';

import type { DataCompleteness } from './types';

// ============================================================================
// SUPPLEMENT DEFINITIONS
// ============================================================================

export {
  SUPPLEMENT_DEFINITIONS,
  getSupplementById,
  getSupplementsByTargetArea,
  getSupplementsBySubstanceClass,
  getSupplementsByIndicationBasis,
} from './supplementDefinitions';

// ============================================================================
// DATA AGGREGATION
// ============================================================================

export {
  aggregateUserData,
  analyzeDataCompleteness,
  generateDataHash,
  fetchProfile,
  fetchRecoveryHistory,
  fetchNutritionHistory,
  fetchNutritionGoals,
} from './dataAggregator';

// ============================================================================
// RECOMMENDATION ENGINE
// ============================================================================

export {
  generateRecommendations,
  generateRecommendationsFromData,
  getRecommendationBySupplement,
  getRecommendationsByTargetArea,
  getTopRecommendations,
  formatMatchScore,
  getScoreColor,
  formatRecommendationExplanation,
} from './recommendationEngine';

// ============================================================================
// STACK STORAGE
// ============================================================================

export {
  getUserStack,
  saveUserStack,
  addSupplementToStack,
  removeSupplementFromStack,
  clearUserStack,
  getDailyTracking,
  getAllTracking,
  toggleSupplementIntake,
  wasSupplementTaken,
  initializeDailyTracking,
  getTodayDateString,
  formatDateDisplay,
  getTargetAreaDisplayName,
} from './stackStorage';

// ============================================================================
// TARGET AREA LABELS (for UI)
// ============================================================================

export const TARGET_AREA_LABELS: Record<string, string> = {
  Leistung_Kraft: 'Kraft & Power',
  Leistung_Ausdauer: 'Ausdauer',
  Muskelaufbau_Protein: 'Muskelaufbau & Protein',
  Regeneration_Entzuendung: 'Regeneration',
  Schlaf_Stress: 'Schlaf & Stress',
  Fokus_Kognition: 'Fokus & Konzentration',
  Gesundheit_Immunsystem: 'Immunsystem & Gesundheit',
  Verdauung_Darm: 'Verdauung & Darmgesundheit',
  Gelenke_Bindegewebe_Haut: 'Gelenke & Bindegewebe',
  Hormon_Zyklus: 'Hormon & Zyklus',
  Basis_Mikros: 'Vitamine & Mineralstoffe',
  Hydration_Elektrolyte: 'Hydration & Elektrolyte',
};

// ============================================================================
// SUBSTANCE CLASS LABELS (for UI)
// ============================================================================

export const SUBSTANCE_CLASS_LABELS: Record<string, string> = {
  Aminosaeure_Derivat: 'Aminosäure-Derivat',
  Protein: 'Protein',
  Kreatin: 'Kreatin',
  Vitamin: 'Vitamin',
  Mineral_Spurenelement: 'Mineral & Spurenelement',
  Fettsaeuren_Oel: 'Fettsäuren & Öle',
  Pflanzenextrakt: 'Pflanzenextrakt',
  Pilz: 'Vitalpilz',
  Probiotikum: 'Probiotikum',
  Elektrolyt_Buffer_Osmolyte: 'Elektrolyt',
  Hormon_Signalstoff: 'Hormon & Signalstoff',
  Sonstiges: 'Sonstiges',
};

// ============================================================================
// CONFIDENCE LEVEL LABELS (for UI)
// ============================================================================

export const CONFIDENCE_LEVEL_LABELS: Record<string, { label: string; color: string }> = {
  low: { label: 'Niedrig', color: '#FF9F0A' },
  medium: { label: 'Mittel', color: '#FFD60A' },
  high: { label: 'Hoch', color: '#34C759' },
};

// ============================================================================
// HELPER FUNCTIONS FOR UI
// ============================================================================

/**
 * Get a human-readable summary of data completeness
 */
export const getDataCompletenessSummary = (completeness: DataCompleteness): string => {
  if (completeness.overall_percentage >= 80) {
    return 'Dein Profil ist sehr vollstaendig. Die Empfehlungen sind zuverlaessig.';
  }
  if (completeness.overall_percentage >= 60) {
    return 'Gute Datenbasis. Einige Angaben koennten die Empfehlungen noch verbessern.';
  }
  if (completeness.overall_percentage >= 40) {
    return 'Basis-Empfehlungen moeglich. Vervollstaendige dein Profil fuer genauere Ergebnisse.';
  }
  return 'Wenig Daten verfuegbar. Die Empfehlungen sind eingeschraenkt.';
};

/**
 * Get color for data completeness percentage
 */
export const getCompletenessColor = (percentage: number): string => {
  if (percentage >= 80) return '#34C759';
  if (percentage >= 60) return '#30D158';
  if (percentage >= 40) return '#FFD60A';
  return '#FF9F0A';
};

/**
 * Format match score with color and label
 */
export const formatMatchScoreWithDetails = (score: number): {
  percentage: number;
  label: string;
  color: string;
  emoji: string;
} => {
  if (score >= 90) {
    return { percentage: score, label: 'Sehr hohe Uebereinstimmung', color: '#34C759', emoji: '🎯' };
  }
  if (score >= 75) {
    return { percentage: score, label: 'Hohe Uebereinstimmung', color: '#30D158', emoji: '✅' };
  }
  if (score >= 60) {
    return { percentage: score, label: 'Gute Uebereinstimmung', color: '#FFD60A', emoji: '👍' };
  }
  return { percentage: score, label: 'Moderate Uebereinstimmung', color: '#FF9F0A', emoji: '🤔' };
};
