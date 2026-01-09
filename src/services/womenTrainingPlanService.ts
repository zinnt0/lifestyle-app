/**
 * Women's Training Plan Recommendation Service
 *
 * Implements the decision tree logic for recommending training plans
 * specifically designed for women based on their onboarding data.
 */

import { supabase } from '@/lib/supabase';

// ===========================
// Types and Interfaces
// ===========================

export interface WomenOnboardingData {
  // Trainingsziele (Mehrfachauswahl möglich)
  training_goals: string[]; // z.B. ['kraft', 'bodyforming', 'fettabbau']

  // Trainingserfahrung in Monaten
  training_experience_months: number;

  // Verfügbare Trainingstage pro Woche
  available_training_days: number;

  // Gewünschte Cardio-Einheiten pro Woche
  cardio_per_week: number;

  // Trainingsort
  training_location: 'gym' | 'home' | 'both';

  // Verfügbares Equipment (mehrere möglich)
  equipment: string[];

  // Präferenz für Belastungsart
  load_preference?: 'low_impact' | 'normal' | 'high_intensity';

  // Bevorzugter Split (optional)
  split_preference?: 'full_body' | 'upper_lower' | 'push_pull' | 'no_preference';

  // Fitness Level
  fitness_level: 'beginner' | 'intermediate' | 'advanced';
}

export interface ScoredPlan {
  plan: any; // Training Plan from database
  score: number;
  matchDetails: {
    goalsMatch: number;
    levelMatch: number;
    frequencyMatch: number;
    cardioMatch: number;
    equipmentMatch: number;
    otherMatch: number;
  };
}

// ===========================
// Scoring Weights
// ===========================

const WEIGHTS = {
  GOALS: 0.30,      // 30% - Trainingsziele sind am wichtigsten
  LEVEL: 0.25,      // 25% - Erfahrungslevel ist sehr wichtig
  FREQUENCY: 0.20,  // 20% - Trainingsfrequenz
  EQUIPMENT: 0.15,  // 15% - Equipment-Verfügbarkeit
  CARDIO: 0.05,     // 5% - Cardio-Präferenz
  OTHER: 0.05,      // 5% - Sonstige (Belastung, Split)
};

// ===========================
// Goal Mapping
// ===========================

/**
 * Maps related goals to each other for more flexible matching
 */
const GOAL_MAPPING: { [key: string]: string[] } = {
  kraft: ['kraft', 'bodyforming', 'strength'],
  bodyforming: ['bodyforming', 'kraft', 'hypertrophie', 'toning'],
  hypertrophie: ['hypertrophie', 'bodyforming', 'muscle_gain'],
  fettabbau: ['fettabbau', 'abnehmen', 'weight_loss'],
  abnehmen: ['abnehmen', 'fettabbau', 'weight_loss'],
  weight_loss: ['weight_loss', 'fettabbau', 'abnehmen'],
  general_fitness: ['general_fitness', 'toning', 'endurance'],
  endurance: ['endurance', 'general_fitness'],
  toning: ['toning', 'bodyforming', 'general_fitness'],
};

// ===========================
// Scoring Functions
// ===========================

/**
 * Calculate how well the plan's goals match the user's goals
 */
function calculateGoalsMatch(userGoals: string[], planGoals: string[]): number {
  // If user has no goals set, give neutral score instead of 0
  // This prevents filtering out all plans when goals are missing
  if (!userGoals || userGoals.length === 0) {
    return 50; // Neutral score - doesn't help or hurt
  }

  if (!planGoals || planGoals.length === 0) {
    return 50; // Neutral score if plan has no goals
  }

  let matchCount = 0;
  let totalPossibleMatches = userGoals.length;

  for (const userGoal of userGoals) {
    const mappedGoals = GOAL_MAPPING[userGoal.toLowerCase()] || [userGoal.toLowerCase()];

    for (const planGoal of planGoals) {
      if (mappedGoals.includes(planGoal.toLowerCase())) {
        matchCount++;
        break; // Count each user goal only once
      }
    }
  }

  return (matchCount / totalPossibleMatches) * 100;
}

/**
 * Calculate how well the plan's level matches the user's experience
 */
function calculateLevelMatch(
  userLevel: 'beginner' | 'intermediate' | 'advanced',
  planLevel: 'beginner' | 'intermediate' | 'advanced',
  userExperienceMonths: number,
  planMinMonths?: number,
  planMaxMonths?: number
): number {
  // Check if user's experience falls within plan's range
  if (planMinMonths !== undefined && planMinMonths !== null) {
    if (userExperienceMonths < planMinMonths) {
      return 20; // Too advanced
    }
  }

  if (planMaxMonths !== undefined && planMaxMonths !== null) {
    if (userExperienceMonths > planMaxMonths) {
      return 60; // Plan might be too easy, but still okay
    }
  }

  // Perfect match
  if (userLevel === planLevel) {
    return 100;
  }

  // One level apart
  const levels = ['beginner', 'intermediate', 'advanced'];
  const userIndex = levels.indexOf(userLevel);
  const planIndex = levels.indexOf(planLevel);
  const diff = Math.abs(userIndex - planIndex);

  if (diff === 1) {
    return 60; // Close enough
  }

  // Two levels apart
  return 20;
}

/**
 * Calculate how well the plan's frequency matches the user's availability
 */
function calculateFrequencyMatch(
  userTrainingDays: number,
  userCardioDays: number,
  planTrainingDays: number,
  planCardioDays: number
): number {
  const totalUserDays = userTrainingDays;
  const totalPlanDays = planTrainingDays + (planCardioDays || 0);

  // Plan requires more days than user has available
  if (totalPlanDays > totalUserDays) {
    return Math.max(0, 100 - (totalPlanDays - totalUserDays) * 20);
  }

  // Plan requires fewer days (good - user has flexibility)
  if (totalPlanDays < totalUserDays) {
    return 90;
  }

  // Perfect match
  return 100;
}

/**
 * Calculate how well the plan's cardio requirement matches user's preference
 */
function calculateCardioMatch(userCardioDays: number, planCardioDays: number): number {
  const diff = Math.abs(userCardioDays - (planCardioDays || 0));

  if (diff === 0) {
    return 100; // Perfect match
  }

  if (diff === 1) {
    return 80; // Close
  }

  if (diff === 2) {
    return 60; // Acceptable
  }

  return Math.max(0, 60 - diff * 10); // Further apart
}

/**
 * Calculate how well the plan's equipment matches user's available equipment
 */
function calculateEquipmentMatch(userEquipment: string[], planEquipment: string[]): number {
  if (!planEquipment || planEquipment.length === 0) {
    return 100; // No specific equipment required
  }

  let matchCount = 0;

  for (const required of planEquipment) {
    if (userEquipment.includes(required)) {
      matchCount++;
    }
  }

  const matchPercentage = matchCount / planEquipment.length;

  if (matchPercentage === 1.0) {
    return 100; // All equipment available
  }

  if (matchPercentage >= 0.8) {
    return 80; // Most equipment available
  }

  if (matchPercentage >= 0.5) {
    return 50; // Some equipment available
  }

  return 20; // Limited equipment
}

/**
 * Calculate other factors (load preference, split preference)
 */
function calculateOtherMatch(
  userLoadPreference: string | undefined,
  planLoadPreference: string | undefined,
  userSplitPreference: string | undefined,
  planSplit: string | undefined
): number {
  let score = 50; // Base score

  // Load preference match
  if (userLoadPreference && planLoadPreference) {
    if (userLoadPreference === planLoadPreference) {
      score += 25;
    } else {
      score += 10; // Some mismatch
    }
  } else {
    score += 15; // Neutral if not specified
  }

  // Split preference match
  if (userSplitPreference && userSplitPreference !== 'keine_praeferenz' && planSplit) {
    if (userSplitPreference === planSplit) {
      score += 25;
    } else {
      score += 5; // Mismatch
    }
  } else {
    score += 10; // Neutral
  }

  return Math.min(100, score);
}

// ===========================
// Main Scoring Function
// ===========================

/**
 * Score a training plan based on user's onboarding data
 */
export function scorePlan(userData: WomenOnboardingData, plan: any): ScoredPlan {
  const goalsMatch = calculateGoalsMatch(userData.training_goals, plan.training_goals || []);

  const levelMatch = calculateLevelMatch(
    userData.fitness_level,
    plan.fitness_level,
    userData.training_experience_months,
    plan.training_experience_min_months,
    plan.training_experience_max_months
  );

  const frequencyMatch = calculateFrequencyMatch(
    userData.available_training_days,
    userData.cardio_per_week,
    plan.days_per_week || 0,
    plan.cardio_sessions_per_week || 0
  );

  const cardioMatch = calculateCardioMatch(
    userData.cardio_per_week,
    plan.cardio_sessions_per_week || 0
  );

  const equipmentMatch = calculateEquipmentMatch(
    userData.equipment,
    plan.required_equipment || []
  );

  const otherMatch = calculateOtherMatch(
    userData.load_preference,
    plan.load_preference,
    userData.split_preference,
    plan.training_split
  );

  // Calculate weighted total score
  const totalScore =
    goalsMatch * WEIGHTS.GOALS +
    levelMatch * WEIGHTS.LEVEL +
    frequencyMatch * WEIGHTS.FREQUENCY +
    cardioMatch * WEIGHTS.CARDIO +
    equipmentMatch * WEIGHTS.EQUIPMENT +
    otherMatch * WEIGHTS.OTHER;

  return {
    plan,
    score: Math.round(totalScore),
    matchDetails: {
      goalsMatch: Math.round(goalsMatch),
      levelMatch: Math.round(levelMatch),
      frequencyMatch: Math.round(frequencyMatch),
      cardioMatch: Math.round(cardioMatch),
      equipmentMatch: Math.round(equipmentMatch),
      otherMatch: Math.round(otherMatch),
    },
  };
}

// ===========================
// Plan Recommendation Functions
// ===========================

/**
 * Get all women's training plan templates from database
 * Only returns templates that have workouts configured
 */
export async function getWomenTrainingPlanTemplates(): Promise<any[]> {
  try {
    const { data, error } = await supabase
      .from('training_plans')
      .select(`
        *,
        workouts:plan_workouts(id)
      `)
      .eq('target_gender', 'female')
      .eq('is_template', true)
      .eq('status', 'template');

    if (error) {
      console.error('Error fetching women training plans:', error);
      throw error;
    }

    // Filter out templates without workouts (incomplete templates)
    const templatesWithWorkouts = (data || []).filter(
      (plan: any) => plan.workouts && plan.workouts.length > 0
    );

    console.log(`[WomenPlans] Found ${data?.length || 0} templates, ${templatesWithWorkouts.length} have workouts configured`);

    return templatesWithWorkouts;
  } catch (error) {
    console.error('Error in getWomenTrainingPlanTemplates:', error);
    throw error;
  }
}

/**
 * Get recommended training plans for a woman based on onboarding data
 * @param userData - User's onboarding data
 * @param limit - Maximum number of plans to return (default: 3, use 999 for all)
 */
export async function getTopWomenPlanRecommendations(
  userData: WomenOnboardingData,
  limit: number = 3
): Promise<ScoredPlan[]> {
  try {
    const templates = await getWomenTrainingPlanTemplates();

    console.log('[WomenPlans] Templates fetched:', templates.length);
    console.log('[WomenPlans] User data:', JSON.stringify(userData, null, 2));

    if (templates.length === 0) {
      console.warn('No women training plan templates found');
      return [];
    }

    // Score all plans
    const scoredPlans = templates.map((plan) => scorePlan(userData, plan));

    console.log('[WomenPlans] Scored plans:', scoredPlans.map(p => ({
      name: p.plan.name,
      score: p.score,
      details: p.matchDetails
    })));

    // Sort by score (descending)
    scoredPlans.sort((a, b) => b.score - a.score);

    // Return requested number of plans
    return scoredPlans.slice(0, limit);
  } catch (error) {
    console.error('Error in getTopWomenPlanRecommendations:', error);
    throw error;
  }
}

/**
 * Get the single best recommended training plan for a woman
 */
export async function getBestWomenPlanRecommendation(
  userData: WomenOnboardingData
): Promise<ScoredPlan | null> {
  try {
    const topPlans = await getTopWomenPlanRecommendations(userData);
    return topPlans.length > 0 ? topPlans[0] : null;
  } catch (error) {
    console.error('Error in getBestWomenPlanRecommendation:', error);
    throw error;
  }
}

/**
 * Helper function to convert OnboardingData to WomenOnboardingData
 */
export function convertOnboardingDataToWomenData(onboardingData: any): WomenOnboardingData {
  // Derive equipment list from has_gym_access and home_equipment
  let equipment: string[] = [];

  if (onboardingData.has_gym_access) {
    equipment = ['freie_gewichte', 'maschinen', 'langhantel', 'kurzhanteln', 'kabelzug', 'laufband'];
  } else {
    equipment = onboardingData.home_equipment || ['koerpergewicht'];
  }

  // Derive training location
  const training_location = onboardingData.has_gym_access ? 'gym' : 'home';

  return {
    training_goals: onboardingData.training_goals || [onboardingData.primary_goal],
    training_experience_months: onboardingData.training_experience_months || 0,
    available_training_days: onboardingData.available_training_days || 3,
    cardio_per_week: onboardingData.cardio_per_week || 0,
    training_location,
    equipment,
    load_preference: onboardingData.load_preference || 'normal',
    split_preference: onboardingData.split_preference || 'no_preference',
    fitness_level: onboardingData.fitness_level || 'beginner',
  };
}
