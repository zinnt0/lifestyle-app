/**
 * Score Breakdown Chart Component
 *
 * Visual breakdown of recommendation scores with animated bars
 * Shows: Experience, Frequency, Goal, Volume scores
 *
 * Features:
 * - Animated bars (0 → final value)
 * - Collapsible/expandable
 * - Interactive tooltips
 * - Accessible colors with high contrast
 *
 * @example
 * <ScoreBreakdownChart
 *   breakdown={recommendation.breakdown}
 *   expanded={true}
 *   onToggle={() => setExpanded(!expanded)}
 * />
 */

import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Pressable,
  ViewStyle,
  Modal,
} from 'react-native';
import type { ScoreBreakdown } from '@/utils/planRecommendationScoring';
import { theme } from '@/constants/theme';

// ============================================================================
// Types
// ============================================================================

interface ScoreBreakdownChartProps {
  /** Score breakdown data */
  breakdown: ScoreBreakdown;
  /** Optional custom styles */
  style?: ViewStyle;
  /** Whether the chart is initially expanded */
  initialExpanded?: boolean;
  /** Animation duration in ms */
  animationDuration?: number;
}

interface ScoreItem {
  label: string;
  key: keyof ScoreBreakdown;
  value: number;
  color: string;
  description: string;
  formula: string;
}

// ============================================================================
// Constants
// ============================================================================

const COLORS = {
  experience: '#4CAF50', // Green
  frequency: '#2196F3',  // Blue
  goal: '#FF9800',       // Orange
  volume: '#9C27B0',     // Purple
  background: '#F5F5F5',
  text: theme.colors.text,
  textSecondary: theme.colors.textSecondary,
  border: '#E0E0E0',
};

const SCORE_INFO: Record<keyof ScoreBreakdown, { description: string; formula: string }> = {
  experienceScore: {
    description: 'Passt der Plan zu deinem Trainingslevel? Anfänger brauchen einfachere Programme, Fortgeschrittene können mehr Volumen und Komplexität bewältigen.',
    formula: 'Basiert auf: Trainingserfahrung (Monate) + Fitness-Level (Beginner/Intermediate/Advanced)',
  },
  frequencyScore: {
    description: 'Passt die Trainingsfrequenz zu deiner Verfügbarkeit? Ein 6x/Woche Plan macht nur Sinn wenn du auch 6x/Woche trainieren kannst.',
    formula: 'Basiert auf: Verfügbare Trainingstage vs. Plan-Frequenz (3x, 4x, 5x, 6x)',
  },
  goalScore: {
    description: 'Unterstützt der Plan dein Hauptziel? Kraft-fokussierte Pläne sind anders als Hypertrophie-Programme.',
    formula: 'Basiert auf: Dein Ziel (Kraft/Hypertrophie/Beides) vs. Plan-Fokus',
  },
  volumeScore: {
    description: 'Ist das Trainingsvolumen angemessen? Zu wenig = keine Fortschritte, zu viel = Übertraining.',
    formula: 'Basiert auf: Sets pro Woche + Intensität + Erholungskapazität',
  },
};

// ============================================================================
// Component
// ============================================================================

export const ScoreBreakdownChart: React.FC<ScoreBreakdownChartProps> = ({
  breakdown,
  style,
  initialExpanded = false,
  animationDuration = 800,
}) => {
  const [expanded, setExpanded] = useState(initialExpanded);
  const [selectedScore, setSelectedScore] = useState<keyof ScoreBreakdown | null>(null);

  // Animation values for each bar
  const experienceAnim = useRef(new Animated.Value(0)).current;
  const frequencyAnim = useRef(new Animated.Value(0)).current;
  const goalAnim = useRef(new Animated.Value(0)).current;
  const volumeAnim = useRef(new Animated.Value(0)).current;

  // Opacity for expand/collapse
  const opacityAnim = useRef(new Animated.Value(initialExpanded ? 1 : 0)).current;
  const heightAnim = useRef(new Animated.Value(initialExpanded ? 1 : 0)).current;

  const scores: ScoreItem[] = [
    {
      label: 'Level',
      key: 'experienceScore',
      value: breakdown.experienceScore,
      color: COLORS.experience,
      description: SCORE_INFO.experienceScore.description,
      formula: SCORE_INFO.experienceScore.formula,
    },
    {
      label: 'Frequenz',
      key: 'frequencyScore',
      value: breakdown.frequencyScore,
      color: COLORS.frequency,
      description: SCORE_INFO.frequencyScore.description,
      formula: SCORE_INFO.frequencyScore.formula,
    },
    {
      label: 'Ziel',
      key: 'goalScore',
      value: breakdown.goalScore,
      color: COLORS.goal,
      description: SCORE_INFO.goalScore.description,
      formula: SCORE_INFO.goalScore.formula,
    },
    {
      label: 'Volumen',
      key: 'volumeScore',
      value: breakdown.volumeScore,
      color: COLORS.volume,
      description: SCORE_INFO.volumeScore.description,
      formula: SCORE_INFO.volumeScore.formula,
    },
  ];

  // Get animation value for each score
  const getAnimValue = (key: keyof ScoreBreakdown): Animated.Value => {
    switch (key) {
      case 'experienceScore':
        return experienceAnim;
      case 'frequencyScore':
        return frequencyAnim;
      case 'goalScore':
        return goalAnim;
      case 'volumeScore':
        return volumeAnim;
    }
  };

  // Animate bars when component mounts or breakdown changes
  useEffect(() => {
    if (expanded) {
      // Stagger animations for visual appeal
      Animated.stagger(100, [
        Animated.timing(experienceAnim, {
          toValue: breakdown.experienceScore,
          duration: animationDuration,
          useNativeDriver: false,
        }),
        Animated.timing(frequencyAnim, {
          toValue: breakdown.frequencyScore,
          duration: animationDuration,
          useNativeDriver: false,
        }),
        Animated.timing(goalAnim, {
          toValue: breakdown.goalScore,
          duration: animationDuration,
          useNativeDriver: false,
        }),
        Animated.timing(volumeAnim, {
          toValue: breakdown.volumeScore,
          duration: animationDuration,
          useNativeDriver: false,
        }),
      ]).start();
    }
  }, [breakdown, expanded, animationDuration]);

  // Handle expand/collapse
  const toggleExpanded = () => {
    setExpanded(!expanded);

    Animated.parallel([
      Animated.timing(opacityAnim, {
        toValue: expanded ? 0 : 1,
        duration: 200,
        useNativeDriver: false,
      }),
      Animated.timing(heightAnim, {
        toValue: expanded ? 0 : 1,
        duration: 300,
        useNativeDriver: false,
      }),
    ]).start();
  };

  // Calculate average score for summary
  const averageScore = Math.round(
    (breakdown.experienceScore + breakdown.frequencyScore + breakdown.goalScore + breakdown.volumeScore) / 4
  );

  return (
    <View style={[styles.container, style]}>
      {/* Header - Always visible */}
      <Pressable onPress={toggleExpanded} style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerTitle}>Score-Details</Text>
          <Text style={styles.headerSubtitle}>
            Ø {averageScore}% Übereinstimmung
          </Text>
        </View>
        <Text style={styles.expandIcon}>{expanded ? '▼' : '▶'}</Text>
      </Pressable>

      {/* Chart - Collapsible */}
      {expanded && (
        <Animated.View
          style={[
            styles.chartContainer,
            {
              opacity: opacityAnim,
              transform: [
                {
                  scaleY: heightAnim,
                },
              ],
            },
          ]}
        >
          {scores.map((score) => {
            const animValue = getAnimValue(score.key);

            return (
              <Pressable
                key={score.key}
                onPress={() => setSelectedScore(score.key)}
                style={styles.row}
                accessibilityLabel={`${score.label}: ${Math.round(score.value)} Prozent`}
                accessibilityHint="Tippe für mehr Informationen"
              >
                <Text style={styles.label}>{score.label}</Text>

                <View style={styles.barContainer}>
                  <Animated.View
                    style={[
                      styles.bar,
                      {
                        width: animValue.interpolate({
                          inputRange: [0, 100],
                          outputRange: ['0%', '100%'],
                        }),
                        backgroundColor: score.color,
                      },
                    ]}
                  />
                </View>

                <Text style={styles.value}>{Math.round(score.value)}%</Text>

                <Pressable
                  onPress={() => setSelectedScore(score.key)}
                  style={styles.infoButton}
                  accessibilityLabel={`Info zu ${score.label}`}
                >
                  <Text style={styles.infoIcon}>ℹ️</Text>
                </Pressable>
              </Pressable>
            );
          })}
        </Animated.View>
      )}

      {/* Info Modal */}
      {selectedScore && (
        <Modal
          visible={true}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setSelectedScore(null)}
        >
          <Pressable
            style={styles.modalOverlay}
            onPress={() => setSelectedScore(null)}
          >
            <View style={styles.modalContent}>
              {(() => {
                const score = scores.find((s) => s.key === selectedScore)!;
                return (
                  <>
                    <View style={styles.modalHeader}>
                      <View style={[styles.modalColorBar, { backgroundColor: score.color }]} />
                      <Text style={styles.modalTitle}>{score.label}-Score</Text>
                      <Text style={styles.modalScore}>{Math.round(score.value)}%</Text>
                    </View>

                    <View style={styles.modalSection}>
                      <Text style={styles.modalSectionTitle}>Was bedeutet das?</Text>
                      <Text style={styles.modalText}>{score.description}</Text>
                    </View>

                    <View style={styles.modalSection}>
                      <Text style={styles.modalSectionTitle}>Berechnung</Text>
                      <Text style={styles.modalText}>{score.formula}</Text>
                    </View>

                    <Pressable
                      style={styles.modalCloseButton}
                      onPress={() => setSelectedScore(null)}
                    >
                      <Text style={styles.modalCloseButtonText}>Verstanden</Text>
                    </Pressable>
                  </>
                );
              })()}
            </View>
          </Pressable>
        </Modal>
      )}
    </View>
  );
};

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.background,
    borderRadius: theme.borderRadius.md,
    overflow: 'hidden',
  },

  // Header
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: theme.spacing.md,
    backgroundColor: 'rgba(0, 0, 0, 0.02)',
  },
  headerLeft: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 2,
  },
  headerSubtitle: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  expandIcon: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginLeft: theme.spacing.sm,
  },

  // Chart
  chartContainer: {
    padding: theme.spacing.md,
    gap: theme.spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  label: {
    fontSize: 13,
    fontWeight: '500',
    color: COLORS.text,
    width: 60,
  },
  barContainer: {
    flex: 1,
    height: 24,
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    borderRadius: 12,
    overflow: 'hidden',
  },
  bar: {
    height: '100%',
    borderRadius: 12,
  },
  value: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.text,
    width: 40,
    textAlign: 'right',
  },
  infoButton: {
    padding: 4,
  },
  infoIcon: {
    fontSize: 16,
  },

  // Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: theme.spacing.lg,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    width: '100%',
    maxWidth: 400,
    gap: theme.spacing.md,
  },
  modalHeader: {
    alignItems: 'center',
    gap: theme.spacing.xs,
    paddingBottom: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalColorBar: {
    width: 40,
    height: 4,
    borderRadius: 2,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
  },
  modalScore: {
    fontSize: 32,
    fontWeight: '700',
    color: COLORS.text,
  },
  modalSection: {
    gap: theme.spacing.xs,
  },
  modalSectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  modalText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  modalCloseButton: {
    backgroundColor: theme.colors.primary,
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    marginTop: theme.spacing.sm,
  },
  modalCloseButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
