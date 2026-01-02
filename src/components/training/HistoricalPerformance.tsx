import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ActivityIndicator } from "react-native";
import { Card } from "@/components/ui/Card";
import { supabase } from "@/lib/supabase";
import type { WorkoutSet } from "@/types/training.types";

interface HistoricalPerformanceProps {
  /** The exercise ID to fetch history for */
  exerciseId: string;
  /** The user ID */
  userId: string;
  /** Optional current weight to highlight if same */
  currentWeight?: number;
}

interface HistoricalSet extends WorkoutSet {
  session_date: string;
  days_ago: number;
}

/**
 * HistoricalPerformance Component
 *
 * Displays the last 5 sets for a specific exercise to help users
 * track their performance over time.
 *
 * Shows:
 * - Weight × Reps (RiR) - "X Tage ago"
 * - Highlights sets with the same weight as current
 *
 * @example
 * ```tsx
 * <HistoricalPerformance
 *   exerciseId="ex123"
 *   userId="user456"
 *   currentWeight={105}
 * />
 * ```
 */
export const HistoricalPerformance: React.FC<HistoricalPerformanceProps> = ({
  exerciseId,
  userId,
  currentWeight,
}) => {
  const [loading, setLoading] = useState(true);
  const [historicalSets, setHistoricalSets] = useState<HistoricalSet[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchHistoricalSets();
  }, [exerciseId, userId]);

  const fetchHistoricalSets = async () => {
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
        .order("created_at", { ascending: false })
        .limit(5);

      if (fetchError) {
        console.error("Error fetching historical sets:", fetchError);
        setError("Konnte Historie nicht laden");
        return;
      }

      if (!data || data.length === 0) {
        setHistoricalSets([]);
        return;
      }

      // Calculate days ago for each set
      const now = new Date();
      const setsWithDaysAgo: HistoricalSet[] = data.map((set: any) => {
        const sessionDate = new Date(set.session.date);
        const diffTime = Math.abs(now.getTime() - sessionDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        return {
          ...set,
          session_date: set.session.date,
          days_ago: diffDays,
        };
      });

      setHistoricalSets(setsWithDaysAgo);
    } catch (err) {
      console.error("Error in fetchHistoricalSets:", err);
      setError("Ein Fehler ist aufgetreten");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card padding="medium" elevation="small">
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color="#3b82f6" />
          <Text style={styles.loadingText}>Lade Historie...</Text>
        </View>
      </Card>
    );
  }

  if (error) {
    return (
      <Card padding="medium" elevation="small">
        <Text style={styles.errorText}>{error}</Text>
      </Card>
    );
  }

  if (historicalSets.length === 0) {
    return (
      <Card padding="medium" elevation="small">
        <Text style={styles.emptyText}>
          Noch keine Historie für diese Übung
        </Text>
      </Card>
    );
  }

  return (
    <Card padding="medium" elevation="small">
      <View style={styles.container}>
        <Text style={styles.title}>Letzte Sets</Text>

        <View style={styles.setsContainer}>
          {historicalSets.map((set, index) => {
            const isCurrentWeight =
              currentWeight !== undefined && set.weight === currentWeight;

            return (
              <View
                key={`${set.id}-${index}`}
                style={[
                  styles.setRow,
                  isCurrentWeight && styles.setRowHighlighted,
                ]}
              >
                <View style={styles.setInfo}>
                  <Text
                    style={[
                      styles.setData,
                      isCurrentWeight && styles.setDataHighlighted,
                    ]}
                  >
                    {set.weight}kg × {set.reps}
                    {set.rir !== undefined && set.rir !== null && (
                      <Text style={styles.rirText}> (RiR {set.rir})</Text>
                    )}
                  </Text>
                </View>

                <Text style={styles.dateText}>
                  {set.days_ago === 0
                    ? "Heute"
                    : set.days_ago === 1
                    ? "Gestern"
                    : `vor ${set.days_ago} Tagen`}
                </Text>
              </View>
            );
          })}
        </View>
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  loadingContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 8,
  },
  loadingText: {
    fontSize: 14,
    color: "#666",
  },
  errorText: {
    fontSize: 14,
    color: "#E53E3E",
    textAlign: "center",
  },
  emptyText: {
    fontSize: 14,
    color: "#999",
    textAlign: "center",
    fontStyle: "italic",
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  setsContainer: {
    gap: 8,
  },
  setRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: "#F8F9FA",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  setRowHighlighted: {
    backgroundColor: "#E3F2FD",
    borderColor: "#3b82f6",
  },
  setInfo: {
    flex: 1,
  },
  setData: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
  },
  setDataHighlighted: {
    color: "#3b82f6",
  },
  rirText: {
    fontSize: 12,
    fontWeight: "400",
    color: "#666",
  },
  dateText: {
    fontSize: 12,
    color: "#999",
  },
});
