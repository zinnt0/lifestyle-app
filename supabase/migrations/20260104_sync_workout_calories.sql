-- Sync workout calories to daily nutrition summary
-- This migration creates a trigger that automatically updates calories_burned
-- in daily_nutrition_summary when workout_sessions are completed

-- Create or replace function to sync workout calories
CREATE OR REPLACE FUNCTION sync_workout_calories_to_nutrition_summary()
RETURNS TRIGGER AS $$
BEGIN
  -- Only sync for completed workouts with calories
  IF NEW.status = 'completed' AND NEW.total_calories_burned IS NOT NULL THEN
    -- Calculate total calories burned for this day from all workouts
    -- Insert or update daily_nutrition_summary
    INSERT INTO daily_nutrition_summary (
      user_id,
      summary_date,
      calories_burned,
      total_calories,
      total_protein,
      total_carbs,
      total_fat,
      total_fiber,
      water_ml
    )
    VALUES (
      NEW.user_id,
      NEW.date,
      (
        SELECT COALESCE(SUM(total_calories_burned), 0)
        FROM workout_sessions
        WHERE user_id = NEW.user_id 
          AND date = NEW.date
          AND status = 'completed'
          AND total_calories_burned IS NOT NULL
      ),
      0, 0, 0, 0, 0, 0
    )
    ON CONFLICT (user_id, summary_date) 
    DO UPDATE SET
      calories_burned = (
        SELECT COALESCE(SUM(total_calories_burned), 0)
        FROM workout_sessions
        WHERE user_id = NEW.user_id 
          AND date = NEW.date
          AND status = 'completed'
          AND total_calories_burned IS NOT NULL
      ),
      last_updated = NOW();
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger on workout_sessions
DROP TRIGGER IF EXISTS trigger_sync_workout_calories ON workout_sessions;

CREATE TRIGGER trigger_sync_workout_calories
  AFTER INSERT OR UPDATE OF total_calories_burned, status ON workout_sessions
  FOR EACH ROW
  EXECUTE FUNCTION sync_workout_calories_to_nutrition_summary();

-- Backfill existing data - sync all completed workouts to nutrition summary
INSERT INTO daily_nutrition_summary (
  user_id,
  summary_date,
  calories_burned,
  total_calories,
  total_protein,
  total_carbs,
  total_fat,
  total_fiber,
  water_ml
)
SELECT 
  user_id,
  date as summary_date,
  SUM(total_calories_burned) as calories_burned,
  0, 0, 0, 0, 0, 0
FROM workout_sessions
WHERE status = 'completed' 
  AND total_calories_burned IS NOT NULL
GROUP BY user_id, date
ON CONFLICT (user_id, summary_date) 
DO UPDATE SET
  calories_burned = EXCLUDED.calories_burned,
  last_updated = NOW();

COMMENT ON FUNCTION sync_workout_calories_to_nutrition_summary IS 
  'Automatically syncs workout calories to daily_nutrition_summary when workouts are completed';
