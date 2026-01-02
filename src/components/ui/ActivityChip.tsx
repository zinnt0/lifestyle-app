import React from 'react';
import { StyleSheet, TouchableOpacity, Text } from 'react-native';
import { COLORS, SPACING, TYPOGRAPHY, SHADOWS, BORDER_RADIUS } from './theme';

interface ActivityChipProps {
  /** The activity label to display */
  label: string;
  /** Whether this activity is currently selected */
  selected: boolean;
  /** Callback when the chip is pressed */
  onPress: () => void;
  /** Optional custom style */
  style?: object;
}

/**
 * ActivityChip Component
 *
 * A selectable chip/tag commonly used for multi-select scenarios.
 * Features a pill-shaped design with selected/unselected states.
 *
 * @example
 * ```tsx
 * <ActivityChip
 *   label="Stretching"
 *   selected={activities.includes('stretching')}
 *   onPress={() => toggleActivity('stretching')}
 * />
 * ```
 */
export const ActivityChip: React.FC<ActivityChipProps> = ({
  label,
  selected,
  onPress,
  style,
}) => (
  <TouchableOpacity
    style={[styles.activityChip, selected && styles.activityChipSelected, style]}
    onPress={onPress}
    activeOpacity={0.7}
  >
    <Text style={[styles.activityChipText, selected && styles.activityChipTextSelected]}>
      {label}
    </Text>
  </TouchableOpacity>
);

const styles = StyleSheet.create({
  activityChip: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderWidth: 2,
    borderColor: COLORS.borderLight,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.surface,
  },
  activityChipSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
    ...SHADOWS.sm,
  },
  activityChipText: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.text,
    fontWeight: TYPOGRAPHY.weights.medium,
  },
  activityChipTextSelected: {
    color: COLORS.white,
    fontWeight: TYPOGRAPHY.weights.semibold,
  },
});
