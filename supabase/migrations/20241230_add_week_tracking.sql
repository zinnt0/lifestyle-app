-- Migration: Add week tracking to training plans
-- Created: 2024-12-30
-- Purpose: Track current week and total weeks for training plans

-- 1. Add current_week and total_weeks columns if they don't exist
DO $$
BEGIN
  -- Add current_week column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'training_plans' AND column_name = 'current_week'
  ) THEN
    ALTER TABLE training_plans ADD COLUMN current_week INTEGER DEFAULT 1;
    COMMENT ON COLUMN training_plans.current_week IS 'Current week of the training plan (calculated based on start_date)';
  END IF;

  -- Add total_weeks column
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'training_plans' AND column_name = 'total_weeks'
  ) THEN
    ALTER TABLE training_plans ADD COLUMN total_weeks INTEGER;
    COMMENT ON COLUMN training_plans.total_weeks IS 'Total duration of the plan in weeks (NULL = unlimited)';
  END IF;
END $$;

-- 2. Create function to calculate current week based on start_date
CREATE OR REPLACE FUNCTION calculate_current_week(p_plan_id UUID)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_start_date DATE;
  v_total_weeks INTEGER;
  v_current_week INTEGER;
  v_weeks_elapsed INTEGER;
BEGIN
  -- Get plan details
  SELECT start_date::DATE, total_weeks
  INTO v_start_date, v_total_weeks
  FROM training_plans
  WHERE id = p_plan_id;

  -- If no start_date, return 1
  IF v_start_date IS NULL THEN
    RETURN 1;
  END IF;

  -- Calculate weeks elapsed since start (1-indexed)
  v_weeks_elapsed := FLOOR(EXTRACT(EPOCH FROM (CURRENT_DATE::timestamp - v_start_date::timestamp)) / (7 * 86400)) + 1;

  -- Ensure minimum week is 1
  v_current_week := GREATEST(1, v_weeks_elapsed);

  -- If total_weeks is set, cap at total_weeks
  IF v_total_weeks IS NOT NULL THEN
    v_current_week := LEAST(v_current_week, v_total_weeks);
  END IF;

  RETURN v_current_week;
END;
$$;

COMMENT ON FUNCTION calculate_current_week(UUID) IS 'Calculates the current week number for a training plan based on its start_date';

-- 3. Create function to update current_week for a plan
CREATE OR REPLACE FUNCTION update_plan_current_week(p_plan_id UUID)
RETURNS VOID
LANGUAGE plpgsql
AS $$
DECLARE
  v_new_week INTEGER;
BEGIN
  v_new_week := calculate_current_week(p_plan_id);

  UPDATE training_plans
  SET current_week = v_new_week
  WHERE id = p_plan_id;
END;
$$;

COMMENT ON FUNCTION update_plan_current_week(UUID) IS 'Updates the current_week field for a training plan';

-- 4. Create function to update all active plans (can be called via cron)
CREATE OR REPLACE FUNCTION update_all_active_plans_weeks()
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_updated_count INTEGER := 0;
  v_plan RECORD;
BEGIN
  FOR v_plan IN
    SELECT id FROM training_plans WHERE status = 'active'
  LOOP
    PERFORM update_plan_current_week(v_plan.id);
    v_updated_count := v_updated_count + 1;
  END LOOP;

  RETURN v_updated_count;
END;
$$;

COMMENT ON FUNCTION update_all_active_plans_weeks() IS 'Updates current_week for all active training plans. Returns count of updated plans.';

-- 5. Update existing plans to have correct current_week values
DO $$
DECLARE
  v_plan RECORD;
BEGIN
  FOR v_plan IN
    SELECT id FROM training_plans WHERE start_date IS NOT NULL
  LOOP
    PERFORM update_plan_current_week(v_plan.id);
  END LOOP;
END $$;
