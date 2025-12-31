-- Migration: Populate Scoring Fields with Calculated Values
-- Created: 2024-12-29
-- Purpose: Fill in the new scoring fields with actual computed data
--
-- This migration calculates and populates:
-- 1. completion_status (based on presence of template_exercises)
-- 2. estimated_sets_per_week (average sets per muscle group)
-- 3. exercises_per_workout (average exercises per workout)
-- 4. scoring_metadata (pre-computed volume and complexity metrics)

-- ============================================================================
-- STEP 1: Update completion_status
-- ============================================================================

UPDATE plan_templates pt
SET completion_status = (
  CASE
    WHEN EXISTS (
      SELECT 1
      FROM template_workouts tw
      JOIN template_exercises te ON tw.id = te.workout_id
      WHERE tw.template_id = pt.id
    ) THEN 'complete'
    ELSE 'incomplete'
  END
);

-- Verify completion status
DO $$
DECLARE
  complete_count INTEGER;
  incomplete_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO complete_count
  FROM plan_templates WHERE completion_status = 'complete';

  SELECT COUNT(*) INTO incomplete_count
  FROM plan_templates WHERE completion_status = 'incomplete';

  RAISE NOTICE '✅ Completion Status Updated:';
  RAISE NOTICE '   Complete templates: %', complete_count;
  RAISE NOTICE '   Incomplete templates: %', incomplete_count;
END $$;

-- ============================================================================
-- STEP 2: Update estimated_sets_per_week
-- ============================================================================

-- Calculate estimated sets per muscle group per week
-- Formula: (Total Sets / Number of Workouts) * Days per Week / 2
-- The division by 2 accounts for sets being distributed across muscle groups

UPDATE plan_templates pt
SET estimated_sets_per_week = (
  SELECT ROUND(
    COALESCE(
      (SUM(te.sets)::numeric / NULLIF(COUNT(DISTINCT tw.id), 0)) *
      pt.days_per_week / 2.0,
      0
    ),
    0
  )::INTEGER
  FROM template_workouts tw
  LEFT JOIN template_exercises te ON tw.id = te.workout_id
  WHERE tw.template_id = pt.id
);

-- Set to NULL for incomplete templates (no exercises data)
UPDATE plan_templates
SET estimated_sets_per_week = NULL
WHERE completion_status = 'incomplete';

-- ============================================================================
-- STEP 3: Update exercises_per_workout
-- ============================================================================

-- Calculate average number of exercises per workout
UPDATE plan_templates pt
SET exercises_per_workout = (
  SELECT ROUND(
    COALESCE(
      COUNT(te.id)::numeric / NULLIF(COUNT(DISTINCT tw.id), 0),
      0
    ),
    1
  )
  FROM template_workouts tw
  LEFT JOIN template_exercises te ON tw.id = te.workout_id
  WHERE tw.template_id = pt.id
);

-- Set to NULL for incomplete templates
UPDATE plan_templates
SET exercises_per_workout = NULL
WHERE completion_status = 'incomplete';

-- ============================================================================
-- STEP 4: Populate scoring_metadata with detailed metrics
-- ============================================================================

-- Calculate and store detailed volume and complexity metrics
UPDATE plan_templates pt
SET scoring_metadata = (
  SELECT jsonb_build_object(
    'total_exercises', COALESCE(COUNT(DISTINCT te.id), 0),
    'total_sets', COALESCE(SUM(te.sets), 0),
    'avg_sets_per_exercise', ROUND(
      COALESCE(SUM(te.sets)::numeric / NULLIF(COUNT(DISTINCT te.id), 0), 0),
      1
    ),
    'workout_count', COALESCE(COUNT(DISTINCT tw.id), 0),
    'has_supersets', EXISTS(
      SELECT 1 FROM template_exercises te2
      WHERE te2.workout_id = tw.id
      AND te2.superset_with IS NOT NULL
    ),
    'has_optional_exercises', EXISTS(
      SELECT 1 FROM template_exercises te2
      WHERE te2.workout_id = tw.id
      AND te2.is_optional = true
    ),
    'complexity_score', CASE
      WHEN COUNT(DISTINCT tw.id) = 0 THEN 0
      WHEN COUNT(DISTINCT te.id)::numeric / COUNT(DISTINCT tw.id) > 7 THEN 3  -- Advanced: >7 exercises/workout
      WHEN COUNT(DISTINCT te.id)::numeric / COUNT(DISTINCT tw.id) > 5 THEN 2  -- Intermediate: 5-7
      ELSE 1  -- Beginner: <5
    END,
    'last_calculated', NOW()
  )
  FROM template_workouts tw
  LEFT JOIN template_exercises te ON tw.id = te.workout_id
  WHERE tw.template_id = pt.id
)
WHERE completion_status = 'complete';

-- Set minimal metadata for incomplete templates
UPDATE plan_templates
SET scoring_metadata = jsonb_build_object(
  'total_exercises', 0,
  'total_sets', 0,
  'workout_count', 0,
  'complexity_score', 0,
  'last_calculated', NOW(),
  'incomplete', true
)
WHERE completion_status = 'incomplete';

-- ============================================================================
-- VERIFICATION: Show calculated results
-- ============================================================================

DO $$
BEGIN
  RAISE NOTICE '✅ Scoring fields populated successfully!';
  RAISE NOTICE '';
  RAISE NOTICE '==================================================';
  RAISE NOTICE 'VERIFICATION RESULTS';
  RAISE NOTICE '==================================================';
END $$;

-- Display summary statistics
SELECT
  plan_type,
  name_de,
  fitness_level,
  days_per_week,
  primary_goal,
  completion_status,
  estimated_sets_per_week,
  exercises_per_workout,
  scoring_metadata->>'total_exercises' as total_exercises,
  scoring_metadata->>'complexity_score' as complexity
FROM plan_templates
ORDER BY
  completion_status DESC,
  fitness_level,
  days_per_week;

-- ============================================================================
-- PERFORMANCE STATISTICS
-- ============================================================================

-- Show distribution of complete vs incomplete templates by level
SELECT
  fitness_level,
  completion_status,
  COUNT(*) as count,
  ROUND(AVG(estimated_sets_per_week), 1) as avg_weekly_sets,
  ROUND(AVG(exercises_per_workout), 1) as avg_exercises
FROM plan_templates
GROUP BY fitness_level, completion_status
ORDER BY fitness_level, completion_status;

-- Show templates ready for scoring (complete + all fields populated)
SELECT
  COUNT(*) as ready_for_scoring,
  ROUND(AVG(estimated_sets_per_week), 1) as avg_weekly_sets,
  ROUND(AVG(exercises_per_workout), 1) as avg_exercises
FROM plan_templates
WHERE completion_status = 'complete'
  AND estimated_sets_per_week IS NOT NULL
  AND exercises_per_workout IS NOT NULL;

-- ============================================================================
-- DATA QUALITY CHECKS
-- ============================================================================

-- Check for any anomalies
DO $$
DECLARE
  null_count INTEGER;
  zero_count INTEGER;
BEGIN
  -- Check for complete templates with NULL values (should not happen)
  SELECT COUNT(*) INTO null_count
  FROM plan_templates
  WHERE completion_status = 'complete'
    AND (estimated_sets_per_week IS NULL OR exercises_per_workout IS NULL);

  IF null_count > 0 THEN
    RAISE WARNING '⚠️  Found % complete templates with NULL scoring values', null_count;
  END IF;

  -- Check for templates with zero exercises (might indicate data issue)
  SELECT COUNT(*) INTO zero_count
  FROM plan_templates
  WHERE completion_status = 'complete'
    AND (estimated_sets_per_week = 0 OR exercises_per_workout = 0);

  IF zero_count > 0 THEN
    RAISE WARNING '⚠️  Found % complete templates with zero values', zero_count;
  END IF;

  IF null_count = 0 AND zero_count = 0 THEN
    RAISE NOTICE '✅ Data quality check passed!';
  END IF;
END $$;

-- ============================================================================
-- FINAL SUMMARY
-- ============================================================================

DO $$
DECLARE
  total_templates INTEGER;
  complete_templates INTEGER;
  ready_for_scoring INTEGER;
BEGIN
  SELECT COUNT(*) INTO total_templates FROM plan_templates;
  SELECT COUNT(*) INTO complete_templates FROM plan_templates WHERE completion_status = 'complete';
  SELECT COUNT(*) INTO ready_for_scoring FROM plan_templates
    WHERE completion_status = 'complete'
      AND estimated_sets_per_week IS NOT NULL
      AND exercises_per_workout IS NOT NULL;

  RAISE NOTICE '';
  RAISE NOTICE '==================================================';
  RAISE NOTICE 'MIGRATION SUMMARY';
  RAISE NOTICE '==================================================';
  RAISE NOTICE 'Total templates: %', total_templates;
  RAISE NOTICE 'Complete templates: %', complete_templates;
  RAISE NOTICE 'Ready for scoring: %', ready_for_scoring;
  RAISE NOTICE 'Completion rate: %%', ROUND((complete_templates::numeric / total_templates * 100), 1);
  RAISE NOTICE '';
  RAISE NOTICE '✅ Migration completed successfully!';
  RAISE NOTICE '';
END $$;
