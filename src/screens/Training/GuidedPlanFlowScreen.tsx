/**
 * Guided Plan Flow Screen
 *
 * Multi-step decision tree flow that guides users to their optimal training plan.
 * Based on trainingsplan-entscheidungsbaum.md
 *
 * Features:
 * - Complete decision tree with 18 program combinations
 * - Progress tracking across steps
 * - Dynamic question flow based on answers
 * - Template preview before creation
 * - Plan creation from selected template
 */

import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Alert,
  ActivityIndicator,
} from "react-native";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useTrainingNavigation } from "@/hooks/useTrainingNavigation";
import { trainingService } from "@/services/trainingService";
import type {
  GuidedPlanFlowScreenProps,
  TrainingStackParamList,
} from "@/navigation/TrainingStackNavigator";
import type { PlanTemplate } from "@/types/training.types";
import { supabase } from "@/lib/supabase";

// ============================================================================
// Types
// ============================================================================

interface DecisionTreeState {
  experience?: "beginner" | "intermediate" | "advanced";
  daysPerWeek?: number;
  primaryGoal?: string;
}

interface QuestionOption {
  value: string | number;
  label: string;
  description?: string;
  result?: string; // plan_type ID for final result
  nextQuestion?: string;
  redirectTo?: string | number;
  info?: string;
  preview?: {
    name: string;
    description: string;
    weeks?: number;
    workouts?: number;
    status?: "complete" | "incomplete";
  };
}

interface Question {
  id: string;
  question: string;
  info?: string;
  options: QuestionOption[];
}

type Step = "experience" | "daysPerWeek" | "goal" | "result";

// ============================================================================
// Constants
// ============================================================================

const COLORS = {
  background: "#F8F9FA",
  text: "#333333",
  textSecondary: "#666666",
  primary: "#4A90E2",
  success: "#4CAF50",
  warning: "#FF9800",
  selected: "#E3F2FD",
  selectedBorder: "#4A90E2",
};

const SPACING = {
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

// Complete programs (with template exercises)
const COMPLETE_PROGRAMS = new Set([
  "starting_strength",
  "stronglifts_5x5",
  "full_body_3x",
  "phul",
  "upper_lower_hypertrophy",
  "531_intermediate",
  "ppl_6x_intermediate",
]);

// ============================================================================
// Component
// ============================================================================

export const GuidedPlanFlowScreen: React.FC<
  GuidedPlanFlowScreenProps
> = () => {
  const navigation = useTrainingNavigation();

  // State
  const [answers, setAnswers] = useState<DecisionTreeState>({});
  const [currentStep, setCurrentStep] = useState<Step>("experience");
  const [selectedOption, setSelectedOption] = useState<string | number | null>(
    null
  );
  const [loading, setLoading] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<PlanTemplate | null>(
    null
  );
  const [showPreview, setShowPreview] = useState(false);

  // Get current question based on state
  const getCurrentQuestion = (): Question => {
    // Step 1: Experience
    if (currentStep === "experience") {
      return {
        id: "experience",
        question: "Wie viel Trainingserfahrung hast du im Krafttraining?",
        options: [
          {
            value: "beginner",
            label: "Anfänger",
            description: "0-12 Monate regelmäßiges Training",
          },
          {
            value: "intermediate",
            label: "Intermediär",
            description: "1-3 Jahre regelmäßiges Training",
          },
          {
            value: "advanced",
            label: "Fortgeschritten",
            description: "3+ Jahre regelmäßiges Training",
          },
        ],
      };
    }

    // Step 2: Days Per Week (based on experience)
    if (currentStep === "daysPerWeek") {
      if (answers.experience === "beginner") {
        return {
          id: "daysPerWeek_beginner",
          question: "Wie viele Tage pro Woche kannst du trainieren?",
          options: [
            {
              value: 2,
              label: "2 Tage",
              result: "minimal_upper_lower",
            },
            {
              value: 3,
              label: "3 Tage",
              nextQuestion: "goal",
            },
            {
              value: 4,
              label: "4+ Tage",
              info: "Für Anfänger empfehlen wir maximal 3 Trainingstage pro Woche. Mehr Training bedeutet nicht automatisch mehr Fortschritt!",
              redirectTo: 3,
            },
          ],
        };
      }

      if (answers.experience === "intermediate") {
        return {
          id: "daysPerWeek_intermediate",
          question: "Wie viele Tage pro Woche kannst du trainieren?",
          options: [
            {
              value: 3,
              label: "3 Tage",
              result: "alternating_upper_lower",
            },
            {
              value: 4,
              label: "4 Tage",
              nextQuestion: "goal",
            },
            {
              value: 5,
              label: "5 Tage",
              nextQuestion: "goal",
            },
            {
              value: 6,
              label: "6 Tage",
              nextQuestion: "goal",
            },
          ],
        };
      }

      if (answers.experience === "advanced") {
        return {
          id: "daysPerWeek_advanced",
          question: "Wie viele Tage pro Woche kannst du trainieren?",
          options: [
            {
              value: 4,
              label: "4 Tage",
              nextQuestion: "goal",
            },
            {
              value: 5,
              label: "5 Tage",
              nextQuestion: "goal",
            },
            {
              value: 6,
              label: "6 Tage",
              nextQuestion: "goal",
            },
          ],
        };
      }
    }

    // Step 3: Goal (based on experience + daysPerWeek)
    if (currentStep === "goal") {
      // Beginner + 3 days
      if (answers.experience === "beginner" && answers.daysPerWeek === 3) {
        return {
          id: "goal_beginner_3days",
          question: "Was ist dein Hauptziel?",
          options: [
            {
              value: "strength",
              label: "Maximalkraft aufbauen",
              result: "starting_strength",
              preview: {
                name: "Starting Strength",
                description: "Fokus auf die 5 wichtigsten Kraftübungen",
                weeks: 12,
                workouts: 2,
                status: "complete",
              },
            },
            {
              value: "hypertrophy_balanced",
              label: "Muskelaufbau & ausgeglichene Entwicklung",
              result: "stronglifts_5x5",
              preview: {
                name: "StrongLifts 5x5",
                description:
                  "Klassisches 5x5 Programm für ausgeglichenen Muskelaufbau",
                weeks: 12,
                workouts: 2,
                status: "complete",
              },
            },
            {
              value: "general_fitness",
              label: "Allgemeine Fitness",
              result: "full_body_3x",
              preview: {
                name: "Full Body 3x per Week",
                description: "Ganzkörpertraining für optimale Frequenz",
                weeks: 12,
                workouts: 3,
                status: "complete",
              },
            },
          ],
        };
      }

      // Intermediate + 4 days
      if (answers.experience === "intermediate" && answers.daysPerWeek === 4) {
        return {
          id: "goal_intermediate_4days",
          question: "Was ist dein Hauptziel?",
          options: [
            {
              value: "both",
              label: "Kraft & Muskelaufbau kombiniert",
              result: "phul",
              preview: {
                name: "PHUL (Power Hypertrophy Upper Lower)",
                description: "Kombiniert Kraft- und Hypertrophie-Training",
                weeks: 12,
                workouts: 4,
                status: "complete",
              },
            },
            {
              value: "hypertrophy",
              label: "Primär Muskelaufbau",
              result: "upper_lower_hypertrophy",
              preview: {
                name: "Upper/Lower Hypertrophy Focus",
                description: "Optimiert für maximalen Muskelaufbau",
                weeks: 12,
                workouts: 4,
                status: "complete",
              },
            },
            {
              value: "strength",
              label: "Primär Kraft",
              result: "531_intermediate",
              preview: {
                name: "Jim Wendler 5/3/1",
                description: "Periodisiertes Kraftprogramm mit Boring But Big",
                weeks: 16,
                workouts: 4,
                status: "complete",
              },
            },
          ],
        };
      }

      // Intermediate + 5 days
      if (answers.experience === "intermediate" && answers.daysPerWeek === 5) {
        return {
          id: "goal_intermediate_5days",
          question: "Was ist dein Hauptziel?",
          options: [
            {
              value: "hypertrophy",
              label: "Muskelaufbau",
              result: "ppl_rotating_5d",
              preview: {
                name: "PPL Rotating (5-Tage)",
                description: "Push/Pull/Legs über 2 Wochen rotierend",
                status: "incomplete",
              },
            },
            {
              value: "upper_focus",
              label: "Upper Body Fokus",
              result: "upper_lower_3_2",
              preview: {
                name: "Upper/Lower 3/2 Split",
                description: "3x Upper Body, 2x Lower Body pro Woche",
                status: "incomplete",
              },
            },
          ],
        };
      }

      // Intermediate + 6 days
      if (answers.experience === "intermediate" && answers.daysPerWeek === 6) {
        return {
          id: "confirm_intermediate_6days",
          question: "Bereit für intensives Training?",
          info: "6 Tage Training erfordert gute Recovery und Zeitmanagement",
          options: [
            {
              value: "yes",
              label: "Ja, ich bin bereit!",
              result: "ppl_6x_intermediate",
              preview: {
                name: "PPL 6x per Week",
                description: "Klassisches Push/Pull/Legs zweimal pro Woche",
                weeks: 12,
                workouts: 3,
                status: "complete",
              },
            },
            {
              value: "no",
              label: "Lieber etwas weniger",
              info: "Wir empfehlen dir 4 Trainingstage pro Woche",
              redirectTo: 4,
            },
          ],
        };
      }

      // Advanced + 4 days
      if (answers.experience === "advanced" && answers.daysPerWeek === 4) {
        return {
          id: "goal_advanced_4days",
          question: "Was ist dein Hauptziel?",
          options: [
            {
              value: "strength",
              label: "Maximalkraft",
              result: "531_advanced",
              preview: {
                name: "5/3/1 Advanced",
                description: "Fortgeschrittene 5/3/1 Variante",
                status: "incomplete",
              },
            },
            {
              value: "both",
              label: "Kraft & Hypertrophie",
              result: "phul_periodized",
              preview: {
                name: "PHUL with Periodization",
                description: "PHUL mit periodisiertem Aufbau",
                status: "incomplete",
              },
            },
          ],
        };
      }

      // Advanced + 5 days
      if (answers.experience === "advanced" && answers.daysPerWeek === 5) {
        return {
          id: "goal_advanced_5days",
          question: "Was ist dein Hauptziel?",
          options: [
            {
              value: "strength",
              label: "Maximalkraft",
              result: "block_periodization_5d",
              preview: {
                name: "Block Periodization (5-Tage)",
                description: "Blockperiodisierung für Kraftmaximierung",
                status: "incomplete",
              },
            },
            {
              value: "hypertrophy",
              label: "Hypertrophie",
              result: "ppl_advanced_5d",
              preview: {
                name: "PPL Advanced (5-Tage)",
                description: "Fortgeschrittenes PPL mit höherem Volumen",
                status: "incomplete",
              },
            },
          ],
        };
      }

      // Advanced + 6 days
      if (answers.experience === "advanced" && answers.daysPerWeek === 6) {
        return {
          id: "goal_advanced_6days",
          question: "Was ist dein Hauptziel?",
          options: [
            {
              value: "strength",
              label: "Maximalkraft",
              result: "block_periodization_6d",
              preview: {
                name: "Block Periodization (6-Tage)",
                description: "Maximale Kraftentwicklung mit Blockperiodisierung",
                status: "incomplete",
              },
            },
            {
              value: "hypertrophy",
              label: "Hypertrophie",
              result: "ppl_advanced_periodized",
              preview: {
                name: "PPL Advanced Periodized",
                description: "Ultimatives Hypertrophieprogramm",
                status: "incomplete",
              },
            },
            {
              value: "powerlifting",
              label: "Powerlifting",
              result: "conjugate_method",
              preview: {
                name: "Conjugate Method (Westside)",
                description: "Westside Barbell Conjugate Method",
                status: "incomplete",
              },
            },
          ],
        };
      }
    }

    // Fallback
    return {
      id: "fallback",
      question: "Fehler: Keine passende Frage gefunden",
      options: [],
    };
  };

  // Handle option selection
  const handleSelectOption = async (option: QuestionOption) => {
    setSelectedOption(option.value);

    // Handle redirects with info
    if (option.redirectTo !== undefined) {
      if (option.info) {
        Alert.alert("Hinweis", option.info, [
          {
            text: "OK",
            onPress: () => {
              // Update state and redirect
              if (currentStep === "daysPerWeek") {
                setAnswers((prev) => ({
                  ...prev,
                  daysPerWeek: option.redirectTo as number,
                }));
                setCurrentStep("goal");
              }
              setSelectedOption(null);
            },
          },
        ]);
      } else {
        // Direct redirect
        if (currentStep === "daysPerWeek") {
          setAnswers((prev) => ({
            ...prev,
            daysPerWeek: option.redirectTo as number,
          }));
          setCurrentStep("goal");
        }
        setSelectedOption(null);
      }
      return;
    }

    // If this option has a result (final step), load template
    if (option.result) {
      setLoading(true);
      try {
        // Find template by plan_type
        const { data: template, error } = await supabase
          .from("plan_templates")
          .select("*")
          .eq("plan_type", option.result)
          .single();

        if (error || !template) {
          throw new Error("Template nicht gefunden");
        }

        setSelectedTemplate(template);

        // Check if program is complete
        const isComplete = COMPLETE_PROGRAMS.has(option.result);

        if (!isComplete) {
          Alert.alert(
            "Hinweis",
            `Der Plan "${option.preview?.name || template.name_de}" ist noch in Entwicklung und hat noch keine konfigurierten Übungen. Möchtest du trotzdem fortfahren?`,
            [
              {
                text: "Anderen Plan wählen",
                style: "cancel",
                onPress: () => {
                  setSelectedOption(null);
                  setSelectedTemplate(null);
                },
              },
              {
                text: "Trotzdem erstellen",
                onPress: () => setShowPreview(true),
              },
            ]
          );
        } else {
          setShowPreview(true);
        }
      } catch (error) {
        console.error("Fehler beim Laden des Templates:", error);
        Alert.alert(
          "Fehler",
          "Template konnte nicht geladen werden. Bitte versuche es erneut."
        );
      } finally {
        setLoading(false);
      }
      return;
    }

    // Continue to next step (no setTimeout, immediate)
    if (option.nextQuestion === "goal") {
      setCurrentStep("goal");
    }
  };

  // Handle "Next" button (for steps without immediate result)
  const handleNext = () => {
    if (selectedOption === null) return;

    const currentQuestion = getCurrentQuestion();
    const option = currentQuestion.options.find(
      (opt) => opt.value === selectedOption
    );

    if (!option) return;

    // Update answers
    if (currentStep === "experience") {
      setAnswers({ ...answers, experience: option.value as any });
      setCurrentStep("daysPerWeek");
    } else if (currentStep === "daysPerWeek") {
      setAnswers({ ...answers, daysPerWeek: option.value as number });
      if (option.nextQuestion === "goal") {
        setCurrentStep("goal");
      }
    } else if (currentStep === "goal") {
      setAnswers({ ...answers, primaryGoal: option.value as string });
    }

    setSelectedOption(null);
  };

  // Handle back button
  const handleBack = () => {
    if (currentStep === "daysPerWeek") {
      setCurrentStep("experience");
      setAnswers({});
    } else if (currentStep === "goal") {
      setCurrentStep("daysPerWeek");
      setAnswers({ experience: answers.experience });
    }
    setSelectedOption(null);
  };

  // Handle plan creation
  const handleCreatePlan = async () => {
    if (!selectedTemplate) return;

    setLoading(true);
    try {
      // Get user ID from Supabase auth
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error("Nicht angemeldet");
      }

      // Create plan from template
      const planId = await trainingService.createPlanFromTemplate(
        user.id,
        selectedTemplate.id,
        selectedTemplate.name_de,
        new Date(),
        true // Set as active
      );

      // Success!
      Alert.alert(
        "Plan erstellt!",
        `Dein Plan "${selectedTemplate.name_de}" wurde erfolgreich erstellt.`,
        [
          {
            text: "OK",
            onPress: () => {
              // Navigate back to dashboard
              navigation.navigate("TrainingDashboard");
            },
          },
        ]
      );
    } catch (error) {
      console.error("Fehler beim Erstellen des Plans:", error);
      Alert.alert(
        "Fehler",
        "Plan konnte nicht erstellt werden. Bitte versuche es erneut."
      );
    } finally {
      setLoading(false);
    }
  };

  // Calculate progress
  const calculateProgress = (): number => {
    if (currentStep === "experience") return 0.33;
    if (currentStep === "daysPerWeek") return 0.66;
    if (currentStep === "goal") return 1.0;
    return 0;
  };

  const currentQuestion = getCurrentQuestion();
  const progress = calculateProgress();

  // Preview Modal
  if (showPreview && selectedTemplate) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <ScrollView
          style={styles.container}
          contentContainerStyle={styles.scrollContent}
        >
          <View style={styles.previewHeader}>
            <Text style={styles.previewTitle}>Dein Plan:</Text>
          </View>

          <Card padding="large" elevation="medium">
            <Text style={styles.templateName}>{selectedTemplate.name_de}</Text>
            {selectedTemplate.description_de && (
              <Text style={styles.templateDescription}>
                {selectedTemplate.description_de}
              </Text>
            )}

            <View style={styles.templateStats}>
              <Text style={styles.statText}>
                📅 {selectedTemplate.days_per_week} Tage pro Woche
              </Text>
              <Text style={styles.statText}>
                🎯 Ziel:{" "}
                {selectedTemplate.primary_goal === "strength"
                  ? "Kraft"
                  : selectedTemplate.primary_goal === "hypertrophy"
                  ? "Muskelaufbau"
                  : "Beides"}
              </Text>
              <Text style={styles.statText}>
                📊 Level:{" "}
                {selectedTemplate.fitness_level === "beginner"
                  ? "Anfänger"
                  : selectedTemplate.fitness_level === "intermediate"
                  ? "Intermediär"
                  : "Fortgeschritten"}
              </Text>
            </View>

            {!COMPLETE_PROGRAMS.has(selectedTemplate.plan_type) && (
              <View style={styles.incompleteBadge}>
                <Text style={styles.incompleteBadgeText}>
                  ⚠️ Dieser Plan ist noch in Entwicklung
                </Text>
              </View>
            )}
          </Card>

          <View style={styles.previewActions}>
            <Button
              variant="secondary"
              onPress={() => {
                setShowPreview(false);
                setSelectedOption(null);
                setSelectedTemplate(null);
              }}
              style={styles.previewButton}
            >
              Abbrechen
            </Button>

            <Button
              variant="primary"
              onPress={handleCreatePlan}
              disabled={loading}
              style={styles.previewButton}
            >
              {loading ? "Erstelle..." : "Plan erstellen"}
            </Button>
          </View>
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Progress Bar */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
          </View>
          <Text style={styles.progressText}>
            Schritt {currentStep === "experience" ? 1 : currentStep === "daysPerWeek" ? 2 : 3}{" "}
            von 3
          </Text>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Question */}
          <Text style={styles.question}>{currentQuestion.question}</Text>

          {currentQuestion.info && (
            <Text style={styles.info}>{currentQuestion.info}</Text>
          )}

          {/* Options */}
          <View style={styles.optionsContainer}>
            {currentQuestion.options.map((option) => {
              const isSelected = selectedOption === option.value;
              const isComplete =
                option.result && COMPLETE_PROGRAMS.has(option.result);

              return (
                <Card
                  key={option.value}
                  onPress={() => handleSelectOption(option)}
                  padding="large"
                  elevation={isSelected ? "large" : "medium"}
                  style={[
                    styles.optionCard,
                    isSelected && styles.optionCardSelected,
                  ]}
                >
                  <View style={styles.optionContent}>
                    <Text style={styles.optionLabel}>{option.label}</Text>

                    {option.description && (
                      <Text style={styles.optionDescription}>
                        {option.description}
                      </Text>
                    )}

                    {option.preview && (
                      <View style={styles.previewBadgeContainer}>
                        {option.preview.status === "complete" ? (
                          <View style={styles.completeBadge}>
                            <Text style={styles.badgeText}>✅ Empfohlen</Text>
                          </View>
                        ) : (
                          <View style={styles.incompleteBadge}>
                            <Text style={styles.badgeText}>
                              ⚠️ In Entwicklung
                            </Text>
                          </View>
                        )}
                      </View>
                    )}

                    {isSelected && (
                      <View style={styles.checkmark}>
                        <Text style={styles.checkmarkText}>✓</Text>
                      </View>
                    )}
                  </View>
                </Card>
              );
            })}
          </View>

          {/* Bottom Spacing */}
          <View style={styles.bottomSpacing} />
        </ScrollView>

        {/* Navigation Buttons */}
        <View style={styles.navigationButtons}>
          {currentStep !== "experience" && (
            <Button
              variant="secondary"
              onPress={handleBack}
              style={styles.navButton}
            >
              Zurück
            </Button>
          )}

          {selectedOption !== null &&
            !currentQuestion.options.find((opt) => opt.value === selectedOption)
              ?.result && (
              <Button
                variant="primary"
                onPress={handleNext}
                style={styles.navButton}
              >
                Weiter
              </Button>
            )}
        </View>

        {loading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color={COLORS.primary} />
          </View>
        )}
      </View>
    </SafeAreaView>
  );
};

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: SPACING.md,
    paddingBottom: SPACING.xl,
  },
  progressContainer: {
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.lg,
  },
  progressBar: {
    height: 6,
    backgroundColor: "#E5E5EA",
    borderRadius: 3,
    overflow: "hidden",
    marginBottom: SPACING.sm,
  },
  progressFill: {
    height: "100%",
    backgroundColor: COLORS.primary,
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: "center",
  },
  question: {
    fontSize: 24,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: SPACING.md,
    lineHeight: 32,
  },
  info: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: SPACING.lg,
    lineHeight: 20,
  },
  optionsContainer: {
    gap: SPACING.md,
  },
  optionCard: {
    minHeight: 100,
  },
  optionCardSelected: {
    backgroundColor: COLORS.selected,
    borderWidth: 2,
    borderColor: COLORS.selectedBorder,
  },
  optionContent: {
    position: "relative",
  },
  optionLabel: {
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  optionDescription: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  previewBadgeContainer: {
    marginTop: SPACING.sm,
  },
  completeBadge: {
    backgroundColor: "#E8F5E9",
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: 4,
    alignSelf: "flex-start",
  },
  incompleteBadge: {
    backgroundColor: "#FFF3E0",
    paddingHorizontal: SPACING.sm,
    paddingVertical: 4,
    borderRadius: 4,
    alignSelf: "flex-start",
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.text,
  },
  checkmark: {
    position: "absolute",
    top: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  checkmarkText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "700",
  },
  navigationButtons: {
    flexDirection: "row",
    gap: SPACING.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.background,
    borderTopWidth: 1,
    borderTopColor: "#E5E5EA",
  },
  navButton: {
    flex: 1,
  },
  bottomSpacing: {
    height: SPACING.xl,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    alignItems: "center",
    justifyContent: "center",
  },
  previewHeader: {
    marginBottom: SPACING.lg,
  },
  previewTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: COLORS.text,
  },
  templateName: {
    fontSize: 22,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  templateDescription: {
    fontSize: 16,
    color: COLORS.textSecondary,
    lineHeight: 24,
    marginBottom: SPACING.lg,
  },
  templateStats: {
    gap: SPACING.sm,
  },
  statText: {
    fontSize: 16,
    color: COLORS.text,
  },
  incompleteBadgeText: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.warning,
  },
  previewActions: {
    flexDirection: "row",
    gap: SPACING.md,
    marginTop: SPACING.lg,
  },
  previewButton: {
    flex: 1,
  },
});
