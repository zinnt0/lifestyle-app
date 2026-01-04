/**
 * Food Search Ranker - Intelligent Relevance Scoring
 *
 * Filters and ranks search results based on relevance to the search query.
 * Prioritizes exact matches in product names and filters out irrelevant results.
 *
 * Features:
 * - Exact match detection (highest priority)
 * - Word-based matching (starts with, contains)
 * - Position-based scoring (earlier matches score higher)
 * - Brand name consideration
 * - German language support (umlauts, ß)
 * - Minimum relevance threshold filtering
 */

import { FoodItem } from '../types/nutrition';

const LOG_PREFIX = '[FoodSearchRanker]';

export interface RankedFoodItem extends FoodItem {
  relevance_score: number;
  match_type: 'exact' | 'starts_with' | 'word_match' | 'contains' | 'brand_match';
  match_position?: number; // Character position where match starts
}

export interface RankingConfig {
  // Minimum relevance score to include in results (0-100)
  minRelevanceScore: number;
  // Boost score for cached items (already in database)
  cachedItemBoost: number;
  // Maximum number of results to return
  maxResults: number;
  // Enable fuzzy matching (more lenient)
  fuzzyMatching: boolean;
}

const DEFAULT_RANKING_CONFIG: RankingConfig = {
  minRelevanceScore: 30, // Filter out results with <30% relevance
  cachedItemBoost: 10, // +10 points for cached items
  maxResults: 50,
  fuzzyMatching: true,
};

export class FoodSearchRanker {
  private config: RankingConfig;

  constructor(config: Partial<RankingConfig> = {}) {
    this.config = { ...DEFAULT_RANKING_CONFIG, ...config };
  }

  /**
   * Rank and filter search results based on relevance
   * @param items Food items to rank
   * @param query Original search query
   * @returns Ranked and filtered items, sorted by relevance (highest first)
   */
  rankResults(items: FoodItem[], query: string): RankedFoodItem[] {
    if (!query || query.trim().length === 0) {
      console.warn(`${LOG_PREFIX} Empty query provided`);
      return [];
    }

    if (items.length === 0) {
      return [];
    }

    const normalizedQuery = this.normalizeString(query.trim());
    console.log(`${LOG_PREFIX} Ranking ${items.length} items for query: "${query}"`);

    // Calculate relevance score for each item
    const rankedItems = items
      .map((item) => this.scoreItem(item, normalizedQuery))
      .filter((item) => item.relevance_score >= this.config.minRelevanceScore)
      .sort((a, b) => {
        // Sort by relevance score (descending)
        if (b.relevance_score !== a.relevance_score) {
          return b.relevance_score - a.relevance_score;
        }
        // Tie-breaker: usage_count if available
        return (b.usage_count || 0) - (a.usage_count || 0);
      })
      .slice(0, this.config.maxResults);

    console.log(
      `${LOG_PREFIX} Filtered to ${rankedItems.length} relevant results (threshold: ${this.config.minRelevanceScore})`
    );

    if (rankedItems.length > 0) {
      console.log(`${LOG_PREFIX} Top result: "${rankedItems[0].name}" (score: ${rankedItems[0].relevance_score}, type: ${rankedItems[0].match_type})`);
    }

    return rankedItems;
  }

  /**
   * Calculate relevance score for a single item
   * Score range: 0-100
   */
  private scoreItem(item: FoodItem, normalizedQuery: string): RankedFoodItem {
    const normalizedName = this.normalizeString(item.name);
    const normalizedBrand = item.brand ? this.normalizeString(item.brand) : '';
    const normalizedNameDe = item.name_de ? this.normalizeString(item.name_de) : '';

    let score = 0;
    let matchType: 'exact' | 'starts_with' | 'word_match' | 'contains' | 'brand_match' = 'contains';
    let matchPosition: number | undefined;

    // Search in name, name_de, and brand
    const searchTexts = [
      { text: normalizedName, isGerman: false, isPrimary: true },
      { text: normalizedNameDe, isGerman: true, isPrimary: true },
      { text: normalizedBrand, isGerman: false, isPrimary: false },
    ];

    let bestScore = 0;
    let bestMatchType: 'exact' | 'starts_with' | 'word_match' | 'contains' | 'brand_match' = matchType;
    let bestMatchPosition: number | undefined = matchPosition;

    for (const { text, isGerman, isPrimary } of searchTexts) {
      if (!text) continue;

      const result = this.calculateMatchScore(text, normalizedQuery, isPrimary);

      // Apply German language bonus
      const languageBonus = isGerman ? 5 : 0;
      const totalScore = result.score + languageBonus;

      if (totalScore > bestScore) {
        bestScore = totalScore;
        bestMatchType = result.matchType;
        bestMatchPosition = result.matchPosition;
      }
    }

    score = bestScore;
    matchType = bestMatchType;
    matchPosition = bestMatchPosition;

    // Boost score for cached items (have usage_count)
    if (item.usage_count && item.usage_count > 0) {
      score += this.config.cachedItemBoost;
      // Additional boost based on usage frequency
      score += Math.min(item.usage_count * 2, 20); // Max +20 points
    }

    // Cap score at 100
    score = Math.min(score, 100);

    return {
      ...item,
      relevance_score: Math.round(score),
      match_type: matchType,
      match_position: matchPosition,
    };
  }

  /**
   * Calculate match score for a specific text field
   */
  private calculateMatchScore(
    text: string,
    query: string,
    isPrimary: boolean
  ): {
    score: number;
    matchType: 'exact' | 'starts_with' | 'word_match' | 'contains' | 'brand_match';
    matchPosition?: number;
  } {
    // 1. EXACT MATCH (100 points for primary, 70 for brand)
    if (text === query) {
      return {
        score: isPrimary ? 100 : 70,
        matchType: 'exact',
        matchPosition: 0,
      };
    }

    // 2. STARTS WITH (80 points for primary, 50 for brand)
    if (text.startsWith(query)) {
      return {
        score: isPrimary ? 80 : 50,
        matchType: 'starts_with',
        matchPosition: 0,
      };
    }

    // 3. WORD MATCH - Query matches a complete word in text
    const words = text.split(/\s+/);
    const queryWords = query.split(/\s+/);

    // Check if all query words appear as complete words
    const allWordsMatch = queryWords.every((qWord) =>
      words.some((word) => word === qWord || word.startsWith(qWord))
    );

    if (allWordsMatch) {
      // Find position of first query word
      const firstQueryWord = queryWords[0];
      const firstMatchIndex = words.findIndex(
        (word) => word === firstQueryWord || word.startsWith(firstQueryWord)
      );

      // Earlier position = higher score
      const positionPenalty = firstMatchIndex * 5; // -5 points per word offset
      const baseScore = isPrimary ? 70 : 40;

      return {
        score: Math.max(baseScore - positionPenalty, isPrimary ? 50 : 30),
        matchType: 'word_match',
        matchPosition: firstMatchIndex,
      };
    }

    // 4. CONTAINS - Query appears anywhere in text
    const containsPosition = text.indexOf(query);
    if (containsPosition !== -1) {
      // Earlier position = higher score
      const positionPenalty = Math.floor(containsPosition / 5); // -1 point per 5 chars
      const baseScore = isPrimary ? 50 : 30;

      return {
        score: Math.max(baseScore - positionPenalty, isPrimary ? 35 : 20),
        matchType: 'contains',
        matchPosition: containsPosition,
      };
    }

    // 5. BRAND MATCH ONLY - Query matches brand but not primary name
    if (!isPrimary) {
      return {
        score: 25,
        matchType: 'brand_match',
      };
    }

    // 6. FUZZY MATCHING - Partial word overlap
    if (this.config.fuzzyMatching) {
      const fuzzyScore = this.calculateFuzzyScore(text, query);
      if (fuzzyScore > 0) {
        return {
          score: fuzzyScore,
          matchType: 'contains',
        };
      }
    }

    // No match
    return {
      score: 0,
      matchType: 'contains',
    };
  }

  /**
   * Calculate fuzzy match score based on character overlap
   */
  private calculateFuzzyScore(text: string, query: string): number {
    const queryChars = query.split('');
    let matchedChars = 0;
    let lastIndex = -1;

    for (const char of queryChars) {
      const index = text.indexOf(char, lastIndex + 1);
      if (index !== -1) {
        matchedChars++;
        lastIndex = index;
      }
    }

    const matchRatio = matchedChars / query.length;

    // Only consider it a fuzzy match if >70% characters match in order
    if (matchRatio >= 0.7) {
      return Math.round(matchRatio * 25); // Max 25 points
    }

    return 0;
  }

  /**
   * Normalize string for comparison
   * - Lowercase
   * - Trim whitespace
   * - Handle German special characters (optional normalization)
   */
  private normalizeString(str: string): string {
    return str
      .toLowerCase()
      .trim()
      .replace(/\s+/g, ' '); // Normalize multiple spaces to single space
  }

  /**
   * Get scoring explanation for debugging
   */
  explainScore(item: RankedFoodItem, query: string): string {
    const explanations: string[] = [
      `Query: "${query}"`,
      `Item: "${item.name}"${item.brand ? ` (${item.brand})` : ''}`,
      `Match Type: ${item.match_type}`,
      `Base Score: ${item.relevance_score}`,
    ];

    if (item.match_position !== undefined) {
      explanations.push(`Match Position: ${item.match_position}`);
    }

    if (item.usage_count && item.usage_count > 0) {
      explanations.push(`Usage Count: ${item.usage_count} (+${Math.min(this.config.cachedItemBoost + item.usage_count * 2, this.config.cachedItemBoost + 20)} bonus)`);
    }

    return explanations.join('\n');
  }
}

/**
 * Singleton instance for the app
 */
export const foodSearchRanker = new FoodSearchRanker();

/**
 * Example usage:
 *
 * ```typescript
 * import { foodSearchRanker } from './FoodSearchRanker';
 *
 * // Rank search results
 * const rawResults = await openFoodFactsAPI.searchProducts('eier', 50);
 * const rankedResults = foodSearchRanker.rankResults(rawResults, 'eier');
 *
 * // Top result will be products with "Eier" in the title, not just related items
 * console.log(rankedResults[0].name); // e.g., "Eier" (exact match)
 * console.log(rankedResults[0].relevance_score); // e.g., 100
 * console.log(rankedResults[0].match_type); // e.g., "exact"
 *
 * // Explain scoring
 * console.log(foodSearchRanker.explainScore(rankedResults[0], 'eier'));
 * ```
 */
