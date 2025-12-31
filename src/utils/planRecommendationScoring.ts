/**
 * Plan Recommendation Scoring System
 * 
 * Wissenschaftlich fundiertes Likelihood-Scoring für Trainingsplan-Empfehlungen
 * Basiert auf: Trainingserfahrung, Frequenz, Ziele, Volumen
 * 
 * @author Lifestyle App Team
 * @date 2024-12-29
 */

import type { PlanTemplate } from '@/types/training.types';

// ============================================================================
// Types
// ============================================================================

export interface UserProfile {
  fitness_level: 'beginner' | 'intermediate' | 'advanced';
  training_experience_months: number;
  available_training_days: number;
  primary_goal: 'strength' | 'hypertrophy' | 'both' | 'general_fitness' | 'powerlifting';
}

export interface ScoreBreakdown {
  experienceScore: number;
  frequencyScore: number;
  goalScore: number;
  volumeScore: number;
}

export interface PlanRecommendation {
  template: PlanTemplate;
  totalScore: number;
  breakdown: ScoreBreakdown;
  completeness: 'complete' | 'incomplete';
  recommendation: 'optimal' | 'good' | 'acceptable' | 'fallback';
  reasoning: string[];
  volumeModification?: {
    setsIncrease?: string;
    advancedTechniques?: string[];
  };
}

// ============================================================================
// Constants
// ============================================================================

const WEIGHTS = {
  EXPERIENCE: 0.40,
  FREQUENCY: 0.30,
  GOAL: 0.20,
  VOLUME: 0.10,
} as const;

const COMPLETENESS_BONUS = {
  COMPLETE: 1.0,
  INCOMPLETE: 0.7, // 30% penalty
} as const;

const COMPLETE_PROGRAMS = new Set([
  'starting_strength',
  'stronglifts_5x5',
  'full_body_3x',
  'phul',
  'upper_lower_hypertrophy',
  '531_intermediate',
  'ppl_6x_intermediate',
]);

const GOAL_COMPATIBILITY: Record<string, Record<string, number>> = {
  strength: {
    strength: 100,
    powerlifting: 90,
    both: 80,
    general_fitness: 50,
    hypertrophy: 40,
  },
  hypertrophy: {
    hypertrophy: 100,
    both: 80,
    general_fitness: 60,
    strength: 40,
    powerlifting: 30,
  },
  both: {
    both: 100,
    strength: 80,
    hypertrophy: 80,
    powerlifting: 70,
    general_fitness: 60,
  },
  general_fitness: {
    general_fitness: 100,
    both: 70,
    hypertrophy: 60,
    strength: 50,
    powerlifting: 30,
  },
  powerlifting: {
    powerlifting: 100,
    strength: 90,
    both: 70,
    general_fitness: 40,
    hypertrophy: 30,
  },
};

// ============================================================================
// Scoring Functions
// ============================================================================

/**
 * Calculate experience match score (0-100)
 * 
 * Considers both fitness level and months of experience
 * 
 * @param userLevel - User's fitness level
 * @param userMonths - User's training experience in months
 * @param programLevel - Program's target fitness level
 * @param programMinMonths - Program's minimum required months
 */
export function calculateExperienceMatch(
  userLevel: string,
  userMonths: number,
  programLevel: string,
  programMinMonths: number
): number {
  const levels = ['beginner', 'intermediate', 'advanced'];
  const userIndex = levels.indexOf(userLevel);
  const programIndex = levels.indexOf(programLevel);

  // Exact match
  if (userLevel === programLevel) {
    return 100;
  }

  const levelDiff = Math.abs(userIndex - programIndex);

  // One level apart
  if (levelDiff === 1) {
    if (programIndex > userIndex) {
      // User is below program level (e.g., beginner looking at intermediate)
      // Check if user is close to next level
      if (userLevel === 'beginner' && userMonths >= 10 && programMinMonths <= 12) {
        return 80; // Close to intermediate
      }
      if (userLevel === 'intermediate' && userMonths >= 30 && programMinMonths <= 36) {
        return 80; // Close to advanced
      }
      return 50; // Not quite ready
    } else {
      // User is above program level (e.g., intermediate looking at beginner)
      // Can serve as deload or back-to-basics
      return 60;
    }
  }

  // Two levels apart
  return 20;
}

/**
 * Calculate frequency match score (0-100)
 * 
 * How well does program's training frequency match user's available days?
 * 
 * @param userDays - User's available training days per week
 * @param programDays - Program's required days per week
 */
export function calculateFrequencyMatch(
  userDays: number,
  programDays: number
): number {
  const diff = Math.abs(userDays - programDays);

  if (diff === 0) return 100; // Perfect match
  if (diff === 1) return 80;  // 1 day off
  if (diff === 2) return 60;  // 2 days off
  if (diff === 3) return 40;  // 3 days off
  return 20;                   // 4+ days off
}

/**
 * Calculate goal match score (0-100)
 * 
 * How well does program's goal align with user's goal?
 * Uses compatibility matrix based on scientific evidence
 * 
 * @param userGoal - User's primary training goal
 * @param programGoal - Program's primary focus
 */
export function calculateGoalMatch(
  userGoal: string,
  programGoal: string
): number {
  // Exact match
  if (userGoal === programGoal) {
    return 100;
  }

  // Use compatibility matrix
  return GOAL_COMPATIBILITY[userGoal]?.[programGoal] || 20;
}

/**
 * Calculate volume match score (0-100) - LEGACY VERSION
 *
 * Estimates if program's volume is appropriate for user's experience level
 * Based on scientific evidence: 10-15 sets for beginners, 15-20 for intermediate, 18-25+ for advanced
 *
 * @deprecated Use calculateVolumeMatchOptimized instead for better performance
 * @param userLevel - User's fitness level
 * @param workoutCount - Number of workouts in program
 * @param programDays - Days per week
 */
export function calculateVolumeMatch(
  userLevel: string,
  workoutCount: number,
  programDays: number
): number {
  // Estimate exercises per workout
  // This is a proxy - in production, calculate from actual template_exercises
  const estimatedExercisesPerWorkout = workoutCount > 0 ? Math.ceil(workoutCount / programDays) : 5;

  // Ideal ranges based on experience
  const idealRanges: Record<string, { min: number; max: number }> = {
    beginner: { min: 4, max: 6 },
    intermediate: { min: 5, max: 7 },
    advanced: { min: 6, max: 9 },
  };

  const ideal = idealRanges[userLevel];
  if (!ideal) return 50;

  // Within ideal range
  if (estimatedExercisesPerWorkout >= ideal.min && estimatedExercisesPerWorkout <= ideal.max) {
    return 100;
  }

  // Slightly outside ideal range
  if (estimatedExercisesPerWorkout >= ideal.min - 1 && estimatedExercisesPerWorkout <= ideal.max + 1) {
    return 80;
  }

  // Further outside
  return 60;
}

/**
 * Calculate volume match score (0-100) - OPTIMIZED VERSION
 *
 * Now uses pre-computed values from database instead of estimation
 * This is significantly faster as it avoids runtime calculations
 *
 * @param userLevel - User's fitness level
 * @param template - Plan template with computed fields (exercises_per_workout, estimated_sets_per_week)
 * @returns Volume match score (0-100)
 */
export function calculateVolumeMatchOptimized(
  userLevel: string,
  template: PlanTemplate
): number {
  // Use pre-computed value if available
  const exercisesPerWorkout = template.exercises_per_workout;

  if (!exercisesPerWorkout) {
    // Fallback to old estimation if no pre-computed value
    console.warn('[VolumeScore] No exercises_per_workout found for template:', template.id, '- using safe fallback');
    return 75; // Safe middle ground
  }

  // Ideal ranges based on experience (same as before)
  const idealRanges: Record<string, { min: number; max: number }> = {
    beginner: { min: 4, max: 6 },
    intermediate: { min: 5, max: 7 },
    advanced: { min: 6, max: 9 },
  };

  const ideal = idealRanges[userLevel];
  if (!ideal) return 50;

  // Within ideal range
  if (exercisesPerWorkout >= ideal.min && exercisesPerWorkout <= ideal.max) {
    return 100;
  }

  // Slightly outside ideal range
  if (exercisesPerWorkout >= ideal.min - 1 && exercisesPerWorkout <= ideal.max + 1) {
    return 80;
  }

  // Further outside
  if (exercisesPerWorkout >= ideal.min - 2 && exercisesPerWorkout <= ideal.max + 2) {
    return 60;
  }

  return 40;
}

/**
 * Adjust score based on months of experience
 * 
 * Gives bonus to programs slightly above user's level if they're close to progression
 * 
 * @param baseScore - Initial calculated score
 * @param userMonths - User's training experience in months
 * @param programLevel - Program's target fitness level
 */
export function adjustScoreByMonths(
  baseScore: number,
  userMonths: number,
  programLevel: string
): number {
  // User is close to intermediate level
  if (programLevel === 'intermediate' && userMonths >= 10 && userMonths < 12) {
    return baseScore * 1.1; // 10% bonus
  }

  // User is close to advanced level
  if (programLevel === 'advanced' && userMonths >= 30 && userMonths < 36) {
    return baseScore * 1.1; // 10% bonus
  }

  return baseScore;
}

// ============================================================================
// Main Scoring Function
// ============================================================================

/**
 * Calculate comprehensive recommendation score for a plan template
 *
 * OPTIMIZED VERSION - Uses DB completion_status and pre-computed volume metrics
 *
 * @param user - User profile with experience, goals, and availability
 * @param template - Plan template to score (with exercises_per_workout, completion_status)
 * @returns Complete recommendation with score and reasoning
 */
export function scorePlanTemplate(
  user: UserProfile,
  template: PlanTemplate
): PlanRecommendation {
  // Calculate individual scores
  const experienceScore = calculateExperienceMatch(
    user.fitness_level,
    user.training_experience_months,
    template.fitness_level,
    template.min_training_experience_months || 0
  );

  const frequencyScore = calculateFrequencyMatch(
    user.available_training_days,
    template.days_per_week
  );

  const goalScore = calculateGoalMatch(
    user.primary_goal,
    template.primary_goal || 'general_fitness'
  );

  // Use optimized volume scoring with DB fields
  const volumeScore = calculateVolumeMatchOptimized(
    user.fitness_level,
    template
  );

  // Calculate weighted score
  let weightedScore = (
    experienceScore * WEIGHTS.EXPERIENCE +
    frequencyScore * WEIGHTS.FREQUENCY +
    goalScore * WEIGHTS.GOAL +
    volumeScore * WEIGHTS.VOLUME
  );

  // Adjust based on months
  weightedScore = adjustScoreByMonths(
    weightedScore,
    user.training_experience_months,
    template.fitness_level
  );

  // Apply completeness bonus/penalty
  // Use DB completion_status if available, otherwise fallback to hardcoded list
  const isComplete = template.completion_status === 'complete' ||
    COMPLETE_PROGRAMS.has(template.plan_type);
  const completeness = isComplete ? 'complete' : 'incomplete';
  const completenessBonus = isComplete
    ? COMPLETENESS_BONUS.COMPLETE
    : COMPLETENESS_BONUS.INCOMPLETE;

  const totalScore = Math.min(100, weightedScore * completenessBonus);

  // Generate reasoning
  const reasoning: string[] = [];

  if (experienceScore >= 90) {
    reasoning.push('Perfekt für dein Trainingslevel');
  } else if (experienceScore >= 70) {
    reasoning.push('Gut geeignet für dein Level');
  } else if (experienceScore < 50) {
    if (template.fitness_level === 'advanced' && user.fitness_level === 'intermediate') {
      reasoning.push('Fortgeschrittenes Programm - bereit für die Herausforderung?');
    } else {
      reasoning.push('Nicht optimal für dein aktuelles Level');
    }
  }

  if (frequencyScore === 100) {
    reasoning.push(`Passt perfekt zu deinen ${user.available_training_days} Trainingstagen`);
  } else if (frequencyScore >= 70) {
    reasoning.push(`Kompatibel mit deinen ${user.available_training_days} Trainingstagen`);
  } else {
    reasoning.push(`Erfordert ${template.days_per_week} Trainingstage (du hast ${user.available_training_days})`);
  }

  if (goalScore === 100) {
    reasoning.push('Perfekt für dein Trainingsziel');
  } else if (goalScore >= 70) {
    reasoning.push('Gut geeignet für dein Ziel');
  }

  if (!isComplete) {
    reasoning.push('⚠️ Noch in Entwicklung - bald verfügbar');
  }

  // Determine recommendation category
  let recommendation: 'optimal' | 'good' | 'acceptable' | 'fallback';
  if (totalScore >= 90) {
    recommendation = 'optimal';
  } else if (totalScore >= 75) {
    recommendation = 'good';
  } else if (totalScore >= 60) {
    recommendation = 'acceptable';
  } else {
    recommendation = 'fallback';
  }

  // Add volume modification for advanced users with intermediate programs
  let volumeModification;
  if (
    user.fitness_level === 'advanced' &&
    template.fitness_level === 'intermediate' &&
    totalScore >= 80
  ) {
    volumeModification = {
      setsIncrease: '+20%',
      advancedTechniques: ['Drop Sets', 'Rest-Pause Sets', 'Cluster Sets'],
    };
    reasoning.push('💡 Empfehlung: Erhöhe das Volumen um 20% für optimale Ergebnisse');
  }

  return {
    template,
    totalScore,
    breakdown: {
      experienceScore,
      frequencyScore,
      goalScore,
      volumeScore,
    },
    completeness,
    recommendation,
    reasoning,
    volumeModification,
  };
}

/**
 * Get top N plan recommendations for a user
 * 
 * Scores all available templates and returns the best matches
 * Prioritizes complete programs over incomplete ones
 * 
 * @param user - User profile
 * @param templates - All available plan templates
 * @param limit - Maximum number of recommendations to return (default: 3)
 * @returns Sorted list of recommendations
 */
export function getTopRecommendations(
  user: UserProfile,
  templates: PlanTemplate[],
  limit: number = 3
): PlanRecommendation[] {
  // Score all templates
  const scored = templates.map(template => scorePlanTemplate(user, template));

  // Sort by total score (descending)
  scored.sort((a, b) => b.totalScore - a.totalScore);

  // Separate complete and incomplete
  const complete = scored.filter(r => r.completeness === 'complete');
  const incomplete = scored.filter(r => r.completeness === 'incomplete');

  // Prioritize complete programs
  const top3Complete = complete.slice(0, limit);

  // If fewer than limit complete programs, add best incomplete
  if (top3Complete.length < limit) {
    const remaining = limit - top3Complete.length;
    const topIncomplete = incomplete.slice(0, remaining);
    return [...top3Complete, ...topIncomplete];
  }

  return top3Complete;
}

/**
 * Get the single best recommendation for a user
 * 
 * @param user - User profile
 * @param templates - All available plan templates
 * @returns Best matching recommendation
 */
export function getBestRecommendation(
  user: UserProfile,
  templates: PlanTemplate[]
): PlanRecommendation | null {
  const recommendations = getTopRecommendations(user, templates, 1);
  return recommendations[0] || null;
}

/**
 * Format score breakdown for display
 * 
 * @param breakdown - Score breakdown object
 * @returns Formatted string for UI display
 */
export function formatScoreBreakdown(breakdown: ScoreBreakdown): string {
  return `
Trainingslevel: ${breakdown.experienceScore.toFixed(0)}%
Trainingsfrequenz: ${breakdown.frequencyScore.toFixed(0)}%
Trainingsziel: ${breakdown.goalScore.toFixed(0)}%
Trainingsvolumen: ${breakdown.volumeScore.toFixed(0)}%
  `.trim();
}

/**
 * Get recommendation badge text and color
 * 
 * @param recommendation - Recommendation category
 * @returns Badge text and color for UI
 */
export function getRecommendationBadge(recommendation: string): {
  text: string;
  emoji: string;
  color: string;
} {
  switch (recommendation) {
    case 'optimal':
      return { text: 'OPTIMAL', emoji: '⭐', color: '#4CAF50' };
    case 'good':
      return { text: 'SEHR GUT', emoji: '👍', color: '#2196F3' };
    case 'acceptable':
      return { text: 'AKZEPTABEL', emoji: '✓', color: '#FF9800' };
    case 'fallback':
      return { text: 'FALLBACK', emoji: '⚠️', color: '#F44336' };
    default:
      return { text: 'UNBEKANNT', emoji: '?', color: '#9E9E9E' };
  }
}
