-- ============================================================================
-- Plan Recommendation Scoring System - SQL Queries
-- ============================================================================
-- Diese Queries helfen bei der Analyse und Optimierung des Scoring-Systems
-- 
-- @author Lifestyle App Team
-- @date 2024-12-29
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Vollständige Übersicht aller Plan Templates mit Completion Status
-- ----------------------------------------------------------------------------
SELECT 
  pt.plan_type,
  pt.name,
  pt.name_de,
  pt.fitness_level,
  pt.days_per_week,
  pt.primary_goal,
  pt.min_training_experience_months,
  pt.duration_weeks,
  COUNT(DISTINCT tw.id) as workout_count,
  COUNT(DISTINCT te.id) as exercise_count,
  COUNT(DISTINCT te.exercise_id) as unique_exercises,
  CASE 
    WHEN COUNT(DISTINCT te.id) > 0 THEN 'complete'
    ELSE 'incomplete'
  END as completion_status,
  CASE 
    WHEN COUNT(DISTINCT te.id) > 0 THEN 1.0
    ELSE 0.7
  END as completeness_multiplier
FROM plan_templates pt
LEFT JOIN template_workouts tw ON pt.id = tw.template_id
LEFT JOIN template_exercises te ON tw.id = te.workout_id
GROUP BY 
  pt.id, 
  pt.plan_type, 
  pt.name, 
  pt.name_de,
  pt.fitness_level, 
  pt.days_per_week, 
  pt.primary_goal,
  pt.min_training_experience_months,
  pt.duration_weeks
ORDER BY 
  CASE pt.fitness_level 
    WHEN 'beginner' THEN 1 
    WHEN 'intermediate' THEN 2 
    WHEN 'advanced' THEN 3 
  END,
  pt.days_per_week,
  pt.plan_type;

-- ----------------------------------------------------------------------------
-- 2. Geschätzte Sets pro Woche für jedes Template
-- ----------------------------------------------------------------------------
-- Diese Query berechnet das durchschnittliche Volumen pro Muskelgruppe
SELECT 
  pt.plan_type,
  pt.name_de,
  pt.fitness_level,
  pt.days_per_week,
  COUNT(DISTINCT tw.id) as total_workouts,
  COUNT(DISTINCT te.id) as total_exercises,
  ROUND(AVG(te.sets), 1) as avg_sets_per_exercise,
  ROUND(COUNT(DISTINCT te.id)::numeric / NULLIF(COUNT(DISTINCT tw.id), 0), 1) as exercises_per_workout,
  -- Geschätzte Sets pro Woche (vereinfachte Berechnung)
  ROUND(
    (COUNT(DISTINCT te.id)::numeric / NULLIF(COUNT(DISTINCT tw.id), 0)) * 
    AVG(te.sets) * 
    pt.days_per_week / 2.0, -- Dividiert durch 2, weil jede Muskelgruppe ~2x/Woche trainiert wird
    0
  ) as estimated_sets_per_muscle_per_week
FROM plan_templates pt
LEFT JOIN template_workouts tw ON pt.id = tw.template_id
LEFT JOIN template_exercises te ON tw.id = te.workout_id
WHERE pt.plan_type IN (
  'starting_strength',
  'stronglifts_5x5',
  'full_body_3x',
  'phul',
  'upper_lower_hypertrophy',
  '531_intermediate',
  'ppl_6x_intermediate'
)
GROUP BY 
  pt.id,
  pt.plan_type,
  pt.name_de,
  pt.fitness_level,
  pt.days_per_week
ORDER BY pt.days_per_week, pt.plan_type;

-- ----------------------------------------------------------------------------
-- 3. Analyse: Welche Programme fehlen für welche Kombinationen?
-- ----------------------------------------------------------------------------
-- Diese Query zeigt Lücken in der Plan-Abdeckung
WITH complete_programs AS (
  SELECT 
    pt.fitness_level,
    pt.days_per_week,
    pt.primary_goal,
    COUNT(*) as complete_count
  FROM plan_templates pt
  LEFT JOIN template_workouts tw ON pt.id = tw.template_id
  LEFT JOIN template_exercises te ON tw.id = te.workout_id
  WHERE te.id IS NOT NULL
  GROUP BY pt.fitness_level, pt.days_per_week, pt.primary_goal
),
all_combinations AS (
  SELECT 
    level,
    days,
    goal
  FROM (
    SELECT unnest(ARRAY['beginner', 'intermediate', 'advanced']) as level
  ) l
  CROSS JOIN (
    SELECT unnest(ARRAY[2, 3, 4, 5, 6]) as days
  ) d
  CROSS JOIN (
    SELECT unnest(ARRAY['strength', 'hypertrophy', 'both', 'general_fitness', 'powerlifting']) as goal
  ) g
)
SELECT 
  ac.level,
  ac.days,
  ac.goal,
  COALESCE(cp.complete_count, 0) as available_complete_programs,
  CASE 
    WHEN COALESCE(cp.complete_count, 0) = 0 THEN '❌ MISSING'
    WHEN COALESCE(cp.complete_count, 0) = 1 THEN '✅ AVAILABLE'
    ELSE '✅✅ MULTIPLE OPTIONS'
  END as status
FROM all_combinations ac
LEFT JOIN complete_programs cp 
  ON ac.level = cp.fitness_level 
  AND ac.days = cp.days_per_week 
  AND ac.goal = cp.primary_goal
ORDER BY 
  CASE ac.level 
    WHEN 'beginner' THEN 1 
    WHEN 'intermediate' THEN 2 
    WHEN 'advanced' THEN 3 
  END,
  ac.days,
  ac.goal;

-- ----------------------------------------------------------------------------
-- 4. User Profile Simulation für Testing
-- ----------------------------------------------------------------------------
-- Simuliert verschiedene User-Profile und zeigt, welche Pläne passen würden

-- User 1: Anfänger, 3 Tage, Kraft
WITH user_profile AS (
  SELECT 
    'beginner'::text as fitness_level,
    8 as experience_months,
    3 as available_days,
    'strength'::text as primary_goal
)
SELECT 
  pt.plan_type,
  pt.name_de,
  pt.fitness_level,
  pt.days_per_week,
  pt.primary_goal,
  -- Experience Match (vereinfacht)
  CASE 
    WHEN pt.fitness_level = (SELECT fitness_level FROM user_profile) THEN 100
    ELSE 50
  END as experience_match,
  -- Frequency Match
  CASE 
    WHEN pt.days_per_week = (SELECT available_days FROM user_profile) THEN 100
    WHEN ABS(pt.days_per_week - (SELECT available_days FROM user_profile)) = 1 THEN 80
    WHEN ABS(pt.days_per_week - (SELECT available_days FROM user_profile)) = 2 THEN 60
    ELSE 40
  END as frequency_match,
  -- Goal Match (vereinfacht)
  CASE 
    WHEN pt.primary_goal = (SELECT primary_goal FROM user_profile) THEN 100
    WHEN pt.primary_goal = 'both' AND (SELECT primary_goal FROM user_profile) IN ('strength', 'hypertrophy') THEN 80
    WHEN (SELECT primary_goal FROM user_profile) = 'both' AND pt.primary_goal IN ('strength', 'hypertrophy') THEN 80
    ELSE 50
  END as goal_match,
  -- Completion
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM template_workouts tw
      JOIN template_exercises te ON tw.id = te.workout_id
      WHERE tw.template_id = pt.id
    ) THEN 'complete'
    ELSE 'incomplete'
  END as completion_status
FROM plan_templates pt
ORDER BY 
  -- Einfaches Scoring (würde in TypeScript komplexer sein)
  (
    CASE WHEN pt.fitness_level = (SELECT fitness_level FROM user_profile) THEN 100 ELSE 50 END * 0.4 +
    CASE 
      WHEN pt.days_per_week = (SELECT available_days FROM user_profile) THEN 100
      WHEN ABS(pt.days_per_week - (SELECT available_days FROM user_profile)) = 1 THEN 80
      ELSE 60
    END * 0.3 +
    CASE WHEN pt.primary_goal = (SELECT primary_goal FROM user_profile) THEN 100 ELSE 50 END * 0.2 +
    80 * 0.1 -- Volume score placeholder
  ) * 
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM template_workouts tw
      JOIN template_exercises te ON tw.id = te.workout_id
      WHERE tw.template_id = pt.id
    ) THEN 1.0
    ELSE 0.7
  END DESC
LIMIT 5;

-- ----------------------------------------------------------------------------
-- 5. Migration: Add Scoring-Related Fields to plan_templates
-- ----------------------------------------------------------------------------
-- Diese Migration fügt hilfreiche Felder für das Scoring-System hinzu

/*
-- Uncomment to execute:

ALTER TABLE plan_templates 
ADD COLUMN IF NOT EXISTS estimated_sets_per_week INTEGER,
ADD COLUMN IF NOT EXISTS exercises_per_workout NUMERIC(3,1),
ADD COLUMN IF NOT EXISTS completion_status TEXT CHECK (completion_status IN ('complete', 'incomplete')),
ADD COLUMN IF NOT EXISTS scoring_metadata JSONB DEFAULT '{}'::jsonb;

COMMENT ON COLUMN plan_templates.estimated_sets_per_week IS 
  'Geschätzte Anzahl an Sets pro Muskelgruppe pro Woche';
  
COMMENT ON COLUMN plan_templates.exercises_per_workout IS 
  'Durchschnittliche Anzahl an Übungen pro Workout';
  
COMMENT ON COLUMN plan_templates.completion_status IS 
  'Ob das Template vollständig konfiguriert ist (mit template_exercises)';
  
COMMENT ON COLUMN plan_templates.scoring_metadata IS 
  'Zusätzliche Metadaten für das Scoring-System (z.B. pre-computed scores)';
*/

-- ----------------------------------------------------------------------------
-- 6. Update Completion Status (Run after migration)
-- ----------------------------------------------------------------------------
/*
-- Uncomment to execute:

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

UPDATE plan_templates pt
SET 
  estimated_sets_per_week = (
    SELECT ROUND(
      (COUNT(DISTINCT te.id)::numeric / NULLIF(COUNT(DISTINCT tw.id), 0)) * 
      AVG(te.sets) * 
      pt.days_per_week / 2.0,
      0
    )
    FROM template_workouts tw
    LEFT JOIN template_exercises te ON tw.id = te.workout_id
    WHERE tw.template_id = pt.id
  ),
  exercises_per_workout = (
    SELECT ROUND(
      COUNT(DISTINCT te.id)::numeric / NULLIF(COUNT(DISTINCT tw.id), 0),
      1
    )
    FROM template_workouts tw
    LEFT JOIN template_exercises te ON tw.id = te.workout_id
    WHERE tw.template_id = pt.id
  );
*/

-- ----------------------------------------------------------------------------
-- 7. Performance: Add Indexes for Scoring Queries
-- ----------------------------------------------------------------------------
/*
-- Uncomment to execute:

CREATE INDEX IF NOT EXISTS idx_plan_templates_fitness_level 
  ON plan_templates(fitness_level);
  
CREATE INDEX IF NOT EXISTS idx_plan_templates_days_per_week 
  ON plan_templates(days_per_week);
  
CREATE INDEX IF NOT EXISTS idx_plan_templates_primary_goal 
  ON plan_templates(primary_goal);
  
CREATE INDEX IF NOT EXISTS idx_plan_templates_completion 
  ON plan_templates(completion_status) 
  WHERE completion_status = 'complete';

CREATE INDEX IF NOT EXISTS idx_template_workouts_template_id 
  ON template_workouts(template_id);
  
CREATE INDEX IF NOT EXISTS idx_template_exercises_workout_id 
  ON template_exercises(workout_id);
*/

-- ----------------------------------------------------------------------------
-- 8. Testing Query: Simulate Different User Profiles
-- ----------------------------------------------------------------------------

-- Test Case 1: Anfänger mit Kraft-Fokus
SELECT 'TEST 1: Anfänger, 3 Tage, Kraft' as test_case;
-- (Use User Profile Simulation query above with these values)

-- Test Case 2: Intermediär mit Hypertrophie-Fokus
SELECT 'TEST 2: Intermediär, 4 Tage, Hypertrophie' as test_case;
-- Change user_profile CTE to: intermediate, 18 months, 4 days, hypertrophy

-- Test Case 3: Fortgeschrittener mit wenigen vollständigen Optionen
SELECT 'TEST 3: Advanced, 5 Tage, Kraft' as test_case;
-- Change user_profile CTE to: advanced, 48 months, 5 days, strength

-- ----------------------------------------------------------------------------
-- 9. Reporting: Plan Coverage by Fitness Level and Days
-- ----------------------------------------------------------------------------
SELECT 
  pt.fitness_level,
  pt.days_per_week,
  COUNT(*) as total_plans,
  COUNT(*) FILTER (
    WHERE EXISTS (
      SELECT 1 
      FROM template_workouts tw
      JOIN template_exercises te ON tw.id = te.workout_id
      WHERE tw.template_id = pt.id
    )
  ) as complete_plans,
  ROUND(
    100.0 * COUNT(*) FILTER (
      WHERE EXISTS (
        SELECT 1 
        FROM template_workouts tw
        JOIN template_exercises te ON tw.id = te.workout_id
        WHERE tw.template_id = pt.id
      )
    ) / COUNT(*),
    1
  ) as completion_percentage
FROM plan_templates pt
GROUP BY pt.fitness_level, pt.days_per_week
ORDER BY 
  CASE pt.fitness_level 
    WHEN 'beginner' THEN 1 
    WHEN 'intermediate' THEN 2 
    WHEN 'advanced' THEN 3 
  END,
  pt.days_per_week;

-- ----------------------------------------------------------------------------
-- 10. Quality Check: Plans with Incomplete Data
-- ----------------------------------------------------------------------------
SELECT 
  pt.plan_type,
  pt.name_de,
  pt.fitness_level,
  CASE WHEN pt.name_de IS NULL THEN '❌' ELSE '✅' END as has_german_name,
  CASE WHEN pt.description_de IS NULL THEN '❌' ELSE '✅' END as has_german_description,
  CASE WHEN pt.scientific_rationale IS NULL THEN '❌' ELSE '✅' END as has_rationale,
  CASE 
    WHEN EXISTS (
      SELECT 1 
      FROM template_workouts tw
      WHERE tw.template_id = pt.id
    ) THEN '✅'
    ELSE '❌'
  END as has_workouts,
  CASE 
    WHEN EXISTS (
      SELECT 1 
      FROM template_workouts tw
      JOIN template_exercises te ON tw.id = te.workout_id
      WHERE tw.template_id = pt.id
    ) THEN '✅'
    ELSE '❌'
  END as has_exercises
FROM plan_templates pt
ORDER BY 
  CASE pt.fitness_level 
    WHEN 'beginner' THEN 1 
    WHEN 'intermediate' THEN 2 
    WHEN 'advanced' THEN 3 
  END,
  pt.days_per_week;
