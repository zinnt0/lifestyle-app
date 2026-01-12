-- Add sun_exposure_hours column to profiles table
-- Stores weekly sun exposure in hours (0-20+) for Vitamin D assessment
-- Used in Supplement Onboarding Screen 2

ALTER TABLE profiles
ADD COLUMN IF NOT EXISTS sun_exposure_hours INTEGER DEFAULT NULL;

-- Add comment for documentation
COMMENT ON COLUMN profiles.sun_exposure_hours IS 'Weekly sun exposure in hours (0-20+), used for Vitamin D supplement recommendations';
