/**
 * Nutrition Type Definitions
 *
 * Scientific foundations:
 * - BMR Calculation: Mifflin-St Jeor Equation (DOI: 10.1093/ajcn/51.2.241)
 * - PAL Factors: WHO/FAO/UNU Expert Consultation (ISBN: 92-5-105212-3)
 * - Protein Requirements: International Society of Sports Nutrition (DOI: 10.1186/s12970-017-0177-8)
 * - Macro Distribution: American College of Sports Medicine (DOI: 10.1249/MSS.0000000000000852)
 */

/**
 * Training goal types aligned with evidence-based nutrition recommendations
 */
export type TrainingGoal =
  | 'strength'          // Focus on strength development
  | 'muscle_gain'       // Hypertrophy and muscle mass increase
  | 'weight_loss'       // Fat loss while preserving muscle
  | 'endurance'         // Cardiovascular and endurance performance
  | 'general_fitness';  // Overall health and wellness

/**
 * Biological sex for BMR calculations
 * Note: BMR formulas are based on biological sex, not gender identity
 */
export type Gender = 'male' | 'female';

/**
 * Physical Activity Level (PAL) with detailed metadata
 * Based on WHO/FAO/UNU guidelines for energy requirements
 */
export interface ActivityLevel {
  factor: number;        // PAL multiplier (1.2 - 2.5)
  label: string;         // Human-readable label
  description: string;   // Detailed activity description
}

/**
 * Standard PAL factors based on WHO/FAO/UNU Expert Consultation
 * Reference: Human energy requirements (2001), ISBN: 92-5-105212-3
 */
export const ACTIVITY_LEVELS = {
  SEDENTARY: {
    factor: 1.2,
    label: 'Sedentär',
    description: 'Bürojob, wenig bis keine Bewegung, hauptsächlich sitzende Tätigkeit'
  },
  LIGHTLY_ACTIVE: {
    factor: 1.375,
    label: 'Leicht aktiv',
    description: '1-3 Tage Sport pro Woche, leichte körperliche Aktivität'
  },
  MODERATELY_ACTIVE: {
    factor: 1.55,
    label: 'Moderat aktiv',
    description: '3-5 Tage Sport pro Woche, regelmäßiges Training'
  },
  VERY_ACTIVE: {
    factor: 1.725,
    label: 'Sehr aktiv',
    description: '6-7 Tage Sport pro Woche, intensives Training'
  },
  EXTRA_ACTIVE: {
    factor: 1.9,
    label: 'Extrem aktiv',
    description: '2x täglich Training, körperlich fordernder Beruf oder Leistungssport'
  }
} as const satisfies Record<string, ActivityLevel>;

/**
 * User's comprehensive nutrition profile
 * Contains all necessary data for personalized calorie and macro calculations
 */
export interface UserNutritionProfile {
  weight_kg: number;                    // Current body weight in kilograms
  height_cm: number;                    // Height in centimeters
  age: number;                          // Age in years
  gender: Gender;                       // Biological sex for BMR calculation
  target_weight_kg?: number;            // Optional goal weight
  target_date?: Date;                   // Optional deadline for goal achievement
  pal_factor: number;                   // Physical Activity Level multiplier
  training_goal: TrainingGoal;          // Primary fitness objective
  body_fat_percentage?: number;         // Optional BF% for advanced calculations
}

/**
 * Comprehensive result of calorie and macronutrient calculations
 * Includes base metrics, targets, progression tracking, and evidence-based recommendations
 */
export interface CalorieCalculationResult {
  bmr: number;                          // Basal Metabolic Rate (kcal/day)
  tdee: number;                         // Total Daily Energy Expenditure (kcal/day)
  targetCalories: number;               // Adjusted calories for goal achievement
  calorieAdjustment: number;            // Deficit/surplus amount (kcal/day)

  /**
   * Macronutrient targets based on training goal and scientific evidence
   * Protein: ISSN Position Stand (DOI: 10.1186/s12970-017-0177-8)
   * Carbs/Fat: ACSM Guidelines (DOI: 10.1249/MSS.0000000000000852)
   */
  macros: {
    protein_g: number;                  // Daily protein target (grams)
    protein_per_kg: number;             // Protein per kg body weight
    carbs_g: number;                    // Daily carbohydrate target (grams)
    carbs_percentage: number;           // Percentage of total calories
    fat_g: number;                      // Daily fat target (grams)
    fat_percentage: number;             // Percentage of total calories
  };

  /**
   * Weight change progression and timeline estimates
   */
  progression: {
    expectedWeeklyChange: number;       // Expected kg change per week
    weeksToGoal?: number;               // Estimated weeks to reach target
    estimatedTargetDate?: Date;         // Projected goal achievement date
  };

  warnings: string[];                   // Health and safety warnings
  recommendations: string[];            // Evidence-based optimization tips
  hasConflict: boolean;                 // True if goal conflicts with timeline
  calculationMethod: CalculationMethod; // Detailed calculation transparency
}

/**
 * Detailed breakdown of calculation methodology for transparency and verification
 * Allows users to understand and verify how their targets were determined
 */
export interface CalculationMethod {
  /**
   * BMR formula used
   * Mifflin-St Jeor (DOI: 10.1093/ajcn/51.2.241) - Current gold standard
   * Harris-Benedict (1919) - Alternative, slightly less accurate
   */
  bmrFormula: 'mifflin_st_jeor' | 'harris_benedict';

  /**
   * Human-readable BMR calculation formula
   * Example: "(10 × 70) + (6.25 × 175) - (5 × 30) + 5 = 1650 kcal"
   */
  bmrCalculation: string;

  palFactor: number;                    // Applied PAL multiplier
  palDescription: string;               // Activity level description

  /**
   * Goal-based calorie adjustment details
   */
  goalAdjustment: {
    type: 'deficit' | 'surplus' | 'maintenance';
    amount: number;                     // Adjustment in kcal/day
    reason: string;                     // Explanation for adjustment
  };

  proteinRationale: string;             // Explanation for protein target

  /**
   * Scientific references for all calculations
   */
  sources: {
    formula: string;                    // BMR formula citation (DOI link)
    goalRecommendation: string;         // Goal-specific guidance citation
    proteinRecommendation: string;      // Protein intake citation
  };
}

/**
 * Database schema type for user_nutrition_goals table
 * Represents the persisted nutrition profile in Supabase
 */
export interface UserNutritionGoal {
  id: string;                           // UUID primary key
  user_id: string;                      // Foreign key to auth.users

  // Basic metrics
  weight_kg: number;
  height_cm: number;
  age: number;
  gender: Gender;

  // Goals and targets
  target_weight_kg: number | null;
  target_date: string | null;           // ISO date string
  training_goal: TrainingGoal;

  // Activity and body composition
  pal_factor: number;
  body_fat_percentage: number | null;

  // Calculated targets
  bmr: number | null;
  tdee: number | null;
  target_calories: number | null;
  target_protein_g: number | null;
  target_carbs_g: number | null;
  target_fat_g: number | null;

  // Metadata
  created_at: string;                   // ISO timestamp
  updated_at: string;                   // ISO timestamp
}

/**
 * Insert type for creating new nutrition goals
 * Omits auto-generated fields
 */
export type UserNutritionGoalInsert = Omit<
  UserNutritionGoal,
  'id' | 'created_at' | 'updated_at'
>;

/**
 * Update type for modifying existing nutrition goals
 * All fields optional except user_id
 */
export type UserNutritionGoalUpdate = Partial<
  Omit<UserNutritionGoal, 'id' | 'user_id' | 'created_at' | 'updated_at'>
>;
