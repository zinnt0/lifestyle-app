/**
 * Training Plan Detail Screen
 *
 * Displays detailed information about a training plan including:
 * - Next scheduled workout
 * - Upcoming workouts
 * - Plan details and specifications
 */

import React, { useState, useCallback } from "react";
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useFocusEffect } from "@react-navigation/native";
import { TrainingStackParamList } from "@/navigation/types";
import { trainingService } from "@/services/trainingService";
import {
  TrainingPlanDetails,
  PlanWorkout,
  WorkoutSession,
} from "@/types/training.types";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { PausedSessionCard } from "@/components/training/PausedSessionCard";
import * as Haptics from "expo-haptics";
import { supabase } from "@/lib/supabase";
import { getProfile } from "@/services/profile.service";

// Design System Constants
const COLORS = {
  primary: "#3b82f6",
  secondary: "#7B68EE",
  success: "#34C759",
  background: "#F8F9FA",
  cardBg: "#FFFFFF",
  text: "#333333",
  textSecondary: "#666666",
  gradientStart: "#3b82f6",
  gradientEnd: "#3b82f6",
};

const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

const FONTS = {
  h1: {
    fontSize: 28,
    fontWeight: "700" as const,
    color: COLORS.text,
  },
  h2: {
    fontSize: 20,
    fontWeight: "600" as const,
    color: COLORS.text,
  },
  h3: {
    fontSize: 18,
    fontWeight: "600" as const,
    color: COLORS.text,
  },
  body: {
    fontSize: 16,
    fontWeight: "400" as const,
    color: COLORS.text,
  },
  caption: {
    fontSize: 14,
    fontWeight: "400" as const,
    color: COLORS.textSecondary,
  },
};

type Props = NativeStackScreenProps<
  TrainingStackParamList,
  "TrainingPlanDetail"
>;

export const TrainingPlanDetailScreen: React.FC<Props> = ({
  route,
  navigation,
}) => {
  const { planId } = route.params;

  // State
  const [plan, setPlan] = useState<TrainingPlanDetails | null>(null);
  const [nextWorkout, setNextWorkout] = useState<PlanWorkout | null>(null);
  const [pausedSession, setPausedSession] = useState<WorkoutSession | null>(
    null
  );
  const [upcomingWorkouts, setUpcomingWorkouts] = useState<PlanWorkout[]>([]);
  const [preferredDays, setPreferredDays] = useState<number[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Load plan details, next workout, and upcoming workouts
   */
  const loadPlanDetails = useCallback(async () => {
    try {
      setError(null);

      // Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setError("Benutzer nicht authentifiziert");
        return;
      }

      // Load plan details with workouts
      let planDetails = await trainingService.getTrainingPlanDetails(planId);

      // Update current week only for template-based plans (not custom plans)
      // Custom plans track weeks based on completed workouts, not dates
      if (planDetails.start_date && planDetails.plan_type !== "custom") {
        const { error: updateError } = await supabase.rpc(
          "update_plan_current_week",
          {
            p_plan_id: planId,
          }
        );

        if (!updateError) {
          // Reload plan to get updated current_week
          planDetails = await trainingService.getTrainingPlanDetails(planId);
        } else {
          console.error(
            "Fehler beim Aktualisieren der aktuellen Woche:",
            updateError
          );
        }
      }

      setPlan(planDetails);

      // Check for paused session for this plan
      const paused = await trainingService.getPausedSession(user.id);
      // Only show paused session if it belongs to this plan
      if (paused && paused.plan_id === planId) {
        setPausedSession(paused);
      } else {
        setPausedSession(null);
      }

      // Determine next workout based on last completed session
      const nextWorkoutData = await trainingService.getNextWorkout(user.id);
      if (nextWorkoutData && nextWorkoutData.plan.id === planId) {
        setNextWorkout(nextWorkoutData.workout);
      } else if (planDetails.workouts && planDetails.workouts.length > 0) {
        // Fallback: if no next workout found or plan doesn't match, use first workout
        setNextWorkout(planDetails.workouts[0]);
      }

      // Load upcoming workouts (next 5)
      const upcoming = await trainingService.getUpcomingWorkouts(
        user.id,
        planId,
        5
      );
      setUpcomingWorkouts(upcoming);

      // Load user's preferred training days
      const { profile } = await getProfile(user.id);
      if (profile?.preferred_training_days) {
        setPreferredDays(profile.preferred_training_days);
      }
    } catch (err) {
      console.error("Error loading plan details:", err);
      setError(
        err instanceof Error ? err.message : "Fehler beim Laden der Plandetails"
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [planId]);

  /**
   * Load plan details when screen is focused
   */
  useFocusEffect(
    useCallback(() => {
      loadPlanDetails();
    }, [loadPlanDetails])
  );

  /**
   * Pull to refresh handler
   */
  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    loadPlanDetails();
  }, [loadPlanDetails]);

  /**
   * Start workout session
   */
  const handleStartWorkout = async () => {
    if (!nextWorkout || !plan) return;

    try {
      // Get user ID from plan
      const userId = plan.user_id;

      // Start workout session
      const sessionId = await trainingService.startWorkoutSession(
        userId,
        planId,
        nextWorkout.id
      );

      // Navigate to workout session screen
      navigation.navigate("WorkoutSession", { sessionId });
    } catch (err) {
      console.error("Error starting workout:", err);
      Alert.alert(
        "Fehler",
        err instanceof Error
          ? err.message
          : "Workout konnte nicht gestartet werden"
      );
    }
  };

  /**
   * Handle resuming a paused workout session
   */
  const handleResumeSession = useCallback(async () => {
    if (!pausedSession) return;

    try {
      await trainingService.resumeWorkoutSession(pausedSession.id);
      navigation.navigate("WorkoutSession", { sessionId: pausedSession.id });
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.error("Error resuming session:", error);
      Alert.alert("Fehler", "Session konnte nicht fortgesetzt werden");
    }
  }, [pausedSession, navigation]);

  /**
   * Handle canceling a paused workout session
   */
  const handleCancelSession = useCallback(async () => {
    if (!pausedSession) return;

    try {
      await trainingService.cancelWorkoutSession(pausedSession.id);
      await loadPlanDetails();
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      console.error("Error canceling session:", error);
      Alert.alert("Fehler", "Session konnte nicht abgebrochen werden");
    }
  }, [pausedSession, loadPlanDetails]);

  /**
   * Render loading state
   */
  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Lade Trainingsplan...</Text>
        </View>
      </SafeAreaView>
    );
  }

  /**
   * Render error state
   */
  if (error || !plan) {
    return (
      <SafeAreaView style={styles.container} edges={["top"]}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>
            {error || "Trainingsplan nicht gefunden"}
          </Text>
          <Button
            onPress={() => navigation.goBack()}
            variant="outline"
            style={{ marginTop: SPACING.lg }}
          >
            Zurück
          </Button>
        </View>
      </SafeAreaView>
    );
  }

  /**
   * Calculate current week and total weeks
   */
  const currentWeek = plan.current_week || 1;
  const totalWeeks = plan.total_weeks || plan.duration_weeks || null;
  const progressPercentage = totalWeeks ? (currentWeek / totalWeeks) * 100 : 0;

  return (
    <SafeAreaView style={styles.container} edges={[]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.planName}>{plan.name}</Text>
          <Text style={styles.planInfo}>
            {plan.days_per_week} Tage pro Woche • Woche {currentWeek}
            {totalWeeks ? `/${totalWeeks}` : ""}
          </Text>

          {/* Progress Bar - only show if plan has duration */}
          {totalWeeks && (
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <View
                  style={[
                    styles.progressFill,
                    { width: `${progressPercentage}%` },
                  ]}
                />
              </View>
              <Text style={styles.progressText}>
                {Math.round(progressPercentage)}%
              </Text>
            </View>
          )}
        </View>

        {/* Paused or Next Workout Section */}
        {pausedSession ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>UNTERBROCHENES WORKOUT</Text>
            <PausedSessionCard
              session={pausedSession}
              onResume={handleResumeSession}
              onCancel={handleCancelSession}
            />
          </View>
        ) : nextWorkout ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>NÄCHSTES WORKOUT</Text>
            <NextWorkoutCard
              workout={nextWorkout}
              onStart={handleStartWorkout}
            />
          </View>
        ) : null}

        {/* Upcoming Workouts Section */}
        {upcomingWorkouts.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>KOMMENDE WORKOUTS</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.upcomingScrollView}
            >
              {upcomingWorkouts.map((workout, index) => (
                <UpcomingWorkoutCard
                  key={workout.id}
                  workout={workout}
                  workoutIndex={index}
                  preferredDays={preferredDays}
                  onPress={() => {
                    // Could navigate to workout preview in future
                  }}
                />
              ))}
            </ScrollView>
          </View>
        )}

        {/* Plan Details Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>PLAN-DETAILS</Text>

          {/* Overview Cards Grid */}
          <View style={styles.statsGrid}>
            <View style={styles.statCard}>
              <Text style={styles.statIcon}>🎯</Text>
              <Text style={styles.statLabel}>Hauptziel</Text>
              <Text style={styles.statValue}>
                {plan.primary_goal === "strength"
                  ? "Kraft"
                  : plan.primary_goal === "hypertrophy"
                  ? "Muskelaufbau"
                  : plan.primary_goal === "endurance"
                  ? "Ausdauer"
                  : "Allgemein"}
              </Text>
            </View>

            <View style={styles.statCard}>
              <Text style={styles.statIcon}>📊</Text>
              <Text style={styles.statLabel}>Fitness-Level</Text>
              <Text style={styles.statValue}>
                {plan.fitness_level === "beginner"
                  ? "Anfänger"
                  : plan.fitness_level === "intermediate"
                  ? "Fortgeschritten"
                  : "Expert"}
              </Text>
            </View>

            <View style={styles.statCard}>
              <Text style={styles.statIcon}>📅</Text>
              <Text style={styles.statLabel}>Dauer</Text>
              <Text style={styles.statValue}>
                {plan.total_weeks || plan.duration_weeks || 12} Wochen
              </Text>
            </View>

            <View style={styles.statCard}>
              <Text style={styles.statIcon}>💪</Text>
              <Text style={styles.statLabel}>Workouts</Text>
              <Text style={styles.statValue}>{plan.workouts.length}</Text>
            </View>
          </View>

          {/* Training Information Card */}
          <Card padding="medium" elevation="small" style={styles.infoCard}>
            <Text style={styles.cardTitle}>Training</Text>

            <View style={styles.infoItem}>
              <View style={styles.infoIconContainer}>
                <Text style={styles.infoItemIcon}>🔄</Text>
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoItemLabel}>Progression</Text>
                <Text style={styles.infoItemValue}>
                  {plan.template?.progression_type === "linear"
                    ? "Linear"
                    : plan.template?.progression_type === "double"
                    ? "Doppelt"
                    : plan.template?.progression_type === "undulating"
                    ? "Wellenförmig"
                    : plan.template?.progression_type === "block"
                    ? "Block"
                    : plan.template?.progression_type || "Standard"}
                </Text>
              </View>
            </View>

            <View style={styles.infoItem}>
              <View style={styles.infoIconContainer}>
                <Text style={styles.infoItemIcon}>🏋️</Text>
              </View>
              <View style={styles.infoContent}>
                <Text style={styles.infoItemLabel}>Trainingstyp</Text>
                <Text style={styles.infoItemValue}>{plan.plan_type}</Text>
              </View>
            </View>

            {plan.template?.is_dynamic && (
              <View style={styles.dynamicBadge}>
                <Text style={styles.dynamicBadgeIcon}>⚡</Text>
                <View style={{ flex: 1 }}>
                  <Text style={styles.dynamicBadgeTitle}>Dynamischer Plan</Text>
                  <Text style={styles.dynamicBadgeText}>
                    Gewichte werden automatisch basierend auf deinem 1RM
                    berechnet
                    {plan.tm_percentage &&
                      ` (${plan.tm_percentage}% Training Max)`}
                  </Text>
                </View>
              </View>
            )}
          </Card>

          {/* Timeline Card */}
          {(plan.start_date || plan.end_date) && (
            <Card padding="medium" elevation="small" style={styles.infoCard}>
              <Text style={styles.cardTitle}>Zeitplan</Text>

              {plan.start_date && (
                <View style={styles.infoItem}>
                  <View style={styles.infoIconContainer}>
                    <Text style={styles.infoItemIcon}>🚀</Text>
                  </View>
                  <View style={styles.infoContent}>
                    <Text style={styles.infoItemLabel}>Startdatum</Text>
                    <Text style={styles.infoItemValue}>
                      {new Date(plan.start_date).toLocaleDateString("de-DE", {
                        day: "2-digit",
                        month: "long",
                        year: "numeric",
                      })}
                    </Text>
                  </View>
                </View>
              )}

              {plan.end_date && (
                <View style={styles.infoItem}>
                  <View style={styles.infoIconContainer}>
                    <Text style={styles.infoItemIcon}>🏁</Text>
                  </View>
                  <View style={styles.infoContent}>
                    <Text style={styles.infoItemLabel}>Enddatum</Text>
                    <Text style={styles.infoItemValue}>
                      {new Date(plan.end_date).toLocaleDateString("de-DE", {
                        day: "2-digit",
                        month: "long",
                        year: "numeric",
                      })}
                    </Text>
                  </View>
                </View>
              )}
            </Card>
          )}

          {/* Equipment Card */}
          {plan.template?.requires_equipment &&
            plan.template.requires_equipment.length > 0 && (
              <Card padding="medium" elevation="small" style={styles.infoCard}>
                <Text style={styles.cardTitle}>Equipment</Text>
                <View style={styles.equipmentContainer}>
                  {plan.template.requires_equipment.map((equipment, index) => (
                    <View key={index} style={styles.equipmentChip}>
                      <Text style={styles.equipmentText}>{equipment}</Text>
                    </View>
                  ))}
                </View>
              </Card>
            )}

          {/* Description Card */}
          {plan.template?.description_de && (
            <Card padding="medium" elevation="small" style={styles.infoCard}>
              <Text style={styles.cardTitle}>Über diesen Plan</Text>
              <Text style={styles.descriptionText}>
                {plan.template.description_de}
              </Text>
            </Card>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

/**
 * Next Workout Card Component
 * Large prominent card for the upcoming workout
 */
interface NextWorkoutCardProps {
  workout: PlanWorkout;
  onStart: () => void;
}

const NextWorkoutCard: React.FC<NextWorkoutCardProps> = ({
  workout,
  onStart,
}) => {
  const exerciseCount = workout.exercises?.length || 0;
  const estimatedDuration = workout.estimated_duration || 60;

  return (
    <Card
      gradient
      gradientColors={[COLORS.gradientStart, COLORS.gradientEnd]}
      padding="large"
      elevation="medium"
    >
      <Text style={styles.nextWorkoutName}>{workout.name}</Text>
      <Text style={styles.nextWorkoutInfo}>
        {exerciseCount} Übungen • ~{estimatedDuration} min
      </Text>

      {workout.focus && (
        <View style={styles.focusContainer}>
          <Text style={styles.focusLabel}>Fokus:</Text>
          <Text style={styles.focusValue}>{workout.focus}</Text>
        </View>
      )}

      <Button
        onPress={onStart}
        variant="secondary"
        size="large"
        style={styles.startButton}
      >
        ▶ Workout starten
      </Button>
    </Card>
  );
};

/**
 * Upcoming Workout Card Component
 * Smaller card for upcoming workouts in horizontal scroll
 */
interface UpcomingWorkoutCardProps {
  workout: PlanWorkout;
  workoutIndex: number;
  preferredDays: number[] | null;
  onPress: () => void;
}

/**
 * Calculate the next scheduled date for a workout
 * based on the workout's day_number and preferred training days
 */
const getNextWorkoutDate = (
  workout: PlanWorkout,
  workoutIndex: number,
  preferredDays: number[] | null
): Date => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Convert day_number (1-7, where 1=Monday) to JavaScript day of week (0-6, where 0=Sunday)
  // day_number: 1=Monday, 2=Tuesday, 3=Wednesday, 4=Thursday, 5=Friday, 6=Saturday, 7=Sunday
  // JS getDay(): 0=Sunday, 1=Monday, 2=Tuesday, 3=Wednesday, 4=Thursday, 5=Friday, 6=Saturday
  const targetDayOfWeek = workout.day_number === 7 ? 0 : workout.day_number;

  // If no preferred days, find the next occurrence of the target day
  if (!preferredDays || preferredDays.length === 0) {
    return getNextDateForDayOfWeek(today, targetDayOfWeek, workoutIndex);
  }

  // Check if the workout's day is in the preferred days
  if (!preferredDays.includes(targetDayOfWeek)) {
    // If the workout day is not a preferred day, fall back to finding the next occurrence
    return getNextDateForDayOfWeek(today, targetDayOfWeek, workoutIndex);
  }

  // Find the next occurrence of this specific day of week
  return getNextDateForDayOfWeek(today, targetDayOfWeek, workoutIndex);
};

/**
 * Helper function to find the next occurrence(s) of a specific day of week
 * @param fromDate - Starting date
 * @param targetDayOfWeek - Target day (0 = Sunday, 1 = Monday, etc.)
 * @param occurrenceIndex - Which occurrence to return (0 = first, 1 = second, etc.)
 */
const getNextDateForDayOfWeek = (
  fromDate: Date,
  targetDayOfWeek: number,
  occurrenceIndex: number
): Date => {
  let occurrencesFound = 0;
  let daysChecked = 1; // Start from tomorrow
  const maxDaysToCheck = 60; // Look ahead up to 60 days

  while (daysChecked <= maxDaysToCheck) {
    const checkDate = new Date(fromDate);
    checkDate.setDate(fromDate.getDate() + daysChecked);

    if (checkDate.getDay() === targetDayOfWeek) {
      if (occurrencesFound === occurrenceIndex) {
        return checkDate;
      }
      occurrencesFound++;
    }

    daysChecked++;
  }

  // Fallback: simple offset from today
  const fallbackDate = new Date(fromDate);
  fallbackDate.setDate(fromDate.getDate() + occurrenceIndex + 1);
  return fallbackDate;
};

const UpcomingWorkoutCard: React.FC<UpcomingWorkoutCardProps> = ({
  workout,
  workoutIndex,
  preferredDays,
  onPress,
}) => {
  const date = getNextWorkoutDate(workout, workoutIndex, preferredDays);
  const dayName = date.toLocaleDateString("de-DE", { weekday: "short" });
  const dateStr = date.toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit",
  });

  return (
    <Card
      padding="large"
      elevation="small"
      style={styles.upcomingCard}
      onPress={onPress}
    >
      <Text style={styles.upcomingWorkoutName}>{workout.name}</Text>
      <Text style={styles.upcomingWorkoutDate}>
        {dayName} {dateStr}
      </Text>
      <Text style={styles.upcomingWorkoutInfo}>
        {workout.exercises?.length || 0} Übungen
      </Text>
    </Card>
  );
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
    flexGrow: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: SPACING.xl,
  },
  loadingText: {
    ...FONTS.body,
    marginTop: SPACING.md,
    color: COLORS.textSecondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: SPACING.xl,
  },
  errorText: {
    ...FONTS.body,
    color: COLORS.textSecondary,
    textAlign: "center",
  },
  header: {
    padding: SPACING.lg,
    paddingTop: SPACING.lg,
    backgroundColor: COLORS.cardBg,
    borderBottomWidth: 1,
    borderBottomColor: "#E5E5EA",
  },
  planName: {
    ...FONTS.h1,
    marginBottom: SPACING.xs,
  },
  planInfo: {
    ...FONTS.caption,
    marginBottom: SPACING.md,
  },
  progressContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.md,
  },
  progressBar: {
    flex: 1,
    height: 8,
    backgroundColor: "#E5E5EA",
    borderRadius: 4,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    backgroundColor: COLORS.primary,
  },
  progressText: {
    ...FONTS.caption,
    fontWeight: "600",
    minWidth: 45,
    textAlign: "right",
  },
  section: {
    padding: SPACING.lg,
  },
  sectionTitle: {
    ...FONTS.caption,
    fontWeight: "700",
    letterSpacing: 0.5,
    marginBottom: SPACING.md,
    color: COLORS.textSecondary,
  },
  // Next Workout Card Styles
  nextWorkoutName: {
    fontSize: 24,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: SPACING.xs,
  },
  nextWorkoutInfo: {
    fontSize: 16,
    color: "#FFFFFF",
    opacity: 0.9,
    marginBottom: SPACING.md,
  },
  focusContainer: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    padding: SPACING.md,
    borderRadius: 8,
    marginBottom: SPACING.lg,
  },
  focusLabel: {
    fontSize: 14,
    color: "#FFFFFF",
    opacity: 0.8,
    marginBottom: SPACING.xs,
  },
  focusValue: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  startButton: {
    marginTop: SPACING.md,
  },
  // Upcoming Workouts Styles
  upcomingScrollView: {
    marginHorizontal: -SPACING.lg,
    paddingHorizontal: SPACING.lg,
    overflow: "visible",
  },
  upcomingCard: {
    width: 140,
    marginRight: SPACING.md,
    backgroundColor: COLORS.cardBg,
    borderWidth: 1,
    borderColor: "rgba(59, 130, 246, 0.8)",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  upcomingWorkoutName: {
    ...FONTS.h3,
    fontSize: 16,
    marginBottom: SPACING.xs,
  },
  upcomingWorkoutDate: {
    ...FONTS.caption,
    marginBottom: SPACING.sm,
  },
  upcomingWorkoutInfo: {
    ...FONTS.caption,
    fontSize: 12,
  },
  // Plan Details Styles - Stats Grid
  statsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: SPACING.md,
    marginBottom: SPACING.md,
  },
  statCard: {
    flex: 1,
    minWidth: "45%",
    backgroundColor: COLORS.cardBg,
    padding: SPACING.lg,
    borderRadius: 12,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  statIcon: {
    fontSize: 32,
    marginBottom: SPACING.sm,
  },
  statLabel: {
    ...FONTS.caption,
    fontSize: 12,
    textAlign: "center",
    marginBottom: SPACING.xs,
  },
  statValue: {
    ...FONTS.h3,
    fontSize: 16,
    textAlign: "center",
  },
  // Info Cards
  infoCard: {
    marginBottom: SPACING.md,
  },
  cardTitle: {
    ...FONTS.h3,
    fontSize: 16,
    marginBottom: SPACING.md,
    color: COLORS.text,
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginBottom: SPACING.md,
  },
  infoIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "#F5F5F5",
    alignItems: "center",
    justifyContent: "center",
    marginRight: SPACING.md,
  },
  infoItemIcon: {
    fontSize: 20,
  },
  infoContent: {
    flex: 1,
  },
  infoItemLabel: {
    ...FONTS.caption,
    fontSize: 12,
    marginBottom: SPACING.xs / 2,
  },
  infoItemValue: {
    ...FONTS.body,
    fontWeight: "600",
    fontSize: 15,
  },
  // Dynamic Badge
  dynamicBadge: {
    flexDirection: "row",
    backgroundColor: "#E3F2FD",
    padding: SPACING.md,
    borderRadius: 12,
    marginTop: SPACING.sm,
    alignItems: "flex-start",
  },
  dynamicBadgeIcon: {
    fontSize: 24,
    marginRight: SPACING.md,
  },
  dynamicBadgeTitle: {
    ...FONTS.body,
    fontWeight: "700",
    fontSize: 15,
    marginBottom: SPACING.xs / 2,
    color: "#3b82f6",
  },
  dynamicBadgeText: {
    ...FONTS.caption,
    fontSize: 13,
    lineHeight: 18,
  },
  // Equipment Chips
  equipmentContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: SPACING.sm,
  },
  equipmentChip: {
    backgroundColor: "#F5F5F5",
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  equipmentText: {
    ...FONTS.caption,
    fontSize: 13,
    fontWeight: "500",
  },
  // Description
  descriptionText: {
    ...FONTS.body,
    fontSize: 14,
    lineHeight: 22,
    color: COLORS.text,
  },
});
