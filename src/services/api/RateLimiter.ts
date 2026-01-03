/**
 * Sliding Window Rate Limiter
 *
 * Implements a sliding window algorithm to enforce rate limits
 * for external API calls (Open Food Facts).
 *
 * Usage:
 * ```typescript
 * const limiter = new RateLimiter(100, 60000); // 100 requests per minute
 * await limiter.waitIfNeeded();
 * // Make API call...
 * ```
 */

const LOG_PREFIX = '[RateLimiter]';

export interface RateLimiterConfig {
  maxRequests: number; // Maximum number of requests
  windowMs: number; // Time window in milliseconds
}

export class RateLimiter {
  private requestTimestamps: number[] = [];
  private readonly maxRequests: number;
  private readonly windowMs: number;

  /**
   * Create a new rate limiter
   * @param maxRequests Maximum number of requests allowed
   * @param windowMs Time window in milliseconds (default: 60000ms = 1 minute)
   */
  constructor(maxRequests: number = 100, windowMs: number = 60000) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;

    console.log(
      `${LOG_PREFIX} Initialized with ${maxRequests} requests per ${windowMs}ms`
    );
  }

  /**
   * Wait if rate limit would be exceeded
   * This method blocks execution until a request can be made
   */
  async waitIfNeeded(): Promise<void> {
    // Cleanup old timestamps outside the current window
    this.cleanupOldTimestamps();

    const currentCount = this.requestTimestamps.length;

    // If we're under the limit, record the request and proceed
    if (currentCount < this.maxRequests) {
      this.requestTimestamps.push(Date.now());
      console.log(
        `${LOG_PREFIX} Request allowed (${currentCount + 1}/${this.maxRequests})`
      );
      return;
    }

    // We've hit the limit - calculate how long to wait
    const oldestTimestamp = this.requestTimestamps[0];
    const waitTime = oldestTimestamp + this.windowMs - Date.now();

    if (waitTime > 0) {
      console.warn(
        `${LOG_PREFIX} Rate limit reached (${this.maxRequests}/${this.maxRequests}). ` +
        `Waiting ${waitTime}ms...`
      );

      await this.sleep(waitTime);

      // After waiting, cleanup and try again
      this.cleanupOldTimestamps();
    }

    // Record this request
    this.requestTimestamps.push(Date.now());
    console.log(
      `${LOG_PREFIX} Request allowed after waiting (${this.getRequestsInCurrentWindow()}/${this.maxRequests})`
    );
  }

  /**
   * Get the number of requests in the current window
   * Useful for monitoring and debugging
   */
  getRequestsInCurrentWindow(): number {
    this.cleanupOldTimestamps();
    return this.requestTimestamps.length;
  }

  /**
   * Get the remaining requests available in the current window
   */
  getRemainingRequests(): number {
    this.cleanupOldTimestamps();
    return Math.max(0, this.maxRequests - this.requestTimestamps.length);
  }

  /**
   * Check if a request can be made immediately without waiting
   */
  canMakeRequest(): boolean {
    this.cleanupOldTimestamps();
    return this.requestTimestamps.length < this.maxRequests;
  }

  /**
   * Get statistics about the rate limiter
   */
  getStats(): {
    currentRequests: number;
    maxRequests: number;
    remainingRequests: number;
    windowMs: number;
    utilizationPercent: number;
  } {
    this.cleanupOldTimestamps();
    const current = this.requestTimestamps.length;

    return {
      currentRequests: current,
      maxRequests: this.maxRequests,
      remainingRequests: Math.max(0, this.maxRequests - current),
      windowMs: this.windowMs,
      utilizationPercent: (current / this.maxRequests) * 100,
    };
  }

  /**
   * Reset the rate limiter (clear all timestamps)
   * Useful for testing or manual reset
   */
  reset(): void {
    this.requestTimestamps = [];
    console.log(`${LOG_PREFIX} Rate limiter reset`);
  }

  /**
   * Remove timestamps that are outside the current window
   * This implements the "sliding" part of the sliding window algorithm
   */
  private cleanupOldTimestamps(): void {
    const now = Date.now();
    const cutoffTime = now - this.windowMs;

    // Filter out timestamps older than the window
    const originalLength = this.requestTimestamps.length;
    this.requestTimestamps = this.requestTimestamps.filter(
      (timestamp) => timestamp > cutoffTime
    );

    const removed = originalLength - this.requestTimestamps.length;
    if (removed > 0) {
      console.log(
        `${LOG_PREFIX} Cleaned up ${removed} old timestamps`
      );
    }
  }

  /**
   * Sleep for a specified number of milliseconds
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

/**
 * Create a singleton rate limiter for Open Food Facts API
 * Default: 100 requests per minute (conservative limit)
 */
export const openFoodFactsRateLimiter = new RateLimiter(100, 60000);

/**
 * Example usage:
 *
 * ```typescript
 * import { openFoodFactsRateLimiter } from './RateLimiter';
 *
 * async function makeAPICall() {
 *   // Wait if needed before making the request
 *   await openFoodFactsRateLimiter.waitIfNeeded();
 *
 *   // Now safe to make the API call
 *   const response = await fetch('https://world.openfoodfacts.org/api/v2/...');
 *   return response.json();
 * }
 *
 * // Check stats
 * console.log(openFoodFactsRateLimiter.getStats());
 * ```
 */
