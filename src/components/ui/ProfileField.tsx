import React from 'react';
import { StyleSheet, View, Text } from 'react-native';
import { COLORS, SPACING, TYPOGRAPHY } from './theme';

interface ProfileFieldProps {
  /** The label for this field */
  label: string;
  /** The value to display (can be string, number, or null) */
  value: string | number | null;
  /** Optional placeholder text when value is null/empty */
  placeholder?: string;
  /** Optional custom style for the container */
  style?: object;
}

/**
 * ProfileField Component
 *
 * Displays a label-value pair in a standardized format.
 * Commonly used for displaying profile information or read-only data.
 *
 * @example
 * ```tsx
 * <ProfileField label="Alter" value={profile.age} />
 * <ProfileField label="Geschlecht" value={profile.gender} placeholder="Keine Angabe" />
 * ```
 */
export const ProfileField: React.FC<ProfileFieldProps> = ({
  label,
  value,
  placeholder = 'Nicht angegeben',
  style,
}) => (
  <View style={[styles.field, style]}>
    <Text style={styles.label}>{label}</Text>
    <Text style={styles.value}>{value || placeholder}</Text>
  </View>
);

const styles = StyleSheet.create({
  field: {
    marginBottom: SPACING.md,
  },
  label: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  value: {
    fontSize: TYPOGRAPHY.sizes.md,
    color: COLORS.text,
    fontWeight: TYPOGRAPHY.weights.semibold,
  },
});
