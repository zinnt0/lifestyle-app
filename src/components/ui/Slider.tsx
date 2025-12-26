import React from 'react';
import {
  StyleSheet,
  View,
  Text,
} from 'react-native';
import RNSlider from '@react-native-community/slider';

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

const COLORS = {
  primary: '#007AFF',
  text: '#000000',
  textSecondary: '#8E8E93',
  borderLight: '#E5E5EA',
};

const SPACING = {
  sm: 8,
  md: 16,
};

const styles = StyleSheet.create({
  container: {
    marginBottom: SPACING.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: SPACING.sm,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.text,
  },
  value: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.primary,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  labels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 4,
  },
  labelText: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
});
