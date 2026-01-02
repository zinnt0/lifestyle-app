import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { COLORS, SPACING, TYPOGRAPHY, SHADOWS, BORDER_RADIUS } from './theme';

interface RadioOption {
  label: string;
  value: string;
  description?: string;
}

interface RadioGroupProps {
  /** Available options */
  options: RadioOption[];
  /** Currently selected value */
  selected: string | null;
  /** Called when an option is selected */
  onSelect: (value: string) => void;
  /** Optional layout direction */
  direction?: 'horizontal' | 'vertical';
  /** Optional style override */
  style?: object;
}

/**
 * Radio Group Component
 * Displays a group of mutually exclusive radio buttons
 *
 * @example
 * ```tsx
 * <RadioGroup
 *   options={[
 *     { label: 'Männlich', value: 'male' },
 *     { label: 'Weiblich', value: 'female' },
 *   ]}
 *   selected={gender}
 *   onSelect={(value) => setGender(value)}
 * />
 * ```
 */
export const RadioGroup: React.FC<RadioGroupProps> = ({
  options,
  selected,
  onSelect,
  direction = 'vertical',
  style,
}) => {
  return (
    <View
      style={[
        styles.container,
        direction === 'horizontal' && styles.containerHorizontal,
        style,
      ]}
    >
      {options.map((option) => {
        const isSelected = selected === option.value;

        return (
          <TouchableOpacity
            key={option.value}
            style={[
              styles.option,
              direction === 'horizontal' && styles.optionHorizontal,
              isSelected && styles.optionSelected,
            ]}
            onPress={() => onSelect(option.value)}
            activeOpacity={0.7}
          >
            <View style={styles.radioOuter}>
              {isSelected && <View style={styles.radioInner} />}
            </View>

            <View style={styles.labelContainer}>
              <Text style={[styles.label, isSelected && styles.labelSelected]}>
                {option.label}
              </Text>
              {option.description && (
                <Text style={styles.description}>{option.description}</Text>
              )}
            </View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: SPACING.md,
  },
  containerHorizontal: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.lg,
    borderWidth: 2,
    borderColor: COLORS.borderLight,
    borderRadius: BORDER_RADIUS.xl,
    backgroundColor: COLORS.surface,
  },
  optionHorizontal: {
    flex: 1,
    minWidth: '45%',
  },
  optionSelected: {
    borderColor: COLORS.primary,
    borderWidth: 2,
    backgroundColor: `${COLORS.primary}10`,
    ...SHADOWS.sm,
  },
  radioOuter: {
    width: 24,
    height: 24,
    borderRadius: BORDER_RADIUS.full,
    borderWidth: 2,
    borderColor: COLORS.borderLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
    backgroundColor: COLORS.white,
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.primary,
  },
  labelContainer: {
    flex: 1,
  },
  label: {
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: TYPOGRAPHY.weights.medium,
    color: COLORS.text,
  },
  labelSelected: {
    color: COLORS.primary,
    fontWeight: TYPOGRAPHY.weights.semibold,
  },
  description: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
});
