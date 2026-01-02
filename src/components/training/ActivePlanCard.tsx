import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ProgressBar } from "./ProgressBar";
import type { TrainingPlanDetails } from "@/types/training.types";

interface ActivePlanCardProps {
  /** The active training plan with details */
  plan: TrainingPlanDetails;
  /** Called when user wants to navigate to plan details */
  onNavigateToPlan: (planId: string) => void;
  /** Called when user deletes the plan */
  onDelete: (planId: string) => void;
}

/**
 * ActivePlanCard Component
 *
 * Displays the currently active training plan with gradient background,
 * progress tracking, swipe-to-delete functionality, and navigation to plan details.
 *
 * @example
 * ```tsx
 * <ActivePlanCard
 *   plan={activePlan}
 *   onNavigateToPlan={(id) => navigation.navigate('PlanDetails', { id })}
 *   onDelete={handleDeletePlan}
 * />
 * ```
 */
export const ActivePlanCard: React.FC<ActivePlanCardProps> = ({
  plan,
  onNavigateToPlan,
  onDelete,
}) => {
  const [menuVisible, setMenuVisible] = React.useState(false);

  // Only calculate progress if plan has a defined duration
  const progress =
    plan.current_week && plan.total_weeks
      ? (plan.current_week / plan.total_weeks) * 100
      : 0;

  const handleDelete = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(
      "Plan löschen",
      `Möchtest du den aktiven Plan "${plan.name}" wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.`,
      [
        {
          text: "Abbrechen",
          style: "cancel",
          onPress: () => setMenuVisible(false),
        },
        {
          text: "Löschen",
          style: "destructive",
          onPress: () => {
            setMenuVisible(false);
            onDelete(plan.id);
          },
        },
      ]
    );
  };

  return (
    <Card gradient gradientColors={["#6FD89E", "#007879"]}>
      <View style={styles.container}>
        <View style={styles.headerRow}>
          <View style={styles.header}>
            <Text style={styles.badge}>🏋️ AKTIVER PLAN</Text>
          </View>

          <TouchableOpacity
            onPress={() => setMenuVisible(!menuVisible)}
            style={styles.menuButton}
            accessibilityLabel="Menü öffnen"
          >
            <Ionicons name="ellipsis-vertical" size={20} color="#fff" />
          </TouchableOpacity>
        </View>

        <Text style={styles.planName}>{plan.name}</Text>
        <Text style={styles.details}>{plan.days_per_week} Tage pro Woche</Text>

        {plan.current_week && (
          <>
            <Text style={styles.weekInfo}>
              Woche {plan.current_week}
              {plan.total_weeks ? ` von ${plan.total_weeks}` : ""}
            </Text>
            {plan.total_weeks && (
              <ProgressBar
                progress={progress}
                color="#fff"
                backgroundColor="rgba(255, 255, 255, 0.3)"
              />
            )}
          </>
        )}

        {menuVisible && (
          <View style={styles.menu}>
            <TouchableOpacity
              onPress={handleDelete}
              style={styles.menuItem}
              accessibilityLabel="Plan löschen"
            >
              <Ionicons name="trash-outline" size={18} color="#fff" />
              <Text style={styles.menuItemTextDelete}>Löschen</Text>
            </TouchableOpacity>
          </View>
        )}

        <Button
          onPress={() => onNavigateToPlan(plan.id)}
          variant="ghost"
          style={styles.button}
          textStyle={styles.buttonText}
        >
          Zum Plan →
        </Button>
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  header: {
    marginBottom: 4,
  },
  badge: {
    fontSize: 12,
    fontWeight: "700",
    color: "#fff",
    opacity: 0.9,
  },
  menuButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
  },
  planName: {
    fontSize: 24,
    fontWeight: "700",
    color: "#fff",
  },
  details: {
    fontSize: 16,
    color: "#fff",
    opacity: 0.9,
  },
  weekInfo: {
    fontSize: 14,
    color: "#fff",
    opacity: 0.9,
    marginTop: 8,
  },
  menu: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: "rgba(255, 255, 255, 0.3)",
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 8,
    paddingHorizontal: 4,
  },
  menuItemTextDelete: {
    fontSize: 16,
    color: "#fff",
    fontWeight: "500",
  },
  button: {
    marginTop: 8,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
  },
  buttonText: {
    color: "#fff",
  },
});
