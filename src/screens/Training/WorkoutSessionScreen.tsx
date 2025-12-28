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
   * Handle set logging
   */
  const handleSetLog = async (
    exerciseId: string,
    setNumber: number,
    weight: number,
    reps: number,
    rpe?: number
  ) => {
    try {
      await trainingService.logSet(sessionId, exerciseId, setNumber, weight, reps, rpe);

      // Haptic feedback
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      // Reload session to get updated data
      await loadSession();
    } catch (err) {
      console.error("Fehler beim Loggen des Sets:", err);
      Alert.alert("Fehler", "Set konnte nicht gespeichert werden");
    }
  };

  /**
   * Handle exercise completion
   */
  const handleExerciseComplete = async (exerciseId: string) => {
    const exercise = exercises.find((ex) => ex.exercise_id === exerciseId);
    if (!exercise) return;

    // Check if all sets are completed
    const completedSetsCount = exercise.completed_sets.length;
    if (completedSetsCount < exercise.sets) {
      Alert.alert(
        "Unvollständige Übung",
        `Du hast erst ${completedSetsCount} von ${exercise.sets} Sätzen absolviert. Möchtest du trotzdem fortfahren?`,
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
    // Haptic feedback
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

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
      "Workout beenden?",
      "Möchtest du das Workout wirklich beenden? Dein Fortschritt wird gespeichert.",
      [
        { text: "Abbrechen", style: "cancel" },
        {
          text: "Beenden",
          style: "destructive",
          onPress: () => navigation.goBack(),
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
                : exercise.target_reps
                ? `${exercise.target_reps} Wdh`
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

                return (
                  <SetRow
                    key={setNumber}
                    setNumber={setNumber}
                    targetWeight={exercise.target_weight}
                    targetReps={
                      exercise.target_reps || exercise.reps_min || exercise.reps_max
                    }
                    rpeTarget={exercise.rpe_target}
                    isExpanded={expandedSet === setNumber}
                    onToggle={() =>
                      setExpandedSet(expandedSet === setNumber ? null : setNumber)
                    }
                    onLog={(weight, reps, rpe) =>
                      handleSetLog(exercise.exercise_id, setNumber, weight, reps, rpe)
                    }
                    completedSet={completedSet}
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
          <ActivityIndicator size="large" color="#4A90E2" />
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
        <ProgressBar progress={progress} color="#4CAF50" height={6} />
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
    backgroundColor: "#F5F5F5",
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
    paddingVertical: 12,
    backgroundColor: "#fff",
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  closeButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  closeButtonText: {
    fontSize: 24,
    color: "#666",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
  },
  progressContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#fff",
    gap: 8,
  },
  progressText: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
  },
  carouselContainer: {
    paddingHorizontal: CARD_PADDING,
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
    borderRadius: 16,
    padding: 20,
    gap: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    minHeight: 400,
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
    fontSize: 24,
    fontWeight: "700",
    color: "#333",
  },
  alternativesHint: {
    fontSize: 12,
    color: "#4A90E2",
    marginTop: 4,
    fontStyle: "italic",
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
    backgroundColor: "#4CAF50",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    marginTop: 8,
  },
  completedButton: {
    backgroundColor: "#E8F5E9",
  },
  completeButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
  completedButtonText: {
    color: "#4CAF50",
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
    fontSize: 16,
    color: "#666",
  },
  errorText: {
    fontSize: 16,
    color: "#F44336",
    textAlign: "center",
    marginBottom: 16,
  },
});
