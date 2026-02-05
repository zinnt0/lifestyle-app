/**
 * Workout Session Screen – Übersicht
 *
 * Zeigt die Übungen des aktiven Workouts als vertikale Kachelliste an.
 * - Kachel: Bild links, Name + Kurzinfo rechts, Chevron
 * - 3-Punkte-Menü zum temporären Entfernen einer Übung
 * - "Übung hinzufügen" Button unten (temporär, nur dieses Workout)
 * - Tipp auf Kachel → ExerciseDetailScreen
 * - Fortschrittsanzeige oben
 * - Auto-Pause bei App-Hintergrund
 */

import React, { useState, useEffect, useMemo, useCallback, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  AppState,
  AppStateStatus,
  Modal,
  FlatList,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { NativeStackScreenProps } from "@react-navigation/native-stack";
import { useFocusEffect } from "@react-navigation/native";
import { TrainingStackParamList } from "@/navigation/types";
import { trainingService } from "@/services/trainingService";
import { supabase } from "@/lib/supabase";
import type { SessionExercise, Exercise } from "@/types/training.types";
import { ProgressBar } from "@/components/training/ProgressBar";

type Props = NativeStackScreenProps<TrainingStackParamList, "WorkoutSession">;

// ── Muskelgruppen-Zuordnung ──────────────────────────────────────────────
const MUSCLE_TO_GROUP: Record<string, string> = {
  chest: "Brust",
  triceps: "Arme",
  biceps: "Arme",
  forearms: "Arme",
  anterior_deltoid: "Schultern",
  lateral_deltoid: "Schultern",
  side_delts: "Schultern",
  posterior_deltoid: "Schultern",
  traps: "Schultern",
  lats: "Rücken",
  middle_back: "Rücken",
  rhomboids: "Rücken",
  erectors: "Rücken",
  core: "Core",
  obliques: "Core",
  quadriceps: "Beine",
  quads: "Beine",
  hamstrings: "Beine",
  glutes: "Beine",
  calves: "Beine",
};

const GROUP_ORDER = [
  "Brust",
  "Rücken",
  "Schultern",
  "Arme",
  "Beine",
  "Core",
  "Sonstige",
];

export const WorkoutSessionScreen: React.FC<Props> = ({
  route,
  navigation,
}) => {
  const { sessionId } = route.params;

  // ── State ──────────────────────────────────────────────────────────
  const [exercises, setExercises] = useState<SessionExercise[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [removedIds, setRemovedIds] = useState<Set<string>>(new Set());
  const [menuExerciseId, setMenuExerciseId] = useState<string | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [availableExercises, setAvailableExercises] = useState<Exercise[]>([]);
  const [addLoading, setAddLoading] = useState(false);

  // ── Refs ───────────────────────────────────────────────────────────
  const hasLoadedRef = useRef(false);
  const hasShownCompletionRef = useRef(false);

  // ── Auto-Pause bei App-Hintergrund ─────────────────────────────────
  useEffect(() => {
    let isPausing = false;
    const handler = async (state: AppStateStatus) => {
      if (state === "background" || state === "inactive") {
        if (isPausing) return;
        isPausing = true;
        try {
          await trainingService.pauseWorkoutSession(sessionId);
        } catch (e) {
          console.error("Auto-pause failed:", e);
        } finally {
          isPausing = false;
        }
      }
    };
    const sub = AppState.addEventListener("change", handler);
    return () => {
      sub.remove();
      trainingService.pauseWorkoutSession(sessionId).catch(() => {});
    };
  }, [sessionId]);

  // ── Focus-Effect: Laden beim ersten Aufruf, Aktualisieren beim Zurückkehren
  useFocusEffect(
    useCallback(() => {
      if (!hasLoadedRef.current) {
        hasLoadedRef.current = true;
        loadSession();
      } else {
        refreshExercises();
      }
    }, [sessionId])
  );

  // ── Daten laden ────────────────────────────────────────────────────
  const loadSession = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await trainingService.getSessionExercises(sessionId);
      if (!data || data.length === 0) {
        setError("Keine Übungen für dieses Workout gefunden");
        return;
      }
      setExercises(data);
    } catch (err) {
      console.error("Fehler beim Laden der Session:", err);
      setError("Workout konnte nicht geladen werden");
    } finally {
      setLoading(false);
    }
  };

  // Aktualisiert DB-Exercises, behält temporäre bei
  const refreshExercises = async () => {
    try {
      const dbExercises = await trainingService.getSessionExercises(sessionId);
      setExercises((prev) => {
        const temps = prev.filter((ex) => ex.id.startsWith("temp_"));
        return [...dbExercises, ...temps];
      });
    } catch (e) {
      console.error("Refresh failed:", e);
    }
  };

  // ── Berechnete Werte ───────────────────────────────────────────────
  const visibleExercises = useMemo(
    () => exercises.filter((ex) => !removedIds.has(ex.id)),
    [exercises, removedIds]
  );

  const progress = useMemo(() => {
    if (visibleExercises.length === 0) return 0;
    const completed = visibleExercises.filter((ex) => ex.is_completed).length;
    return (completed / visibleExercises.length) * 100;
  }, [visibleExercises]);

  const groupedExercises = useMemo(() => {
    const map = new Map<string, SessionExercise[]>();
    for (const ex of visibleExercises) {
      const muscle = ex.exercise?.primary_muscles?.[0] || "";
      const group = MUSCLE_TO_GROUP[muscle] || "Sonstige";
      if (!map.has(group)) map.set(group, []);
      map.get(group)!.push(ex);
    }
    return GROUP_ORDER.filter((g) => map.has(g)).map((g) => ({
      groupName: g,
      exercises: map.get(g)!,
    }));
  }, [visibleExercises]);

  // ── Workout-Completion-Erkennung ───────────────────────────────────
  useEffect(() => {
    if (!hasLoadedRef.current || hasShownCompletionRef.current) return;
    if (
      visibleExercises.length > 0 &&
      visibleExercises.every((ex) => ex.is_completed)
    ) {
      hasShownCompletionRef.current = true;
      Alert.alert(
        "Workout abgeschlossen!",
        "Glückwunsch! Du hast alle Übungen geschafft.",
        [
          {
            text: "Statistiken ansehen",
            onPress: () => completeWorkout(true),
          },
          { text: "Fertig", onPress: () => completeWorkout(false) },
        ]
      );
    }
  }, [visibleExercises]);

  // ── Handlers ───────────────────────────────────────────────────────
  const completeWorkout = async (showSummary: boolean) => {
    try {
      await trainingService.completeWorkoutSession(sessionId);
      if (showSummary) {
        navigation.replace("WorkoutSummary", { sessionId });
      } else {
        navigation.navigate("TrainingDashboard");
      }
    } catch {
      Alert.alert("Fehler", "Workout konnte nicht abgeschlossen werden");
    }
  };

  const handleClose = () => {
    Alert.alert(
      "Workout verlassen?",
      "Möchtest du das Workout pausieren oder komplett abbrechen?",
      [
        { text: "Zurück", style: "cancel" },
        {
          text: "Pausieren",
          onPress: async () => {
            try {
              await trainingService.pauseWorkoutSession(sessionId);
              navigation.goBack();
            } catch {
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
            } catch {
              Alert.alert("Fehler", "Workout konnte nicht abgebrochen werden");
            }
          },
        },
      ]
    );
  };

  const handleTilePress = (exercise: SessionExercise) => {
    const isTemp = exercise.id.startsWith("temp_");
    navigation.navigate("ExerciseDetail", {
      sessionId,
      exerciseId: exercise.id,
      ...(isTemp && {
        tempExercise: {
          exerciseId: exercise.exercise_id,
          name: exercise.exercise?.name || "",
          nameDe: exercise.exercise?.name_de || "",
          imageUrl: exercise.exercise?.image_start_url,
          sets: exercise.sets,
          repsTarget: exercise.reps_target,
        },
      }),
    });
  };

  const handleRemove = () => {
    if (menuExerciseId) {
      setRemovedIds((prev) => new Set([...prev, menuExerciseId]));
      setMenuExerciseId(null);
    }
  };

  const handleFinishWorkout = () => {
    const allDone = visibleExercises.every((ex) => ex.is_completed);
    if (allDone) {
      completeWorkout(true);
      return;
    }
    Alert.alert(
      "Workout abschließen?",
      "Nicht alle Übungen sind abgeschlossen. Möchtest du trotzdem das Workout beenden?",
      [
        { text: "Abbrechen", style: "cancel" },
        { text: "Abschließen", onPress: () => completeWorkout(true) },
      ]
    );
  };

  const handleOpenAdd = async () => {
    setAddLoading(true);
    try {
      const { data, error } = await supabase
        .from("exercises")
        .select("*")
        .eq("is_active", true)
        .order("name_de");
      if (error) throw error;
      const currentIds = new Set(visibleExercises.map((ex) => ex.exercise_id));
      setAvailableExercises(
        (data || []).filter((ex: Exercise) => !currentIds.has(ex.id))
      );
      setShowAddModal(true);
    } catch {
      Alert.alert("Fehler", "Übungen konnten nicht geladen werden");
    } finally {
      setAddLoading(false);
    }
  };

  const handleAddExercise = (ex: Exercise) => {
    const temp = {
      id: `temp_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      workout_id: "",
      exercise_id: ex.id,
      order_in_workout: exercises.length + 1,
      sets: 3,
      reps_target: 10,
      completed_sets: [],
      is_completed: false,
      exercise: ex,
    } as unknown as SessionExercise;
    setExercises((prev) => [...prev, temp]);
    setShowAddModal(false);
  };

  // ── Hilfsfunktionen ────────────────────────────────────────────────
  const getSubtitle = (ex: SessionExercise): string => {
    const parts = [`${ex.sets} Sätze`];
    if (ex.set_configurations?.length) {
      parts.push(
        ex.set_configurations
          .map((c) => `${c.reps}${c.is_amrap ? "+" : ""}`)
          .join("/") + " Wdh"
      );
    } else if (ex.reps_min && ex.reps_max) {
      parts.push(`${ex.reps_min}-${ex.reps_max} Wdh`);
    } else if (ex.reps_target) {
      parts.push(`${ex.reps_target} Wdh`);
    }
    return parts.join(" • ");
  };

  // ── Render: Loading ────────────────────────────────────────────────
  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color="#3083FF" />
          <Text style={styles.loadingText}>Lade Workout...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // ── Render: Error ──────────────────────────────────────────────────
  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.center}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.linkText}>Zurück</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // ── Render: Hauptansicht ───────────────────────────────────────────
  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleClose} style={styles.headerBtn}>
          <Text style={styles.headerBtnText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Workout</Text>
        <View style={{ width: 40 }} />
      </View>

      {/* Fortschrittsanzeige */}
      <View style={styles.progressWrap}>
        <ProgressBar progress={progress} color="#4ECDC4" height={6} />
        <Text style={styles.progressText}>
          {visibleExercises.filter((ex) => ex.is_completed).length} /{" "}
          {visibleExercises.length} Übungen
        </Text>
      </View>

      {/* Kachelliste – nach Muskelgruppen */}
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {groupedExercises.map((group, groupIndex) => (
          <View key={group.groupName}>
            <Text
              style={[
                styles.sectionHeader,
                groupIndex === 0 && { paddingTop: 4 },
              ]}
            >
              {group.groupName}
            </Text>

            {group.exercises.map((exercise) => (
              <View
                key={exercise.id}
                style={[
                  styles.tileWrapper,
                  exercise.is_completed && styles.tileWrapperCompleted,
                ]}
              >
                {/* Hauptkachel – tappbar */}
                <TouchableOpacity
                  style={[
                    styles.tile,
                    exercise.is_completed && styles.tileCompleted,
                  ]}
                  onPress={() => handleTilePress(exercise)}
                  activeOpacity={0.82}
                >
                  {/* Bild */}
                  <View style={styles.tileImgWrap}>
                    {exercise.exercise?.image_start_url ? (
                      <Image
                        source={{ uri: exercise.exercise.image_start_url }}
                        style={styles.tileImg}
                        resizeMode="cover"
                      />
                    ) : (
                      <View style={styles.tileImgPlaceholder}>
                        <Text style={{ fontSize: 28 }}>🏋️</Text>
                      </View>
                    )}
                  </View>

                  {/* Info */}
                  <View style={styles.tileInfo}>
                    <Text style={styles.tileName} numberOfLines={1}>
                      {exercise.exercise?.name_de ||
                        exercise.exercise?.name ||
                        "Übung"}
                    </Text>
                    <Text style={styles.tileSub}>{getSubtitle(exercise)}</Text>
                    {exercise.is_completed && (
                      <Text style={styles.tileCompletedText}>
                        ✓ Abgeschlossen
                      </Text>
                    )}
                  </View>

                  {/* Chevron */}
                  <Text style={styles.tileChevron}>›</Text>
                </TouchableOpacity>

                {/* 3-Punkte-Menü */}
                <TouchableOpacity
                  style={styles.menuBtn}
                  onPress={() => setMenuExerciseId(exercise.id)}
                  hitSlop={{ top: 8, right: 4, bottom: 8, left: 8 }}
                >
                  <Text style={styles.menuBtnText}>⋮</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        ))}
        <View style={{ height: 12 }} />
      </ScrollView>

      {/* Bottom-Buttons */}
      <View style={styles.bottomBtnRow}>
        <TouchableOpacity style={styles.addBtn} onPress={handleOpenAdd}>
          <Text style={styles.addBtnText}>+ Übung</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.finishBtn} onPress={handleFinishWorkout}>
          <Text style={styles.finishBtnText}>Workout abschließen</Text>
        </TouchableOpacity>
      </View>

      {/* ── Modal: Übung entfernen (Bestätigung) ── */}
      <Modal
        visible={menuExerciseId !== null}
        transparent
        animationType="fade"
        onRequestClose={() => setMenuExerciseId(null)}
      >
        <TouchableOpacity
          style={styles.overlay}
          activeOpacity={1}
          onPress={() => setMenuExerciseId(null)}
        >
          <View style={styles.confirmModal}>
            <Text style={styles.confirmTitle}>Übung entfernen</Text>
            <Text style={styles.confirmSub}>
              Diese Änderung betrifft nur das aktuelle Workout und beeinflusst
              keine weiteren Workouts.
            </Text>
            <View style={styles.confirmBtns}>
              <TouchableOpacity
                style={styles.confirmCancelBtn}
                onPress={() => setMenuExerciseId(null)}
              >
                <Text style={styles.confirmCancelText}>Abbrechen</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.confirmDeleteBtn}
                onPress={handleRemove}
              >
                <Text style={styles.confirmDeleteText}>Entfernen</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* ── Modal: Übung hinzufügen ── */}
      <Modal
        visible={showAddModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowAddModal(false)}
      >
        <SafeAreaView style={styles.modalWrap}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Übung hinzufügen</Text>
            <TouchableOpacity onPress={() => setShowAddModal(false)}>
              <Text style={styles.modalCloseIcon}>✕</Text>
            </TouchableOpacity>
          </View>

          {addLoading ? (
            <View style={styles.center}>
              <ActivityIndicator size="large" color="#3083FF" />
            </View>
          ) : (
            <FlatList
              data={availableExercises}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={styles.pickerItem}
                  onPress={() => handleAddExercise(item)}
                >
                  <View style={styles.pickerContent}>
                    <Text style={styles.pickerName}>
                      {item.name_de || item.name}
                    </Text>
                    <Text style={styles.pickerSub}>
                      {item.movement_pattern}
                      {item.primary_muscles?.length
                        ? ` • ${item.primary_muscles.slice(0, 2).join(", ")}`
                        : ""}
                    </Text>
                  </View>
                  <Text style={styles.pickerChevron}>›</Text>
                </TouchableOpacity>
              )}
            />
          )}
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
};

// ── Styles ───────────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F8F9FA",
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
  headerBtn: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
  },
  headerBtnText: {
    fontSize: 24,
    color: "#1B3A5C",
    fontWeight: "600",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1a1a1a",
  },

  // Progress
  progressWrap: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    backgroundColor: "#fff",
    gap: 6,
  },
  progressText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#4ECDC4",
    textAlign: "center",
  },

  // ScrollView
  scroll: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
  },

  // Abschnitt-Überschriften
  sectionHeader: {
    fontSize: 12,
    fontWeight: "700",
    color: "#7a8a94",
    textTransform: "uppercase",
    letterSpacing: 1.2,
    paddingTop: 20,
    paddingBottom: 6,
  },

  // ── Kachel ──
  tileWrapper: {
    position: "relative",
    marginBottom: 14,
  },
  tileWrapperCompleted: {
    opacity: 0.5,
  },
  tile: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#4ECDC4",
    borderRadius: 18,
    padding: 14,
    paddingRight: 36, // Platz für ⋮
    gap: 14,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
    elevation: 4,
  },
  tileCompleted: {
    backgroundColor: "#3BB8A8",
  },
  tileImgWrap: {
    width: 78,
    height: 78,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#fff",
    flexShrink: 0,
  },
  tileImg: {
    width: "100%",
    height: "100%",
  },
  tileImgPlaceholder: {
    width: "100%",
    height: "100%",
    backgroundColor: "#e0f7f4",
    alignItems: "center",
    justifyContent: "center",
  },
  tileInfo: {
    flex: 1,
    gap: 2,
  },
  tileName: {
    fontSize: 17,
    fontWeight: "700",
    color: "#1a1a1a",
  },
  tileSub: {
    fontSize: 14,
    color: "#145a4a",
    fontWeight: "500",
  },
  tileCompletedText: {
    fontSize: 12,
    color: "#fff",
    fontWeight: "600",
    marginTop: 2,
  },
  tileChevron: {
    fontSize: 24,
    color: "#1a1a1a",
    fontWeight: "600",
  },

  // 3-Punkte-Menü
  menuBtn: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 26,
    height: 26,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 2,
  },
  menuBtnText: {
    fontSize: 18,
    color: "#1a1a1a",
    fontWeight: "700",
  },

  // Bottom-Buttons
  bottomBtnRow: {
    flexDirection: "row",
    paddingHorizontal: 16,
    paddingBottom: 24,
    paddingTop: 6,
    gap: 10,
  },
  addBtn: {
    flex: 1,
    backgroundColor: "#1B3A5C",
    borderRadius: 14,
    padding: 16,
    alignItems: "center",
    shadowColor: "#1B3A5C",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  addBtnText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#fff",
    letterSpacing: 0.3,
  },
  finishBtn: {
    flex: 1.3,
    backgroundColor: "#4ECDC4",
    borderRadius: 14,
    padding: 16,
    alignItems: "center",
    shadowColor: "#4ECDC4",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 4,
  },
  finishBtnText: {
    fontSize: 15,
    fontWeight: "700",
    color: "#fff",
    letterSpacing: 0.3,
  },

  // ── Overlay & Bestätigung ──
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.42)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  confirmModal: {
    backgroundColor: "#fff",
    borderRadius: 18,
    padding: 24,
    width: "100%",
    gap: 14,
  },
  confirmTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: "#1a1a1a",
  },
  confirmSub: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
  },
  confirmBtns: {
    flexDirection: "row",
    gap: 12,
    marginTop: 2,
  },
  confirmCancelBtn: {
    flex: 1,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#ddd",
    padding: 12,
    alignItems: "center",
  },
  confirmCancelText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#666",
  },
  confirmDeleteBtn: {
    flex: 1,
    borderRadius: 10,
    backgroundColor: "#E53935",
    padding: 12,
    alignItems: "center",
  },
  confirmDeleteText: {
    fontSize: 15,
    fontWeight: "600",
    color: "#fff",
  },

  // ── Add-Exercise-Modal ──
  modalWrap: {
    flex: 1,
    backgroundColor: "#fff",
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#1a1a1a",
  },
  modalCloseIcon: {
    fontSize: 22,
    color: "#666",
  },
  pickerItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  pickerContent: {
    flex: 1,
    gap: 2,
  },
  pickerName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#1a1a1a",
  },
  pickerSub: {
    fontSize: 13,
    color: "#888",
  },
  pickerChevron: {
    fontSize: 20,
    color: "#999",
  },

  // ── Text ──
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
  linkText: {
    fontSize: 15,
    color: "#3083FF",
    fontWeight: "600",
    marginTop: 8,
  },
});
