/**
 * Nutrition Goal Form Component
 *
 * Multi-step form for creating personalized nutrition goals
 * Features:
 * - 4 step wizard (Basic Info, Training Goal, Target Weight, Activity Level)
 * - Real-time validation
 * - Goal conflict detection
 * - Scientific calculation transparency
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  COLORS,
  SPACING,
  BORDER_RADIUS,
  SHADOWS,
  TYPOGRAPHY,
} from '../ui/theme';
import { nutritionGoalsService } from '../../../lib/services/nutrition-goals.service';
import type {
  Gender,
  TrainingGoal,
  CalorieCalculationResult,
} from '../../../lib/types/nutrition.types';
import { ACTIVITY_LEVELS } from '../../../lib/types/nutrition.types';

interface NutritionGoalFormProps {
  userId: string;
  onComplete: (result: CalorieCalculationResult) => void;
  onCancel?: () => void;
}

interface FormData {
  // Step 1: Basic Info
  gender: Gender | null;
  age: number;
  height_cm: number;
  weight_kg: number;
  body_fat_percentage?: number;

  // Step 2: Training Goal
  training_goal: TrainingGoal | null;

  // Step 3: Target Weight (Optional)
  hasTargetWeight: boolean;
  target_weight_kg?: number;
  target_date?: Date;

  // Step 4: Activity Level
  pal_factor: number;
}

const TRAINING_GOALS: Array<{
  value: TrainingGoal;
  emoji: string;
  title: string;
  description: string;
  info: string;
}> = [
  {
    value: 'strength',
    emoji: '🏋️',
    title: 'Kraft aufbauen',
    description: 'Stärker werden in den Hauptübungen (Squat, Bench, Deadlift)',
    info: 'Leichter Kalorienüberschuss + Fokus auf niedrige Wiederholungen',
  },
  {
    value: 'muscle_gain',
    emoji: '💪',
    title: 'Muskeln aufbauen',
    description: 'Muskelmasse und Definition aufbauen',
    info: 'Moderater Kalorienüberschuss + hohes Volumen (8-12 Wiederholungen)',
  },
  {
    value: 'weight_loss',
    emoji: '⚖️',
    title: 'Gewicht verlieren',
    description: 'Körperfett reduzieren bei Muskelerhalt',
    info: 'Kaloriendefizit + hohes Protein + Krafttraining beibehalten',
  },
  {
    value: 'endurance',
    emoji: '🏃',
    title: 'Ausdauer verbessern',
    description: 'Längere Distanzen, bessere Kondition',
    info: 'Erhaltungskalorien + erhöhte Kohlenhydrate für Glykogen',
  },
  {
    value: 'general_fitness',
    emoji: '🌟',
    title: 'Allgemeine Fitness',
    description: 'Gesund und ausgeglichen trainieren',
    info: 'Balance aus Kraft, Ausdauer, Mobilität',
  },
];

export function NutritionGoalForm({
  userId,
  onComplete,
  onCancel,
}: NutritionGoalFormProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    gender: null,
    age: 30,
    height_cm: 175,
    weight_kg: 75,
    training_goal: null,
    hasTargetWeight: false,
    pal_factor: 1.55, // Default: moderately active
  });

  // Update form field
  const updateField = <K extends keyof FormData>(
    field: K,
    value: FormData[K]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Validate current step
  const validateStep = (step: number): boolean => {
    switch (step) {
      case 1:
        if (!formData.gender) {
          Alert.alert('Fehler', 'Bitte wähle dein Geschlecht aus');
          return false;
        }
        if (formData.age < 18 || formData.age > 100) {
          Alert.alert('Fehler', 'Alter muss zwischen 18 und 100 Jahren liegen');
          return false;
        }
        if (formData.height_cm < 140 || formData.height_cm > 220) {
          Alert.alert('Fehler', 'Größe muss zwischen 140 und 220 cm liegen');
          return false;
        }
        if (formData.weight_kg < 40 || formData.weight_kg > 200) {
          Alert.alert('Fehler', 'Gewicht muss zwischen 40 und 200 kg liegen');
          return false;
        }
        if (
          formData.body_fat_percentage &&
          (formData.body_fat_percentage < 5 || formData.body_fat_percentage > 50)
        ) {
          Alert.alert(
            'Fehler',
            'Körperfettanteil muss zwischen 5% und 50% liegen'
          );
          return false;
        }
        return true;

      case 2:
        if (!formData.training_goal) {
          Alert.alert('Fehler', 'Bitte wähle ein Trainingsziel aus');
          return false;
        }
        return true;

      case 3:
        if (formData.hasTargetWeight) {
          if (!formData.target_weight_kg) {
            Alert.alert('Fehler', 'Bitte gib ein Zielgewicht ein');
            return false;
          }
          if (
            formData.target_weight_kg < 40 ||
            formData.target_weight_kg > 200
          ) {
            Alert.alert(
              'Fehler',
              'Zielgewicht muss zwischen 40 und 200 kg liegen'
            );
            return false;
          }
          if (formData.target_date) {
            const fourWeeksFromNow = new Date();
            fourWeeksFromNow.setDate(fourWeeksFromNow.getDate() + 28);
            if (formData.target_date < fourWeeksFromNow) {
              Alert.alert(
                'Fehler',
                'Zieldatum muss mindestens 4 Wochen in der Zukunft liegen'
              );
              return false;
            }
          }
        }
        return true;

      case 4:
        return true;

      default:
        return false;
    }
  };

  // Navigate to next step
  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep((prev) => Math.min(prev + 1, 4));
    }
  };

  // Navigate to previous step
  const handleBack = () => {
    setCurrentStep((prev) => Math.max(prev - 1, 1));
  };

  // Submit form and create nutrition goal
  const handleSubmit = async () => {
    if (!validateStep(4)) return;

    try {
      setLoading(true);

      const goalData = {
        gender: formData.gender!,
        age: formData.age,
        height_cm: formData.height_cm,
        weight_kg: formData.weight_kg,
        body_fat_percentage: formData.body_fat_percentage,
        training_goal: formData.training_goal!,
        pal_factor: formData.pal_factor,
        target_weight_kg: formData.hasTargetWeight
          ? formData.target_weight_kg
          : undefined,
        target_date: formData.hasTargetWeight
          ? formData.target_date
          : undefined,
      };

      const result = await nutritionGoalsService.createNutritionGoal(
        userId,
        goalData
      );

      // Calculate result to show to user
      const calculationResult: CalorieCalculationResult = {
        bmr: result.bmr!,
        tdee: result.tdee!,
        targetCalories: result.target_calories!,
        calorieAdjustment: result.target_calories! - result.tdee!,
        macros: {
          protein_g: result.target_protein_g!,
          protein_per_kg: result.target_protein_g! / formData.weight_kg,
          carbs_g: result.target_carbs_g!,
          carbs_percentage: Math.round(
            ((result.target_carbs_g! * 4) / result.target_calories!) * 100
          ),
          fat_g: result.target_fat_g!,
          fat_percentage: Math.round(
            ((result.target_fat_g! * 9) / result.target_calories!) * 100
          ),
        },
        progression: {
          expectedWeeklyChange: result.expected_weekly_change!,
          weeksToGoal: result.weeks_to_goal ?? undefined,
          estimatedTargetDate: result.target_date
            ? new Date(result.target_date)
            : undefined,
        },
        warnings: result.warnings || [],
        recommendations: result.recommendations || [],
        hasConflict: result.has_conflict || false,
        calculationMethod: result.calculation_method as any,
      };

      onComplete(calculationResult);
    } catch (error) {
      console.error('Error creating nutrition goal:', error);
      Alert.alert(
        'Fehler',
        error instanceof Error
          ? error.message
          : 'Ernährungsziel konnte nicht erstellt werden'
      );
    } finally {
      setLoading(false);
    }
  };

  // Calculate expected weekly change for preview
  const calculateWeeklyChangePreview = (): string => {
    if (!formData.hasTargetWeight || !formData.target_weight_kg || !formData.target_date) {
      return '';
    }

    const today = new Date();
    const targetDate = formData.target_date;
    const daysToGoal = Math.floor(
      (targetDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
    );
    const weeksToGoal = daysToGoal / 7;
    const weightDifference = formData.target_weight_kg - formData.weight_kg;
    const weeklyChange = weightDifference / weeksToGoal;

    const absChange = Math.abs(weeklyChange);
    const isAggressive = absChange > 1.0;

    return `Das entspricht ${absChange.toFixed(1)} kg/Woche${
      isAggressive ? ' ⚠️ Zu aggressiv!' : ''
    }`;
  };

  // Render progress indicator
  const renderProgressIndicator = () => (
    <View style={styles.progressContainer}>
      {[1, 2, 3, 4].map((step) => (
        <View key={step} style={styles.progressStepContainer}>
          <View
            style={[
              styles.progressStep,
              step === currentStep && styles.progressStepActive,
              step < currentStep && styles.progressStepComplete,
            ]}
          >
            {step < currentStep ? (
              <Ionicons name="checkmark" size={16} color={COLORS.white} />
            ) : (
              <Text
                style={[
                  styles.progressStepText,
                  step === currentStep && styles.progressStepTextActive,
                ]}
              >
                {step}
              </Text>
            )}
          </View>
          {step < 4 && (
            <View
              style={[
                styles.progressLine,
                step < currentStep && styles.progressLineComplete,
              ]}
            />
          )}
        </View>
      ))}
    </View>
  );

  // Render Step 1: Basic Info
  const renderStep1 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Basisdaten</Text>
      <Text style={styles.stepDescription}>
        Diese Informationen benötigen wir für die Kalorienberechnung
      </Text>

      {/* Gender Selection */}
      <View style={styles.fieldGroup}>
        <Text style={styles.label}>Geschlecht *</Text>
        <View style={styles.genderContainer}>
          <TouchableOpacity
            style={[
              styles.genderButton,
              formData.gender === 'male' && styles.genderButtonActive,
            ]}
            onPress={() => updateField('gender', 'male')}
          >
            <Ionicons
              name="male"
              size={24}
              color={formData.gender === 'male' ? COLORS.white : COLORS.primary}
            />
            <Text
              style={[
                styles.genderButtonText,
                formData.gender === 'male' && styles.genderButtonTextActive,
              ]}
            >
              Männlich
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.genderButton,
              formData.gender === 'female' && styles.genderButtonActive,
            ]}
            onPress={() => updateField('gender', 'female')}
          >
            <Ionicons
              name="female"
              size={24}
              color={formData.gender === 'female' ? COLORS.white : COLORS.primary}
            />
            <Text
              style={[
                styles.genderButtonText,
                formData.gender === 'female' && styles.genderButtonTextActive,
              ]}
            >
              Weiblich
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Age */}
      <View style={styles.fieldGroup}>
        <Text style={styles.label}>Alter (Jahre) *</Text>
        <View style={styles.numberInput}>
          <TouchableOpacity
            style={styles.numberButton}
            onPress={() => updateField('age', Math.max(18, formData.age - 1))}
          >
            <Ionicons name="remove" size={20} color={COLORS.primary} />
          </TouchableOpacity>
          <Text style={styles.numberValue}>{formData.age}</Text>
          <TouchableOpacity
            style={styles.numberButton}
            onPress={() => updateField('age', Math.min(100, formData.age + 1))}
          >
            <Ionicons name="add" size={20} color={COLORS.primary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Height */}
      <View style={styles.fieldGroup}>
        <Text style={styles.label}>Größe (cm) *</Text>
        <View style={styles.numberInput}>
          <TouchableOpacity
            style={styles.numberButton}
            onPress={() =>
              updateField('height_cm', Math.max(140, formData.height_cm - 1))
            }
          >
            <Ionicons name="remove" size={20} color={COLORS.primary} />
          </TouchableOpacity>
          <Text style={styles.numberValue}>{formData.height_cm}</Text>
          <TouchableOpacity
            style={styles.numberButton}
            onPress={() =>
              updateField('height_cm', Math.min(220, formData.height_cm + 1))
            }
          >
            <Ionicons name="add" size={20} color={COLORS.primary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Weight */}
      <View style={styles.fieldGroup}>
        <Text style={styles.label}>Aktuelles Gewicht (kg) *</Text>
        <View style={styles.numberInput}>
          <TouchableOpacity
            style={styles.numberButton}
            onPress={() =>
              updateField('weight_kg', Math.max(40, formData.weight_kg - 0.5))
            }
          >
            <Ionicons name="remove" size={20} color={COLORS.primary} />
          </TouchableOpacity>
          <Text style={styles.numberValue}>{formData.weight_kg.toFixed(1)}</Text>
          <TouchableOpacity
            style={styles.numberButton}
            onPress={() =>
              updateField('weight_kg', Math.min(200, formData.weight_kg + 0.5))
            }
          >
            <Ionicons name="add" size={20} color={COLORS.primary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Body Fat Percentage (Optional) */}
      <View style={styles.fieldGroup}>
        <Text style={styles.label}>Körperfettanteil (optional)</Text>
        <View style={styles.numberInput}>
          <TouchableOpacity
            style={styles.numberButton}
            onPress={() =>
              updateField(
                'body_fat_percentage',
                Math.max(5, (formData.body_fat_percentage || 20) - 1)
              )
            }
          >
            <Ionicons name="remove" size={20} color={COLORS.primary} />
          </TouchableOpacity>
          <Text style={styles.numberValue}>
            {formData.body_fat_percentage?.toFixed(0) || 20}%
          </Text>
          <TouchableOpacity
            style={styles.numberButton}
            onPress={() =>
              updateField(
                'body_fat_percentage',
                Math.min(50, (formData.body_fat_percentage || 20) + 1)
              )
            }
          >
            <Ionicons name="add" size={20} color={COLORS.primary} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  // Render Step 2: Training Goal
  const renderStep2 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Trainingsziel</Text>
      <Text style={styles.stepDescription}>
        Wähle dein primäres Ziel aus - wir passen die Kalorien und Makros
        entsprechend an
      </Text>

      <View style={styles.goalsContainer}>
        {TRAINING_GOALS.map((goal) => (
          <TouchableOpacity
            key={goal.value}
            style={[
              styles.goalCard,
              formData.training_goal === goal.value && styles.goalCardActive,
            ]}
            onPress={() => updateField('training_goal', goal.value)}
          >
            <Text style={styles.goalEmoji}>{goal.emoji}</Text>
            <Text style={styles.goalTitle}>{goal.title}</Text>
            <Text style={styles.goalDescription}>{goal.description}</Text>
            <View style={styles.goalInfoBox}>
              <Ionicons
                name="information-circle"
                size={16}
                color={COLORS.primary}
              />
              <Text style={styles.goalInfo}>{goal.info}</Text>
            </View>
            {formData.training_goal === goal.value && (
              <View style={styles.goalCheckmark}>
                <Ionicons name="checkmark-circle" size={24} color={COLORS.success} />
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  // Render Step 3: Target Weight
  const renderStep3 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Zielgewicht (Optional)</Text>
      <Text style={styles.stepDescription}>
        Möchtest du ein spezifisches Zielgewicht und Zieldatum festlegen?
      </Text>

      {/* Toggle for target weight */}
      <TouchableOpacity
        style={styles.toggleContainer}
        onPress={() => updateField('hasTargetWeight', !formData.hasTargetWeight)}
      >
        <View
          style={[
            styles.toggle,
            formData.hasTargetWeight && styles.toggleActive,
          ]}
        >
          <View
            style={[
              styles.toggleThumb,
              formData.hasTargetWeight && styles.toggleThumbActive,
            ]}
          />
        </View>
        <Text style={styles.toggleLabel}>
          Ja, ich möchte ein Zielgewicht festlegen
        </Text>
      </TouchableOpacity>

      {formData.hasTargetWeight && (
        <>
          {/* Target Weight */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Zielgewicht (kg)</Text>
            <View style={styles.numberInput}>
              <TouchableOpacity
                style={styles.numberButton}
                onPress={() =>
                  updateField(
                    'target_weight_kg',
                    Math.max(40, (formData.target_weight_kg || 70) - 0.5)
                  )
                }
              >
                <Ionicons name="remove" size={20} color={COLORS.primary} />
              </TouchableOpacity>
              <Text style={styles.numberValue}>
                {(formData.target_weight_kg || 70).toFixed(1)}
              </Text>
              <TouchableOpacity
                style={styles.numberButton}
                onPress={() =>
                  updateField(
                    'target_weight_kg',
                    Math.min(200, (formData.target_weight_kg || 70) + 0.5)
                  )
                }
              >
                <Ionicons name="add" size={20} color={COLORS.primary} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Target Date */}
          <View style={styles.fieldGroup}>
            <Text style={styles.label}>Bis wann?</Text>
            <Text style={styles.helperText}>
              Mindestens 4 Wochen in der Zukunft
            </Text>
            {/* Simple date selector - increment weeks */}
            <View style={styles.numberInput}>
              <TouchableOpacity
                style={styles.numberButton}
                onPress={() => {
                  const currentDate = formData.target_date || new Date();
                  const newDate = new Date(currentDate);
                  newDate.setDate(newDate.getDate() - 7);
                  updateField('target_date', newDate);
                }}
              >
                <Ionicons name="remove" size={20} color={COLORS.primary} />
              </TouchableOpacity>
              <Text style={styles.numberValue}>
                {formData.target_date
                  ? formData.target_date.toLocaleDateString('de-DE')
                  : new Date(Date.now() + 28 * 24 * 60 * 60 * 1000).toLocaleDateString(
                      'de-DE'
                    )}
              </Text>
              <TouchableOpacity
                style={styles.numberButton}
                onPress={() => {
                  const currentDate =
                    formData.target_date ||
                    new Date(Date.now() + 28 * 24 * 60 * 60 * 1000);
                  const newDate = new Date(currentDate);
                  newDate.setDate(newDate.getDate() + 7);
                  updateField('target_date', newDate);
                }}
              >
                <Ionicons name="add" size={20} color={COLORS.primary} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Weekly Change Preview */}
          {formData.target_weight_kg && formData.target_date && (
            <View style={styles.previewBox}>
              <Text style={styles.previewText}>
                {calculateWeeklyChangePreview()}
              </Text>
              {Math.abs(
                (formData.target_weight_kg - formData.weight_kg) /
                  ((formData.target_date.getTime() - Date.now()) /
                    (1000 * 60 * 60 * 24 * 7))
              ) > 1.0 && (
                <Text style={styles.warningText}>
                  ⚠️ Empfohlen: max. 1 kg/Woche für nachhaltigen Erfolg
                </Text>
              )}
            </View>
          )}
        </>
      )}
    </View>
  );

  // Render Step 4: Activity Level
  const renderStep4 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Aktivitätslevel</Text>
      <Text style={styles.stepDescription}>
        Wie aktiv bist du im Alltag und Sport? Dies beeinflusst deinen
        Kalorienverbrauch.
      </Text>

      <View style={styles.activityLevelsContainer}>
        {Object.entries(ACTIVITY_LEVELS).map(([key, level]) => (
          <TouchableOpacity
            key={key}
            style={[
              styles.activityCard,
              formData.pal_factor === level.factor && styles.activityCardActive,
            ]}
            onPress={() => updateField('pal_factor', level.factor)}
          >
            <View style={styles.activityHeader}>
              <View
                style={[
                  styles.activityRadio,
                  formData.pal_factor === level.factor &&
                    styles.activityRadioActive,
                ]}
              >
                {formData.pal_factor === level.factor && (
                  <View style={styles.activityRadioDot} />
                )}
              </View>
              <View style={styles.activityTitleContainer}>
                <Text style={styles.activityLabel}>{level.label}</Text>
                <Text style={styles.activityFactor}>({level.factor})</Text>
              </View>
            </View>
            <Text style={styles.activityDescription}>{level.description}</Text>
            {key === 'MODERATELY_ACTIVE' && (
              <View style={styles.recommendedBadge}>
                <Text style={styles.recommendedText}>Empfohlen</Text>
              </View>
            )}
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {renderProgressIndicator()}

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {currentStep === 1 && renderStep1()}
        {currentStep === 2 && renderStep2()}
        {currentStep === 3 && renderStep3()}
        {currentStep === 4 && renderStep4()}
      </ScrollView>

      {/* Navigation Buttons */}
      <View style={styles.navigationContainer}>
        {currentStep > 1 && (
          <TouchableOpacity
            style={[styles.button, styles.buttonSecondary]}
            onPress={handleBack}
          >
            <Ionicons name="arrow-back" size={20} color={COLORS.primary} />
            <Text style={styles.buttonSecondaryText}>Zurück</Text>
          </TouchableOpacity>
        )}

        {currentStep < 4 ? (
          <TouchableOpacity
            style={[styles.button, styles.buttonPrimary, currentStep === 1 && styles.buttonFull]}
            onPress={handleNext}
          >
            <Text style={styles.buttonPrimaryText}>Weiter</Text>
            <Ionicons name="arrow-forward" size={20} color={COLORS.white} />
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.button, styles.buttonPrimary, styles.buttonFull]}
            onPress={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <Text style={styles.buttonPrimaryText}>Berechne...</Text>
            ) : (
              <>
                <Ionicons name="calculator" size={20} color={COLORS.white} />
                <Text style={styles.buttonPrimaryText}>Kalorien berechnen</Text>
              </>
            )}
          </TouchableOpacity>
        )}
      </View>

      {/* Cancel Button */}
      {onCancel && (
        <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
          <Text style={styles.cancelButtonText}>Abbrechen</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

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

  // Progress Indicator
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.xl,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  progressStepContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  progressStep: {
    width: 32,
    height: 32,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.surfaceSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: COLORS.border,
  },
  progressStepActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  progressStepComplete: {
    backgroundColor: COLORS.success,
    borderColor: COLORS.success,
  },
  progressStepText: {
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.textSecondary,
  },
  progressStepTextActive: {
    color: COLORS.white,
  },
  progressLine: {
    flex: 1,
    height: 2,
    backgroundColor: COLORS.border,
    marginHorizontal: SPACING.xs,
  },
  progressLineComplete: {
    backgroundColor: COLORS.success,
  },

  // Step Container
  stepContainer: {
    marginBottom: SPACING.xl,
  },
  stepTitle: {
    fontSize: TYPOGRAPHY.sizes.xxl,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  stepDescription: {
    fontSize: TYPOGRAPHY.sizes.md,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xl,
    lineHeight: TYPOGRAPHY.lineHeights.relaxed * TYPOGRAPHY.sizes.md,
  },

  // Form Fields
  fieldGroup: {
    marginBottom: SPACING.xl,
  },
  label: {
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: TYPOGRAPHY.weights.medium,
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  helperText: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
  },

  // Gender Selection
  genderContainer: {
    flexDirection: 'row',
    gap: SPACING.md,
  },
  genderButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 2,
    borderColor: COLORS.border,
    backgroundColor: COLORS.white,
  },
  genderButtonActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary,
  },
  genderButtonText: {
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: TYPOGRAPHY.weights.medium,
    color: COLORS.text,
  },
  genderButtonTextActive: {
    color: COLORS.white,
  },

  // Number Input
  numberInput: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: SPACING.md,
  },
  numberButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: BORDER_RADIUS.sm,
    backgroundColor: COLORS.surfaceSecondary,
  },
  numberValue: {
    fontSize: TYPOGRAPHY.sizes.xl,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.text,
  },

  // Training Goals
  goalsContainer: {
    gap: SPACING.md,
  },
  goalCard: {
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 2,
    borderColor: COLORS.border,
    backgroundColor: COLORS.white,
    position: 'relative',
  },
  goalCardActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLight + '10',
  },
  goalEmoji: {
    fontSize: 32,
    marginBottom: SPACING.sm,
  },
  goalTitle: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  goalDescription: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
    lineHeight: TYPOGRAPHY.lineHeights.normal * TYPOGRAPHY.sizes.sm,
  },
  goalInfoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.xs,
    padding: SPACING.sm,
    borderRadius: BORDER_RADIUS.sm,
    backgroundColor: COLORS.info + '10',
  },
  goalInfo: {
    flex: 1,
    fontSize: TYPOGRAPHY.sizes.xs,
    color: COLORS.primary,
    lineHeight: TYPOGRAPHY.lineHeights.normal * TYPOGRAPHY.sizes.xs,
  },
  goalCheckmark: {
    position: 'absolute',
    top: SPACING.md,
    right: SPACING.md,
  },

  // Target Weight Toggle
  toggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    marginBottom: SPACING.xl,
  },
  toggle: {
    width: 56,
    height: 32,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.border,
    padding: 4,
    justifyContent: 'center',
  },
  toggleActive: {
    backgroundColor: COLORS.success,
  },
  toggleThumb: {
    width: 24,
    height: 24,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.white,
    ...SHADOWS.sm,
  },
  toggleThumbActive: {
    transform: [{ translateX: 24 }],
  },
  toggleLabel: {
    flex: 1,
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: TYPOGRAPHY.weights.medium,
    color: COLORS.text,
  },

  // Preview Box
  previewBox: {
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.sm,
    backgroundColor: COLORS.surfaceSecondary,
    marginTop: SPACING.md,
  },
  previewText: {
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: TYPOGRAPHY.weights.medium,
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  warningText: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.warning,
    lineHeight: TYPOGRAPHY.lineHeights.normal * TYPOGRAPHY.sizes.sm,
  },

  // Activity Levels
  activityLevelsContainer: {
    gap: SPACING.md,
  },
  activityCard: {
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 2,
    borderColor: COLORS.border,
    backgroundColor: COLORS.white,
    position: 'relative',
  },
  activityCardActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLight + '10',
  },
  activityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    marginBottom: SPACING.sm,
  },
  activityRadio: {
    width: 24,
    height: 24,
    borderRadius: BORDER_RADIUS.full,
    borderWidth: 2,
    borderColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  activityRadioActive: {
    borderColor: COLORS.primary,
  },
  activityRadioDot: {
    width: 12,
    height: 12,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.primary,
  },
  activityTitleContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: SPACING.xs,
  },
  activityLabel: {
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.text,
  },
  activityFactor: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textSecondary,
  },
  activityDescription: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textSecondary,
    lineHeight: TYPOGRAPHY.lineHeights.normal * TYPOGRAPHY.sizes.sm,
  },
  recommendedBadge: {
    position: 'absolute',
    top: SPACING.md,
    right: SPACING.md,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
    backgroundColor: COLORS.success,
  },
  recommendedText: {
    fontSize: TYPOGRAPHY.sizes.xs,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.white,
  },

  // Navigation
  navigationContainer: {
    flexDirection: 'row',
    gap: SPACING.md,
    padding: SPACING.lg,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.xl,
    borderRadius: BORDER_RADIUS.md,
  },
  buttonFull: {
    flex: 1,
  },
  buttonPrimary: {
    flex: 1,
    backgroundColor: COLORS.primary,
    ...SHADOWS.sm,
  },
  buttonPrimaryText: {
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.white,
  },
  buttonSecondary: {
    backgroundColor: COLORS.white,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  buttonSecondaryText: {
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.primary,
  },
  cancelButton: {
    alignItems: 'center',
    paddingVertical: SPACING.md,
  },
  cancelButtonText: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textSecondary,
  },
});
