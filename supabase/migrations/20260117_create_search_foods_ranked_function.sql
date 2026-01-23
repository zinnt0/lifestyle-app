-- ============================================================================
-- MIGRATION: Create search_foods_ranked RPC function
-- ============================================================================
-- This function searches for foods where the search query appears in the
-- product NAME (not brand). Results are ranked by:
-- 1. Exact name match (highest priority)
-- 2. Name starts with query
-- 3. Query appears in name
-- 4. Usage count (popularity)
-- ============================================================================

-- Drop existing function if exists
DROP FUNCTION IF EXISTS search_foods_ranked(TEXT, INTEGER);

-- Create the search_foods_ranked function
CREATE OR REPLACE FUNCTION search_foods_ranked(
  search_query TEXT,
  max_results INTEGER DEFAULT 50
)
RETURNS SETOF food_items AS $$
DECLARE
  normalized_query TEXT;
BEGIN
  -- Normalize the search query (lowercase, trim)
  normalized_query := LOWER(TRIM(search_query));

  -- Return empty if query is too short
  IF LENGTH(normalized_query) < 2 THEN
    RETURN;
  END IF;

  -- Search only in name and name_de fields (NOT brand)
  -- This ensures the search term appears in the actual food name
  RETURN QUERY
  SELECT *
  FROM food_items
  WHERE
    -- Match in name or name_de (case-insensitive)
    LOWER(name) LIKE '%' || normalized_query || '%'
    OR (name_de IS NOT NULL AND LOWER(name_de) LIKE '%' || normalized_query || '%')
  ORDER BY
    -- Priority 1: Exact match in name
    CASE
      WHEN LOWER(name) = normalized_query THEN 0
      WHEN name_de IS NOT NULL AND LOWER(name_de) = normalized_query THEN 1
      ELSE 10
    END,
    -- Priority 2: Name starts with query
    CASE
      WHEN LOWER(name) LIKE normalized_query || '%' THEN 0
      WHEN name_de IS NOT NULL AND LOWER(name_de) LIKE normalized_query || '%' THEN 1
      ELSE 10
    END,
    -- Priority 3: Position of match in name (earlier = better)
    CASE
      WHEN POSITION(normalized_query IN LOWER(name)) > 0
        THEN POSITION(normalized_query IN LOWER(name))
      WHEN name_de IS NOT NULL AND POSITION(normalized_query IN LOWER(name_de)) > 0
        THEN POSITION(normalized_query IN LOWER(name_de))
      ELSE 9999
    END,
    -- Priority 4: Usage count (more used = higher priority)
    usage_count DESC NULLS LAST,
    -- Priority 5: Last used date
    last_used DESC NULLS LAST
  LIMIT max_results;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION search_foods_ranked(TEXT, INTEGER) TO authenticated;

-- Grant execute permission to anonymous users (for public searches)
GRANT EXECUTE ON FUNCTION search_foods_ranked(TEXT, INTEGER) TO anon;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================
-- Run these to verify the function works:
--
-- Test 1: Search for "Eier" (should only return items with "Eier" in name)
-- SELECT name, name_de, brand, usage_count FROM search_foods_ranked('Eier', 10);
--
-- Test 2: Search for "Milch"
-- SELECT name, name_de, brand, usage_count FROM search_foods_ranked('Milch', 10);
--
-- Test 3: Search for brand name only (should return empty or only items
--         where brand name also appears in product name)
-- SELECT name, name_de, brand FROM search_foods_ranked('Milka', 10);
-- ============================================================================
