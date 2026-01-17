/**
 * Custom Food Cache Service
 *
 * Stores user-created custom foods locally using expo-sqlite
 * These foods are NEVER synced to Supabase - they remain local only
 */

import * as SQLite from 'expo-sqlite';
import {
  CustomFoodItem,
  FoodItem,
  FoodServiceError,
  FoodServiceErrorCode,
} from '../../types/nutrition';

/**
 * Generate a simple UUID v4
 * This is a lightweight implementation that doesn't require external dependencies
 */
function generateUUID(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

const LOG_PREFIX = '[CustomFoodCache]';
const DB_NAME = 'food_cache.db';

export class CustomFoodCache {
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

      // Open database (same DB as LocalFoodCache)
      this.db = await SQLite.openDatabaseAsync(DB_NAME);

      // Create custom foods table
      await this.createTables();

      this.initialized = true;
      console.log(`${LOG_PREFIX} Successfully initialized`);
    } catch (error) {
      console.error(`${LOG_PREFIX} Initialization failed:`, error);
      throw new FoodServiceError(
        'Failed to initialize custom food cache',
        FoodServiceErrorCode.DATABASE_ERROR,
        { originalError: error }
      );
    }
  }

  /**
   * Create a new custom food
   * Returns the created food with generated ID
   */
  async createCustomFood(food: Omit<CustomFoodItem, 'id' | 'isCustom' | 'created_at' | 'updated_at' | 'barcode' | 'source'>): Promise<CustomFoodItem> {
    this.ensureInitialized();

    try {
      const now = new Date().toISOString();
      const id = generateUUID();
      // Generate a unique barcode for custom foods (custom_<uuid>)
      const barcode = `custom_${id}`;

      const customFood: CustomFoodItem = {
        ...food,
        id,
        barcode,
        source: 'curated' as const,
        isCustom: true,
        created_at: now,
        updated_at: now,
      };

      console.log(`${LOG_PREFIX} Creating custom food: ${customFood.name}`);

      await this.db!.runAsync(
        `INSERT INTO custom_foods (
          id, barcode, name, brand, calories, protein, carbs, fat, fiber, sugar, sodium,
          serving_size, serving_unit, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          customFood.id,
          customFood.barcode,
          customFood.name,
          customFood.brand || null,
          customFood.calories || null,
          customFood.protein || null,
          customFood.carbs || null,
          customFood.fat || null,
          customFood.fiber || null,
          customFood.sugar || null,
          customFood.sodium || null,
          customFood.serving_size || 100,
          customFood.serving_unit || 'g',
          customFood.created_at,
          customFood.updated_at,
        ]
      );

      console.log(`${LOG_PREFIX} Created custom food: ${customFood.name} (${customFood.id})`);
      return customFood;
    } catch (error) {
      console.error(`${LOG_PREFIX} Error creating custom food:`, error);
      throw new FoodServiceError(
        'Failed to create custom food',
        FoodServiceErrorCode.DATABASE_ERROR,
        { food, originalError: error }
      );
    }
  }

  /**
   * Get all custom foods ordered by most recently created
   */
  async getAllCustomFoods(limit: number = 50): Promise<CustomFoodItem[]> {
    this.ensureInitialized();

    try {
      console.log(`${LOG_PREFIX} Getting all custom foods (limit: ${limit})`);

      const rows = await this.db!.getAllAsync<any>(
        'SELECT * FROM custom_foods ORDER BY created_at DESC LIMIT ?',
        [limit]
      );

      const foods = rows.map((row) => this.rowToCustomFood(row));
      console.log(`${LOG_PREFIX} Retrieved ${foods.length} custom foods`);
      return foods;
    } catch (error) {
      console.error(`${LOG_PREFIX} Error getting custom foods:`, error);
      throw new FoodServiceError(
        'Failed to get custom foods',
        FoodServiceErrorCode.DATABASE_ERROR,
        { originalError: error }
      );
    }
  }

  /**
   * Get custom food by ID
   */
  async getCustomFoodById(id: string): Promise<CustomFoodItem | null> {
    this.ensureInitialized();

    try {
      console.log(`${LOG_PREFIX} Looking up custom food: ${id}`);

      const result = await this.db!.getFirstAsync<any>(
        'SELECT * FROM custom_foods WHERE id = ?',
        [id]
      );

      if (!result) {
        console.log(`${LOG_PREFIX} Custom food not found: ${id}`);
        return null;
      }

      return this.rowToCustomFood(result);
    } catch (error) {
      console.error(`${LOG_PREFIX} Error getting custom food by ID:`, error);
      throw new FoodServiceError(
        'Failed to get custom food',
        FoodServiceErrorCode.DATABASE_ERROR,
        { id, originalError: error }
      );
    }
  }

  /**
   * Get custom food by barcode
   */
  async getCustomFoodByBarcode(barcode: string): Promise<CustomFoodItem | null> {
    this.ensureInitialized();

    try {
      console.log(`${LOG_PREFIX} Looking up custom food by barcode: ${barcode}`);

      const result = await this.db!.getFirstAsync<any>(
        'SELECT * FROM custom_foods WHERE barcode = ?',
        [barcode]
      );

      if (!result) {
        return null;
      }

      return this.rowToCustomFood(result);
    } catch (error) {
      console.error(`${LOG_PREFIX} Error getting custom food by barcode:`, error);
      throw new FoodServiceError(
        'Failed to get custom food',
        FoodServiceErrorCode.DATABASE_ERROR,
        { barcode, originalError: error }
      );
    }
  }

  /**
   * Search custom foods by name
   */
  async searchCustomFoods(query: string, limit: number = 20): Promise<CustomFoodItem[]> {
    this.ensureInitialized();

    if (!query || query.trim().length < 2) {
      return [];
    }

    try {
      console.log(`${LOG_PREFIX} Searching custom foods: "${query}"`);

      const searchPattern = `%${query.trim().toLowerCase()}%`;

      const rows = await this.db!.getAllAsync<any>(
        `SELECT * FROM custom_foods
         WHERE LOWER(name) LIKE ?
         ORDER BY created_at DESC
         LIMIT ?`,
        [searchPattern, limit]
      );

      const foods = rows.map((row) => this.rowToCustomFood(row));
      console.log(`${LOG_PREFIX} Found ${foods.length} custom foods for "${query}"`);
      return foods;
    } catch (error) {
      console.error(`${LOG_PREFIX} Error searching custom foods:`, error);
      throw new FoodServiceError(
        'Failed to search custom foods',
        FoodServiceErrorCode.DATABASE_ERROR,
        { query, originalError: error }
      );
    }
  }

  /**
   * Update a custom food
   */
  async updateCustomFood(id: string, updates: Partial<Omit<CustomFoodItem, 'id' | 'isCustom' | 'created_at'>>): Promise<CustomFoodItem | null> {
    this.ensureInitialized();

    try {
      const existing = await this.getCustomFoodById(id);
      if (!existing) {
        return null;
      }

      const now = new Date().toISOString();

      await this.db!.runAsync(
        `UPDATE custom_foods SET
          name = ?, brand = ?, calories = ?, protein = ?, carbs = ?, fat = ?,
          fiber = ?, sugar = ?, sodium = ?, serving_size = ?, serving_unit = ?,
          updated_at = ?
         WHERE id = ?`,
        [
          updates.name ?? existing.name,
          updates.brand ?? existing.brand ?? null,
          updates.calories ?? existing.calories ?? null,
          updates.protein ?? existing.protein ?? null,
          updates.carbs ?? existing.carbs ?? null,
          updates.fat ?? existing.fat ?? null,
          updates.fiber ?? existing.fiber ?? null,
          updates.sugar ?? existing.sugar ?? null,
          updates.sodium ?? existing.sodium ?? null,
          updates.serving_size ?? existing.serving_size ?? 100,
          updates.serving_unit ?? existing.serving_unit ?? 'g',
          now,
          id,
        ]
      );

      console.log(`${LOG_PREFIX} Updated custom food: ${id}`);
      return this.getCustomFoodById(id);
    } catch (error) {
      console.error(`${LOG_PREFIX} Error updating custom food:`, error);
      throw new FoodServiceError(
        'Failed to update custom food',
        FoodServiceErrorCode.DATABASE_ERROR,
        { id, updates, originalError: error }
      );
    }
  }

  /**
   * Delete a custom food
   */
  async deleteCustomFood(id: string): Promise<boolean> {
    this.ensureInitialized();

    try {
      console.log(`${LOG_PREFIX} Deleting custom food: ${id}`);

      const result = await this.db!.runAsync(
        'DELETE FROM custom_foods WHERE id = ?',
        [id]
      );

      const deleted = result.changes > 0;
      console.log(`${LOG_PREFIX} Deleted custom food ${id}: ${deleted}`);
      return deleted;
    } catch (error) {
      console.error(`${LOG_PREFIX} Error deleting custom food:`, error);
      throw new FoodServiceError(
        'Failed to delete custom food',
        FoodServiceErrorCode.DATABASE_ERROR,
        { id, originalError: error }
      );
    }
  }

  /**
   * Get count of custom foods
   */
  async getCustomFoodCount(): Promise<number> {
    this.ensureInitialized();

    try {
      const result = await this.db!.getFirstAsync<{ count: number }>(
        'SELECT COUNT(*) as count FROM custom_foods'
      );
      return result?.count || 0;
    } catch (error) {
      console.error(`${LOG_PREFIX} Error getting custom food count:`, error);
      return 0;
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
      CREATE TABLE IF NOT EXISTS custom_foods (
        id TEXT PRIMARY KEY,
        barcode TEXT UNIQUE NOT NULL,
        name TEXT NOT NULL,
        brand TEXT,
        calories REAL,
        protein REAL,
        carbs REAL,
        fat REAL,
        fiber REAL,
        sugar REAL,
        sodium REAL,
        serving_size REAL DEFAULT 100,
        serving_unit TEXT DEFAULT 'g',
        created_at TEXT DEFAULT CURRENT_TIMESTAMP,
        updated_at TEXT DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_custom_foods_name ON custom_foods(name);
      CREATE INDEX IF NOT EXISTS idx_custom_foods_created_at ON custom_foods(created_at DESC);
      CREATE INDEX IF NOT EXISTS idx_custom_foods_barcode ON custom_foods(barcode);
    `;

    await this.db!.execAsync(createTableSQL);
    console.log(`${LOG_PREFIX} Tables created`);
  }

  /**
   * Convert database row to CustomFoodItem
   */
  private rowToCustomFood(row: any): CustomFoodItem {
    return {
      id: row.id,
      barcode: row.barcode,
      source: 'curated',
      isCustom: true,
      name: row.name,
      brand: row.brand || undefined,
      calories: row.calories || undefined,
      protein: row.protein || undefined,
      carbs: row.carbs || undefined,
      fat: row.fat || undefined,
      fiber: row.fiber || undefined,
      sugar: row.sugar || undefined,
      sodium: row.sodium || undefined,
      serving_size: row.serving_size || 100,
      serving_unit: row.serving_unit || 'g',
      created_at: row.created_at,
      updated_at: row.updated_at,
    };
  }

  /**
   * Ensure database is initialized before operations
   */
  private ensureInitialized(): void {
    if (!this.initialized || !this.db) {
      throw new FoodServiceError(
        'Custom food cache not initialized. Call initialize() first.',
        FoodServiceErrorCode.DATABASE_ERROR
      );
    }
  }

  /**
   * Convert CustomFoodItem to FoodItem for compatibility with existing code
   */
  static toFoodItem(customFood: CustomFoodItem): FoodItem {
    return {
      barcode: customFood.barcode,
      source: customFood.source,
      name: customFood.name,
      brand: customFood.brand,
      calories: customFood.calories,
      protein: customFood.protein,
      carbs: customFood.carbs,
      fat: customFood.fat,
      fiber: customFood.fiber,
      sugar: customFood.sugar,
      sodium: customFood.sodium,
      serving_size: customFood.serving_size,
      serving_unit: customFood.serving_unit,
      cache_source: 'local',
    };
  }
}

/**
 * Singleton instance for the app
 */
export const customFoodCache = new CustomFoodCache();
