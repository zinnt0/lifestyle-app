/**
 * Nutrition Types for Multi-Layer Food Caching System
 * Supports Open Food Facts API integration with local and cloud caching
 */

// ============================================================================
// FOOD ITEM INTERFACES
// ============================================================================

/**
 * Main Food Item interface - used across all cache layers
 * Compatible with Open Food Facts API data structure
 */
export interface FoodItem {
  // Core identification
  barcode: string;
  source: 'openfoodfacts' | 'curated';

  // Cache layer source (for search result prioritization)
  // local = SQLite, cloud = Supabase, external = API
  cache_source?: 'local' | 'cloud' | 'external';

  // Naming (multi-language support)
  name: string;
  name_de?: string;
  brand?: string;

  // Additional searchable names (from OpenFoodFacts generic_name, etc.)
  // Used for better search matching
  search_names?: string[];

  // Macronutrients (per 100g)
  calories?: number;
  protein?: number;
  carbs?: number;
  fat?: number;
  fiber?: number;
  sugar?: number;
  sodium?: number;

  // Serving information
  serving_size?: number;
  serving_unit?: string;

  // Quality scores (Open Food Facts specific)
  nutriscore_grade?: string; // A-E rating
  nova_group?: number; // 1-4 (food processing level)
  ecoscore_grade?: string; // A-E rating

  // Additional metadata
  categories_tags?: string[];
  allergens?: string[];

  // Cache metadata (only in cached items)
  usage_count?: number;
  last_used?: string; // ISO timestamp
  cached_at?: string; // ISO timestamp

  // Curated item metadata
  is_verified?: boolean;
  relevance_score?: number; // From search ranking function
}

/**
 * Cached Food Item - extends FoodItem with local cache metadata
 * Used in SQLite local database
 */
export interface CachedFoodItem extends FoodItem {
  usage_count: number;
  last_used: string;
  cached_at: string;
}

/**
 * Custom Food Item - user-created foods stored only locally
 * These are never synced to Supabase
 */
export interface CustomFoodItem extends FoodItem {
  id: string; // UUID for the custom food
  isCustom: true; // Flag to identify custom foods
  created_at: string; // ISO timestamp
  updated_at: string; // ISO timestamp
}

// ============================================================================
// DIARY ENTRY INTERFACES
// ============================================================================

/**
 * Single diary entry for consumed food
 */
export interface DiaryEntry {
  id: string;
  user_id: string;
  food_item: FoodItem;

  // Consumption details
  amount: number; // in grams or serving_unit
  meal_type: MealType;
  consumed_at: string; // ISO timestamp

  // Calculated nutrition (based on amount)
  calories: number;
  protein: number;
  carbs: number;
  fat: number;

  // Metadata
  notes?: string;
  created_at: string;
}

/**
 * Meal types for diary categorization
 */
export type MealType = 'breakfast' | 'lunch' | 'dinner' | 'snack';

// ============================================================================
// DAILY SUMMARY INTERFACES
// ============================================================================

/**
 * Daily nutrition summary - aggregated from diary entries
 */
export interface DailySummary {
  date: string; // YYYY-MM-DD
  user_id: string;

  // Total macros consumed
  total_calories: number;
  total_protein: number;
  total_carbs: number;
  total_fat: number;

  // Goals (from user profile)
  goal_calories?: number;
  goal_protein?: number;
  goal_carbs?: number;
  goal_fat?: number;

  // Breakdown by meal
  meals: {
    breakfast: MealSummary;
    lunch: MealSummary;
    dinner: MealSummary;
    snack: MealSummary;
  };

  // Progress indicators
  calories_remaining: number;
  protein_remaining: number;
  carbs_remaining: number;
  fat_remaining: number;
}

/**
 * Per-meal summary within daily summary
 */
export interface MealSummary {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  entry_count: number;
}

// ============================================================================
// API RESPONSE INTERFACES (Open Food Facts)
// ============================================================================

/**
 * Open Food Facts API Product Response
 */
export interface OFFProductResponse {
  status: number;
  status_verbose: string;
  product?: OFFProduct;
}

/**
 * Open Food Facts Product Structure
 */
export interface OFFProduct {
  // Core identification
  code: string; // barcode
  product_name?: string;
  product_name_de?: string;
  generic_name?: string; // Additional name field from OFF API
  generic_name_de?: string; // German generic name
  abbreviated_product_name?: string;
  abbreviated_product_name_de?: string;
  brands?: string;

  // Nutriments (per 100g)
  nutriments?: {
    'energy-kcal_100g'?: number;
    'proteins_100g'?: number;
    'carbohydrates_100g'?: number;
    'fat_100g'?: number;
    'fiber_100g'?: number;
    'sugars_100g'?: number;
    'sodium_100g'?: number;
  };

  // Serving information
  serving_size?: string;
  serving_quantity?: number;

  // Quality scores
  nutriscore_grade?: string;
  nova_group?: number;
  ecoscore_grade?: string;

  // Categories and allergens
  categories_tags?: string[];
  allergens_tags?: string[];
}

/**
 * Open Food Facts Search Response
 */
export interface OFFSearchResponse {
  count: number;
  page: number;
  page_count: number;
  page_size: number;
  products: OFFProduct[];
}

// ============================================================================
// CACHE LAYER INTERFACES
// ============================================================================

/**
 * Cache statistics for monitoring
 */
export interface CacheStats {
  local_count: number;
  local_size_mb: number;
  cloud_count: number;
  hit_rate: number; // percentage
  last_sync?: string; // ISO timestamp
}

/**
 * Search result with cache layer information
 */
export interface SearchResult {
  items: FoodItem[];
  source: 'local' | 'cloud' | 'external';
  query_time_ms: number;
  total_count: number;
}

// ============================================================================
// SERVICE CONFIGURATION
// ============================================================================

/**
 * Food Service configuration options
 */
export interface FoodServiceConfig {
  // Cache settings
  maxLocalCacheSize: number; // max items in local SQLite
  prefetchPopularCount: number; // how many popular items to prefetch

  // Rate limiting
  maxRequestsPerMinute: number;

  // Search settings
  minSearchResults: number; // trigger cloud/external search if below this
  searchTimeout: number; // ms

  // Offline mode
  allowOfflineMode: boolean;
}

/**
 * Default configuration
 */
export const DEFAULT_FOOD_SERVICE_CONFIG: FoodServiceConfig = {
  maxLocalCacheSize: 50,
  prefetchPopularCount: 20,
  maxRequestsPerMinute: 100,
  minSearchResults: 5,
  searchTimeout: 10000,
  allowOfflineMode: true,
};

// ============================================================================
// ERROR TYPES
// ============================================================================

/**
 * Custom error for food service operations
 */
export class FoodServiceError extends Error {
  constructor(
    message: string,
    public code: FoodServiceErrorCode,
    public details?: any
  ) {
    super(message);
    this.name = 'FoodServiceError';
  }
}

/**
 * Error codes for different failure scenarios
 */
export enum FoodServiceErrorCode {
  BARCODE_NOT_FOUND = 'BARCODE_NOT_FOUND',
  NETWORK_ERROR = 'NETWORK_ERROR',
  RATE_LIMIT_EXCEEDED = 'RATE_LIMIT_EXCEEDED',
  CACHE_ERROR = 'CACHE_ERROR',
  INVALID_BARCODE = 'INVALID_BARCODE',
  PARSING_ERROR = 'PARSING_ERROR',
  DATABASE_ERROR = 'DATABASE_ERROR',
}

// ============================================================================
// UTILITY TYPES
// ============================================================================

/**
 * Nutrition values for easy calculation
 */
export interface NutritionValues {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
}

/**
 * User nutrition goals
 */
export interface NutritionGoals extends NutritionValues {
  fiber?: number;
  sugar_max?: number;
  sodium_max?: number;
}

/**
 * Barcode scan result
 */
export interface BarcodeScanResult {
  barcode: string;
  format: string; // EAN-13, UPC-A, etc.
  scanned_at: string;
}

// ============================================================================
// WATER TRACKING INTERFACES
// ============================================================================

/**
 * Water intake entry
 */
export interface WaterEntry {
  id: string;
  user_id: string;
  amount_ml: number;
  consumed_at: string; // ISO timestamp
  created_at: string;
}

/**
 * Daily water summary
 */
export interface DailyWaterSummary {
  date: string; // YYYY-MM-DD
  user_id: string;
  total_ml: number;
  goal_ml: number;
  entries: WaterEntry[];
}

// ============================================================================
// WEIGHT TRACKING INTERFACES
// ============================================================================

/**
 * Weight entry
 */
export interface WeightEntry {
  id: string;
  user_id: string;
  weight_kg: number;
  measured_at: string; // ISO timestamp
  created_at: string;
  notes?: string;
}

// ============================================================================
// USER NUTRITION PROFILE
// ============================================================================

/**
 * User's nutrition goals and preferences
 */
export interface UserNutritionProfile {
  user_id: string;

  // Daily calorie goals
  goal_calories: number;
  goal_protein: number;
  goal_carbs: number;
  goal_fat: number;

  // Meal distribution (percentage of daily calories)
  breakfast_percentage: number; // e.g., 30
  lunch_percentage: number; // e.g., 40
  dinner_percentage: number; // e.g., 25
  snack_percentage: number; // e.g., 5

  // Water goal
  water_goal_ml: number;

  // Weight goal
  target_weight_kg?: number;
  current_weight_kg?: number;

  // Metadata
  created_at: string;
  updated_at: string;
}
