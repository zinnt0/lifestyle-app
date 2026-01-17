/**
 * Food Search Screen
 *
 * Search for food items with:
 * - Text search input
 * - Barcode scanner button
 * - Recent searches
 * - Popular foods
 */

import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import type { NutritionStackParamList } from '../../navigation/NutritionStackNavigator';
import { COLORS, SPACING, BORDER_RADIUS, SHADOWS } from '../../components/ui/theme';
import { Ionicons } from '@expo/vector-icons';
import { foodService } from '../../services/FoodService';
import { localFoodCache } from '../../services/cache/LocalFoodCache';
import type { FoodItem } from '../../types/nutrition';

type NavigationProp = NativeStackNavigationProp<
  NutritionStackParamList,
  'FoodSearch'
>;

type FoodSearchRouteProp = RouteProp<NutritionStackParamList, 'FoodSearch'>;

export function FoodSearchScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<FoodSearchRouteProp>();
  const { mealType } = route.params || {};

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<FoodItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Mock recent searches - replace with actual storage
  const [recentSearches] = useState([
    'Müsli',
    'Apfel',
    'Hähnchenbrust',
    'Vollkornbrot',
  ]);

  // Mock popular foods - replace with actual API call
  const [popularFoods] = useState([
    'Banane',
    'Milch',
    'Eier',
    'Haferflocken',
    'Joghurt',
    'Reis',
  ]);

  // Perform search using FoodService (Local > Supabase > API hierarchy)
  const handleSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Use the FoodService which implements proper hierarchy:
      // 1. Local SQLite cache (highest priority)
      // 2. Supabase cloud cache (second priority)
      // 3. OpenFoodFacts API (lowest priority, filtered by name match)
      const response = await foodService.searchFoods(query);
      console.log(`[FoodSearchScreen] Search complete: ${response.items.length} results (source: ${response.source})`);

      // Map FoodItem to the format expected by the UI
      const mappedResults = response.items.map((item) => ({
        ...item,
        // Ensure calories field is set for UI display
        calories: item.calories || 0,
        protein: item.protein || 0,
        carbs: item.carbs || 0,
        fat: item.fat || 0,
      }));

      setSearchResults(mappedResults);
    } catch (err) {
      setError('Fehler beim Suchen. Bitte versuche es erneut.');
      console.error('[FoodSearchScreen] Search error:', err);
      setSearchResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // Handle quick search from recent/popular
  const handleQuickSearch = useCallback((query: string) => {
    setSearchQuery(query);
    handleSearch(query);
  }, [handleSearch]);

  // Navigate to barcode scanner
  const handleOpenScanner = useCallback(() => {
    navigation.navigate('BarcodeScanner', { mealType });
  }, [navigation, mealType]);

  // Navigate to food detail
  const handleSelectFood = useCallback(async (food: FoodItem) => {
    // Cache the food locally when user shows interest
    // This ensures searched foods are also available in local cache
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
      console.log('[FoodSearch] Food cached locally:', food.name);
    } catch (error) {
      console.warn('[FoodSearch] Failed to cache food locally:', error);
      // Don't block navigation on cache failure
    }

    navigation.navigate('FoodDetail', { food, mealType });
  }, [navigation, mealType]);

  // Get placeholder text based on meal type
  const getPlaceholder = () => {
    switch (mealType) {
      case 'breakfast':
        return 'Was hattest du zum Frühstück?';
      case 'lunch':
        return 'Was hattest du zum Mittagessen?';
      case 'dinner':
        return 'Was hattest du zum Abendessen?';
      case 'snacks':
        return 'Welchen Snack hattest du?';
      default:
        return 'Lebensmittel suchen...';
    }
  };

  // Render food item
  const renderFoodItem = ({ item }: { item: FoodItem }) => (
    <TouchableOpacity
      style={styles.foodItem}
      onPress={() => handleSelectFood(item)}
    >
      <View style={styles.foodItemContent}>
        <View style={styles.foodItemInfo}>
          <Text style={styles.foodItemName}>{item.name}</Text>
          {item.brand && (
            <Text style={styles.foodItemBrand}>{item.brand}</Text>
          )}
        </View>
        <View style={styles.foodItemCalories}>
          <Text style={styles.foodItemCaloriesText}>
            {item.calories || 0} kcal
          </Text>
          <Text style={styles.foodItemServingSize}>
            {item.serving_size ? `pro ${item.serving_size}g` : 'pro 100g'}
          </Text>
        </View>
      </View>
      <Ionicons name="chevron-forward" size={20} color={COLORS.textTertiary} />
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      {/* Search Input */}
      <View style={styles.searchHeader}>
        <View style={styles.searchInputContainer}>
          <Ionicons
            name="search"
            size={20}
            color={COLORS.textSecondary}
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            placeholder={getPlaceholder()}
            placeholderTextColor={COLORS.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={() => handleSearch(searchQuery)}
            returnKeyType="search"
            autoFocus
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              onPress={() => {
                setSearchQuery('');
                setSearchResults([]);
              }}
            >
              <Ionicons name="close-circle" size={20} color={COLORS.textSecondary} />
            </TouchableOpacity>
          )}
        </View>

        {/* Barcode Scanner Button */}
        <TouchableOpacity
          style={styles.scannerButton}
          onPress={handleOpenScanner}
        >
          <Ionicons name="barcode-outline" size={24} color={COLORS.white} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
        {/* Search Results */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loadingText}>Suche...</Text>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle" size={48} color={COLORS.error} />
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={() => handleSearch(searchQuery)}
            >
              <Text style={styles.retryButtonText}>Erneut versuchen</Text>
            </TouchableOpacity>
          </View>
        ) : searchResults.length > 0 ? (
          <View style={styles.resultsContainer}>
            <Text style={styles.sectionTitle}>
              {searchResults.length} Ergebnisse
            </Text>
            <FlatList
              data={searchResults}
              renderItem={renderFoodItem}
              keyExtractor={(item, index) => `${item.barcode}-${index}`}
              scrollEnabled={false}
            />
          </View>
        ) : (
          <>
            {/* Recent Searches */}
            {recentSearches.length > 0 && (
              <View style={styles.section}>
                <View style={styles.sectionHeader}>
                  <Ionicons name="time-outline" size={20} color={COLORS.textSecondary} />
                  <Text style={styles.sectionTitle}>Zuletzt</Text>
                </View>
                <View style={styles.chipsContainer}>
                  {recentSearches.map((search, index) => (
                    <TouchableOpacity
                      key={index}
                      style={styles.chip}
                      onPress={() => handleQuickSearch(search)}
                    >
                      <Text style={styles.chipText}>{search}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            )}

            {/* Popular Foods */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons name="flame-outline" size={20} color={COLORS.textSecondary} />
                <Text style={styles.sectionTitle}>Häufig</Text>
              </View>
              <View style={styles.chipsContainer}>
                {popularFoods.map((food, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.chip}
                    onPress={() => handleQuickSearch(food)}
                  >
                    <Text style={styles.chipText}>{food}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Quick Categories */}
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons name="apps-outline" size={20} color={COLORS.textSecondary} />
                <Text style={styles.sectionTitle}>Lebensmittel</Text>
              </View>
              <View style={styles.categoriesGrid}>
                {[
                  { icon: '🥕', label: 'Gemüse', query: 'Gemüse' },
                  { icon: '🍎', label: 'Obst', query: 'Obst' },
                  { icon: '🍞', label: 'Brot', query: 'Brot' },
                  { icon: '🧀', label: 'Käse', query: 'Käse' },
                  { icon: '🥩', label: 'Fleisch', query: 'Fleisch' },
                  { icon: '🐟', label: 'Fisch', query: 'Fisch' },
                ].map((category, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.categoryCard}
                    onPress={() => handleQuickSearch(category.query)}
                  >
                    <Text style={styles.categoryIcon}>{category.icon}</Text>
                    <Text style={styles.categoryLabel}>{category.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Helpful Tip */}
            <View style={styles.tipContainer}>
              <Ionicons name="bulb-outline" size={20} color={COLORS.warning} />
              <Text style={styles.tipText}>
                Tipp: Nutze den Barcode-Scanner für schnelleres Hinzufügen von
                verpackten Lebensmitteln
              </Text>
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  searchHeader: {
    flexDirection: 'row',
    padding: SPACING.lg,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    gap: SPACING.md,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surfaceSecondary,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md,
    height: 48,
  },
  searchIcon: {
    marginRight: SPACING.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: COLORS.text,
  },
  scannerButton: {
    width: 48,
    height: 48,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.lg,
  },

  // Loading & Error States
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.xxxl,
  },
  loadingText: {
    marginTop: SPACING.md,
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  errorContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.xxxl,
  },
  errorText: {
    marginTop: SPACING.md,
    marginBottom: SPACING.lg,
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
  },
  retryButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },

  // Search Results
  resultsContainer: {
    marginTop: SPACING.md,
  },
  foodItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.lg,
    marginBottom: SPACING.sm,
    ...SHADOWS.sm,
  },
  foodItemContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  foodItemInfo: {
    flex: 1,
    marginRight: SPACING.md,
  },
  foodItemName: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.text,
    marginBottom: 2,
  },
  foodItemBrand: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  foodItemCalories: {
    alignItems: 'flex-end',
  },
  foodItemCaloriesText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.success,
  },
  foodItemServingSize: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },

  // Sections
  section: {
    marginBottom: SPACING.xl,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.md,
    gap: SPACING.sm,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },

  // Chips
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  chip: {
    backgroundColor: COLORS.white,
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.full,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  chipText: {
    fontSize: 14,
    color: COLORS.text,
  },

  // Categories
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.md,
  },
  categoryCard: {
    width: '30%',
    aspectRatio: 1,
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    ...SHADOWS.sm,
  },
  categoryIcon: {
    fontSize: 32,
    marginBottom: SPACING.sm,
  },
  categoryLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.text,
  },

  // Tip
  tipContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFF9E6',
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.md,
    gap: SPACING.md,
    marginTop: SPACING.xl,
  },
  tipText: {
    flex: 1,
    fontSize: 14,
    color: COLORS.text,
    lineHeight: 20,
  },
});
