/**
 * Local SQLite Food Cache Service
 *
 * Provides instant, offline-available food data caching using expo-sqlite
 * Tracks usage patterns to keep most-used foods readily available
 *
 * SETUP REQUIRED:
 * Install expo-sqlite: npm install expo-sqlite
 */

import * as SQLite from 'expo-sqlite';
import {
  FoodItem,
  CachedFoodItem,
  FoodServiceError,
  FoodServiceErrorCode,
} from '../../types/nutrition';

const LOG_PREFIX = '[LocalFoodCache]';
const DB_NAME = 'food_cache.db';
const MAX_CACHE_SIZE = 50; // Keep only top 50 most-used foods

export class LocalFoodCache {
  private db: SQLite.SQLiteDatabase | null = null;
  private initialized: boolean = false;

  /**
   * Initialize the SQLite database and create tables
   * Call this once when the app starts
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      console.log(`${LOG_PREFIX} Already initialized`);
      return;
    }

    try {
      console.log(`${LOG_PREFIX} Initializing SQLite database...`);

      // Open database
      this.db = await SQLite.openDatabaseAsync(DB_NAME);

      // Create tables
      await this.createTables();

      this.initialized = true;
      console.log(`${LOG_PREFIX} Successfully initialized`);
    } catch (error) {
      console.error(`${LOG_PREFIX} Initialization failed:`, error);
      throw new FoodServiceError(
        'Failed to initialize local cache',
        FoodServiceErrorCode.DATABASE_ERROR,
        { originalError: error }
      );
    }
  }

  /**
   * Get food item by barcode from local cache
   * Returns null if not found
   * Increments usage_count and updates last_used on hit
   */
  async getFoodByBarcode(barcode: string): Promise<FoodItem | null> {
    this.ensureInitialized();

    try {
      console.log(`${LOG_PREFIX} Looking up barcode: ${barcode}`);

      const result = await this.db!.getFirstAsync<CachedFoodItem>(
        'SELECT * FROM user_foods WHERE barcode = ?',
        [barcode]
      );

      if (!result) {
        console.log(`${LOG_PREFIX} Cache miss for ${barcode}`);
        return null;
      }

      // Update usage statistics
      await this.incrementUsage(barcode);

      console.log(`${LOG_PREFIX} Cache hit for ${barcode} (${result.name})`);

      // Parse and return as FoodItem
      return this.rowToFoodItem(result);
    } catch (error) {
      console.error(`${LOG_PREFIX} Error getting food by barcode:`, error);
      throw new FoodServiceError(
        'Failed to get food from local cache',
        FoodServiceErrorCode.CACHE_ERROR,
        { barcode, originalError: error }
      );
    }
  }

  /**
   * Cache a food item locally
   * If already exists, increment usage_count
   * If new, insert and prune cache if needed
   */
  async cacheFood(food: FoodItem): Promise<void> {
    this.ensureInitialized();

    try {
      console.log(`${LOG_PREFIX} Caching food: ${food.name} (${food.barcode})`);

      // Check if already exists
      const existing = await this.db!.getFirstAsync<{ barcode: string }>(
        'SELECT barcode FROM user_foods WHERE barcode = ?',
        [food.barcode]
      );

      if (existing) {
        // Update existing entry
        await this.updateFood(food);
        await this.incrementUsage(food.barcode);
        console.log(`${LOG_PREFIX} Updated existing food: ${food.barcode}`);
      } else {
        // Insert new entry
        await this.insertFood(food);
        console.log(`${LOG_PREFIX} Inserted new food: ${food.barcode}`);

        // Prune cache if needed
        await this.pruneCache();
      }
    } catch (error) {
      console.error(`${LOG_PREFIX} Error caching food:`, error);
      throw new FoodServiceError(
        'Failed to cache food locally',
        FoodServiceErrorCode.CACHE_ERROR,
        { food, originalError: error }
      );
    }
  }

  /**
   * Get top N most-used foods from local cache
   * Ordered by usage_count descending
   */
  async getTopFoods(limit: number = 20): Promise<FoodItem[]> {
    this.ensureInitialized();

    try {
      console.log(`${LOG_PREFIX} Getting top ${limit} foods`);

      const rows = await this.db!.getAllAsync<CachedFoodItem>(
        'SELECT * FROM user_foods ORDER BY usage_count DESC, last_used DESC LIMIT ?',
        [limit]
      );

      const foods = rows.map((row) => this.rowToFoodItem(row));

      console.log(`${LOG_PREFIX} Retrieved ${foods.length} top foods`);
      return foods;
    } catch (error) {
      console.error(`${LOG_PREFIX} Error getting top foods:`, error);
      throw new FoodServiceError(
        'Failed to get top foods from local cache',
        FoodServiceErrorCode.CACHE_ERROR,
        { originalError: error }
      );
    }
  }

  /**
   * Search foods by name (case-insensitive text search)
   * Only matches if query appears in the product name (not brand)
   */
  async searchFoodsByName(query: string, limit: number = 20): Promise<FoodItem[]> {
    this.ensureInitialized();

    if (!query || query.trim().length < 2) {
      console.log(`${LOG_PREFIX} Query too short: "${query}"`);
      return [];
    }

    try {
      console.log(`${LOG_PREFIX} Searching locally: "${query}"`);

      const searchPattern = `%${query.trim().toLowerCase()}%`;

      // Only search in product name (not brand) to ensure relevance
      const rows = await this.db!.getAllAsync<CachedFoodItem>(
        `SELECT * FROM user_foods
         WHERE LOWER(name) LIKE ?
         ORDER BY usage_count DESC
         LIMIT ?`,
        [searchPattern, limit]
      );

      const foods = rows.map((row) => this.rowToFoodItem(row));

      console.log(`${LOG_PREFIX} Found ${foods.length} local results for "${query}"`);
      return foods;
    } catch (error) {
      console.error(`${LOG_PREFIX} Error searching foods:`, error);
      throw new FoodServiceError(
        'Failed to search foods in local cache',
        FoodServiceErrorCode.CACHE_ERROR,
        { query, originalError: error }
      );
    }
  }

  /**
   * Prune cache to keep only top MAX_CACHE_SIZE foods
   * Removes least-used foods
   */
  async pruneCache(): Promise<void> {
    this.ensureInitialized();

    try {
      const count = await this.getCacheSize();

      if (count <= MAX_CACHE_SIZE) {
        return; // No pruning needed
      }

      console.log(`${LOG_PREFIX} Pruning cache (${count} -> ${MAX_CACHE_SIZE})`);

      // Delete foods beyond the top N
      await this.db!.runAsync(
        `DELETE FROM user_foods
         WHERE barcode NOT IN (
           SELECT barcode FROM user_foods
           ORDER BY usage_count DESC, last_used DESC
           LIMIT ?
         )`,
        [MAX_CACHE_SIZE]
      );

      const newCount = await this.getCacheSize();
      console.log(`${LOG_PREFIX} Cache pruned to ${newCount} items`);
    } catch (error) {
      console.error(`${LOG_PREFIX} Error pruning cache:`, error);
      // Don't throw - pruning is not critical
    }
  }

  /**
   * Get current cache size (number of items)
   */
  async getCacheSize(): Promise<number> {
    this.ensureInitialized();

    try {
      const result = await this.db!.getFirstAsync<{ count: number }>(
        'SELECT COUNT(*) as count FROM user_foods'
      );

      return result?.count || 0;
    } catch (error) {
      console.error(`${LOG_PREFIX} Error getting cache size:`, error);
      return 0;
    }
  }

  /**
   * Clear entire cache (use with caution!)
   */
  async clearCache(): Promise<void> {
    this.ensureInitialized();

    try {
      console.log(`${LOG_PREFIX} Clearing entire cache`);
      await this.db!.runAsync('DELETE FROM user_foods');
      console.log(`${LOG_PREFIX} Cache cleared`);
    } catch (error) {
      console.error(`${LOG_PREFIX} Error clearing cache:`, error);
      throw new FoodServiceError(
        'Failed to clear local cache',
        FoodServiceErrorCode.CACHE_ERROR,
        { originalError: error }
      );
    }
  }

  // ========================================================================
  // PRIVATE METHODS
  // ========================================================================

  /**
   * Create database tables
   */
  private async createTables(): Promise<void> {
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS user_foods (
        barcode TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        brand TEXT,
        calories REAL,
        protein REAL,
        carbs REAL,
        fat REAL,
        fiber REAL,
        sugar REAL,
        sodium REAL,
        serving_size REAL,
        serving_unit TEXT,
        nutriscore_grade TEXT,
        nova_group INTEGER,
        ecoscore_grade TEXT,
        usage_count INTEGER DEFAULT 1,
        last_used TEXT DEFAULT CURRENT_TIMESTAMP,
        cached_at TEXT DEFAULT CURRENT_TIMESTAMP,
        source TEXT DEFAULT 'openfoodfacts'
      );

      CREATE INDEX IF NOT EXISTS idx_usage_count ON user_foods(usage_count DESC);
      CREATE INDEX IF NOT EXISTS idx_last_used ON user_foods(last_used DESC);
      CREATE INDEX IF NOT EXISTS idx_name ON user_foods(name);
    `;

    await this.db!.execAsync(createTableSQL);
    console.log(`${LOG_PREFIX} Tables created`);
  }

  /**
   * Insert new food item (or replace if already exists)
   */
  private async insertFood(food: FoodItem): Promise<void> {
    await this.db!.runAsync(
      `INSERT OR REPLACE INTO user_foods (
        barcode, name, brand, calories, protein, carbs, fat, fiber, sugar, sodium,
        serving_size, serving_unit, nutriscore_grade, nova_group, ecoscore_grade,
        usage_count, last_used, cached_at, source
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        food.barcode,
        food.name,
        food.brand || null,
        food.calories || null,
        food.protein || null,
        food.carbs || null,
        food.fat || null,
        food.fiber || null,
        food.sugar || null,
        food.sodium || null,
        food.serving_size || null,
        food.serving_unit || null,
        food.nutriscore_grade || null,
        food.nova_group || null,
        food.ecoscore_grade || null,
        1, // usage_count
        new Date().toISOString(), // last_used
        new Date().toISOString(), // cached_at
        'openfoodfacts',
      ]
    );
  }

  /**
   * Update existing food item
   */
  private async updateFood(food: FoodItem): Promise<void> {
    await this.db!.runAsync(
      `UPDATE user_foods SET
        name = ?, brand = ?, calories = ?, protein = ?, carbs = ?, fat = ?,
        fiber = ?, sugar = ?, sodium = ?, serving_size = ?, serving_unit = ?,
        nutriscore_grade = ?, nova_group = ?, ecoscore_grade = ?
       WHERE barcode = ?`,
      [
        food.name,
        food.brand || null,
        food.calories || null,
        food.protein || null,
        food.carbs || null,
        food.fat || null,
        food.fiber || null,
        food.sugar || null,
        food.sodium || null,
        food.serving_size || null,
        food.serving_unit || null,
        food.nutriscore_grade || null,
        food.nova_group || null,
        food.ecoscore_grade || null,
        food.barcode,
      ]
    );
  }

  /**
   * Increment usage count for a barcode
   */
  private async incrementUsage(barcode: string): Promise<void> {
    await this.db!.runAsync(
      `UPDATE user_foods
       SET usage_count = usage_count + 1, last_used = ?
       WHERE barcode = ?`,
      [new Date().toISOString(), barcode]
    );
  }

  /**
   * Convert database row to FoodItem
   */
  private rowToFoodItem(row: any): FoodItem {
    return {
      barcode: row.barcode,
      source: 'openfoodfacts',
      name: row.name,
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
      usage_count: row.usage_count,
      last_used: row.last_used,
      cached_at: row.cached_at,
    };
  }

  /**
   * Ensure database is initialized before operations
   */
  private ensureInitialized(): void {
    if (!this.initialized || !this.db) {
      throw new FoodServiceError(
        'Local cache not initialized. Call initialize() first.',
        FoodServiceErrorCode.DATABASE_ERROR
      );
    }
  }
}

/**
 * Singleton instance for the app
 */
export const localFoodCache = new LocalFoodCache();

/**
 * Example usage:
 *
 * ```typescript
 * import { localFoodCache } from './LocalFoodCache';
 *
 * // Initialize on app start
 * await localFoodCache.initialize();
 *
 * // Get food by barcode
 * const food = await localFoodCache.getFoodByBarcode('4260414150043');
 *
 * // Cache a new food
 * await localFoodCache.cacheFood(foodItem);
 *
 * // Search locally
 * const results = await localFoodCache.searchFoodsByName('coca cola');
 *
 * // Get most-used foods
 * const topFoods = await localFoodCache.getTopFoods(10);
 * ```
 */
