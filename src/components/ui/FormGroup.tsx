import React from 'react';
import { StyleSheet, View, Text, ViewStyle, TextStyle } from 'react-native';
import { COLORS, SPACING, TYPOGRAPHY } from './theme';

interface FormGroupProps {
  /** Label text for the form field */
  label?: string;
  /** Form field content (Input, Slider, etc.) */
  children: React.ReactNode;
  /** Optional custom container style */
  style?: ViewStyle;
  /** Optional custom label style */
  labelStyle?: TextStyle;
  /** Optional suffix text (e.g., "kg", "cm") */
  suffix?: string;
  /** Error message to display */
  error?: string;
  /** Required field indicator */
  required?: boolean;
}

/**
 * FormGroup Component
 *
 * Wraps form inputs with consistent label, spacing, and optional suffix/error display.
 * Provides standardized form field layout across the app.
 *
 * @example
 * ```tsx
 * <FormGroup label="Gewicht" suffix="kg">
 *   <Input value={weight} onChangeText={setWeight} />
 * </FormGroup>
 *
 * <FormGroup label="E-Mail" required error={emailError}>
 *   <Input value={email} onChangeText={setEmail} />
 * </FormGroup>
 * ```
 */
export const FormGroup: React.FC<FormGroupProps> = ({
  label,
  children,
  style,
  labelStyle,
  suffix,
  error,
  required = false,
}) => {
  return (
    <View style={[styles.container, style]}>
      {label && (
        <Text style={[styles.label, labelStyle]}>
          {label}
          {required && <Text style={styles.required}> *</Text>}
        </Text>
      )}
      <View style={suffix ? styles.inputWithSuffix : undefined}>
        {children}
        {suffix && <Text style={styles.suffixText}>{suffix}</Text>}
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: SPACING.lg,
  },
  label: {
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  required: {
    color: COLORS.error,
  },
  inputWithSuffix: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
  },
  suffixText: {
    fontSize: TYPOGRAPHY.sizes.md,
    color: COLORS.textSecondary,
    fontWeight: TYPOGRAPHY.weights.medium,
  },
  errorText: {
    fontSize: TYPOGRAPHY.sizes.xs,
    color: COLORS.error,
    marginTop: SPACING.xs,
  },
});
