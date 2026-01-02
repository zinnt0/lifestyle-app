import React from 'react';
import { StyleSheet, View, Text, ViewStyle, TextStyle } from 'react-native';
import { COLORS, SPACING, TYPOGRAPHY, SHADOWS, BORDER_RADIUS } from './theme';

export type AlertVariant = 'error' | 'success' | 'info' | 'warning';

interface AlertProps {
  /** The alert message */
  children: string | React.ReactNode;
  /** Alert type/variant */
  variant?: AlertVariant;
  /** Optional custom container style */
  style?: ViewStyle;
  /** Optional custom text style */
  textStyle?: TextStyle;
  /** Show icon/emoji */
  showIcon?: boolean;
}

/**
 * Alert Component
 *
 * Displays colored alert boxes for different message types.
 * Supports error, success, info, and warning variants.
 *
 * @example
 * ```tsx
 * <Alert variant="error">Bitte füllen Sie alle Felder aus</Alert>
 * <Alert variant="success">Erfolgreich gespeichert!</Alert>
 * <Alert variant="info" showIcon>Tipp: Trinken Sie ausreichend Wasser</Alert>
 * ```
 */
export const Alert: React.FC<AlertProps> = ({
  children,
  variant = 'info',
  style,
  textStyle,
  showIcon = false,
}) => {
  const variantStyles = {
    error: {
      container: styles.errorContainer,
      text: styles.errorText,
      icon: '❌',
    },
    success: {
      container: styles.successContainer,
      text: styles.successText,
      icon: '✅',
    },
    info: {
      container: styles.infoContainer,
      text: styles.infoText,
      icon: 'ℹ️',
    },
    warning: {
      container: styles.warningContainer,
      text: styles.warningText,
      icon: '⚠️',
    },
  };

  const currentVariant = variantStyles[variant];

  return (
    <View style={[styles.base, currentVariant.container, style]}>
      {showIcon && (
        <Text style={styles.icon}>{currentVariant.icon}</Text>
      )}
      <Text style={[currentVariant.text, textStyle]}>
        {children}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  base: {
    padding: SPACING.sm + 6,
    borderRadius: BORDER_RADIUS.lg,
    marginBottom: SPACING.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...SHADOWS.sm,
  },
  icon: {
    fontSize: TYPOGRAPHY.sizes.md,
  },
  // Error variant
  errorContainer: {
    backgroundColor: '#FFF1F2',
  },
  errorText: {
    color: COLORS.error,
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.semibold,
    flex: 1,
  },
  // Success variant
  successContainer: {
    backgroundColor: '#ECFDF3',
  },
  successText: {
    color: COLORS.secondaryDark,
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.semibold,
    flex: 1,
  },
  // Info variant
  infoContainer: {
    backgroundColor: '#EFF6FF',
  },
  infoText: {
    color: COLORS.primaryDark,
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.semibold,
    flex: 1,
  },
  // Warning variant
  warningContainer: {
    backgroundColor: '#FFF6E8',
  },
  warningText: {
    color: '#C96A00',
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.semibold,
    flex: 1,
  },
});
