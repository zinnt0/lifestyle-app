import React from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Switch,
} from 'react-native';
import { useOnboarding } from '../../contexts/OnboardingContext';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { Input } from '../../components/ui/Input';
import { NumberPicker } from '../../components/ui/NumberPicker';
import { MultiSelectChips } from '../../components/ui/MultiSelectChips';
import { WeekdaySelector } from '../../components/ui/WeekdaySelector';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';

/**
 * Equipment options with German labels
 */
const EQUIPMENT_OPTIONS = [
  'barbell',
  'dumbbells',
  'kettlebells',
  'resistance_bands',
  'pull_up_bar',
  'bench',
  'squat_rack',
  'cables',
  'machines',
] as const;

const EQUIPMENT_LABELS: Record<string, string> = {
  barbell: 'Langhantel',
  dumbbells: 'Kurzhanteln',
  kettlebells: 'Kettlebells',
  resistance_bands: 'Widerstandsbänder',
  pull_up_bar: 'Klimmzugstange',
  bench: 'Hantelbank',
  squat_rack: 'Squat Rack',
  cables: 'Kabelzug',
  machines: 'Geräte',
};

/**
 * Onboarding Screen 2: Trainingserfahrung
 * Collects training experience, fitness level, available days, and equipment
 */
export const OnboardingScreen2: React.FC = () => {
  const { data, updateData, nextStep, previousStep, progress, error } =
    useOnboarding();

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
          <Text style={styles.stepIndicator}>Schritt 2 von 6</Text>
          <Text style={styles.title}>Deine Trainingserfahrung</Text>
          <Text style={styles.subtitle}>
            Wir passen deinen Plan an dein Level an
          </Text>
        </View>

        {/* Form Fields */}
        <View style={styles.form}>
          {/* Fitness Level */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>
              Wie würdest du dein Level einschätzen?
            </Text>
            <View style={styles.levelButtons}>
              <LevelButton
                label="Anfänger"
                description="< 1 Jahr Training"
                selected={data.fitness_level === 'beginner'}
                onPress={() => updateData({ fitness_level: 'beginner' })}
              />
              <LevelButton
                label="Fortgeschritten"
                description="1-3 Jahre"
                selected={data.fitness_level === 'intermediate'}
                onPress={() => updateData({ fitness_level: 'intermediate' })}
              />
              <LevelButton
                label="Experte"
                description="> 3 Jahre"
                selected={data.fitness_level === 'advanced'}
                onPress={() => updateData({ fitness_level: 'advanced' })}
              />
            </View>
          </View>

          {/* Training Experience */}
          <Input
            label="Wie lange trainierst du schon? (Monate)"
            value={data.training_experience_months?.toString() || ''}
            onChangeText={(text) => {
              const months = parseInt(text.replace(/[^0-9]/g, ''));
              updateData({
                training_experience_months: isNaN(months) ? null : months,
              });
            }}
            keyboardType="number-pad"
            placeholder="z.B. 12"
            autoCapitalize="none"
          />

          {/* Available Training Days */}
          <NumberPicker
            label="Wie viele Tage pro Woche kannst du trainieren?"
            value={data.available_training_days || 3}
            min={1}
            max={7}
            unit="Tage"
            onChange={(value) => {
              updateData({
                available_training_days: value,
                // Reset preferred_training_days if count changes
                preferred_training_days: data.preferred_training_days?.length === value
                  ? data.preferred_training_days
                  : null
              });
            }}
          />

          {/* Preferred Training Days */}
          {data.available_training_days && (
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>
                An welchen Tagen möchtest du trainieren?
              </Text>
              <Text style={styles.sectionHint}>
                Wähle {data.available_training_days} {data.available_training_days === 1 ? 'Tag' : 'Tage'} aus
              </Text>
              <WeekdaySelector
                selectedDays={data.preferred_training_days || []}
                onDaysChange={(days) => updateData({ preferred_training_days: days })}
                maxDays={data.available_training_days}
              />
            </View>
          )}

          {/* Gym Access */}
          <View style={styles.switchRow}>
            <View style={styles.switchLabelContainer}>
              <Text style={styles.switchLabel}>
                Hast du Zugang zu einem Fitnessstudio?
              </Text>
            </View>
            <Switch
              value={data.has_gym_access}
              onValueChange={(value) => updateData({ has_gym_access: value })}
              trackColor={{ false: COLORS.border, true: COLORS.primary }}
              thumbColor={COLORS.background}
            />
          </View>

          {/* Home Equipment (only if no gym access) */}
          {!data.has_gym_access && (
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>
                Welches Equipment hast du zu Hause?
              </Text>
              <Text style={styles.sectionHint}>
                Wähle alle zutreffenden aus
              </Text>
              <MultiSelectChips
                options={[...EQUIPMENT_OPTIONS]}
                labels={EQUIPMENT_LABELS}
                selected={data.home_equipment}
                onSelectionChange={(selected) =>
                  updateData({ home_equipment: selected })
                }
              />
            </View>
          )}
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
 * Level Button Component
 * Displays a selectable button for fitness level
 */
interface LevelButtonProps {
  label: string;
  description: string;
  selected: boolean;
  onPress: () => void;
}

const LevelButton: React.FC<LevelButtonProps> = ({
  label,
  description,
  selected,
  onPress,
}) => {
  return (
    <Card
      style={[styles.levelButton, selected ? styles.levelButtonSelected : undefined]}
      onPress={onPress}
    >
      <Text style={[styles.levelLabel, selected ? styles.levelLabelSelected : undefined]}>
        {label}
      </Text>
      <Text
        style={[
          styles.levelDescription,
          selected ? styles.levelDescriptionSelected : undefined,
        ]}
      >
        {description}
      </Text>
    </Card>
  );
};

const COLORS = {
  primary: '#007AFF',
  error: '#FF3B30',
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
    gap: SPACING.lg,
  },
  section: {
    marginBottom: SPACING.md,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  sectionHint: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: SPACING.md,
  },
  levelButtons: {
    gap: SPACING.md,
  },
  levelButton: {
    padding: SPACING.md,
    borderWidth: 2,
    borderColor: COLORS.borderLight,
  },
  levelButtonSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.backgroundSecondary,
  },
  levelLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  levelLabelSelected: {
    color: COLORS.primary,
  },
  levelDescription: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  levelDescriptionSelected: {
    color: COLORS.text,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.sm,
    backgroundColor: COLORS.backgroundSecondary,
    borderRadius: 12,
  },
  switchLabelContainer: {
    flex: 1,
    marginRight: SPACING.md,
  },
  switchLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.text,
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
