/**
 * useLocalNutrition Hook
 *
 * React hook for accessing cached nutrition data with automatic sync
 * Provides offline-first functionality with Supabase fallback
 */

import { useState, useEffect, useCallback } from 'react';
import { nutritionSyncService } from '../services/NutritionSyncService';
import { DailyNutritionData } from '../services/cache/LocalNutritionCache';
import { supabase } from '../lib/supabase';

export interface UseLocalNutritionOptions {
  autoSync?: boolean; // Auto-sync on mount (default: true)
  syncInterval?: number; // Auto-sync interval in minutes (default: 10)
  daysToSync?: number; // Number of days to sync (default: 1 - only today)
}

export interface UseLocalNutritionReturn {
  // Single day data
  data: DailyNutritionData | null;
  loading: boolean;
  error: string | null;

  // Range data
  rangeData: DailyNutritionData[];
  rangeLoading: boolean;

  // Sync status
  isSyncing: boolean;
  lastSyncTime: Date | null;
  minutesSinceLastSync: number | null;

  // Methods
  refreshData: () => Promise<void>;
  syncNow: (force?: boolean) => Promise<void>;
  getNutritionForDate: (date: string) => Promise<DailyNutritionData | null>;
  getNutritionRange: (startDate: string, endDate: string) => Promise<DailyNutritionData[]>;
}

/**
 * Hook for single day nutrition data
 */
export function useLocalNutrition(
  date: string,
  options: UseLocalNutritionOptions = {}
): UseLocalNutritionReturn {
  const {
    autoSync = true,
    syncInterval = 10,
    daysToSync = 1,
  } = options;

  const [userId, setUserId] = useState<string | null>(null);
  const [data, setData] = useState<DailyNutritionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rangeData, setRangeData] = useState<DailyNutritionData[]>([]);
  const [rangeLoading, setRangeLoading] = useState(false);

  const syncStatus = nutritionSyncService.getSyncStatus();

  // Get user ID from Supabase auth
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUserId(user?.id || null);
    });
  }, []);

  /**
   * Fetch nutrition data for the specified date
   */
  const fetchData = useCallback(async () => {
    if (!userId) {
      setError('User not logged in');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const nutritionData = await nutritionSyncService.getNutritionData(
        userId,
        date
      );

      setData(nutritionData);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to fetch nutrition data';
      setError(errorMsg);
      console.error('[useLocalNutrition] Error:', err);
    } finally {
      setLoading(false);
    }
  }, [userId, date]);

  /**
   * Sync nutrition data from Supabase
   */
  const syncNow = useCallback(
    async (force: boolean = false) => {
      if (!userId) return;

      try {
        await nutritionSyncService.syncNutritionData(userId, {
          force,
          daysToSync,
        });

        // Refresh current data after sync
        await fetchData();
      } catch (err) {
        console.error('[useLocalNutrition] Sync error:', err);
      }
    },
    [userId, daysToSync, fetchData]
  );

  /**
   * Get nutrition data for a specific date
   */
  const getNutritionForDate = useCallback(
    async (targetDate: string): Promise<DailyNutritionData | null> => {
      if (!userId) return null;

      try {
        return await nutritionSyncService.getNutritionData(userId, targetDate);
      } catch (err) {
        console.error('[useLocalNutrition] Error getting date:', err);
        return null;
      }
    },
    [userId]
  );

  /**
   * Get nutrition data for a date range
   */
  const getNutritionRange = useCallback(
    async (startDate: string, endDate: string): Promise<DailyNutritionData[]> => {
      if (!userId) return [];

      try {
        setRangeLoading(true);

        const data = await nutritionSyncService.getNutritionDataRange(
          userId,
          startDate,
          endDate
        );

        setRangeData(data);
        return data;
      } catch (err) {
        console.error('[useLocalNutrition] Error getting range:', err);
        return [];
      } finally {
        setRangeLoading(false);
      }
    },
    [userId]
  );

  /**
   * Refresh current data
   */
  const refreshData = useCallback(async () => {
    await fetchData();
  }, [fetchData]);

  // Initial load and auto-sync
  useEffect(() => {
    if (userId) {
      // Initial load
      fetchData();

      // Auto-sync on mount
      if (autoSync) {
        syncNow(false).catch(console.error);
      }
    }
  }, [userId, date, autoSync, fetchData, syncNow]);

  // Auto-sync interval
  useEffect(() => {
    if (!autoSync || !userId) return;

    const interval = setInterval(
      () => {
        syncNow(false).catch(console.error);
      },
      syncInterval * 60 * 1000
    );

    return () => clearInterval(interval);
  }, [autoSync, syncInterval, userId, syncNow]);

  return {
    data,
    loading,
    error,
    rangeData,
    rangeLoading,
    isSyncing: syncStatus.isSyncing,
    lastSyncTime: syncStatus.lastSyncTime,
    minutesSinceLastSync: syncStatus.minutesSinceLastSync,
    refreshData,
    syncNow,
    getNutritionForDate,
    getNutritionRange,
  };
}

/**
 * Hook for last N days nutrition data
 */
export function useLastNDaysNutrition(
  days: number = 7,
  options: UseLocalNutritionOptions = {}
): Omit<UseLocalNutritionReturn, 'data'> & { data: DailyNutritionData[] } {
  const { autoSync = true, syncInterval = 10, daysToSync = 1 } = options;

  const [userId, setUserId] = useState<string | null>(null);
  const [data, setData] = useState<DailyNutritionData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [rangeData, setRangeData] = useState<DailyNutritionData[]>([]);
  const [rangeLoading, setRangeLoading] = useState(false);

  const syncStatus = nutritionSyncService.getSyncStatus();

  // Get user ID from Supabase auth
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUserId(user?.id || null);
    });
  }, []);

  /**
   * Fetch last N days
   */
  const fetchData = useCallback(async () => {
    if (!userId) {
      setError('User not logged in');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Calculate date range
      const endDate = new Date().toISOString().split('T')[0];
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - (days - 1));
      const startDateStr = startDate.toISOString().split('T')[0];

      const nutritionData = await nutritionSyncService.getNutritionDataRange(
        userId,
        startDateStr,
        endDate
      );

      setData(nutritionData);
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to fetch nutrition data';
      setError(errorMsg);
      console.error('[useLastNDaysNutrition] Error:', err);
    } finally {
      setLoading(false);
    }
  }, [userId, days]);

  /**
   * Sync nutrition data
   */
  const syncNow = useCallback(
    async (force: boolean = false) => {
      if (!userId) return;

      try {
        await nutritionSyncService.syncNutritionData(userId, {
          force,
          daysToSync,
        });

        await fetchData();
      } catch (err) {
        console.error('[useLastNDaysNutrition] Sync error:', err);
      }
    },
    [userId, daysToSync, fetchData]
  );

  /**
   * Get nutrition for specific date
   */
  const getNutritionForDate = useCallback(
    async (targetDate: string): Promise<DailyNutritionData | null> => {
      if (!userId) return null;

      try {
        return await nutritionSyncService.getNutritionData(userId, targetDate);
      } catch (err) {
        console.error('[useLastNDaysNutrition] Error getting date:', err);
        return null;
      }
    },
    [userId]
  );

  /**
   * Get nutrition range
   */
  const getNutritionRange = useCallback(
    async (startDate: string, endDate: string): Promise<DailyNutritionData[]> => {
      if (!userId) return [];

      try {
        setRangeLoading(true);

        const data = await nutritionSyncService.getNutritionDataRange(
          userId,
          startDate,
          endDate
        );

        setRangeData(data);
        return data;
      } catch (err) {
        console.error('[useLastNDaysNutrition] Error getting range:', err);
        return [];
      } finally {
        setRangeLoading(false);
      }
    },
    [userId]
  );

  const refreshData = useCallback(async () => {
    await fetchData();
  }, [fetchData]);

  // Initial load and auto-sync
  useEffect(() => {
    if (userId) {
      fetchData();

      if (autoSync) {
        syncNow(false).catch(console.error);
      }
    }
  }, [userId, days, autoSync, fetchData, syncNow]);

  // Auto-sync interval
  useEffect(() => {
    if (!autoSync || !userId) return;

    const interval = setInterval(
      () => {
        syncNow(false).catch(console.error);
      },
      syncInterval * 60 * 1000
    );

    return () => clearInterval(interval);
  }, [autoSync, syncInterval, userId, syncNow]);

  return {
    data,
    loading,
    error,
    rangeData,
    rangeLoading,
    isSyncing: syncStatus.isSyncing,
    lastSyncTime: syncStatus.lastSyncTime,
    minutesSinceLastSync: syncStatus.minutesSinceLastSync,
    refreshData,
    syncNow,
    getNutritionForDate,
    getNutritionRange,
  };
}

/**
 * Example usage:
 *
 * ```typescript
 * // Single day
 * function TodayNutrition() {
 *   const today = new Date().toISOString().split('T')[0];
 *   const { data, loading, error, refreshData } = useLocalNutrition(today);
 *
 *   if (loading) return <ActivityIndicator />;
 *   if (error) return <Text>Error: {error}</Text>;
 *   if (!data) return <Text>No data</Text>;
 *
 *   return (
 *     <View>
 *       <Text>Calories: {data.calories_consumed} / {data.calorie_goal}</Text>
 *       <Button onPress={refreshData}>Refresh</Button>
 *     </View>
 *   );
 * }
 *
 * // Last 7 days
 * function WeekNutrition() {
 *   const { data, loading, syncNow } = useLastNDaysNutrition(7);
 *
 *   return (
 *     <View>
 *       {data.map((day) => (
 *         <Text key={day.date}>
 *           {day.date}: {day.calories_consumed} cal
 *         </Text>
 *       ))}
 *       <Button onPress={() => syncNow(true)}>Force Sync</Button>
 *     </View>
 *   );
 * }
 * ```
 */
