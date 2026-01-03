-- ============================================================================
-- FOOD CACHING SYSTEM - SUPABASE TABLE SETUP
-- ============================================================================
-- This SQL creates the food_items table for cloud caching
-- Run this in Supabase SQL Editor or create a migration
-- ============================================================================

-- Drop existing table if needed (CAUTION: removes all data!)
-- DROP TABLE IF EXISTS food_items CASCADE;

-- Create food_items table
CREATE TABLE IF NOT EXISTS food_items (
  -- Primary key
  barcode TEXT PRIMARY KEY,

  -- Product names (multi-language)
  name TEXT NOT NULL,
  name_de TEXT,
  brand TEXT,

  -- Macronutrients (per 100g)
  calories REAL,
  protein REAL,
  carbs REAL,
  fat REAL,
  fiber REAL,
  sugar REAL,
  sodium REAL,

  -- Serving information
  serving_size REAL,
  serving_unit TEXT,

  -- Quality scores (Open Food Facts)
  nutriscore_grade TEXT,
  nova_group INTEGER CHECK (nova_group >= 1 AND nova_group <= 4),
  ecoscore_grade TEXT,

  -- Additional metadata
  categories_tags TEXT[],
  allergens TEXT[],
  source TEXT DEFAULT 'openfoodfacts',

  -- Usage tracking (global across all users)
  usage_count INTEGER DEFAULT 1,
  last_used TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  cached_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Full-text search vector (auto-generated)
  search_vector tsvector
);

-- ============================================================================
-- INDEXES for performance
-- ============================================================================

-- Index for usage-based queries (most-used foods)
CREATE INDEX IF NOT EXISTS idx_food_usage_count
ON food_items(usage_count DESC);

-- Index for recent foods
CREATE INDEX IF NOT EXISTS idx_food_last_used
ON food_items(last_used DESC);

-- GIN index for full-text search
CREATE INDEX IF NOT EXISTS idx_food_search_vector
ON food_items USING GIN(search_vector);

-- Index for brand searches
CREATE INDEX IF NOT EXISTS idx_food_brand
ON food_items(brand) WHERE brand IS NOT NULL;

-- ============================================================================
-- TRIGGER for auto-updating search_vector
-- ============================================================================

-- Function to update search vector when food is inserted/updated
CREATE OR REPLACE FUNCTION update_food_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  -- Create weighted search vector:
  -- - 'A' weight for product names (highest priority)
  -- - 'B' weight for brand (medium priority)
  NEW.search_vector :=
    setweight(to_tsvector('german', COALESCE(NEW.name, '')), 'A') ||
    setweight(to_tsvector('german', COALESCE(NEW.name_de, '')), 'A') ||
    setweight(to_tsvector('german', COALESCE(NEW.brand, '')), 'B');

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS trigger_update_food_search_vector ON food_items;
CREATE TRIGGER trigger_update_food_search_vector
BEFORE INSERT OR UPDATE ON food_items
FOR EACH ROW
EXECUTE FUNCTION update_food_search_vector();

-- ============================================================================
-- RPC FUNCTIONS for optimized operations
-- ============================================================================

-- Function to increment usage count (atomic operation)
CREATE OR REPLACE FUNCTION increment_food_usage(food_barcode TEXT)
RETURNS VOID AS $$
BEGIN
  UPDATE food_items
  SET
    usage_count = usage_count + 1,
    last_used = NOW()
  WHERE barcode = food_barcode;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get cache statistics
CREATE OR REPLACE FUNCTION get_food_cache_stats()
RETURNS TABLE(
  total_items BIGINT,
  total_usage BIGINT,
  avg_usage NUMERIC,
  items_last_24h BIGINT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    COUNT(*)::BIGINT as total_items,
    SUM(usage_count)::BIGINT as total_usage,
    ROUND(AVG(usage_count), 2) as avg_usage,
    COUNT(*) FILTER (WHERE cached_at > NOW() - INTERVAL '24 hours')::BIGINT as items_last_24h
  FROM food_items;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) Policies
-- ============================================================================

-- Enable RLS on the table
ALTER TABLE food_items ENABLE ROW LEVEL SECURITY;

-- Policy: Everyone can read (SELECT)
DROP POLICY IF EXISTS "Allow public read access" ON food_items;
CREATE POLICY "Allow public read access"
ON food_items FOR SELECT
USING (true);

-- Policy: Authenticated users can insert
DROP POLICY IF EXISTS "Allow authenticated insert" ON food_items;
CREATE POLICY "Allow authenticated insert"
ON food_items FOR INSERT
TO authenticated
WITH CHECK (true);

-- Policy: Authenticated users can update
DROP POLICY IF EXISTS "Allow authenticated update" ON food_items;
CREATE POLICY "Allow authenticated update"
ON food_items FOR UPDATE
TO authenticated
USING (true);

-- Policy: Only service role can delete (prevent accidental deletion)
DROP POLICY IF EXISTS "Allow service role delete" ON food_items;
CREATE POLICY "Allow service role delete"
ON food_items FOR DELETE
TO service_role
USING (true);

-- ============================================================================
-- SAMPLE DATA (optional - for testing)
-- ============================================================================

-- Uncomment to insert sample products for testing
/*
INSERT INTO food_items (
  barcode, name, name_de, brand,
  calories, protein, carbs, fat,
  serving_size, serving_unit,
  nutriscore_grade, nova_group
) VALUES
  (
    '5449000000996',
    'Coca-Cola',
    'Coca-Cola',
    'The Coca-Cola Company',
    42, 0, 10.6, 0,
    330, 'ml',
    'E', 4
  ),
  (
    '7622300441890',
    'Milka Alpine Milk',
    'Milka Alpenmilch',
    'Milka',
    530, 7, 59, 29,
    100, 'g',
    'E', 4
  ),
  (
    '4001686332009',
    'Haribo Goldbears',
    'Haribo Goldbären',
    'Haribo',
    343, 6.9, 77, 0.5,
    100, 'g',
    'D', 4
  )
ON CONFLICT (barcode) DO NOTHING;
*/

-- ============================================================================
-- GRANTS (optional - for specific user roles)
-- ============================================================================

-- Grant usage of RPC functions to authenticated users
GRANT EXECUTE ON FUNCTION increment_food_usage(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION get_food_cache_stats() TO authenticated;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Run these to verify the setup:

-- 1. Check table structure
-- SELECT * FROM information_schema.columns WHERE table_name = 'food_items';

-- 2. Check indexes
-- SELECT indexname, indexdef FROM pg_indexes WHERE tablename = 'food_items';

-- 3. Check triggers
-- SELECT tgname, tgtype FROM pg_trigger WHERE tgrelid = 'food_items'::regclass;

-- 4. Check RLS policies
-- SELECT * FROM pg_policies WHERE tablename = 'food_items';

-- 5. Test cache stats function
-- SELECT * FROM get_food_cache_stats();

-- ============================================================================
-- NOTES
-- ============================================================================

/*
IMPORTANT NOTES:

1. MIGRATION vs DIRECT SQL:
   - For production: Create a Supabase migration file
   - For testing: Run directly in SQL Editor

2. PERFORMANCE:
   - search_vector GIN index enables fast full-text search
   - usage_count index enables fast "top foods" queries
   - Consider VACUUM ANALYZE after bulk inserts

3. RLS POLICIES:
   - Public read access (anyone can search foods)
   - Authenticated users can add/update (caching)
   - Only service role can delete (safety)

4. FULL-TEXT SEARCH:
   - Configured for German language ('german' config)
   - Auto-updates on INSERT/UPDATE via trigger
   - Weighted: names (A) > brand (B)

5. SCALING:
   - Current setup handles millions of rows
   - Consider partitioning if >10M products
   - Monitor index sizes periodically

6. BACKUP:
   - Supabase auto-backups enabled by default
   - Consider point-in-time recovery for production

7. MONITORING:
   - Use get_food_cache_stats() for basic stats
   - Check Supabase dashboard for query performance
   - Monitor usage_count distribution
*/
