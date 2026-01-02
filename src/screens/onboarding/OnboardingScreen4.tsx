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
import { Slider } from '../../components/ui/Slider';
import { Button } from '../../components/ui/Button';

/**
 * Onboarding Screen 4: Lifestyle
 * Collects sleep hours and stress level information
 */
export const OnboardingScreen4: React.FC = () => {
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
          <Text style={styles.stepIndicator}>Schritt 5 von 7</Text>
          <Text style={styles.title}>Dein Lifestyle</Text>
          <Text style={styles.subtitle}>
            Diese Faktoren beeinflussen deine Regeneration
          </Text>
        </View>

        {/* Form Fields */}
        <View style={styles.form}>
          {/* Sleep Hours Slider */}
          <View style={styles.sliderSection}>
            <Slider
              label="Wie viele Stunden schläfst du durchschnittlich?"
              value={data.sleep_hours_avg || 7}
              minimumValue={3}
              maximumValue={12}
              step={0.5}
              formatValue={(val) => `${val.toFixed(1)} Stunden`}
              minimumLabel="3h"
              maximumLabel="12h"
              onValueChange={(value) => updateData({ sleep_hours_avg: value })}
            />
            <View style={styles.sliderHint}>
              <Text style={styles.hintText}>
                💡 7-9 Stunden sind optimal für die Regeneration
              </Text>
            </View>
          </View>

          {/* Stress Level Slider */}
          <View style={styles.sliderSection}>
            <Slider
              label="Wie hoch ist dein tägliches Stress-Level?"
              value={data.stress_level || 5}
              minimumValue={1}
              maximumValue={10}
              step={1}
              formatValue={(val) => `${val} / 10`}
              minimumLabel="Niedrig"
              maximumLabel="Hoch"
              onValueChange={(value) => updateData({ stress_level: value })}
            />
            <View style={styles.sliderHint}>
              <Text style={styles.hintText}>
                {getStressLevelDescription(data.stress_level || 5)}
              </Text>
            </View>
          </View>
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

/**
 * Get descriptive text based on stress level
 */
const getStressLevelDescription = (level: number): string => {
  if (level <= 3) {
    return '😌 Niedriges Stress-Level - ideal für Training';
  } else if (level <= 6) {
    return '😐 Moderates Stress-Level - achte auf ausreichend Erholung';
  } else if (level <= 8) {
    return '😰 Hohes Stress-Level - Regeneration ist besonders wichtig';
  } else {
    return '😫 Sehr hohes Stress-Level - reduziere die Trainingsintensität';
  }
};

const COLORS = {
  primary: '#007AFF',
  error: '#FF3B30',
  text: '#000000',
  textSecondary: '#8E8E93',
  background: '#FFFFFF',
  backgroundSecondary: '#F2F2F7',
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
  form: {
    gap: SPACING.xl,
  },
  sliderSection: {
    marginBottom: SPACING.lg,
  },
  sliderHint: {
    marginTop: SPACING.md,
    padding: SPACING.md,
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: 8,
  },
  hintText: {
    fontSize: 14,
    color: COLORS.text,
    lineHeight: 20,
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
