/**
 * Nutrition API Service
 * Wrapper für Supabase Edge Functions
 */

import { supabase } from '@/lib/supabase';
import { localFoodCache } from './cache/LocalFoodCache';

const FUNCTIONS_URL = 'https://wnbxenverpjyyfsyevyj.supabase.co/functions/v1';

/**
 * Food Search - Sucht Lebensmittel in lokaler DB und Open Food Facts
 */
export async function searchFood(query: string, limit = 10) {
  const response = await fetch(`${FUNCTIONS_URL}/food-search`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query, limit }),
  });

  if (!response.ok) {
    throw new Error(`Food search failed: ${response.statusText}`);
  }

  return await response.json();
}

/**
 * Barcode Scan - Scannt Barcode und gibt Produktinformationen zurück
 */
export async function scanBarcode(barcode: string) {
  const response = await fetch(`${FUNCTIONS_URL}/barcode-scan`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ barcode }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error || `Barcode scan failed: ${response.statusText}`);
  }

  return await response.json();
}

/**
 * Add Food to Diary - Fügt Lebensmittel zum Ernährungstagebuch hinzu
 * Speichert das Food zuerst in der Datenbank, falls noch keine ID vorhanden ist
 */
export async function addFoodToDiary(data: {
  userId: string;
  foodItemId?: string; // Optional now - can be derived from food
  food?: FoodItem; // Pass the full food item if no ID
  mealDate: string; // YYYY-MM-DD
  mealType: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  quantity: number;
  unit: string;
  notes?: string;
}) {
  let foodItemId = data.foodItemId;

  // If no ID but we have a full food item, cache it first
  if (!foodItemId && data.food) {
    const food = data.food;

    // Check if food has a barcode (required for caching)
    if (!food.barcode) {
      throw new Error('Cannot save food without barcode or ID');
    }

    // Cache the food in the database using the cache-food endpoint
    const cacheResponse = await fetch(`${FUNCTIONS_URL}/cache-food`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        barcode: food.barcode,
        name: food.name,
        brand: food.brand || null,
        category: food.category || null,
        image_url: food.image_url || null,
        serving_size: food.serving_size || null,
        calories_per_100g: food.calories_per_100g || food.calories || 0,
        protein_per_100g: food.protein_per_100g || food.protein || 0,
        carbs_per_100g: food.carbs_per_100g || food.carbs || 0,
        sugar_per_100g: food.sugar_per_100g || food.sugar || null,
        fat_per_100g: food.fat_per_100g || food.fat || 0,
        saturated_fat_per_100g: food.saturated_fat_per_100g || food.saturated_fat || null,
        fiber_per_100g: food.fiber_per_100g || food.fiber || null,
        sodium_per_100g: food.sodium_per_100g || food.sodium || null,
        allergens: food.allergens || null,
        source: food.source || 'openfoodfacts',
      }),
    });

    if (!cacheResponse.ok) {
      const error = await cacheResponse.json().catch(() => ({}));
      throw new Error(error.error || 'Failed to cache food item');
    }

    const cachedFood = await cacheResponse.json();
    foodItemId = cachedFood.food.id;

    // Also cache in local SQLite for offline access
    try {
      // Convert to the format expected by LocalFoodCache
      const foodForCache = {
        barcode: food.barcode || '',
        name: food.name,
        brand: food.brand,
        source: (food.source || 'openfoodfacts') as 'openfoodfacts',
        calories: food.calories_per_100g || food.calories || 0,
        protein: food.protein_per_100g || food.protein || 0,
        carbs: food.carbs_per_100g || food.carbs || 0,
        fat: food.fat_per_100g || food.fat || 0,
        fiber: food.fiber_per_100g || food.fiber,
        sugar: food.sugar_per_100g || food.sugar,
        sodium: food.sodium_per_100g || food.sodium,
        serving_size: typeof food.serving_size === 'number' ? food.serving_size : undefined,
        allergens: food.allergens,
      };

      await localFoodCache.cacheFood(foodForCache);
      console.log('[NutritionAPI] Food cached locally:', food.name);
    } catch (error) {
      console.warn('[NutritionAPI] Failed to cache food locally:', error);
      // Don't throw - local caching is not critical
    }
  }

  if (!foodItemId) {
    throw new Error('No food ID available');
  }

  const response = await fetch(`${FUNCTIONS_URL}/add-food-diary`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      userId: data.userId,
      foodItemId,
      mealDate: data.mealDate,
      mealType: data.mealType,
      quantity: data.quantity,
      unit: data.unit,
      notes: data.notes,
    }),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || `Failed to add food to diary: ${response.statusText}`);
  }

  return await response.json();
}

/**
 * Get Daily Summary - Holt die tägliche Ernährungszusammenfassung
 */
export async function getDailySummary(userId: string, date: string) {
  const url = new URL(`${FUNCTIONS_URL}/get-daily-summary`);
  url.searchParams.set('userId', userId);
  url.searchParams.set('date', date);

  // Get auth token from supabase session
  const { data: { session } } = await supabase.auth.getSession();

  const response = await fetch(url.toString(), {
    headers: {
      'Authorization': `Bearer ${session?.access_token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to get daily summary: ${response.statusText}`);
  }

  return await response.json();
}

/**
 * Get Diary Entries - Holt alle Einträge für einen bestimmten Tag
 */
export async function getDiaryEntries(userId: string, date: string): Promise<DiaryEntriesResponse> {
  const url = new URL(`${FUNCTIONS_URL}/get-diary-entries`);
  url.searchParams.set('userId', userId);
  url.searchParams.set('date', date);

  const response = await fetch(url.toString());

  if (!response.ok) {
    throw new Error(`Failed to get diary entries: ${response.statusText}`);
  }

  return await response.json();
}

/**
 * Sync Workout Calories - Synchronisiert verbrannte Kalorien aus Workouts
 */
export async function syncWorkoutCalories(data: {
  userId: string;
  date: string; // YYYY-MM-DD
  caloriesBurned: number;
}) {
  const response = await fetch(`${FUNCTIONS_URL}/sync-workout-calories`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error(`Failed to sync workout calories: ${response.statusText}`);
  }

  return await response.json();
}

/**
 * Prefetch Popular Foods - Lädt beliebte Lebensmittel für Caching
 */
export async function prefetchPopularFoods(limit = 100) {
  const url = new URL(`${FUNCTIONS_URL}/prefetch-popular-foods`);
  url.searchParams.set('limit', limit.toString());

  const response = await fetch(url.toString());

  if (!response.ok) {
    throw new Error(`Failed to prefetch popular foods: ${response.statusText}`);
  }

  return await response.json();
}

/**
 * TypeScript Types für API Responses
 */

export interface FoodItem {
  id?: string; // Database ID (only for cached items)
  barcode?: string;
  name: string;
  brand?: string;
  category?: string;
  image_url?: string;
  serving_size?: string | number;

  // Database format (per 100g with suffix)
  calories_per_100g?: number;
  protein_per_100g?: number;
  carbs_per_100g?: number;
  sugar_per_100g?: number;
  fat_per_100g?: number;
  saturated_fat_per_100g?: number;
  fiber_per_100g?: number;
  sodium_per_100g?: number;

  // Frontend format (per 100g without suffix) - mapped from API
  calories?: number;
  protein?: number;
  carbs?: number;
  sugar?: number;
  fat?: number;
  saturated_fat?: number;
  fiber?: number;
  sodium?: number;

  allergens?: string[];
  source?: 'openfoodfacts' | 'curated' | 'manual' | 'usda';
  usage_count?: number;
  last_used?: string;
}

export interface FoodSearchResponse {
  success: boolean;
  results: {
    local: FoodItem[];
    external: FoodItem[];
  };
  meta: {
    query: string;
    localCount: number;
    externalCount: number;
    totalCount: number;
  };
}

export interface BarcodeScanResponse {
  success: boolean;
  food: FoodItem;
  source: 'cache' | 'api';
  warning?: string;
}

export interface DiaryEntry {
  id: string;
  user_id: string;
  food_item_id: string;
  meal_date: string;
  meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack';
  quantity: number;
  unit: string;
  calories: number;
  protein: number;
  carbs: number;
  sugar?: number;
  fat: number;
  saturated_fat?: number;
  fiber?: number;
  sodium?: number;
  notes?: string;
  food_items?: {
    id: string;
    name: string;
    brand?: string;
    image_url?: string;
  };
}

export interface AddFoodDiaryResponse {
  success: boolean;
  entry: DiaryEntry;
}

export interface DailySummary {
  date: string;
  calories: {
    consumed: number;
    goal: number;
    burned: number;
    net: number;
    percentage: number;
  };
  macros: {
    protein: { consumed: number; goal: number; percentage: number };
    carbs: { consumed: number; goal: number; percentage: number };
    fat: { consumed: number; goal: number; percentage: number };
  };
  water: {
    consumed: number;
    goal: number;
    percentage: number;
  };
  micronutrients?: {
    fiber: number;
    sugar: number;
    sodium: number;
  };
}

export interface DailySummaryResponse {
  success: boolean;
  summary: DailySummary;
}

export interface DiaryEntriesResponse {
  success: boolean;
  entries: DiaryEntry[];
  meta: {
    date: string;
    totalEntries: number;
  };
}

export interface SyncWorkoutCaloriesResponse {
  success: boolean;
  summary: any;
  message: string;
}

export interface PrefetchPopularFoodsResponse {
  success: boolean;
  foods: FoodItem[];
  meta: {
    count: number;
    limit: number;
  };
}
