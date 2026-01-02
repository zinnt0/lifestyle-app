import React from 'react';
import { StyleSheet, View, Text, ViewStyle } from 'react-native';

interface RecoveryCardProps {
  /** Recovery score (0-100) */
  score: number;
  /** Score interpretation text */
  interpretation: string;
  /** Optional emoji representation */
  emoji?: string;
  /** Optional custom container style */
  style?: ViewStyle;
}

/**
 * RecoveryCard Component
 *
 * Displays the user's recovery score in a prominent card format.
 * Specifically designed for the Home Screen dashboard.
 *
 * @example
 * ```tsx
 * <RecoveryCard
 *   score={85}
 *   interpretation="Ausgezeichnet"
 *   emoji="😊"
 * />
 * ```
 */
export const RecoveryCard: React.FC<RecoveryCardProps> = ({
  score,
  interpretation,
  emoji,
  style,
}) => {
  // Determine score color based on value - using blue/green palette
  const getScoreColor = (value: number): string => {
    if (value >= 80) return '#6FD89E'; // Green - Excellent
    if (value >= 60) return '#5B9EFF'; // Blue - Good
    if (value >= 40) return '#7DB9FF'; // Light Blue - Fair
    return '#93C5FD'; // Lighter Blue - Poor
  };

  const scoreColor = getScoreColor(score);

  return (
    <View style={[styles.card, style]}>
      <Text style={styles.label}>Recovery Score</Text>
      <Text style={[styles.score, { color: scoreColor }]}>{score}</Text>
      {emoji && <Text style={styles.emoji}>{emoji}</Text>}
      <Text style={styles.interpretation}>{interpretation}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
    width: '100%',
    maxWidth: 300,
    alignSelf: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 6,
  },
  label: {
    fontSize: 16,
    color: '#6B7280',
    marginBottom: 12,
    textAlign: 'center',
    fontWeight: '500',
  },
  score: {
    fontSize: 48,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  emoji: {
    fontSize: 32,
    textAlign: 'center',
    marginBottom: 8,
  },
  interpretation: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
  },
});
