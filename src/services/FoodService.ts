/**
 * Food Service - Multi-Layer Caching Orchestrator
 *
 * Intelligently combines 3 cache layers for optimal performance:
 * 1. LOCAL (SQLite) - Instant, offline-available
 * 2. CLOUD (Supabase) - Shared cache across users
 * 3. EXTERNAL (Open Food Facts API) - Source of truth
 *
 * Usage:
 * ```typescript
 * import { foodService } from './FoodService';
 *
 * // Initialize on app start
 * await foodService.initialize();
 *
 * // Get food by barcode (handles all layers automatically)
 * const food = await foodService.getFoodByBarcode('4260414150043');
 *
 * // Search foods
 * const results = await foodService.searchFoods('coca cola');
 * ```
 */

import { localFoodCache } from './cache/LocalFoodCache';
import { localNutritionCache } from './cache/LocalNutritionCache';
import { localProfileCache } from './cache/LocalProfileCache';
import { profileSyncService } from './ProfileSyncService';
import { cloudFoodCache } from './cache/CloudFoodCache';
import { openFoodFactsAPI } from './api/OpenFoodFactsAPI';
import { foodSearchRanker } from './FoodSearchRanker';
import {
  FoodItem,
  SearchResult,
  FoodServiceError,
  FoodServiceErrorCode,
  FoodServiceConfig,
  DEFAULT_FOOD_SERVICE_CONFIG,
} from '../types/nutrition';

const LOG_PREFIX = '[FoodService]';

export class FoodService {
  private config: FoodServiceConfig;
  private initialized: boolean = false;

  constructor(config: Partial<FoodServiceConfig> = {}) {
    this.config = { ...DEFAULT_FOOD_SERVICE_CONFIG, ...config };
    console.log(`${LOG_PREFIX} Created with config:`, this.config);
  }

  /**
   * Initialize the food service
   * MUST be called once on app start
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      console.log(`${LOG_PREFIX} Already initialized`);
      return;
    }

    try {
      console.log(`${LOG_PREFIX} Initializing...`);

      // Initialize local caches (SQLite) - all use same DB
      await localFoodCache.initialize();
      await localNutritionCache.initialize();
      await localProfileCache.initialize();

      // Initialize profile sync service (event listeners)
      profileSyncService.initialize();

      // Prefetch popular foods in background (don't await)
      this.prefetchPopularFoods().catch((error) => {
        console.warn(`${LOG_PREFIX} Prefetch failed (non-critical):`, error);
      });

      this.initialized = true;
      console.log(`${LOG_PREFIX} Successfully initialized`);
    } catch (error) {
      console.error(`${LOG_PREFIX} Initialization failed:`, error);
      throw new FoodServiceError(
        'Failed to initialize FoodService',
        FoodServiceErrorCode.DATABASE_ERROR,
        { originalError: error }
      );
    }
  }

  /**
   * Get food by barcode - Main method with 3-layer fallback
   *
   * Flow:
   * 1. Check LOCAL cache → Return immediately if found
   * 2. Check CLOUD cache → Cache locally + return if found
   * 3. Check EXTERNAL API → Cache in cloud AND locally + return
   * 4. Throw error if not found anywhere
   */
  async getFoodByBarcode(barcode: string): Promise<FoodItem> {
    this.ensureInitialized();

    const startTime = Date.now();
    console.log(`${LOG_PREFIX} Getting food by barcode: ${barcode}`);

    try {
      // LAYER 1: Local SQLite Cache (instant)
      const localFood = await localFoodCache.getFoodByBarcode(barcode);
      if (localFood) {
        const elapsed = Date.now() - startTime;
        console.log(`${LOG_PREFIX} ✓ Found in LOCAL cache (${elapsed}ms)`);
        return localFood;
      }

      // LAYER 2: Cloud Supabase Cache (fast)
      const cloudFood = await cloudFoodCache.getFoodByBarcode(barcode);
      if (cloudFood) {
        const elapsed = Date.now() - startTime;
        console.log(`${LOG_PREFIX} ✓ Found in CLOUD cache (${elapsed}ms)`);

        // Cache locally for next time (fire and forget)
        localFoodCache.cacheFood(cloudFood).catch((error) => {
          console.warn(`${LOG_PREFIX} Failed to cache locally:`, error);
        });

        return cloudFood;
      }

      // LAYER 3: External API (slow, rate-limited)
      const externalFood = await openFoodFactsAPI.getProductByBarcode(barcode);
      if (!externalFood) {
        throw new FoodServiceError(
          `Product not found: ${barcode}`,
          FoodServiceErrorCode.BARCODE_NOT_FOUND,
          { barcode }
        );
      }

      const elapsed = Date.now() - startTime;
      console.log(`${LOG_PREFIX} ✓ Found in EXTERNAL API (${elapsed}ms)`);

      // Cache in both layers (parallel, fire and forget)
      Promise.all([
        cloudFoodCache.cacheFood(externalFood),
        localFoodCache.cacheFood(externalFood),
      ]).catch((error) => {
        console.warn(`${LOG_PREFIX} Failed to cache food:`, error);
      });

      return externalFood;
    } catch (error) {
      const elapsed = Date.now() - startTime;
      console.error(`${LOG_PREFIX} ✗ Failed to get food (${elapsed}ms):`, error);

      if (error instanceof FoodServiceError) {
        throw error;
      }

      throw new FoodServiceError(
        `Failed to get food: ${error instanceof Error ? error.message : 'Unknown error'}`,
        FoodServiceErrorCode.NETWORK_ERROR,
        { barcode, originalError: error }
      );
    }
  }

  /**
   * Search foods across all layers with intelligent merging and relevance ranking
   *
   * Flow:
   * 1. Search LOCAL cache (SQLite) - Highest priority, always shown first
   * 2. Search CLOUD cache (Supabase) - Second priority, always shown after local
   * 3. Search EXTERNAL API (OpenFoodFacts) - Always searched, shown last
   * 4. Rank each layer separately, then combine in strict hierarchy
   * 5. Return: Local > Cloud > External (filtered by name match)
   * 6. Cache new results for future searches
   *
   * NOTE: No minimum result threshold - DB results always come first regardless of count
   */
  async searchFoods(query: string): Promise<SearchResult> {
    this.ensureInitialized();

    const startTime = Date.now();
    console.log(`${LOG_PREFIX} Searching foods: "${query}"`);

    if (!query || query.trim().length < 2) {
      return {
        items: [],
        source: 'local',
        query_time_ms: 0,
        total_count: 0,
      };
    }

    try {
      let localResults: FoodItem[] = [];
      let cloudResults: FoodItem[] = [];
      let externalResults: FoodItem[] = [];
      let primarySource: 'local' | 'cloud' | 'external' = 'local';

      // LAYER 1: Local search (SQLite) - Highest priority
      const rawLocalResults = await localFoodCache.searchFoodsByName(query, 50);
      // Mark results as from local cache
      localResults = rawLocalResults.map((item) => ({
        ...item,
        cache_source: 'local' as const,
      }));
      console.log(`${LOG_PREFIX} Local results: ${localResults.length}`);

      // LAYER 2: Cloud search (Supabase) - Second priority
      const rawCloudResults = await cloudFoodCache.searchFoods(query, 50);
      // Mark results as from cloud, filter out duplicates from local
      const localBarcodes = new Set(localResults.map((item) => item.barcode));
      cloudResults = rawCloudResults
        .filter((item) => !localBarcodes.has(item.barcode))
        .map((item) => ({
          ...item,
          cache_source: 'cloud' as const,
        }));
      console.log(`${LOG_PREFIX} Cloud results (unique): ${cloudResults.length}`);

      if (cloudResults.length > 0) {
        primarySource = 'cloud';
      }

      // Cache cloud results locally (fire and forget)
      rawCloudResults.forEach((food) => {
        localFoodCache.cacheFood(food).catch((error) => {
          console.warn(`${LOG_PREFIX} Failed to cache locally:`, error);
        });
      });

      // Combined database results (local + cloud)
      const databaseResults = [...localResults, ...cloudResults];

      // LAYER 3: External API search - ALWAYS search to supplement DB results
      // API results are shown AFTER all DB results, filtered by name match
      // Wrapped in try-catch to prevent API failures from breaking the entire search
      let apiResults: FoodItem[] = [];
      try {
        apiResults = await openFoodFactsAPI.searchProducts(query, 50);
        console.log(`${LOG_PREFIX} External API results: ${apiResults.length}`);
      } catch (apiError) {
        console.warn(`${LOG_PREFIX} API search failed (non-critical):`, apiError);
        // Continue with DB results only - don't fail the entire search
      }

      if (apiResults.length > 0 && databaseResults.length === 0) {
        primarySource = 'external';
      }

      // Filter out API results that already exist in database results
      const dbBarcodes = new Set(databaseResults.map((item) => item.barcode));
      externalResults = apiResults
        .filter((item) => !dbBarcodes.has(item.barcode))
        .map((item) => ({
          ...item,
          cache_source: 'external' as const,
        }));

      // Cache external results in both layers (fire and forget)
      // Only cache items that pass the name filter to avoid polluting cache
      const filteredExternalForCache = externalResults.filter((item) => {
        const normalizedQuery = query.trim().toLowerCase();
        const normalizedName = item.name.toLowerCase();
        const normalizedNameDe = item.name_de?.toLowerCase() || '';
        return normalizedName.includes(normalizedQuery) || normalizedNameDe.includes(normalizedQuery);
      });

      filteredExternalForCache.forEach((food) => {
        Promise.all([
          cloudFoodCache.cacheFood(food),
          localFoodCache.cacheFood(food),
        ]).catch((error) => {
          console.warn(`${LOG_PREFIX} Failed to cache:`, error);
        });
      });

      // RANK each layer separately to maintain hierarchy
      // Local results first (already highest priority)
      const rankedLocalResults = foodSearchRanker.rankResults(localResults, query);
      console.log(
        `${LOG_PREFIX} Ranked Local: ${localResults.length} → ${rankedLocalResults.length} relevant`
      );

      // Cloud results second
      const rankedCloudResults = foodSearchRanker.rankResults(cloudResults, query);
      console.log(
        `${LOG_PREFIX} Ranked Cloud: ${cloudResults.length} → ${rankedCloudResults.length} relevant`
      );

      // External results last - filtered strictly by name match
      const rankedExternalResults = foodSearchRanker.rankResults(externalResults, query);
      console.log(
        `${LOG_PREFIX} Ranked External: ${externalResults.length} → ${rankedExternalResults.length} relevant`
      );

      // COMBINE: Maintain strict hierarchy - Local > Cloud > External
      // Within each layer, items are sorted by relevance score
      const MAX_SEARCH_RESULTS = 50;
      const combinedResults = [
        ...rankedLocalResults,
        ...rankedCloudResults,
        ...rankedExternalResults,
      ].slice(0, MAX_SEARCH_RESULTS);

      const elapsed = Date.now() - startTime;
      console.log(
        `${LOG_PREFIX} Search complete: ${combinedResults.length} results (${rankedLocalResults.length} local + ${rankedCloudResults.length} cloud + ${rankedExternalResults.length} API) (${elapsed}ms)`
      );

      return {
        items: combinedResults,
        source: primarySource,
        query_time_ms: elapsed,
        total_count: combinedResults.length,
      };
    } catch (error) {
      const elapsed = Date.now() - startTime;
      console.error(`${LOG_PREFIX} Search failed (${elapsed}ms):`, error);

      throw new FoodServiceError(
        `Search failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        FoodServiceErrorCode.NETWORK_ERROR,
        { query, originalError: error }
      );
    }
  }

  /**
   * Prefetch popular foods from cloud to local cache
   * Run this in background on app start or periodically
   */
  async prefetchPopularFoods(): Promise<void> {
    if (!this.initialized) {
      console.log(`${LOG_PREFIX} Skipping prefetch - not initialized`);
      return;
    }

    try {
      console.log(
        `${LOG_PREFIX} Prefetching top ${this.config.prefetchPopularCount} popular foods...`
      );

      // Get most-used foods from cloud
      const popularFoods = await cloudFoodCache.getMostUsedFoods(
        this.config.prefetchPopularCount
      );

      console.log(`${LOG_PREFIX} Retrieved ${popularFoods.length} popular foods`);

      // Cache each locally (sequential to avoid overwhelming DB)
      let cached = 0;
      for (const food of popularFoods) {
        try {
          await localFoodCache.cacheFood(food);
          cached++;
        } catch (error) {
          console.warn(`${LOG_PREFIX} Failed to cache ${food.barcode}:`, error);
        }
      }

      console.log(`${LOG_PREFIX} Prefetch complete: ${cached}/${popularFoods.length} cached`);
    } catch (error) {
      console.error(`${LOG_PREFIX} Prefetch failed:`, error);
      // Don't throw - prefetch is not critical
    }
  }

  /**
   * Get user's most-used foods from local cache
   * Useful for quick-add UI
   */
  async getUserTopFoods(limit: number = 10): Promise<FoodItem[]> {
    this.ensureInitialized();

    try {
      return await localFoodCache.getTopFoods(limit);
    } catch (error) {
      console.error(`${LOG_PREFIX} Failed to get user top foods:`, error);
      return [];
    }
  }

  /**
   * Get cache statistics across all layers
   */
  async getCacheStats(): Promise<{
    local_count: number;
    cloud_stats: { total_items: number; total_usage: number };
  }> {
    try {
      const [localCount, cloudStats] = await Promise.all([
        localFoodCache.getCacheSize(),
        cloudFoodCache.getCacheStats(),
      ]);

      return {
        local_count: localCount,
        cloud_stats: cloudStats,
      };
    } catch (error) {
      console.error(`${LOG_PREFIX} Failed to get cache stats:`, error);
      return {
        local_count: 0,
        cloud_stats: { total_items: 0, total_usage: 0 },
      };
    }
  }

  /**
   * Clear local cache (use with caution!)
   */
  async clearLocalCache(): Promise<void> {
    this.ensureInitialized();
    await localFoodCache.clearCache();
    console.log(`${LOG_PREFIX} Local cache cleared`);
  }

  // ========================================================================
  // PRIVATE METHODS
  // ========================================================================

  /**
   * Ensure service is initialized before operations
   */
  private ensureInitialized(): void {
    if (!this.initialized) {
      throw new FoodServiceError(
        'FoodService not initialized. Call initialize() first.',
        FoodServiceErrorCode.DATABASE_ERROR
      );
    }
  }
}

/**
 * Singleton instance for the app
 */
export const foodService = new FoodService();

/**
 * Example usage in App.tsx:
 *
 * ```typescript
 * import { foodService } from './services/FoodService';
 *
 * export default function App() {
 *   useEffect(() => {
 *     // Initialize on app start
 *     foodService.initialize().catch(console.error);
 *   }, []);
 *
 *   return <YourApp />;
 * }
 * ```
 *
 * Example usage in a component:
 *
 * ```typescript
 * import { foodService } from '../services/FoodService';
 *
 * function BarcodeScanner() {
 *   const [loading, setLoading] = useState(false);
 *   const [food, setFood] = useState<FoodItem | null>(null);
 *
 *   const handleBarcodeScan = async (barcode: string) => {
 *     setLoading(true);
 *     try {
 *       const result = await foodService.getFoodByBarcode(barcode);
 *       setFood(result);
 *     } catch (error) {
 *       console.error('Failed to get food:', error);
 *       Alert.alert('Error', 'Product not found');
 *     } finally {
 *       setLoading(false);
 *     }
 *   };
 *
 *   return (
 *     <View>
 *       {loading && <ActivityIndicator />}
 *       {food && <FoodDetails food={food} />}
 *     </View>
 *   );
 * }
 * ```
 */
