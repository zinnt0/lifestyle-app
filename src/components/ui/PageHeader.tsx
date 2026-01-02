import React from 'react';
import { StyleSheet, View, Text, ViewStyle } from 'react-native';
import { COLORS, SPACING, TYPOGRAPHY } from './theme';

interface PageHeaderProps {
  /** The main page title */
  title: string;
  /** Optional subtitle/description */
  subtitle?: string;
  /** Optional custom container style */
  style?: ViewStyle;
  /** Title alignment */
  align?: 'left' | 'center';
}

/**
 * PageHeader Component
 *
 * Standardized page header with title and optional subtitle.
 * Provides consistent spacing and typography for screen headers.
 *
 * @example
 * ```tsx
 * <PageHeader title="Tägliches Check-in" />
 * <PageHeader
 *   title="Training Dashboard"
 *   subtitle="Dein Trainingsfortschritt"
 * />
 * <PageHeader title="Profil" align="center" />
 * ```
 */
export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  subtitle,
  style,
  align = 'left',
}) => {
  const alignmentStyle = align === 'center' ? styles.center : styles.left;

  return (
    <View style={[styles.header, style]}>
      <Text style={[styles.title, alignmentStyle]}>{title}</Text>
      {subtitle && (
        <Text style={[styles.subtitle, alignmentStyle]}>{subtitle}</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    marginBottom: SPACING.xxxl,
  },
  title: {
    fontSize: TYPOGRAPHY.sizes.xxxl,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.text,
    marginBottom: SPACING.sm,
    letterSpacing: 0.2,
  },
  subtitle: {
    fontSize: TYPOGRAPHY.sizes.md,
    color: COLORS.textSecondary,
    lineHeight: 22,
  },
  left: {
    textAlign: 'left',
  },
  center: {
    textAlign: 'center',
  },
});
