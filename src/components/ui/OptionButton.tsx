import React from 'react';
import { StyleSheet, TouchableOpacity, Text } from 'react-native';
import { COLORS, SPACING, TYPOGRAPHY, SHADOWS, BORDER_RADIUS } from './theme';

interface OptionButtonProps {
  /** The label text to display */
  label: string;
  /** Whether this option is currently selected */
  selected: boolean;
  /** Callback when the button is pressed */
  onPress: () => void;
  /** Optional custom style */
  style?: object;
}

/**
 * OptionButton Component
 *
 * A selectable button option with selected/unselected states.
 * Commonly used for multiple-choice selections like fitness level, goals, etc.
 *
 * @example
 * ```tsx
 * <OptionButton
 *   label="Anfänger"
 *   selected={level === 'beginner'}
 *   onPress={() => setLevel('beginner')}
 * />
 * ```
 */
export const OptionButton: React.FC<OptionButtonProps> = ({
  label,
  selected,
  onPress,
  style,
}) => (
  <TouchableOpacity
    style={[styles.optionButton, selected && styles.optionButtonSelected, style]}
    onPress={onPress}
    activeOpacity={0.7}
  >
    <Text style={[styles.optionText, selected && styles.optionTextSelected]}>
      {label}
    </Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  optionButton: {
    flex: 1,
    padding: SPACING.lg,
    borderWidth: 2,
    borderColor: COLORS.borderLight,
    borderRadius: BORDER_RADIUS.lg,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.surface,
  },
  optionButtonSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
    ...SHADOWS.sm,
  },
  optionText: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.text,
    fontWeight: TYPOGRAPHY.weights.medium,
  },
  optionTextSelected: {
    color: COLORS.white,
    fontWeight: TYPOGRAPHY.weights.semibold,
  },
});
