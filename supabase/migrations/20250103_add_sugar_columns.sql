-- Add sugar column to user_food_diary table
ALTER TABLE user_food_diary 
ADD COLUMN IF NOT EXISTS sugar numeric;

COMMENT ON COLUMN user_food_diary.sugar IS 'Sugar content in grams for this diary entry';

-- Add total_sugar column to daily_nutrition_summary table
ALTER TABLE daily_nutrition_summary 
ADD COLUMN IF NOT EXISTS total_sugar numeric DEFAULT 0;

COMMENT ON COLUMN daily_nutrition_summary.total_sugar IS 'Total sugar consumed in grams for the day';
