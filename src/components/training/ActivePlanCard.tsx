import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ProgressBar } from "./ProgressBar";
import type { TrainingPlanDetails } from "@/types/training.types";

interface ActivePlanCardProps {
  /** The active training plan with details */
  plan: TrainingPlanDetails;
  /** Called when user wants to navigate to plan details */
  onNavigateToPlan: (planId: string) => void;
}

/**
 * ActivePlanCard Component
 *
 * Displays the currently active training plan with gradient background,
 * progress tracking, and navigation to plan details.
 *
 * @example
 * ```tsx
 * <ActivePlanCard
 *   plan={activePlan}
 *   onNavigateToPlan={(id) => navigation.navigate('PlanDetails', { id })}
 * />
 * ```
 */
export const ActivePlanCard: React.FC<ActivePlanCardProps> = ({
  plan,
  onNavigateToPlan,
}) => {
  const progress = plan.current_week
    ? (plan.current_week / (plan.total_weeks || 12)) * 100
    : 0;

  return (
    <Card gradient gradientColors={["#4A90E2", "#7B68EE"]}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.badge}>🏋️ AKTIVER PLAN</Text>
        </View>

        <Text style={styles.planName}>{plan.name}</Text>
        <Text style={styles.details}>{plan.days_per_week} Tage pro Woche</Text>

        {plan.current_week && plan.total_weeks && (
          <>
            <Text style={styles.weekInfo}>
              Woche {plan.current_week} von {plan.total_weeks}
            </Text>
            <ProgressBar
              progress={progress}
              color="#fff"
              backgroundColor="rgba(255, 255, 255, 0.3)"
            />
          </>
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
  header: {
    marginBottom: 4,
  },
  badge: {
    fontSize: 12,
    fontWeight: "700",
    color: "#fff",
    opacity: 0.9,
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
  button: {
    marginTop: 8,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
  },
  buttonText: {
    color: "#fff",
  },
});
