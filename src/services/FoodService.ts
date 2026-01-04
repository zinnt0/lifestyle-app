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
   * 1. Search LOCAL cache
   * 2. If <5 results: Search CLOUD cache
   * 3. If <5 results: Search EXTERNAL API
   * 4. Merge & deduplicate results
   * 5. RANK by relevance (new!)
   * 6. Cache new results
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
      let allResults: FoodItem[] = [];
      let primarySource: 'local' | 'cloud' | 'external' = 'local';

      // LAYER 1: Local search
      const localResults = await localFoodCache.searchFoodsByName(query, 50);
      allResults = [...localResults];
      console.log(`${LOG_PREFIX} Local results: ${localResults.length}`);

      // LAYER 2: Cloud search (if local results insufficient)
      if (allResults.length < this.config.minSearchResults) {
        primarySource = 'cloud';
        const cloudResults = await cloudFoodCache.searchFoods(query, 50);
        console.log(`${LOG_PREFIX} Cloud results: ${cloudResults.length}`);

        // Merge with local results (deduplicate by barcode)
        allResults = this.mergeResults(allResults, cloudResults);

        // Cache cloud results locally (fire and forget)
        cloudResults.forEach((food) => {
          localFoodCache.cacheFood(food).catch((error) => {
            console.warn(`${LOG_PREFIX} Failed to cache locally:`, error);
          });
        });
      }

      // LAYER 3: External API search (if still insufficient)
      if (allResults.length < this.config.minSearchResults) {
        primarySource = 'external';
        const externalResults = await openFoodFactsAPI.searchProducts(query, 50);
        console.log(`${LOG_PREFIX} External results: ${externalResults.length}`);

        // Merge with existing results
        allResults = this.mergeResults(allResults, externalResults);

        // Cache external results in both layers (fire and forget)
        externalResults.forEach((food) => {
          Promise.all([
            cloudFoodCache.cacheFood(food),
            localFoodCache.cacheFood(food),
          ]).catch((error) => {
            console.warn(`${LOG_PREFIX} Failed to cache:`, error);
          });
        });
      }

      // RANK RESULTS BY RELEVANCE
      const rankedResults = foodSearchRanker.rankResults(allResults, query);
      console.log(
        `${LOG_PREFIX} Ranked ${allResults.length} → ${rankedResults.length} relevant results`
      );

      const elapsed = Date.now() - startTime;
      console.log(
        `${LOG_PREFIX} Search complete: ${rankedResults.length} results (${elapsed}ms)`
      );

      return {
        items: rankedResults,
        source: primarySource,
        query_time_ms: elapsed,
        total_count: rankedResults.length,
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
   * Merge two arrays of FoodItems, deduplicating by barcode
   * Keeps the first occurrence of each barcode
   */
  private mergeResults(existing: FoodItem[], newItems: FoodItem[]): FoodItem[] {
    const barcodeSet = new Set(existing.map((item) => item.barcode));

    const uniqueNewItems = newItems.filter((item) => {
      if (barcodeSet.has(item.barcode)) {
        return false;
      }
      barcodeSet.add(item.barcode);
      return true;
    });

    return [...existing, ...uniqueNewItems];
  }

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
