/**
 * One RM Input Screen
 *
 * Allows users to input their 1RM values for exercises required by dynamic training plans.
 * Displays existing 1RM values and validates inputs before plan creation.
 *
 * Features:
 * - Shows all required exercises with name_de
 * - Pre-fills existing 1RM values
 * - Input validation (weight > 0)
 * - Optional: Estimate from recent workouts
 * - Navigates back with collected 1RM values
 */

import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  FlatList,
  TextInput,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from "react-native";
import { Button } from "@/components/ui/Button";
import { oneRMService, type CurrentOneRM } from "@/services/oneRMService";
import { trainingService } from "@/services/trainingService";
import { supabase } from "@/lib/supabase";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import * as Haptics from "expo-haptics";

// ============================================================================
// Constants
// ============================================================================

const COLORS = {
  background: "#F8F9FA",
  surface: "#FFFFFF",
  text: "#333333",
  textSecondary: "#666666",
  primary: "#4A90E2",
  success: "#34C759",
  border: "#E0E0E0",
  inputBackground: "#F5F5F5",
};

const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

// ============================================================================
// Types
// ============================================================================

type RouteParams = {
  planTemplateId: string;
  requiredExerciseIds: string[];
};

type Props = NativeStackScreenProps<any, any> & {
  route: {
    params: RouteParams;
  };
};

interface ExerciseOneRMInput {
  exercise_id: string;
  exercise_name: string;
  exercise_name_de: string;
  current_1rm?: number; // Existing value from DB
  input_value: string; // User input
}

// ============================================================================
// Component
// ============================================================================

export const OneRMInputScreen: React.FC<Props> = ({ navigation, route }) => {
  const { planTemplateId, requiredExerciseIds } = route.params;

  // State
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [exercises, setExercises] = useState<ExerciseOneRMInput[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [infoExpanded, setInfoExpanded] = useState(false);

  // Load exercise data and existing 1RM values
  useEffect(() => {
    loadExercises();
  }, []);

  const loadExercises = async () => {
    try {
      setLoading(true);

      // Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        Alert.alert("Fehler", "Nicht angemeldet");
        navigation.goBack();
        return;
      }

      setUserId(user.id);

      // Load exercise details
      const { data: exerciseData, error: exerciseError } = await supabase
        .from("exercises")
        .select("id, name, name_de")
        .in("id", requiredExerciseIds);

      if (exerciseError || !exerciseData) {
        throw new Error("Exercises konnten nicht geladen werden");
      }

      // Load existing 1RM values
      const currentOneRMs = await oneRMService.getAllCurrentOneRMs(user.id);

      // Create map of exercise_id -> current 1RM
      const oneRMMap = new Map<string, number>();
      currentOneRMs.forEach((orm) => {
        oneRMMap.set(orm.exercise_id, orm.weight);
      });

      // Build exercise input list
      const exerciseInputs: ExerciseOneRMInput[] = exerciseData.map((ex) => ({
        exercise_id: ex.id,
        exercise_name: ex.name,
        exercise_name_de: ex.name_de,
        current_1rm: oneRMMap.get(ex.id),
        input_value: oneRMMap.get(ex.id)?.toString() || "",
      }));

      setExercises(exerciseInputs);
    } catch (error) {
      console.error("Error loading exercises:", error);
      Alert.alert(
        "Fehler",
        "Übungen konnten nicht geladen werden. Bitte versuche es erneut."
      );
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (exerciseId: string, value: string) => {
    // Allow only numbers and decimal point
    const sanitized = value.replace(/[^0-9.]/g, "");

    setExercises((prev) =>
      prev.map((ex) =>
        ex.exercise_id === exerciseId
          ? { ...ex, input_value: sanitized }
          : ex
      )
    );
  };

  const validateInputs = (): boolean => {
    // Check if all exercises have valid input
    for (const ex of exercises) {
      const weight = parseFloat(ex.input_value);

      if (!ex.input_value || isNaN(weight) || weight <= 0) {
        Alert.alert(
          "Eingabe fehlt",
          `Bitte gib einen gültigen 1RM-Wert für "${ex.exercise_name_de}" ein (> 0 kg).`
        );
        return false;
      }
    }

    return true;
  };

  const handleSubmit = async () => {
    try {
      // Validate inputs
      if (!validateInputs()) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        return;
      }

      if (!userId) {
        Alert.alert("Fehler", "Nicht angemeldet");
        return;
      }

      setSubmitting(true);

      // Build oneRMValues map
      const oneRMValues: Record<string, number> = {};
      exercises.forEach((ex) => {
        oneRMValues[ex.exercise_id] = parseFloat(ex.input_value);
      });

      // Save all 1RM values
      for (const ex of exercises) {
        const weight = parseFloat(ex.input_value);

        // Only save if value changed or is new
        if (!ex.current_1rm || ex.current_1rm !== weight) {
          await oneRMService.saveOneRM(
            userId,
            ex.exercise_id,
            weight,
            false, // Not estimated, user provided
            "Eingegeben bei Planerstellung"
          );
        }
      }

      // Load template to get name
      const { data: templateData, error: templateError } = await supabase
        .from("plan_templates")
        .select("name, name_de")
        .eq("id", planTemplateId)
        .single();

      if (templateError || !templateData) {
        throw new Error("Template konnte nicht geladen werden");
      }

      // Create dynamic plan
      const planName = templateData.name_de || templateData.name;
      const createdPlanId = await trainingService.createDynamicPlan(
        userId,
        planTemplateId,
        oneRMValues,
        planName,
        new Date(),
        true // Set as active
      );

      // Success feedback
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      // Navigate to plan details
      Alert.alert(
        "Erfolg! 🎉",
        `Dynamischer Trainingsplan "${planName}" wurde erstellt!\n\nDeine Trainingsgewichte werden automatisch basierend auf deinen 1RM-Werten berechnet.`,
        [
          {
            text: "Zum Plan",
            onPress: () => {
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
      console.error("Error creating dynamic plan:", error);
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      Alert.alert(
        "Fehler",
        error instanceof Error ? error.message : "Plan konnte nicht erstellt werden"
      );
    } finally {
      setSubmitting(false);
    }
  };

  // Render single exercise item
  const renderExerciseItem = ({
    item,
  }: {
    item: ExerciseOneRMInput;
  }) => (
    <View style={styles.exerciseCard}>
      <View style={styles.exerciseHeader}>
        <Text style={styles.exerciseName}>{item.exercise_name_de}</Text>
        {item.current_1rm && (
          <Text style={styles.currentValue}>Aktuell: {item.current_1rm} kg</Text>
        )}
      </View>

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={item.input_value}
          onChangeText={(value) => handleInputChange(item.exercise_id, value)}
          placeholder="z.B. 100"
          placeholderTextColor={COLORS.textSecondary}
          keyboardType="decimal-pad"
          returnKeyType="done"
        />
        <Text style={styles.inputUnit}>kg</Text>
      </View>

      {/* Optional: Future feature - Estimate from workouts */}
      {/* <TouchableOpacity
        style={styles.estimateButton}
        onPress={() => handleEstimateFromWorkouts(item.exercise_id)}
      >
        <Text style={styles.estimateButtonText}>Aus Workouts schätzen</Text>
      </TouchableOpacity> */}
    </View>
  );

  // Render loading state
  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Lade Übungen...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      >
        {/* Header Section */}
        <View style={styles.header}>
          <Text style={styles.title}>1RM-Werte eingeben</Text>

          {/* Collapsible Info Box */}
          <TouchableOpacity
            style={styles.infoBoxCollapsed}
            onPress={() => setInfoExpanded(!infoExpanded)}
            activeOpacity={0.7}
          >
            <Text style={styles.infoIcon}>💡</Text>
            <Text style={styles.infoTextCollapsed}>
              <Text style={styles.infoBold}>Was ist 1RM?</Text>
            </Text>
            <Text style={styles.expandIcon}>{infoExpanded ? "▼" : "▶"}</Text>
          </TouchableOpacity>

          {infoExpanded && (
            <View style={styles.infoBoxExpanded}>
              <Text style={styles.infoTextExpanded}>
                1RM steht für "One Repetition Maximum" - das maximale Gewicht, das
                du für eine saubere Wiederholung bewegen kannst.
                {"\n\n"}
                Gib deine aktuellen Maximalgewichte für die folgenden Übungen
                ein. Diese werden für die Berechnung deiner Trainingsgewichte
                verwendet.
              </Text>
            </View>
          )}
        </View>

        {/* Exercise List */}
        <FlatList
          data={exercises}
          renderItem={renderExerciseItem}
          keyExtractor={(item) => item.exercise_id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />

        {/* Submit Button */}
        <View style={styles.footer}>
          <Button
            onPress={handleSubmit}
            variant="primary"
            size="large"
            fullWidth
            loading={submitting}
            disabled={submitting}
          >
            Weiter zur Planerstellung
          </Button>
        </View>
      </KeyboardAvoidingView>
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
    gap: SPACING.md,
  },
  loadingText: {
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  header: {
    padding: SPACING.lg,
    backgroundColor: COLORS.surface,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  infoBoxCollapsed: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#E3F2FD",
    padding: SPACING.md,
    borderRadius: 12,
    gap: SPACING.sm,
  },
  infoBoxExpanded: {
    backgroundColor: "#E3F2FD",
    padding: SPACING.md,
    paddingTop: SPACING.sm,
    borderRadius: 12,
    marginTop: SPACING.sm,
  },
  infoIcon: {
    fontSize: 20,
  },
  infoTextCollapsed: {
    flex: 1,
    fontSize: 15,
    color: COLORS.text,
    fontWeight: "600",
  },
  infoTextExpanded: {
    fontSize: 14,
    color: COLORS.text,
    lineHeight: 20,
  },
  expandIcon: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontWeight: "600",
  },
  infoBold: {
    fontWeight: "600",
  },
  listContent: {
    padding: SPACING.lg,
    gap: SPACING.md,
  },
  exerciseCard: {
    backgroundColor: COLORS.surface,
    padding: SPACING.lg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    gap: SPACING.md,
  },
  exerciseHeader: {
    gap: SPACING.xs,
  },
  exerciseName: {
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.text,
  },
  currentValue: {
    fontSize: 14,
    color: COLORS.success,
    fontWeight: "500",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.inputBackground,
    borderRadius: 8,
    paddingHorizontal: SPACING.md,
    height: 56,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  input: {
    flex: 1,
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.text,
  },
  inputUnit: {
    fontSize: 16,
    fontWeight: "500",
    color: COLORS.textSecondary,
    marginLeft: SPACING.sm,
  },
  estimateButton: {
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.primary,
    alignSelf: "flex-start",
  },
  estimateButtonText: {
    fontSize: 14,
    fontWeight: "500",
    color: COLORS.primary,
  },
  footer: {
    padding: SPACING.lg,
    backgroundColor: COLORS.surface,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
});
