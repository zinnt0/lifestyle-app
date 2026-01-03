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
import { searchFood, type FoodItem } from '../../services/nutritionApi';

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

  // Perform search
  const handleSearch = useCallback(async (query: string) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await searchFood(query, 20);
      console.log('Search response:', JSON.stringify(response, null, 2));

      // Combine local and external results if response has that structure
      if (response.results) {
        const allResults = [
          ...(response.results.local || []),
          ...(response.results.external || [])
        ];
        console.log(`Found ${allResults.length} total results`);
        setSearchResults(allResults);
      } else if (response.foods) {
        // Fallback for alternative response structure
        console.log(`Found ${response.foods.length} foods`);
        setSearchResults(response.foods);
      } else {
        console.log('No results in response');
        setSearchResults([]);
      }
    } catch (err) {
      setError('Fehler beim Suchen. Bitte versuche es erneut.');
      console.error('Search error:', err);
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
    navigation.navigate('BarcodeScanner');
  }, [navigation]);

  // Navigate to food detail
  const handleSelectFood = useCallback((food: FoodItem) => {
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
    <SafeAreaView style={styles.container} edges={['bottom']}>
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
