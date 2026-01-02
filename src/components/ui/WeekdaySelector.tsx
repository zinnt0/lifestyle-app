/**
 * WeekdaySelector Component
 *
 * Allows users to select specific days of the week for their training schedule.
 * Displays weekday buttons that can be toggled on/off.
 */

import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { COLORS, SPACING, TYPOGRAPHY, SHADOWS, BORDER_RADIUS } from './theme';

interface WeekdaySelectorProps {
  selectedDays: number[]; // Array of day numbers: 0=Sunday, 1=Monday, ..., 6=Saturday
  onDaysChange: (days: number[]) => void;
  maxDays?: number; // Optional: limit number of selections
  disabled?: boolean;
}

const WEEKDAYS = [
  { id: 1, short: 'Mo', full: 'Montag' },
  { id: 2, short: 'Di', full: 'Dienstag' },
  { id: 3, short: 'Mi', full: 'Mittwoch' },
  { id: 4, short: 'Do', full: 'Donnerstag' },
  { id: 5, short: 'Fr', full: 'Freitag' },
  { id: 6, short: 'Sa', full: 'Samstag' },
  { id: 0, short: 'So', full: 'Sonntag' },
];

export const WeekdaySelector: React.FC<WeekdaySelectorProps> = ({
  selectedDays,
  onDaysChange,
  maxDays,
  disabled = false,
}) => {
  const handleDayPress = (dayId: number) => {
    if (disabled) return;

    const isSelected = selectedDays.includes(dayId);

    if (isSelected) {
      // Deselect day
      onDaysChange(selectedDays.filter(d => d !== dayId));
    } else {
      // Select day (if not at max limit)
      if (!maxDays || selectedDays.length < maxDays) {
        onDaysChange([...selectedDays, dayId].sort());
      }
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.weekdaysRow}>
        {WEEKDAYS.map((day) => {
          const isSelected = selectedDays.includes(day.id);
          const canSelect = !maxDays || selectedDays.length < maxDays || isSelected;

          return (
            <TouchableOpacity
              key={day.id}
              style={[
                styles.dayButton,
                isSelected && styles.dayButtonSelected,
                (!canSelect || disabled) && styles.dayButtonDisabled,
              ]}
              onPress={() => handleDayPress(day.id)}
              disabled={disabled || (!canSelect && !isSelected)}
              accessibilityLabel={`${day.full}${isSelected ? ' ausgewählt' : ''}`}
              accessibilityRole="checkbox"
              accessibilityState={{ checked: isSelected, disabled: disabled }}
            >
              <Text
                style={[
                  styles.dayText,
                  isSelected && styles.dayTextSelected,
                  (!canSelect || disabled) && styles.dayTextDisabled,
                ]}
              >
                {day.short}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>

      {maxDays && (
        <Text style={styles.hint}>
          Wähle {maxDays} {maxDays === 1 ? 'Tag' : 'Tage'} aus ({selectedDays.length}/{maxDays})
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: SPACING.sm,
  },
  weekdaysRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: SPACING.xs,
  },
  dayButton: {
    flex: 1,
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surfaceSecondary,
  },
  dayButtonSelected: {
    borderColor: COLORS.primaryLight,
    backgroundColor: COLORS.primary,
    ...SHADOWS.md,
  },
  dayButtonDisabled: {
    borderColor: COLORS.borderLight,
    backgroundColor: COLORS.textDisabled,
    opacity: 0.5,
  },
  dayText: {
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.text,
  },
  dayTextSelected: {
    color: COLORS.white,
  },
  dayTextDisabled: {
    color: COLORS.textSecondary,
  },
  hint: {
    fontSize: TYPOGRAPHY.sizes.xs,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: SPACING.xs,
  },
});
