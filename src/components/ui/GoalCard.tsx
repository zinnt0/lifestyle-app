import React from 'react';
import { StyleSheet, View, Text, TouchableOpacity } from 'react-native';

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

const COLORS = {
  primary: '#007AFF',
  success: '#34C759',
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
  lg: 24,
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: SPACING.md,
    marginBottom: 12,
    borderWidth: 2,
    borderColor: COLORS.borderLight,
    borderRadius: 16,
    backgroundColor: COLORS.background,
  },
  cardSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.backgroundSecondary,
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: COLORS.backgroundSecondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
  },
  icon: {
    fontSize: 32,
  },
  content: {
    flex: 1,
  },
  label: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  labelSelected: {
    color: COLORS.primary,
  },
  description: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  descriptionSelected: {
    color: COLORS.text,
  },
  checkmark: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.success,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmarkText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.background,
  },
});
