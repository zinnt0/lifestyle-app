import React from "react";
import {
  View,
  Text,
  StyleSheet,
  Switch,
  TouchableOpacity,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { Card } from "@/components/ui/Card";
import type { TrainingPlan } from "@/types/training.types";

interface InactivePlanCardProps {
  /** The inactive training plan */
  plan: TrainingPlan;
  /** Called when user toggles the activation switch */
  onToggle: (planId: string) => void;
  /** Called when user deletes the plan */
  onDelete: (planId: string) => void;
}

/**
 * InactivePlanCard Component
 *
 * Displays an inactive training plan with basic information,
 * a toggle switch to activate it, and swipe-to-delete functionality.
 *
 * @example
 * ```tsx
 * <InactivePlanCard
 *   plan={inactivePlan}
 *   onToggle={handleActivatePlan}
 *   onDelete={handleDeletePlan}
 * />
 * ```
 */
export const InactivePlanCard: React.FC<InactivePlanCardProps> = ({
  plan,
  onToggle,
  onDelete,
}) => {
  const [menuVisible, setMenuVisible] = React.useState(false);

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

  const handleDelete = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    Alert.alert(
      "Plan löschen",
      `Möchtest du den Plan "${plan.name}" wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.`,
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
    <Card padding="medium" elevation="medium" style={styles.card}>
      <View style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.planName}>{plan.name}</Text>
          <Text style={styles.details}>
            {plan.days_per_week} Tage •{" "}
            {getGoalLabel(plan.template?.primary_goal)}
          </Text>
        </View>

        <View style={styles.actions}>
          <Switch
            value={false}
            onValueChange={() => onToggle(plan.id)}
            trackColor={{ false: "#E5E7EB", true: "#6FD89E" }}
            thumbColor="#fff"
            accessibilityLabel={`Plan ${plan.name} aktivieren`}
          />

          <TouchableOpacity
            onPress={() => setMenuVisible(!menuVisible)}
            style={styles.menuButton}
            accessibilityLabel="Menü öffnen"
          >
            <Ionicons name="ellipsis-vertical" size={20} color="#6B7280" />
          </TouchableOpacity>
        </View>
      </View>

      {menuVisible && (
        <View style={styles.menu}>
          <TouchableOpacity
            onPress={handleDelete}
            style={styles.menuItem}
            accessibilityLabel="Plan löschen"
          >
            <Ionicons name="trash-outline" size={18} color="#EF4444" />
            <Text style={styles.menuItemTextDelete}>Löschen</Text>
          </TouchableOpacity>
        </View>
      )}
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: 12,
  },
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
    color: "#1F2937",
  },
  details: {
    fontSize: 14,
    color: "#6B7280",
  },
  actions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  menuButton: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: "#E5E7EB",
  },
  menu: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: "#E5E7EB",
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
    color: "#EF4444",
    fontWeight: "500",
  },
});
