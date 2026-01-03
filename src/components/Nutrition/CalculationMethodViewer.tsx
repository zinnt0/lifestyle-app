/**
 * Calculation Method Viewer Component
 *
 * Displays detailed breakdown of nutrition calculations with scientific sources.
 * Educational component to build trust and understanding of the methodology.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Linking,
  Alert,
  Share,
  Clipboard,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import {
  COLORS,
  SPACING,
  BORDER_RADIUS,
  SHADOWS,
  TYPOGRAPHY,
} from '../ui/theme';
import type {
  CalculationMethod,
  UserNutritionProfile,
} from '../../../lib/types/nutrition.types';

interface CalculationMethodViewerProps {
  calculationMethod: CalculationMethod;
  userProfile: UserNutritionProfile;
  targetCalories: number;
  macros: {
    protein_g: number;
    carbs_g: number;
    fat_g: number;
  };
  progression?: {
    expectedWeeklyChange: number;
    weeksToGoal?: number;
    estimatedTargetDate?: Date;
  };
}

interface AccordionSectionProps {
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  iconColor: string;
  children: React.ReactNode;
  defaultExpanded?: boolean;
}

function AccordionSection({
  title,
  icon,
  iconColor,
  children,
  defaultExpanded = false,
}: AccordionSectionProps) {
  const [expanded, setExpanded] = useState(defaultExpanded);

  return (
    <View style={styles.section}>
      <TouchableOpacity
        style={styles.sectionHeader}
        onPress={() => setExpanded(!expanded)}
        activeOpacity={0.7}
        accessibilityRole="button"
        accessibilityState={{ expanded }}
        accessibilityLabel={`${title} ${expanded ? 'zuklappen' : 'aufklappen'}`}
      >
        <View style={styles.sectionHeaderLeft}>
          <View style={[styles.iconContainer, { backgroundColor: iconColor + '20' }]}>
            <Ionicons name={icon} size={24} color={iconColor} />
          </View>
          <Text style={styles.sectionTitle}>{title}</Text>
        </View>
        <Ionicons
          name={expanded ? 'chevron-up' : 'chevron-down'}
          size={24}
          color={COLORS.textSecondary}
        />
      </TouchableOpacity>

      {expanded && <View style={styles.sectionContent}>{children}</View>}
    </View>
  );
}

function InfoBox({ children, type = 'info' }: { children: React.ReactNode; type?: 'info' | 'warning' | 'success' }) {
  const colors = {
    info: COLORS.info,
    warning: COLORS.warning,
    success: COLORS.success,
  };

  const icons: Record<string, keyof typeof Ionicons.glyphMap> = {
    info: 'information-circle',
    warning: 'warning',
    success: 'checkmark-circle',
  };

  return (
    <View style={[styles.infoBox, { backgroundColor: colors[type] + '15' }]}>
      <Ionicons name={icons[type]} size={20} color={colors[type]} />
      <Text style={[styles.infoBoxText, { color: colors[type] }]}>{children}</Text>
    </View>
  );
}

function ScientificSource({ title, doi }: { title: string; doi: string }) {
  const handleOpenLink = async () => {
    const url = doi.startsWith('http') ? doi : `https://doi.org/${doi}`;
    const canOpen = await Linking.canOpenURL(url);
    if (canOpen) {
      await Linking.openURL(url);
    } else {
      Alert.alert('Fehler', 'Link konnte nicht geöffnet werden');
    }
  };

  return (
    <TouchableOpacity
      style={styles.sourceContainer}
      onPress={handleOpenLink}
      activeOpacity={0.7}
    >
      <View style={styles.sourceIcon}>
        <Ionicons name="document-text" size={16} color={COLORS.primary} />
      </View>
      <View style={styles.sourceText}>
        <Text style={styles.sourceTitle}>{title}</Text>
        <Text style={styles.sourceDoi}>{doi}</Text>
      </View>
      <Ionicons name="open-outline" size={20} color={COLORS.primary} />
    </TouchableOpacity>
  );
}

function CalculationStep({
  step,
  children,
}: {
  step?: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.calculationStep}>
      {step && (
        <View style={styles.stepBadge}>
          <Text style={styles.stepBadgeText}>{step}</Text>
        </View>
      )}
      <Text style={styles.calculationText}>{children}</Text>
    </View>
  );
}

function CopyableText({ text, label }: { text: string; label?: string }) {
  const handleCopy = () => {
    Clipboard.setString(text);
    Alert.alert('Kopiert', label || 'Text wurde in die Zwischenablage kopiert');
  };

  return (
    <TouchableOpacity
      style={styles.copyableContainer}
      onPress={handleCopy}
      activeOpacity={0.7}
    >
      <Text style={styles.copyableText}>{text}</Text>
      <Ionicons name="copy-outline" size={20} color={COLORS.primary} />
    </TouchableOpacity>
  );
}

export function CalculationMethodViewer({
  calculationMethod,
  userProfile,
  targetCalories,
  macros,
  progression,
}: CalculationMethodViewerProps) {
  const { weight_kg, height_cm, age, gender } = userProfile;

  const handleShare = async () => {
    try {
      const message = `Meine Ernährungsziele:\n\n` +
        `🎯 Ziel-Kalorien: ${targetCalories} kcal/Tag\n` +
        `💪 Protein: ${macros.protein_g}g\n` +
        `🍚 Kohlenhydrate: ${macros.carbs_g}g\n` +
        `🥑 Fett: ${macros.fat_g}g\n\n` +
        `Berechnet mit wissenschaftlich fundierten Formeln`;

      await Share.share({
        message,
      });
    } catch (error) {
      console.error('Error sharing:', error);
    }
  };

  // Calculate protein percentage
  const proteinKcal = macros.protein_g * 4;
  const carbsKcal = macros.carbs_g * 4;
  const fatKcal = macros.fat_g * 9;

  const proteinPercentage = Math.round((proteinKcal / targetCalories) * 100);
  const carbsPercentage = Math.round((carbsKcal / targetCalories) * 100);
  const fatPercentage = Math.round((fatKcal / targetCalories) * 100);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Wie wurden deine Kalorien berechnet?</Text>
        <Text style={styles.headerSubtitle}>
          Alle Berechnungen basieren auf wissenschaftlichen Studien
        </Text>

        {/* Share Button */}
        <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
          <Ionicons name="share-outline" size={20} color={COLORS.primary} />
          <Text style={styles.shareButtonText}>Teilen</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Section 1: BMR */}
        <AccordionSection
          title="Grundumsatz (BMR)"
          icon="calculator"
          iconColor={COLORS.primary}
          defaultExpanded
        >
          <Text style={styles.sectionSubtitle}>
            📊 Formel: Mifflin-St Jeor Gleichung (1990)
          </Text>

          <View style={styles.formulaBox}>
            <Text style={styles.formulaText}>
              {gender === 'male'
                ? 'BMR = (10 × Gewicht) + (6.25 × Größe) - (5 × Alter) + 5'
                : 'BMR = (10 × Gewicht) + (6.25 × Größe) - (5 × Alter) - 161'}
            </Text>
          </View>

          <Text style={styles.subsectionTitle}>📝 Deine Berechnung:</Text>

          <CalculationStep step="1">
            BMR = (10 × {weight_kg} kg) + (6.25 × {height_cm} cm) - (5 × {age}{' '}
            Jahre) {gender === 'male' ? '+ 5' : '- 161'}
          </CalculationStep>

          <CalculationStep step="2">
            {calculationMethod.bmrCalculation}
          </CalculationStep>

          <CopyableText
            text={calculationMethod.bmrCalculation}
            label="BMR Berechnung kopiert"
          />

          <InfoBox type="info">
            Der Grundumsatz ist die Energie, die dein Körper in Ruhe benötigt
            (Atmung, Herzschlag, Körpertemperatur etc.)
          </InfoBox>

          <Text style={styles.subsectionTitle}>🔬 Wissenschaftliche Quelle:</Text>
          <ScientificSource
            title="Mifflin-St Jeor ist die genaueste Formel mit 50,4% Präzision ±10%"
            doi={calculationMethod.sources.formula}
          />
        </AccordionSection>

        {/* Section 2: TDEE */}
        <AccordionSection
          title="Gesamtumsatz (TDEE)"
          icon="flash"
          iconColor={COLORS.warning}
          defaultExpanded
        >
          <Text style={styles.sectionSubtitle}>
            📊 Berechnung: TDEE = BMR × PAL-Faktor
          </Text>

          <Text style={styles.subsectionTitle}>📝 Deine Berechnung:</Text>

          <CalculationStep>
            TDEE = {calculationMethod.bmrCalculation.split('=')[1]?.trim()} × {calculationMethod.palFactor}
          </CalculationStep>

          <View style={styles.resultBox}>
            <Text style={styles.resultLabel}>Dein Gesamtumsatz:</Text>
            <Text style={styles.resultValue}>
              {Math.round(
                parseFloat(calculationMethod.bmrCalculation.split('=')[1]?.replace(/[^\d.]/g, '') || '0') *
                  calculationMethod.palFactor
              )}{' '}
              kcal/Tag
            </Text>
          </View>

          <View style={styles.palBox}>
            <Text style={styles.palTitle}>📍 Dein Aktivitätslevel:</Text>
            <Text style={styles.palValue}>
              {calculationMethod.palDescription}
            </Text>
          </View>

          <InfoBox type="info">
            Der PAL-Faktor (Physical Activity Level) berücksichtigt deine
            tägliche Aktivität zusätzlich zum Grundumsatz
          </InfoBox>
        </AccordionSection>

        {/* Section 3: Goal Adjustment */}
        <AccordionSection
          title="Ziel-Anpassung"
          icon="target"
          iconColor={COLORS.success}
          defaultExpanded
        >
          <Text style={styles.sectionSubtitle}>
            🎯 Dein Trainingsziel: {getTrainingGoalLabel(userProfile.training_goal)}
          </Text>

          <View style={styles.adjustmentBox}>
            <Text style={styles.adjustmentLabel}>📊 Anpassung:</Text>
            <Text
              style={[
                styles.adjustmentValue,
                {
                  color:
                    calculationMethod.goalAdjustment.amount > 0
                      ? COLORS.success
                      : calculationMethod.goalAdjustment.amount < 0
                        ? COLORS.error
                        : COLORS.textSecondary,
                },
              ]}
            >
              {calculationMethod.goalAdjustment.amount > 0 ? '+' : ''}
              {calculationMethod.goalAdjustment.amount} kcal/Tag
            </Text>
          </View>

          <Text style={styles.subsectionTitle}>📝 Berechnung:</Text>
          <CalculationStep>
            Ziel-Kalorien ={' '}
            {Math.round(
              parseFloat(calculationMethod.bmrCalculation.split('=')[1]?.replace(/[^\d.]/g, '') || '0') *
                calculationMethod.palFactor
            )}{' '}
            {calculationMethod.goalAdjustment.amount > 0 ? '+' : ''}{' '}
            {calculationMethod.goalAdjustment.amount} = {targetCalories} kcal/Tag
          </CalculationStep>

          <View style={styles.reasonBox}>
            <Text style={styles.reasonLabel}>❓ Warum {Math.abs(calculationMethod.goalAdjustment.amount)} kcal?</Text>
            <Text style={styles.reasonText}>
              {calculationMethod.goalAdjustment.reason}
            </Text>
          </View>

          {calculationMethod.goalAdjustment.type === 'deficit' && (
            <InfoBox type="warning">
              Defizite {'>'}500 kcal verhindern Muskelaufbau und können
              Muskelverlust verursachen. Daher maximal 500 kcal Defizit empfohlen.
            </InfoBox>
          )}

          <Text style={styles.subsectionTitle}>🔬 Wissenschaftliche Quelle:</Text>
          <ScientificSource
            title="Studie zeigt: Optimale Defizite für Muskelerhalt"
            doi={calculationMethod.sources.goalRecommendation}
          />
        </AccordionSection>

        {/* Section 4: Protein */}
        <AccordionSection
          title="Protein-Empfehlung"
          icon="fitness"
          iconColor="#FF6B6B"
        >
          <Text style={styles.sectionSubtitle}>
            💪 Dein Protein-Ziel: {(macros.protein_g / weight_kg).toFixed(1)}{' '}
            g/kg Körpergewicht
          </Text>

          <Text style={styles.subsectionTitle}>📝 Berechnung:</Text>
          <CalculationStep>
            Protein = {weight_kg} kg × {(macros.protein_g / weight_kg).toFixed(1)}{' '}
            g/kg = {macros.protein_g} g/Tag
          </CalculationStep>

          <View style={styles.resultBox}>
            <Text style={styles.resultLabel}>Dein Protein-Ziel:</Text>
            <Text style={styles.resultValue}>{macros.protein_g} g/Tag</Text>
          </View>

          <View style={styles.reasonBox}>
            <Text style={styles.reasonLabel}>❓ Warum diese Menge?</Text>
            <Text style={styles.reasonText}>
              {calculationMethod.proteinRationale}
            </Text>
          </View>

          <InfoBox type="success">
            Verteile dein Protein auf 4-5 Mahlzeiten (ca.{' '}
            {Math.round(macros.protein_g / 4)}g pro Mahlzeit) für optimale
            Proteinsynthese
          </InfoBox>

          <Text style={styles.subsectionTitle}>🔬 Wissenschaftliche Quelle:</Text>
          <ScientificSource
            title="Studie: Hohes Protein + Krafttraining = Muskelerhalt"
            doi={calculationMethod.sources.proteinRecommendation}
          />
        </AccordionSection>

        {/* Section 5: Macros Distribution */}
        <AccordionSection
          title="Makronährstoff-Verteilung"
          icon="pie-chart"
          iconColor="#FFB84D"
        >
          <Text style={styles.sectionSubtitle}>
            📊 Verteilung deiner {targetCalories} kcal:
          </Text>

          {/* Macro Bars */}
          <View style={styles.macroContainer}>
            {/* Protein Bar */}
            <View style={styles.macroRow}>
              <Text style={styles.macroLabel}>Protein</Text>
              <View style={styles.macroBar}>
                <View
                  style={[
                    styles.macroBarFill,
                    {
                      width: `${proteinPercentage}%`,
                      backgroundColor: '#6FD89E',
                    },
                  ]}
                />
              </View>
              <Text style={styles.macroValue}>
                {macros.protein_g}g ({proteinPercentage}%)
              </Text>
            </View>

            {/* Carbs Bar */}
            <View style={styles.macroRow}>
              <Text style={styles.macroLabel}>Kohlenhydrate</Text>
              <View style={styles.macroBar}>
                <View
                  style={[
                    styles.macroBarFill,
                    {
                      width: `${carbsPercentage}%`,
                      backgroundColor: '#FFB84D',
                    },
                  ]}
                />
              </View>
              <Text style={styles.macroValue}>
                {macros.carbs_g}g ({carbsPercentage}%)
              </Text>
            </View>

            {/* Fat Bar */}
            <View style={styles.macroRow}>
              <Text style={styles.macroLabel}>Fett</Text>
              <View style={styles.macroBar}>
                <View
                  style={[
                    styles.macroBarFill,
                    {
                      width: `${fatPercentage}%`,
                      backgroundColor: '#FF6B6B',
                    },
                  ]}
                />
              </View>
              <Text style={styles.macroValue}>
                {macros.fat_g}g ({fatPercentage}%)
              </Text>
            </View>
          </View>

          <Text style={styles.subsectionTitle}>📝 Berechnung:</Text>
          <CalculationStep step="1">
            Protein: {macros.protein_g}g × 4 kcal/g = {proteinKcal} kcal
          </CalculationStep>
          <CalculationStep step="2">
            Fett: {fatPercentage}% von {targetCalories} kcal = {fatKcal} kcal ={' '}
            {macros.fat_g}g
          </CalculationStep>
          <CalculationStep step="3">
            Carbs: {targetCalories} - {proteinKcal} - {fatKcal} = {carbsKcal}{' '}
            kcal = {macros.carbs_g}g
          </CalculationStep>
        </AccordionSection>

        {/* Section 6: Progression */}
        {progression && progression.expectedWeeklyChange !== 0 && (
          <AccordionSection
            title="Erwartete Progression"
            icon="trending-up"
            iconColor={COLORS.success}
          >
            <Text style={styles.sectionSubtitle}>
              📉 Geschätzter Fortschritt:
            </Text>

            <View style={styles.progressionBox}>
              <View style={styles.progressionRow}>
                <Text style={styles.progressionLabel}>Pro Woche:</Text>
                <Text
                  style={[
                    styles.progressionValue,
                    {
                      color:
                        progression.expectedWeeklyChange < 0
                          ? COLORS.error
                          : COLORS.success,
                    },
                  ]}
                >
                  {progression.expectedWeeklyChange > 0 ? '+' : ''}
                  {progression.expectedWeeklyChange.toFixed(1)} kg
                </Text>
              </View>

              <View style={styles.progressionRow}>
                <Text style={styles.progressionLabel}>Pro Monat:</Text>
                <Text style={styles.progressionValue}>
                  {progression.expectedWeeklyChange > 0 ? '+' : ''}
                  {(progression.expectedWeeklyChange * 4).toFixed(1)} kg
                </Text>
              </View>

              {progression.weeksToGoal && (
                <View style={styles.progressionRow}>
                  <Text style={styles.progressionLabel}>Bis Zielgewicht:</Text>
                  <Text style={styles.progressionValue}>
                    {progression.weeksToGoal} Wochen
                  </Text>
                </View>
              )}

              {progression.estimatedTargetDate && (
                <View style={styles.progressionRow}>
                  <Text style={styles.progressionLabel}>
                    Voraussichtlich erreicht:
                  </Text>
                  <Text style={styles.progressionValue}>
                    {progression.estimatedTargetDate.toLocaleDateString('de-DE', {
                      day: 'numeric',
                      month: 'long',
                      year: 'numeric',
                    })}
                  </Text>
                </View>
              )}
            </View>

            <InfoBox type="info">
              Dies ist eine Schätzung. Tatsächlicher Fortschritt kann variieren.
              Wir passen deine Kalorien automatisch nach 4 Wochen basierend auf
              deiner echten Gewichtsentwicklung an.
            </InfoBox>
          </AccordionSection>
        )}

        {/* Section 7: Scientific Sources */}
        <AccordionSection
          title="Wissenschaftliche Quellen"
          icon="book"
          iconColor={COLORS.info}
        >
          <Text style={styles.sectionSubtitle}>
            📚 Alle verwendeten Studien:
          </Text>

          <ScientificSource
            title="Mifflin-St Jeor Genauigkeit (2025)"
            doi={calculationMethod.sources.formula}
          />

          <ScientificSource
            title="Kaloriendefizit & Muskelaufbau"
            doi={calculationMethod.sources.goalRecommendation}
          />

          <ScientificSource
            title="Protein bei Gewichtsverlust"
            doi={calculationMethod.sources.proteinRecommendation}
          />

          <InfoBox type="success">
            Alle Empfehlungen basieren auf peer-reviewed Studien und
            evidenzbasierter Forschung im Bereich Sporternährung.
          </InfoBox>
        </AccordionSection>

        {/* Bottom Spacing */}
        <View style={{ height: SPACING.xxxl }} />
      </ScrollView>
    </View>
  );
}

// Helper function to get training goal label
function getTrainingGoalLabel(goal: string): string {
  const labels: Record<string, string> = {
    strength: 'Kraft aufbauen',
    muscle_gain: 'Muskeln aufbauen',
    weight_loss: 'Gewicht verlieren',
    endurance: 'Ausdauer verbessern',
    general_fitness: 'Allgemeine Fitness',
  };
  return labels[goal] || goal;
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

  // Header
  header: {
    padding: SPACING.xl,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTitle: {
    fontSize: TYPOGRAPHY.sizes.xxl,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  headerSubtitle: {
    fontSize: TYPOGRAPHY.sizes.md,
    color: COLORS.textSecondary,
    lineHeight: TYPOGRAPHY.lineHeights.relaxed * TYPOGRAPHY.sizes.md,
  },
  shareButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.xs,
    alignSelf: 'flex-start',
    marginTop: SPACING.lg,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.primary,
  },
  shareButtonText: {
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.medium,
    color: COLORS.primary,
  },

  // Section
  section: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.md,
    marginBottom: SPACING.md,
    overflow: 'hidden',
    ...SHADOWS.sm,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.lg,
  },
  sectionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.md,
    flex: 1,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    flex: 1,
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.text,
  },
  sectionContent: {
    padding: SPACING.lg,
    paddingTop: 0,
  },
  sectionSubtitle: {
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: TYPOGRAPHY.weights.medium,
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  subsectionTitle: {
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.text,
    marginTop: SPACING.lg,
    marginBottom: SPACING.sm,
  },

  // Formula Box
  formulaBox: {
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.sm,
    backgroundColor: COLORS.primary + '10',
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
    marginBottom: SPACING.lg,
  },
  formulaText: {
    fontSize: TYPOGRAPHY.sizes.sm,
    fontFamily: 'monospace',
    color: COLORS.primary,
    lineHeight: TYPOGRAPHY.lineHeights.relaxed * TYPOGRAPHY.sizes.sm,
  },

  // Calculation Step
  calculationStep: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  stepBadge: {
    width: 24,
    height: 24,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepBadgeText: {
    fontSize: TYPOGRAPHY.sizes.xs,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.white,
  },
  calculationText: {
    flex: 1,
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.text,
    fontFamily: 'monospace',
    lineHeight: TYPOGRAPHY.lineHeights.relaxed * TYPOGRAPHY.sizes.sm,
  },

  // Copyable Text
  copyableContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.sm,
    backgroundColor: COLORS.surfaceSecondary,
    marginVertical: SPACING.md,
  },
  copyableText: {
    flex: 1,
    fontSize: TYPOGRAPHY.sizes.sm,
    fontFamily: 'monospace',
    color: COLORS.text,
    marginRight: SPACING.md,
  },

  // Info Box
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.sm,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.sm,
    marginVertical: SPACING.md,
  },
  infoBoxText: {
    flex: 1,
    fontSize: TYPOGRAPHY.sizes.sm,
    lineHeight: TYPOGRAPHY.lineHeights.normal * TYPOGRAPHY.sizes.sm,
  },

  // Result Box
  resultBox: {
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.success + '15',
    borderWidth: 2,
    borderColor: COLORS.success,
    marginVertical: SPACING.md,
    alignItems: 'center',
  },
  resultLabel: {
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.medium,
    color: COLORS.success,
    marginBottom: SPACING.xs,
  },
  resultValue: {
    fontSize: TYPOGRAPHY.sizes.xxxl,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.success,
  },

  // PAL Box
  palBox: {
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.sm,
    backgroundColor: COLORS.surfaceSecondary,
    marginVertical: SPACING.md,
  },
  palTitle: {
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  palValue: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textSecondary,
  },

  // Adjustment Box
  adjustmentBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.sm,
    backgroundColor: COLORS.surfaceSecondary,
    marginBottom: SPACING.md,
  },
  adjustmentLabel: {
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: TYPOGRAPHY.weights.medium,
    color: COLORS.text,
  },
  adjustmentValue: {
    fontSize: TYPOGRAPHY.sizes.xl,
    fontWeight: TYPOGRAPHY.weights.bold,
  },

  // Reason Box
  reasonBox: {
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.sm,
    backgroundColor: COLORS.info + '10',
    marginVertical: SPACING.md,
  },
  reasonLabel: {
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.info,
    marginBottom: SPACING.xs,
  },
  reasonText: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.text,
    lineHeight: TYPOGRAPHY.lineHeights.normal * TYPOGRAPHY.sizes.sm,
  },

  // Scientific Source
  sourceContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.sm,
    backgroundColor: COLORS.surfaceSecondary,
    marginBottom: SPACING.sm,
  },
  sourceIcon: {
    width: 32,
    height: 32,
    borderRadius: BORDER_RADIUS.sm,
    backgroundColor: COLORS.primary + '20',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sourceText: {
    flex: 1,
  },
  sourceTitle: {
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.medium,
    color: COLORS.text,
    marginBottom: 2,
  },
  sourceDoi: {
    fontSize: TYPOGRAPHY.sizes.xs,
    color: COLORS.primary,
    fontFamily: 'monospace',
  },

  // Macro Distribution
  macroContainer: {
    gap: SPACING.lg,
    marginVertical: SPACING.md,
  },
  macroRow: {
    gap: SPACING.sm,
  },
  macroLabel: {
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.medium,
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  macroBar: {
    height: 24,
    backgroundColor: COLORS.surfaceSecondary,
    borderRadius: BORDER_RADIUS.sm,
    overflow: 'hidden',
  },
  macroBarFill: {
    height: '100%',
    borderRadius: BORDER_RADIUS.sm,
  },
  macroValue: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },

  // Progression
  progressionBox: {
    gap: SPACING.md,
    marginVertical: SPACING.md,
  },
  progressionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.sm,
    backgroundColor: COLORS.surfaceSecondary,
  },
  progressionLabel: {
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.medium,
    color: COLORS.text,
  },
  progressionValue: {
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.text,
  },
});
