/**
 * Local SQLite Profile Cache Service
 *
 * Permanently caches user profile data for instant offline access
 * Updates only when profile is modified
 *
 * SETUP REQUIRED:
 * Install expo-sqlite: npm install expo-sqlite
 */

import * as SQLite from 'expo-sqlite';

const LOG_PREFIX = '[LocalProfileCache]';
const DB_NAME = 'food_cache.db'; // Reuse same DB as food & nutrition cache

export interface UserProfile {
  id: string;

  // Basic Info
  username: string | null;
  profile_image_url: string | null;

  // Physical Stats
  age: number | null;
  weight: number | null;
  height: number | null;
  gender: 'male' | 'female' | 'other' | null;
  body_fat_percentage: number | null;

  // Fitness Info
  fitness_level: 'beginner' | 'intermediate' | 'advanced' | null;
  training_experience_months: number | null;
  available_training_days: number | null;
  preferred_training_days: number[] | null;
  primary_goal: 'strength' | 'hypertrophy' | 'endurance' | 'weight_loss' | 'general_fitness' | null;

  // Lifestyle
  sleep_hours_avg: number | null;
  stress_level: number | null;
  pal_factor: number | null;

  // Equipment
  has_gym_access: boolean | null;
  home_equipment: string[] | null;

  // Goals
  target_weight_kg: number | null;
  target_date: string | null;

  // Settings
  onboarding_completed: boolean;
  enable_daily_recovery_tracking: boolean;

  // Supplement Onboarding Data
  supplement_onboarding_completed: boolean;
  gi_issues: Array<'bloating' | 'irritable_bowel' | 'diarrhea' | 'constipation'> | null;
  heavy_sweating: boolean | null;
  high_salt_intake: boolean | null;
  joint_issues: Array<'knee' | 'tendons' | 'shoulder' | 'back'> | null;
  lab_values: {
    hemoglobin?: number | null;
    mcv?: number | null;
    vitamin_d?: number | null;
    crp?: number | null;
    alt?: number | null;
    ggt?: number | null;
    estradiol?: number | null;
    testosterone?: number | null;
  } | null;

  // Timestamps
  created_at: string;
  updated_at: string;
  cached_at: string; // When was this cached locally
}

export class LocalProfileCache {
  private db: SQLite.SQLiteDatabase | null = null;
  private initialized: boolean = false;

  /**
   * Initialize the SQLite database and create profile table
   * Call this once when the app starts
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

      // Create profile table
      await this.createProfileTable();

      this.initialized = true;
      console.log(`${LOG_PREFIX} Successfully initialized`);
    } catch (error) {
      console.error(`${LOG_PREFIX} Initialization failed:`, error);
      throw new Error(`Failed to initialize local profile cache: ${error}`);
    }
  }

  /**
   * Get cached profile for a user
   * Returns null if not cached
   */
  async getProfile(userId: string): Promise<UserProfile | null> {
    this.ensureInitialized();

    try {
      console.log(`${LOG_PREFIX} Looking up profile for user: ${userId}`);

      const result = await this.db!.getFirstAsync<any>(
        'SELECT * FROM user_profile_cache WHERE id = ?',
        [userId]
      );

      if (!result) {
        console.log(`${LOG_PREFIX} Cache miss for user ${userId}`);
        return null;
      }

      console.log(`${LOG_PREFIX} Cache hit for user ${userId}`);
      return this.rowToProfile(result);
    } catch (error) {
      console.error(`${LOG_PREFIX} Error getting profile:`, error);
      return null;
    }
  }

  /**
   * Cache or update user profile
   * Replaces existing profile if already cached
   */
  async cacheProfile(profile: UserProfile): Promise<void> {
    this.ensureInitialized();

    try {
      console.log(`${LOG_PREFIX} Caching profile for user: ${profile.id}`);

      await this.db!.runAsync(
        `INSERT OR REPLACE INTO user_profile_cache (
          id, username, profile_image_url,
          age, weight, height, gender, body_fat_percentage,
          fitness_level, training_experience_months, available_training_days,
          preferred_training_days, primary_goal,
          sleep_hours_avg, stress_level, pal_factor,
          has_gym_access, home_equipment,
          target_weight_kg, target_date,
          onboarding_completed, enable_daily_recovery_tracking,
          supplement_onboarding_completed, gi_issues, heavy_sweating, high_salt_intake, joint_issues, lab_values,
          created_at, updated_at, cached_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          profile.id,
          profile.username,
          profile.profile_image_url,
          profile.age,
          profile.weight,
          profile.height,
          profile.gender,
          profile.body_fat_percentage,
          profile.fitness_level,
          profile.training_experience_months,
          profile.available_training_days,
          profile.preferred_training_days ? JSON.stringify(profile.preferred_training_days) : null,
          profile.primary_goal,
          profile.sleep_hours_avg,
          profile.stress_level,
          profile.pal_factor,
          profile.has_gym_access ? 1 : 0,
          profile.home_equipment ? JSON.stringify(profile.home_equipment) : null,
          profile.target_weight_kg,
          profile.target_date,
          profile.onboarding_completed ? 1 : 0,
          profile.enable_daily_recovery_tracking ? 1 : 0,
          profile.supplement_onboarding_completed ? 1 : 0,
          profile.gi_issues ? JSON.stringify(profile.gi_issues) : null,
          profile.heavy_sweating === null ? null : profile.heavy_sweating ? 1 : 0,
          profile.high_salt_intake === null ? null : profile.high_salt_intake ? 1 : 0,
          profile.joint_issues ? JSON.stringify(profile.joint_issues) : null,
          profile.lab_values ? JSON.stringify(profile.lab_values) : null,
          profile.created_at,
          profile.updated_at,
          new Date().toISOString(),
        ]
      );

      console.log(`${LOG_PREFIX} Successfully cached profile for ${profile.id}`);
    } catch (error) {
      console.error(`${LOG_PREFIX} Error caching profile:`, error);
      throw error;
    }
  }

  /**
   * Update specific fields of cached profile
   * Useful for partial updates
   */
  async updateProfileFields(
    userId: string,
    fields: Partial<Omit<UserProfile, 'id' | 'created_at' | 'cached_at'>>
  ): Promise<void> {
    this.ensureInitialized();

    try {
      console.log(`${LOG_PREFIX} Updating profile fields for user: ${userId}`);

      // Get existing profile
      const existingProfile = await this.getProfile(userId);
      if (!existingProfile) {
        throw new Error('Profile not cached - cannot update fields');
      }

      // Merge with new fields
      const updatedProfile: UserProfile = {
        ...existingProfile,
        ...fields,
        updated_at: new Date().toISOString(),
      };

      // Cache updated profile
      await this.cacheProfile(updatedProfile);

      console.log(`${LOG_PREFIX} Successfully updated profile fields for ${userId}`);
    } catch (error) {
      console.error(`${LOG_PREFIX} Error updating profile fields:`, error);
      throw error;
    }
  }

  /**
   * Delete cached profile for a user
   */
  async deleteProfile(userId: string): Promise<void> {
    this.ensureInitialized();

    try {
      console.log(`${LOG_PREFIX} Deleting cached profile for user: ${userId}`);

      await this.db!.runAsync(
        'DELETE FROM user_profile_cache WHERE id = ?',
        [userId]
      );

      console.log(`${LOG_PREFIX} Profile deleted for ${userId}`);
    } catch (error) {
      console.error(`${LOG_PREFIX} Error deleting profile:`, error);
      throw error;
    }
  }

  /**
   * Check if profile is cached
   */
  async isProfileCached(userId: string): Promise<boolean> {
    this.ensureInitialized();

    try {
      const result = await this.db!.getFirstAsync<{ count: number }>(
        'SELECT COUNT(*) as count FROM user_profile_cache WHERE id = ?',
        [userId]
      );

      return (result?.count || 0) > 0;
    } catch (error) {
      console.error(`${LOG_PREFIX} Error checking if cached:`, error);
      return false;
    }
  }

  /**
   * Get cache metadata (when was profile last cached)
   */
  async getCacheMetadata(userId: string): Promise<{
    cached_at: string | null;
    updated_at: string | null;
  }> {
    this.ensureInitialized();

    try {
      const result = await this.db!.getFirstAsync<any>(
        'SELECT cached_at, updated_at FROM user_profile_cache WHERE id = ?',
        [userId]
      );

      return {
        cached_at: result?.cached_at || null,
        updated_at: result?.updated_at || null,
      };
    } catch (error) {
      console.error(`${LOG_PREFIX} Error getting cache metadata:`, error);
      return { cached_at: null, updated_at: null };
    }
  }

  /**
   * Clear entire profile cache (use with caution!)
   */
  async clearCache(): Promise<void> {
    this.ensureInitialized();

    try {
      console.log(`${LOG_PREFIX} Clearing entire profile cache`);
      await this.db!.runAsync('DELETE FROM user_profile_cache');
      console.log(`${LOG_PREFIX} Profile cache cleared`);
    } catch (error) {
      console.error(`${LOG_PREFIX} Error clearing cache:`, error);
      throw error;
    }
  }

  // ========================================================================
  // PRIVATE METHODS
  // ========================================================================

  /**
   * Create profile cache table and run migrations
   */
  private async createProfileTable(): Promise<void> {
    const createTableSQL = `
      CREATE TABLE IF NOT EXISTS user_profile_cache (
        id TEXT PRIMARY KEY,

        -- Basic Info
        username TEXT,
        profile_image_url TEXT,

        -- Physical Stats
        age INTEGER,
        weight REAL,
        height REAL,
        gender TEXT,
        body_fat_percentage REAL,

        -- Fitness Info
        fitness_level TEXT,
        training_experience_months INTEGER,
        available_training_days INTEGER,
        preferred_training_days TEXT,
        primary_goal TEXT,

        -- Lifestyle
        sleep_hours_avg REAL,
        stress_level INTEGER,
        pal_factor REAL,

        -- Equipment
        has_gym_access INTEGER,
        home_equipment TEXT,

        -- Goals
        target_weight_kg REAL,
        target_date TEXT,

        -- Settings
        onboarding_completed INTEGER NOT NULL DEFAULT 0,
        enable_daily_recovery_tracking INTEGER NOT NULL DEFAULT 0,

        -- Supplement Onboarding Data
        supplement_onboarding_completed INTEGER NOT NULL DEFAULT 0,
        gi_issues TEXT,
        heavy_sweating INTEGER,
        high_salt_intake INTEGER,
        joint_issues TEXT,
        lab_values TEXT,

        -- Timestamps
        created_at TEXT NOT NULL,
        updated_at TEXT NOT NULL,
        cached_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      );

      CREATE INDEX IF NOT EXISTS idx_profile_cached_at ON user_profile_cache(cached_at DESC);
      CREATE INDEX IF NOT EXISTS idx_profile_updated_at ON user_profile_cache(updated_at DESC);
    `;

    await this.db!.execAsync(createTableSQL);
    console.log(`${LOG_PREFIX} Profile table created`);

    // Run migrations for existing tables
    await this.migrateSupplementColumns();
  }

  /**
   * Migrate supplement columns to existing table
   * SQLite doesn't support IF NOT EXISTS for columns, so we check first
   */
  private async migrateSupplementColumns(): Promise<void> {
    try {
      // Check if supplement_onboarding_completed column exists
      const tableInfo = await this.db!.getAllAsync<{ name: string }>(
        "PRAGMA table_info(user_profile_cache)"
      );

      const columnNames = tableInfo.map((col) => col.name);

      // Add missing supplement columns
      const supplementColumns = [
        { name: 'supplement_onboarding_completed', definition: 'INTEGER DEFAULT 0' },
        { name: 'gi_issues', definition: 'TEXT' },
        { name: 'heavy_sweating', definition: 'INTEGER' },
        { name: 'high_salt_intake', definition: 'INTEGER' },
        { name: 'joint_issues', definition: 'TEXT' },
        { name: 'lab_values', definition: 'TEXT' },
      ];

      for (const column of supplementColumns) {
        if (!columnNames.includes(column.name)) {
          console.log(`${LOG_PREFIX} Adding column: ${column.name}`);
          await this.db!.execAsync(
            `ALTER TABLE user_profile_cache ADD COLUMN ${column.name} ${column.definition}`
          );
        }
      }

      console.log(`${LOG_PREFIX} Supplement columns migration complete`);
    } catch (error) {
      console.error(`${LOG_PREFIX} Error migrating supplement columns:`, error);
      // Don't throw - table might be freshly created with all columns
    }
  }

  /**
   * Convert database row to UserProfile
   */
  private rowToProfile(row: any): UserProfile {
    return {
      id: row.id,
      username: row.username || null,
      profile_image_url: row.profile_image_url || null,
      age: row.age || null,
      weight: row.weight || null,
      height: row.height || null,
      gender: row.gender || null,
      body_fat_percentage: row.body_fat_percentage || null,
      fitness_level: row.fitness_level || null,
      training_experience_months: row.training_experience_months || null,
      available_training_days: row.available_training_days || null,
      preferred_training_days: row.preferred_training_days
        ? JSON.parse(row.preferred_training_days)
        : null,
      primary_goal: row.primary_goal || null,
      sleep_hours_avg: row.sleep_hours_avg || null,
      stress_level: row.stress_level || null,
      pal_factor: row.pal_factor || null,
      has_gym_access: row.has_gym_access === 1,
      home_equipment: row.home_equipment ? JSON.parse(row.home_equipment) : null,
      target_weight_kg: row.target_weight_kg || null,
      target_date: row.target_date || null,
      onboarding_completed: row.onboarding_completed === 1,
      enable_daily_recovery_tracking: row.enable_daily_recovery_tracking === 1,
      supplement_onboarding_completed: row.supplement_onboarding_completed === 1,
      gi_issues: row.gi_issues ? JSON.parse(row.gi_issues) : null,
      heavy_sweating: row.heavy_sweating === null ? null : row.heavy_sweating === 1,
      high_salt_intake: row.high_salt_intake === null ? null : row.high_salt_intake === 1,
      joint_issues: row.joint_issues ? JSON.parse(row.joint_issues) : null,
      lab_values: row.lab_values ? JSON.parse(row.lab_values) : null,
      created_at: row.created_at,
      updated_at: row.updated_at,
      cached_at: row.cached_at,
    };
  }

  /**
   * Ensure database is initialized before operations
   */
  private ensureInitialized(): void {
    if (!this.initialized || !this.db) {
      throw new Error(
        'LocalProfileCache not initialized. Call initialize() first.'
      );
    }
  }
}

/**
 * Singleton instance for the app
 */
export const localProfileCache = new LocalProfileCache();

/**
 * Example usage:
 *
 * ```typescript
 * import { localProfileCache } from './LocalProfileCache';
 *
 * // Initialize on app start
 * await localProfileCache.initialize();
 *
 * // Get cached profile
 * const profile = await localProfileCache.getProfile(userId);
 *
 * // Cache profile after fetching from Supabase
 * await localProfileCache.cacheProfile(userProfile);
 *
 * // Update specific fields
 * await localProfileCache.updateProfileFields(userId, {
 *   weight: 75.5,
 *   profile_image_url: 'https://...',
 * });
 *
 * // Check if cached
 * const isCached = await localProfileCache.isProfileCached(userId);
 *
 * // Get cache metadata
 * const metadata = await localProfileCache.getCacheMetadata(userId);
 * console.log(`Cached at: ${metadata.cached_at}`);
 * ```
 */
