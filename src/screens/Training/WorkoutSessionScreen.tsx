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
import { supabase } from "@/lib/supabase";
import type { SessionExercise } from "@/types/training.types";
import { ProgressBar } from "@/components/training/ProgressBar";
import { SetRow } from "@/components/training/SetRow";
import { PaginationDots } from "@/components/training/PaginationDots";
import { Button } from "@/components/ui/Button";
import { AlternativesModal } from "@/components/training/AlternativesModal";

type Props = NativeStackScreenProps<TrainingStackParamList, "WorkoutSession">;

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CARD_PADDING = 16;
const CARD_WIDTH = SCREEN_WIDTH - CARD_PADDING * 2;

export const WorkoutSessionScreen: React.FC<Props> = ({ route, navigation }) => {
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
  const [selectedExerciseId, setSelectedExerciseId] = useState<string | null>(null);
  const [pendingSets, setPendingSets] = useState<
    Record<string, Record<number, { weight: number; reps: number; rir?: number }>>
  >({});

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
      if (nextAppState === 'background' || nextAppState === 'inactive') {
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

    const subscription = AppState.addEventListener('change', handleAppStateChange);

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
   * Load session exercises
   */
  const loadSession = async () => {
    try {
      setLoading(true);
      setError(null);

      const sessionExercises = await trainingService.getSessionExercises(sessionId);

      if (!sessionExercises || sessionExercises.length === 0) {
        setError("Keine Übungen für dieses Workout gefunden");
        return;
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
    const totalSetsCount = exercise.completed_sets.length + Object.keys(pendingSetsForExercise).length;

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

      for (const [setNumberStr, setData] of Object.entries(pendingSetsForExercise)) {
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
          onPress: () => {
            navigation.replace("WorkoutSummary", { sessionId });
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
   */
  const completeWorkout = async () => {
    try {
      await trainingService.completeWorkoutSession(sessionId);
      navigation.navigate("TrainingDashboard");
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
          style: "cancel"
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
  const renderExerciseCard = ({ item: exercise }: { item: SessionExercise }) => {
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
              <Text style={styles.alternativesHint}>
                Tippen für Alternativen
              </Text>
            </TouchableOpacity>

            {/* Exercise Info */}
            <Text style={styles.exerciseInfo}>
              {exercise.sets} Sätze •{" "}
              {exercise.reps_min && exercise.reps_max
                ? `${exercise.reps_min}-${exercise.reps_max} Wdh`
                : exercise.reps_target
                ? `${exercise.reps_target} Wdh`
                : "Wiederholungen"}
            </Text>

            {/* Rest Time */}
            {exercise.rest_seconds && (
              <Text style={styles.restTime}>
                Pause: {Math.floor(exercise.rest_seconds / 60)}:
                {String(exercise.rest_seconds % 60).padStart(2, "0")} min
              </Text>
            )}

            {/* Sets */}
            <View style={styles.setsContainer}>
              {Array.from({ length: exercise.sets }).map((_, index) => {
                const setNumber = index + 1;
                const completedSet = exercise.completed_sets.find(
                  (s) => s.set_number === setNumber
                );
                const pendingSet = pendingSets[exercise.exercise_id]?.[setNumber];

                return (
                  <SetRow
                    key={setNumber}
                    setNumber={setNumber}
                    targetReps={
                      exercise.reps_target || exercise.reps_min || exercise.reps_max
                    }
                    rirTarget={exercise.rir_target}
                    isExpanded={expandedSet === setNumber}
                    onToggle={() =>
                      setExpandedSet(expandedSet === setNumber ? null : setNumber)
                    }
                    onLog={(weight, reps, rir) =>
                      handleSetLog(exercise.exercise_id, setNumber, weight, reps, rir)
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
                {exercise.is_completed ? "✓ Abgeschlossen" : "Übung abschließen"}
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
    <SafeAreaView style={styles.container} edges={["top"]}>
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
          {exercises.filter((ex) => ex.is_completed).length} / {exercises.length} Übungen
        </Text>
      </View>

      {/* Exercise Carousel */}
      <FlatList
        ref={flatListRef}
        data={exercises}
        renderItem={renderExerciseCard}
        keyExtractor={(item) => item.exercise_id}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        snapToInterval={CARD_WIDTH + CARD_PADDING * 2}
        snapToAlignment="center"
        decelerationRate="fast"
        contentContainerStyle={styles.carouselContainer}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        getItemLayout={(data, index) => ({
          length: CARD_WIDTH + CARD_PADDING * 2,
          offset: (CARD_WIDTH + CARD_PADDING * 2) * index,
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
        <Button
          onPress={handlePrevious}
          disabled={currentIndex === 0}
          variant="outline"
          size="small"
        >
          ← Zurück
        </Button>

        <PaginationDots total={exercises.length} current={currentIndex} />

        <Button
          onPress={handleNext}
          disabled={currentIndex === exercises.length - 1}
          variant="outline"
          size="small"
        >
          Weiter →
        </Button>
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
    paddingVertical: 16,
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
    paddingTop: 16,
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
    paddingHorizontal: CARD_PADDING,
    paddingTop: 16,
  },
  carouselCard: {
    width: CARD_WIDTH,
    marginHorizontal: CARD_PADDING,
  },
  cardScrollView: {
    flex: 1,
  },
  cardContent: {
    paddingBottom: 20,
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
  restTime: {
    fontSize: 14,
    color: "#999",
    fontStyle: "italic",
  },
  setsContainer: {
    gap: 8,
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
    paddingVertical: 12,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#E0E0E0",
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
