/**
 * Nutrition Sync Service
 *
 * Synchronizes nutrition data between Supabase and local SQLite cache
 * Ensures data consistency and provides offline-first functionality
 */

import { supabase } from '@/lib/supabase';
import { localNutritionCache, DailyNutritionData } from './cache/LocalNutritionCache';
import { getDailySummary } from './nutritionApi';

const LOG_PREFIX = '[NutritionSync]';

export interface SyncOptions {
  force?: boolean; // Force sync even if recently synced
  daysToSync?: number; // Number of days to sync (default: 1 - only today)
}

export interface SyncResult {
  success: boolean;
  daysSynced: number;
  errors: string[];
  lastSyncDate: string;
}

export class NutritionSyncService {
  private isSyncing: boolean = false;
  private lastSyncTime: Date | null = null;
  private readonly SYNC_COOLDOWN_MS = 5 * 60 * 1000; // 5 minutes

  /**
   * Sync nutrition data from Supabase to local cache
   * Fetches last N days and caches them locally
   */
  async syncNutritionData(
    userId: string,
    options: SyncOptions = {}
  ): Promise<SyncResult> {
    const { force = false, daysToSync = 1 } = options;

    // Prevent multiple simultaneous syncs
    if (this.isSyncing) {
      console.log(`${LOG_PREFIX} Sync already in progress, skipping`);
      return {
        success: false,
        daysSynced: 0,
        errors: ['Sync already in progress'],
        lastSyncDate: this.lastSyncTime?.toISOString() || '',
      };
    }

    // Check cooldown period
    if (!force && this.lastSyncTime) {
      const timeSinceLastSync = Date.now() - this.lastSyncTime.getTime();
      if (timeSinceLastSync < this.SYNC_COOLDOWN_MS) {
        console.log(`${LOG_PREFIX} Sync cooldown active, skipping`);
        return {
          success: true,
          daysSynced: 0,
          errors: [],
          lastSyncDate: this.lastSyncTime.toISOString(),
        };
      }
    }

    this.isSyncing = true;
    const errors: string[] = [];
    let daysSynced = 0;

    try {
      console.log(`${LOG_PREFIX} Starting sync for last ${daysToSync} days`);

      // Generate date range
      const dates = this.generateDateRange(daysToSync);

      // Fetch nutrition data from Supabase for each date
      for (const date of dates) {
        try {
          const summaryData = await this.fetchDailySummary(userId, date);

          if (summaryData) {
            await localNutritionCache.cacheNutritionData(summaryData);
            daysSynced++;
          }
        } catch (error) {
          const errorMsg = `Failed to sync ${date}: ${error}`;
          console.error(`${LOG_PREFIX} ${errorMsg}`);
          errors.push(errorMsg);
        }
      }

      this.lastSyncTime = new Date();
      console.log(`${LOG_PREFIX} Sync complete: ${daysSynced}/${dates.length} days synced`);

      return {
        success: errors.length === 0,
        daysSynced,
        errors,
        lastSyncDate: this.lastSyncTime.toISOString(),
      };
    } catch (error) {
      console.error(`${LOG_PREFIX} Sync failed:`, error);
      return {
        success: false,
        daysSynced,
        errors: [error instanceof Error ? error.message : 'Unknown error'],
        lastSyncDate: this.lastSyncTime?.toISOString() || '',
      };
    } finally {
      this.isSyncing = false;
    }
  }

  /**
   * Sync a single day's nutrition data
   */
  async syncSingleDay(userId: string, date: string): Promise<boolean> {
    try {
      console.log(`${LOG_PREFIX} Syncing single day: ${date}`);

      const summaryData = await this.fetchDailySummary(userId, date);

      if (summaryData) {
        await localNutritionCache.cacheNutritionData(summaryData);
        console.log(`${LOG_PREFIX} Successfully synced ${date}`);
        return true;
      }

      console.log(`${LOG_PREFIX} No data found for ${date}`);
      return false;
    } catch (error) {
      console.error(`${LOG_PREFIX} Failed to sync ${date}:`, error);
      return false;
    }
  }

  /**
   * Get nutrition data with automatic fallback to Supabase
   * 1. Check local cache first (unless force = true)
   * 2. If not cached, fetch from Supabase and cache
   * @param force - Skip cache and force fetch from Supabase
   */
  async getNutritionData(
    userId: string,
    date: string,
    force: boolean = false
  ): Promise<DailyNutritionData | null> {
    try {
      // Try local cache first (unless forced)
      if (!force) {
        const cachedData = await localNutritionCache.getNutritionData(date);

        if (cachedData) {
          console.log(`${LOG_PREFIX} Using cached data for ${date}`);
          return cachedData;
        }
      } else {
        console.log(`${LOG_PREFIX} Force refresh requested for ${date}`);
      }

      // Not cached - fetch from Supabase and cache
      console.log(`${LOG_PREFIX} Cache miss for ${date}, fetching from Supabase`);
      const summaryData = await this.fetchDailySummary(userId, date);

      if (summaryData) {
        // Cache for next time (fire and forget)
        localNutritionCache.cacheNutritionData(summaryData).catch((error) => {
          console.warn(`${LOG_PREFIX} Failed to cache ${date}:`, error);
        });

        return summaryData;
      }

      return null;
    } catch (error) {
      console.error(`${LOG_PREFIX} Error getting nutrition data for ${date}:`, error);
      return null;
    }
  }

  /**
   * Get nutrition data for a date range with automatic fallback
   */
  async getNutritionDataRange(
    userId: string,
    startDate: string,
    endDate: string
  ): Promise<DailyNutritionData[]> {
    try {
      // Try local cache first
      const cachedData = await localNutritionCache.getNutritionDataRange(
        startDate,
        endDate
      );

      // If we have complete cached data, return it
      const expectedDays = this.getDaysBetween(startDate, endDate);
      if (cachedData.length === expectedDays) {
        console.log(`${LOG_PREFIX} Using cached data for range ${startDate} to ${endDate}`);
        return cachedData;
      }

      // Partial or no cache - sync missing days
      console.log(
        `${LOG_PREFIX} Incomplete cache (${cachedData.length}/${expectedDays} days), syncing missing data`
      );

      const dates = this.generateDateRangeCustom(startDate, endDate);
      const cachedDates = new Set(cachedData.map((d) => d.date));
      const missingDates = dates.filter((date) => !cachedDates.has(date));

      // Fetch missing dates
      for (const date of missingDates) {
        await this.syncSingleDay(userId, date);
      }

      // Return fresh data from cache
      return await localNutritionCache.getNutritionDataRange(startDate, endDate);
    } catch (error) {
      console.error(`${LOG_PREFIX} Error getting nutrition range:`, error);
      return [];
    }
  }

  /**
   * Get sync status
   */
  getSyncStatus(): {
    isSyncing: boolean;
    lastSyncTime: Date | null;
    minutesSinceLastSync: number | null;
  } {
    const minutesSinceLastSync = this.lastSyncTime
      ? Math.floor((Date.now() - this.lastSyncTime.getTime()) / 60000)
      : null;

    return {
      isSyncing: this.isSyncing,
      lastSyncTime: this.lastSyncTime,
      minutesSinceLastSync,
    };
  }

  // ========================================================================
  // PRIVATE METHODS
  // ========================================================================

  /**
   * Fetch daily summary from Supabase and convert to DailyNutritionData
   */
  private async fetchDailySummary(
    userId: string,
    date: string
  ): Promise<DailyNutritionData | null> {
    try {
      // Use the nutrition API to get daily summary
      const response = await getDailySummary(userId, date);

      if (!response.success || !response.summary) {
        return null;
      }

      const summary = response.summary;

      // Convert API response to DailyNutritionData format
      return {
        date,
        calorie_goal: summary.calories.goal,
        calories_consumed: summary.calories.consumed,
        calories_burned: summary.calories.burned,
        net_calories: summary.calories.net,
        protein_consumed: summary.macros.protein.consumed,
        protein_goal: summary.macros.protein.goal,
        carbs_consumed: summary.macros.carbs.consumed,
        carbs_goal: summary.macros.carbs.goal,
        fat_consumed: summary.macros.fat.consumed,
        fat_goal: summary.macros.fat.goal,
        fiber_consumed: summary.micronutrients?.fiber || 0,
        sugar_consumed: summary.micronutrients?.sugar || 0,
        sodium_consumed: summary.micronutrients?.sodium || 0,
        water_consumed_ml: summary.water.consumed,
        water_goal_ml: summary.water.goal,
        last_synced: new Date().toISOString(),
      };
    } catch (error) {
      console.error(`${LOG_PREFIX} Error fetching daily summary for ${date}:`, error);
      return null;
    }
  }

  /**
   * Generate array of date strings for last N days (YYYY-MM-DD format)
   */
  private generateDateRange(days: number): string[] {
    const dates: string[] = [];
    const today = new Date();

    for (let i = 0; i < days; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      dates.push(date.toISOString().split('T')[0]);
    }

    return dates;
  }

  /**
   * Generate date range between two dates
   */
  private generateDateRangeCustom(startDate: string, endDate: string): string[] {
    const dates: string[] = [];
    const start = new Date(startDate);
    const end = new Date(endDate);

    for (let date = new Date(start); date <= end; date.setDate(date.getDate() + 1)) {
      dates.push(date.toISOString().split('T')[0]);
    }

    return dates;
  }

  /**
   * Get number of days between two dates
   */
  private getDaysBetween(startDate: string, endDate: string): number {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays + 1; // Include both start and end date
  }
}

/**
 * Singleton instance for the app
 */
export const nutritionSyncService = new NutritionSyncService();

/**
 * Example usage:
 *
 * ```typescript
 * import { nutritionSyncService } from './NutritionSyncService';
 *
 * // Initialize local cache first
 * await localNutritionCache.initialize();
 *
 * // Sync last 30 days on app start
 * await nutritionSyncService.syncNutritionData(userId, { daysToSync: 30 });
 *
 * // Get today's data (auto-fetches if not cached)
 * const today = new Date().toISOString().split('T')[0];
 * const data = await nutritionSyncService.getNutritionData(userId, today);
 *
 * // Get last 7 days (auto-fetches missing days)
 * const weekData = await nutritionSyncService.getNutritionDataRange(
 *   userId,
 *   '2024-01-08',
 *   '2024-01-14'
 * );
 *
 * // Force sync (ignore cooldown)
 * await nutritionSyncService.syncNutritionData(userId, { force: true });
 *
 * // Check sync status
 * const status = nutritionSyncService.getSyncStatus();
 * console.log(`Last sync: ${status.minutesSinceLastSync} minutes ago`);
 * ```
 */
