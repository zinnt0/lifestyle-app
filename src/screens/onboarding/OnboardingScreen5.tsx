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
import { Button } from '../../components/ui/Button';
import { OptionButton } from '../../components/ui/OptionButton';
import { NumericInput } from '../../components/ui/NumericInput';

/**
 * Onboarding Screen 5: Ernährungsziele
 * Collects nutrition-related data for calorie calculation
 */
export const OnboardingScreen5: React.FC = () => {
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
          <Text style={styles.stepIndicator}>Schritt 6 von 8</Text>
          <Text style={styles.title}>Ernährungsziele</Text>
          <Text style={styles.subtitle}>
            Wir berechnen deine optimalen Kalorienwerte
          </Text>
        </View>

        {/* Form Fields */}
        <View style={styles.form}>
          {/* PAL Factor Selection */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              Wie aktiv bist du im Alltag und beim Training? *
            </Text>
            <Text style={styles.sectionHint}>
              Dies bestimmt deinen täglichen Kalorienverbrauch
            </Text>

            <View style={styles.buttonGroup}>
              <OptionButton
                label="Sedentär"
                description="Bürojob, wenig Bewegung"
                selected={data.pal_factor === 1.2}
                onPress={() => updateData({ pal_factor: 1.2 })}
              />
            </View>

            <View style={styles.buttonGroup}>
              <OptionButton
                label="Leicht aktiv"
                description="1-3 Tage Sport/Woche"
                selected={data.pal_factor === 1.375}
                onPress={() => updateData({ pal_factor: 1.375 })}
              />
            </View>

            <View style={styles.buttonGroup}>
              <OptionButton
                label="Moderat aktiv"
                description="3-5 Tage Sport/Woche"
                selected={data.pal_factor === 1.55}
                onPress={() => updateData({ pal_factor: 1.55 })}
              />
            </View>

            <View style={styles.buttonGroup}>
              <OptionButton
                label="Sehr aktiv"
                description="6-7 Tage Sport/Woche"
                selected={data.pal_factor === 1.725}
                onPress={() => updateData({ pal_factor: 1.725 })}
              />
            </View>

            <View style={styles.buttonGroup}>
              <OptionButton
                label="Extrem aktiv"
                description="2x täglich Training"
                selected={data.pal_factor === 1.9}
                onPress={() => updateData({ pal_factor: 1.9 })}
              />
            </View>
          </View>

          {/* Optional Fields */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Optional</Text>
            <Text style={styles.sectionHint}>
              Diese Angaben helfen bei der Feinabstimmung
            </Text>

            <NumericInput
              label="Zielgewicht (kg)"
              value={data.target_weight_kg}
              onValueChange={(value) => updateData({ target_weight_kg: value })}
              keyboardType="decimal-pad"
              placeholder="z.B. 70"
            />

            <NumericInput
              label="Körperfettanteil (%)"
              value={data.body_fat_percentage}
              onValueChange={(value) => updateData({ body_fat_percentage: value })}
              keyboardType="decimal-pad"
              placeholder="z.B. 15"
            />

            <View style={styles.infoBox}>
              <Text style={styles.infoText}>
                💡 Das Zieldatum kannst du später in deinem Profil festlegen
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
  section: {
    marginBottom: SPACING.lg,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  sectionHint: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: SPACING.md,
    lineHeight: 20,
  },
  buttonGroup: {
    marginBottom: SPACING.sm,
  },
  infoBox: {
    backgroundColor: COLORS.backgroundSecondary,
    padding: SPACING.md,
    borderRadius: 8,
    marginTop: SPACING.md,
  },
  infoText: {
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
