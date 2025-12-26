import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';

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

const COLORS = {
  primary: '#007AFF',
  text: '#000000',
  textSecondary: '#8E8E93',
  border: '#C6C6C8',
  borderLight: '#E5E5EA',
  background: '#FFFFFF',
  disabled: '#C7C7CC',
};

const SPACING = {
  sm: 8,
  md: 16,
};

const styles = StyleSheet.create({
  container: {
    marginBottom: SPACING.md,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  pickerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    borderRadius: 12,
    padding: SPACING.sm,
  },
  button: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonDisabled: {
    backgroundColor: COLORS.disabled,
    opacity: 0.5,
  },
  buttonText: {
    fontSize: 24,
    fontWeight: '600',
    color: COLORS.background,
    lineHeight: 28,
  },
  buttonTextDisabled: {
    color: COLORS.textSecondary,
  },
  valueContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: SPACING.md,
  },
  value: {
    fontSize: 24,
    fontWeight: '600',
    color: COLORS.text,
  },
  unit: {
    fontSize: 16,
    fontWeight: '400',
    color: COLORS.textSecondary,
  },
});
