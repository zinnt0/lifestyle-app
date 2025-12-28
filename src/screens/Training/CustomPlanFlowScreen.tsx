/**
 * Custom Plan Flow Screen
 *
 * Multi-step form for creating fully custom training plans:
 * 1. Select number of training days per week (2-6)
 * 2. Select muscle groups to train
 * 3. Select exercises for each muscle group (with equipment filter)
 * 4. Configure sets & reps for each exercise
 * 5. Preview and create plan
 */

import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Alert,
  ActivityIndicator,
  TouchableOpacity,
  TextInput,
} from "react-native";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useTrainingNavigation } from "@/hooks/useTrainingNavigation";
import { supabase } from "@/lib/supabase";
import type { Exercise } from "@/types/training.types";
import * as Haptics from "expo-haptics";

// ============================================================================
// Types
// ============================================================================

interface CustomPlanState {
  daysPerWeek: number | null;
  planName: string;
  selectedMuscleGroups: MuscleGroup[];
  selectedExercises: SelectedExercise[];
}

interface MuscleGroup {
  id: string;
  name: string;
  name_de: string;
  icon: string;
}

interface SelectedExercise {
  exercise: Exercise;
  sets: number;
  repsMin: number;
  repsMax: number;
  muscleGroup: string;
}

type Step = "days" | "muscleGroups" | "exercises" | "configure" | "preview";

// ============================================================================
// Constants
// ============================================================================

const COLORS = {
  background: "#F8F9FA",
  text: "#333333",
  textSecondary: "#666666",
  primary: "#4A90E2",
  success: "#4CAF50",
  selected: "#E3F2FD",
  selectedBorder: "#4A90E2",
  border: "#E5E5EA",
};

const SPACING = {
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

const MUSCLE_GROUPS: MuscleGroup[] = [
  { id: "chest", name: "Chest", name_de: "Brust", icon: "💪" },
  { id: "back", name: "Back", name_de: "Rücken", icon: "🏋️" },
  { id: "shoulders", name: "Shoulders", name_de: "Schultern", icon: "🔺" },
  { id: "arms", name: "Arms", name_de: "Arme", icon: "💪" },
  { id: "legs", name: "Legs", name_de: "Beine", icon: "🦵" },
  { id: "core", name: "Core", name_de: "Rumpf", icon: "⭕" },
];

const DEFAULT_SETS = 3;
const DEFAULT_REPS_MIN = 8;
const DEFAULT_REPS_MAX = 12;

// ============================================================================
// Component
// ============================================================================

export const CustomPlanFlowScreen: React.FC = () => {
  const navigation = useTrainingNavigation();

  // State
  const [currentStep, setCurrentStep] = useState<Step>("days");
  const [loading, setLoading] = useState(false);
  const [planState, setPlanState] = useState<CustomPlanState>({
    daysPerWeek: null,
    planName: "",
    selectedMuscleGroups: [],
    selectedExercises: [],
  });

  // Exercise selection state
  const [availableExercises, setAvailableExercises] = useState<Exercise[]>([]);
  const [equipmentFilter, setEquipmentFilter] = useState<string[]>([]);
  const [currentMuscleGroup, setCurrentMuscleGroup] = useState<MuscleGroup | null>(null);

  // Calculate progress
  const calculateProgress = (): number => {
    const stepProgress: Record<Step, number> = {
      days: 0.2,
      muscleGroups: 0.4,
      exercises: 0.6,
      configure: 0.8,
      preview: 1.0,
    };
    return stepProgress[currentStep];
  };

  const progress = calculateProgress();

  // ============================================================================
  // Step 1: Days Per Week Selection
  // ============================================================================

  const renderDaysStep = () => {
    const daysOptions = [2, 3, 4, 5, 6];

    return (
      <View style={styles.stepContainer}>
        <Text style={styles.stepTitle}>
          Wie viele Tage pro Woche möchtest du trainieren?
        </Text>
        <Text style={styles.stepSubtitle}>
          Wähle eine realistische Anzahl, die zu deinem Zeitplan passt
        </Text>

        <View style={styles.optionsContainer}>
          {daysOptions.map((days) => (
            <Card
              key={days}
              onPress={() => {
                Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                setPlanState({ ...planState, daysPerWeek: days });
              }}
              padding="large"
              elevation={planState.daysPerWeek === days ? "large" : "medium"}
              style={[
                styles.optionCard,
                planState.daysPerWeek === days && styles.optionCardSelected,
              ]}
            >
              <Text style={styles.daysNumber}>{days}</Text>
              <Text style={styles.daysLabel}>
                {days === 1 ? "Tag" : "Tage"} pro Woche
              </Text>
              {planState.daysPerWeek === days && (
                <View style={styles.checkmark}>
                  <Text style={styles.checkmarkText}>✓</Text>
                </View>
              )}
            </Card>
          ))}
        </View>

        <View style={styles.navigationButtons}>
          <Button
            variant="secondary"
            onPress={() => navigation.goBack()}
            style={styles.navButton}
          >
            Abbrechen
          </Button>
          <Button
            variant="primary"
            onPress={() => setCurrentStep("muscleGroups")}
            disabled={planState.daysPerWeek === null}
            style={styles.navButton}
          >
            Weiter
          </Button>
        </View>
      </View>
    );
  };

  // ============================================================================
  // Step 2: Muscle Groups Selection
  // ============================================================================

  const handleToggleMuscleGroup = (group: MuscleGroup) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const isSelected = planState.selectedMuscleGroups.some((g) => g.id === group.id);

    if (isSelected) {
      setPlanState({
        ...planState,
        selectedMuscleGroups: planState.selectedMuscleGroups.filter(
          (g) => g.id !== group.id
        ),
      });
    } else {
      setPlanState({
        ...planState,
        selectedMuscleGroups: [...planState.selectedMuscleGroups, group],
      });
    }
  };

  const renderMuscleGroupsStep = () => {
    return (
      <View style={styles.stepContainer}>
        <Text style={styles.stepTitle}>
          Welche Muskelgruppen möchtest du trainieren?
        </Text>
        <Text style={styles.stepSubtitle}>
          Wähle alle Muskelgruppen aus, die in deinem Plan enthalten sein sollen
        </Text>

        <View style={styles.muscleGroupsGrid}>
          {MUSCLE_GROUPS.map((group) => {
            const isSelected = planState.selectedMuscleGroups.some(
              (g) => g.id === group.id
            );

            return (
              <Card
                key={group.id}
                onPress={() => handleToggleMuscleGroup(group)}
                padding="medium"
                elevation={isSelected ? "large" : "medium"}
                style={[
                  styles.muscleGroupCard,
                  isSelected && styles.muscleGroupCardSelected,
                ]}
              >
                <Text style={styles.muscleGroupIcon}>{group.icon}</Text>
                <Text style={styles.muscleGroupName}>{group.name_de}</Text>
                {isSelected && (
                  <View style={styles.muscleGroupCheck}>
                    <Text style={styles.checkmarkText}>✓</Text>
                  </View>
                )}
              </Card>
            );
          })}
        </View>

        <View style={styles.navigationButtons}>
          <Button
            variant="secondary"
            onPress={() => setCurrentStep("days")}
            style={styles.navButton}
          >
            Zurück
          </Button>
          <Button
            variant="primary"
            onPress={() => {
              if (planState.selectedMuscleGroups.length === 0) {
                Alert.alert(
                  "Hinweis",
                  "Bitte wähle mindestens eine Muskelgruppe aus."
                );
                return;
              }
              setCurrentMuscleGroup(planState.selectedMuscleGroups[0]);
              setCurrentStep("exercises");
            }}
            disabled={planState.selectedMuscleGroups.length === 0}
            style={styles.navButton}
          >
            Weiter
          </Button>
        </View>
      </View>
    );
  };

  // ============================================================================
  // Step 3: Exercise Selection
  // ============================================================================

  useEffect(() => {
    if (currentStep === "exercises" && currentMuscleGroup) {
      loadExercisesForMuscleGroup(currentMuscleGroup);
    }
  }, [currentStep, currentMuscleGroup]);

  const loadExercisesForMuscleGroup = async (muscleGroup: MuscleGroup) => {
    setLoading(true);
    try {
      // Load exercises that target this muscle group
      const { data, error } = await supabase
        .from("exercises")
        .select("*")
        .contains("primary_muscles", [muscleGroup.name])
        .order("name_de");

      if (error) {
        console.error("Fehler beim Laden der Übungen:", error);
        Alert.alert("Fehler", "Übungen konnten nicht geladen werden.");
        return;
      }

      setAvailableExercises(data || []);
    } catch (error) {
      console.error("Fehler in loadExercisesForMuscleGroup:", error);
      Alert.alert("Fehler", "Ein unerwarteter Fehler ist aufgetreten.");
    } finally {
      setLoading(false);
    }
  };

  const handleToggleExercise = (exercise: Exercise) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const isSelected = planState.selectedExercises.some(
      (e) => e.exercise.id === exercise.id
    );

    if (isSelected) {
      setPlanState({
        ...planState,
        selectedExercises: planState.selectedExercises.filter(
          (e) => e.exercise.id !== exercise.id
        ),
      });
    } else {
      setPlanState({
        ...planState,
        selectedExercises: [
          ...planState.selectedExercises,
          {
            exercise,
            sets: DEFAULT_SETS,
            repsMin: DEFAULT_REPS_MIN,
            repsMax: DEFAULT_REPS_MAX,
            muscleGroup: currentMuscleGroup!.id,
          },
        ],
      });
    }
  };

  const goToNextMuscleGroup = () => {
    const currentIndex = planState.selectedMuscleGroups.findIndex(
      (g) => g.id === currentMuscleGroup?.id
    );

    if (currentIndex < planState.selectedMuscleGroups.length - 1) {
      // Go to next muscle group
      setCurrentMuscleGroup(planState.selectedMuscleGroups[currentIndex + 1]);
    } else {
      // Done with all muscle groups, go to configure
      setCurrentStep("configure");
    }
  };

  const goToPreviousMuscleGroup = () => {
    const currentIndex = planState.selectedMuscleGroups.findIndex(
      (g) => g.id === currentMuscleGroup?.id
    );

    if (currentIndex > 0) {
      // Go to previous muscle group
      setCurrentMuscleGroup(planState.selectedMuscleGroups[currentIndex - 1]);
    } else {
      // Back to muscle group selection
      setCurrentStep("muscleGroups");
    }
  };

  const renderExercisesStep = () => {
    if (!currentMuscleGroup) return null;

    const currentMuscleGroupIndex = planState.selectedMuscleGroups.findIndex(
      (g) => g.id === currentMuscleGroup.id
    );

    const selectedForCurrentGroup = planState.selectedExercises.filter(
      (e) => e.muscleGroup === currentMuscleGroup.id
    );

    // Filter exercises by equipment if filter is active
    const filteredExercises =
      equipmentFilter.length > 0
        ? availableExercises.filter((ex) =>
            ex.equipment.some((eq) => equipmentFilter.includes(eq))
          )
        : availableExercises;

    return (
      <View style={styles.stepContainer}>
        <Text style={styles.stepTitle}>
          Übungen für {currentMuscleGroup.name_de}
        </Text>
        <Text style={styles.stepSubtitle}>
          Muskelgruppe {currentMuscleGroupIndex + 1} von{" "}
          {planState.selectedMuscleGroups.length}
        </Text>

        {/* Equipment Filter */}
        <View style={styles.filterContainer}>
          <Text style={styles.filterLabel}>Equipment Filter:</Text>
          <View style={styles.filterChips}>
            {["Barbell", "Dumbbell", "Cable", "Bodyweight"].map((equipment) => {
              const isActive = equipmentFilter.includes(equipment);
              return (
                <TouchableOpacity
                  key={equipment}
                  onPress={() => {
                    if (isActive) {
                      setEquipmentFilter(equipmentFilter.filter((e) => e !== equipment));
                    } else {
                      setEquipmentFilter([...equipmentFilter, equipment]);
                    }
                  }}
                  style={[styles.filterChip, isActive && styles.filterChipActive]}
                >
                  <Text
                    style={[
                      styles.filterChipText,
                      isActive && styles.filterChipTextActive,
                    ]}
                  >
                    {equipment}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color={COLORS.primary} />
        ) : (
          <ScrollView style={styles.exercisesList} showsVerticalScrollIndicator={false}>
            {filteredExercises.map((exercise) => {
              const isSelected = planState.selectedExercises.some(
                (e) => e.exercise.id === exercise.id
              );

              return (
                <Card
                  key={exercise.id}
                  onPress={() => handleToggleExercise(exercise)}
                  padding="medium"
                  elevation={isSelected ? "large" : "small"}
                  style={[
                    styles.exerciseCard,
                    isSelected && styles.exerciseCardSelected,
                  ]}
                >
                  <View style={styles.exerciseCardContent}>
                    <View style={styles.exerciseInfo}>
                      <Text style={styles.exerciseName}>{exercise.name_de}</Text>
                      <Text style={styles.exerciseEquipment}>
                        {exercise.equipment.join(", ")}
                      </Text>
                    </View>
                    {isSelected && (
                      <View style={styles.smallCheckmark}>
                        <Text style={styles.checkmarkText}>✓</Text>
                      </View>
                    )}
                  </View>
                </Card>
              );
            })}
          </ScrollView>
        )}

        <View style={styles.selectionInfo}>
          <Text style={styles.selectionInfoText}>
            {selectedForCurrentGroup.length} Übung(en) ausgewählt
          </Text>
        </View>

        <View style={styles.navigationButtons}>
          <Button
            variant="secondary"
            onPress={goToPreviousMuscleGroup}
            style={styles.navButton}
          >
            Zurück
          </Button>
          <Button
            variant="primary"
            onPress={() => {
              if (selectedForCurrentGroup.length === 0) {
                Alert.alert(
                  "Hinweis",
                  `Bitte wähle mindestens eine Übung für ${currentMuscleGroup.name_de} aus.`
                );
                return;
              }
              goToNextMuscleGroup();
            }}
            disabled={selectedForCurrentGroup.length === 0}
            style={styles.navButton}
          >
            {currentMuscleGroupIndex < planState.selectedMuscleGroups.length - 1
              ? "Weiter"
              : "Fertig"}
          </Button>
        </View>
      </View>
    );
  };

  // ============================================================================
  // Step 4: Configure Sets & Reps
  // ============================================================================

  const updateExerciseConfig = (
    exerciseId: string,
    field: "sets" | "repsMin" | "repsMax",
    value: number
  ) => {
    setPlanState({
      ...planState,
      selectedExercises: planState.selectedExercises.map((ex) =>
        ex.exercise.id === exerciseId ? { ...ex, [field]: value } : ex
      ),
    });
  };

  const renderConfigureStep = () => {
    return (
      <View style={styles.stepContainer}>
        <Text style={styles.stepTitle}>Sets & Wiederholungen konfigurieren</Text>
        <Text style={styles.stepSubtitle}>
          Passe die Werte für jede Übung an (oder behalte die Standardwerte)
        </Text>

        <ScrollView style={styles.configureList} showsVerticalScrollIndicator={false}>
          {planState.selectedExercises.map((selectedEx) => (
            <Card key={selectedEx.exercise.id} padding="medium" style={styles.configCard}>
              <Text style={styles.configExerciseName}>
                {selectedEx.exercise.name_de}
              </Text>
              <Text style={styles.configMuscleGroup}>
                {
                  MUSCLE_GROUPS.find((g) => g.id === selectedEx.muscleGroup)
                    ?.name_de
                }
              </Text>

              <View style={styles.configInputs}>
                {/* Sets */}
                <View style={styles.configInputGroup}>
                  <Text style={styles.configLabel}>Sätze</Text>
                  <View style={styles.numberInput}>
                    <TouchableOpacity
                      onPress={() =>
                        updateExerciseConfig(
                          selectedEx.exercise.id,
                          "sets",
                          Math.max(1, selectedEx.sets - 1)
                        )
                      }
                      style={styles.numberButton}
                    >
                      <Text style={styles.numberButtonText}>-</Text>
                    </TouchableOpacity>
                    <Text style={styles.numberValue}>{selectedEx.sets}</Text>
                    <TouchableOpacity
                      onPress={() =>
                        updateExerciseConfig(
                          selectedEx.exercise.id,
                          "sets",
                          Math.min(10, selectedEx.sets + 1)
                        )
                      }
                      style={styles.numberButton}
                    >
                      <Text style={styles.numberButtonText}>+</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Reps Min */}
                <View style={styles.configInputGroup}>
                  <Text style={styles.configLabel}>Wdh Min</Text>
                  <View style={styles.numberInput}>
                    <TouchableOpacity
                      onPress={() =>
                        updateExerciseConfig(
                          selectedEx.exercise.id,
                          "repsMin",
                          Math.max(1, selectedEx.repsMin - 1)
                        )
                      }
                      style={styles.numberButton}
                    >
                      <Text style={styles.numberButtonText}>-</Text>
                    </TouchableOpacity>
                    <Text style={styles.numberValue}>{selectedEx.repsMin}</Text>
                    <TouchableOpacity
                      onPress={() =>
                        updateExerciseConfig(
                          selectedEx.exercise.id,
                          "repsMin",
                          Math.min(selectedEx.repsMax, selectedEx.repsMin + 1)
                        )
                      }
                      style={styles.numberButton}
                    >
                      <Text style={styles.numberButtonText}>+</Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Reps Max */}
                <View style={styles.configInputGroup}>
                  <Text style={styles.configLabel}>Wdh Max</Text>
                  <View style={styles.numberInput}>
                    <TouchableOpacity
                      onPress={() =>
                        updateExerciseConfig(
                          selectedEx.exercise.id,
                          "repsMax",
                          Math.max(selectedEx.repsMin, selectedEx.repsMax - 1)
                        )
                      }
                      style={styles.numberButton}
                    >
                      <Text style={styles.numberButtonText}>-</Text>
                    </TouchableOpacity>
                    <Text style={styles.numberValue}>{selectedEx.repsMax}</Text>
                    <TouchableOpacity
                      onPress={() =>
                        updateExerciseConfig(
                          selectedEx.exercise.id,
                          "repsMax",
                          Math.min(50, selectedEx.repsMax + 1)
                        )
                      }
                      style={styles.numberButton}
                    >
                      <Text style={styles.numberButtonText}>+</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </Card>
          ))}
        </ScrollView>

        <View style={styles.navigationButtons}>
          <Button
            variant="secondary"
            onPress={() => {
              setCurrentMuscleGroup(
                planState.selectedMuscleGroups[
                  planState.selectedMuscleGroups.length - 1
                ]
              );
              setCurrentStep("exercises");
            }}
            style={styles.navButton}
          >
            Zurück
          </Button>
          <Button
            variant="primary"
            onPress={() => setCurrentStep("preview")}
            style={styles.navButton}
          >
            Weiter
          </Button>
        </View>
      </View>
    );
  };

  // ============================================================================
  // Step 5: Preview & Create
  // ============================================================================

  const handleCreatePlan = async () => {
    if (!planState.planName.trim()) {
      Alert.alert("Hinweis", "Bitte gib deinem Plan einen Namen.");
      return;
    }

    setLoading(true);
    try {
      // Get user
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error("Nicht angemeldet");
      }

      // Deactivate other plans
      const { error: deactivateError } = await supabase
        .from("training_plans")
        .update({ status: "inactive" })
        .eq("user_id", user.id);

      if (deactivateError) {
        console.error("Fehler beim Deaktivieren alter Pläne:", deactivateError);
      }

      // Create the plan
      const { data: newPlan, error: planError } = await supabase
        .from("training_plans")
        .insert({
          user_id: user.id,
          name: planState.planName,
          plan_type: "custom",
          days_per_week: planState.daysPerWeek!,
          status: "active",
          start_date: new Date().toISOString(),
        })
        .select()
        .single();

      if (planError || !newPlan) {
        throw new Error("Plan konnte nicht erstellt werden");
      }

      // Distribute exercises across workouts intelligently
      const workouts = distributeExercisesToWorkouts(
        planState.selectedExercises,
        planState.daysPerWeek!,
        planState.selectedMuscleGroups
      );

      // Create workouts
      for (let i = 0; i < workouts.length; i++) {
        const workout = workouts[i];

        const { data: newWorkout, error: workoutError } = await supabase
          .from("plan_workouts")
          .insert({
            plan_id: newPlan.id,
            name: workout.name,
            name_de: workout.name_de,
            day_number: i + 1,
            week_number: 1,
            focus: workout.focus,
          })
          .select()
          .single();

        if (workoutError || !newWorkout) {
          throw new Error("Workout konnte nicht erstellt werden");
        }

        // Create exercises for this workout
        const exercisesToInsert = workout.exercises.map((ex, index) => ({
          workout_id: newWorkout.id,
          exercise_id: ex.exercise.id,
          exercise_order: index + 1,
          sets: ex.sets,
          reps_min: ex.repsMin,
          reps_max: ex.repsMax,
          is_optional: false,
          can_substitute: true,
        }));

        const { error: exercisesError } = await supabase
          .from("plan_exercises")
          .insert(exercisesToInsert);

        if (exercisesError) {
          throw new Error("Übungen konnten nicht erstellt werden");
        }
      }

      // Success!
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert(
        "Plan erstellt!",
        `Dein individueller Plan "${planState.planName}" wurde erfolgreich erstellt.`,
        [
          {
            text: "OK",
            onPress: () => {
              navigation.navigate("TrainingDashboard");
            },
          },
        ]
      );
    } catch (error) {
      console.error("Fehler beim Erstellen des Plans:", error);
      Alert.alert(
        "Fehler",
        "Plan konnte nicht erstellt werden. Bitte versuche es erneut."
      );
    } finally {
      setLoading(false);
    }
  };

  const renderPreviewStep = () => {
    const totalExercises = planState.selectedExercises.length;
    const exercisesPerWorkout = Math.ceil(
      totalExercises / (planState.daysPerWeek || 1)
    );

    return (
      <View style={styles.stepContainer}>
        <Text style={styles.stepTitle}>Plan-Vorschau</Text>
        <Text style={styles.stepSubtitle}>
          Überprüfe deinen Plan und gib ihm einen Namen
        </Text>

        <ScrollView style={styles.previewScroll} showsVerticalScrollIndicator={false}>
          {/* Plan Name Input */}
          <Card padding="medium" style={styles.nameCard}>
            <Text style={styles.nameLabel}>Plan-Name</Text>
            <TextInput
              style={styles.nameInput}
              placeholder="z.B. Mein Custom Plan"
              value={planState.planName}
              onChangeText={(text) =>
                setPlanState({ ...planState, planName: text })
              }
              placeholderTextColor={COLORS.textSecondary}
            />
          </Card>

          {/* Plan Stats */}
          <Card padding="large">
            <Text style={styles.previewSectionTitle}>Übersicht</Text>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>📅 Trainingstage:</Text>
              <Text style={styles.statValue}>
                {planState.daysPerWeek} pro Woche
              </Text>
            </View>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>💪 Muskelgruppen:</Text>
              <Text style={styles.statValue}>
                {planState.selectedMuscleGroups.length}
              </Text>
            </View>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>🏋️ Übungen gesamt:</Text>
              <Text style={styles.statValue}>{totalExercises}</Text>
            </View>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>📊 Übungen pro Workout:</Text>
              <Text style={styles.statValue}>~{exercisesPerWorkout}</Text>
            </View>
          </Card>

          {/* Muscle Groups */}
          <Card padding="large">
            <Text style={styles.previewSectionTitle}>Muskelgruppen</Text>
            <View style={styles.muscleGroupsList}>
              {planState.selectedMuscleGroups.map((group) => {
                const count = planState.selectedExercises.filter(
                  (ex) => ex.muscleGroup === group.id
                ).length;

                return (
                  <View key={group.id} style={styles.muscleGroupRow}>
                    <Text style={styles.muscleGroupRowIcon}>{group.icon}</Text>
                    <Text style={styles.muscleGroupRowName}>{group.name_de}</Text>
                    <Text style={styles.muscleGroupRowCount}>
                      {count} Übung{count !== 1 ? "en" : ""}
                    </Text>
                  </View>
                );
              })}
            </View>
          </Card>
        </ScrollView>

        <View style={styles.navigationButtons}>
          <Button
            variant="secondary"
            onPress={() => setCurrentStep("configure")}
            style={styles.navButton}
          >
            Zurück
          </Button>
          <Button
            variant="primary"
            onPress={handleCreatePlan}
            disabled={loading || !planState.planName.trim()}
            style={styles.navButton}
          >
            {loading ? "Erstelle..." : "Plan erstellen"}
          </Button>
        </View>
      </View>
    );
  };

  // ============================================================================
  // Render
  // ============================================================================

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Progress Bar */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
          </View>
          <Text style={styles.progressText}>
            {currentStep === "days" && "Schritt 1 von 5"}
            {currentStep === "muscleGroups" && "Schritt 2 von 5"}
            {currentStep === "exercises" && "Schritt 3 von 5"}
            {currentStep === "configure" && "Schritt 4 von 5"}
            {currentStep === "preview" && "Schritt 5 von 5"}
          </Text>
        </View>

        {/* Step Content */}
        {currentStep === "days" && renderDaysStep()}
        {currentStep === "muscleGroups" && renderMuscleGroupsStep()}
        {currentStep === "exercises" && renderExercisesStep()}
        {currentStep === "configure" && renderConfigureStep()}
        {currentStep === "preview" && renderPreviewStep()}
      </View>
    </SafeAreaView>
  );
};

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Distributes exercises to workouts based on muscle groups and training frequency
 */
function distributeExercisesToWorkouts(
  exercises: SelectedExercise[],
  daysPerWeek: number,
  muscleGroups: MuscleGroup[]
): Array<{
  name: string;
  name_de: string;
  focus: string;
  exercises: SelectedExercise[];
}> {
  const workouts: Array<{
    name: string;
    name_de: string;
    focus: string;
    exercises: SelectedExercise[];
  }> = [];

  // Group exercises by muscle group
  const exercisesByMuscle: Record<string, SelectedExercise[]> = {};
  exercises.forEach((ex) => {
    if (!exercisesByMuscle[ex.muscleGroup]) {
      exercisesByMuscle[ex.muscleGroup] = [];
    }
    exercisesByMuscle[ex.muscleGroup].push(ex);
  });

  // Create balanced workouts
  if (daysPerWeek <= 3) {
    // Full body workouts - distribute all muscle groups across workouts
    for (let i = 0; i < daysPerWeek; i++) {
      const workoutExercises: SelectedExercise[] = [];

      muscleGroups.forEach((group) => {
        const groupExercises = exercisesByMuscle[group.id] || [];
        const exercisesPerWorkout = Math.ceil(groupExercises.length / daysPerWeek);
        const start = i * exercisesPerWorkout;
        const end = start + exercisesPerWorkout;

        workoutExercises.push(...groupExercises.slice(start, end));
      });

      workouts.push({
        name: `Full Body ${String.fromCharCode(65 + i)}`,
        name_de: `Ganzkörper ${String.fromCharCode(65 + i)}`,
        focus: "Full Body",
        exercises: workoutExercises,
      });
    }
  } else {
    // Split workouts - assign muscle groups to specific days
    const muscleGroupsPerDay = Math.ceil(muscleGroups.length / daysPerWeek);

    for (let i = 0; i < daysPerWeek; i++) {
      const start = i * muscleGroupsPerDay;
      const end = start + muscleGroupsPerDay;
      const dayMuscleGroups = muscleGroups.slice(start, end);

      const workoutExercises: SelectedExercise[] = [];
      dayMuscleGroups.forEach((group) => {
        workoutExercises.push(...(exercisesByMuscle[group.id] || []));
      });

      const focusNames = dayMuscleGroups.map((g) => g.name_de).join(" & ");

      workouts.push({
        name: `Day ${i + 1}`,
        name_de: `Tag ${i + 1}`,
        focus: focusNames,
        exercises: workoutExercises,
      });
    }
  }

  return workouts.filter((w) => w.exercises.length > 0);
}

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  progressContainer: {
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.lg,
  },
  progressBar: {
    height: 6,
    backgroundColor: "#E5E5EA",
    borderRadius: 3,
    overflow: "hidden",
    marginBottom: SPACING.sm,
  },
  progressFill: {
    height: "100%",
    backgroundColor: COLORS.primary,
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: "center",
  },
  stepContainer: {
    flex: 1,
    paddingHorizontal: SPACING.md,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: SPACING.sm,
    lineHeight: 32,
  },
  stepSubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: SPACING.lg,
    lineHeight: 20,
  },
  optionsContainer: {
    gap: SPACING.md,
    marginBottom: SPACING.xl,
  },
  optionCard: {
    position: "relative",
  },
  optionCardSelected: {
    backgroundColor: COLORS.selected,
    borderWidth: 2,
    borderColor: COLORS.selectedBorder,
  },
  daysNumber: {
    fontSize: 32,
    fontWeight: "700",
    color: COLORS.primary,
    textAlign: "center",
  },
  daysLabel: {
    fontSize: 16,
    color: COLORS.text,
    textAlign: "center",
    marginTop: SPACING.sm,
  },
  checkmark: {
    position: "absolute",
    top: 12,
    right: 12,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  checkmarkText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "700",
  },
  navigationButtons: {
    flexDirection: "row",
    gap: SPACING.md,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.background,
  },
  navButton: {
    flex: 1,
  },
  muscleGroupsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: SPACING.md,
    marginBottom: SPACING.xl,
  },
  muscleGroupCard: {
    width: "47%",
    alignItems: "center",
    position: "relative",
  },
  muscleGroupCardSelected: {
    backgroundColor: COLORS.selected,
    borderWidth: 2,
    borderColor: COLORS.selectedBorder,
  },
  muscleGroupIcon: {
    fontSize: 40,
    marginBottom: SPACING.sm,
  },
  muscleGroupName: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.text,
    textAlign: "center",
  },
  muscleGroupCheck: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  filterContainer: {
    marginBottom: SPACING.md,
  },
  filterLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  filterChips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: SPACING.sm,
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: "#E5E5EA",
  },
  filterChipActive: {
    backgroundColor: COLORS.primary,
  },
  filterChipText: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.text,
  },
  filterChipTextActive: {
    color: "#FFFFFF",
  },
  exercisesList: {
    flex: 1,
    marginBottom: SPACING.md,
  },
  exerciseCard: {
    marginBottom: SPACING.sm,
  },
  exerciseCardSelected: {
    backgroundColor: COLORS.selected,
    borderWidth: 2,
    borderColor: COLORS.selectedBorder,
  },
  exerciseCardContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  exerciseInfo: {
    flex: 1,
  },
  exerciseName: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.text,
    marginBottom: 4,
  },
  exerciseEquipment: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  smallCheckmark: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  selectionInfo: {
    paddingVertical: SPACING.sm,
    alignItems: "center",
  },
  selectionInfoText: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.textSecondary,
  },
  configureList: {
    flex: 1,
    marginBottom: SPACING.md,
  },
  configCard: {
    marginBottom: SPACING.md,
  },
  configExerciseName: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.text,
    marginBottom: 4,
  },
  configMuscleGroup: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: SPACING.md,
  },
  configInputs: {
    flexDirection: "row",
    gap: SPACING.md,
  },
  configInputGroup: {
    flex: 1,
  },
  configLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
  },
  numberInput: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  numberButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  numberButtonText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "700",
  },
  numberValue: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.text,
    minWidth: 32,
    textAlign: "center",
  },
  previewScroll: {
    flex: 1,
    marginBottom: SPACING.md,
  },
  nameCard: {
    marginBottom: SPACING.md,
  },
  nameLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  nameInput: {
    fontSize: 16,
    color: COLORS.text,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    backgroundColor: "#F5F5F5",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  previewSectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  statRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: SPACING.sm,
  },
  statLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  statValue: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.text,
  },
  muscleGroupsList: {
    gap: SPACING.sm,
  },
  muscleGroupRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  muscleGroupRowIcon: {
    fontSize: 20,
    marginRight: SPACING.sm,
  },
  muscleGroupRowName: {
    flex: 1,
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.text,
  },
  muscleGroupRowCount: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
});
