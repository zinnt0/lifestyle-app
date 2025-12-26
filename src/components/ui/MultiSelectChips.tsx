import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity, ScrollView } from 'react-native';

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
    marginBottom: SPACING.md,
  },
  scrollContent: {
    gap: SPACING.sm,
    paddingVertical: SPACING.sm,
  },
  chip: {
    paddingHorizontal: SPACING.md,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    backgroundColor: COLORS.background,
  },
  chipSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  chipText: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.text,
  },
  chipTextSelected: {
    color: COLORS.background,
  },
});
