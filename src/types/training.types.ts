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
  status: "active" | "paused" | "completed";
  start_date: string;
  end_date?: string;
  created_at: string;
  fitness_level?: "beginner" | "intermediate" | "advanced";
  primary_goal?: "strength" | "hypertrophy" | "endurance" | "general";
  duration_weeks?: number;
  tm_percentage?: number;
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
  day_number: number;
  week_number?: number;
  order_in_week: number;
  focus?: string;
  estimated_duration?: number;
  exercises: PlanExercise[];
}

export interface SetConfiguration {
  set_number: number;
  percentage_1rm: number;
  reps: number;
  is_amrap?: boolean;
  notes?: string;
}

export interface PlanExercise {
  id: string;
  workout_id: string;
  exercise_id: string;
  order_in_workout: number;
  sets: number;
  reps_min?: number;
  reps_max?: number;
  reps_target?: number;
  rir_target?: number;
  percentage_1rm?: number;
  rest_seconds?: number;
  notes?: string;
  superset_with?: string;
  set_configurations?: SetConfiguration[] | null;
  exercise?: Exercise;
}

// ============================================================================
// Exercise Types
// ============================================================================

export interface Exercise {
  id: string;
  name: string;
  name_de: string;
  equipment_required: string[];
  movement_pattern: string;
  primary_muscles: string[];
  secondary_muscles: string[];
  difficulty: "beginner" | "intermediate" | "advanced";
  video_url?: string;
  instruction?: string;
  instruction_de?: string;
  is_active?: boolean;
}

// ============================================================================
// Workout Session Types
// ============================================================================

export interface WorkoutSession {
  id: string;
  user_id: string;
  plan_id: string;
  plan_workout_id: string;
  status: "in_progress" | "completed" | "skipped" | "paused";
  date: string;
  start_time?: string;
  end_time?: string;
  duration_minutes?: number;
  energy_level?: number;
  sleep_quality?: number;
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
  weight?: number;
  reps: number;
  rir?: number;
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
  requires_equipment?: string[];
  progression_type?: string;
  min_training_experience_months?: number;
  // Scoring System Fields (added 2024-12-29)
  estimated_sets_per_week?: number;
  exercises_per_workout?: number;
  completion_status?: "complete" | "incomplete";
  scoring_metadata?: ScoringMetadata;
  // Dynamic Plan Fields (added 2024-12-30)
  is_dynamic?: boolean;
  requires_1rm_for_exercises?: string[];
  tm_percentage?: number;
}

/**
 * Metadata for the plan scoring system
 * Contains pre-computed metrics for faster plan recommendations
 */
export interface ScoringMetadata {
  total_exercises?: number;
  total_sets?: number;
  avg_sets_per_exercise?: number;
  workout_count?: number;
  has_supersets?: boolean;
  has_optional_exercises?: boolean;
  complexity_score?: number; // 1=beginner, 2=intermediate, 3=advanced
  last_calculated?: string;
  incomplete?: boolean;
  [key: string]: any; // Allow additional metadata fields
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
  order_in_week: number;
  focus?: string;
  exercises: TemplateExercise[];
}

export interface TemplateExercise {
  id: string;
  workout_id: string;
  exercise_id: string;
  order_in_workout: number;
  sets: number;
  reps_min?: number;
  reps_max?: number;
  reps_target?: number;
  rir_target?: number;
  percentage_1rm?: number;
  rest_seconds?: number;
  notes?: string;
  notes_de?: string;
  superset_with?: string;
  is_optional: boolean;
  can_substitute: boolean;
  set_configurations?: SetConfiguration[] | null;
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
  weight: number;
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
export type SessionStatus = "in_progress" | "completed" | "skipped" | "paused";
export type FitnessLevel = "beginner" | "intermediate" | "advanced";
export type PrimaryGoal = "strength" | "hypertrophy" | "both";
export type Difficulty = "beginner" | "intermediate" | "advanced";
