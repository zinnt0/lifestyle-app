import React from 'react';
import {
  StyleSheet,
  View,
  Text,
} from 'react-native';
import RNSlider from '@react-native-community/slider';
import { COLORS, SPACING, TYPOGRAPHY } from './theme';

interface SliderProps {
  /** Current value */
  value: number;
  /** Minimum value */
  minimumValue: number;
  /** Maximum value */
  maximumValue: number;
  /** Step increment */
  step?: number;
  /** Called when value changes */
  onValueChange: (value: number) => void;
  /** Optional label */
  label?: string;
  /** Optional value formatter (e.g., to show "7.5 hours") */
  formatValue?: (value: number) => string;
  /** Optional minimum label (shown on left) */
  minimumLabel?: string;
  /** Optional maximum label (shown on right) */
  maximumLabel?: string;
  /** Optional style override */
  style?: object;
}

/**
 * Slider Component
 * Wrapper around React Native's Slider with labels and formatting
 *
 * @example
 * ```tsx
 * <Slider
 *   label="Schlafstunden"
 *   value={sleepHours}
 *   minimumValue={3}
 *   maximumValue={12}
 *   step={0.5}
 *   formatValue={(val) => `${val.toFixed(1)} Stunden`}
 *   minimumLabel="3h"
 *   maximumLabel="12h"
 *   onValueChange={(val) => setSleepHours(val)}
 * />
 * ```
 */
export const Slider: React.FC<SliderProps> = ({
  value,
  minimumValue,
  maximumValue,
  step = 1,
  onValueChange,
  label,
  formatValue,
  minimumLabel,
  maximumLabel,
  style,
}) => {
  const displayValue = formatValue ? formatValue(value) : value.toString();

  return (
    <View style={[styles.container, style]}>
      {label && (
        <View style={styles.header}>
          <Text style={styles.label}>{label}</Text>
          <Text style={styles.value}>{displayValue}</Text>
        </View>
      )}

      <RNSlider
        value={value}
        minimumValue={minimumValue}
        maximumValue={maximumValue}
        step={step}
        onValueChange={onValueChange}
        minimumTrackTintColor={COLORS.primary}
        maximumTrackTintColor={COLORS.borderLight}
        thumbTintColor={COLORS.primary}
        style={styles.slider}
      />

      {(minimumLabel || maximumLabel) && (
        <View style={styles.labels}>
          <Text style={styles.labelText}>{minimumLabel}</Text>
          <Text style={styles.labelText}>{maximumLabel}</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: SPACING.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.md,
  },
  label: {
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.text,
  },
  value: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.primary,
  },
  slider: {
    width: '100%',
    height: 44,
  },
  labels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.xs,
    marginTop: SPACING.xs,
  },
  labelText: {
    fontSize: TYPOGRAPHY.sizes.xs,
    color: COLORS.textSecondary,
  },
});
