import React from 'react';
import { StyleSheet, Text, ViewStyle, TextStyle } from 'react-native';
import { COLORS, SPACING, TYPOGRAPHY } from './theme';

interface SectionTitleProps {
  /** The section title text */
  children: string;
  /** Optional custom style */
  style?: ViewStyle | TextStyle;
  /** Font size variant */
  size?: 'small' | 'medium' | 'large';
  /** Text color */
  color?: string;
}

/**
 * SectionTitle Component
 *
 * Standardized section title/header for consistent typography across the app.
 * Used to divide content into logical sections.
 *
 * @example
 * ```tsx
 * <SectionTitle>Training Details</SectionTitle>
 * <SectionTitle size="large">Overview</SectionTitle>
 * <SectionTitle color="#007AFF">Statistics</SectionTitle>
 * ```
 */
export const SectionTitle: React.FC<SectionTitleProps> = ({
  children,
  style,
  size = 'medium',
  color = COLORS.text,
}) => {
  const sizeStyles = {
    small: styles.small,
    medium: styles.medium,
    large: styles.large,
  };

  return (
    <Text style={[styles.base, sizeStyles[size], { color }, style]}>
      {children}
    </Text>
  );
};

const styles = StyleSheet.create({
  base: {
    fontWeight: TYPOGRAPHY.weights.semibold,
    marginBottom: SPACING.lg,
    letterSpacing: 0.2,
  },
  small: {
    fontSize: TYPOGRAPHY.sizes.md,
    marginBottom: SPACING.md,
  },
  medium: {
    fontSize: TYPOGRAPHY.sizes.lg,
    marginBottom: SPACING.lg,
  },
  large: {
    fontSize: TYPOGRAPHY.sizes.xxl,
    marginBottom: SPACING.lg,
  },
});
