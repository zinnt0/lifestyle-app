import React, { useEffect, useState } from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { Button } from "@/components/ui/Button";
import { supabase } from "@/lib/supabase";
import type { WorkoutSet } from "@/types/training.types";

interface EstimateOneRMModalProps {
  /** Whether the modal is visible */
  visible: boolean;
  /** The exercise ID to fetch workouts for */
  exerciseId: string;
  /** The exercise name for display */
  exerciseName: string;
  /** The user ID */
  userId: string;
  /** Callback when user selects an estimated 1RM value */
  onSelect: (estimatedOneRM: number) => void;
  /** Callback to close the modal */
  onClose: () => void;
}

interface WorkoutSetWithEstimate extends WorkoutSet {
  estimated_1rm: number;
  session_date: string;
}

/**
 * Calculates estimated 1RM using the Epley Formula
 * Formula: weight * (1 + reps/30)
 *
 * @param weight - Weight lifted in kg
 * @param reps - Number of repetitions
 * @returns Estimated 1RM in kg, rounded to 1 decimal place
 */
const calculateOneRM = (weight: number, reps: number): number => {
  if (reps === 0) return weight;
  if (reps === 1) return weight;

  const estimated = weight * (1 + reps / 30);
  return Math.round(estimated * 10) / 10; // Round to 1 decimal
};

/**
 * EstimateOneRMModal Component
 *
 * Allows users to estimate their 1RM from previous workout data.
 * Uses the Epley Formula: weight * (1 + reps/30)
 *
 * Features:
 * - Displays last 10 sets for the exercise
 * - Shows calculated 1RM estimate for each set
 * - Allows user to select and use an estimate
 *
 * @example
 * ```tsx
 * <EstimateOneRMModal
 *   visible={showModal}
 *   exerciseId="ex123"
 *   exerciseName="Bench Press"
 *   userId="user456"
 *   onSelect={(oneRM) => handleSetOneRM(oneRM)}
 *   onClose={() => setShowModal(false)}
 * />
 * ```
 */
export const EstimateOneRMModal: React.FC<EstimateOneRMModalProps> = ({
  visible,
  exerciseId,
  exerciseName,
  userId,
  onSelect,
  onClose,
}) => {
  const [loading, setLoading] = useState(true);
  const [workoutSets, setWorkoutSets] = useState<WorkoutSetWithEstimate[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      fetchWorkoutSets();
    }
  }, [visible, exerciseId, userId]);

  const fetchWorkoutSets = async () => {
    try {
      setLoading(true);
      setError(null);

      // Query workout_sets with session date
      const { data, error: fetchError } = await supabase
        .from("workout_sets")
        .select(
          `
          *,
          session:workout_sessions!inner(date)
        `
        )
        .eq("exercise_id", exerciseId)
        .eq("workout_sessions.user_id", userId)
        .not("weight", "is", null)
        .gt("reps", 0) // Only sets with at least 1 rep
        .order("created_at", { ascending: false })
        .limit(10);

      if (fetchError) {
        console.error("Error fetching workout sets:", fetchError);
        setError("Konnte Workouts nicht laden");
        return;
      }

      if (!data || data.length === 0) {
        setWorkoutSets([]);
        return;
      }

      // Calculate 1RM for each set
      const setsWithEstimates: WorkoutSetWithEstimate[] = data.map(
        (set: any) => ({
          ...set,
          session_date: set.session.date,
          estimated_1rm: calculateOneRM(set.weight || 0, set.reps),
        })
      );

      setWorkoutSets(setsWithEstimates);
    } catch (err) {
      console.error("Error in fetchWorkoutSets:", err);
      setError("Ein Fehler ist aufgetreten");
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (estimatedOneRM: number) => {
    onSelect(estimatedOneRM);
    onClose();
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Heute";
    if (diffDays === 1) return "Gestern";
    if (diffDays < 7) return `vor ${diffDays} Tagen`;
    if (diffDays < 30) return `vor ${Math.floor(diffDays / 7)} Wochen`;
    return `vor ${Math.floor(diffDays / 30)} Monaten`;
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.titleContainer}>
            <Text style={styles.title}>1RM schätzen</Text>
            <Text style={styles.subtitle}>{exerciseName}</Text>
          </View>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeIcon}>✕</Text>
          </TouchableOpacity>
        </View>

        {/* Info Banner */}
        <View style={styles.infoBanner}>
          <Text style={styles.infoIcon}>ℹ️</Text>
          <Text style={styles.infoText}>
            Berechnung mit Epley-Formel: Gewicht × (1 + Wdh/30)
          </Text>
        </View>

        {/* Content */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#3b82f6" />
            <Text style={styles.loadingText}>Lade Workouts...</Text>
          </View>
        ) : error ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.errorText}>{error}</Text>
            <Button onPress={fetchWorkoutSets} variant="secondary">
              Erneut versuchen
            </Button>
          </View>
        ) : workoutSets.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              Keine Workouts gefunden für diese Übung.
            </Text>
            <Text style={styles.emptySubtext}>
              Absolviere erst ein paar Sätze, um dein 1RM zu schätzen.
            </Text>
          </View>
        ) : (
          <ScrollView style={styles.list}>
            <Text style={styles.listTitle}>Letzte Workouts</Text>

            {workoutSets.map((set, index) => (
              <TouchableOpacity
                key={`${set.id}-${index}`}
                style={styles.setCard}
                onPress={() => handleSelect(set.estimated_1rm)}
              >
                <View style={styles.setContent}>
                  {/* Set data */}
                  <View style={styles.setData}>
                    <Text style={styles.setWeight}>
                      {set.weight}kg × {set.reps}
                    </Text>
                    {set.rir !== undefined && set.rir !== null && (
                      <Text style={styles.rirBadge}>RiR {set.rir}</Text>
                    )}
                  </View>

                  {/* Date */}
                  <Text style={styles.dateText}>
                    {formatDate(set.session_date)}
                  </Text>

                  {/* Estimated 1RM */}
                  <View style={styles.estimateContainer}>
                    <Text style={styles.estimateLabel}>→</Text>
                    <Text style={styles.estimateValue}>
                      ~{set.estimated_1rm} kg
                    </Text>
                    <Text style={styles.estimateBadge}>(1RM)</Text>
                  </View>
                </View>

                <View style={styles.selectButton}>
                  <Text style={styles.selectButtonText}>Übernehmen</Text>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    padding: 20,
    paddingTop: 60,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  titleContainer: {
    flex: 1,
    gap: 4,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: "#333",
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
  },
  closeButton: {
    padding: 4,
  },
  closeIcon: {
    fontSize: 28,
    color: "#666",
  },
  infoBanner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 16,
    marginHorizontal: 16,
    marginTop: 16,
    backgroundColor: "#E3F2FD",
    borderRadius: 12,
  },
  infoIcon: {
    fontSize: 20,
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: "#1976D2",
    lineHeight: 20,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: "#666",
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
    gap: 12,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    textAlign: "center",
  },
  emptySubtext: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginBottom: 16,
  },
  errorText: {
    fontSize: 16,
    color: "#E53E3E",
    textAlign: "center",
    marginBottom: 16,
  },
  list: {
    flex: 1,
    padding: 16,
  },
  listTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginBottom: 12,
  },
  setCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    backgroundColor: "#F8F9FA",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E0E0E0",
    marginBottom: 12,
  },
  setContent: {
    flex: 1,
    gap: 8,
  },
  setData: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  setWeight: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  rirBadge: {
    fontSize: 12,
    color: "#666",
    backgroundColor: "#E0E0E0",
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
  },
  dateText: {
    fontSize: 12,
    color: "#999",
  },
  estimateContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  estimateLabel: {
    fontSize: 16,
    color: "#3b82f6",
  },
  estimateValue: {
    fontSize: 18,
    fontWeight: "700",
    color: "#3b82f6",
  },
  estimateBadge: {
    fontSize: 12,
    color: "#3b82f6",
    fontWeight: "600",
  },
  selectButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: "#3b82f6",
    borderRadius: 8,
  },
  selectButtonText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#fff",
  },
});
