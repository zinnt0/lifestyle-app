/**
 * Workout Session Screen
 *
 * Active workout tracking screen:
 * - Exercise carousel (simple navigation for now)
 * - Set logging with expandable rows
 * - Progress tracking
 * - Exercise completion with haptic feedback
 * - Workout completion modal
 */

import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  FlatList,
  Image,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Dimensions,
  ViewToken,
  AppState,
  AppStateStatus,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import * as Haptics from "expo-haptics";
import { TrainingStackParamList } from "@/navigation/types";
import { trainingService } from "@/services/trainingService";
import { oneRMService } from "@/services/oneRMService";
import { supabase } from "@/lib/supabase";
import type { SessionExercise, TrainingPlan } from "@/types/training.types";
import { ProgressBar } from "@/components/training/ProgressBar";
import { SetRow } from "@/components/training/SetRow";
import { PaginationDots } from "@/components/training/PaginationDots";
import { Button } from "@/components/ui/Button";
import { AlternativesModal } from "@/components/training/AlternativesModal";

type Props = NativeStackScreenProps<TrainingStackParamList, "WorkoutSession">;

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CARD_PADDING = 20;
const CARD_WIDTH = SCREEN_WIDTH - CARD_PADDING * 2;

export const WorkoutSessionScreen: React.FC<Props> = ({
  route,
  navigation,
}) => {
  const { sessionId } = route.params;

  // Refs
  const flatListRef = useRef<FlatList<SessionExercise>>(null);

  // State
  const [exercises, setExercises] = useState<SessionExercise[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [expandedSet, setExpandedSet] = useState<number | null>(null);
  const [showAlternatives, setShowAlternatives] = useState(false);
  const [selectedExerciseId, setSelectedExerciseId] = useState<string | null>(
    null
  );
  const [pendingSets, setPendingSets] = useState<
    Record<
      string,
      Record<number, { weight: number; reps: number; rir?: number }>
    >
  >({});
  const [plan, setPlan] = useState<TrainingPlan | null>(null);
  const [recommendedWeights, setRecommendedWeights] = useState<
    Record<string, number | null>
  >({});
  const [trainingMaxes, setTrainingMaxes] = useState<
    Record<string, number | null>
  >({});
  const [userId, setUserId] = useState<string | null>(null);

  // Current exercise
  const currentExercise = exercises[currentIndex];

  // Progress calculation
  const progress = useMemo(() => {
    if (exercises.length === 0) return 0;
    const completedCount = exercises.filter((ex) => ex.is_completed).length;
    return (completedCount / exercises.length) * 100;
  }, [exercises]);

  // Viewability config for tracking current card
  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50,
  }).current;

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (viewableItems.length > 0 && viewableItems[0].index !== null) {
        setCurrentIndex(viewableItems[0].index);
        setExpandedSet(null); // Reset expanded state on card change
      }
    }
  ).current;

  // Load session exercises on mount
  useEffect(() => {
    loadSession();
  }, [sessionId]);

  // Auto-scroll to first incomplete exercise
  useEffect(() => {
    if (exercises.length > 0 && currentIndex === 0) {
      const firstIncomplete = exercises.findIndex((ex) => !ex.is_completed);
      if (firstIncomplete !== -1) {
        setCurrentIndex(firstIncomplete);
      }
    }
  }, [exercises]);

  // Auto-pause when app goes to background or component unmounts
  useEffect(() => {
    let isPausing = false; // Flag to prevent duplicate pause calls

    const handleAppStateChange = async (nextAppState: AppStateStatus) => {
      if (nextAppState === "background" || nextAppState === "inactive") {
        if (isPausing) {
          console.log("Pausierung läuft bereits, überspringe");
          return;
        }
        // App goes to background - pause the session
        try {
          isPausing = true;
          await trainingService.pauseWorkoutSession(sessionId);
        } catch (error) {
          console.error("Fehler beim automatischen Pausieren:", error);
        } finally {
          isPausing = false;
        }
      }
    };

    const subscription = AppState.addEventListener(
      "change",
      handleAppStateChange
    );

    // Cleanup: Pause session when component unmounts (user navigates away)
    return () => {
      subscription.remove();
      // Only pause on unmount if not already pausing
      if (!isPausing) {
        trainingService.pauseWorkoutSession(sessionId).catch((error) => {
          console.error("Fehler beim Pausieren beim Verlassen:", error);
        });
      }
    };
  }, [sessionId]);

  /**
   * Load session exercises and calculate recommended weights for dynamic plans
   */
  const loadSession = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setError("Nicht angemeldet");
        return;
      }

      setUserId(user.id);

      // Load session exercises
      const sessionExercises = await trainingService.getSessionExercises(
        sessionId
      );

      if (!sessionExercises || sessionExercises.length === 0) {
        setError("Keine Übungen für dieses Workout gefunden");
        return;
      }

      // Load session to get plan_id
      const { data: session, error: sessionError } = await supabase
        .from("workout_sessions")
        .select("plan_id")
        .eq("id", sessionId)
        .single();

      if (sessionError || !session) {
        setError("Session konnte nicht geladen werden");
        return;
      }

      // Load plan to check if it's dynamic
      const { data: planData, error: planError } = await supabase
        .from("training_plans")
        .select("*, template:plan_templates(is_dynamic, tm_percentage)")
        .eq("id", session.plan_id)
        .single();

      if (planError || !planData) {
        console.error("Plan konnte nicht geladen werden:", planError);
        // Continue without plan data - not critical
      } else {
        setPlan(planData);

        // Check if plan is dynamic
        const isDynamic =
          planData.tm_percentage !== null &&
          planData.tm_percentage !== undefined;

        if (isDynamic) {
          // Calculate recommended weights and training maxes for each exercise
          const weights: Record<string, number | null> = {};
          const tms: Record<string, number | null> = {};

          for (const exercise of sessionExercises) {
            // Calculate weights for exercises with percentage_1rm OR set_configurations
            if (
              exercise.percentage_1rm ||
              (exercise.set_configurations &&
                exercise.set_configurations.length > 0)
            ) {
              try {
                // Get the Training Max (TM) for set_configurations
                // TM = 1RM * tm_percentage (e.g. 90% of 1RM)
                const trainingMax = await oneRMService.calculateWorkingWeight(
                  user.id,
                  exercise.exercise_id,
                  100, // 100% to get the full TM
                  planData.tm_percentage || 100
                );
                tms[exercise.exercise_id] = trainingMax;
                console.log(
                  "[WorkoutSession] Training Max for",
                  exercise.exercise_id,
                  ":",
                  trainingMax
                );

                // Calculate recommended weight if percentage_1rm is set (for non-set_configurations exercises)
                if (exercise.percentage_1rm) {
                  const recommendedWeight =
                    await oneRMService.calculateWorkingWeight(
                      user.id,
                      exercise.exercise_id,
                      exercise.percentage_1rm,
                      planData.tm_percentage || 100
                    );

                  console.log(
                    "[WorkoutSession] Received weight for",
                    exercise.exercise_id,
                    ":",
                    recommendedWeight,
                    "type:",
                    typeof recommendedWeight
                  );
                  weights[exercise.exercise_id] = recommendedWeight;
                }
              } catch (weightError) {
                console.error(
                  `Fehler beim Berechnen des Gewichts für Exercise ${exercise.exercise_id}:`,
                  weightError
                );
                weights[exercise.exercise_id] = null;
                tms[exercise.exercise_id] = null;
              }
            }
          }

          setRecommendedWeights(weights);
          setTrainingMaxes(tms);
        }
      }

      setExercises(sessionExercises);
    } catch (err) {
      console.error("Fehler beim Laden der Session:", err);
      setError("Workout konnte nicht geladen werden");
    } finally {
      setLoading(false);
    }
  };

  /**
   * Handle set logging (now just stores in local state)
   */
  const handleSetLog = (
    exerciseId: string,
    setNumber: number,
    weight: number,
    reps: number,
    rir?: number
  ) => {
    setPendingSets((prev) => ({
      ...prev,
      [exerciseId]: {
        ...prev[exerciseId],
        [setNumber]: { weight, reps, rir },
      },
    }));
  };

  /**
   * Handle exercise completion
   */
  const handleExerciseComplete = async (exerciseId: string) => {
    const exercise = exercises.find((ex) => ex.exercise_id === exerciseId);
    if (!exercise) return;

    const pendingSetsForExercise = pendingSets[exerciseId] || {};
    const totalSetsCount =
      exercise.completed_sets.length +
      Object.keys(pendingSetsForExercise).length;

    // Check if all sets are logged
    if (totalSetsCount < exercise.sets) {
      Alert.alert(
        "Unvollständige Übung",
        `Du hast erst ${totalSetsCount} von ${exercise.sets} Sätzen absolviert. Möchtest du trotzdem fortfahren?`,
        [
          { text: "Abbrechen", style: "cancel" },
          { text: "Fortfahren", onPress: () => completeExercise(exerciseId) },
        ]
      );
      return;
    }

    completeExercise(exerciseId);
  };

  /**
   * Complete exercise and advance
   */
  const completeExercise = async (exerciseId: string) => {
    try {
      // Save all pending sets for this exercise
      const pendingSetsForExercise = pendingSets[exerciseId] || {};

      for (const [setNumberStr, setData] of Object.entries(
        pendingSetsForExercise
      )) {
        const setNumber = parseInt(setNumberStr);
        await trainingService.logSet(
          sessionId,
          exerciseId,
          setNumber,
          setData.weight,
          setData.reps,
          setData.rir
        );
      }

      // Clear pending sets for this exercise
      setPendingSets((prev) => {
        const newPendingSets = { ...prev };
        delete newPendingSets[exerciseId];
        return newPendingSets;
      });

      // Haptic feedback
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      // Reload session to get updated data
      await loadSession();

      // Mark as completed locally
      const updatedExercises = exercises.map((ex) =>
        ex.exercise_id === exerciseId ? { ...ex, is_completed: true } : ex
      );
      setExercises(updatedExercises);

      // Check if this was the last exercise
      const allCompleted = updatedExercises.every((ex) => ex.is_completed);

      if (allCompleted) {
        // Last exercise → show completion modal
        showCompletionModal();
      } else if (currentIndex < exercises.length - 1) {
        // Auto-advance to next exercise with smooth scroll
        setTimeout(() => {
          flatListRef.current?.scrollToIndex({
            index: currentIndex + 1,
            animated: true,
          });
        }, 500); // Small delay for better UX
      }
    } catch (err) {
      console.error("Fehler beim Speichern der Sets:", err);
      Alert.alert("Fehler", "Sets konnten nicht gespeichert werden");
    }
  };

  /**
   * Show completion modal
   */
  const showCompletionModal = () => {
    Alert.alert(
      "Workout abgeschlossen!",
      "Glückwunsch! Du hast alle Übungen geschafft.",
      [
        {
          text: "Statistiken ansehen",
          onPress: async () => {
            // Complete the session first, then navigate to summary
            await completeWorkout(true);
          },
        },
        {
          text: "Fertig",
          onPress: async () => {
            await completeWorkout();
          },
        },
      ]
    );
  };

  /**
   * Complete the workout session
   * @param showSummary - If true, navigate to summary screen instead of dashboard
   */
  const completeWorkout = async (showSummary: boolean = false) => {
    try {
      await trainingService.completeWorkoutSession(sessionId);

      if (showSummary) {
        navigation.replace("WorkoutSummary", { sessionId });
      } else {
        navigation.navigate("TrainingDashboard");
      }
    } catch (err) {
      console.error("Fehler beim Abschließen des Workouts:", err);
      Alert.alert("Fehler", "Workout konnte nicht abgeschlossen werden");
    }
  };

  /**
   * Handle navigation between exercises
   */
  const handlePrevious = () => {
    if (currentIndex > 0) {
      flatListRef.current?.scrollToIndex({
        index: currentIndex - 1,
        animated: true,
      });
    }
  };

  const handleNext = () => {
    if (currentIndex < exercises.length - 1) {
      flatListRef.current?.scrollToIndex({
        index: currentIndex + 1,
        animated: true,
      });
    }
  };

  /**
   * Close workout with confirmation
   */
  const handleClose = () => {
    Alert.alert(
      "Workout verlassen?",
      "Möchtest du das Workout pausieren oder komplett abbrechen?",
      [
        {
          text: "Zurück",
          style: "cancel",
        },
        {
          text: "Pausieren",
          onPress: async () => {
            try {
              await trainingService.pauseWorkoutSession(sessionId);
              navigation.goBack();
            } catch (error) {
              console.error("Fehler beim Pausieren:", error);
              Alert.alert("Fehler", "Workout konnte nicht pausiert werden");
            }
          },
        },
        {
          text: "Abbrechen",
          style: "destructive",
          onPress: async () => {
            try {
              await trainingService.cancelWorkoutSession(sessionId);
              navigation.goBack();
            } catch (error) {
              console.error("Fehler beim Abbrechen:", error);
              Alert.alert("Fehler", "Workout konnte nicht abgebrochen werden");
            }
          },
        },
      ]
    );
  };

  /**
   * Handle exercise name press to show alternatives
   */
  const handleExerciseNamePress = (exerciseId: string) => {
    setSelectedExerciseId(exerciseId);
    setShowAlternatives(true);
  };

  /**
   * Handle exercise substitution
   */
  const handleSubstitute = async (alternativeExerciseId: string) => {
    if (!selectedExerciseId) return;

    try {
      // Update the exercise in the plan_exercises table
      const currentExercise = exercises.find(
        (ex) => ex.exercise_id === selectedExerciseId
      );

      if (!currentExercise) {
        throw new Error("Exercise nicht gefunden");
      }

      const { error: updateError } = await supabase
        .from("plan_exercises")
        .update({ exercise_id: alternativeExerciseId })
        .eq("id", currentExercise.id);

      if (updateError) {
        console.error("Fehler beim Ersetzen der Exercise:", updateError);
        throw new Error("Exercise konnte nicht ersetzt werden");
      }

      // Optional: Log substitution (if table exists)
      try {
        await supabase.from("workout_exercise_substitutions").insert({
          session_id: sessionId,
          original_exercise_id: selectedExerciseId,
          substitute_exercise_id: alternativeExerciseId,
          reason: "user_preference",
        });
      } catch (logError) {
        // Silently ignore if table doesn't exist
      }

      // Reload session to show updated exercise
      await loadSession();

      // Success feedback
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert("Erfolg", "Übung wurde erfolgreich ersetzt");
    } catch (err) {
      console.error("Fehler beim Ersetzen der Exercise:", err);
      Alert.alert("Fehler", "Übung konnte nicht ersetzt werden");
    }
  };

  /**
   * Render individual exercise card
   */
  const renderExerciseCard = ({
    item: exercise,
  }: {
    item: SessionExercise;
  }) => {
    // Extract recommended weight with proper type checking
    const recommendedWeight = recommendedWeights[exercise.exercise_id];
    const trainingMax = trainingMaxes[exercise.exercise_id];
    const hasValidRecommendedWeight =
      (typeof recommendedWeight === "number" ||
        typeof trainingMax === "number") &&
      (exercise.percentage_1rm != null ||
        (exercise.set_configurations &&
          exercise.set_configurations.length > 0));

    return (
      <View style={styles.carouselCard}>
        <ScrollView
          style={styles.cardScrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.cardContent}
        >
          <View style={styles.exerciseCard}>
            {/* Exercise Image */}
            {exercise.exercise?.video_url && (
              <View style={styles.imageContainer}>
                <Image
                  source={{ uri: exercise.exercise.video_url }}
                  style={styles.exerciseImage}
                  resizeMode="cover"
                />
              </View>
            )}

            {/* Exercise Name - Touchable for alternatives */}
            <TouchableOpacity
              onPress={() => handleExerciseNamePress(exercise.exercise_id)}
              activeOpacity={0.7}
            >
              <Text style={styles.exerciseName}>
                {exercise.exercise?.name_de || exercise.exercise?.name}
              </Text>
              {/* Label for assistance exercises (only for dynamic plans without percentage) */}
              {plan?.template?.is_dynamic &&
                !exercise.percentage_1rm &&
                !(
                  exercise.set_configurations &&
                  exercise.set_configurations.length > 0
                ) && <Text style={styles.assistanceLabel}>Zusatzübung</Text>}
              <Text style={styles.alternativesHint}>
                Tippen für Alternativen
              </Text>
            </TouchableOpacity>

            {/* Exercise Info */}
            <Text style={styles.exerciseInfo}>
              {exercise.set_configurations &&
              exercise.set_configurations.length > 0 ? (
                // Show set-specific reps for set_configurations
                <>
                  {exercise.sets} Sätze •{" "}
                  {exercise.set_configurations.map((config, idx) => (
                    <Text key={idx}>
                      {config.reps}
                      {config.is_amrap ? "+" : ""}
                      {idx < exercise.set_configurations!.length - 1 ? "/" : ""}
                    </Text>
                  ))}{" "}
                  Wdh
                  {exercise.rest_seconds && (
                    <Text style={styles.restTimeInline}>
                      {" "}
                      • {Math.floor(exercise.rest_seconds / 60)}:
                      {String(exercise.rest_seconds % 60).padStart(2, "0")}{" "}
                      Pause
                    </Text>
                  )}
                </>
              ) : (
                // Standard display for regular exercises
                <>
                  {exercise.sets} Sätze •{" "}
                  {exercise.reps_min && exercise.reps_max
                    ? `${exercise.reps_min}-${exercise.reps_max} Wdh`
                    : exercise.reps_target
                    ? `${exercise.reps_target} Wdh`
                    : "Wiederholungen"}
                  {exercise.rest_seconds && (
                    <Text style={styles.restTimeInline}>
                      {" "}
                      • {Math.floor(exercise.rest_seconds / 60)}:
                      {String(exercise.rest_seconds % 60).padStart(2, "0")}{" "}
                      Pause
                    </Text>
                  )}
                </>
              )}
            </Text>

            {/* Recommended Weight for Dynamic Plans (only for non-set_configurations exercises) */}
            {hasValidRecommendedWeight &&
              !(
                exercise.set_configurations &&
                exercise.set_configurations.length > 0
              ) && (
                <View style={styles.recommendedWeightContainer}>
                  <Text style={styles.recommendedWeightLabel}>
                    💡 Empfohlen:
                  </Text>
                  <Text style={styles.recommendedWeightValue}>
                    {(recommendedWeight ?? 0).toFixed(1)} kg
                  </Text>
                  <Text style={styles.recommendedWeightPercentage}>
                    ({exercise.percentage_1rm}% vom TM)
                  </Text>
                </View>
              )}

            {/* Sets */}
            <View style={styles.setsContainer}>
              {exercise.set_configurations &&
              exercise.set_configurations.length > 0
                ? // 5/3/1 style with set_configurations
                  exercise.set_configurations.map((config) => {
                    const setNumber = config.set_number;
                    const completedSet = exercise.completed_sets.find(
                      (s) => s.set_number === setNumber
                    );
                    const pendingSet =
                      pendingSets[exercise.exercise_id]?.[setNumber];

                    // Calculate weight for this specific set from Training Max
                    // Formula: TM * (percentage / 100), rounded to nearest 2.5kg
                    const trainingMax = trainingMaxes[exercise.exercise_id];
                    const setWeight = trainingMax
                      ? Math.round(
                          (trainingMax * config.percentage_1rm) / 100 / 2.5
                        ) * 2.5
                      : undefined;

                    return (
                      <SetRow
                        key={setNumber}
                        setNumber={setNumber}
                        targetWeight={setWeight}
                        targetReps={config.reps}
                        rirTarget={exercise.rir_target}
                        isExpanded={expandedSet === setNumber}
                        onToggle={() =>
                          setExpandedSet(
                            expandedSet === setNumber ? null : setNumber
                          )
                        }
                        onLog={(weight, reps, rir) =>
                          handleSetLog(
                            exercise.exercise_id,
                            setNumber,
                            weight,
                            reps,
                            rir
                          )
                        }
                        completedSet={completedSet}
                        pendingSet={pendingSet}
                        isAMRAP={config.is_amrap}
                        setNotes={config.notes}
                        percentageLabel={`${config.percentage_1rm}%`}
                      />
                    );
                  })
                : // Standard sets (all the same)
                  Array.from({ length: exercise.sets }).map((_, index) => {
                    const setNumber = index + 1;
                    const completedSet = exercise.completed_sets.find(
                      (s) => s.set_number === setNumber
                    );
                    const pendingSet =
                      pendingSets[exercise.exercise_id]?.[setNumber];
                    const recommendedWeight =
                      recommendedWeights[exercise.exercise_id];

                    return (
                      <SetRow
                        key={setNumber}
                        setNumber={setNumber}
                        targetWeight={recommendedWeight || undefined}
                        targetReps={
                          exercise.reps_target ||
                          exercise.reps_min ||
                          exercise.reps_max
                        }
                        rirTarget={exercise.rir_target}
                        isExpanded={expandedSet === setNumber}
                        onToggle={() =>
                          setExpandedSet(
                            expandedSet === setNumber ? null : setNumber
                          )
                        }
                        onLog={(weight, reps, rir) =>
                          handleSetLog(
                            exercise.exercise_id,
                            setNumber,
                            weight,
                            reps,
                            rir
                          )
                        }
                        completedSet={completedSet}
                        pendingSet={pendingSet}
                      />
                    );
                  })}
            </View>

            {/* Complete Exercise Button */}
            <TouchableOpacity
              style={[
                styles.completeButton,
                exercise.is_completed && styles.completedButton,
              ]}
              onPress={() => handleExerciseComplete(exercise.exercise_id)}
            >
              <Text
                style={[
                  styles.completeButtonText,
                  exercise.is_completed && styles.completedButtonText,
                ]}
              >
                {exercise.is_completed
                  ? "✓ Abgeschlossen"
                  : "Übung abschließen"}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>
    );
  };

  // Loading state
  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#3083FF" />
          <Text style={styles.loadingText}>Lade Workout...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Error state
  if (error || !currentExercise) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContainer}>
          <Text style={styles.errorText}>{error || "Fehler beim Laden"}</Text>
          <Button onPress={() => navigation.goBack()}>Zurück</Button>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={[]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
          <Text style={styles.closeButtonText}>✕</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Workout Session</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <ProgressBar progress={progress} color="#70e0ba" height={8} />
        <Text style={styles.progressText}>
          {exercises.filter((ex) => ex.is_completed).length} /{" "}
          {exercises.length} Übungen
        </Text>
      </View>

      {/* Exercise Carousel */}
      <FlatList
        ref={flatListRef}
        data={exercises}
        renderItem={renderExerciseCard}
        keyExtractor={(item) => item.id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        snapToInterval={SCREEN_WIDTH}
        snapToAlignment="start"
        decelerationRate="fast"
        contentContainerStyle={styles.carouselContainer}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        getItemLayout={(data, index) => ({
          length: SCREEN_WIDTH,
          offset: SCREEN_WIDTH * index,
          index,
        })}
        initialScrollIndex={0}
        onScrollToIndexFailed={(info) => {
          // Handle scroll failure gracefully
          setTimeout(() => {
            flatListRef.current?.scrollToIndex({
              index: info.index,
              animated: true,
            });
          }, 100);
        }}
      />

      {/* Navigation */}
      <View style={styles.navigation}>
        <TouchableOpacity
          onPress={handlePrevious}
          disabled={currentIndex === 0}
          style={[
            styles.navButton,
            currentIndex === 0 && styles.navButtonDisabled,
          ]}
        >
          <Text
            style={[
              styles.navButtonText,
              currentIndex === 0 && styles.navButtonTextDisabled,
            ]}
          >
            ← Zurück
          </Text>
        </TouchableOpacity>

        <PaginationDots total={exercises.length} current={currentIndex} />

        <TouchableOpacity
          onPress={handleNext}
          disabled={currentIndex === exercises.length - 1}
          style={[
            styles.navButton,
            currentIndex === exercises.length - 1 && styles.navButtonDisabled,
          ]}
        >
          <Text
            style={[
              styles.navButtonText,
              currentIndex === exercises.length - 1 &&
                styles.navButtonTextDisabled,
            ]}
          >
            Weiter →
          </Text>
        </TouchableOpacity>
      </View>

      {/* Alternatives Modal */}
      <AlternativesModal
        visible={showAlternatives}
        exerciseId={selectedExerciseId || ""}
        onSelect={handleSubstitute}
        onClose={() => {
          setShowAlternatives(false);
          setSelectedExerciseId(null);
        }}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
    gap: 16,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 12,
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  closeButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  closeButtonText: {
    fontSize: 24,
    color: "#3083FF",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1a1a1a",
  },
  progressContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    backgroundColor: "#fff",
    gap: 8,
  },
  progressText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#3083FF",
    textAlign: "center",
  },
  carouselContainer: {
    paddingTop: 16,
  },
  carouselCard: {
    width: SCREEN_WIDTH,
    paddingHorizontal: CARD_PADDING,
  },
  cardScrollView: {
    flex: 1,
    overflow: "visible",
  },
  cardContent: {
    paddingBottom: 20,
    overflow: "visible",
  },
  exerciseCard: {
    backgroundColor: "#fff",
    borderRadius: 20,
    padding: 24,
    gap: 16,
    shadowColor: "#3083FF",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
    minHeight: 400,
    borderWidth: 1,
    borderColor: "#E8F0FE",
  },
  imageContainer: {
    width: "100%",
    height: 200,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#F0F0F0",
  },
  exerciseImage: {
    width: "100%",
    height: "100%",
  },
  exerciseName: {
    fontSize: 26,
    fontWeight: "800",
    color: "#1a1a1a",
    letterSpacing: -0.5,
  },
  assistanceLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#666",
    backgroundColor: "#F5F5F5",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: "flex-start",
    marginTop: 4,
    marginBottom: 2,
  },
  alternativesHint: {
    fontSize: 13,
    color: "#3083FF",
    marginTop: 6,
    fontWeight: "500",
  },
  exerciseInfo: {
    fontSize: 16,
    color: "#666",
  },
  restTimeInline: {
    fontSize: 16,
    color: "#999",
  },
  setsContainer: {
    gap: 8,
    overflow: "visible",
  },
  recommendedWeightContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#E3F2FD",
    borderRadius: 12,
    padding: 12,
    marginVertical: 8,
    gap: 6,
  },
  recommendedWeightLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1976D2",
  },
  recommendedWeightValue: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1976D2",
  },
  recommendedWeightPercentage: {
    fontSize: 13,
    fontWeight: "500",
    color: "#5E92C4",
  },
  completeButton: {
    backgroundColor: "#70e0ba",
    borderRadius: 14,
    padding: 18,
    alignItems: "center",
    marginTop: 8,
    shadowColor: "#70e0ba",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  completedButton: {
    backgroundColor: "#E8F5E9",
    shadowOpacity: 0,
  },
  completeButtonText: {
    fontSize: 17,
    fontWeight: "700",
    color: "#fff",
    letterSpacing: 0.5,
  },
  completedButtonText: {
    color: "#70e0ba",
  },
  navigation: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#E0E0E0",
  },
  navButton: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#3083FF",
    backgroundColor: "#fff",
  },
  navButtonDisabled: {
    borderColor: "#E0E0E0",
    backgroundColor: "#F8F9FA",
  },
  navButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#3083FF",
  },
  navButtonTextDisabled: {
    color: "#999",
  },
  loadingText: {
    fontSize: 17,
    fontWeight: "500",
    color: "#3083FF",
  },
  errorText: {
    fontSize: 17,
    fontWeight: "500",
    color: "#F44336",
    textAlign: "center",
    marginBottom: 16,
  },
});
