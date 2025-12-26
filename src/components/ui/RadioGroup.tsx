import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';

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

const COLORS = {
  primary: '#007AFF',
  text: '#000000',
  textSecondary: '#8E8E93',
  border: '#C6C6C8',
  borderLight: '#E5E5EA',
  background: '#FFFFFF',
  backgroundSecondary: '#F2F2F7',
};

const SPACING = {
  sm: 8,
  md: 16,
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
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    borderRadius: 12,
    backgroundColor: COLORS.background,
  },
  optionHorizontal: {
    flex: 1,
    minWidth: '45%',
  },
  optionSelected: {
    borderColor: COLORS.primary,
    borderWidth: 2,
    backgroundColor: COLORS.backgroundSecondary,
  },
  radioOuter: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.primary,
  },
  labelContainer: {
    flex: 1,
  },
  label: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.text,
  },
  labelSelected: {
    color: COLORS.primary,
  },
  description: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 4,
  },
});
