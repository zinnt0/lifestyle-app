-- Add saturated_fat column to food_items table
-- This aligns with German nutrition label standards which include "davon gesättigte Fettsäuren"

ALTER TABLE food_items
ADD COLUMN IF NOT EXISTS saturated_fat REAL;

COMMENT ON COLUMN food_items.saturated_fat IS 'Saturated fat content in grams per 100g (davon gesättigte Fettsäuren)';
