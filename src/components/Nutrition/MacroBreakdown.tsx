/**
 * Macro Breakdown Component
 * Displays protein, carbs, and fat progress as circular rings
 */

import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withSpring,
} from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';
import { nutritionTheme, formatNutritionValue } from '../../constants/nutritionTheme';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface MacroData {
  consumed: number;
  goal: number;
}

interface MacroBreakdownProps {
  protein: MacroData;
  carbs: MacroData;
  fat: MacroData;
}

export function MacroBreakdown({ protein, carbs, fat }: MacroBreakdownProps) {
  return (
    <View style={styles.container}>
      <MacroRing
        label="Protein"
        consumed={protein.consumed}
        goal={protein.goal}
        color={nutritionTheme.colors.protein}
      />
      <MacroRing
        label="Carbs"
        consumed={carbs.consumed}
        goal={carbs.goal}
        color={nutritionTheme.colors.carbs}
      />
      <MacroRing
        label="Fat"
        consumed={fat.consumed}
        goal={fat.goal}
        color={nutritionTheme.colors.fat}
      />
    </View>
  );
}

// Individual Macro Ring Component
interface MacroRingProps {
  label: string;
  consumed: number;
  goal: number;
  color: string;
}

function MacroRing({ label, consumed, goal, color }: MacroRingProps) {
  const progress = useSharedValue(0);
  const percentage = Math.min((consumed / goal) * 100, 100);

  const size = nutritionTheme.nutrition.macroRing.size;
  const strokeWidth = nutritionTheme.nutrition.macroRing.strokeWidth;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  useEffect(() => {
    progress.value = withSpring(percentage / 100, {
      damping: nutritionTheme.animations.spring.damping,
      stiffness: nutritionTheme.animations.spring.stiffness,
    });
  }, [percentage]);

  const animatedProps = useAnimatedProps(() => {
    const strokeDashoffset = circumference * (1 - progress.value);
    return {
      strokeDashoffset,
    };
  });

  return (
    <View style={styles.macroContainer}>
      <View style={styles.ringContainer}>
        <Svg width={size} height={size}>
          {/* Background circle */}
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={nutritionTheme.colors.divider}
            strokeWidth={strokeWidth}
            fill="none"
          />

          {/* Progress circle */}
          <AnimatedCircle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={color}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            strokeLinecap="round"
            fill="none"
            animatedProps={animatedProps}
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
        </Svg>

        {/* Center content */}
        <View style={styles.centerContent}>
          <Text style={styles.valueText}>{Math.round(consumed)}</Text>
          <Text style={styles.unitText}>g</Text>
        </View>
      </View>

      {/* Label and goal */}
      <Text style={styles.labelText}>{label}</Text>
      <Text style={styles.goalText}>of {Math.round(goal)}g</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center',
    backgroundColor: nutritionTheme.colors.cardBackground,
    borderRadius: nutritionTheme.borderRadius.lg,
    padding: nutritionTheme.spacing.md,
    ...nutritionTheme.shadows.card,
  },
  macroContainer: {
    alignItems: 'center',
  },
  ringContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerContent: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  valueText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#000',
  },
  unitText: {
    fontSize: 10,
    fontWeight: '400',
    color: nutritionTheme.colors.divider,
  },
  labelText: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: nutritionTheme.spacing.sm,
    color: '#000',
  },
  goalText: {
    fontSize: 12,
    fontWeight: '400',
    color: nutritionTheme.colors.divider,
    marginTop: 2,
  },
});
