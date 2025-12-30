/**
 * Training Plan Detail Screen
 *
 * Displays detailed information about a training plan including:
 * - Next scheduled workout
 * - Upcoming workouts
 * - Plan details and specifications
 */

import React, { useState, useEffect, useCallback } from "react";
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
import { TrainingStackParamList } from "@/navigation/types";
import { trainingService } from "@/services/trainingService";
import {
  TrainingPlanDetails,
  NextWorkout,
  PlanWorkout,
  WorkoutSession,
} from "@/types/training.types";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { PausedSessionCard } from "@/components/training/PausedSessionCard";
import * as Haptics from "expo-haptics";
import { supabase } from "@/lib/supabase";

// Design System Constants
const COLORS = {
  primary: "#4A90E2",
  secondary: "#7B68EE",
  success: "#34C759",
  background: "#F5F5F5",
  cardBg: "#FFFFFF",
  text: "#333333",
  textSecondary: "#666666",
  gradientStart: "#4A90E2",
  gradientEnd: "#7B68EE",
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
  const [pausedSession, setPausedSession] = useState<WorkoutSession | null>(null);
  const [upcomingWorkouts, setUpcomingWorkouts] = useState<PlanWorkout[]>([]);
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
      const planDetails = await trainingService.getTrainingPlanDetails(planId);
      setPlan(planDetails);

      // Check for paused session for this plan
      const paused = await trainingService.getPausedSession(user.id);
      // Only show paused session if it belongs to this plan
      if (paused && paused.plan_id === planId) {
        setPausedSession(paused);
      } else {
        setPausedSession(null);
      }

      // Determine next workout
      // For now, we'll use the first workout from the plan
      // In a more sophisticated implementation, this would check last completed session
      if (planDetails.workouts && planDetails.workouts.length > 0) {
        setNextWorkout(planDetails.workouts[0]);
      }

      // Load upcoming workouts (next 5)
      const upcoming = await trainingService.getUpcomingWorkouts(planId, 5);
      setUpcomingWorkouts(upcoming);
    } catch (err) {
      console.error("Error loading plan details:", err);
      setError(
        err instanceof Error
          ? err.message
          : "Fehler beim Laden der Plandetails"
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [planId]);

  /**
   * Initial load
   */
  useEffect(() => {
    loadPlanDetails();
  }, [loadPlanDetails]);

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
  const totalWeeks = plan.total_weeks || 12;
  const progressPercentage = (currentWeek / totalWeeks) * 100;

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <ScrollView
        style={styles.scrollView}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.planName}>{plan.name}</Text>
          <Text style={styles.planInfo}>
            {plan.days_per_week} Tage pro Woche • Woche {currentWeek}/{totalWeeks}
          </Text>

          {/* Progress Bar */}
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
                  dayOffset={index}
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
          <Card padding="medium" elevation="small">
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Trainingstyp:</Text>
              <Text style={styles.detailValue}>{plan.plan_type}</Text>
            </View>
            {plan.template?.progression_type && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Progression:</Text>
                <Text style={styles.detailValue}>
                  {plan.template.progression_type}
                </Text>
              </View>
            )}
            {plan.template?.requirements && (
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Equipment:</Text>
                <Text style={styles.detailValue}>
                  {plan.template.requirements}
                </Text>
              </View>
            )}
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Workouts gesamt:</Text>
              <Text style={styles.detailValue}>{plan.workouts.length}</Text>
            </View>
          </Card>
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
        variant="primary"
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
  dayOffset: number;
  onPress: () => void;
}

const UpcomingWorkoutCard: React.FC<UpcomingWorkoutCardProps> = ({
  workout,
  dayOffset,
  onPress,
}) => {
  // Calculate date (simplified - would use actual scheduling logic)
  const date = new Date();
  date.setDate(date.getDate() + dayOffset + 1);
  const dayName = date.toLocaleDateString("de-DE", { weekday: "short" });
  const dateStr = date.toLocaleDateString("de-DE", {
    day: "2-digit",
    month: "2-digit",
  });

  return (
    <Card
      padding="medium"
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
    backgroundColor: "#FFFFFF",
    marginTop: SPACING.md,
  },
  // Upcoming Workouts Styles
  upcomingScrollView: {
    marginHorizontal: -SPACING.lg,
    paddingHorizontal: SPACING.lg,
  },
  upcomingCard: {
    width: 140,
    marginRight: SPACING.md,
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
  // Plan Details Styles
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: "#F0F0F0",
  },
  detailLabel: {
    ...FONTS.body,
    color: COLORS.textSecondary,
  },
  detailValue: {
    ...FONTS.body,
    fontWeight: "600",
    textAlign: "right",
    flex: 1,
    marginLeft: SPACING.md,
  },
});
