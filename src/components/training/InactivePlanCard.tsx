import React from "react";
import { View, Text, StyleSheet, Switch } from "react-native";
import { Card } from "@/components/ui/Card";
import type { TrainingPlan } from "@/types/training.types";

interface InactivePlanCardProps {
  /** The inactive training plan */
  plan: TrainingPlan;
  /** Called when user toggles the activation switch */
  onToggle: (planId: string) => void;
}

/**
 * InactivePlanCard Component
 *
 * Displays an inactive training plan with basic information
 * and a toggle switch to activate it.
 *
 * @example
 * ```tsx
 * <InactivePlanCard
 *   plan={inactivePlan}
 *   onToggle={handleActivatePlan}
 * />
 * ```
 */
export const InactivePlanCard: React.FC<InactivePlanCardProps> = ({
  plan,
  onToggle,
}) => {
  const getGoalLabel = (goal?: string): string => {
    switch (goal) {
      case "strength":
        return "Kraft";
      case "hypertrophy":
        return "Muskelaufbau";
      case "both":
        return "Kraft + Hypertrophie";
      default:
        return "Training";
    }
  };

  return (
    <Card elevation="medium">
      <View style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.planName}>{plan.name}</Text>
          <Text style={styles.details}>
            {plan.days_per_week} Tage • {getGoalLabel(plan.template?.primary_goal)}
          </Text>
        </View>

        <Switch
          value={false}
          onValueChange={() => onToggle(plan.id)}
          trackColor={{ false: "#ccc", true: "#4A90E2" }}
          thumbColor="#fff"
          accessibilityLabel={`Plan ${plan.name} aktivieren`}
        />
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  content: {
    flex: 1,
    gap: 4,
  },
  planName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
  },
  details: {
    fontSize: 14,
    color: "#666",
  },
});
