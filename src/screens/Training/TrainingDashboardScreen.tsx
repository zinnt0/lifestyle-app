/**
 * Training Dashboard Screen
 *
 * Main screen for training section showing:
 * - Active training plan with progress
 * - Inactive training plans with toggle
 * - Create new plan button
 */

import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { supabase } from "@/lib/supabase";
import { trainingService } from "@/services/trainingService";
import { localWorkoutHistoryCache } from "@/services/cache/LocalWorkoutHistoryCache";
import { useTrainingNavigation } from "@/hooks/useTrainingNavigation";
import { ActivePlanCard } from "@/components/training/ActivePlanCard";
import { InactivePlanCard } from "@/components/training/InactivePlanCard";
import { AppHeader } from "@/components/ui/AppHeader";
import { PastWorkoutsModal } from "@/components/training/PastWorkoutsModal";
import type { TrainingPlan, TrainingPlanDetails, WorkoutSession } from "@/types/training.types";

/**
 * TrainingDashboardScreen Component
 *
 * Displays all training plans with the ability to:
 * - View active plan with progress
 * - Toggle between plans
 * - Create new plans
 */
export const TrainingDashboardScreen: React.FC = () => {
  const navigation = useTrainingNavigation();

  // State Management
  const [activePlan, setActivePlan] = useState<TrainingPlanDetails | null>(
    null
  );
  const [inactivePlans, setInactivePlans] = useState<TrainingPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Past Workouts Modal State
  const [pastWorkoutsModalVisible, setPastWorkoutsModalVisible] = useState(false);
  const [pastWorkoutsSessions, setPastWorkoutsSessions] = useState<WorkoutSession[]>([]);
  const [pastWorkoutsLoading, setPastWorkoutsLoading] = useState(false);

  /**
   * Load all training plans and separate active/inactive
   */
  const loadPlans = useCallback(async () => {
    try {
      // Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        Alert.alert(
          "Fehler",
          "Du musst angemeldet sein, um Trainingspläne zu sehen."
        );
        return;
      }

      // Fetch all plans
      const plans = await trainingService.getTrainingPlans(user.id);

      // Separate active and inactive plans
      const active = plans.find((plan) => plan.status === "active");
      const inactive = plans.filter((plan) => plan.status !== "active");

      // If there's an active plan, fetch its details
      if (active) {
        const details = await trainingService.getTrainingPlanDetails(active.id);
        setActivePlan(details);
      } else {
        setActivePlan(null);
      }

      setInactivePlans(inactive);

      // Load historical workout data if not already cached
      loadHistoricalDataIfNeeded(user.id);
    } catch (error) {
      console.error("Fehler beim Laden der Trainingspläne:", error);
      Alert.alert(
        "Fehler",
        "Trainingspläne konnten nicht geladen werden. Bitte versuche es erneut."
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  /**
   * Load historical workout data in background (once per app session)
   */
  const loadHistoricalDataIfNeeded = useCallback(async (userId: string) => {
    try {
      const hasData = await localWorkoutHistoryCache.hasHistoricalData(userId);

      if (!hasData) {
        console.log("[TrainingDashboard] Loading historical workout data...");
        const cachedCount = await localWorkoutHistoryCache.loadHistoricalData(
          userId,
          12
        );
        console.log(
          `[TrainingDashboard] Cached ${cachedCount} historical sessions`
        );
      }
    } catch (error) {
      console.error(
        "[TrainingDashboard] Failed to load historical data:",
        error
      );
      // Don't show error to user, this is background operation
    }
  }, []);

  /**
   * Handle pull-to-refresh
   */
  const handleRefresh = useCallback(() => {
    setRefreshing(true);
    loadPlans();
  }, [loadPlans]);

  /**
   * Handle toggling a plan to active
   * - Triggers haptic feedback
   * - Updates backend
   * - Reloads plans
   */
  const handleTogglePlan = useCallback(
    async (planId: string) => {
      try {
        // Haptic feedback
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

        // Get current user
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          Alert.alert("Fehler", "Du musst angemeldet sein.");
          return;
        }

        // Set as active plan
        await trainingService.setActivePlan(user.id, planId);

        // Reload plans
        await loadPlans();

        // Success feedback
        await Haptics.notificationAsync(
          Haptics.NotificationFeedbackType.Success
        );
      } catch (error) {
        console.error("Fehler beim Aktivieren des Plans:", error);
        Alert.alert(
          "Fehler",
          "Plan konnte nicht aktiviert werden. Bitte versuche es erneut."
        );
      }
    },
    [loadPlans]
  );

  /**
   * Navigate to plan details
   */
  const handleNavigateToPlan = useCallback(
    (planId: string) => {
      navigation.navigate("TrainingPlanDetail", { planId });
    },
    [navigation]
  );

  /**
   * Navigate to plan configuration
   */
  const handleCreateNewPlan = useCallback(() => {
    navigation.navigate("PlanConfiguration");
  }, [navigation]);

  /**
   * Navigate to workout history
   */
  const handleNavigateToHistory = useCallback(() => {
    navigation.navigate("WorkoutHistory");
  }, [navigation]);

  /**
   * Open past workouts modal and load sessions
   */
  const handleOpenPastWorkoutsModal = useCallback(async () => {
    try {
      setPastWorkoutsModalVisible(true);
      setPastWorkoutsLoading(true);

      // Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        Alert.alert("Fehler", "Du musst angemeldet sein.");
        return;
      }

      // Load past workout sessions
      const sessions = await trainingService.getCompletedSessions(user.id, 50);
      setPastWorkoutsSessions(sessions);
    } catch (error) {
      console.error("Fehler beim Laden der vergangenen Workouts:", error);
      Alert.alert(
        "Fehler",
        "Vergangene Workouts konnten nicht geladen werden."
      );
    } finally {
      setPastWorkoutsLoading(false);
    }
  }, []);

  /**
   * Close past workouts modal
   */
  const handleClosePastWorkoutsModal = useCallback(() => {
    setPastWorkoutsModalVisible(false);
  }, []);

  /**
   * Handle deleting a training plan
   * - Shows confirmation dialog
   * - Deletes plan from backend
   * - Reloads plans
   */
  const handleDeletePlan = useCallback(
    async (planId: string) => {
      try {
        // Haptic feedback
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

        // Get current user
        const {
          data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
          Alert.alert("Fehler", "Du musst angemeldet sein.");
          return;
        }

        // Delete the plan
        await trainingService.deletePlan(planId);

        // Reload plans
        await loadPlans();

        // Success feedback
        await Haptics.notificationAsync(
          Haptics.NotificationFeedbackType.Success
        );

        Alert.alert("Erfolg", "Plan wurde gelöscht.");
      } catch (error) {
        console.error("Fehler beim Löschen des Plans:", error);
        Alert.alert(
          "Fehler",
          "Plan konnte nicht gelöscht werden. Bitte versuche es erneut."
        );
      }
    },
    [loadPlans]
  );

  // Load plans on screen focus
  useFocusEffect(
    useCallback(() => {
      loadPlans();
    }, [loadPlans])
  );

  // Loading State
  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4A90E2" />
          <Text style={styles.loadingText}>Lade Trainingspläne...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header - Logo left, Profile right */}
      <AppHeader />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Top Action Row: History Tile (70%) + Create Button (30%) */}
        <View style={styles.topActionRow}>
          {/* Workout History Tile */}
          <TouchableOpacity
            style={styles.historyTile}
            onPress={handleNavigateToHistory}
            activeOpacity={0.7}
          >
            <View style={styles.historyTileContent}>
              <Ionicons name="bar-chart-outline" size={40} color="#6FD89E" />
              <View style={styles.historyTileTextContainer}>
                <Text style={styles.historyTileTitle}>Workout-Historie</Text>
                <Text style={styles.historyTileSubtitle}>
                  Verfolge deinen Fortschritt
                </Text>
              </View>
            </View>
          </TouchableOpacity>

          {/* Create Plan Button */}
          <TouchableOpacity
            style={styles.createPlanTile}
            onPress={handleCreateNewPlan}
            activeOpacity={0.7}
          >
            <Text style={styles.createPlanIcon}>+</Text>
            <Text style={styles.createPlanText}>Neuer{"\n"}Plan</Text>
          </TouchableOpacity>
        </View>

        {/* Active Plan Section */}
        {activePlan && (
          <View style={styles.section}>
            <ActivePlanCard
              plan={activePlan}
              onNavigateToPlan={handleNavigateToPlan}
              onDelete={handleDeletePlan}
            />
          </View>
        )}

        {/* Past Workouts Section */}
        <View style={styles.section}>
          <TouchableOpacity
            style={styles.pastWorkoutsButton}
            onPress={handleOpenPastWorkoutsModal}
            activeOpacity={0.7}
          >
            <View style={styles.pastWorkoutsContent}>
              <Ionicons name="calendar-outline" size={28} color="#3083FF" />
              <View style={styles.pastWorkoutsTextContainer}>
                <Text style={styles.pastWorkoutsTitle}>Vergangene Workouts</Text>
                <Text style={styles.pastWorkoutsSubtitle}>
                  Alle abgeschlossenen Trainingseinheiten ansehen
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={24} color="#999" />
            </View>
          </TouchableOpacity>
        </View>

        {/* Inactive Plans Section */}
        {inactivePlans.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionHeader}>Weitere Pläne</Text>
            {inactivePlans.map((plan) => (
              <InactivePlanCard
                key={plan.id}
                plan={plan}
                onToggle={handleTogglePlan}
                onDelete={handleDeletePlan}
              />
            ))}
          </View>
        )}

        {/* Empty State */}
        {!activePlan && inactivePlans.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateTitle}>
              Keine Trainingspläne vorhanden
            </Text>
            <Text style={styles.emptyStateText}>
              Erstelle deinen ersten Trainingsplan, um loszulegen!
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Past Workouts Modal */}
      <PastWorkoutsModal
        visible={pastWorkoutsModalVisible}
        onClose={handleClosePastWorkoutsModal}
        sessions={pastWorkoutsSessions}
        loading={pastWorkoutsLoading}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "transparent",
  },
  scrollView: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: "#666",
  },
  // Top Action Row (History + Create Plan)
  topActionRow: {
    flexDirection: "row",
    gap: 12,
    marginBottom: 24,
  },
  // Workout History Tile (70%)
  historyTile: {
    flex: 7,
    backgroundColor: "rgba(255, 255, 255, 0.85)",
    borderRadius: 20,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
    minHeight: 100,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  historyTileContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  historyTileTextContainer: {
    flex: 1,
  },
  historyTileTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#333333",
    marginBottom: 4,
  },
  historyTileSubtitle: {
    fontSize: 13,
    color: "#666666",
    lineHeight: 18,
  },
  // Create Plan Tile (30%)
  createPlanTile: {
    flex: 3,
    backgroundColor: "rgba(111, 216, 158, 0.85)",
    borderRadius: 20,
    padding: 12,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
    minHeight: 100,
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  createPlanIcon: {
    fontSize: 48,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 4,
  },
  createPlanText: {
    fontSize: 12,
    fontWeight: "600",
    color: "#FFFFFF",
    textAlign: "center",
    lineHeight: 16,
  },
  // Sections
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginBottom: 12,
    marginLeft: 4,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 64,
    paddingHorizontal: 32,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#333",
    marginBottom: 8,
    textAlign: "center",
  },
  emptyStateText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    lineHeight: 24,
  },
  // Past Workouts Button
  pastWorkoutsButton: {
    backgroundColor: "rgba(255, 255, 255, 0.9)",
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    borderWidth: 1,
    borderColor: "rgba(48, 131, 255, 0.2)",
  },
  pastWorkoutsContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  pastWorkoutsTextContainer: {
    flex: 1,
  },
  pastWorkoutsTitle: {
    fontSize: 17,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  pastWorkoutsSubtitle: {
    fontSize: 13,
    color: "#666",
    lineHeight: 18,
  },
});
