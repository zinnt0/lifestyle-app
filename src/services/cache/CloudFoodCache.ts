/**
 * Cloud Food Cache Service (Supabase)
 *
 * Provides shared food cache across all users via Supabase PostgreSQL
 * Uses full-text search for efficient product lookup
 *
 * PREREQUISITE:
 * - Supabase table 'food_items' must exist (see README for schema)
 */

import { supabase } from '../supabase';
import {
  FoodItem,
  FoodServiceError,
  FoodServiceErrorCode,
} from '../../types/nutrition';

const LOG_PREFIX = '[CloudFoodCache]';
const TABLE_NAME = 'food_items';

export class CloudFoodCache {
  /**
   * Get food item by barcode from Supabase cloud cache
   * Returns null if not found
   */
  async getFoodByBarcode(barcode: string): Promise<FoodItem | null> {
    try {
      console.log(`${LOG_PREFIX} Looking up barcode in cloud: ${barcode}`);

      const { data, error } = await supabase
        .from(TABLE_NAME)
        .select('*')
        .eq('barcode', barcode)
        .single();

      if (error) {
        // PGRST116 = row not found (not an error, just not cached)
        if (error.code === 'PGRST116') {
          console.log(`${LOG_PREFIX} Cloud cache miss for ${barcode}`);
          return null;
        }

        throw error;
      }

      if (!data) {
        console.log(`${LOG_PREFIX} Cloud cache miss for ${barcode}`);
        return null;
      }

      console.log(`${LOG_PREFIX} Cloud cache hit for ${barcode} (${data.name})`);

      // Increment global usage count (fire and forget)
      this.incrementUsageCount(barcode).catch((err) => {
        console.warn(`${LOG_PREFIX} Failed to increment usage count:`, err);
      });

      return this.dbRowToFoodItem(data);
    } catch (error) {
      console.error(`${LOG_PREFIX} Error getting food by barcode:`, error);
      throw new FoodServiceError(
        'Failed to get food from cloud cache',
        FoodServiceErrorCode.CACHE_ERROR,
        { barcode, originalError: error }
      );
    }
  }

  /**
   * Cache a food item in Supabase (upsert operation)
   * If already exists, updates nutrition data and increments usage count
   */
  async cacheFood(food: FoodItem): Promise<void> {
    try {
      console.log(`${LOG_PREFIX} Caching food in cloud: ${food.name} (${food.barcode})`);

      const dbRow = this.foodItemToDbRow(food);

      const { error } = await supabase
        .from(TABLE_NAME)
        .upsert(dbRow, {
          onConflict: 'barcode',
        });

      if (error) {
        throw error;
      }

      console.log(`${LOG_PREFIX} Successfully cached ${food.barcode} in cloud`);
    } catch (error) {
      console.error(`${LOG_PREFIX} Error caching food:`, error);
      throw new FoodServiceError(
        'Failed to cache food in cloud',
        FoodServiceErrorCode.CACHE_ERROR,
        { food, originalError: error }
      );
    }
  }

  /**
   * Search foods using full-text search (search_vector column)
   * Falls back to ILIKE if full-text search not available
   */
  async searchFoods(query: string, limit: number = 20): Promise<FoodItem[]> {
    if (!query || query.trim().length < 2) {
      console.log(`${LOG_PREFIX} Query too short: "${query}"`);
      return [];
    }

    try {
      console.log(`${LOG_PREFIX} Searching cloud: "${query}" (limit: ${limit})`);

      // Try full-text search first
      let { data, error } = await supabase
        .from(TABLE_NAME)
        .select('*')
        .textSearch('search_vector', query.trim(), {
          type: 'websearch',
          config: 'german',
        })
        .order('usage_count', { ascending: false })
        .limit(limit);

      // Fallback to ILIKE if full-text search fails or returns no results
      if (error || !data || data.length === 0) {
        console.log(`${LOG_PREFIX} Falling back to ILIKE search`);

        const searchPattern = `%${query.trim()}%`;
        const result = await supabase
          .from(TABLE_NAME)
          .select('*')
          .or(`name.ilike.${searchPattern},brand.ilike.${searchPattern}`)
          .order('usage_count', { ascending: false })
          .limit(limit);

        data = result.data;
        error = result.error;
      }

      if (error) {
        throw error;
      }

      const foods = (data || []).map((row) => this.dbRowToFoodItem(row));

      console.log(`${LOG_PREFIX} Found ${foods.length} cloud results for "${query}"`);
      return foods;
    } catch (error) {
      console.error(`${LOG_PREFIX} Error searching foods:`, error);
      throw new FoodServiceError(
        'Failed to search foods in cloud cache',
        FoodServiceErrorCode.CACHE_ERROR,
        { query, originalError: error }
      );
    }
  }

  /**
   * Get most-used foods across all users
   * Useful for prefetching popular items
   */
  async getMostUsedFoods(limit: number = 20): Promise<FoodItem[]> {
    try {
      console.log(`${LOG_PREFIX} Getting top ${limit} most-used foods from cloud`);

      const { data, error } = await supabase
        .from(TABLE_NAME)
        .select('*')
        .order('usage_count', { ascending: false })
        .limit(limit);

      if (error) {
        throw error;
      }

      const foods = (data || []).map((row) => this.dbRowToFoodItem(row));

      console.log(`${LOG_PREFIX} Retrieved ${foods.length} most-used foods`);
      return foods;
    } catch (error) {
      console.error(`${LOG_PREFIX} Error getting most-used foods:`, error);
      throw new FoodServiceError(
        'Failed to get most-used foods from cloud',
        FoodServiceErrorCode.CACHE_ERROR,
        { originalError: error }
      );
    }
  }

  /**
   * Get cache statistics
   */
  async getCacheStats(): Promise<{
    total_items: number;
    total_usage: number;
  }> {
    try {
      // Get total count
      const { count, error: countError } = await supabase
        .from(TABLE_NAME)
        .select('*', { count: 'exact', head: true });

      if (countError) {
        throw countError;
      }

      // Get total usage
      const { data: usageData, error: usageError } = await supabase
        .from(TABLE_NAME)
        .select('usage_count');

      if (usageError) {
        throw usageError;
      }

      const total_usage = (usageData || []).reduce(
        (sum, row) => sum + (row.usage_count || 0),
        0
      );

      return {
        total_items: count || 0,
        total_usage,
      };
    } catch (error) {
      console.error(`${LOG_PREFIX} Error getting cache stats:`, error);
      return { total_items: 0, total_usage: 0 };
    }
  }

  // ========================================================================
  // PRIVATE METHODS
  // ========================================================================

  /**
   * Increment usage count for a barcode (async, fire-and-forget)
   */
  private async incrementUsageCount(barcode: string): Promise<void> {
    try {
      // Use RPC function if available, otherwise use update
      const { error } = await supabase.rpc('increment_food_usage', {
        food_barcode: barcode,
      });

      if (error) {
        // Fallback to manual increment if RPC not available
        await supabase
          .from(TABLE_NAME)
          .update({
            usage_count: supabase.raw('usage_count + 1'),
            last_used: new Date().toISOString(),
          })
          .eq('barcode', barcode);
      }
    } catch (error) {
      console.warn(`${LOG_PREFIX} Failed to increment usage count:`, error);
      // Don't throw - this is not critical
    }
  }

  /**
   * Convert FoodItem to database row format
   */
  private foodItemToDbRow(food: FoodItem): any {
    return {
      barcode: food.barcode,
      name: food.name,
      name_de: food.name_de || null,
      brand: food.brand || null,
      calories: food.calories || null,
      protein: food.protein || null,
      carbs: food.carbs || null,
      fat: food.fat || null,
      fiber: food.fiber || null,
      sugar: food.sugar || null,
      sodium: food.sodium || null,
      serving_size: food.serving_size || null,
      serving_unit: food.serving_unit || null,
      nutriscore_grade: food.nutriscore_grade || null,
      nova_group: food.nova_group || null,
      ecoscore_grade: food.ecoscore_grade || null,
      categories_tags: food.categories_tags || null,
      allergens: food.allergens || null,
      source: 'openfoodfacts',
      usage_count: 1,
      last_used: new Date().toISOString(),
      cached_at: new Date().toISOString(),
      // search_vector is auto-generated by database trigger
    };
  }

  /**
   * Convert database row to FoodItem
   */
  private dbRowToFoodItem(row: any): FoodItem {
    return {
      barcode: row.barcode,
      source: 'openfoodfacts',
      name: row.name,
      name_de: row.name_de || undefined,
      brand: row.brand || undefined,
      calories: row.calories || undefined,
      protein: row.protein || undefined,
      carbs: row.carbs || undefined,
      fat: row.fat || undefined,
      fiber: row.fiber || undefined,
      sugar: row.sugar || undefined,
      sodium: row.sodium || undefined,
      serving_size: row.serving_size || undefined,
      serving_unit: row.serving_unit || undefined,
      nutriscore_grade: row.nutriscore_grade || undefined,
      nova_group: row.nova_group || undefined,
      ecoscore_grade: row.ecoscore_grade || undefined,
      categories_tags: row.categories_tags || undefined,
      allergens: row.allergens || undefined,
      usage_count: row.usage_count,
      last_used: row.last_used,
      cached_at: row.cached_at,
    };
  }
}

/**
 * Singleton instance for the app
 */
export const cloudFoodCache = new CloudFoodCache();

/**
 * Example usage:
 *
 * ```typescript
 * import { cloudFoodCache } from './CloudFoodCache';
 *
 * // Get food by barcode
 * const food = await cloudFoodCache.getFoodByBarcode('4260414150043');
 *
 * // Cache a new food
 * await cloudFoodCache.cacheFood(foodItem);
 *
 * // Search in cloud
 * const results = await cloudFoodCache.searchFoods('coca cola', 10);
 *
 * // Get popular foods for prefetching
 * const popular = await cloudFoodCache.getMostUsedFoods(20);
 * ```
 */
