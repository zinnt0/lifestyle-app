/**
 * Calorie Progress Ring Component
 * Animated circular progress indicator for calorie tracking
 */

import React, { useEffect } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedProps,
  withSpring,
} from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';
import { nutritionTheme, getProgressColor, formatCalories } from '../../constants/nutritionTheme';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

interface CalorieProgressRingProps {
  consumed: number;
  goal: number;
  size?: number;
  strokeWidth?: number;
}

export function CalorieProgressRing({
  consumed,
  goal,
  size = 180,
  strokeWidth = 16,
}: CalorieProgressRingProps) {
  const progress = useSharedValue(0);
  const percentage = Math.min((consumed / goal) * 100, 100);
  const remaining = Math.max(goal - consumed, 0);

  // Calculate circle properties
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

  const color = getProgressColor(percentage / 100);

  return (
    <View style={styles.container}>
      <Svg width={size} height={size} style={styles.svg}>
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
        <Text style={styles.consumedText}>{formatCalories(consumed)}</Text>
        <Text style={styles.labelText}>of {formatCalories(goal)}</Text>
        <Text style={styles.remainingText}>{formatCalories(remaining)} left</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  svg: {
    transform: [{ rotate: '0deg' }],
  },
  centerContent: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  consumedText: {
    fontSize: 36,
    fontWeight: '700',
    color: '#000',
  },
  labelText: {
    fontSize: 14,
    fontWeight: '400',
    color: nutritionTheme.colors.divider,
    marginTop: 4,
  },
  remainingText: {
    fontSize: 12,
    fontWeight: '600',
    color: nutritionTheme.colors.protein,
    marginTop: 4,
  },
});
