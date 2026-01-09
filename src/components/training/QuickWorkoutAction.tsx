/**
 * Quick Workout Action Component
 *
 * Displays the next scheduled workout with quick action to start training.
 * Shows on Home Dashboard for easy workout access.
 */

import React, { useState } from "react";
import { View, Text, StyleSheet, Alert, TouchableOpacity } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Card } from "../ui/Card";
import { Button } from "../ui/Button";
import { NextWorkout } from "@/types/training.types";
import { trainingService } from "@/services/trainingService";
import { supabase } from "@/lib/supabase";

interface QuickWorkoutActionProps {
  /** Next scheduled workout */
  workout?: NextWorkout;
  /** Callback after workout session is started */
  onWorkoutStarted?: () => void;
}

/**
 * QuickWorkoutAction Component
 *
 * Prominent Home Dashboard component for quick workout access.
 * Shows next workout details or prompts to create a training plan.
 *
 * @example
 * ```tsx
 * <QuickWorkoutAction
 *   workout={nextWorkout}
 *   onWorkoutStarted={() => console.log('Started')}
 * />
 * ```
 */
export const QuickWorkoutAction: React.FC<QuickWorkoutActionProps> = ({
  workout,
  onWorkoutStarted,
}) => {
  const navigation = useNavigation();
  const [isStarting, setIsStarting] = useState(false);

  /**
   * Navigate to Training Tab to create a plan
   */
  const handleCreatePlan = () => {
    // @ts-ignore - Navigation to nested navigator
    navigation.navigate("TrainingTab", {
      screen: "TrainingDashboard",
    });
  };

  /**
   * Start workout session and navigate to WorkoutSession screen
   */
  const handleStartWorkout = async () => {
    if (!workout) return;

    try {
      setIsStarting(true);

      // Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        Alert.alert("Fehler", "Benutzer nicht authentifiziert");
        return;
      }

      // Check for paused session first
      const pausedSession = await trainingService.getPausedSession(user.id);

      if (pausedSession) {
        // Ask user if they want to resume or start new
        Alert.alert(
          "Unterbrochenes Workout gefunden",
          "Du hast ein unterbrochenes Workout. Möchtest du dieses fortsetzen oder ein neues starten?",
          [
            { text: "Abbrechen", style: "cancel", onPress: () => setIsStarting(false) },
            {
              text: "Fortsetzen",
              onPress: async () => {
                try {
                  await trainingService.resumeWorkoutSession(pausedSession.id);
                  // @ts-ignore - Navigation to nested navigator
                  navigation.navigate("TrainingTab", {
                    screen: "WorkoutSession",
                    params: { sessionId: pausedSession.id },
                  });
                  if (onWorkoutStarted) {
                    onWorkoutStarted();
                  }
                } catch (err) {
                  console.error("Error resuming session:", err);
                  Alert.alert("Fehler", "Session konnte nicht fortgesetzt werden");
                } finally {
                  setIsStarting(false);
                }
              },
            },
            {
              text: "Neu starten",
              style: "destructive",
              onPress: async () => {
                try {
                  // Cancel old session
                  await trainingService.cancelWorkoutSession(pausedSession.id);
                  // Start new session
                  const sessionId = await trainingService.startWorkoutSession(
                    user.id,
                    workout.plan.id,
                    workout.workout.id
                  );
                  // @ts-ignore - Navigation to nested navigator
                  navigation.navigate("TrainingTab", {
                    screen: "WorkoutSession",
                    params: { sessionId },
                  });
                  if (onWorkoutStarted) {
                    onWorkoutStarted();
                  }
                } catch (err) {
                  console.error("Error starting new session:", err);
                  Alert.alert("Fehler", "Neue Session konnte nicht gestartet werden");
                } finally {
                  setIsStarting(false);
                }
              },
            },
          ]
        );
        return;
      }

      // No paused session - start new workout session
      const sessionId = await trainingService.startWorkoutSession(
        user.id,
        workout.plan.id,
        workout.workout.id
      );

      // Navigate to WorkoutSession screen
      // @ts-ignore - Navigation to nested navigator
      navigation.navigate("TrainingTab", {
        screen: "WorkoutSession",
        params: { sessionId },
      });

      // Callback after successful start
      if (onWorkoutStarted) {
        onWorkoutStarted();
      }
    } catch (error: any) {
      const errorMessage = error.message || "";

      // Check if error is about an existing active or paused workout
      if (errorMessage.includes("bereits ein Workout") || errorMessage.includes("aktive Session")) {
        Alert.alert(
          "Aktives Workout vorhanden",
          "Bitte beende zuerst dein aktuelles Workout, bevor du ein neues startest.",
          [{ text: "OK", style: "default" }]
        );
      } else if (errorMessage.includes("unterbrochenes Workout") || errorMessage.includes("fort oder breche")) {
        Alert.alert(
          "Unterbrochenes Workout",
          "Du hast noch ein pausiertes Workout. Bitte setze es fort oder breche es ab.",
          [{ text: "OK", style: "default" }]
        );
      } else {
        console.error("Error starting workout:", error);
        Alert.alert(
          "Fehler",
          errorMessage || "Workout konnte nicht gestartet werden"
        );
      }
    } finally {
      setIsStarting(false);
    }
  };

  // No workout - show create plan prompt
  if (!workout) {
    return (
      <Card
        gradient
        gradientColors={["#E8F3FF", "#F0F9FF"]}
        padding="large"
        elevation="medium"
        style={styles.card}
      >
        <Text style={styles.emptyTitle}>Noch kein Trainingsplan</Text>
        <Text style={styles.emptySubtitle}>
          Erstelle deinen ersten Plan und starte mit deinem Training
        </Text>
        <Button
          onPress={handleCreatePlan}
          variant="primary"
          size="large"
          style={styles.createButton}
        >
          Plan erstellen
        </Button>
      </Card>
    );
  }

  // Calculate workout info
  const exerciseCount = workout.workout.exercises?.length || 0;
  const estimatedDuration = workout.workout.estimated_duration || 45; // Default 45min

  return (
    <TouchableOpacity
      onPress={handleStartWorkout}
      disabled={isStarting}
      activeOpacity={0.9}
    >
      <Card
        gradient
        gradientColors={["#5B9EFF", "#7DB9FF"]}
        padding="large"
        elevation="medium"
        style={styles.card}
      >
        <View style={styles.header}>
          <Text style={styles.label}>Nächstes Workout</Text>
          <Text style={styles.planName}>{workout.plan.name}</Text>
        </View>

        <Text style={styles.workoutName}>{workout.workout.name}</Text>

        <View style={styles.info}>
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Übungen</Text>
            <Text style={styles.infoValue}>{exerciseCount}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.infoItem}>
            <Text style={styles.infoLabel}>Dauer</Text>
            <Text style={styles.infoValue}>~{estimatedDuration} min</Text>
          </View>
        </View>

        {isStarting && (
          <View style={styles.loadingOverlay}>
            <Text style={styles.loadingText}>Wird gestartet...</Text>
          </View>
        )}
      </Card>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    marginVertical: 16,
  },
  header: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.8)",
    fontWeight: "500",
    marginBottom: 4,
  },
  planName: {
    fontSize: 13,
    color: "rgba(255, 255, 255, 0.7)",
    fontWeight: "400",
  },
  workoutName: {
    fontSize: 24,
    fontWeight: "700",
    color: "#FFFFFF",
    marginBottom: 20,
  },
  info: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-around",
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  infoItem: {
    alignItems: "center",
    flex: 1,
  },
  infoLabel: {
    fontSize: 13,
    color: "rgba(255, 255, 255, 0.7)",
    fontWeight: "500",
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 20,
    fontWeight: "700",
    color: "#FFFFFF",
  },
  divider: {
    width: 1,
    height: 40,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
  },
  loadingOverlay: {
    marginTop: 20,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 8,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#FFFFFF",
  },
  // Empty state styles
  emptyTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#2C3E50",
    marginBottom: 8,
    textAlign: "center",
  },
  emptySubtitle: {
    fontSize: 15,
    color: "#5A6C7D",
    marginBottom: 24,
    textAlign: "center",
    lineHeight: 22,
  },
  createButton: {
    backgroundColor: "#5B9EFF",
  },
});
