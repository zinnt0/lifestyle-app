/**
 * Food Search Component
 * Search for food items with debounced API calls and caching
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFoodSearch } from '../../hooks/useNutrition';
import type { FoodItem } from '../../types/nutrition';
import { nutritionTheme, formatCalories, formatNutritionValue, getNutriscoreColor } from '../../constants/nutritionTheme';

interface FoodSearchProps {
  onFoodSelect: (food: FoodItem) => void;
}

export function FoodSearch({ onFoodSelect }: FoodSearchProps) {
  const [query, setQuery] = useState('');
  const { results, search, loading, error, reset } = useFoodSearch();

  const handleSearch = useCallback((text: string) => {
    setQuery(text);
    search(text);
  }, [search]);

  const handleClear = useCallback(() => {
    setQuery('');
    reset();
  }, [reset]);

  const renderItem = ({ item }: { item: FoodItem }) => (
    <FoodSearchItem food={item} onPress={() => onFoodSelect(item)} />
  );

  const renderEmpty = () => {
    if (loading) return null;

    if (error) {
      return (
        <View style={styles.emptyContainer}>
          <Ionicons name="alert-circle" size={48} color={nutritionTheme.colors.goalFar} />
          <Text style={styles.emptyText}>Search failed</Text>
          <Text style={styles.emptySubtext}>{error.message}</Text>
        </View>
      );
    }

    if (query.length > 0 && results.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Ionicons name="search" size={48} color={nutritionTheme.colors.divider} />
          <Text style={styles.emptyText}>No results found</Text>
          <Text style={styles.emptySubtext}>Try a different search term</Text>
        </View>
      );
    }

    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="restaurant-outline" size={48} color={nutritionTheme.colors.divider} />
        <Text style={styles.emptyText}>Search for food</Text>
        <Text style={styles.emptySubtext}>Enter a food name or brand</Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Search Input */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color={nutritionTheme.colors.divider} style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search for food..."
          placeholderTextColor={nutritionTheme.colors.divider}
          value={query}
          onChangeText={handleSearch}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="search"
          accessibilityLabel="Search for food"
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={handleClear} accessibilityLabel="Clear search">
            <Ionicons name="close-circle" size={20} color={nutritionTheme.colors.divider} />
          </TouchableOpacity>
        )}
      </View>

      {/* Loading Indicator */}
      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color={nutritionTheme.colors.protein} />
          <Text style={styles.loadingText}>Searching...</Text>
        </View>
      )}

      {/* Results List */}
      <FlatList
        data={results}
        renderItem={renderItem}
        keyExtractor={(item) => item.barcode}
        contentContainerStyle={styles.listContent}
        ListEmptyComponent={renderEmpty}
        refreshControl={
          <RefreshControl
            refreshing={loading}
            onRefresh={() => search(query)}
          />
        }
      />
    </View>
  );
}

// Food Search Item Component
interface FoodSearchItemProps {
  food: FoodItem;
  onPress: () => void;
}

function FoodSearchItem({ food, onPress }: FoodSearchItemProps) {
  const nutriscoreColor = getNutriscoreColor(food.nutriscore_grade);

  return (
    <TouchableOpacity
      style={styles.foodItem}
      onPress={onPress}
      accessibilityLabel={`Select ${food.name}`}
    >
      <View style={styles.foodItemContent}>
        {/* Food Info */}
        <View style={styles.foodInfo}>
          <Text style={styles.foodName} numberOfLines={2}>
            {food.name}
          </Text>
          {food.brand && (
            <Text style={styles.foodBrand} numberOfLines={1}>
              {food.brand}
            </Text>
          )}

          {/* Macros Preview */}
          <View style={styles.macrosPreview}>
            <Text style={styles.macroText}>
              {formatCalories(food.calories)} kcal
            </Text>
            <Text style={styles.macroDivider}>•</Text>
            <Text style={styles.macroText}>
              P: {formatNutritionValue(food.protein)}
            </Text>
            <Text style={styles.macroDivider}>•</Text>
            <Text style={styles.macroText}>
              C: {formatNutritionValue(food.carbs)}
            </Text>
            <Text style={styles.macroDivider}>•</Text>
            <Text style={styles.macroText}>
              F: {formatNutritionValue(food.fat)}
            </Text>
          </View>
        </View>

        {/* Nutriscore Badge */}
        <View style={styles.badgeContainer}>
          {food.nutriscore_grade && (
            <View style={[styles.nutriscoreBadge, { backgroundColor: nutriscoreColor }]}>
              <Text style={styles.nutriscoreText}>
                {food.nutriscore_grade.toUpperCase()}
              </Text>
            </View>
          )}

          {/* Source Badge */}
          <SourceBadge source={food.source} cached={!!food.cached_at} />
        </View>
      </View>

      {/* Chevron */}
      <Ionicons name="chevron-forward" size={20} color={nutritionTheme.colors.divider} />
    </TouchableOpacity>
  );
}

// Source Badge Component
interface SourceBadgeProps {
  source: 'openfoodfacts' | 'curated';
  cached: boolean;
}

function SourceBadge({ source, cached }: SourceBadgeProps) {
  return (
    <View style={styles.sourceBadge}>
      {cached ? (
        <Ionicons name="checkmark-circle" size={12} color={nutritionTheme.colors.goalMet} />
      ) : (
        <Ionicons name="cloud-download-outline" size={12} color={nutritionTheme.colors.divider} />
      )}
      <Text style={styles.sourceText}>
        {cached ? 'Cached' : 'OFF'}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: nutritionTheme.colors.cardBackground,
    borderRadius: nutritionTheme.borderRadius.md,
    paddingHorizontal: nutritionTheme.spacing.md,
    paddingVertical: nutritionTheme.spacing.sm,
    margin: nutritionTheme.spacing.md,
    ...nutritionTheme.shadows.card,
  },
  searchIcon: {
    marginRight: nutritionTheme.spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#000',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: nutritionTheme.spacing.md,
    gap: nutritionTheme.spacing.sm,
  },
  loadingText: {
    ...nutritionTheme.typography.caption,
    color: nutritionTheme.colors.divider,
  },
  listContent: {
    padding: nutritionTheme.spacing.md,
    paddingTop: 0,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: nutritionTheme.spacing.xxl,
    marginTop: nutritionTheme.spacing.xl,
  },
  emptyText: {
    ...nutritionTheme.typography.h3,
    marginTop: nutritionTheme.spacing.md,
  },
  emptySubtext: {
    ...nutritionTheme.typography.caption,
    color: nutritionTheme.colors.divider,
    marginTop: nutritionTheme.spacing.xs,
    textAlign: 'center',
  },
  foodItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: nutritionTheme.colors.cardBackground,
    borderRadius: nutritionTheme.borderRadius.lg,
    padding: nutritionTheme.spacing.md,
    marginBottom: nutritionTheme.spacing.sm,
    ...nutritionTheme.shadows.card,
  },
  foodItemContent: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginRight: nutritionTheme.spacing.sm,
  },
  foodInfo: {
    flex: 1,
  },
  foodName: {
    ...nutritionTheme.typography.bodyBold,
    marginBottom: 2,
  },
  foodBrand: {
    ...nutritionTheme.typography.caption,
    color: nutritionTheme.colors.divider,
    marginBottom: nutritionTheme.spacing.xs,
  },
  macrosPreview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  macroText: {
    ...nutritionTheme.typography.small,
    color: nutritionTheme.colors.divider,
  },
  macroDivider: {
    ...nutritionTheme.typography.small,
    color: nutritionTheme.colors.divider,
  },
  badgeContainer: {
    alignItems: 'flex-end',
    gap: nutritionTheme.spacing.xs,
  },
  nutriscoreBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nutriscoreText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  sourceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
    backgroundColor: '#F0F0F0',
    borderRadius: nutritionTheme.borderRadius.sm,
  },
  sourceText: {
    fontSize: 10,
    fontWeight: '600',
    color: nutritionTheme.colors.divider,
  },
});
