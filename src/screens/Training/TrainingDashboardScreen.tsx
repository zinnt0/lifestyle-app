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
  SafeAreaView,
} from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import * as Haptics from "expo-haptics";
import { supabase } from "@/lib/supabase";
import { trainingService } from "@/services/trainingService";
import { useTrainingNavigation } from "@/hooks/useTrainingNavigation";
import { ActivePlanCard } from "@/components/training/ActivePlanCard";
import { InactivePlanCard } from "@/components/training/InactivePlanCard";
import { Button } from "@/components/ui/Button";
import type { TrainingPlan, TrainingPlanDetails } from "@/types/training.types";

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
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
      >
        {/* Active Plan Section */}
        {activePlan && (
          <View style={styles.section}>
            <ActivePlanCard
              plan={activePlan}
              onNavigateToPlan={handleNavigateToPlan}
            />
          </View>
        )}

        {/* Inactive Plans Section */}
        {inactivePlans.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionHeader}>Weitere Pläne</Text>
            {inactivePlans.map((plan) => (
              <InactivePlanCard
                key={plan.id}
                plan={plan}
                onToggle={handleTogglePlan}
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

        {/* Create New Plan Button */}
        <View style={styles.createButtonContainer}>
          <Button onPress={handleCreateNewPlan} variant="primary">
            + Neuen Plan erstellen
          </Button>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  scrollView: {
    flex: 1,
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
  createButtonContainer: {
    marginTop: 16,
  },
});
