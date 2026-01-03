/**
 * Meal Diary List Component
 * Displays food diary entries grouped by meal type with swipe-to-delete
 */

import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  GestureHandlerRootView,
  Swipeable,
  RectButton,
} from 'react-native-gesture-handler';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import type { DiaryEntry, MealType } from '../../types/nutrition';
import { useFoodDiary } from '../../hooks/useNutrition';
import { nutritionTheme, formatCalories, formatNutritionValue } from '../../constants/nutritionTheme';

interface MealDiaryListProps {
  entries: DiaryEntry[];
  userId: string;
}

export function MealDiaryList({ entries, userId }: MealDiaryListProps) {
  // Group entries by meal type
  const groupedEntries = useMemo(() => {
    const groups: Record<MealType, DiaryEntry[]> = {
      breakfast: [],
      lunch: [],
      dinner: [],
      snack: [],
    };

    entries.forEach((entry) => {
      if (entry.meal_type in groups) {
        groups[entry.meal_type].push(entry);
      }
    });

    return groups;
  }, [entries]);

  // Calculate totals per meal
  const mealTotals = useMemo(() => {
    const totals: Record<MealType, number> = {
      breakfast: 0,
      lunch: 0,
      dinner: 0,
      snack: 0,
    };

    Object.entries(groupedEntries).forEach(([mealType, entries]) => {
      totals[mealType as MealType] = entries.reduce(
        (sum, entry) => sum + entry.calories,
        0
      );
    });

    return totals;
  }, [groupedEntries]);

  if (entries.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="restaurant-outline" size={48} color={nutritionTheme.colors.divider} />
        <Text style={styles.emptyText}>No meals logged today</Text>
        <Text style={styles.emptySubtext}>Start tracking by scanning or searching for food</Text>
      </View>
    );
  }

  return (
    <GestureHandlerRootView>
      <View style={styles.container}>
        {(['breakfast', 'lunch', 'dinner', 'snack'] as MealType[]).map((mealType) => {
          const mealEntries = groupedEntries[mealType];
          if (mealEntries.length === 0) return null;

          return (
            <MealSection
              key={mealType}
              mealType={mealType}
              entries={mealEntries}
              total={mealTotals[mealType]}
              userId={userId}
            />
          );
        })}
      </View>
    </GestureHandlerRootView>
  );
}

// Meal Section Component
interface MealSectionProps {
  mealType: MealType;
  entries: DiaryEntry[];
  total: number;
  userId: string;
}

function MealSection({ mealType, entries, total, userId }: MealSectionProps) {
  const { deleteEntry } = useFoodDiary(userId, new Date().toISOString().split('T')[0]);

  const handleDelete = async (entryId: string) => {
    Alert.alert(
      'Delete Entry',
      'Are you sure you want to remove this food entry?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteEntry(entryId);
            } catch (error) {
              Alert.alert('Error', 'Failed to delete entry');
            }
          },
        },
      ]
    );
  };

  return (
    <Animated.View
      entering={FadeIn.duration(300)}
      exiting={FadeOut.duration(200)}
      style={styles.mealSection}
    >
      {/* Meal Header */}
      <View style={styles.mealHeader}>
        <View style={styles.mealTitleContainer}>
          <Ionicons
            name={getMealIcon(mealType)}
            size={20}
            color={nutritionTheme.colors.protein}
          />
          <Text style={styles.mealTitle}>{formatMealType(mealType)}</Text>
        </View>
        <Text style={styles.mealTotal}>{formatCalories(total)} kcal</Text>
      </View>

      {/* Meal Entries */}
      {entries.map((entry) => (
        <DiaryEntryItem
          key={entry.id}
          entry={entry}
          onDelete={() => handleDelete(entry.id)}
        />
      ))}
    </Animated.View>
  );
}

// Diary Entry Item Component
interface DiaryEntryItemProps {
  entry: DiaryEntry;
  onDelete: () => void;
}

function DiaryEntryItem({ entry, onDelete }: DiaryEntryItemProps) {
  const renderRightActions = () => (
    <RectButton style={styles.deleteButton} onPress={onDelete}>
      <Ionicons name="trash-outline" size={24} color="#FFFFFF" />
    </RectButton>
  );

  return (
    <Swipeable
      renderRightActions={renderRightActions}
      overshootRight={false}
      rightThreshold={40}
    >
      <View style={styles.entryItem}>
        <View style={styles.entryContent}>
          <View style={styles.entryMain}>
            <Text style={styles.entryName} numberOfLines={1}>
              {entry.food_item.name}
            </Text>
            {entry.food_item.brand && (
              <Text style={styles.entryBrand} numberOfLines={1}>
                {entry.food_item.brand}
              </Text>
            )}
          </View>

          <View style={styles.entryDetails}>
            <Text style={styles.entryAmount}>
              {Math.round(entry.amount)}g
            </Text>
            <Text style={styles.entryCalories}>
              {formatCalories(entry.calories)} kcal
            </Text>
          </View>
        </View>

        {/* Macros preview */}
        <View style={styles.macrosPreview}>
          <MacroTag label="P" value={entry.protein} color={nutritionTheme.colors.protein} />
          <MacroTag label="C" value={entry.carbs} color={nutritionTheme.colors.carbs} />
          <MacroTag label="F" value={entry.fat} color={nutritionTheme.colors.fat} />
        </View>
      </View>
    </Swipeable>
  );
}

// Macro Tag Component
interface MacroTagProps {
  label: string;
  value: number;
  color: string;
}

function MacroTag({ label, value, color }: MacroTagProps) {
  return (
    <View style={[styles.macroTag, { backgroundColor: `${color}15` }]}>
      <Text style={[styles.macroLabel, { color }]}>{label}</Text>
      <Text style={styles.macroValue}>{Math.round(value)}g</Text>
    </View>
  );
}

// Helper functions
function getMealIcon(mealType: MealType): keyof typeof Ionicons.glyphMap {
  const icons: Record<MealType, keyof typeof Ionicons.glyphMap> = {
    breakfast: 'cafe-outline',
    lunch: 'fast-food-outline',
    dinner: 'restaurant-outline',
    snack: 'nutrition-outline',
  };
  return icons[mealType];
}

function formatMealType(mealType: MealType): string {
  return mealType.charAt(0).toUpperCase() + mealType.slice(1);
}

const styles = StyleSheet.create({
  container: {
    gap: nutritionTheme.spacing.md,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: nutritionTheme.spacing.xxl,
    backgroundColor: nutritionTheme.colors.cardBackground,
    borderRadius: nutritionTheme.borderRadius.lg,
  },
  emptyText: {
    ...nutritionTheme.typography.bodyBold,
    marginTop: nutritionTheme.spacing.md,
  },
  emptySubtext: {
    ...nutritionTheme.typography.caption,
    color: nutritionTheme.colors.divider,
    marginTop: nutritionTheme.spacing.xs,
    textAlign: 'center',
  },
  mealSection: {
    backgroundColor: nutritionTheme.colors.cardBackground,
    borderRadius: nutritionTheme.borderRadius.lg,
    overflow: 'hidden',
    ...nutritionTheme.shadows.card,
  },
  mealHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: nutritionTheme.spacing.md,
    backgroundColor: '#F8F9FA',
    borderBottomWidth: 1,
    borderBottomColor: nutritionTheme.colors.divider,
  },
  mealTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: nutritionTheme.spacing.sm,
  },
  mealTitle: {
    ...nutritionTheme.typography.h3,
    fontSize: 18,
  },
  mealTotal: {
    ...nutritionTheme.typography.bodyBold,
    color: nutritionTheme.colors.protein,
  },
  entryItem: {
    backgroundColor: nutritionTheme.colors.cardBackground,
    padding: nutritionTheme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: nutritionTheme.colors.divider,
  },
  entryContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: nutritionTheme.spacing.sm,
  },
  entryMain: {
    flex: 1,
    marginRight: nutritionTheme.spacing.md,
  },
  entryName: {
    ...nutritionTheme.typography.bodyBold,
    marginBottom: 2,
  },
  entryBrand: {
    ...nutritionTheme.typography.caption,
    color: nutritionTheme.colors.divider,
  },
  entryDetails: {
    alignItems: 'flex-end',
  },
  entryAmount: {
    ...nutritionTheme.typography.caption,
    color: nutritionTheme.colors.divider,
  },
  entryCalories: {
    ...nutritionTheme.typography.bodyBold,
    color: nutritionTheme.colors.protein,
  },
  macrosPreview: {
    flexDirection: 'row',
    gap: nutritionTheme.spacing.sm,
  },
  macroTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: nutritionTheme.borderRadius.sm,
  },
  macroLabel: {
    fontSize: 10,
    fontWeight: '700',
  },
  macroValue: {
    fontSize: 10,
    fontWeight: '400',
    color: '#000',
  },
  deleteButton: {
    backgroundColor: nutritionTheme.colors.goalFar,
    justifyContent: 'center',
    alignItems: 'center',
    width: 80,
    height: '100%',
  },
});
