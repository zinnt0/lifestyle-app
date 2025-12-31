-- Migration: Fix workout_sessions schema issues
-- Created: 2024-12-30
-- Purpose: Fix column data types for calorie and time tracking

-- 1. Fix active_time_minutes to support decimal values
-- Change from INTEGER to NUMERIC to support values like 12.5
ALTER TABLE workout_sessions
ALTER COLUMN active_time_minutes TYPE NUMERIC(10, 2);

-- 2. Fix average_met to support decimal values
-- Ensure it can store values like 5.5, 6.8, etc.
ALTER TABLE workout_sessions
ALTER COLUMN average_met TYPE NUMERIC(5, 2);

-- 3. Ensure total_calories_burned is INTEGER (whole numbers only)
-- This should already be INTEGER, but let's make sure
ALTER TABLE workout_sessions
ALTER COLUMN total_calories_burned TYPE INTEGER;

-- 4. Add comment for documentation
COMMENT ON COLUMN workout_sessions.active_time_minutes IS 'Active training time in minutes (excluding rest periods). Supports decimal values like 12.5';
COMMENT ON COLUMN workout_sessions.average_met IS 'Average MET (Metabolic Equivalent) value for the workout. Supports decimal values.';
COMMENT ON COLUMN workout_sessions.total_calories_burned IS 'Total calories burned during workout. Stored as whole number (rounded).';
