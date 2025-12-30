/**
 * Guided Plan Flow Screen
 *
 * Shows personalized plan recommendations based on the scoring system.
 * Uses the scientifically-backed scoring algorithm to suggest the best training plans.
 *
 * Features:
 * - Top 3 personalized recommendations based on user profile
 * - Score-based ranking with reasoning
 * - Complete/Incomplete status indicators
 * - Direct plan creation from recommendations
 *
 * Migration: Refactored from decision tree to scoring system (2024-12-29)
 */

import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  Alert,
  ActivityIndicator,
  Animated,
} from "react-native";
import * as Haptics from "expo-haptics";
import { Button } from "@/components/ui/Button";
import { PlanRecommendationList } from "@/components/training/PlanRecommendationCard";
import { useTrainingNavigation } from "@/hooks/useTrainingNavigation";
import { trainingService } from "@/services/trainingService";
import type {
  GuidedPlanFlowScreenProps,
} from "@/navigation/TrainingStackNavigator";
import type { PlanRecommendation } from "@/utils/planRecommendationScoring";
import { supabase } from "@/lib/supabase";
import { recommendationAnalytics } from "@/utils/recommendationAnalytics";

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
  info: "#2196F3",
};

const SPACING = {
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

// ============================================================================
// Component
// ============================================================================

export const GuidedPlanFlowScreen: React.FC<
  GuidedPlanFlowScreenProps
> = () => {
  const navigation = useTrainingNavigation();

  // State
  const [recommendations, setRecommendations] = useState<PlanRecommendation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Animation
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Load recommendations on mount
  useEffect(() => {
    // Initialize analytics session
    recommendationAnalytics.initSession();
    loadRecommendations();
  }, []);

  // Fade in animation when recommendations are loaded
  useEffect(() => {
    if (!loading && recommendations.length > 0) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }).start();
    }
  }, [loading, recommendations]);

  const loadRecommendations = async () => {
    try {
      setLoading(true);
      setError(null);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setError("Nicht angemeldet");
        return;
      }

      // Track load start time for performance metrics
      const startTime = Date.now();

      // Load recommendations from service (top 3)
      const recs = await trainingService.getRecommendations(user.id, 3);

      // Track load time
      const loadTime = Date.now() - startTime;

      // Track analytics event
      recommendationAnalytics.trackRecommendationsLoaded(
        user.id,
        recs,
        loadTime
      );

      setRecommendations(recs);

      if (recs.length === 0) {
        setError("Es konnten keine passenden Trainingspläne gefunden werden. Bitte vervollständige dein Profil.");
      }
    } catch (err) {
      console.error("Error loading recommendations:", err);
      setError("Empfehlungen konnten nicht geladen werden. Bitte versuche es erneut.");

      // Track error
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        recommendationAnalytics.trackError(
          user.id,
          err instanceof Error ? err.message : 'Unknown error'
        );
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    fadeAnim.setValue(0);
    loadRecommendations();
  };

  // Handle plan selection
  const handleSelectPlan = async (recommendation: PlanRecommendation) => {
    try {
      // Haptic feedback for selection
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      // Track plan selection
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (user) {
        const rank = recommendations.findIndex(
          r => r.template.id === recommendation.template.id
        ) + 1;

        recommendationAnalytics.trackPlanSelected(
          user.id,
          recommendation,
          rank
        );
      }

      // Warning for incomplete programs
      if (recommendation.completeness === "incomplete") {
        // Track incomplete warning shown
        if (user) {
          recommendationAnalytics.trackIncompleteWarning(
            user.id,
            recommendation.template.plan_type,
            false
          );
        }

        Alert.alert(
          "Hinweis",
          `Der Plan "${recommendation.template.name_de || recommendation.template.name}" ist noch in Entwicklung und hat noch keine konfigurierten Übungen. Möchtest du trotzdem fortfahren?`,
          [
            {
              text: "Abbrechen",
              style: "cancel",
              onPress: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning)
            },
            {
              text: "Trotzdem erstellen",
              onPress: async () => {
                // Track incomplete plan accepted
                if (user) {
                  recommendationAnalytics.trackIncompleteWarning(
                    user.id,
                    recommendation.template.plan_type,
                    true
                  );
                }
                await createPlanFromRecommendation(recommendation);
              },
            },
          ]
        );
        return;
      }

      await createPlanFromRecommendation(recommendation);
    } catch (error) {
      console.error("Error selecting plan:", error);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert("Fehler", "Plan konnte nicht erstellt werden");
    }
  };

  const createPlanFromRecommendation = async (
    recommendation: PlanRecommendation
  ) => {
    setLoading(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) throw new Error("Not authenticated");

      const createdPlanId = await trainingService.createPlanFromTemplate(
        user.id,
        recommendation.template.id,
        recommendation.template.name_de || recommendation.template.name,
        new Date(),
        true // Set as active
      );

      // Track plan creation
      recommendationAnalytics.trackPlanCreated(
        user.id,
        recommendation.template.plan_type,
        recommendation.totalScore,
        recommendation.completeness
      );

      // Success haptic feedback
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      // Navigate directly to the created plan
      Alert.alert(
        "Erfolg! 🎉",
        `Trainingsplan "${recommendation.template.name_de || recommendation.template.name}" wurde erstellt!`,
        [
          {
            text: "Zum Plan",
            onPress: () => {
              // Navigate to plan details
              navigation.navigate("TrainingPlanDetail", { planId: createdPlanId });
            },
          },
          {
            text: "Zum Dashboard",
            style: "cancel",
            onPress: () => navigation.navigate("TrainingDashboard"),
          },
        ]
      );
    } catch (error) {
      console.error("Error creating plan:", error);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  // Render content based on state
  const renderContent = () => {
    // Loading state
    if (loading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>
            Suche die besten Pläne für dich...
          </Text>
        </View>
      );
    }

    // Error state with retry button
    if (error) {
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorIcon}>⚠️</Text>
          <Text style={styles.errorTitle}>Fehler</Text>
          <Text style={styles.errorMessage}>{error}</Text>
          <Button
            variant="primary"
            onPress={handleRetry}
            style={styles.retryButton}
          >
            Erneut versuchen
          </Button>
          <Button
            variant="ghost"
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          >
            Zurück
          </Button>
        </View>
      );
    }

    // Success state with recommendations
    return (
      <Animated.View style={[styles.recommendationsContainer, { opacity: fadeAnim }]}>
        <PlanRecommendationList
          recommendations={recommendations}
          onSelectPlan={handleSelectPlan}
        />
      </Animated.View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {renderContent()}
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
    alignItems: "center",
    justifyContent: "center",
    padding: SPACING.xl,
  },
  loadingText: {
    marginTop: SPACING.md,
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: "center",
  },
  errorContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: SPACING.xl,
    gap: SPACING.md,
  },
  errorIcon: {
    fontSize: 64,
    marginBottom: SPACING.sm,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: COLORS.text,
    textAlign: "center",
  },
  errorMessage: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: "center",
    lineHeight: 24,
    marginBottom: SPACING.md,
  },
  retryButton: {
    minWidth: 200,
    marginTop: SPACING.sm,
  },
  backButton: {
    minWidth: 200,
  },
  recommendationsContainer: {
    flex: 1,
  },
});
