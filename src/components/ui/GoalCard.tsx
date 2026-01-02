import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';
import { COLORS, SPACING, TYPOGRAPHY, SHADOWS, BORDER_RADIUS } from './theme';

interface GoalCardProps {
  /** Goal label/title */
  label: string;
  /** Goal description */
  description: string;
  /** Icon/emoji to display */
  icon: string;
  /** Whether this goal is selected */
  selected: boolean;
  /** Called when card is pressed */
  onPress: () => void;
  /** Optional style override */
  style?: object;
}

/**
 * Goal Card Component
 * Large, selectable card for displaying goal options with icon
 *
 * @example
 * ```tsx
 * <GoalCard
 *   label="Muskeln aufbauen"
 *   description="Masse & Definition"
 *   icon="🏋️"
 *   selected={goal === 'hypertrophy'}
 *   onPress={() => setGoal('hypertrophy')}
 * />
 * ```
 */
export const GoalCard: React.FC<GoalCardProps> = ({
  label,
  description,
  icon,
  selected,
  onPress,
  style,
}) => {
  return (
    <TouchableOpacity
      style={[styles.card, selected && styles.cardSelected, style]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.iconContainer}>
        <Text style={styles.icon}>{icon}</Text>
      </View>

      <View style={styles.content}>
        <Text style={[styles.label, selected && styles.labelSelected]}>
          {label}
        </Text>
        <Text style={[styles.description, selected && styles.descriptionSelected]}>
          {description}
        </Text>
      </View>

      {selected && <View style={styles.checkmark}>
        <Text style={styles.checkmarkText}>✓</Text>
      </View>}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.xl,
    marginBottom: SPACING.lg,
    borderWidth: 0,
    borderRadius: BORDER_RADIUS.xxl,
    backgroundColor: COLORS.surface,
    ...SHADOWS.md,
  },
  cardSelected: {
    backgroundColor: `${COLORS.primary}08`,
    borderWidth: 2,
    borderColor: COLORS.primary,
    ...SHADOWS.lg,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: `${COLORS.primary}12`,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.lg,
  },
  icon: {
    fontSize: 28,
  },
  content: {
    flex: 1,
  },
  label: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  labelSelected: {
    color: COLORS.primary,
  },
  description: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textSecondary,
  },
  descriptionSelected: {
    color: COLORS.text,
  },
  checkmark: {
    width: 28,
    height: 28,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmarkText: {
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.white,
  },
});
