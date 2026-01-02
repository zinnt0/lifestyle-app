import React from 'react';
import { StyleSheet, View, Text, ViewStyle } from 'react-native';
import { COLORS, SPACING, TYPOGRAPHY, SHADOWS, BORDER_RADIUS } from './theme';

interface StatsCardProps {
  /** Card title */
  title?: string;
  /** Card content */
  children: React.ReactNode;
  /** Optional custom container style */
  style?: ViewStyle;
  /** Add shadow */
  shadow?: boolean;
  /** Center content */
  centerContent?: boolean;
  /** Color variant - primary (blue) or secondary (green) */
  variant?: 'primary' | 'secondary' | 'neutral';
}

/**
 * StatsCard Component
 *
 * A card designed for displaying statistics, summaries, or grouped data.
 * Features consistent padding, border radius, and optional shadows.
 *
 * @example
 * ```tsx
 * <StatsCard title="Workout Summary">
 *   <Text>Duration: 45 min</Text>
 *   <Text>Calories: 350 kcal</Text>
 * </StatsCard>
 *
 * <StatsCard shadow centerContent>
 *   <Text style={{fontSize: 48}}>85</Text>
 *   <Text>Recovery Score</Text>
 * </StatsCard>
 * ```
 */
export const StatsCard: React.FC<StatsCardProps> = ({
  title,
  children,
  style,
  shadow = true,
  centerContent = false,
  variant = 'neutral',
}) => {
  const getVariantStyle = () => {
    switch (variant) {
      case 'primary':
        return styles.primaryVariant;
      case 'secondary':
        return styles.secondaryVariant;
      default:
        return null;
    }
  };

  const getTitleColor = () => {
    switch (variant) {
      case 'primary':
        return COLORS.primary;
      case 'secondary':
        return COLORS.secondary;
      default:
        return COLORS.text;
    }
  };

  return (
    <View
      style={[
        styles.card,
        shadow && styles.shadow,
        centerContent && styles.centered,
        getVariantStyle(),
        style,
      ]}
    >
      {title && <Text style={[styles.title, { color: getTitleColor() }]}>{title}</Text>}
      <View style={[styles.content, title && styles.contentWithTitle]}>
        {children}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.xxl,
    padding: SPACING.xxl,
    width: '100%',
    marginBottom: SPACING.lg,
  },
  shadow: {
    ...SHADOWS.md,
  },
  centered: {
    alignItems: 'center',
  },
  title: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: TYPOGRAPHY.weights.bold,
    marginBottom: SPACING.lg,
    textAlign: 'center',
  },
  content: {
    gap: SPACING.md,
  },
  contentWithTitle: {
    marginTop: SPACING.xs,
  },
  primaryVariant: {
    backgroundColor: `${COLORS.primary}08`,
    borderWidth: 2,
    borderColor: `${COLORS.primary}30`,
  },
  secondaryVariant: {
    backgroundColor: `${COLORS.secondary}08`,
    borderWidth: 2,
    borderColor: `${COLORS.secondary}30`,
  },
});
