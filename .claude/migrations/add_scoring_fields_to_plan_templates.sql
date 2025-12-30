-- Migration: Add Scoring-Related Fields to plan_templates
-- Created: 2024-12-29
-- Purpose: Optimize Plan Recommendation Scoring System
--
-- This migration adds pre-computed fields to improve query performance
-- and enable the likelihood-based scoring system for plan recommendations.

-- Add new columns to plan_templates table
ALTER TABLE plan_templates
ADD COLUMN IF NOT EXISTS estimated_sets_per_week INTEGER,
ADD COLUMN IF NOT EXISTS exercises_per_workout NUMERIC(3,1),
ADD COLUMN IF NOT EXISTS completion_status TEXT
  CHECK (completion_status IN ('complete', 'incomplete')),
ADD COLUMN IF NOT EXISTS scoring_metadata JSONB DEFAULT '{}'::jsonb;

-- Add column comments for documentation
COMMENT ON COLUMN plan_templates.estimated_sets_per_week IS
  'Geschätzte Anzahl an Sets pro Muskelgruppe pro Woche - wichtig für Volume Scoring. Berechnet aus template_exercises.';

COMMENT ON COLUMN plan_templates.exercises_per_workout IS
  'Durchschnittliche Anzahl an Übungen pro Workout. Wird verwendet für Volumen-Matching im Scoring-System.';

COMMENT ON COLUMN plan_templates.completion_status IS
  'Ob das Template vollständig konfiguriert ist (mit template_exercises). Values: complete, incomplete';

COMMENT ON COLUMN plan_templates.scoring_metadata IS
  'Zusätzliche Metadaten für das Scoring-System (z.B. pre-computed compatibility scores, volume breakdown per muscle group)';

-- Create indexes for performance optimization
-- These indexes will significantly speed up plan recommendation queries

-- Index for fitness level filtering (used in experience matching)
CREATE INDEX IF NOT EXISTS idx_plan_templates_fitness_level
  ON plan_templates(fitness_level);

COMMENT ON INDEX idx_plan_templates_fitness_level IS
  'Optimiert Queries die nach fitness_level filtern (beginner/intermediate/advanced)';

-- Index for days per week filtering (used in frequency matching)
CREATE INDEX IF NOT EXISTS idx_plan_templates_days_per_week
  ON plan_templates(days_per_week);

COMMENT ON INDEX idx_plan_templates_days_per_week IS
  'Optimiert Queries die nach Trainingstagen pro Woche filtern';

-- Index for primary goal filtering (used in goal matching)
CREATE INDEX IF NOT EXISTS idx_plan_templates_primary_goal
  ON plan_templates(primary_goal);

COMMENT ON INDEX idx_plan_templates_primary_goal IS
  'Optimiert Queries die nach Trainingsziel filtern (strength/hypertrophy/both)';

-- Partial index for complete templates only (most common query pattern)
CREATE INDEX IF NOT EXISTS idx_plan_templates_completion
  ON plan_templates(completion_status)
  WHERE completion_status = 'complete';

COMMENT ON INDEX idx_plan_templates_completion IS
  'Partial Index: Nur vollständige Templates. Optimiert Queries die unvollständige Templates ausschließen.';

-- Composite index for common scoring query pattern
CREATE INDEX IF NOT EXISTS idx_plan_templates_scoring_composite
  ON plan_templates(fitness_level, days_per_week, primary_goal)
  WHERE completion_status = 'complete';

COMMENT ON INDEX idx_plan_templates_scoring_composite IS
  'Composite Index: Optimiert multi-criteria Scoring-Queries (Level + Tage + Ziel)';

-- Speed up joins with template_workouts
CREATE INDEX IF NOT EXISTS idx_template_workouts_template_id
  ON template_workouts(template_id)
  WHERE template_id IS NOT NULL;

COMMENT ON INDEX idx_template_workouts_template_id IS
  'Optimiert JOIN zwischen plan_templates und template_workouts';

-- Speed up joins with template_exercises
CREATE INDEX IF NOT EXISTS idx_template_exercises_workout_id
  ON template_exercises(workout_id)
  WHERE workout_id IS NOT NULL;

COMMENT ON INDEX idx_template_exercises_workout_id IS
  'Optimiert JOIN zwischen template_workouts und template_exercises';

-- GIN index for JSONB scoring_metadata (for future advanced queries)
CREATE INDEX IF NOT EXISTS idx_plan_templates_scoring_metadata_gin
  ON plan_templates USING gin(scoring_metadata);

COMMENT ON INDEX idx_plan_templates_scoring_metadata_gin IS
  'GIN Index für JSONB: Ermöglicht effiziente Queries auf scoring_metadata Inhalte';

-- Verify the migration
DO $$
BEGIN
  RAISE NOTICE '✅ Migration completed successfully!';
  RAISE NOTICE 'Added columns: estimated_sets_per_week, exercises_per_workout, completion_status, scoring_metadata';
  RAISE NOTICE 'Created % indexes', (
    SELECT COUNT(*)
    FROM pg_indexes
    WHERE tablename IN ('plan_templates', 'template_workouts', 'template_exercises')
    AND indexname LIKE 'idx_%'
  );
END $$;
