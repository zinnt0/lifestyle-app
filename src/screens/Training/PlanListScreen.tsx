/**
 * Plan List Screen
 *
 * Displays all available training plans sorted by rating.
 * Shows plan cards with collapsible reasoning sections.
 *
 * Features:
 * - All plans displayed with their ratings
 * - Sorted by total score (best first)
 * - Collapsible "Warum dieser Plan?" section
 * - Same card design as GuidedPlanFlowScreen
 * - Loading state and error handling
 */

import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  FlatList,
} from "react-native";
import { supabase } from "@/lib/supabase";
import { trainingService } from "@/services/trainingService";
import type { PlanRecommendation } from "@/utils/planRecommendationScoring";
import type { PlanListScreenProps } from "@/navigation/TrainingStackNavigator";
import { PlanRecommendationCardCollapsible } from "@/components/training/PlanRecommendationCardCollapsible";
import { theme } from "@/constants/theme";

// Design System Constants
const COLORS = {
  background: "#F8F9FA",
  text: "#333333",
  textSecondary: "#666666",
  error: "#E53E3E",
};

const SPACING = {
  md: theme.spacing.md,
  lg: theme.spacing.lg,
  xl: theme.spacing.xl,
};

export const PlanListScreen: React.FC<PlanListScreenProps> = ({
  navigation,
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [allPlans, setAllPlans] = useState<PlanRecommendation[]>([]);

  useEffect(() => {
    loadAllPlans();
  }, []);

  const loadAllPlans = async () => {
    try {
      setLoading(true);
      setError(null);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setError("Kein Benutzer angemeldet");
        setLoading(false);
        return;
      }

      // Load all plans with ratings (no limit)
      const plans = await trainingService.getAllPlansWithRatings(user.id);
      setAllPlans(plans);
    } catch (err) {
      console.error("Error loading plans:", err);
      setError("Fehler beim Laden der Pläne");
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPlan = async (recommendation: PlanRecommendation) => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setError("Kein Benutzer angemeldet");
        return;
      }

      const template = recommendation.template;

      // Check if plan requires 1RM input
      if (
        template.is_dynamic &&
        template.requires_1rm_for_exercises &&
        template.requires_1rm_for_exercises.length > 0
      ) {
        navigation.navigate("OneRMInput", {
          planTemplateId: template.id,
          requiredExerciseIds: template.requires_1rm_for_exercises,
        });
      } else {
        // Create static plan and navigate to dashboard
        await trainingService.createPlanFromTemplate(
          user.id,
          template.id,
          template.name_de || template.name,
          new Date(),
          true
        );
        navigation.navigate("TrainingDashboard");
      }
    } catch (err) {
      console.error("Error creating plan:", err);
      setError("Fehler beim Erstellen des Plans");
    }
  };

  const renderItem = React.useCallback(
    ({ item, index }: { item: PlanRecommendation; index: number }) => (
      <PlanRecommendationCardCollapsible
        recommendation={item}
        onSelect={() => handleSelectPlan(item)}
        rank={index + 1}
      />
    ),
    [handleSelectPlan]
  );

  const keyExtractor = React.useCallback(
    (item: PlanRecommendation) => item.template.id,
    []
  );

  const ListHeaderComponent = React.useMemo(
    () => (
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Alle Trainingspläne</Text>
        <Text style={styles.headerSubtitle}>
          Sortiert nach Passgenauigkeit für dein Profil. Die besten Pläne
          stehen ganz oben.
        </Text>
      </View>
    ),
    []
  );

  const ListEmptyComponent = React.useMemo(
    () => (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>
          Keine Pläne gefunden.{"\n"}
          Bitte versuche es später erneut.
        </Text>
      </View>
    ),
    []
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={theme.colors.primary} />
          <Text style={styles.loadingText}>Lade Pläne...</Text>
        </View>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.container}>
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={allPlans}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        ListHeaderComponent={ListHeaderComponent}
        ListEmptyComponent={ListEmptyComponent}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        removeClippedSubviews={true}
        maxToRenderPerBatch={5}
        windowSize={7}
        initialNumToRender={5}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: SPACING.md,
  },
  loadingText: {
    marginTop: SPACING.md,
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  errorText: {
    fontSize: 16,
    color: COLORS.error,
    textAlign: "center",
  },
  header: {
    marginBottom: SPACING.lg,
    gap: SPACING.md,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: COLORS.text,
  },
  headerSubtitle: {
    fontSize: 15,
    color: COLORS.textSecondary,
    lineHeight: 22,
  },
  listContent: {
    padding: SPACING.md,
    paddingBottom: SPACING.xl,
  },
  emptyContainer: {
    padding: SPACING.xl,
    alignItems: "center",
  },
  emptyText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: "center",
    lineHeight: 24,
  },
});
