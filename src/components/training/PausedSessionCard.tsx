/**
 * Paused Session Card Component
 *
 * Displays a paused/interrupted workout session with options to resume or cancel.
 */

import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Alert } from "react-native";
import { Card } from "../ui/Card";
import { WorkoutSession } from "@/types/training.types";

interface PausedSessionCardProps {
  /** Paused workout session */
  session: WorkoutSession;
  /** Callback when user wants to resume */
  onResume: () => void;
  /** Callback when user wants to cancel */
  onCancel: () => void;
}

/**
 * PausedSessionCard Component
 *
 * Shows a prominent card for paused workout sessions with quick actions.
 */
export const PausedSessionCard: React.FC<PausedSessionCardProps> = ({
  session,
  onResume,
  onCancel,
}) => {
  const workoutName = session.workout?.name || "Workout";

  // Calculate time since pause (if start_time exists)
  const getTimeSincePause = () => {
    if (!session.start_time) return "";

    const startTime = new Date(session.start_time);
    const now = new Date();
    const diffMs = now.getTime() - startTime.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 60) {
      return `Vor ${diffMins} Min unterbrochen`;
    } else if (diffMins < 1440) {
      const hours = Math.floor(diffMins / 60);
      return `Vor ${hours} Std unterbrochen`;
    } else {
      const days = Math.floor(diffMins / 1440);
      return `Vor ${days} Tag${days > 1 ? 'en' : ''} unterbrochen`;
    }
  };

  const handleCancel = () => {
    Alert.alert(
      "Workout abbrechen?",
      "Möchtest du dieses unterbrochene Workout wirklich abbrechen? Dein Fortschritt geht verloren.",
      [
        { text: "Zurück", style: "cancel" },
        {
          text: "Abbrechen",
          style: "destructive",
          onPress: onCancel,
        },
      ]
    );
  };

  return (
    <Card
      gradient
      gradientColors={["#5B9EFF", "#7DB9FF"]}
      padding="large"
      elevation="medium"
      style={styles.card}
    >
      <View style={styles.header}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>⏸ Unterbrochen</Text>
        </View>
        <Text style={styles.timeText}>{getTimeSincePause()}</Text>
      </View>

      <Text style={styles.workoutName}>{workoutName}</Text>
      <Text style={styles.subtitle}>
        Du kannst dein Workout genau da fortsetzen, wo du aufgehört hast.
      </Text>

      <View style={styles.actions}>
        <TouchableOpacity
          style={styles.cancelButton}
          onPress={handleCancel}
          activeOpacity={0.7}
        >
          <Text style={styles.cancelButtonText}>Abbrechen</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.resumeButton}
          onPress={onResume}
          activeOpacity={0.7}
        >
          <Text style={styles.resumeButtonText}>▶ Fortsetzen</Text>
        </TouchableOpacity>
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    marginBottom: 20,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  badge: {
    backgroundColor: "rgba(255, 255, 255, 0.25)",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 13,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  timeText: {
    fontSize: 12,
    color: "rgba(255, 255, 255, 0.8)",
    fontWeight: "500",
  },
  workoutName: {
    fontSize: 24,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.9)",
    lineHeight: 20,
    marginBottom: 20,
  },
  actions: {
    flexDirection: "row",
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.3)",
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  resumeButton: {
    flex: 2,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  resumeButtonText: {
    fontSize: 16,
    fontWeight: "700",
    color: "#5B9EFF",
  },
});
