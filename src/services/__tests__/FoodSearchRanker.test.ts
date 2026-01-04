/**
 * FoodSearchRanker Tests
 *
 * Demonstrates the ranking algorithm with real-world examples
 */

import { FoodSearchRanker } from '../FoodSearchRanker';
import { FoodItem } from '../../types/nutrition';

describe('FoodSearchRanker', () => {
  const ranker = new FoodSearchRanker();

  // Helper to create mock food items
  const createFoodItem = (
    name: string,
    brand?: string,
    usageCount = 0
  ): FoodItem => ({
    barcode: Math.random().toString(),
    source: 'openfoodfacts',
    name,
    brand,
    usage_count: usageCount,
    calories: 100,
    protein: 10,
    carbs: 20,
    fat: 5,
  });

  describe('Exact Match Priority', () => {
    it('should rank exact matches highest', () => {
      const items = [
        createFoodItem('Eier mit Speck'), // Contains "eier"
        createFoodItem('Bio Hühnereier'), // Contains "eier"
        createFoodItem('Eier'), // EXACT MATCH
        createFoodItem('Eiersalat'), // Starts with "eier"
      ];

      const results = ranker.rankResults(items, 'eier');

      expect(results[0].name).toBe('Eier'); // Exact match first
      expect(results[0].match_type).toBe('exact');
      expect(results[0].relevance_score).toBeGreaterThan(90);
    });
  });

  describe('Starts With Priority', () => {
    it('should rank "starts with" matches higher than "contains"', () => {
      const items = [
        createFoodItem('Bio Haferflocken'), // Contains "hafer"
        createFoodItem('Haferflocken'), // STARTS WITH "hafer"
        createFoodItem('Vollkorn Haferflocken'), // Contains "hafer"
      ];

      const results = ranker.rankResults(items, 'hafer');

      expect(results[0].name).toBe('Haferflocken');
      expect(results[0].match_type).toBe('starts_with');
    });
  });

  describe('Word Match Detection', () => {
    it('should detect complete word matches', () => {
      const items = [
        createFoodItem('Coca Cola Zero'), // Word match "cola"
        createFoodItem('Pepsi Cola Light'), // Word match "cola"
        createFoodItem('Nicolaus Schokolade'), // Contains "cola" but not as word
      ];

      const results = ranker.rankResults(items, 'cola');

      // Coca Cola and Pepsi Cola should score higher than Nicolaus
      expect(results[0].name).toContain('Cola');
      expect(results[1].name).toContain('Cola');
      expect(results[0].relevance_score).toBeGreaterThan(
        results[2].relevance_score
      );
    });
  });

  describe('Cached Item Boost', () => {
    it('should boost items with higher usage count', () => {
      const items = [
        createFoodItem('Milch 3.5%', undefined, 1), // Low usage
        createFoodItem('Milch 1.5%', undefined, 20), // High usage
        createFoodItem('Milch Bio', undefined, 5), // Medium usage
      ];

      const results = ranker.rankResults(items, 'milch');

      // All are "starts with" matches, but usage count should differentiate
      expect(results[0].name).toBe('Milch 1.5%');
      expect(results[0].relevance_score).toBeGreaterThan(
        results[1].relevance_score
      );
    });
  });

  describe('Position-Based Scoring', () => {
    it('should rank earlier matches higher', () => {
      const items = [
        createFoodItem('Premium Apfelsaft Bio'), // "apfel" at position 2
        createFoodItem('Apfelsaft naturtrüb'), // "apfel" at position 0
        createFoodItem('Bio Direktsaft Apfel'), // "apfel" at position 3
      ];

      const results = ranker.rankResults(items, 'apfel');

      expect(results[0].name).toBe('Apfelsaft naturtrüb');
      expect(results[0].match_position).toBe(0);
    });
  });

  describe('Brand Matching', () => {
    it('should consider brand matches but score lower than name matches', () => {
      const items = [
        createFoodItem('Schokoriegel', 'Milka'), // Brand match
        createFoodItem('Milka Schokolade', 'Milka'), // Name match
        createFoodItem('Alpenmilch Schokolade', 'Andere'), // No match
      ];

      const results = ranker.rankResults(items, 'milka');

      expect(results[0].name).toBe('Milka Schokolade'); // Name match wins
      expect(results[1].name).toBe('Schokoriegel'); // Brand match second
    });
  });

  describe('German Language Support', () => {
    it('should handle German special characters', () => {
      const items = [
        createFoodItem('Käse Gouda'), // Contains "käse"
        createFoodItem('Frischkäse'), // Contains "käse"
        createFoodItem('Käse'), // EXACT MATCH
      ];

      const results = ranker.rankResults(items, 'käse');

      expect(results[0].name).toBe('Käse');
      expect(results.length).toBeGreaterThan(0);
    });
  });

  describe('Relevance Filtering', () => {
    it('should filter out irrelevant results', () => {
      const items = [
        createFoodItem('Eier'), // Perfect match
        createFoodItem('Eiersalat'), // Good match
        createFoodItem('Protein Shake'), // NO MATCH - should be filtered
        createFoodItem('Hähnchenbrust'), // NO MATCH - should be filtered
      ];

      const results = ranker.rankResults(items, 'eier');

      // Should only return items that contain "eier"
      expect(results.length).toBe(2);
      expect(results.every((r) => r.name.toLowerCase().includes('eier'))).toBe(
        true
      );
    });
  });

  describe('Real-World Example: "Eier" Search', () => {
    it('should rank egg products correctly', () => {
      // Simulating Open Food Facts results for "eier"
      const items = [
        createFoodItem('Eier M Bio', undefined, 15), // Exact start + cached
        createFoodItem('Hartgekochte Eier', undefined, 3),
        createFoodItem('Eier Freiland L'),
        createFoodItem('Bio Hühnereier'),
        createFoodItem('Eiersalat mit Mayo'),
        createFoodItem('Rührei Fertiggericht'),
        createFoodItem('Frische Eier aus Bodenhaltung'),
        createFoodItem('Protein Bowl mit Eiern'), // Less relevant
      ];

      const results = ranker.rankResults(items, 'eier');

      console.log('\n=== Eier Search Results ===');
      results.forEach((item, index) => {
        console.log(
          `${index + 1}. ${item.name} (Score: ${item.relevance_score}, Type: ${item.match_type}, Usage: ${item.usage_count || 0})`
        );
      });

      // Top result should be exact/starts-with match with high usage
      expect(results[0].name).toContain('Eier');
      expect(results[0].relevance_score).toBeGreaterThan(70);

      // All results should be relevant
      results.forEach((item) => {
        expect(item.relevance_score).toBeGreaterThanOrEqual(30);
      });
    });
  });

  describe('Real-World Example: "Coca Cola" Search', () => {
    it('should rank Coca Cola products correctly', () => {
      const items = [
        createFoodItem('Coca Cola', undefined, 50), // EXACT + highly used
        createFoodItem('Coca Cola Zero'),
        createFoodItem('Coca Cola Light'),
        createFoodItem('Pepsi Cola'), // Different brand
        createFoodItem('Fritz Cola'), // Different brand
        createFoodItem('Cola Mix Getränk'),
        createFoodItem('Schokolade mit Cola Geschmack'), // Less relevant
      ];

      const results = ranker.rankResults(items, 'coca cola');

      console.log('\n=== Coca Cola Search Results ===');
      results.forEach((item, index) => {
        console.log(
          `${index + 1}. ${item.name} (Score: ${item.relevance_score}, Type: ${item.match_type})`
        );
      });

      // Exact match with high usage should be first
      expect(results[0].name).toBe('Coca Cola');
      expect(results[0].relevance_score).toBeGreaterThan(90);

      // Coca Cola variants should be next
      expect(results[1].name).toContain('Coca Cola');
      expect(results[2].name).toContain('Coca Cola');
    });
  });

  describe('Performance with Large Result Sets', () => {
    it('should handle 50+ results efficiently', () => {
      const items = Array.from({ length: 100 }, (_, i) =>
        createFoodItem(`Produkt ${i} mit Milch`, undefined, i % 10)
      );

      const startTime = Date.now();
      const results = ranker.rankResults(items, 'milch');
      const elapsed = Date.now() - startTime;

      expect(elapsed).toBeLessThan(100); // Should complete in <100ms
      expect(results.length).toBeLessThanOrEqual(50); // Respects maxResults
    });
  });

  describe('Empty and Edge Cases', () => {
    it('should handle empty query', () => {
      const items = [createFoodItem('Test Item')];
      const results = ranker.rankResults(items, '');

      expect(results).toEqual([]);
    });

    it('should handle empty items array', () => {
      const results = ranker.rankResults([], 'test');

      expect(results).toEqual([]);
    });

    it('should handle very short queries', () => {
      const items = [createFoodItem('Ei'), createFoodItem('Eier')];
      const results = ranker.rankResults(items, 'ei');

      expect(results.length).toBeGreaterThan(0);
      expect(results[0].name).toBe('Ei'); // Exact match
    });
  });

  describe('Score Explanation', () => {
    it('should provide detailed score explanation', () => {
      const item = createFoodItem('Bio Eier', undefined, 10);
      const results = ranker.rankResults([item], 'eier');
      const explanation = ranker.explainScore(results[0], 'eier');

      expect(explanation).toContain('Query: "eier"');
      expect(explanation).toContain('Bio Eier');
      expect(explanation).toContain('Match Type:');
      expect(explanation).toContain('Base Score:');
    });
  });
});
