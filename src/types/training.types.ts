/**
 * Training Module TypeScript Types
 *
 * Complete type definitions for training plans, workouts, exercises,
 * sessions, and progress tracking.
 */

// ============================================================================
// Core Training Plan Types
// ============================================================================

export interface TrainingPlan {
  id: string;
  user_id: string;
  source_template_id: string;
  name: string;
  plan_type: string;
  days_per_week: number;
  status: "active" | "inactive" | "completed";
  start_date: string;
  created_at: string;
  template?: PlanTemplate;
}

export interface TrainingPlanDetails extends TrainingPlan {
  workouts: PlanWorkout[];
  current_week?: number;
  total_weeks?: number;
}

export interface PlanWorkout {
  id: string;
  plan_id: string;
  name: string;
  name_de: string;
  day_number: number;
  week_number?: number;
  focus?: string;
  estimated_duration?: number;
  exercises: PlanExercise[];
}

export interface PlanExercise {
  id: string;
  workout_id: string;
  exercise_id: string;
  exercise_order: number;
  sets: number;
  reps_min?: number;
  reps_max?: number;
  target_reps?: number;
  target_weight?: number;
  rpe_target?: number;
  rest_seconds?: number;
  is_optional: boolean;
  can_substitute: boolean;
  exercise?: Exercise;
}

// ============================================================================
// Exercise Types
// ============================================================================

export interface Exercise {
  id: string;
  name: string;
  name_de: string;
  equipment: string[];
  movement_pattern: string;
  primary_muscles: string[];
  secondary_muscles: string[];
  difficulty: "beginner" | "intermediate" | "advanced";
  video_url?: string;
  instruction?: string;
  instruction_de?: string;
}

// ============================================================================
// Workout Session Types
// ============================================================================

export interface WorkoutSession {
  id: string;
  user_id: string;
  plan_id: string;
  plan_workout_id: string;
  status: "in_progress" | "completed" | "skipped";
  started_at: string;
  completed_at?: string;
  notes?: string;
  workout?: PlanWorkout;
}

export interface SessionExercise extends PlanExercise {
  completed_sets: WorkoutSet[];
  is_completed: boolean;
}

export interface WorkoutSet {
  id: string;
  session_id: string;
  exercise_id: string;
  set_number: number;
  weight_kg?: number;
  reps: number;
  rpe?: number;
  notes?: string;
  created_at: string;
}

// ============================================================================
// Template Types
// ============================================================================

export interface PlanTemplate {
  id: string;
  name: string;
  name_de: string;
  plan_type: string;
  fitness_level: "beginner" | "intermediate" | "advanced";
  days_per_week: number;
  primary_goal: "strength" | "hypertrophy" | "both";
  description?: string;
  description_de?: string;
  scientific_rationale?: string;
  requirements?: string;
  progression_type?: string;
}

export interface TemplateDetails extends PlanTemplate {
  workouts: TemplateWorkout[];
}

export interface TemplateWorkout {
  id: string;
  template_id: string;
  name: string;
  name_de: string;
  day_number: number;
  week_number?: number;
  focus?: string;
  exercises: TemplateExercise[];
}

export interface TemplateExercise {
  id: string;
  workout_id: string;
  exercise_id: string;
  exercise_order: number;
  sets: number;
  reps_min?: number;
  reps_max?: number;
  rpe_target?: number;
  rest_seconds?: number;
  is_optional: boolean;
  can_substitute: boolean;
  exercise?: Exercise;
}

// ============================================================================
// Dashboard & Stats Types
// ============================================================================

export interface NextWorkout {
  workout: PlanWorkout;
  plan: TrainingPlan;
  scheduled_date?: string;
}

export interface TrainingStats {
  total_workouts: number;
  current_week_workouts: number;
  current_streak: number;
  total_volume_kg: number; // Last 30 days
  favorite_exercise?: Exercise;
}

export interface WorkoutHistoryItem {
  session: WorkoutSession;
  workout: PlanWorkout;
  total_sets: number;
  total_volume_kg: number;
  duration_minutes?: number;
}

export interface ExerciseProgress {
  date: string;
  weight_kg: number;
  reps: number;
  volume: number; // weight * reps * sets
  estimated_1rm?: number;
}

// ============================================================================
// Utility Types
// ============================================================================

export type SubstitutionReason =
  | "equipment_unavailable"
  | "equipment_occupied"
  | "injury_prevention"
  | "user_preference"
  | "other";

export type PlanStatus = "active" | "inactive" | "completed";
export type SessionStatus = "in_progress" | "completed" | "skipped";
export type FitnessLevel = "beginner" | "intermediate" | "advanced";
export type PrimaryGoal = "strength" | "hypertrophy" | "both";
export type Difficulty = "beginner" | "intermediate" | "advanced";
