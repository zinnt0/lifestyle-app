import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
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
 * Onboarding Screen 3: Ziele
 * Allows user to select their primary fitness goal
 */
export const OnboardingScreen3: React.FC = () => {
  const { data, updateData, nextStep, previousStep, progress, error } =
    useOnboarding();

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
          <Text style={styles.stepIndicator}>Schritt 3 von 6</Text>
          <Text style={styles.title}>Was ist dein Ziel?</Text>
          <Text style={styles.subtitle}>
            Wir passen deinen Plan an dein Hauptziel an
          </Text>
        </View>

        {/* Goal Cards */}
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

        {/* Error Message */}
        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* Buttons */}
        <View style={styles.buttonRow}>
          <Button
            title="Zurück"
            variant="outline"
            onPress={previousStep}
            style={styles.backButton}
          />
          <Button
            title="Weiter"
            onPress={nextStep}
            style={styles.nextButton}
          />
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
});
