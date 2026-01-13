/**
 * React Hook for Supplement Recommendations
 *
 * Provides reactive supplement recommendations that update when relevant data changes.
 * Includes caching, loading states, and automatic refresh triggers.
 */

import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import {
  RecommendationResult,
  RecommendationConfig,
  SupplementRecommendation,
  DataCompleteness,
} from '../services/supplements/types';
import {
  generateRecommendations,
  getTopRecommendations,
  getRecommendationsByTargetArea,
  formatMatchScore,
  getScoreColor,
} from '../services/supplements/recommendationEngine';
import {
  aggregateUserData,
  analyzeDataCompleteness,
} from '../services/supplements/dataAggregator';
import { supabase } from '../lib/supabase';
import { profileEvents } from '../services/ProfileEventEmitter';

// ============================================================================
// TYPES
// ============================================================================

export interface UseSupplementRecommendationsOptions {
  /** User ID to fetch recommendations for */
  userId: string | null;
  /** Enable automatic updates when data changes */
  autoRefresh?: boolean;
  /** Minimum score threshold (default: 60) */
  minScoreThreshold?: number;
  /** Maximum recommendations to show (default: 25) */
  maxRecommendations?: number;
  /** Days to average for daily data (default: 14) */
  averageDays?: number;
  /** Debounce time for updates in ms (default: 2000) */
  debounceMs?: number;
}

export interface UseSupplementRecommendationsResult {
  /** Current recommendations */
  recommendations: SupplementRecommendation[];
  /** Top N recommendations */
  topRecommendations: SupplementRecommendation[];
  /** Full result including metadata */
  fullResult: RecommendationResult | null;
  /** Data completeness info */
  dataCompleteness: DataCompleteness | null;
  /** Whether recommendations are being loaded */
  isLoading: boolean;
  /** Whether recommendations are being refreshed in background */
  isRefreshing: boolean;
  /** Error if any */
  error: Error | null;
  /** Warnings about data quality */
  warnings: string[];
  /** Suggestions for improving recommendations */
  suggestions: string[];
  /** Manually trigger refresh */
  refresh: () => Promise<void>;
  /** Get recommendations by target area */
  getByTargetArea: (targetArea: string) => SupplementRecommendation[];
  /** Last update timestamp */
  lastUpdated: Date | null;
  /** Data hash for change detection */
  dataHash: string | null;
}

// ============================================================================
// HOOK IMPLEMENTATION
// ============================================================================

export const useSupplementRecommendations = (
  options: UseSupplementRecommendationsOptions
): UseSupplementRecommendationsResult => {
  const {
    userId,
    autoRefresh = true,
    minScoreThreshold = 60,
    maxRecommendations = 25,
    averageDays = 14,
    debounceMs = 2000,
  } = options;

  // State
  const [result, setResult] = useState<RecommendationResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

  // Refs for debouncing and tracking
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const lastDataHashRef = useRef<string | null>(null);
  const isMountedRef = useRef(true);
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);

  // Config for recommendation engine
  const config: Partial<RecommendationConfig> = useMemo(() => ({
    minScoreThreshold,
    maxRecommendations,
    averageDaysForDailyData: averageDays,
  }), [minScoreThreshold, maxRecommendations, averageDays]);

  // -------------------------------------------------------------------------
  // Core Functions
  // -------------------------------------------------------------------------

  /**
   * Fetch and generate recommendations
   */
  const fetchRecommendations = useCallback(async (
    showLoadingState: boolean = true
  ): Promise<void> => {
    if (!userId) return;

    try {
      if (showLoadingState) {
        setIsLoading(true);
      } else {
        setIsRefreshing(true);
      }
      setError(null);

      const newResult = await generateRecommendations(userId, config);

      if (isMountedRef.current) {
        // Check if data actually changed
        if (newResult.dataHash !== lastDataHashRef.current) {
          lastDataHashRef.current = newResult.dataHash;
          setResult(newResult);
          setLastUpdated(new Date());
        }
      }
    } catch (err) {
      if (isMountedRef.current) {
        console.error('[useSupplementRecommendations] Error fetching recommendations:', err);
        setError(err instanceof Error ? err : new Error('Unknown error'));
      }
    } finally {
      if (isMountedRef.current) {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    }
  }, [userId, config]);

  /**
   * Debounced refresh function
   */
  const debouncedRefresh = useCallback(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      fetchRecommendations(false);
    }, debounceMs);
  }, [fetchRecommendations, debounceMs]);

  /**
   * Manual refresh function
   */
  const refresh = useCallback(async () => {
    await fetchRecommendations(true);
  }, [fetchRecommendations]);

  // -------------------------------------------------------------------------
  // Subscription Effects
  // -------------------------------------------------------------------------

  /**
   * Initial fetch
   */
  useEffect(() => {
    if (userId) {
      fetchRecommendations(true);
    }
  }, [userId]); // Only re-fetch when userId changes

  /**
   * Profile change subscription
   */
  useEffect(() => {
    if (!userId || !autoRefresh) return;

    // Subscribe to profile updates - any profile update triggers a refresh
    // since supplement recommendations depend on many profile fields
    const unsubscribe = profileEvents.on('updated', (data) => {
      if (data.userId === userId) {
        console.log('[useSupplementRecommendations] Profile updated, refreshing...');
        debouncedRefresh();
      }
    });

    return () => {
      unsubscribe();
    };
  }, [userId, autoRefresh, debouncedRefresh]);

  /**
   * Supabase realtime subscription for recovery logs
   */
  useEffect(() => {
    if (!userId || !autoRefresh) return;

    const channel = supabase
      .channel(`recovery_log_${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'daily_recovery_log',
          filter: `user_id=eq.${userId}`,
        },
        () => {
          console.log('[useSupplementRecommendations] Recovery log changed, refreshing...');
          debouncedRefresh();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, autoRefresh, debouncedRefresh]);

  /**
   * Supabase realtime subscription for nutrition data
   */
  useEffect(() => {
    if (!userId || !autoRefresh) return;

    const channel = supabase
      .channel(`nutrition_${userId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'daily_nutrition_summary',
          filter: `user_id=eq.${userId}`,
        },
        () => {
          console.log('[useSupplementRecommendations] Nutrition data changed, refreshing...');
          debouncedRefresh();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, autoRefresh, debouncedRefresh]);

  /**
   * App state change handler (refresh on foreground)
   */
  useEffect(() => {
    if (!userId || !autoRefresh) return;

    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (
        appStateRef.current.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        // App came to foreground, check for stale data
        const minutesSinceLastUpdate = lastUpdated
          ? (Date.now() - lastUpdated.getTime()) / 1000 / 60
          : Infinity;

        if (minutesSinceLastUpdate > 15) {
          console.log('[useSupplementRecommendations] App foregrounded after 15+ minutes, refreshing...');
          fetchRecommendations(false);
        }
      }
      appStateRef.current = nextAppState;
    };

    const subscription = AppState.addEventListener('change', handleAppStateChange);

    return () => {
      subscription.remove();
    };
  }, [userId, autoRefresh, lastUpdated, fetchRecommendations]);

  /**
   * Cleanup on unmount
   */
  useEffect(() => {
    isMountedRef.current = true;

    return () => {
      isMountedRef.current = false;
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  // -------------------------------------------------------------------------
  // Derived Values
  // -------------------------------------------------------------------------

  const recommendations = useMemo(
    () => result?.recommendations || [],
    [result]
  );

  const topRecommendations = useMemo(
    () => getTopRecommendations(result || { recommendations: [] } as any, 5),
    [result]
  );

  const dataCompleteness = useMemo(
    () => result?.dataCompleteness || null,
    [result]
  );

  const warnings = useMemo(
    () => result?.warnings || [],
    [result]
  );

  const suggestions = useMemo(
    () => result?.suggestions || [],
    [result]
  );

  const dataHash = useMemo(
    () => result?.dataHash || null,
    [result]
  );

  const getByTargetArea = useCallback(
    (targetArea: string) => {
      if (!result) return [];
      return getRecommendationsByTargetArea(result, targetArea);
    },
    [result]
  );

  // -------------------------------------------------------------------------
  // Return
  // -------------------------------------------------------------------------

  return {
    recommendations,
    topRecommendations,
    fullResult: result,
    dataCompleteness,
    isLoading,
    isRefreshing,
    error,
    warnings,
    suggestions,
    refresh,
    getByTargetArea,
    lastUpdated,
    dataHash,
  };
};

// ============================================================================
// UTILITY HOOKS
// ============================================================================

/**
 * Hook for getting a single supplement recommendation
 */
export const useSupplementRecommendation = (
  userId: string | null,
  supplementId: string
): {
  recommendation: SupplementRecommendation | null;
  isLoading: boolean;
  error: Error | null;
} => {
  const { recommendations, isLoading, error } = useSupplementRecommendations({
    userId,
    autoRefresh: true,
    minScoreThreshold: 0, // Get all supplements
  });

  const recommendation = useMemo(
    () => recommendations.find((r) => r.supplement.id === supplementId) || null,
    [recommendations, supplementId]
  );

  return { recommendation, isLoading, error };
};

/**
 * Hook for data completeness only (lighter weight)
 */
export const useSupplementDataCompleteness = (
  userId: string | null
): {
  completeness: DataCompleteness | null;
  isLoading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
} => {
  const [completeness, setCompleteness] = useState<DataCompleteness | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const fetchCompleteness = useCallback(async () => {
    if (!userId) return;

    try {
      setIsLoading(true);
      setError(null);

      const userData = await aggregateUserData(userId);
      const analysis = analyzeDataCompleteness(userData);
      setCompleteness(analysis);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchCompleteness();
  }, [fetchCompleteness]);

  return {
    completeness,
    isLoading,
    error,
    refresh: fetchCompleteness,
  };
};

// ============================================================================
// EXPORTS
// ============================================================================

export { formatMatchScore, getScoreColor };
