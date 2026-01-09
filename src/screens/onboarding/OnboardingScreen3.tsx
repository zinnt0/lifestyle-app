import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from 'react-native';
import { useOnboarding } from '../../contexts/OnboardingContext';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { GoalCard } from '../../components/ui/GoalCard';
import { Button } from '../../components/ui/Button';

/**
 * Goal options with German labels and descriptions
 */
const GOALS = [
  {
    value: 'strength' as const,
    label: 'Kraft aufbauen',
    description: 'Schwere Gewichte bewegen',
    icon: '💪',
  },
  {
    value: 'hypertrophy' as const,
    label: 'Muskeln aufbauen',
    description: 'Masse & Definition',
    icon: '🏋️',
  },
  {
    value: 'weight_loss' as const,
    label: 'Gewicht verlieren',
    description: 'Fett verbrennen',
    icon: '🔥',
  },
  {
    value: 'endurance' as const,
    label: 'Ausdauer',
    description: 'Länger durchhalten',
    icon: '🏃',
  },
  {
    value: 'general_fitness' as const,
    label: 'Allgemeine Fitness',
    description: 'Gesund & fit bleiben',
    icon: '✨',
  },
];

/**
 * Additional training goals for women (German names matching database)
 */
const WOMEN_TRAINING_GOALS = [
  { value: 'kraft', label: 'Kraft', icon: '💪' },
  { value: 'bodyforming', label: 'Body Shaping', icon: '✨' },
  { value: 'hypertrophie', label: 'Muskelaufbau', icon: '🏋️' },
  { value: 'fettabbau', label: 'Fettabbau', icon: '🔥' },
  { value: 'abnehmen', label: 'Abnehmen', icon: '⚖️' },
  { value: 'general_fitness', label: 'Fitness', icon: '🌟' },
];

/**
 * Load preference options
 */
const LOAD_PREFERENCES = [
  { value: 'low_impact', label: 'Sanft & schonend', description: 'Gelenkschonend, moderate Belastung', icon: '🌸' },
  { value: 'normal', label: 'Normal', description: 'Ausgewogene Belastung', icon: '⚡' },
  { value: 'high_intensity', label: 'Intensiv', description: 'Hohe Belastung, schnelle Ergebnisse', icon: '🔥' },
];

/**
 * Onboarding Screen 3: Ziele
 * Allows user to select their primary fitness goal
 * For women: Also collects multiple training goals, cardio preferences, and load preferences
 */
export const OnboardingScreen3: React.FC = () => {
  const { data, updateData, nextStep, previousStep, progress, error } =
    useOnboarding();

  const isFemale = data.gender === 'female';

  // Toggle training goal for women (multiple selection)
  const toggleTrainingGoal = (goal: string) => {
    const currentGoals = data.training_goals || [];
    const newGoals = currentGoals.includes(goal)
      ? currentGoals.filter(g => g !== goal)
      : [...currentGoals, goal];
    updateData({ training_goals: newGoals });
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Progress Bar */}
        <ProgressBar progress={progress} />

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.stepIndicator}>Schritt 4 von 7</Text>
          <Text style={styles.title}>Was {isFemale ? 'sind deine Ziele' : 'ist dein Ziel'}?</Text>
          <Text style={styles.subtitle}>
            {isFemale
              ? 'Du kannst mehrere Ziele auswählen'
              : 'Wir passen deinen Plan an dein Hauptziel an'
            }
          </Text>
        </View>

        {/* Primary Goal Cards (always shown) */}
        <View style={styles.goalsContainer}>
          {GOALS.map((goal) => (
            <GoalCard
              key={goal.value}
              label={goal.label}
              description={goal.description}
              icon={goal.icon}
              selected={data.primary_goal === goal.value}
              onPress={() => updateData({ primary_goal: goal.value })}
            />
          ))}
        </View>

        {/* Additional sections for women */}
        {isFemale && (
          <>
            {/* Training Goals (Multiple Selection) */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Spezifische Trainingsziele (Optional)</Text>
              <Text style={styles.sectionSubtitle}>Wähle alle zutreffenden Ziele</Text>
              <View style={styles.chipContainer}>
                {WOMEN_TRAINING_GOALS.map((goal) => {
                  const isSelected = (data.training_goals || []).includes(goal.value);
                  return (
                    <TouchableOpacity
                      key={goal.value}
                      style={[styles.chip, isSelected && styles.chipSelected]}
                      onPress={() => toggleTrainingGoal(goal.value)}
                    >
                      <Text style={styles.chipIcon}>{goal.icon}</Text>
                      <Text style={[styles.chipText, isSelected && styles.chipTextSelected]}>
                        {goal.label}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Cardio Frequency */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Cardio pro Woche</Text>
              <Text style={styles.sectionSubtitle}>Wie oft möchtest du Cardio-Training machen?</Text>
              <View style={styles.numberSelector}>
                {[0, 1, 2, 3, 4, 5].map((num) => (
                  <TouchableOpacity
                    key={num}
                    style={[
                      styles.numberButton,
                      (data.cardio_per_week ?? 0) === num && styles.numberButtonSelected,
                    ]}
                    onPress={() => updateData({ cardio_per_week: num })}
                  >
                    <Text
                      style={[
                        styles.numberButtonText,
                        (data.cardio_per_week ?? 0) === num && styles.numberButtonTextSelected,
                      ]}
                    >
                      {num}x
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            {/* Load Preference */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Belastungspräferenz</Text>
              <Text style={styles.sectionSubtitle}>Wie intensiv soll dein Training sein?</Text>
              <View style={styles.goalsContainer}>
                {LOAD_PREFERENCES.map((pref) => (
                  <GoalCard
                    key={pref.value}
                    label={pref.label}
                    description={pref.description}
                    icon={pref.icon}
                    selected={data.load_preference === pref.value}
                    onPress={() => updateData({ load_preference: pref.value as 'low_impact' | 'normal' | 'high_intensity' })}
                  />
                ))}
              </View>
            </View>
          </>
        )}

        {/* Error Message */}
        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* Buttons */}
        <View style={styles.buttonRow}>
          <Button
            variant="outline"
            onPress={previousStep}
            style={styles.backButton}
          >
            Zurück
          </Button>
          <Button
            onPress={nextStep}
            style={styles.nextButton}
          >
            Weiter
          </Button>
        </View>

        {/* Bottom Spacing */}
        <View style={styles.bottomSpacing} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const COLORS = {
  primary: '#007AFF',
  error: '#FF3B30',
  text: '#000000',
  textSecondary: '#8E8E93',
  background: '#FFFFFF',
};

const SPACING = {
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.lg,
  },
  header: {
    marginTop: SPACING.md,
    marginBottom: SPACING.xl,
  },
  stepIndicator: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
    lineHeight: 22,
  },
  goalsContainer: {
    gap: SPACING.md,
    marginBottom: SPACING.lg,
  },
  errorContainer: {
    backgroundColor: '#FFEBEE',
    padding: SPACING.md,
    borderRadius: 8,
    marginTop: SPACING.md,
  },
  errorText: {
    color: COLORS.error,
    fontSize: 14,
    textAlign: 'center',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginTop: SPACING.xl,
  },
  backButton: {
    flex: 1,
  },
  nextButton: {
    flex: 2,
  },
  bottomSpacing: {
    height: SPACING.xl,
  },
  // New styles for women-specific sections
  section: {
    marginTop: SPACING.xl,
    marginBottom: SPACING.lg,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  sectionSubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: SPACING.md,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: 20,
    backgroundColor: '#F2F2F7',
    borderWidth: 1,
    borderColor: '#E5E5EA',
  },
  chipSelected: {
    backgroundColor: '#007AFF15',
    borderColor: COLORS.primary,
  },
  chipIcon: {
    fontSize: 16,
    marginRight: SPACING.sm,
  },
  chipText: {
    fontSize: 14,
    color: COLORS.text,
    fontWeight: '500',
  },
  chipTextSelected: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  numberSelector: {
    flexDirection: 'row',
    gap: SPACING.sm,
    flexWrap: 'wrap',
  },
  numberButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#F2F2F7',
    borderWidth: 2,
    borderColor: '#E5E5EA',
    justifyContent: 'center',
    alignItems: 'center',
  },
  numberButtonSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  numberButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
  },
  numberButtonTextSelected: {
    color: '#FFFFFF',
  },
});
