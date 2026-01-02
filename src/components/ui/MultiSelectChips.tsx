import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView } from 'react-native';
import { COLORS, SPACING, TYPOGRAPHY, SHADOWS, BORDER_RADIUS } from './theme';

interface MultiSelectChipsProps {
  /** Available option values */
  options: string[];
  /** Labels for each option (maps value to display text) */
  labels: Record<string, string>;
  /** Currently selected values */
  selected: string[];
  /** Called when selection changes */
  onSelectionChange: (selected: string[]) => void;
  /** Optional style override */
  style?: object;
}

/**
 * Multi-Select Chips Component
 * Allows selecting multiple options from a list of chips
 *
 * @example
 * ```tsx
 * <MultiSelectChips
 *   options={['dumbbells', 'barbell', 'kettlebells']}
 *   labels={{
 *     dumbbells: 'Kurzhanteln',
 *     barbell: 'Langhantel',
 *     kettlebells: 'Kettlebells',
 *   }}
 *   selected={homeEquipment}
 *   onSelectionChange={(selected) => setHomeEquipment(selected)}
 * />
 * ```
 */
export const MultiSelectChips: React.FC<MultiSelectChipsProps> = ({
  options,
  labels,
  selected,
  onSelectionChange,
  style,
}) => {
  const toggleOption = (value: string) => {
    const isSelected = selected.includes(value);

    if (isSelected) {
      // Remove from selection
      onSelectionChange(selected.filter((item) => item !== value));
    } else {
      // Add to selection
      onSelectionChange([...selected, value]);
    }
  };

  return (
    <View style={[styles.container, style]}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {options.map((option) => {
          const isSelected = selected.includes(option);
          const label = labels[option] || option;

          return (
            <TouchableOpacity
              key={option}
              style={[styles.chip, isSelected && styles.chipSelected]}
              onPress={() => toggleOption(option)}
              activeOpacity={0.7}
            >
              <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
                {label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: SPACING.lg,
  },
  scrollContent: {
    gap: SPACING.sm,
    paddingVertical: SPACING.sm,
  },
  chip: {
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.full,
    borderWidth: 2,
    borderColor: COLORS.borderLight,
    backgroundColor: COLORS.surface,
  },
  chipSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
    ...SHADOWS.sm,
  },
  chipText: {
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.text,
  },
  chipTextSelected: {
    color: COLORS.white,
  },
});
