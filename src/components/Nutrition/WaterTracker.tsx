/**
 * Water Tracker Component
 * Displays water intake progress with quick add buttons
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import Animated, {
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { nutritionTheme } from '../../constants/nutritionTheme';

interface WaterTrackerProps {
  totalWater: number; // in ml
  goal: number; // in ml
  onAddWater: (amount: number) => void;
}

export function WaterTracker({ totalWater, goal, onAddWater }: WaterTrackerProps) {
  const percentage = Math.min((totalWater / goal) * 100, 100);

  const progressStyle = useAnimatedStyle(() => {
    return {
      width: withSpring(`${percentage}%`, {
        damping: nutritionTheme.animations.spring.damping,
        stiffness: nutritionTheme.animations.spring.stiffness,
      }),
    };
  });

  return (
    <View style={styles.container}>
      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressBackground}>
          <Animated.View
            style={[
              styles.progressFill,
              progressStyle,
              { backgroundColor: nutritionTheme.colors.water },
            ]}
          />
        </View>

        {/* Water amount text */}
        <View style={styles.amountContainer}>
          <Text style={styles.amountText}>
            {totalWater}ml
            <Text style={styles.goalText}> / {goal}ml</Text>
          </Text>
        </View>
      </View>

      {/* Quick Add Buttons */}
      <View style={styles.quickAddContainer}>
        <QuickAddButton amount={250} onPress={() => onAddWater(250)} />
        <QuickAddButton amount={500} onPress={() => onAddWater(500)} />
        <QuickAddButton amount={1000} onPress={() => onAddWater(1000)} />
      </View>
    </View>
  );
}

// Quick Add Button Component
interface QuickAddButtonProps {
  amount: number;
  onPress: () => void;
}

function QuickAddButton({ amount, onPress }: QuickAddButtonProps) {
  return (
    <TouchableOpacity
      style={styles.quickAddButton}
      onPress={onPress}
      accessibilityLabel={`Add ${amount}ml of water`}
    >
      <Ionicons name="add" size={20} color={nutritionTheme.colors.water} />
      <Text style={styles.quickAddText}>{amount}ml</Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: nutritionTheme.colors.cardBackground,
    borderRadius: nutritionTheme.borderRadius.lg,
    padding: nutritionTheme.spacing.md,
    ...nutritionTheme.shadows.card,
  },
  progressContainer: {
    marginBottom: nutritionTheme.spacing.md,
  },
  progressBackground: {
    height: 32,
    backgroundColor: `${nutritionTheme.colors.water}15`,
    borderRadius: nutritionTheme.borderRadius.md,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: nutritionTheme.borderRadius.md,
  },
  amountContainer: {
    marginTop: nutritionTheme.spacing.sm,
  },
  amountText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#000',
  },
  goalText: {
    fontSize: 14,
    fontWeight: '400',
    color: nutritionTheme.colors.divider,
  },
  quickAddContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: nutritionTheme.spacing.sm,
  },
  quickAddButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    backgroundColor: `${nutritionTheme.colors.water}15`,
    borderRadius: nutritionTheme.borderRadius.md,
    paddingVertical: nutritionTheme.spacing.sm,
    paddingHorizontal: nutritionTheme.spacing.md,
  },
  quickAddText: {
    fontSize: 14,
    fontWeight: '600',
    color: nutritionTheme.colors.water,
  },
});
