import React from 'react';
import { StyleSheet, View, Text, ViewStyle } from 'react-native';
import { COLORS, SPACING, TYPOGRAPHY, SHADOWS, BORDER_RADIUS } from './theme';

interface InfoBoxProps {
  /** Box title */
  title?: string;
  /** Box content/message */
  children: React.ReactNode;
  /** Optional icon/emoji */
  icon?: string;
  /** Optional custom container style */
  style?: ViewStyle;
  /** Box color variant - primary (blue) or secondary (green) */
  variant?: 'primary' | 'secondary';
}

/**
 * InfoBox Component
 *
 * Displays highlighted information boxes with optional icons and titles.
 * Uses primary (blue) or secondary (green) color variants.
 *
 * @example
 * ```tsx
 * <InfoBox
 *   title="Wichtig"
 *   icon="💡"
 *   variant="primary"
 * >
 *   Stelle sicher, dass du ausreichend Wasser trinkst.
 * </InfoBox>
 *
 * <InfoBox variant="secondary" title="Tipp">
 *   Beginne mit leichten Gewichten.
 * </InfoBox>
 * ```
 */
export const InfoBox: React.FC<InfoBoxProps> = ({
  title,
  children,
  icon,
  style,
  variant = 'primary',
}) => {
  const variantStyles = {
    primary: {
      background: styles.primaryBackground,
      accent: styles.primaryAccent,
      title: styles.primaryTitle,
    },
    secondary: {
      background: styles.secondaryBackground,
      accent: styles.secondaryAccent,
      title: styles.secondaryTitle,
    },
  };

  const currentVariant = variantStyles[variant];

  return (
    <View
      style={[
        styles.box,
        currentVariant.background,
        currentVariant.accent,
        style,
      ]}
    >
      {(title || icon) && (
        <View style={styles.header}>
          {icon && <Text style={styles.icon}>{icon}</Text>}
          {title && (
            <Text style={[styles.titleText, currentVariant.title]}>
              {title}
            </Text>
          )}
        </View>
      )}
      <View style={[styles.content, (title || icon) && styles.contentWithHeader]}>
        {typeof children === 'string' ? (
          <Text style={styles.text}>{children}</Text>
        ) : (
          children
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  box: {
    borderRadius: BORDER_RADIUS.xxl,
    padding: SPACING.xl,
    marginBottom: SPACING.lg,
    borderWidth: 2,
    ...SHADOWS.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    marginBottom: SPACING.md,
  },
  icon: {
    fontSize: TYPOGRAPHY.sizes.xxl,
  },
  titleText: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: TYPOGRAPHY.weights.bold,
  },
  content: {},
  contentWithHeader: {},
  text: {
    fontSize: TYPOGRAPHY.sizes.md,
    color: COLORS.text,
    lineHeight: 22,
  },
  // Primary (Blue) variant
  primaryBackground: {
    backgroundColor: `${COLORS.primary}08`,
  },
  primaryAccent: {
    borderColor: `${COLORS.primary}30`,
  },
  primaryTitle: {
    color: COLORS.primary,
  },
  // Secondary (Green) variant
  secondaryBackground: {
    backgroundColor: `${COLORS.secondary}08`,
  },
  secondaryAccent: {
    borderColor: `${COLORS.secondary}30`,
  },
  secondaryTitle: {
    color: COLORS.secondary,
  },
});
