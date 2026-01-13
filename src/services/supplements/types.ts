/**
 * Supplement Recommendation Types
 *
 * Type definitions for the supplement recommendation engine
 * Based on the Supplement-Empfehlungslogik.md specification
 */

// ============================================================================
// ENUMS & CONSTANTS
// ============================================================================

/**
 * Target areas (Zielbereiche) for supplements
 */
export type TargetArea =
  | 'Leistung_Kraft'
  | 'Leistung_Ausdauer'
  | 'Muskelaufbau_Protein'
  | 'Regeneration_Entzuendung'
  | 'Schlaf_Stress'
  | 'Fokus_Kognition'
  | 'Gesundheit_Immunsystem'
  | 'Verdauung_Darm'
  | 'Gelenke_Bindegewebe_Haut'
  | 'Hormon_Zyklus'
  | 'Basis_Mikros'
  | 'Hydration_Elektrolyte';

/**
 * Substance classes (Stoffklassen) for supplements
 */
export type SubstanceClass =
  | 'Aminosaeure_Derivat'
  | 'Protein'
  | 'Kreatin'
  | 'Vitamin'
  | 'Mineral_Spurenelement'
  | 'Fettsaeuren_Oel'
  | 'Pflanzenextrakt'
  | 'Pilz'
  | 'Probiotikum'
  | 'Elektrolyt_Buffer_Osmolyte'
  | 'Hormon_Signalstoff'
  | 'Sonstiges';

/**
 * Indication basis - how the supplement recommendation is determined
 */
export type IndicationBasis = 'Profil' | 'Ernaehrung_Labor' | 'Kombi';

/**
 * Data source for a specific data point
 */
export type DataSource =
  | 'profile'           // From user profile (onboarding)
  | 'daily_checkin'     // From daily recovery/checkin logs
  | 'nutrition'         // From nutrition tracking
  | 'supplement_profile' // From supplement onboarding
  | 'calculated';       // Calculated/derived value

// ============================================================================
// USER DATA AGGREGATION
// ============================================================================

/**
 * Aggregated user data from all sources for supplement recommendation
 */
export interface AggregatedUserData {
  // Profile data (from profiles table)
  profile: {
    age: number | null;
    weight_kg: number | null;
    height_cm: number | null;
    gender: 'male' | 'female' | 'other' | null;
    fitness_level: 'beginner' | 'intermediate' | 'advanced' | null;
    training_experience_months: number | null;
    available_training_days: number | null;
    primary_goal: 'strength' | 'hypertrophy' | 'endurance' | 'weight_loss' | 'general_fitness' | null;
    training_goals: string[] | null;
    cardio_per_week: number | null;
    training_location: 'gym' | 'home' | 'both' | null;
    load_preference: 'low_impact' | 'normal' | 'high_intensity' | null;
    split_preference: 'full_body' | 'upper_lower' | 'push_pull' | 'no_preference' | null;
    sleep_hours_avg: number | null;
    stress_level: number | null;
    pal_factor: number | null;
    target_weight_kg: number | null;
    body_fat_percentage: number | null;
  };

  // Supplement-specific profile data
  supplementProfile: {
    gi_issues: Array<'bloating' | 'irritable_bowel' | 'diarrhea' | 'constipation'>;
    heavy_sweating: boolean | null;
    high_salt_intake: boolean | null;
    sun_exposure_hours: number | null;
    joint_issues: Array<'knee' | 'tendons' | 'shoulder' | 'back'>;
    lab_values: {
      hemoglobin?: number | null;
      mcv?: number | null;
      vitamin_d?: number | null;
      crp?: number | null;
      alt?: number | null;
      ggt?: number | null;
      estradiol?: number | null;
      testosterone?: number | null;
    } | null;
    supplement_onboarding_completed: boolean;
  };

  // Intolerances
  intolerances: Array<{
    name: string;
    severity: 'mild' | 'moderate' | 'severe' | 'life_threatening';
  }>;

  // Daily check-in averages (from daily_recovery_log)
  dailyAverages: {
    sleep_hours: number | null;
    sleep_quality: number | null;
    stress_level: number | null;
    energy_level: number | null;
    hydration_liters: number | null;
    data_points: number; // How many days of data we have
  };

  // Nutrition averages (from daily_nutrition_cache)
  nutritionAverages: {
    calories_consumed: number | null;
    protein_consumed: number | null;
    protein_goal: number | null;
    carbs_consumed: number | null;
    fat_consumed: number | null;
    caffeine_mg: number | null;
    water_consumed_ml: number | null;
    data_points: number;
  };

  // Nutrition goals
  nutritionGoals: {
    target_calories: number | null;
    target_protein_g: number | null;
    training_goal: string | null;
    calorie_status: 'deficit' | 'maintenance' | 'surplus' | null;
  };

  // Data freshness info
  dataFreshness: {
    profile_updated_at: string | null;
    last_checkin_date: string | null;
    last_nutrition_date: string | null;
  };
}

/**
 * Information about data completeness
 */
export interface DataCompleteness {
  overall_percentage: number;
  categories: {
    basic_profile: { filled: number; total: number; percentage: number };
    fitness_profile: { filled: number; total: number; percentage: number };
    lifestyle: { filled: number; total: number; percentage: number };
    supplement_profile: { filled: number; total: number; percentage: number };
    daily_tracking: { filled: number; total: number; percentage: number };
    nutrition_tracking: { filled: number; total: number; percentage: number };
  };
  missing_critical: string[];
  missing_optional: string[];
}

// ============================================================================
// SUPPLEMENT DEFINITIONS
// ============================================================================

/**
 * Condition for recommending a supplement
 */
export interface RecommendationCondition {
  field: string;                          // Field path in AggregatedUserData
  operator: 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'not_in' | 'contains' | 'not_empty';
  value: any;                             // Expected value
  weight: number;                         // Weight 1-5
  description: string;                    // Human-readable description
  isPositive: boolean;                    // true = recommend, false = avoid
}

/**
 * Additional query that should be asked
 */
export interface AdditionalQuery {
  key: string;                            // Query identifier
  weight: number;                         // Weight 1-5 for this query
  description: string;                    // What this query checks
}

/**
 * Complete supplement definition
 */
export interface SupplementDefinition {
  id: string;                             // Unique identifier (e.g., 'kreatin-monohydrat')
  name: string;                           // Display name
  targetAreas: TargetArea[];              // Target areas this supplement addresses
  substanceClass: SubstanceClass;         // Type of substance
  indicationBasis: IndicationBasis;       // How recommendation is determined

  // Conditions that make this supplement recommendable
  positiveConditions: RecommendationCondition[];

  // Conditions that suggest avoiding this supplement
  negativeConditions: RecommendationCondition[];

  // Additional queries needed for better recommendation
  additionalQueries: AdditionalQuery[];

  // General notes/hints
  notes: string[];

  // Contraindications (intolerances that exclude this supplement)
  contraindications: string[];
}

// ============================================================================
// RECOMMENDATION RESULTS
// ============================================================================

/**
 * Detailed explanation for a recommendation factor
 */
export interface RecommendationFactor {
  condition: string;                      // The condition that was evaluated
  met: boolean;                           // Whether condition was met
  weight: number;                         // Weight of this factor
  contribution: number;                   // Score contribution (can be negative)
  description: string;                    // Human-readable explanation
  dataSource: DataSource;                 // Where this data came from
  dataAvailable: boolean;                 // Whether data was available
}

/**
 * Detailed recommendation for a single supplement
 */
export interface SupplementRecommendation {
  supplement: SupplementDefinition;       // The supplement
  matchScore: number;                     // 0-100 percentage match

  // Breakdown of how score was calculated
  positiveFactors: RecommendationFactor[];
  negativeFactors: RecommendationFactor[];

  // Summary
  primaryReasons: string[];               // Main reasons for recommendation
  cautions: string[];                     // Warnings/cautions

  // Data quality
  dataQuality: {
    available_data_points: number;
    total_possible_points: number;
    confidence_level: 'low' | 'medium' | 'high';
  };

  // Missing data that could improve recommendation
  missingData: string[];
}

/**
 * Complete recommendation result
 */
export interface RecommendationResult {
  userId: string;
  generatedAt: string;                    // ISO timestamp

  // Recommendations sorted by match score
  recommendations: SupplementRecommendation[];

  // Overall data quality assessment
  dataCompleteness: DataCompleteness;

  // Warnings about data quality
  warnings: string[];

  // Suggestions for improving recommendations
  suggestions: string[];

  // Hash for change detection
  dataHash: string;
}

/**
 * Configuration for the recommendation engine
 */
export interface RecommendationConfig {
  minScoreThreshold: number;              // Minimum score to include (default: 70)
  maxRecommendations: number;             // Maximum number of recommendations (default: 20)
  includeNegativeFactors: boolean;        // Include factors that reduce score
  averageDaysForDailyData: number;        // Days to average for daily data (default: 14)
}

// ============================================================================
// EVENTS
// ============================================================================

/**
 * Event emitted when recommendations should be recalculated
 */
export interface RecommendationUpdateEvent {
  source: DataSource;
  field?: string;
  timestamp: string;
}
