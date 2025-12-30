-- Verification Queries for Scoring System Schema Changes
-- Created: 2024-12-29
-- Purpose: Test and verify the new scoring fields are working correctly

-- ============================================================================
-- QUERY 1: Overview of All Templates with Scoring Data
-- ============================================================================

SELECT
  pt.id,
  pt.plan_type,
  pt.name_de,
  pt.fitness_level,
  pt.days_per_week,
  pt.primary_goal,
  pt.completion_status,
  pt.estimated_sets_per_week,
  pt.exercises_per_workout,
  pt.scoring_metadata->>'total_exercises' as total_exercises,
  pt.scoring_metadata->>'complexity_score' as complexity
FROM plan_templates pt
ORDER BY
  pt.completion_status DESC,
  pt.fitness_level,
  pt.days_per_week;

-- ============================================================================
-- QUERY 2: Complete Templates Statistics
-- ============================================================================

SELECT
  COUNT(*) as total_complete,
  ROUND(AVG(estimated_sets_per_week), 1) as avg_weekly_sets,
  ROUND(MIN(estimated_sets_per_week), 1) as min_weekly_sets,
  ROUND(MAX(estimated_sets_per_week), 1) as max_weekly_sets,
  ROUND(AVG(exercises_per_workout), 1) as avg_exercises_per_workout,
  ROUND(MIN(exercises_per_workout), 1) as min_exercises,
  ROUND(MAX(exercises_per_workout), 1) as max_exercises
FROM plan_templates
WHERE completion_status = 'complete';

-- ============================================================================
-- QUERY 3: Templates by Fitness Level and Completion
-- ============================================================================

SELECT
  fitness_level,
  completion_status,
  COUNT(*) as count,
  ROUND(AVG(estimated_sets_per_week), 1) as avg_weekly_sets,
  ROUND(AVG(exercises_per_workout), 1) as avg_exercises,
  STRING_AGG(name_de, ', ' ORDER BY days_per_week) as templates
FROM plan_templates
GROUP BY fitness_level, completion_status
ORDER BY fitness_level, completion_status DESC;

-- ============================================================================
-- QUERY 4: Index Performance Check
-- ============================================================================

-- Show all indexes on plan_templates
SELECT
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'plan_templates'
  AND indexname LIKE 'idx_%'
ORDER BY indexname;

-- ============================================================================
-- QUERY 5: Test Scoring Query Performance (BEFORE optimization)
-- ============================================================================

-- This query simulates the scoring system query
-- Run with EXPLAIN ANALYZE to see performance

EXPLAIN ANALYZE
SELECT
  pt.id,
  pt.name_de,
  pt.fitness_level,
  pt.days_per_week,
  pt.primary_goal,
  pt.completion_status,
  pt.estimated_sets_per_week,
  pt.exercises_per_workout,
  pt.scoring_metadata
FROM plan_templates pt
WHERE pt.completion_status = 'complete'
  AND pt.fitness_level IN ('beginner', 'intermediate')
  AND pt.days_per_week BETWEEN 3 AND 5
  AND pt.primary_goal IN ('strength', 'both')
ORDER BY pt.days_per_week, pt.fitness_level;

-- ============================================================================
-- QUERY 6: Detailed Template Breakdown (for specific template analysis)
-- ============================================================================

-- Replace '<template_id>' with actual template ID to analyze
SELECT
  pt.name_de,
  pt.fitness_level,
  pt.days_per_week,
  pt.primary_goal,
  pt.completion_status,
  pt.estimated_sets_per_week,
  pt.exercises_per_workout,
  COUNT(DISTINCT tw.id) as workout_count,
  COUNT(te.id) as total_exercises,
  SUM(te.sets) as total_sets,
  ROUND(AVG(te.sets), 1) as avg_sets_per_exercise,
  -- Verify scoring_metadata matches actual data
  pt.scoring_metadata->>'total_exercises' as metadata_total_exercises,
  pt.scoring_metadata->>'total_sets' as metadata_total_sets,
  pt.scoring_metadata->>'workout_count' as metadata_workout_count
FROM plan_templates pt
LEFT JOIN template_workouts tw ON tw.template_id = pt.id
LEFT JOIN template_exercises te ON te.workout_id = tw.id
-- WHERE pt.id = '<template_id>'  -- Uncomment and replace with actual ID
GROUP BY pt.id, pt.name_de, pt.fitness_level, pt.days_per_week,
         pt.primary_goal, pt.completion_status, pt.estimated_sets_per_week,
         pt.exercises_per_workout, pt.scoring_metadata;

-- ============================================================================
-- QUERY 7: Data Quality Checks
-- ============================================================================

-- Check for complete templates with missing scoring data
SELECT
  'Missing estimated_sets_per_week' as issue,
  COUNT(*) as count
FROM plan_templates
WHERE completion_status = 'complete'
  AND estimated_sets_per_week IS NULL

UNION ALL

SELECT
  'Missing exercises_per_workout' as issue,
  COUNT(*) as count
FROM plan_templates
WHERE completion_status = 'complete'
  AND exercises_per_workout IS NULL

UNION ALL

SELECT
  'Zero exercises_per_workout' as issue,
  COUNT(*) as count
FROM plan_templates
WHERE completion_status = 'complete'
  AND exercises_per_workout = 0

UNION ALL

SELECT
  'Zero estimated_sets_per_week' as issue,
  COUNT(*) as count
FROM plan_templates
WHERE completion_status = 'complete'
  AND estimated_sets_per_week = 0;

-- ============================================================================
-- QUERY 8: Templates Ready for Scoring System
-- ============================================================================

-- These templates have all required data for the scoring system
SELECT
  pt.fitness_level,
  pt.days_per_week,
  pt.primary_goal,
  pt.name_de,
  pt.estimated_sets_per_week,
  pt.exercises_per_workout,
  pt.scoring_metadata->>'complexity_score' as complexity
FROM plan_templates pt
WHERE pt.completion_status = 'complete'
  AND pt.estimated_sets_per_week IS NOT NULL
  AND pt.exercises_per_workout IS NOT NULL
  AND pt.scoring_metadata IS NOT NULL
ORDER BY
  pt.fitness_level,
  pt.days_per_week,
  pt.primary_goal;

-- ============================================================================
-- QUERY 9: Volume Distribution Analysis
-- ============================================================================

-- Analyze volume distribution across different template types
SELECT
  fitness_level,
  primary_goal,
  days_per_week,
  COUNT(*) as template_count,
  ROUND(AVG(estimated_sets_per_week), 1) as avg_sets,
  ROUND(MIN(estimated_sets_per_week), 1) as min_sets,
  ROUND(MAX(estimated_sets_per_week), 1) as max_sets,
  ROUND(AVG(exercises_per_workout), 1) as avg_exercises
FROM plan_templates
WHERE completion_status = 'complete'
GROUP BY fitness_level, primary_goal, days_per_week
ORDER BY fitness_level, days_per_week, primary_goal;

-- ============================================================================
-- QUERY 10: Test Specific Scoring Scenario
-- ============================================================================

-- Simulate scoring for a specific user profile
-- Example: Intermediate user, 4 days/week, hypertrophy goal

WITH user_profile AS (
  SELECT
    'intermediate'::text as user_level,
    4 as user_days,
    'hypertrophy'::text as user_goal
)
SELECT
  pt.name_de,
  pt.fitness_level,
  pt.days_per_week,
  pt.primary_goal,
  pt.estimated_sets_per_week,
  pt.exercises_per_workout,
  -- Simple scoring simulation
  CASE
    WHEN pt.fitness_level = (SELECT user_level FROM user_profile) THEN 100
    ELSE 50
  END as experience_match,
  CASE
    WHEN pt.days_per_week = (SELECT user_days FROM user_profile) THEN 100
    WHEN ABS(pt.days_per_week - (SELECT user_days FROM user_profile)) = 1 THEN 80
    WHEN ABS(pt.days_per_week - (SELECT user_days FROM user_profile)) = 2 THEN 60
    ELSE 40
  END as frequency_match,
  CASE
    WHEN pt.primary_goal = (SELECT user_goal FROM user_profile) THEN 100
    WHEN pt.primary_goal = 'both' THEN 80
    ELSE 50
  END as goal_match,
  -- Calculate simple total score
  (
    (CASE WHEN pt.fitness_level = (SELECT user_level FROM user_profile) THEN 100 ELSE 50 END * 0.4) +
    (CASE
      WHEN pt.days_per_week = (SELECT user_days FROM user_profile) THEN 100
      WHEN ABS(pt.days_per_week - (SELECT user_days FROM user_profile)) = 1 THEN 80
      ELSE 60
    END * 0.3) +
    (CASE
      WHEN pt.primary_goal = (SELECT user_goal FROM user_profile) THEN 100
      WHEN pt.primary_goal = 'both' THEN 80
      ELSE 50
    END * 0.3)
  )::INTEGER as total_score
FROM plan_templates pt
WHERE pt.completion_status = 'complete'
ORDER BY total_score DESC
LIMIT 5;

-- ============================================================================
-- QUERY 11: Performance Comparison (Run with EXPLAIN ANALYZE)
-- ============================================================================

-- Query WITHOUT indexes (simulate before migration)
-- This would be slow without the new indexes
EXPLAIN ANALYZE
SELECT pt.*
FROM plan_templates pt
WHERE pt.fitness_level = 'intermediate'
  AND pt.days_per_week = 4
  AND pt.primary_goal IN ('hypertrophy', 'both');

-- ============================================================================
-- QUERY 12: Scoring Metadata JSON Queries
-- ============================================================================

-- Test JSONB querying capabilities
SELECT
  name_de,
  fitness_level,
  scoring_metadata->>'complexity_score' as complexity,
  scoring_metadata->>'has_supersets' as has_supersets,
  scoring_metadata->>'total_exercises' as total_exercises,
  scoring_metadata->'last_calculated' as last_calc
FROM plan_templates
WHERE completion_status = 'complete'
  AND (scoring_metadata->>'complexity_score')::int >= 2
ORDER BY (scoring_metadata->>'complexity_score')::int DESC;

-- ============================================================================
-- SUMMARY STATISTICS
-- ============================================================================

SELECT
  '=== SCORING SYSTEM READINESS ===' as report;

SELECT
  'Total Templates' as metric,
  COUNT(*)::text as value
FROM plan_templates

UNION ALL

SELECT
  'Complete Templates' as metric,
  COUNT(*)::text as value
FROM plan_templates
WHERE completion_status = 'complete'

UNION ALL

SELECT
  'Ready for Scoring' as metric,
  COUNT(*)::text as value
FROM plan_templates
WHERE completion_status = 'complete'
  AND estimated_sets_per_week IS NOT NULL
  AND exercises_per_workout IS NOT NULL

UNION ALL

SELECT
  'Avg Sets/Week (Complete)' as metric,
  ROUND(AVG(estimated_sets_per_week), 1)::text as value
FROM plan_templates
WHERE completion_status = 'complete'

UNION ALL

SELECT
  'Avg Exercises/Workout (Complete)' as metric,
  ROUND(AVG(exercises_per_workout), 1)::text as value
FROM plan_templates
WHERE completion_status = 'complete';
