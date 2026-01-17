/**
 * Open Food Facts API Client
 *
 * Interfaces with the Open Food Facts public API to fetch product data
 * Includes rate limiting and German language prioritization
 *
 * API Documentation: https://wiki.openfoodfacts.org/API
 */

import {
  FoodItem,
  OFFProductResponse,
  OFFSearchResponse,
  OFFProduct,
  FoodServiceError,
  FoodServiceErrorCode,
} from '../../types/nutrition';
import { openFoodFactsRateLimiter } from './RateLimiter';

const LOG_PREFIX = '[OpenFoodFactsAPI]';

// Open Food Facts API Configuration
// NOTE: v2 API does NOT support full-text search! Only v1 supports search_terms parameter
// For barcode lookups: use v2 (/api/v2/product/{barcode}.json)
// For text search: use cgi search endpoint (/cgi/search.pl)
const OFF_BASE_URL = 'https://world.openfoodfacts.org';
const OFF_SEARCH_URL = 'https://world.openfoodfacts.org/cgi/search.pl';
const USER_AGENT = 'FitnessApp/1.0 (contact@fitnessapp.com)';
const REQUEST_TIMEOUT = 10000; // 10 seconds

export class OpenFoodFactsAPI {
  private baseUrl: string;
  private userAgent: string;

  constructor(baseUrl: string = OFF_BASE_URL, userAgent: string = USER_AGENT) {
    this.baseUrl = baseUrl;
    this.userAgent = userAgent;

    console.log(`${LOG_PREFIX} Initialized with base URL: ${baseUrl}`);
  }

  /**
   * Get product by barcode from Open Food Facts
   * @param barcode The product barcode (EAN-13, UPC-A, etc.)
   * @returns FoodItem or null if not found
   */
  async getProductByBarcode(barcode: string): Promise<FoodItem | null> {
    console.log(`${LOG_PREFIX} Fetching product: ${barcode}`);

    // Validate barcode format (basic validation)
    if (!this.isValidBarcode(barcode)) {
      throw new FoodServiceError(
        `Invalid barcode format: ${barcode}`,
        FoodServiceErrorCode.INVALID_BARCODE
      );
    }

    try {
      // Wait for rate limiter
      await openFoodFactsRateLimiter.waitIfNeeded();

      // Fetch product data (using v2 API for barcode lookups)
      const url = `${this.baseUrl}/api/v2/product/${barcode}.json`;
      const response = await this.fetchWithTimeout(url);

      if (!response.ok) {
        if (response.status === 404) {
          console.log(`${LOG_PREFIX} Product not found: ${barcode}`);
          return null;
        }
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data: OFFProductResponse = await response.json();

      // Check if product exists
      if (data.status !== 1 || !data.product) {
        console.log(`${LOG_PREFIX} Product not found in OFF: ${barcode}`);
        return null;
      }

      // Parse to FoodItem
      const foodItem = this.parseOFFProduct(data.product);
      console.log(`${LOG_PREFIX} Successfully fetched: ${foodItem.name}`);

      return foodItem;
    } catch (error) {
      console.error(`${LOG_PREFIX} Error fetching product ${barcode}:`, error);

      if (error instanceof FoodServiceError) {
        throw error;
      }

      throw new FoodServiceError(
        `Failed to fetch product: ${error instanceof Error ? error.message : 'Unknown error'}`,
        FoodServiceErrorCode.NETWORK_ERROR,
        { barcode, originalError: error }
      );
    }
  }

  /**
   * Search for products by name/brand
   * @param query Search query string
   * @param limit Maximum number of results (default: 20)
   * @returns Array of FoodItems
   */
  async searchProducts(query: string, limit: number = 20): Promise<FoodItem[]> {
    console.log(`${LOG_PREFIX} Searching products: "${query}" (limit: ${limit})`);

    if (!query || query.trim().length < 2) {
      console.warn(`${LOG_PREFIX} Query too short: "${query}"`);
      return [];
    }

    try {
      // Wait for rate limiter
      await openFoodFactsRateLimiter.waitIfNeeded();

      // Build search URL using CGI endpoint (v1 API style - v2 does NOT support text search!)
      // Reference: https://wiki.openfoodfacts.org/API
      const params = new URLSearchParams({
        search_terms: query.trim(),
        search_simple: '1', // Simple search
        action: 'process',
        page_size: limit.toString(),
        page: '1',
        json: '1',
      });

      const url = `${OFF_SEARCH_URL}?${params.toString()}`;
      console.log(`${LOG_PREFIX} Search URL: ${url}`);
      const response = await this.fetchWithTimeout(url);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const data: OFFSearchResponse = await response.json();

      // Parse products
      const foodItems = data.products
        .map((product) => {
          try {
            return this.parseOFFProduct(product);
          } catch (error) {
            console.warn(
              `${LOG_PREFIX} Failed to parse product ${product.code}:`,
              error
            );
            return null;
          }
        })
        .filter((item): item is FoodItem => item !== null);

      console.log(
        `${LOG_PREFIX} Found ${foodItems.length} products for "${query}"`
      );

      return foodItems;
    } catch (error) {
      console.error(`${LOG_PREFIX} Error searching products:`, error);

      throw new FoodServiceError(
        `Failed to search products: ${error instanceof Error ? error.message : 'Unknown error'}`,
        FoodServiceErrorCode.NETWORK_ERROR,
        { query, originalError: error }
      );
    }
  }

  /**
   * Parse Open Food Facts product to FoodItem interface
   * Prioritizes German language data when available
   */
  private parseOFFProduct(product: OFFProduct): FoodItem {
    try {
      // Get product name (prioritize German)
      const name_de = product.product_name_de;
      const name = name_de || product.product_name || 'Unknown Product';

      // Extract brand
      const brand = product.brands?.split(',')[0]?.trim();

      // Collect all searchable names for better matching
      // This helps when searching in German but the product only has English names
      const searchNames: string[] = [];
      if (product.product_name) searchNames.push(product.product_name);
      if (product.product_name_de) searchNames.push(product.product_name_de);
      if (product.generic_name) searchNames.push(product.generic_name);
      if (product.generic_name_de) searchNames.push(product.generic_name_de);
      if (product.abbreviated_product_name) searchNames.push(product.abbreviated_product_name);
      if (product.abbreviated_product_name_de) searchNames.push(product.abbreviated_product_name_de);
      // Filter out duplicates and empty strings
      const uniqueSearchNames = Array.from(new Set(searchNames.filter(n => n && n.trim())));

      // Get nutriments (per 100g)
      const nutriments = product.nutriments || {};

      // Parse serving size
      const { serving_size, serving_unit } = this.parseServingSize(
        product.serving_size
      );

      const foodItem: FoodItem = {
        barcode: product.code,
        source: 'openfoodfacts',
        name,
        name_de,
        brand,
        search_names: uniqueSearchNames.length > 0 ? uniqueSearchNames : undefined,

        // Macronutrients (per 100g)
        calories: nutriments['energy-kcal_100g'],
        protein: nutriments['proteins_100g'],
        carbs: nutriments['carbohydrates_100g'],
        fat: nutriments['fat_100g'],
        fiber: nutriments['fiber_100g'],
        sugar: nutriments['sugars_100g'],
        sodium: nutriments['sodium_100g'],

        // Serving info
        serving_size,
        serving_unit,

        // Quality scores
        nutriscore_grade: product.nutriscore_grade?.toUpperCase(),
        nova_group: product.nova_group,
        ecoscore_grade: product.ecoscore_grade?.toUpperCase(),

        // Metadata
        categories_tags: product.categories_tags,
        allergens: product.allergens_tags,
      };

      return foodItem;
    } catch (error) {
      console.error(`${LOG_PREFIX} Error parsing product:`, error);
      throw new FoodServiceError(
        'Failed to parse product data',
        FoodServiceErrorCode.PARSING_ERROR,
        { product, originalError: error }
      );
    }
  }

  /**
   * Parse serving size string to number and unit
   * Examples: "100g", "250ml", "1 slice (30g)"
   */
  private parseServingSize(servingString?: string): {
    serving_size?: number;
    serving_unit?: string;
  } {
    if (!servingString) {
      return {};
    }

    try {
      // Match patterns like "100g", "250 ml", "30 g"
      const match = servingString.match(/(\d+(?:\.\d+)?)\s*(g|ml|kg|l)?/i);

      if (match) {
        const size = parseFloat(match[1]);
        const unit = match[2]?.toLowerCase() || 'g';

        // Convert to grams/ml
        let normalizedSize = size;
        let normalizedUnit = unit;

        if (unit === 'kg') {
          normalizedSize = size * 1000;
          normalizedUnit = 'g';
        } else if (unit === 'l') {
          normalizedSize = size * 1000;
          normalizedUnit = 'ml';
        }

        return {
          serving_size: normalizedSize,
          serving_unit: normalizedUnit,
        };
      }
    } catch (error) {
      console.warn(`${LOG_PREFIX} Failed to parse serving size: ${servingString}`);
    }

    return {};
  }

  /**
   * Validate barcode format (basic validation)
   * Accepts EAN-13, UPC-A, and other common formats
   */
  private isValidBarcode(barcode: string): boolean {
    // Must be numeric and between 8-14 digits
    const pattern = /^\d{8,14}$/;
    return pattern.test(barcode);
  }

  /**
   * Fetch with timeout to prevent hanging requests
   */
  private async fetchWithTimeout(
    url: string,
    timeout: number = REQUEST_TIMEOUT
  ): Promise<Response> {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': this.userAgent,
          Accept: 'application/json',
        },
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      return response;
    } catch (error) {
      clearTimeout(timeoutId);

      if (error instanceof Error && error.name === 'AbortError') {
        throw new FoodServiceError(
          `Request timeout after ${timeout}ms`,
          FoodServiceErrorCode.NETWORK_ERROR
        );
      }

      throw error;
    }
  }
}

/**
 * Singleton instance for the app
 */
export const openFoodFactsAPI = new OpenFoodFactsAPI();

/**
 * Example usage:
 *
 * ```typescript
 * import { openFoodFactsAPI } from './OpenFoodFactsAPI';
 *
 * // Get product by barcode
 * const product = await openFoodFactsAPI.getProductByBarcode('4260414150043');
 * if (product) {
 *   console.log(`Found: ${product.name} - ${product.calories} kcal/100g`);
 * }
 *
 * // Search products
 * const results = await openFoodFactsAPI.searchProducts('coca cola', 10);
 * console.log(`Found ${results.length} products`);
 * ```
 */
