import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { COLORS, SPACING, TYPOGRAPHY, SHADOWS, BORDER_RADIUS } from './theme';

interface NumberPickerProps {
  /** Label text */
  label: string;
  /** Current value */
  value: number;
  /** Minimum value */
  min: number;
  /** Maximum value */
  max: number;
  /** Step increment (default: 1) */
  step?: number;
  /** Called when value changes */
  onChange: (value: number) => void;
  /** Optional unit to display (e.g., "Tage") */
  unit?: string;
  /** Optional style override */
  style?: object;
}

/**
 * Number Picker Component
 * Allows selecting a number within a range using +/- buttons
 *
 * @example
 * ```tsx
 * <NumberPicker
 *   label="Trainingstage pro Woche"
 *   value={3}
 *   min={1}
 *   max={7}
 *   unit="Tage"
 *   onChange={(value) => setDays(value)}
 * />
 * ```
 */
export const NumberPicker: React.FC<NumberPickerProps> = ({
  label,
  value,
  min,
  max,
  step = 1,
  onChange,
  unit,
  style,
}) => {
  const handleDecrement = () => {
    const newValue = Math.max(min, value - step);
    if (newValue !== value) {
      onChange(newValue);
    }
  };

  const handleIncrement = () => {
    const newValue = Math.min(max, value + step);
    if (newValue !== value) {
      onChange(newValue);
    }
  };

  const canDecrement = value > min;
  const canIncrement = value < max;

  return (
    <View style={[styles.container, style]}>
      {label && <Text style={styles.label}>{label}</Text>}

      <View style={styles.pickerContainer}>
        <TouchableOpacity
          style={[styles.button, !canDecrement && styles.buttonDisabled]}
          onPress={handleDecrement}
          disabled={!canDecrement}
          activeOpacity={0.7}
        >
          <Text
            style={[styles.buttonText, !canDecrement && styles.buttonTextDisabled]}
          >
            −
          </Text>
        </TouchableOpacity>

        <View style={styles.valueContainer}>
          <Text style={styles.value}>
            {value}
            {unit && <Text style={styles.unit}> {unit}</Text>}
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.button, !canIncrement && styles.buttonDisabled]}
          onPress={handleIncrement}
          disabled={!canIncrement}
          activeOpacity={0.7}
        >
          <Text
            style={[styles.buttonText, !canIncrement && styles.buttonTextDisabled]}
          >
            +
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: SPACING.lg,
  },
  label: {
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.medium,
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  pickerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.surfaceSecondary,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.lg,
  },
  button: {
    width: 44,
    height: 44,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    ...SHADOWS.md,
  },
  buttonDisabled: {
    backgroundColor: COLORS.borderDark,
    opacity: 0.5,
    ...SHADOWS.none,
  },
  buttonText: {
    fontSize: TYPOGRAPHY.sizes.xxl,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.white,
    lineHeight: 28,
  },
  buttonTextDisabled: {
    color: COLORS.textSecondary,
  },
  valueContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.lg,
  },
  value: {
    fontSize: TYPOGRAPHY.sizes.xxl,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.text,
  },
  unit: {
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: TYPOGRAPHY.weights.regular,
    color: COLORS.textSecondary,
  },
});
