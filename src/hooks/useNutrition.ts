/**
 * Custom Hooks for Nutrition Tracking
 * Provides data fetching, caching, and real-time subscriptions for nutrition features
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../services/supabase';
import { foodService } from '../services/FoodService';
import type {
  FoodItem,
  DiaryEntry,
  DailySummary,
  MealType
} from '../types/nutrition';

// ============================================================================
// NUTRITION SUMMARY HOOK
// ============================================================================

interface NutritionSummaryResult {
  summary: DailySummary | null;
  loading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
}

/**
 * Hook for fetching daily nutrition summary with real-time updates
 */
export function useNutritionSummary(
  userId: string,
  date: string // YYYY-MM-DD format
): NutritionSummaryResult {
  const [summary, setSummary] = useState<DailySummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchSummary = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from('daily_nutrition_summary')
        .select('*')
        .eq('user_id', userId)
        .eq('date', date)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        // PGRST116 = no rows returned (acceptable)
        throw fetchError;
      }

      setSummary(data || null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch summary'));
    } finally {
      setLoading(false);
    }
  }, [userId, date]);

  // Initial fetch
  useEffect(() => {
    fetchSummary();
  }, [fetchSummary]);

  // Real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel(`nutrition_summary_${userId}_${date}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'daily_nutrition_summary',
          filter: `user_id=eq.${userId},date=eq.${date}`,
        },
        (payload) => {
          if (payload.eventType === 'DELETE') {
            setSummary(null);
          } else {
            setSummary(payload.new as DailySummary);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, date]);

  return {
    summary,
    loading,
    error,
    refresh: fetchSummary,
  };
}

// ============================================================================
// FOOD DIARY HOOK
// ============================================================================

interface FoodDiaryResult {
  entries: DiaryEntry[];
  loading: boolean;
  error: Error | null;
  addEntry: (entry: Omit<DiaryEntry, 'id' | 'user_id' | 'created_at'>) => Promise<void>;
  updateEntry: (id: string, updates: Partial<DiaryEntry>) => Promise<void>;
  deleteEntry: (id: string) => Promise<void>;
  refresh: () => Promise<void>;
}

/**
 * Hook for managing food diary entries for a specific date
 */
export function useFoodDiary(
  userId: string,
  date: string // YYYY-MM-DD format
): FoodDiaryResult {
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchEntries = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const startOfDay = `${date}T00:00:00`;
      const endOfDay = `${date}T23:59:59`;

      const { data, error: fetchError } = await supabase
        .from('user_food_diary')
        .select('*')
        .eq('user_id', userId)
        .gte('consumed_at', startOfDay)
        .lte('consumed_at', endOfDay)
        .order('consumed_at', { ascending: false });

      if (fetchError) throw fetchError;

      setEntries(data || []);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch diary entries'));
    } finally {
      setLoading(false);
    }
  }, [userId, date]);

  // Initial fetch
  useEffect(() => {
    fetchEntries();
  }, [fetchEntries]);

  // Real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel(`food_diary_${userId}_${date}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'user_food_diary',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            setEntries((prev) => [payload.new as DiaryEntry, ...prev]);
          } else if (payload.eventType === 'UPDATE') {
            setEntries((prev) =>
              prev.map((entry) =>
                entry.id === payload.new.id ? (payload.new as DiaryEntry) : entry
              )
            );
          } else if (payload.eventType === 'DELETE') {
            setEntries((prev) => prev.filter((entry) => entry.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, date]);

  const addEntry = useCallback(
    async (entry: Omit<DiaryEntry, 'id' | 'user_id' | 'created_at'>) => {
      try {
        const { error: insertError } = await supabase
          .from('user_food_diary')
          .insert({
            ...entry,
            user_id: userId,
          });

        if (insertError) throw insertError;
      } catch (err) {
        throw err instanceof Error ? err : new Error('Failed to add diary entry');
      }
    },
    [userId]
  );

  const updateEntry = useCallback(
    async (id: string, updates: Partial<DiaryEntry>) => {
      try {
        const { error: updateError } = await supabase
          .from('user_food_diary')
          .update(updates)
          .eq('id', id)
          .eq('user_id', userId);

        if (updateError) throw updateError;
      } catch (err) {
        throw err instanceof Error ? err : new Error('Failed to update diary entry');
      }
    },
    [userId]
  );

  const deleteEntry = useCallback(
    async (id: string) => {
      try {
        const { error: deleteError } = await supabase
          .from('user_food_diary')
          .delete()
          .eq('id', id)
          .eq('user_id', userId);

        if (deleteError) throw deleteError;
      } catch (err) {
        throw err instanceof Error ? err : new Error('Failed to delete diary entry');
      }
    },
    [userId]
  );

  return {
    entries,
    loading,
    error,
    addEntry,
    updateEntry,
    deleteEntry,
    refresh: fetchEntries,
  };
}

// ============================================================================
// WATER TRACKING HOOK
// ============================================================================

interface WaterEntry {
  id: string;
  amount: number; // in ml
  consumed_at: string;
}

interface WaterTrackingResult {
  totalWater: number; // in ml
  entries: WaterEntry[];
  goal: number; // in ml
  loading: boolean;
  error: Error | null;
  addWater: (amount: number) => Promise<void>;
  refresh: () => Promise<void>;
}

/**
 * Hook for tracking water intake for a specific date
 */
export function useWaterTracking(
  userId: string,
  date: string // YYYY-MM-DD format
): WaterTrackingResult {
  const [entries, setEntries] = useState<WaterEntry[]>([]);
  const [totalWater, setTotalWater] = useState(0);
  const [goal, setGoal] = useState(2000); // Default 2L
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchWaterData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch water entries
      const startOfDay = `${date}T00:00:00`;
      const endOfDay = `${date}T23:59:59`;

      const { data: waterData, error: waterError } = await supabase
        .from('water_intake')
        .select('*')
        .eq('user_id', userId)
        .gte('consumed_at', startOfDay)
        .lte('consumed_at', endOfDay)
        .order('consumed_at', { ascending: false });

      if (waterError) throw waterError;

      const waterEntries = waterData || [];
      setEntries(waterEntries);

      // Calculate total
      const total = waterEntries.reduce((sum, entry) => sum + entry.amount, 0);
      setTotalWater(total);

      // Fetch user's water goal
      const { data: profileData, error: profileError } = await supabase
        .from('user_profiles')
        .select('water_goal')
        .eq('id', userId)
        .single();

      if (profileError && profileError.code !== 'PGRST116') {
        throw profileError;
      }

      if (profileData?.water_goal) {
        setGoal(profileData.water_goal);
      }
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch water data'));
    } finally {
      setLoading(false);
    }
  }, [userId, date]);

  // Initial fetch
  useEffect(() => {
    fetchWaterData();
  }, [fetchWaterData]);

  // Real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel(`water_intake_${userId}_${date}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'water_intake',
          filter: `user_id=eq.${userId}`,
        },
        (payload) => {
          const newEntry = payload.new as WaterEntry;
          setEntries((prev) => [newEntry, ...prev]);
          setTotalWater((prev) => prev + newEntry.amount);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, date]);

  const addWater = useCallback(
    async (amount: number) => {
      try {
        const { error: insertError } = await supabase
          .from('water_intake')
          .insert({
            user_id: userId,
            amount,
            consumed_at: new Date().toISOString(),
          });

        if (insertError) throw insertError;
      } catch (err) {
        throw err instanceof Error ? err : new Error('Failed to add water entry');
      }
    },
    [userId]
  );

  return {
    totalWater,
    entries,
    goal,
    loading,
    error,
    addWater,
    refresh: fetchWaterData,
  };
}

// ============================================================================
// FOOD SEARCH HOOK
// ============================================================================

interface FoodSearchResult {
  results: FoodItem[];
  search: (query: string) => void;
  loading: boolean;
  error: Error | null;
  reset: () => void;
}

/**
 * Hook for searching food items with debouncing and caching
 */
export function useFoodSearch(): FoodSearchResult {
  const [results, setResults] = useState<FoodItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const debounceTimer = useRef<NodeJS.Timeout | null>(null);

  const search = useCallback((query: string) => {
    // Clear previous timer
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    // Reset if query is empty
    if (!query.trim()) {
      setResults([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);

    // Debounce search by 300ms
    debounceTimer.current = setTimeout(async () => {
      try {
        const searchResults = await foodService.searchFoods(query);
        setResults(searchResults.items);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Search failed'));
        setResults([]);
      } finally {
        setLoading(false);
      }
    }, 300);
  }, []);

  const reset = useCallback(() => {
    setResults([]);
    setLoading(false);
    setError(null);
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }
    };
  }, []);

  return {
    results,
    search,
    loading,
    error,
    reset,
  };
}

// ============================================================================
// BARCODE SCANNER HOOK
// ============================================================================

interface BarcodeScannerResult {
  food: FoodItem | null;
  scan: (barcode: string) => Promise<void>;
  loading: boolean;
  error: Error | null;
  reset: () => void;
}

/**
 * Hook for scanning barcodes and fetching food data
 */
export function useBarcodeScanner(): BarcodeScannerResult {
  const [food, setFood] = useState<FoodItem | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  const scan = useCallback(async (barcode: string) => {
    try {
      setLoading(true);
      setError(null);
      setFood(null);

      const foodItem = await foodService.getFoodByBarcode(barcode);
      setFood(foodItem);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Barcode scan failed'));
      setFood(null);
    } finally {
      setLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setFood(null);
    setLoading(false);
    setError(null);
  }, []);

  return {
    food,
    scan,
    loading,
    error,
    reset,
  };
}
