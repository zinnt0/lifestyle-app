/**
 * Exercise Detail Screen
 *
 * Detailansicht einer einzelnen Übung im aktiven Workout:
 * - Name oben (tappbar → AlternativesModal)
 * - Großes Übungsbild
 * - Erklärung / Video Buttons (noch ohne Link)
 * - Aufklappbare Sätze mit SetRow
 * - „Zusätzlichen Satz hinzufügen" Button (temporär)
 * - Grüner Checkmark zum Abschließen der Übung
 * - Dynamische Gewichtsempfehlungen für 1RM-basierte Pläne
 */

import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import * as Haptics from "expo-haptics";
import { TrainingStackParamList } from "@/navigation/types";
import { trainingService } from "@/services/trainingService";
import { oneRMService } from "@/services/oneRMService";
import { supabase } from "@/lib/supabase";
import type { SessionExercise } from "@/types/training.types";
import { SetRow } from "@/components/training/SetRow";
import { AlternativesModal } from "@/components/training/AlternativesModal";

type Props = NativeStackScreenProps<TrainingStackParamList, "ExerciseDetail">;

export const ExerciseDetailScreen: React.FC<Props> = ({
  route,
  navigation,
}) => {
  const { sessionId, exerciseId, tempExercise } = route.params;

  // ── State ──────────────────────────────────────────────────────────
  const [exercise, setExercise] = useState<SessionExercise | null>(null);
  const [loading, setLoading] = useState(true);
  const [expandedSet, setExpandedSet] = useState<number | null>(1);
  const [pendingSets, setPendingSets] = useState<
    Record<number, { weight: number; reps: number; rir?: number }>
  >({});
  const [extraSetsCount, setExtraSetsCount] = useState(0);
  const [showAlternatives, setShowAlternatives] = useState(false);

  // Dynamische Gewichte
  const [recommendedWeight, setRecommendedWeight] = useState<number | null>(
    null
  );
  const [configWeights, setConfigWeights] = useState<
    Record<number, number>
  >({});

  // ── Laden ──────────────────────────────────────────────────────────
  useEffect(() => {
    loadExerciseData();
  }, [sessionId, exerciseId]);

  const loadExerciseData = async () => {
    try {
      setLoading(true);

      // ── Temporäre Übung (nicht in DB) ──
      if (tempExercise) {
        setExercise({
          id: exerciseId,
          workout_id: "",
          exercise_id: tempExercise.exerciseId,
          order_in_workout: 0,
          sets: tempExercise.sets,
          reps_target: tempExercise.repsTarget,
          completed_sets: [],
          is_completed: false,
          exercise: {
            id: tempExercise.exerciseId,
            name: tempExercise.name,
            name_de: tempExercise.nameDe,
            image_start_url: tempExercise.imageUrl,
            equipment_required: [],
            movement_pattern: "",
            primary_muscles: [],
            secondary_muscles: [],
            difficulty: "beginner",
          },
        } as unknown as SessionExercise);
        return;
      }

      // ── DB-Übung laden ──
      const sessionExercises =
        await trainingService.getSessionExercises(sessionId);
      const found = sessionExercises.find((ex) => ex.id === exerciseId);

      if (!found) {
        Alert.alert("Fehler", "Übung nicht gefunden");
        navigation.goBack();
        return;
      }
      setExercise(found);

      // ── Dynamische Gewichte berechnen ──
      const { data: session } = await supabase
        .from("workout_sessions")
        .select("plan_id")
        .eq("id", sessionId)
        .single();

      if (!session) return;

      const { data: planData } = await supabase
        .from("training_plans")
        .select("*, template:plan_templates(is_dynamic, tm_percentage)")
        .eq("id", session.plan_id)
        .single();

      if (!planData || planData.tm_percentage == null) return;

      const hasDynamicData =
        found.percentage_1rm ||
        (found.set_configurations && found.set_configurations.length > 0);
      if (!hasDynamicData) return;

      const { data: authData } = await supabase.auth.getUser();
      if (!authData?.user) return;

      // Training Max berechnen
      const tm = await oneRMService.calculateWorkingWeight(
        authData.user.id,
        found.exercise_id,
        100,
        planData.tm_percentage || 100
      );

      // set_configurations: pro-Set Gewichte
      if (found.set_configurations && found.set_configurations.length > 0 && tm) {
        const weights: Record<number, number> = {};
        for (const config of found.set_configurations) {
          weights[config.set_number] =
            Math.round((tm * config.percentage_1rm) / 100 / 2.5) * 2.5;
        }
        setConfigWeights(weights);
      } else if (found.percentage_1rm) {
        // Einheitliches Gewicht für alle Sätze
        const w = await oneRMService.calculateWorkingWeight(
          authData.user.id,
          found.exercise_id,
          found.percentage_1rm,
          planData.tm_percentage || 100
        );
        setRecommendedWeight(w);
      }
    } catch (e) {
      console.error("Fehler beim Laden der Übung:", e);
      Alert.alert("Fehler", "Übung konnte nicht geladen werden");
    } finally {
      setLoading(false);
    }
  };

  // ── Set-Logging ────────────────────────────────────────────────────
  const handleSetLog = useCallback(
    (setNumber: number, weight: number, reps: number, rir?: number) => {
      setPendingSets((prev) => ({
        ...prev,
        [setNumber]: { weight, reps, rir },
      }));
    },
    []
  );

  // ── Satz hinzufügen ────────────────────────────────────────────────
  const handleAddSet = () => {
    setExtraSetsCount((prev) => prev + 1);
  };

  // ── Übung abschließen ──────────────────────────────────────────────
  const handleComplete = async () => {
    if (!exercise) return;

    // Nur die geplanten Sätze zählen (nicht die extra)
    const completedOriginal = exercise.completed_sets.filter(
      (s) => s.set_number <= exercise.sets
    ).length;
    const pendingOriginal = Object.keys(pendingSets).filter(
      (n) => parseInt(n) <= exercise.sets
    ).length;

    if (completedOriginal + pendingOriginal < exercise.sets) {
      const logged = completedOriginal + pendingOriginal;
      Alert.alert(
        "Unvollständige Übung",
        `Du hast erst ${logged} von ${exercise.sets} Sätzen absolviert. Möchtest du trotzdem fortfahren?`,
        [
          { text: "Abbrechen", style: "cancel" },
          { text: "Fortfahren", onPress: saveAndComplete },
        ]
      );
      return;
    }

    saveAndComplete();
  };

  const saveAndComplete = async () => {
    if (!exercise) return;

    try {
      // Alle ausstehenden Sets speichern
      for (const [setNumberStr, setData] of Object.entries(pendingSets)) {
        await trainingService.logSet(
          sessionId,
          exercise.exercise_id,
          parseInt(setNumberStr),
          setData.weight,
          setData.reps,
          setData.rir
        );
      }

      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      navigation.goBack();
    } catch (err) {
      console.error("Fehler beim Speichern:", err);
      Alert.alert("Fehler", "Sets konnten nicht gespeichert werden");
    }
  };

  // ── Übungsaustaush ─────────────────────────────────────────────────
  const handleSubstitute = async (alternativeExerciseId: string) => {
    if (!exercise || exercise.id.startsWith("temp_")) return;

    try {
      await supabase
        .from("plan_exercises")
        .update({ exercise_id: alternativeExerciseId })
        .eq("id", exercise.id);

      // Substitution loggen
      try {
        await supabase.from("workout_exercise_substitutions").insert({
          session_id: sessionId,
          original_exercise_id: exercise.exercise_id,
          substitute_exercise_id: alternativeExerciseId,
          reason: "user_preference",
        });
      } catch {
        // Silently ignore – Tabelle existiert evtl. nicht
      }

      await loadExerciseData();
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert("Erfolg", "Übung wurde erfolgreich ersetzt");
    } catch {
      Alert.alert("Fehler", "Übung konnte nicht ersetzt werden");
    }
  };

  // ── Render: Loading ────────────────────────────────────────────────
  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#3083FF" />
          <Text style={styles.loadingText}>Lade Übung...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!exercise) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <Text style={styles.errorText}>Übung nicht gefunden</Text>
        </View>
      </SafeAreaView>
    );
  }

  // ── Berechnete Werte ───────────────────────────────────────────────
  const hasSetConfigs =
    exercise.set_configurations && exercise.set_configurations.length > 0;
  const totalSets = exercise.sets + extraSetsCount;
  const exerciseName =
    exercise.exercise?.name_de || exercise.exercise?.name || "Übung";
  const isTemp = exercise.id.startsWith("temp_");

  // ── Render: Hauptansicht ───────────────────────────────────────────
  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
        >
          <Text style={styles.backBtnText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          {exerciseName}
        </Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Übungsbild */}
        <View style={styles.imageWrap}>
          {exercise.exercise?.image_start_url ? (
            <Image
              source={{ uri: exercise.exercise.image_start_url }}
              style={styles.exerciseImage}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.imagePlaceholder}>
              <Text style={styles.imagePlaceholderIcon}>🏋️</Text>
            </View>
          )}
        </View>

        {/* Name – tappbar für Alternativen */}
        <TouchableOpacity
          onPress={() => setShowAlternatives(true)}
          disabled={isTemp}
          style={styles.nameRow}
        >
          <Text style={styles.exerciseName}>{exerciseName}</Text>
          {!isTemp && (
            <Text style={styles.alternativesHint}>
              Tippen für Alternativen
            </Text>
          )}
        </TouchableOpacity>

        {/* Erklärung / Video Buttons */}
        <View style={styles.infoBtnsRow}>
          <TouchableOpacity style={styles.infoBtnActive}>
            <Text style={styles.infoBtnActiveText}>Erklärung</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.infoBtnInactive}>
            <Text style={styles.infoBtnInactiveText}>Video</Text>
          </TouchableOpacity>
        </View>

        {/* Empfohlenes Gewicht (dynamische Pläne, kein set_configurations) */}
        {!hasSetConfigs && recommendedWeight && (
          <View style={styles.recommendedWrap}>
            <Text style={styles.recommendedLabel}>💡 Empfohlen:</Text>
            <Text style={styles.recommendedValue}>
              {recommendedWeight.toFixed(1)} kg
            </Text>
            {exercise.percentage_1rm && (
              <Text style={styles.recommendedPercent}>
                ({exercise.percentage_1rm}% vom TM)
              </Text>
            )}
          </View>
        )}

        {/* ── Sätze ── */}
        <View style={styles.setsWrap}>
          {hasSetConfigs
            ? // set_configurations (z. B. 5/3/1)
              [
                ...exercise.set_configurations!,
                ...Array.from({ length: extraSetsCount }, (_, i) => ({
                  set_number: exercise.set_configurations!.length + i + 1,
                  percentage_1rm: 0,
                  reps: 0,
                  is_amrap: false,
                  notes: "Zusätzlicher Satz",
                })),
              ].map((config) => {
                const setNumber = config.set_number;
                const completedSet = exercise.completed_sets.find(
                  (s) => s.set_number === setNumber
                );
                const pendingSet = pendingSets[setNumber];
                const targetWeight = configWeights[setNumber];
                const isExtra =
                  setNumber > exercise.set_configurations!.length;

                return (
                  <SetRow
                    key={setNumber}
                    setNumber={setNumber}
                    targetWeight={targetWeight}
                    targetReps={isExtra ? undefined : config.reps || undefined}
                    rirTarget={isExtra ? undefined : exercise.rir_target}
                    isExpanded={expandedSet === setNumber}
                    onToggle={() =>
                      setExpandedSet(
                        expandedSet === setNumber ? null : setNumber
                      )
                    }
                    onLog={(weight, reps, rir) =>
                      handleSetLog(setNumber, weight, reps, rir)
                    }
                    completedSet={completedSet}
                    pendingSet={pendingSet}
                    isAMRAP={config.is_amrap}
                    setNotes={config.notes}
                    percentageLabel={
                      !isExtra && config.percentage_1rm
                        ? `${config.percentage_1rm}%`
                        : undefined
                    }
                  />
                );
              })
            : // Standard-Sätze
              Array.from({ length: totalSets }, (_, index) => {
                const setNumber = index + 1;
                const completedSet = exercise.completed_sets.find(
                  (s) => s.set_number === setNumber
                );
                const pendingSet = pendingSets[setNumber];
                const isExtra = setNumber > exercise.sets;

                return (
                  <SetRow
                    key={setNumber}
                    setNumber={setNumber}
                    targetWeight={recommendedWeight || undefined}
                    targetReps={
                      isExtra
                        ? undefined
                        : exercise.reps_target ||
                          exercise.reps_min ||
                          exercise.reps_max
                    }
                    rirTarget={isExtra ? undefined : exercise.rir_target}
                    isExpanded={expandedSet === setNumber}
                    onToggle={() =>
                      setExpandedSet(
                        expandedSet === setNumber ? null : setNumber
                      )
                    }
                    onLog={(weight, reps, rir) =>
                      handleSetLog(setNumber, weight, reps, rir)
                    }
                    completedSet={completedSet}
                    pendingSet={pendingSet}
                    setNotes={isExtra ? "Zusätzlicher Satz" : undefined}
                  />
                );
              })}
        </View>

        {/* Spacer für Bottom-Bar */}
        <View style={{ height: 90 }} />
      </ScrollView>

      {/* ── Bottom-Bar: Satz hinzufügen + Checkmark ── */}
      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.addSetBtn} onPress={handleAddSet}>
          <Text style={styles.addSetBtnText}>+ Zusätzlichen Satz</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.completeBtn} onPress={handleComplete}>
          <Text style={styles.completeBtnText}>✓</Text>
        </TouchableOpacity>
      </View>

      {/* AlternativesModal */}
      <AlternativesModal
        visible={showAlternatives}
        exerciseId={exercise.exercise_id}
        onSelect={handleSubstitute}
        onClose={() => setShowAlternatives(false)}
      />
    </SafeAreaView>
  );
};

// ── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    gap: 12,
    padding: 20,
  },

  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 3,
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  backBtnText: {
    fontSize: 24,
    color: "#1B3A5C",
    fontWeight: "600",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1a1a1a",
    flex: 1,
    textAlign: "center",
  },

  // ScrollView
  scroll: {
    flex: 1,
  },

  // Bild
  imageWrap: {
    width: "100%",
    height: 220,
    backgroundColor: "#f0f0f0",
  },
  exerciseImage: {
    width: "100%",
    height: "100%",
  },
  imagePlaceholder: {
    width: "100%",
    height: "100%",
    backgroundColor: "#e8f5f3",
    alignItems: "center",
    justifyContent: "center",
  },
  imagePlaceholderIcon: {
    fontSize: 56,
  },

  // Name + Alternativen-Hint
  nameRow: {
    paddingHorizontal: 20,
    paddingTop: 20,
    gap: 4,
  },
  exerciseName: {
    fontSize: 24,
    fontWeight: "800",
    color: "#1a1a1a",
    letterSpacing: -0.5,
  },
  alternativesHint: {
    fontSize: 13,
    color: "#3083FF",
    fontWeight: "500",
  },

  // Erklärung / Video Buttons
  infoBtnsRow: {
    flexDirection: "row",
    paddingHorizontal: 20,
    paddingTop: 16,
    gap: 12,
  },
  infoBtnActive: {
    flex: 1,
    backgroundColor: "#4ECDC4",
    borderRadius: 10,
    padding: 12,
    alignItems: "center",
  },
  infoBtnActiveText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#fff",
  },
  infoBtnInactive: {
    flex: 1,
    backgroundColor: "#1B3A5C",
    borderRadius: 10,
    padding: 12,
    alignItems: "center",
  },
  infoBtnInactiveText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#fff",
  },

  // Empfohlenes Gewicht
  recommendedWrap: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "#E3F2FD",
    borderRadius: 12,
    padding: 10,
    marginHorizontal: 20,
    marginTop: 16,
  },
  recommendedLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#1976D2",
  },
  recommendedValue: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1976D2",
  },
  recommendedPercent: {
    fontSize: 13,
    color: "#5E92C4",
    fontWeight: "500",
  },

  // Sätze
  setsWrap: {
    paddingHorizontal: 16,
    paddingTop: 20,
    gap: 6,
  },

  // Bottom-Bar
  bottomBar: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 5,
  },
  addSetBtn: {
    flex: 1,
    backgroundColor: "#1B3A5C",
    borderRadius: 14,
    padding: 15,
    alignItems: "center",
    shadowColor: "#1B3A5C",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 3,
  },
  addSetBtnText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
  },
  completeBtn: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "#4CAF50",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#4CAF50",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.35,
    shadowRadius: 6,
    elevation: 4,
  },
  completeBtnText: {
    fontSize: 24,
    fontWeight: "700",
    color: "#fff",
  },

  // Text
  loadingText: {
    fontSize: 16,
    color: "#3083FF",
    fontWeight: "500",
  },
  errorText: {
    fontSize: 16,
    color: "#E53935",
    fontWeight: "500",
    textAlign: "center",
  },
});
