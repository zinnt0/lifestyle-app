/**
 * Plan Progress Screen
 *
 * Displays Training Max (TM) progression for dynamic training plans.
 * Shows initial 1RM values, current TM values, and progression over weeks.
 *
 * Features:
 * - Overview of plan with tm_percentage
 * - List of exercises with initial 1RM and current TM
 * - Chart showing TM progression over weeks
 * - Button to update 1RM values
 */

import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
  RefreshControl,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { supabase } from "@/lib/supabase";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import * as Haptics from "expo-haptics";

// ============================================================================
// Constants
// ============================================================================

const COLORS = {
  background: "#F8F9FA",
  surface: "#FFFFFF",
  text: "#333333",
  textSecondary: "#666666",
  textTertiary: "#999999",
  primary: "#4A90E2",
  success: "#34C759",
  warning: "#FF9500",
  border: "#E0E0E0",
  gradient1: "#4A90E2",
  gradient2: "#7B68EE",
};

const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

// ============================================================================
// Types
// ============================================================================

type RouteParams = {
  planId: string;
};

type Props = NativeStackScreenProps<any, any> & {
  route: {
    params: RouteParams;
  };
};

interface TrainingPlanProgress {
  id: string;
  name: string;
  plan_type: string;
  tm_percentage: number | null;
  initial_1rm_snapshot: Record<string, InitialOneRM> | null;
  current_tm_values: Record<string, number> | null;
  start_date: string;
  current_week: number;
}

interface InitialOneRM {
  weight: number;
  date: string;
  is_estimated: boolean;
}

interface ExerciseProgress {
  exercise_id: string;
  exercise_name: string;
  exercise_name_de: string;
  initial_1rm: number;
  initial_date: string;
  is_estimated: boolean;
  current_tm: number;
  progression: WeeklyProgression[];
}

interface WeeklyProgression {
  week_number: number;
  tm_value: number;
  increment_applied: number | null;
}

// ============================================================================
// Component
// ============================================================================

export const PlanProgressScreen: React.FC<Props> = ({ navigation, route }) => {
  const { planId } = route.params;

  // State
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [plan, setPlan] = useState<TrainingPlanProgress | null>(null);
  const [exerciseProgress, setExerciseProgress] = useState<ExerciseProgress[]>(
    []
  );
  const [userId, setUserId] = useState<string | null>(null);

  /**
   * Load plan progress data
   */
  const loadProgressData = useCallback(async () => {
    try {
      // Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        Alert.alert("Fehler", "Du musst angemeldet sein.");
        navigation.goBack();
        return;
      }

      setUserId(user.id);

      // Fetch training plan
      const { data: planData, error: planError } = await supabase
        .from("training_plans")
        .select(
          `
          id,
          name,
          plan_type,
          tm_percentage,
          initial_1rm_snapshot,
          current_tm_values,
          start_date,
          current_week
        `
        )
        .eq("id", planId)
        .eq("user_id", user.id)
        .single();

      if (planError || !planData) {
        console.error("Error loading plan:", planError);
        Alert.alert("Fehler", "Plan konnte nicht geladen werden.");
        navigation.goBack();
        return;
      }

      setPlan(planData);

      // Check if plan is dynamic
      if (!planData.initial_1rm_snapshot || !planData.current_tm_values) {
        Alert.alert(
          "Kein dynamischer Plan",
          "Dieser Plan nutzt keine dynamische Gewichtsberechnung."
        );
        return;
      }

      // Fetch exercises
      const exerciseIds = Object.keys(planData.initial_1rm_snapshot);

      const { data: exercises, error: exercisesError } = await supabase
        .from("exercises")
        .select("id, name, name_de")
        .in("id", exerciseIds);

      if (exercisesError) {
        console.error("Error loading exercises:", exercisesError);
      }

      // Fetch progression data
      const { data: progressionData, error: progressionError } = await supabase
        .from("training_max_progression")
        .select("exercise_id, week_number, tm_value, increment_applied")
        .eq("plan_id", planId)
        .order("exercise_id")
        .order("week_number");

      if (progressionError) {
        console.error("Error loading progression:", progressionError);
      }

      // Build exercise progress data
      const progressList: ExerciseProgress[] = exerciseIds.map(
        (exerciseId) => {
          const exercise = exercises?.find((e) => e.id === exerciseId);
          const initialData = planData.initial_1rm_snapshot![exerciseId];
          const currentTM = planData.current_tm_values![exerciseId] || 0;
          const progression = (progressionData || [])
            .filter((p) => p.exercise_id === exerciseId)
            .map((p) => ({
              week_number: p.week_number,
              tm_value: p.tm_value,
              increment_applied: p.increment_applied,
            }));

          return {
            exercise_id: exerciseId,
            exercise_name: exercise?.name || "Unknown",
            exercise_name_de: exercise?.name_de || exercise?.name || "Unbekannt",
            initial_1rm: initialData?.weight || 0,
            initial_date: initialData?.date || "",
            is_estimated: initialData?.is_estimated || false,
            current_tm: currentTM,
            progression,
          };
        }
      );

      setExerciseProgress(progressList);
    } catch (error) {
      console.error("Error in loadProgressData:", error);
      Alert.alert("Fehler", "Daten konnten nicht geladen werden.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [planId, navigation]);

  /**
   * Load data on screen focus
   */
  useFocusEffect(
    useCallback(() => {
      loadProgressData();
    }, [loadProgressData])
  );

  /**
   * Handle pull-to-refresh
   */
  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    loadProgressData();
  }, [loadProgressData]);

  /**
   * Navigate to OneRMInputScreen to update 1RM values
   */
  const handleUpdateOneRM = useCallback(() => {
    if (!plan) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    // Extract exercise IDs from initial snapshot
    const exerciseIds = Object.keys(plan.initial_1rm_snapshot || {});

    // Navigate to OneRMInputScreen
    // Note: This would need to be adapted to update existing 1RM values
    Alert.alert(
      "1RM aktualisieren",
      "Diese Funktion wird in Kürze verfügbar sein. Du kannst deine 1RM-Werte direkt in den Einstellungen aktualisieren.",
      [{ text: "OK" }]
    );
  }, [plan]);

  // Loading state
  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Lade Progression...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // No plan loaded
  if (!plan) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>Plan nicht gefunden</Text>
          <Button onPress={() => navigation.goBack()}>Zurück</Button>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>{plan.name}</Text>
          <Text style={styles.subtitle}>Training Max Progression</Text>
        </View>

        {/* Plan Overview Card */}
        <Card gradient gradientColors={[COLORS.gradient1, COLORS.gradient2]}>
          <View style={styles.overviewCard}>
            <View style={styles.overviewRow}>
              <Text style={styles.overviewLabel}>Plan-Typ</Text>
              <Text style={styles.overviewValue}>{plan.plan_type}</Text>
            </View>
            <View style={styles.overviewRow}>
              <Text style={styles.overviewLabel}>Training Max %</Text>
              <Text style={styles.overviewValue}>
                {plan.tm_percentage || 90}%
              </Text>
            </View>
            <View style={styles.overviewRow}>
              <Text style={styles.overviewLabel}>Aktuelle Woche</Text>
              <Text style={styles.overviewValue}>
                Woche {plan.current_week || 1}
              </Text>
            </View>
            <View style={styles.overviewRow}>
              <Text style={styles.overviewLabel}>Start</Text>
              <Text style={styles.overviewValue}>
                {new Date(plan.start_date).toLocaleDateString("de-DE")}
              </Text>
            </View>
          </View>
        </Card>

        {/* Update 1RM Button */}
        <Button
          onPress={handleUpdateOneRM}
          variant="secondary"
          style={styles.updateButton}
        >
          1RM aktualisieren
        </Button>

        {/* Exercises List */}
        <View style={styles.exercisesSection}>
          <Text style={styles.sectionTitle}>Übungen & Progression</Text>

          {exerciseProgress.length === 0 ? (
            <Card padding="medium">
              <Text style={styles.emptyText}>
                Keine Übungsdaten verfügbar
              </Text>
            </Card>
          ) : (
            exerciseProgress.map((exercise, index) => (
              <Card key={`${exercise.exercise_id}-${index}`} padding="medium">
                <View style={styles.exerciseCard}>
                  {/* Exercise Name */}
                  <Text style={styles.exerciseName}>
                    {exercise.exercise_name_de}
                  </Text>

                  {/* Initial 1RM */}
                  <View style={styles.exerciseRow}>
                    <Text style={styles.exerciseLabel}>Initial 1RM:</Text>
                    <Text style={styles.exerciseValue}>
                      {exercise.initial_1rm} kg
                      {exercise.is_estimated && (
                        <Text style={styles.estimatedBadge}> (geschätzt)</Text>
                      )}
                    </Text>
                  </View>

                  {/* Initial Date */}
                  <View style={styles.exerciseRow}>
                    <Text style={styles.exerciseLabel}>Datum:</Text>
                    <Text style={styles.exerciseValueSecondary}>
                      {new Date(exercise.initial_date).toLocaleDateString(
                        "de-DE"
                      )}
                    </Text>
                  </View>

                  {/* Current TM */}
                  <View style={styles.exerciseRow}>
                    <Text style={styles.exerciseLabel}>Aktueller TM:</Text>
                    <Text style={styles.exerciseValueHighlight}>
                      {exercise.current_tm} kg
                    </Text>
                  </View>

                  {/* Progression Summary */}
                  {exercise.progression.length > 0 && (
                    <View style={styles.progressionSection}>
                      <Text style={styles.progressionTitle}>
                        Progression ({exercise.progression.length} Wochen)
                      </Text>

                      {exercise.progression.map((week) => (
                        <View
                          key={week.week_number}
                          style={styles.progressionRow}
                        >
                          <Text style={styles.progressionWeek}>
                            W{week.week_number}
                          </Text>
                          <Text style={styles.progressionValue}>
                            {week.tm_value} kg
                          </Text>
                          {week.increment_applied !== null &&
                            week.increment_applied !== 0 && (
                              <Text style={styles.progressionIncrement}>
                                +{week.increment_applied} kg
                              </Text>
                            )}
                        </View>
                      ))}
                    </View>
                  )}
                </View>
              </Card>
            ))
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: SPACING.md,
  },
  loadingText: {
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: SPACING.xl,
    gap: SPACING.md,
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: "center",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.md,
    gap: SPACING.md,
  },
  header: {
    gap: SPACING.xs,
    marginBottom: SPACING.sm,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: COLORS.text,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  overviewCard: {
    gap: SPACING.md,
  },
  overviewRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  overviewLabel: {
    fontSize: 16,
    color: "#fff",
    opacity: 0.9,
  },
  overviewValue: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
  updateButton: {
    marginVertical: SPACING.sm,
  },
  exercisesSection: {
    gap: SPACING.md,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: COLORS.text,
  },
  exerciseCard: {
    gap: SPACING.sm,
  },
  exerciseName: {
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  exerciseRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  exerciseLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  exerciseValue: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.text,
  },
  exerciseValueSecondary: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  exerciseValueHighlight: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.primary,
  },
  estimatedBadge: {
    fontSize: 12,
    color: COLORS.warning,
    fontStyle: "italic",
  },
  progressionSection: {
    marginTop: SPACING.md,
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    gap: SPACING.sm,
  },
  progressionTitle: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  progressionRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
    paddingVertical: SPACING.xs,
  },
  progressionWeek: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.text,
    width: 40,
  },
  progressionValue: {
    fontSize: 14,
    color: COLORS.text,
    flex: 1,
  },
  progressionIncrement: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.success,
    backgroundColor: `${COLORS.success}20`,
    paddingHorizontal: SPACING.sm,
    paddingVertical: SPACING.xs,
    borderRadius: 4,
  },
});
