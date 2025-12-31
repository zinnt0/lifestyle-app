-- Migration: Add preferred_training_days to profiles
-- Created: 2024-12-30
-- Purpose: Allow users to specify which days of the week they prefer to train

-- Add preferred_training_days column to profiles table
ALTER TABLE profiles
ADD COLUMN preferred_training_days INTEGER[] DEFAULT NULL;

-- Add comment to explain the column
COMMENT ON COLUMN profiles.preferred_training_days IS
'Array of preferred training days where 0=Sunday, 1=Monday, 2=Tuesday, 3=Wednesday, 4=Thursday, 5=Friday, 6=Saturday.
Example: [1,3,5] for Monday, Wednesday, Friday.
Should match the length of available_training_days.';

-- Add check constraint to ensure array length is valid (1-7 days)
ALTER TABLE profiles
ADD CONSTRAINT preferred_training_days_array_length
CHECK (
  preferred_training_days IS NULL OR
  (
    array_length(preferred_training_days, 1) >= 1 AND
    array_length(preferred_training_days, 1) <= 7
  )
);

-- Note: Validation for individual day values (0-6) and duplicates
-- will be handled in the application layer since PostgreSQL check constraints
-- don't support subqueries or complex array operations.
--
-- Application validation should ensure:
-- 1. All values are between 0 and 6 (0=Sunday, 6=Saturday)
-- 2. No duplicate days in the array
-- 3. Array length matches available_training_days if both are set
