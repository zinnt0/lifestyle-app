-- Migration: Add weight_kg column to workout_sets
-- Created: 2024-12-29
-- Purpose: Fix missing weight_kg column error

-- Add weight_kg column if it doesn't exist
ALTER TABLE workout_sets
ADD COLUMN IF NOT EXISTS weight_kg DECIMAL(5,2);

-- Add comment for documentation
COMMENT ON COLUMN workout_sets.weight_kg IS 'Weight in kilograms for this set';

-- Verify the column exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM information_schema.columns
    WHERE table_name = 'workout_sets'
    AND column_name = 'weight_kg'
  ) THEN
    RAISE EXCEPTION 'Column weight_kg was not added successfully';
  END IF;
END $$;
