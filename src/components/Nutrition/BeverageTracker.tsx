/**
 * Beverage Tracker Component
 * Swipeable tracker for Water, Coffee, and Energy Drinks
 * Displays intake with quick add buttons and swipe navigation
 */

import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  COLORS,
  SPACING,
  BORDER_RADIUS,
  SHADOWS,
} from '../ui/theme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Caffeine content constants (in mg)
export const CAFFEINE_CONTENT = {
  COFFEE_CUP: 90, // ~90mg per cup (200ml) - average brewed coffee
  ENERGY_DRINK: 80, // ~80mg per can (250ml) - standard energy drink like Red Bull
};

export type BeverageType = 'water' | 'coffee' | 'energy_drink';

interface BeverageTrackerProps {
  // Water data
  waterConsumed: number; // in ml
  waterGoal: number; // in ml
  onAddWater: (amount: number) => void;
  // Coffee data
  coffeeCups: number;
  onAddCoffee: (cups: number) => void;
  // Energy drink data
  energyDrinks: number;
  onAddEnergyDrink: (cans: number) => void;
  // Total caffeine (calculated)
  totalCaffeineMg: number;
}

export function BeverageTracker({
  waterConsumed,
  waterGoal,
  onAddWater,
  coffeeCups,
  onAddCoffee,
  energyDrinks,
  onAddEnergyDrink,
  totalCaffeineMg,
}: BeverageTrackerProps) {
  const [activeIndex, setActiveIndex] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);

  const trackers: { type: BeverageType; title: string; icon: string; color: string }[] = [
    { type: 'water', title: 'Wasser', icon: 'water', color: COLORS.primary },
    { type: 'coffee', title: 'Kaffee', icon: 'cafe', color: '#8B4513' },
    { type: 'energy_drink', title: 'Energy Drink', icon: 'flash', color: '#FF6B00' },
  ];

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const contentOffsetX = event.nativeEvent.contentOffset.x;
    const cardWidth = SCREEN_WIDTH - 2 * SPACING.lg;
    const newIndex = Math.round(contentOffsetX / cardWidth);
    if (newIndex !== activeIndex && newIndex >= 0 && newIndex < trackers.length) {
      setActiveIndex(newIndex);
    }
  };

  const scrollToIndex = (index: number) => {
    const cardWidth = SCREEN_WIDTH - 2 * SPACING.lg;
    scrollViewRef.current?.scrollTo({ x: index * cardWidth, animated: true });
    setActiveIndex(index);
  };

  const renderWaterTracker = () => (
    <View style={styles.trackerContent}>
      <View style={styles.mainValueContainer}>
        <Ionicons name="water" size={32} color={COLORS.primary} />
        <Text style={[styles.mainValue, { color: COLORS.primary }]}>
          {(waterConsumed / 1000).toFixed(2)} l
        </Text>
      </View>
      <Text style={styles.goalText}>Ziel: {waterGoal / 1000} L</Text>

      {/* Water Glasses */}
      <View style={styles.glassesContainer}>
        {[...Array(8)].map((_, index) => {
          const glassAmount = waterGoal / 8;
          const filled = waterConsumed >= glassAmount * (index + 1);
          return (
            <TouchableOpacity
              key={index}
              style={[styles.glassButton, filled && styles.glassButtonFilled]}
              onPress={() => onAddWater(250)}
            >
              <Ionicons
                name={filled ? 'water' : 'water-outline'}
                size={24}
                color={filled ? COLORS.primary : COLORS.textTertiary}
              />
            </TouchableOpacity>
          );
        })}
      </View>

      <Text style={styles.hintText}>
        Tippe auf ein Glas um 250ml hinzuzufügen
      </Text>
    </View>
  );

  const renderCoffeeTracker = () => (
    <View style={styles.trackerContent}>
      <View style={styles.mainValueContainer}>
        <Ionicons name="cafe" size={32} color="#8B4513" />
        <Text style={[styles.mainValue, { color: '#8B4513' }]}>
          {coffeeCups} {coffeeCups === 1 ? 'Tasse' : 'Tassen'}
        </Text>
      </View>
      <Text style={styles.caffeineText}>
        ≈ {coffeeCups * CAFFEINE_CONTENT.COFFEE_CUP} mg Koffein
      </Text>

      {/* Coffee Cups Display */}
      <View style={styles.cupsContainer}>
        {[...Array(Math.min(coffeeCups, 8))].map((_, index) => (
          <View key={index} style={styles.cupIcon}>
            <Ionicons name="cafe" size={28} color="#8B4513" />
          </View>
        ))}
        {coffeeCups > 8 && (
          <Text style={styles.moreText}>+{coffeeCups - 8}</Text>
        )}
        {coffeeCups === 0 && (
          <Text style={styles.emptyText}>Noch kein Kaffee heute</Text>
        )}
      </View>

      {/* Quick Add Buttons */}
      <View style={styles.quickAddRow}>
        <TouchableOpacity
          style={[styles.quickAddButton, { borderColor: '#8B4513' }]}
          onPress={() => onAddCoffee(1)}
        >
          <Ionicons name="add" size={20} color="#8B4513" />
          <Text style={[styles.quickAddText, { color: '#8B4513' }]}>1 Tasse</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.quickAddButton, { borderColor: '#8B4513' }]}
          onPress={() => onAddCoffee(2)}
        >
          <Ionicons name="add" size={20} color="#8B4513" />
          <Text style={[styles.quickAddText, { color: '#8B4513' }]}>2 Tassen</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.infoText}>
        ~{CAFFEINE_CONTENT.COFFEE_CUP}mg Koffein pro Tasse (200ml)
      </Text>
    </View>
  );

  const renderEnergyDrinkTracker = () => (
    <View style={styles.trackerContent}>
      <View style={styles.mainValueContainer}>
        <Ionicons name="flash" size={32} color="#FF6B00" />
        <Text style={[styles.mainValue, { color: '#FF6B00' }]}>
          {energyDrinks} {energyDrinks === 1 ? 'Dose' : 'Dosen'}
        </Text>
      </View>
      <Text style={styles.caffeineText}>
        ≈ {energyDrinks * CAFFEINE_CONTENT.ENERGY_DRINK} mg Koffein
      </Text>

      {/* Energy Drink Cans Display */}
      <View style={styles.cupsContainer}>
        {[...Array(Math.min(energyDrinks, 6))].map((_, index) => (
          <View key={index} style={styles.canIcon}>
            <Ionicons name="flash" size={28} color="#FF6B00" />
          </View>
        ))}
        {energyDrinks > 6 && (
          <Text style={styles.moreText}>+{energyDrinks - 6}</Text>
        )}
        {energyDrinks === 0 && (
          <Text style={styles.emptyText}>Noch kein Energy Drink heute</Text>
        )}
      </View>

      {/* Quick Add Buttons */}
      <View style={styles.quickAddRow}>
        <TouchableOpacity
          style={[styles.quickAddButton, { borderColor: '#FF6B00' }]}
          onPress={() => onAddEnergyDrink(1)}
        >
          <Ionicons name="add" size={20} color="#FF6B00" />
          <Text style={[styles.quickAddText, { color: '#FF6B00' }]}>1 Dose</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.quickAddButton, { borderColor: '#FF6B00' }]}
          onPress={() => onAddEnergyDrink(2)}
        >
          <Ionicons name="add" size={20} color="#FF6B00" />
          <Text style={[styles.quickAddText, { color: '#FF6B00' }]}>2 Dosen</Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.infoText}>
        ~{CAFFEINE_CONTENT.ENERGY_DRINK}mg Koffein pro Dose (250ml)
      </Text>
    </View>
  );

  const renderTrackerContent = (type: BeverageType) => {
    switch (type) {
      case 'water':
        return renderWaterTracker();
      case 'coffee':
        return renderCoffeeTracker();
      case 'energy_drink':
        return renderEnergyDrinkTracker();
    }
  };

  return (
    <View style={styles.container}>
      {/* Tab Indicators */}
      <View style={styles.tabIndicatorContainer}>
        {trackers.map((tracker, index) => (
          <TouchableOpacity
            key={tracker.type}
            style={[
              styles.tabIndicator,
              activeIndex === index && styles.tabIndicatorActive,
              activeIndex === index && { backgroundColor: tracker.color + '20' },
            ]}
            onPress={() => scrollToIndex(index)}
          >
            <Ionicons
              name={tracker.icon as any}
              size={18}
              color={activeIndex === index ? tracker.color : COLORS.textTertiary}
            />
            <Text
              style={[
                styles.tabIndicatorText,
                activeIndex === index && { color: tracker.color, fontWeight: '600' },
              ]}
            >
              {tracker.title}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Swipeable Content */}
      <ScrollView
        ref={scrollViewRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScroll}
        snapToInterval={SCREEN_WIDTH - 2 * SPACING.lg}
        decelerationRate="fast"
        contentContainerStyle={styles.scrollContent}
      >
        {trackers.map((tracker) => (
          <View
            key={tracker.type}
            style={[styles.trackerCard, { width: SCREEN_WIDTH - 2 * SPACING.lg }]}
          >
            {renderTrackerContent(tracker.type)}
          </View>
        ))}
      </ScrollView>

      {/* Dot Indicators */}
      <View style={styles.dotContainer}>
        {trackers.map((tracker, index) => (
          <View
            key={tracker.type}
            style={[
              styles.dot,
              activeIndex === index && styles.dotActive,
              activeIndex === index && { backgroundColor: tracker.color },
            ]}
          />
        ))}
      </View>

      {/* Total Caffeine Summary (shown when not on water tab) */}
      {activeIndex !== 0 && totalCaffeineMg > 0 && (
        <View style={styles.caffeineSummary}>
          <Ionicons name="flash-outline" size={16} color={COLORS.textSecondary} />
          <Text style={styles.caffeineSummaryText}>
            Gesamt Koffein heute: {totalCaffeineMg} mg
          </Text>
          {totalCaffeineMg > 400 && (
            <Text style={styles.caffeineWarning}>
              (Empfohlen: max. 400mg/Tag)
            </Text>
          )}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    paddingVertical: SPACING.lg,
    marginBottom: SPACING.lg,
    ...SHADOWS.sm,
  },
  tabIndicatorContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.md,
  },
  tabIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.surfaceSecondary,
  },
  tabIndicatorActive: {
    ...SHADOWS.sm,
  },
  tabIndicatorText: {
    fontSize: 13,
    color: COLORS.textTertiary,
    fontWeight: '500',
  },
  scrollContent: {
    paddingHorizontal: 0,
  },
  trackerCard: {
    paddingHorizontal: SPACING.lg,
  },
  trackerContent: {
    alignItems: 'center',
    paddingVertical: SPACING.md,
  },
  mainValueContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.xs,
  },
  mainValue: {
    fontSize: 32,
    fontWeight: 'bold',
  },
  goalText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: SPACING.lg,
  },
  caffeineText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: SPACING.lg,
  },
  glassesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  glassButton: {
    width: 50,
    height: 50,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  glassButtonFilled: {
    backgroundColor: '#E3F2FD',
  },
  cupsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    gap: SPACING.sm,
    marginBottom: SPACING.lg,
    minHeight: 50,
  },
  cupIcon: {
    width: 44,
    height: 44,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: '#F5E6D3',
    alignItems: 'center',
    justifyContent: 'center',
  },
  canIcon: {
    width: 44,
    height: 44,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: '#FFE8D6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  moreText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.textSecondary,
    marginLeft: SPACING.xs,
  },
  emptyText: {
    fontSize: 14,
    color: COLORS.textTertiary,
    fontStyle: 'italic',
  },
  quickAddRow: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginBottom: SPACING.md,
  },
  quickAddButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.lg,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1.5,
    backgroundColor: COLORS.white,
  },
  quickAddText: {
    fontSize: 14,
    fontWeight: '600',
  },
  hintText: {
    fontSize: 12,
    color: COLORS.textTertiary,
    marginTop: SPACING.xs,
  },
  infoText: {
    fontSize: 11,
    color: COLORS.textTertiary,
    fontStyle: 'italic',
  },
  dotContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: SPACING.xs,
    marginTop: SPACING.md,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: COLORS.border,
  },
  dotActive: {
    width: 24,
    borderRadius: 4,
  },
  caffeineSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.xs,
    marginTop: SPACING.md,
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    marginHorizontal: SPACING.lg,
    flexWrap: 'wrap',
  },
  caffeineSummaryText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    fontWeight: '500',
  },
  caffeineWarning: {
    fontSize: 11,
    color: COLORS.warning,
    fontWeight: '500',
  },
});
