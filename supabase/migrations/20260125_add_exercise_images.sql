-- Migration: Add image columns to exercises table
-- Date: 2025-01-25
-- Description: Adds start and end image URLs for exercise demonstrations

-- Add image columns to exercises table
ALTER TABLE exercises
ADD COLUMN IF NOT EXISTS image_start_url TEXT,
ADD COLUMN IF NOT EXISTS image_end_url TEXT;

-- Add comment for documentation
COMMENT ON COLUMN exercises.image_start_url IS 'URL to the starting position image of the exercise';
COMMENT ON COLUMN exercises.image_end_url IS 'URL to the ending position image of the exercise';

-- Create storage bucket for exercise images (if not exists)
-- Note: This needs to be done via Supabase Dashboard or API, not SQL
-- Bucket name: exercise-images
-- Public access: true (for public image URLs)

-- Create index for faster queries on exercises with/without images
CREATE INDEX IF NOT EXISTS idx_exercises_has_images
ON exercises ((image_start_url IS NOT NULL), (image_end_url IS NOT NULL));
