import React, { useState } from 'react';
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
import { Input } from '../../components/ui/Input';
import { RadioGroup } from '../../components/ui/RadioGroup';
import { Button } from '../../components/ui/Button';

/**
 * Onboarding Screen 1: Basisdaten
 * Collects basic user information: age, weight, height, gender
 */
export const OnboardingScreen1: React.FC = () => {
  const { data, updateData, nextStep, progress, error } = useOnboarding();

  // Lokale States für Display
  const [weightDisplay, setWeightDisplay] = useState('');
  const [heightDisplay, setHeightDisplay] = useState('');

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Progress Bar */}
        <ProgressBar progress={progress} />

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.stepIndicator}>Schritt 1 von 6</Text>
          <Text style={styles.title}>Erzähl uns von dir</Text>
          <Text style={styles.subtitle}>
            Diese Informationen helfen uns, deinen perfekten Plan zu erstellen
          </Text>
        </View>

        {/* Form Fields */}
        <View style={styles.form}>
          <Input
            label="Wie alt bist du?"
            value={data.age?.toString() || ''}
            onChangeText={(text) => {
              const age = parseInt(text.replace(/[^0-9]/g, ''));
              updateData({ age: isNaN(age) ? null : age });
            }}
            keyboardType="number-pad"
            placeholder="z.B. 25"
            autoCapitalize="none"
          />

          <Input
            label="Wie viel wiegst du? (kg)"
            value={weightDisplay}
            onChangeText={(text) => {
              // Display State updaten (mit Komma)
              setWeightDisplay(text);

              // Numerischen Wert im Context updaten
              const normalizedText = text.replace(',', '.');
              const parsed = parseFloat(normalizedText);
              updateData({ weight: isNaN(parsed) ? null : parsed });
            }}
            onBlur={() => {
              // Bei Verlassen des Feldes: Formatiere den Display
              if (data.weight) {
                setWeightDisplay(data.weight.toString().replace('.', ','));
              }
            }}
            keyboardType="decimal-pad"
            placeholder="z.B. 75,5"
            autoCapitalize="none"
          />

          <Input
            label="Wie groß bist du? (cm)"
            value={heightDisplay}
            onChangeText={(text) => {
              setHeightDisplay(text);
              const normalizedText = text.replace(',', '.');
              const parsed = parseFloat(normalizedText);
              updateData({ height: isNaN(parsed) ? null : parsed });
            }}
            onBlur={() => {
              if (data.height) {
                setHeightDisplay(data.height.toString().replace('.', ','));
              }
            }}
            keyboardType="decimal-pad"
            placeholder="z.B. 180,5"
            autoCapitalize="none"
          />

          <View style={styles.radioSection}>
            <Text style={styles.radioLabel}>Geschlecht</Text>
            <RadioGroup
              options={[
                { label: 'Männlich', value: 'male' },
                { label: 'Weiblich', value: 'female' },
                { label: 'Divers', value: 'other' },
              ]}
              selected={data.gender}
              onSelect={(value) =>
                updateData({ gender: value as 'male' | 'female' | 'other' })
              }
            />
          </View>
        </View>

        {/* Error Message */}
        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* Next Button */}
        <Button title="Weiter" onPress={nextStep} style={styles.nextButton} />

        {/* Bottom Spacing for Keyboard */}
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
    gap: SPACING.md,
  },
  radioSection: {
    marginTop: SPACING.sm,
  },
  radioLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.text,
    marginBottom: SPACING.md,
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
  nextButton: {
    marginTop: SPACING.xl,
  },
  bottomSpacing: {
    height: SPACING.xl,
  },
});
