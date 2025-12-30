/**
 * Score Breakdown Chart Demo
 *
 * Visual demonstration of different score ranges and states
 * Use this to preview the chart in Storybook or standalone
 *
 * @example
 * import { ScoreBreakdownChartDemo } from './ScoreBreakdownChart.demo';
 * <ScoreBreakdownChartDemo />
 */

import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { ScoreBreakdownChart } from './ScoreBreakdownChart';
import type { ScoreBreakdown } from '@/utils/planRecommendationScoring';
import { theme } from '@/constants/theme';

// ============================================================================
// Demo Data
// ============================================================================

const demoScenarios: Array<{
  title: string;
  description: string;
  breakdown: ScoreBreakdown;
  emoji: string;
}> = [
  {
    title: 'Sehr hohe Übereinstimmung (95-100%)',
    description: 'Perfekter Match - Plan passt ideal zu allen Kriterien',
    emoji: '🎯',
    breakdown: {
      experienceScore: 98,
      frequencyScore: 95,
      goalScore: 100,
      volumeScore: 97,
    },
  },
  {
    title: 'Hohe Übereinstimmung (85-94%)',
    description: 'Sehr guter Match - Plan passt sehr gut',
    emoji: '✅',
    breakdown: {
      experienceScore: 90,
      frequencyScore: 88,
      goalScore: 92,
      volumeScore: 85,
    },
  },
  {
    title: 'Gute Übereinstimmung (70-84%)',
    description: 'Guter Match - Plan ist eine solide Wahl',
    emoji: '👍',
    breakdown: {
      experienceScore: 75,
      frequencyScore: 80,
      goalScore: 72,
      volumeScore: 78,
    },
  },
  {
    title: 'Mittlere Übereinstimmung (50-69%)',
    description: 'Akzeptabler Match - Plan könnte funktionieren',
    emoji: '⚠️',
    breakdown: {
      experienceScore: 55,
      frequencyScore: 60,
      goalScore: 52,
      volumeScore: 58,
    },
  },
  {
    title: 'Gemischte Scores',
    description: 'Perfect Level & Frequency, aber Goal und Volume passen nicht optimal',
    emoji: '🤔',
    breakdown: {
      experienceScore: 100,
      frequencyScore: 100,
      goalScore: 45,
      volumeScore: 55,
    },
  },
  {
    title: 'Inverse Scores',
    description: 'Schwaches Level & Frequency, aber perfektes Goal und Volume',
    emoji: '🔄',
    breakdown: {
      experienceScore: 40,
      frequencyScore: 50,
      goalScore: 100,
      volumeScore: 95,
    },
  },
  {
    title: 'Perfekter Score (100%)',
    description: 'Alle Kriterien sind perfekt erfüllt - sehr selten!',
    emoji: '🏆',
    breakdown: {
      experienceScore: 100,
      frequencyScore: 100,
      goalScore: 100,
      volumeScore: 100,
    },
  },
  {
    title: 'Edge Case: Sehr niedrig',
    description: 'Plan passt kaum - sollte nicht empfohlen werden',
    emoji: '❌',
    breakdown: {
      experienceScore: 20,
      frequencyScore: 15,
      goalScore: 25,
      volumeScore: 18,
    },
  },
];

// ============================================================================
// Component
// ============================================================================

export const ScoreBreakdownChartDemo: React.FC = () => {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <View style={styles.header}>
        <Text style={styles.title}>Score Breakdown Chart Demo</Text>
        <Text style={styles.subtitle}>
          Verschiedene Score-Ranges und ihre visuelle Darstellung
        </Text>
      </View>

      {demoScenarios.map((scenario, index) => {
        const average = Math.round(
          (scenario.breakdown.experienceScore +
            scenario.breakdown.frequencyScore +
            scenario.breakdown.goalScore +
            scenario.breakdown.volumeScore) /
            4
        );

        return (
          <View key={index} style={styles.scenario}>
            <View style={styles.scenarioHeader}>
              <Text style={styles.scenarioEmoji}>{scenario.emoji}</Text>
              <View style={styles.scenarioInfo}>
                <Text style={styles.scenarioTitle}>{scenario.title}</Text>
                <Text style={styles.scenarioDescription}>{scenario.description}</Text>
                <Text style={styles.scenarioAverage}>Durchschnitt: {average}%</Text>
              </View>
            </View>

            <ScoreBreakdownChart
              breakdown={scenario.breakdown}
              initialExpanded={index === 0} // First one expanded by default
            />
          </View>
        );
      })}

      {/* Accessibility Test */}
      <View style={styles.scenario}>
        <View style={styles.scenarioHeader}>
          <Text style={styles.scenarioEmoji}>♿</Text>
          <View style={styles.scenarioInfo}>
            <Text style={styles.scenarioTitle}>Accessibility Test</Text>
            <Text style={styles.scenarioDescription}>
              Test mit Screen Reader: Jeder Score sollte vorgelesen werden können
            </Text>
          </View>
        </View>

        <View style={styles.accessibilityInfo}>
          <Text style={styles.accessibilityTitle}>Accessibility Features:</Text>
          <Text style={styles.accessibilityItem}>
            ✓ Accessibility Labels für alle Scores
          </Text>
          <Text style={styles.accessibilityItem}>
            ✓ Accessibility Hints für interaktive Elemente
          </Text>
          <Text style={styles.accessibilityItem}>
            ✓ Hoher Kontrast für alle Farben (WCAG AA)
          </Text>
          <Text style={styles.accessibilityItem}>
            ✓ Touch Targets mindestens 44x44pt
          </Text>
          <Text style={styles.accessibilityItem}>
            ✓ Modal kann mit "Escape" geschlossen werden
          </Text>
        </View>
      </View>

      {/* Color Legend */}
      <View style={styles.scenario}>
        <View style={styles.scenarioHeader}>
          <Text style={styles.scenarioEmoji}>🎨</Text>
          <View style={styles.scenarioInfo}>
            <Text style={styles.scenarioTitle}>Farblegende</Text>
            <Text style={styles.scenarioDescription}>
              Bedeutung der einzelnen Farben
            </Text>
          </View>
        </View>

        <View style={styles.colorLegend}>
          <View style={styles.colorItem}>
            <View style={[styles.colorBox, { backgroundColor: '#4CAF50' }]} />
            <Text style={styles.colorLabel}>Level (Grün) - Trainingserfahrung</Text>
          </View>
          <View style={styles.colorItem}>
            <View style={[styles.colorBox, { backgroundColor: '#2196F3' }]} />
            <Text style={styles.colorLabel}>Frequenz (Blau) - Verfügbarkeit</Text>
          </View>
          <View style={styles.colorItem}>
            <View style={[styles.colorBox, { backgroundColor: '#FF9800' }]} />
            <Text style={styles.colorLabel}>Ziel (Orange) - Trainingsziel</Text>
          </View>
          <View style={styles.colorItem}>
            <View style={[styles.colorBox, { backgroundColor: '#9C27B0' }]} />
            <Text style={styles.colorLabel}>Volumen (Lila) - Trainingsumfang</Text>
          </View>
        </View>
      </View>

      {/* Performance Note */}
      <View style={styles.performanceNote}>
        <Text style={styles.performanceTitle}>⚡ Performance</Text>
        <Text style={styles.performanceText}>
          Animationen verwenden Native Driver wo möglich
        </Text>
        <Text style={styles.performanceText}>Smooth 60fps auch bei vielen Charts</Text>
        <Text style={styles.performanceText}>
          Staggered Animations für bessere UX (100ms Delay)
        </Text>
      </View>
    </ScrollView>
  );
};

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8F9FA',
  },
  contentContainer: {
    padding: theme.spacing.lg,
    gap: theme.spacing.lg,
  },

  // Header
  header: {
    gap: theme.spacing.xs,
    paddingBottom: theme.spacing.md,
    borderBottomWidth: 2,
    borderBottomColor: theme.colors.primary,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: theme.colors.text,
  },
  subtitle: {
    fontSize: 16,
    color: theme.colors.textSecondary,
    lineHeight: 22,
  },

  // Scenario
  scenario: {
    backgroundColor: '#FFFFFF',
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    gap: theme.spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  scenarioHeader: {
    flexDirection: 'row',
    gap: theme.spacing.md,
  },
  scenarioEmoji: {
    fontSize: 32,
  },
  scenarioInfo: {
    flex: 1,
    gap: theme.spacing.xs,
  },
  scenarioTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: theme.colors.text,
  },
  scenarioDescription: {
    fontSize: 14,
    color: theme.colors.textSecondary,
    lineHeight: 20,
  },
  scenarioAverage: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.primary,
  },

  // Accessibility Info
  accessibilityInfo: {
    backgroundColor: '#F0F7FF',
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    gap: theme.spacing.xs,
  },
  accessibilityTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  accessibilityItem: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    lineHeight: 20,
  },

  // Color Legend
  colorLegend: {
    gap: theme.spacing.sm,
  },
  colorItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.sm,
  },
  colorBox: {
    width: 24,
    height: 24,
    borderRadius: theme.borderRadius.sm,
  },
  colorLabel: {
    fontSize: 14,
    color: theme.colors.text,
  },

  // Performance Note
  performanceNote: {
    backgroundColor: '#FFF9E6',
    padding: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    borderLeftWidth: 4,
    borderLeftColor: '#FFC107',
    gap: theme.spacing.xs,
  },
  performanceTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  performanceText: {
    fontSize: 13,
    color: theme.colors.textSecondary,
    lineHeight: 18,
  },
});
