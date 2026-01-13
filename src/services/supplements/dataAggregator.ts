/**
 * Data Aggregator for Supplement Recommendations
 *
 * Collects and aggregates data from multiple sources:
 * - User profile (profiles table)
 * - Daily check-ins (daily_recovery_log)
 * - Nutrition data (daily_nutrition_cache / daily_nutrition_summary)
 * - Nutrition goals (user_nutrition_goals)
 */

import { supabase } from '../../lib/supabase';
import { Profile } from '../profile.service';
import { RecoveryLogWithScore } from '../recovery.service';
import { localNutritionCache, DailyNutritionData } from '../cache/LocalNutritionCache';
import {
  AggregatedUserData,
  DataCompleteness,
} from './types';

const LOG_PREFIX = '[SupplementDataAggregator]';

// ============================================================================
// DATA FETCHING
// ============================================================================

/**
 * Fetch user profile from Supabase
 */
export const fetchProfile = async (userId: string): Promise<Profile | null> => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select(`
        *,
        user_intolerances (
          id,
          severity,
          intolerance:intolerances_catalog (
            id,
            name,
            category
          )
        )
      `)
      .eq('id', userId)
      .single();

    if (error) {
      console.error(`${LOG_PREFIX} Error fetching profile:`, error);
      return null;
    }

    return data as Profile;
  } catch (error) {
    console.error(`${LOG_PREFIX} Unexpected error fetching profile:`, error);
    return null;
  }
};

/**
 * Fetch recovery history for daily averages
 */
export const fetchRecoveryHistory = async (
  userId: string,
  days: number = 14
): Promise<RecoveryLogWithScore[]> => {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const startDateStr = startDate.toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('daily_recovery_with_score')
      .select('*')
      .eq('user_id', userId)
      .gte('date', startDateStr)
      .order('date', { ascending: false });

    if (error) {
      console.error(`${LOG_PREFIX} Error fetching recovery history:`, error);
      return [];
    }

    return data as RecoveryLogWithScore[];
  } catch (error) {
    console.error(`${LOG_PREFIX} Unexpected error fetching recovery history:`, error);
    return [];
  }
};

/**
 * Fetch nutrition data from local cache or Supabase
 */
export const fetchNutritionHistory = async (
  userId: string,
  days: number = 14
): Promise<DailyNutritionData[]> => {
  try {
    // Try local cache first
    const cachedData = await localNutritionCache.getLastNDays(days);
    if (cachedData.length > 0) {
      console.log(`${LOG_PREFIX} Using cached nutrition data (${cachedData.length} days)`);
      return cachedData;
    }

    // Fallback to Supabase
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const startDateStr = startDate.toISOString().split('T')[0];

    const { data, error } = await supabase
      .from('daily_nutrition_summary')
      .select('*')
      .eq('user_id', userId)
      .gte('summary_date', startDateStr)
      .order('summary_date', { ascending: false });

    if (error) {
      console.error(`${LOG_PREFIX} Error fetching nutrition history:`, error);
      return [];
    }

    // Map Supabase data to local cache format
    return (data || []).map((row: any) => ({
      date: row.summary_date,
      calorie_goal: row.goal_calories || 0,
      calories_consumed: row.total_calories || 0,
      calories_burned: 0,
      net_calories: row.total_calories || 0,
      protein_consumed: row.total_protein || 0,
      protein_goal: row.goal_protein || 0,
      carbs_consumed: row.total_carbs || 0,
      carbs_goal: row.goal_carbs || 0,
      fat_consumed: row.total_fat || 0,
      fat_goal: row.goal_fat || 0,
      fiber_consumed: row.total_fiber || 0,
      sugar_consumed: row.total_sugar || 0,
      sodium_consumed: row.total_sodium || 0,
      water_consumed_ml: 0,
      water_goal_ml: 2000,
      coffee_cups: 0,
      energy_drinks: 0,
      caffeine_mg: 0,
      last_synced: row.updated_at || new Date().toISOString(),
    }));
  } catch (error) {
    console.error(`${LOG_PREFIX} Unexpected error fetching nutrition history:`, error);
    return [];
  }
};

/**
 * Fetch nutrition goals from Supabase
 */
export const fetchNutritionGoals = async (userId: string): Promise<any | null> => {
  try {
    const { data, error } = await supabase
      .from('user_nutrition_goals')
      .select('*')
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') {
      console.error(`${LOG_PREFIX} Error fetching nutrition goals:`, error);
      return null;
    }

    return data;
  } catch (error) {
    console.error(`${LOG_PREFIX} Unexpected error fetching nutrition goals:`, error);
    return null;
  }
};

// ============================================================================
// DATA AGGREGATION
// ============================================================================

/**
 * Calculate averages from recovery history
 */
const calculateRecoveryAverages = (history: RecoveryLogWithScore[]): AggregatedUserData['dailyAverages'] => {
  if (history.length === 0) {
    return {
      sleep_hours: null,
      sleep_quality: null,
      stress_level: null,
      energy_level: null,
      hydration_liters: null,
      data_points: 0,
    };
  }

  let sleepHoursSum = 0, sleepHoursCount = 0;
  let sleepQualitySum = 0, sleepQualityCount = 0;
  let stressSum = 0, stressCount = 0;
  let energySum = 0, energyCount = 0;
  let hydrationSum = 0, hydrationCount = 0;

  history.forEach((log) => {
    if (log.sleep_hours !== null) {
      sleepHoursSum += log.sleep_hours;
      sleepHoursCount++;
    }
    if (log.sleep_quality !== null) {
      sleepQualitySum += log.sleep_quality;
      sleepQualityCount++;
    }
    if (log.stress_level !== null) {
      stressSum += log.stress_level;
      stressCount++;
    }
    if (log.energy_level !== null) {
      energySum += log.energy_level;
      energyCount++;
    }
    if (log.hydration_liters !== null && log.hydration_liters !== undefined) {
      hydrationSum += log.hydration_liters;
      hydrationCount++;
    }
  });

  return {
    sleep_hours: sleepHoursCount > 0 ? Math.round((sleepHoursSum / sleepHoursCount) * 10) / 10 : null,
    sleep_quality: sleepQualityCount > 0 ? Math.round((sleepQualitySum / sleepQualityCount) * 10) / 10 : null,
    stress_level: stressCount > 0 ? Math.round((stressSum / stressCount) * 10) / 10 : null,
    energy_level: energyCount > 0 ? Math.round((energySum / energyCount) * 10) / 10 : null,
    hydration_liters: hydrationCount > 0 ? Math.round((hydrationSum / hydrationCount) * 10) / 10 : null,
    data_points: history.length,
  };
};

/**
 * Calculate averages from nutrition history
 */
const calculateNutritionAverages = (history: DailyNutritionData[]): AggregatedUserData['nutritionAverages'] => {
  if (history.length === 0) {
    return {
      calories_consumed: null,
      protein_consumed: null,
      protein_goal: null,
      carbs_consumed: null,
      fat_consumed: null,
      caffeine_mg: null,
      water_consumed_ml: null,
      data_points: 0,
    };
  }

  let caloriesSum = 0, caloriesCount = 0;
  let proteinSum = 0, proteinCount = 0;
  let proteinGoalSum = 0, proteinGoalCount = 0;
  let carbsSum = 0, carbsCount = 0;
  let fatSum = 0, fatCount = 0;
  let caffeineSum = 0, caffeineCount = 0;
  let waterSum = 0, waterCount = 0;

  history.forEach((day) => {
    if (day.calories_consumed > 0) {
      caloriesSum += day.calories_consumed;
      caloriesCount++;
    }
    if (day.protein_consumed > 0) {
      proteinSum += day.protein_consumed;
      proteinCount++;
    }
    if (day.protein_goal > 0) {
      proteinGoalSum += day.protein_goal;
      proteinGoalCount++;
    }
    if (day.carbs_consumed > 0) {
      carbsSum += day.carbs_consumed;
      carbsCount++;
    }
    if (day.fat_consumed > 0) {
      fatSum += day.fat_consumed;
      fatCount++;
    }
    if (day.caffeine_mg > 0) {
      caffeineSum += day.caffeine_mg;
      caffeineCount++;
    }
    if (day.water_consumed_ml > 0) {
      waterSum += day.water_consumed_ml;
      waterCount++;
    }
  });

  return {
    calories_consumed: caloriesCount > 0 ? Math.round(caloriesSum / caloriesCount) : null,
    protein_consumed: proteinCount > 0 ? Math.round((proteinSum / proteinCount) * 10) / 10 : null,
    protein_goal: proteinGoalCount > 0 ? Math.round((proteinGoalSum / proteinGoalCount) * 10) / 10 : null,
    carbs_consumed: carbsCount > 0 ? Math.round((carbsSum / carbsCount) * 10) / 10 : null,
    fat_consumed: fatCount > 0 ? Math.round((fatSum / fatCount) * 10) / 10 : null,
    caffeine_mg: caffeineCount > 0 ? Math.round(caffeineSum / caffeineCount) : null,
    water_consumed_ml: waterCount > 0 ? Math.round(waterSum / waterCount) : null,
    data_points: history.length,
  };
};

/**
 * Determine calorie status (deficit/maintenance/surplus)
 */
const determineCalorieStatus = (
  nutritionGoals: any,
  profile: Profile | null
): 'deficit' | 'maintenance' | 'surplus' | null => {
  if (!nutritionGoals || !profile) return null;

  // Check if there's a target weight
  const currentWeight = profile.weight;
  const targetWeight = profile.target_weight_kg || nutritionGoals.target_weight_kg;

  if (!currentWeight || !targetWeight) {
    // Check training goal
    const goal = profile.primary_goal || nutritionGoals.training_goal;
    if (goal === 'weight_loss') return 'deficit';
    if (goal === 'hypertrophy' || goal === 'muscle_gain') return 'surplus';
    return 'maintenance';
  }

  const diff = targetWeight - currentWeight;
  if (diff < -1) return 'deficit';
  if (diff > 1) return 'surplus';
  return 'maintenance';
};

/**
 * Extract intolerances from profile with joined data
 */
const extractIntolerances = (profile: any): AggregatedUserData['intolerances'] => {
  if (!profile?.user_intolerances) return [];

  return profile.user_intolerances.map((ui: any) => ({
    name: ui.intolerance?.name?.toLowerCase() || '',
    severity: ui.severity as 'mild' | 'moderate' | 'severe' | 'life_threatening',
  }));
};

/**
 * Main function to aggregate all user data
 */
export const aggregateUserData = async (
  userId: string,
  options: {
    averageDays?: number;
  } = {}
): Promise<AggregatedUserData> => {
  const { averageDays = 14 } = options;

  console.log(`${LOG_PREFIX} Aggregating data for user ${userId} (${averageDays} days averaging)`);

  // Fetch all data in parallel
  const [profile, recoveryHistory, nutritionHistory, nutritionGoals] = await Promise.all([
    fetchProfile(userId),
    fetchRecoveryHistory(userId, averageDays),
    fetchNutritionHistory(userId, averageDays),
    fetchNutritionGoals(userId),
  ]);

  // Calculate averages
  const dailyAverages = calculateRecoveryAverages(recoveryHistory);
  const nutritionAverages = calculateNutritionAverages(nutritionHistory);

  // Build aggregated data
  const aggregatedData: AggregatedUserData = {
    profile: {
      age: profile?.age ?? null,
      weight_kg: profile?.weight ?? null,
      height_cm: profile?.height ?? null,
      gender: profile?.gender ?? null,
      fitness_level: profile?.fitness_level ?? null,
      training_experience_months: profile?.training_experience_months ?? null,
      available_training_days: profile?.available_training_days ?? null,
      primary_goal: profile?.primary_goal ?? null,
      training_goals: profile?.training_goals ?? null,
      cardio_per_week: profile?.cardio_per_week ?? null,
      training_location: profile?.training_location ?? null,
      load_preference: profile?.load_preference ?? null,
      split_preference: profile?.split_preference ?? null,
      sleep_hours_avg: profile?.sleep_hours_avg ?? null,
      stress_level: profile?.stress_level ?? null,
      pal_factor: profile?.pal_factor ?? null,
      target_weight_kg: profile?.target_weight_kg ?? null,
      body_fat_percentage: profile?.body_fat_percentage ?? null,
    },
    supplementProfile: {
      gi_issues: profile?.gi_issues ?? [],
      heavy_sweating: profile?.heavy_sweating ?? null,
      high_salt_intake: profile?.high_salt_intake ?? null,
      sun_exposure_hours: profile?.sun_exposure_hours ?? null,
      joint_issues: profile?.joint_issues ?? [],
      lab_values: profile?.lab_values ?? null,
      supplement_onboarding_completed: profile?.supplement_onboarding_completed ?? false,
    },
    intolerances: extractIntolerances(profile),
    dailyAverages,
    nutritionAverages,
    nutritionGoals: {
      target_calories: nutritionGoals?.target_calories ?? null,
      target_protein_g: nutritionGoals?.target_protein_g ?? null,
      training_goal: nutritionGoals?.training_goal ?? profile?.primary_goal ?? null,
      calorie_status: determineCalorieStatus(nutritionGoals, profile),
    },
    dataFreshness: {
      profile_updated_at: profile?.updated_at ?? null,
      last_checkin_date: recoveryHistory.length > 0 ? recoveryHistory[0].date : null,
      last_nutrition_date: nutritionHistory.length > 0 ? nutritionHistory[0].date : null,
    },
  };

  console.log(`${LOG_PREFIX} Data aggregation complete`, {
    hasProfile: !!profile,
    recoveryDays: recoveryHistory.length,
    nutritionDays: nutritionHistory.length,
    hasNutritionGoals: !!nutritionGoals,
    intolerancesCount: aggregatedData.intolerances.length,
  });

  return aggregatedData;
};

// ============================================================================
// DATA COMPLETENESS ANALYSIS
// ============================================================================

/**
 * Analyze data completeness for recommendation quality
 */
export const analyzeDataCompleteness = (data: AggregatedUserData): DataCompleteness => {
  // Basic profile fields
  const basicProfileFields = ['age', 'weight_kg', 'height_cm', 'gender'];
  const basicProfileFilled = basicProfileFields.filter(
    (f) => data.profile[f as keyof typeof data.profile] !== null
  ).length;

  // Fitness profile fields
  const fitnessProfileFields = [
    'fitness_level', 'training_experience_months', 'available_training_days',
    'primary_goal', 'cardio_per_week', 'load_preference'
  ];
  const fitnessProfileFilled = fitnessProfileFields.filter(
    (f) => data.profile[f as keyof typeof data.profile] !== null
  ).length;

  // Lifestyle fields
  const lifestyleFields = ['sleep_hours_avg', 'stress_level', 'pal_factor'];
  const lifestyleFilled = lifestyleFields.filter(
    (f) => data.profile[f as keyof typeof data.profile] !== null
  ).length;

  // Supplement profile fields
  const supplementFields = ['gi_issues', 'heavy_sweating', 'sun_exposure_hours', 'joint_issues'];
  const supplementFilled = supplementFields.filter((f) => {
    const value = data.supplementProfile[f as keyof typeof data.supplementProfile];
    if (Array.isArray(value)) return true; // Arrays count as filled even if empty
    return value !== null;
  }).length;

  // Daily tracking (need at least 3 days for meaningful averages)
  const dailyTrackingTotal = 5;
  const dailyTrackingFilled = [
    data.dailyAverages.sleep_hours,
    data.dailyAverages.sleep_quality,
    data.dailyAverages.stress_level,
    data.dailyAverages.energy_level,
    data.dailyAverages.hydration_liters,
  ].filter((v) => v !== null).length;
  const hasEnoughDailyData = data.dailyAverages.data_points >= 3;

  // Nutrition tracking
  const nutritionTrackingTotal = 4;
  const nutritionTrackingFilled = [
    data.nutritionAverages.calories_consumed,
    data.nutritionAverages.protein_consumed,
    data.nutritionAverages.caffeine_mg,
    data.nutritionAverages.water_consumed_ml,
  ].filter((v) => v !== null).length;
  const hasEnoughNutritionData = data.nutritionAverages.data_points >= 3;

  // Calculate percentages
  const categories = {
    basic_profile: {
      filled: basicProfileFilled,
      total: basicProfileFields.length,
      percentage: Math.round((basicProfileFilled / basicProfileFields.length) * 100),
    },
    fitness_profile: {
      filled: fitnessProfileFilled,
      total: fitnessProfileFields.length,
      percentage: Math.round((fitnessProfileFilled / fitnessProfileFields.length) * 100),
    },
    lifestyle: {
      filled: lifestyleFilled,
      total: lifestyleFields.length,
      percentage: Math.round((lifestyleFilled / lifestyleFields.length) * 100),
    },
    supplement_profile: {
      filled: supplementFilled,
      total: supplementFields.length,
      percentage: Math.round((supplementFilled / supplementFields.length) * 100),
    },
    daily_tracking: {
      filled: hasEnoughDailyData ? dailyTrackingFilled : 0,
      total: dailyTrackingTotal,
      percentage: hasEnoughDailyData
        ? Math.round((dailyTrackingFilled / dailyTrackingTotal) * 100)
        : 0,
    },
    nutrition_tracking: {
      filled: hasEnoughNutritionData ? nutritionTrackingFilled : 0,
      total: nutritionTrackingTotal,
      percentage: hasEnoughNutritionData
        ? Math.round((nutritionTrackingFilled / nutritionTrackingTotal) * 100)
        : 0,
    },
  };

  // Calculate overall percentage (weighted)
  const weights = {
    basic_profile: 20,
    fitness_profile: 25,
    lifestyle: 15,
    supplement_profile: 15,
    daily_tracking: 15,
    nutrition_tracking: 10,
  };

  const weightedSum = Object.entries(categories).reduce((sum, [key, cat]) => {
    return sum + (cat.percentage * weights[key as keyof typeof weights]) / 100;
  }, 0);
  const totalWeight = Object.values(weights).reduce((a, b) => a + b, 0);
  const overallPercentage = Math.round((weightedSum / totalWeight) * 100);

  // Identify missing data
  const missingCritical: string[] = [];
  const missingOptional: string[] = [];

  // Critical missing data
  if (data.profile.age === null) missingCritical.push('Alter');
  if (data.profile.weight_kg === null) missingCritical.push('Gewicht');
  if (data.profile.gender === null) missingCritical.push('Geschlecht');
  if (data.profile.primary_goal === null) missingCritical.push('Primaeres Trainingsziel');
  if (data.profile.available_training_days === null) missingCritical.push('Trainingstage pro Woche');

  // Optional but recommended
  if (data.profile.fitness_level === null) missingOptional.push('Fitness-Level');
  if (data.profile.load_preference === null) missingOptional.push('Belastungspraeferenz');
  if (data.profile.cardio_per_week === null) missingOptional.push('Cardio-Einheiten pro Woche');
  if (!data.supplementProfile.supplement_onboarding_completed) {
    missingOptional.push('Supplement-Profil (GI, Gelenke, Sonnenexposition)');
  }
  if (!hasEnoughDailyData) {
    missingOptional.push(`Taegliche Check-ins (${data.dailyAverages.data_points}/3 Tage)`);
  }
  if (!hasEnoughNutritionData) {
    missingOptional.push(`Ernaehrungstracking (${data.nutritionAverages.data_points}/3 Tage)`);
  }

  return {
    overall_percentage: overallPercentage,
    categories,
    missing_critical: missingCritical,
    missing_optional: missingOptional,
  };
};

// ============================================================================
// DATA HASH FOR CHANGE DETECTION
// ============================================================================

/**
 * Generate a hash of the aggregated data for change detection
 */
export const generateDataHash = (data: AggregatedUserData): string => {
  // Create a simplified object for hashing
  const hashInput = {
    profile: data.profile,
    supplementProfile: data.supplementProfile,
    intolerances: data.intolerances,
    dailyAverages: data.dailyAverages,
    nutritionAverages: data.nutritionAverages,
    nutritionGoals: data.nutritionGoals,
  };

  // Simple hash using JSON string
  const jsonStr = JSON.stringify(hashInput);

  // Use a simple hash function for React Native compatibility
  let hash = 0;
  for (let i = 0; i < jsonStr.length; i++) {
    const char = jsonStr.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }

  return Math.abs(hash).toString(16);
};
