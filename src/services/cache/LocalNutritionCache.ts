/**
 * Local SQLite Nutrition Cache Service
 *
 * Caches daily nutrition data (last 30 days) for fast offline access
 * Automatically syncs with Supabase and cleans old data
 *
 * SETUP REQUIRED:
 * Install expo-sqlite: npm install expo-sqlite
 */

import * as SQLite from 'expo-sqlite';

const LOG_PREFIX = '[LocalNutritionCache]';
const DB_NAME = 'food_cache.db'; // Reuse same DB as food cache
const MAX_DAYS_CACHED = 30; // Keep last 30 days

export interface DailyNutritionData {
  date: string; // YYYY-MM-DD
  calorie_goal: number;
  calories_consumed: number;
  calories_burned: number;
  net_calories: number;
  protein_consumed: number;
  protein_goal: number;
  carbs_consumed: number;
  carbs_goal: number;
  fat_consumed: number;
  fat_goal: number;
  fiber_consumed: number;
  sugar_consumed: number;
  sodium_consumed: number;
  water_consumed_ml: number;
  water_goal_ml: number;
  // Caffeine tracking
  coffee_cups: number;
  energy_drinks: number;
  caffeine_mg: number;
  last_synced: string; // ISO timestamp
}

export interface NutritionCacheStats {
  total_days: number;
  oldest_date: string | null;
  newest_date: string | null;
  last_sync: string | null;
}

export class LocalNutritionCache {
  private db: SQLite.SQLiteDatabase | null = null;
  private initialized: boolean = false;

  /**
   * Initialize the SQLite database and create nutrition table
   * Call this once when the app starts (after LocalFoodCache.initialize())
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      console.log(`${LOG_PREFIX} Already initialized`);
      return;
    }

    try {
      console.log(`${LOG_PREFIX} Initializing SQLite database...`);

      // Open database (reuse same DB as food cache)
      this.db = await SQLite.openDatabaseAsync(DB_NAME);

      // Create nutrition table
      await this.createNutritionTable();

      this.initialized = true;
      console.log(`${LOG_PREFIX} Successfully initialized`);
    } catch (error) {
      console.error(`${LOG_PREFIX} Initialization failed:`, error);
      throw new Error(`Failed to initialize local nutrition cache: ${error}`);
    }
  }

  /**
   * Get nutrition data for a specific date
   * Returns null if not cached
   */
  async getNutritionData(date: string): Promise<DailyNutritionData | null> {
    this.ensureInitialized();

    try {
      console.log(`${LOG_PREFIX} Looking up nutrition for date: ${date}`);

      const result = await this.db!.getFirstAsync<any>(
        'SELECT * FROM daily_nutrition_cache WHERE date = ?',
        [date]
      );

      if (!result) {
        console.log(`${LOG_PREFIX} Cache miss for ${date}`);
        return null;
      }

      console.log(`${LOG_PREFIX} Cache hit for ${date}`);
      return this.rowToNutritionData(result);
    } catch (error) {
      console.error(`${LOG_PREFIX} Error getting nutrition data:`, error);
      return null;
    }
  }

  /**
   * Get nutrition data for a date range
   * Returns array sorted by date (newest first)
   */
  async getNutritionDataRange(
    startDate: string,
    endDate: string
  ): Promise<DailyNutritionData[]> {
    this.ensureInitialized();

    try {
      console.log(`${LOG_PREFIX} Getting nutrition range: ${startDate} to ${endDate}`);

      const rows = await this.db!.getAllAsync<any>(
        `SELECT * FROM daily_nutrition_cache
         WHERE date >= ? AND date <= ?
         ORDER BY date DESC`,
        [startDate, endDate]
      );

      const data = rows.map((row) => this.rowToNutritionData(row));
      console.log(`${LOG_PREFIX} Retrieved ${data.length} days of nutrition data`);
      return data;
    } catch (error) {
      console.error(`${LOG_PREFIX} Error getting nutrition range:`, error);
      return [];
    }
  }

  /**
   * Get last N days of nutrition data
   */
  async getLastNDays(days: number = 7): Promise<DailyNutritionData[]> {
    this.ensureInitialized();

    try {
      console.log(`${LOG_PREFIX} Getting last ${days} days of nutrition data`);

      const rows = await this.db!.getAllAsync<any>(
        `SELECT * FROM daily_nutrition_cache
         ORDER BY date DESC
         LIMIT ?`,
        [days]
      );

      const data = rows.map((row) => this.rowToNutritionData(row));
      console.log(`${LOG_PREFIX} Retrieved ${data.length} days`);
      return data;
    } catch (error) {
      console.error(`${LOG_PREFIX} Error getting last N days:`, error);
      return [];
    }
  }

  /**
   * Get all cached nutrition entries (sorted by date DESC)
   */
  async getAllCachedEntries(): Promise<DailyNutritionData[]> {
    this.ensureInitialized();

    try {
      console.log(`${LOG_PREFIX} Getting all cached nutrition entries`);

      const rows = await this.db!.getAllAsync<any>(
        `SELECT * FROM daily_nutrition_cache
         ORDER BY date DESC`
      );

      const data = rows.map((row) => this.rowToNutritionData(row));
      console.log(`${LOG_PREFIX} Retrieved ${data.length} cached entries`);
      return data;
    } catch (error) {
      console.error(`${LOG_PREFIX} Error getting all cached entries:`, error);
      return [];
    }
  }

  /**
   * Cache or update nutrition data for a specific date
   */
  async cacheNutritionData(data: DailyNutritionData): Promise<void> {
    this.ensureInitialized();

    try {
      console.log(`${LOG_PREFIX} Caching nutrition for: ${data.date}`);

      await this.db!.runAsync(
        `INSERT OR REPLACE INTO daily_nutrition_cache (
          date, calorie_goal, calories_consumed, calories_burned, net_calories,
          protein_consumed, protein_goal, carbs_consumed, carbs_goal,
          fat_consumed, fat_goal, fiber_consumed, sugar_consumed, sodium_consumed,
          water_consumed_ml, water_goal_ml, coffee_cups, energy_drinks, caffeine_mg, last_synced
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          data.date,
          data.calorie_goal,
          data.calories_consumed,
          data.calories_burned,
          data.net_calories,
          data.protein_consumed,
          data.protein_goal,
          data.carbs_consumed,
          data.carbs_goal,
          data.fat_consumed,
          data.fat_goal,
          data.fiber_consumed,
          data.sugar_consumed,
          data.sodium_consumed,
          data.water_consumed_ml,
          data.water_goal_ml,
          data.coffee_cups || 0,
          data.energy_drinks || 0,
          data.caffeine_mg || 0,
          new Date().toISOString(),
        ]
      );

      console.log(`${LOG_PREFIX} Successfully cached nutrition for ${data.date}`);

      // Clean old data after caching
      await this.cleanOldData();
    } catch (error) {
      console.error(`${LOG_PREFIX} Error caching nutrition data:`, error);
      throw error;
    }
  }

  /**
   * Batch cache multiple days of nutrition data
   */
  async batchCacheNutritionData(dataArray: DailyNutritionData[]): Promise<void> {
    this.ensureInitialized();

    try {
      console.log(`${LOG_PREFIX} Batch caching ${dataArray.length} days of nutrition data`);

      for (const data of dataArray) {
        await this.cacheNutritionData(data);
      }

      console.log(`${LOG_PREFIX} Batch cache complete`);
    } catch (error) {
      console.error(`${LOG_PREFIX} Error batch caching:`, error);
      throw error;
    }
  }

  /**
   * Remove oldest nutrition data if cache exceeds MAX_DAYS_CACHED (FIFO)
   * Keeps the most recent 30 entries
   */
  async cleanOldData(): Promise<void> {
    this.ensureInitialized();

    try {
      // Count total entries
      const result = await this.db!.getFirstAsync<{ count: number }>(
        'SELECT COUNT(*) as count FROM daily_nutrition_cache'
      );

      const totalEntries = result?.count || 0;

      if (totalEntries <= MAX_DAYS_CACHED) {
        console.log(`${LOG_PREFIX} Cache has ${totalEntries} entries (within limit of ${MAX_DAYS_CACHED})`);
        return;
      }

      // Delete oldest entries to maintain max 30
      const entriesToDelete = totalEntries - MAX_DAYS_CACHED;
      console.log(`${LOG_PREFIX} Cache has ${totalEntries} entries, removing ${entriesToDelete} oldest entries`);

      await this.db!.runAsync(
        `DELETE FROM daily_nutrition_cache
         WHERE date IN (
           SELECT date FROM daily_nutrition_cache
           ORDER BY date ASC
           LIMIT ?
         )`,
        [entriesToDelete]
      );

      console.log(`${LOG_PREFIX} Cleaned ${entriesToDelete} old entries, ${MAX_DAYS_CACHED} entries remaining`);
    } catch (error) {
      console.error(`${LOG_PREFIX} Error cleaning old data:`, error);
      // Don't throw - cleaning is not critical
    }
  }

  /**
   * Get cache statistics
   */
  async getCacheStats(): Promise<NutritionCacheStats> {
    this.ensureInitialized();

    try {
      const stats = await this.db!.getFirstAsync<any>(
        `SELECT
          COUNT(*) as total_days,
          MIN(date) as oldest_date,
          MAX(date) as newest_date,
          MAX(last_synced) as last_sync
         FROM daily_nutrition_cache`
      );

      return {
        total_days: stats?.total_days || 0,
        oldest_date: stats?.oldest_date || null,
        newest_date: stats?.newest_date || null,
        last_sync: stats?.last_sync || null,
      };
    } catch (error) {
      console.error(`${LOG_PREFIX} Error getting cache stats:`, error);
      return {
        total_days: 0,
        oldest_date: null,
        newest_date: null,
        last_sync: null,
      };
    }
  }

  /**
   * Clear entire nutrition cache (use with caution!)
   */
  async clearCache(): Promise<void> {
    this.ensureInitialized();

    try {
      console.log(`${LOG_PREFIX} Clearing entire nutrition cache`);
      await this.db!.runAsync('DELETE FROM daily_nutrition_cache');
      console.log(`${LOG_PREFIX} Nutrition cache cleared`);
    } catch (error) {
      console.error(`${LOG_PREFIX} Error clearing cache:`, error);
      throw error;
    }
  }

  // ========================================================================
  // PRIVATE METHODS
  // ========================================================================

  /**
   * Create nutrition cache table
   */
  private async createNutritionTable(): Promise<void> {
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS daily_nutrition_cache (
        date TEXT PRIMARY KEY,
        calorie_goal INTEGER NOT NULL,
        calories_consumed INTEGER NOT NULL DEFAULT 0,
        calories_burned INTEGER NOT NULL DEFAULT 0,
        net_calories INTEGER NOT NULL DEFAULT 0,
        protein_consumed REAL NOT NULL DEFAULT 0,
        protein_goal REAL NOT NULL DEFAULT 0,
        carbs_consumed REAL NOT NULL DEFAULT 0,
        carbs_goal REAL NOT NULL DEFAULT 0,
        fat_consumed REAL NOT NULL DEFAULT 0,
        fat_goal REAL NOT NULL DEFAULT 0,
        fiber_consumed REAL NOT NULL DEFAULT 0,
        sugar_consumed REAL NOT NULL DEFAULT 0,
        sodium_consumed REAL NOT NULL DEFAULT 0,
        water_consumed_ml INTEGER NOT NULL DEFAULT 0,
        water_goal_ml INTEGER NOT NULL DEFAULT 2000,
        coffee_cups INTEGER NOT NULL DEFAULT 0,
        energy_drinks INTEGER NOT NULL DEFAULT 0,
        caffeine_mg INTEGER NOT NULL DEFAULT 0,
        last_synced TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_nutrition_date ON daily_nutrition_cache(date DESC);
      CREATE INDEX IF NOT EXISTS idx_nutrition_last_synced ON daily_nutrition_cache(last_synced DESC);
    `;

    await this.db!.execAsync(createTableSQL);

    // Add caffeine columns if they don't exist (migration for existing DBs)
    try {
      await this.db!.execAsync(`ALTER TABLE daily_nutrition_cache ADD COLUMN coffee_cups INTEGER NOT NULL DEFAULT 0`);
    } catch (e) { /* Column already exists */ }
    try {
      await this.db!.execAsync(`ALTER TABLE daily_nutrition_cache ADD COLUMN energy_drinks INTEGER NOT NULL DEFAULT 0`);
    } catch (e) { /* Column already exists */ }
    try {
      await this.db!.execAsync(`ALTER TABLE daily_nutrition_cache ADD COLUMN caffeine_mg INTEGER NOT NULL DEFAULT 0`);
    } catch (e) { /* Column already exists */ }

    console.log(`${LOG_PREFIX} Nutrition table created`);
  }

  /**
   * Convert database row to DailyNutritionData
   */
  private rowToNutritionData(row: any): DailyNutritionData {
    return {
      date: row.date,
      calorie_goal: row.calorie_goal || 0,
      calories_consumed: row.calories_consumed || 0,
      calories_burned: row.calories_burned || 0,
      net_calories: row.net_calories || 0,
      protein_consumed: row.protein_consumed || 0,
      protein_goal: row.protein_goal || 0,
      carbs_consumed: row.carbs_consumed || 0,
      carbs_goal: row.carbs_goal || 0,
      fat_consumed: row.fat_consumed || 0,
      fat_goal: row.fat_goal || 0,
      fiber_consumed: row.fiber_consumed || 0,
      sugar_consumed: row.sugar_consumed || 0,
      sodium_consumed: row.sodium_consumed || 0,
      water_consumed_ml: row.water_consumed_ml || 0,
      water_goal_ml: row.water_goal_ml || 2000,
      coffee_cups: row.coffee_cups || 0,
      energy_drinks: row.energy_drinks || 0,
      caffeine_mg: row.caffeine_mg || 0,
      last_synced: row.last_synced,
    };
  }

  /**
   * Ensure database is initialized before operations
   */
  private ensureInitialized(): void {
    if (!this.initialized || !this.db) {
      throw new Error(
        'LocalNutritionCache not initialized. Call initialize() first.'
      );
    }
  }
}

/**
 * Singleton instance for the app
 */
export const localNutritionCache = new LocalNutritionCache();

/**
 * Example usage:
 *
 * ```typescript
 * import { localNutritionCache } from './LocalNutritionCache';
 *
 * // Initialize on app start (after localFoodCache)
 * await localNutritionCache.initialize();
 *
 * // Get nutrition data for today
 * const todayData = await localNutritionCache.getNutritionData('2024-01-15');
 *
 * // Get last 7 days
 * const weekData = await localNutritionCache.getLastNDays(7);
 *
 * // Cache today's nutrition
 * await localNutritionCache.cacheNutritionData({
 *   date: '2024-01-15',
 *   calorie_goal: 2200,
 *   calories_consumed: 1850,
 *   calories_burned: 350,
 *   net_calories: 1500,
 *   protein_consumed: 120,
 *   protein_goal: 150,
 *   carbs_consumed: 200,
 *   carbs_goal: 250,
 *   fat_consumed: 60,
 *   fat_goal: 70,
 *   fiber_consumed: 25,
 *   sugar_consumed: 30,
 *   sodium_consumed: 2000,
 *   water_consumed_ml: 1800,
 *   water_goal_ml: 2000,
 *   last_synced: new Date().toISOString(),
 * });
 * ```
 */
