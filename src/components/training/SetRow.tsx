import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  LayoutAnimation,
  Platform,
  UIManager,
} from "react-native";
import type { WorkoutSet } from "@/types/training.types";

if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface SetRowProps {
  setNumber: number;
  targetWeight?: number;
  targetReps?: number;
  rirTarget?: number;
  isExpanded: boolean;
  onToggle: () => void;
  onLog: (weight: number, reps: number, rir?: number) => void;
  completedSet?: WorkoutSet;
  pendingSet?: { weight: number; reps: number; rir?: number };
}

export const SetRow: React.FC<SetRowProps> = ({
  setNumber,
  targetWeight,
  targetReps,
  rirTarget,
  isExpanded,
  onToggle,
  onLog,
  completedSet,
  pendingSet,
}) => {
  const [weight, setWeight] = useState(
    completedSet?.weight?.toString() ||
    pendingSet?.weight?.toString() ||
    (targetWeight !== null && targetWeight !== undefined ? targetWeight.toString() : "") ||
    ""
  );
  const [reps, setReps] = useState(
    completedSet?.reps?.toString() ||
    pendingSet?.reps?.toString() ||
    (targetReps !== null && targetReps !== undefined ? targetReps.toString() : "") ||
    ""
  );
  const [rir, setRir] = useState(
    completedSet?.rir?.toString() ||
    pendingSet?.rir?.toString() ||
    (rirTarget !== null && rirTarget !== undefined ? rirTarget.toString() : "") ||
    ""
  );

  const previouslyExpanded = useRef(isExpanded);

  // Auto-save when collapsing (switching to next set)
  useEffect(() => {
    if (previouslyExpanded.current && !isExpanded && !completedSet) {
      // Only auto-save if we have valid data and it's not already completed
      if (weight && reps) {
        const weightNum = parseFloat(weight);
        const repsNum = parseInt(reps);
        const rirNum = rir ? parseInt(rir) : undefined;

        if (!isNaN(weightNum) && !isNaN(repsNum)) {
          onLog(weightNum, repsNum, rirNum);
        }
      }
    }
    previouslyExpanded.current = isExpanded;
  }, [isExpanded, weight, reps, rir, completedSet, onLog]);

  const handleToggle = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    onToggle();
  };

  // Auto-save on blur (when leaving input fields)
  const handleAutoSave = () => {
    if (completedSet) return; // Don't auto-save if already completed
    if (!weight || !reps) return;

    const weightNum = parseFloat(weight);
    const repsNum = parseInt(reps);
    const rirNum = rir ? parseInt(rir) : undefined;

    if (!isNaN(weightNum) && !isNaN(repsNum)) {
      onLog(weightNum, repsNum, rirNum);
    }
  };

  const isCompleted = !!completedSet;
  const isPending = !!pendingSet && !completedSet;

  return (
    <View style={styles.container}>
      {/* Header (always visible) */}
      <TouchableOpacity
        style={[
          styles.header,
          isCompleted && styles.headerCompleted,
          isPending && styles.headerPending,
        ]}
        onPress={handleToggle}
      >
        <View style={styles.headerContent}>
          <Text style={styles.setNumber}>Satz {setNumber}</Text>

          {isCompleted ? (
            <View style={styles.completedInfo}>
              <Text style={styles.completedText}>
                ✓ {completedSet.weight}kg × {completedSet.reps}
              </Text>
              {completedSet.rir !== undefined && (
                <Text style={styles.rirText}>RiR {completedSet.rir}</Text>
              )}
            </View>
          ) : isPending ? (
            <View style={styles.completedInfo}>
              <Text style={styles.pendingText}>
                ○ {pendingSet!.weight}kg × {pendingSet!.reps}
              </Text>
              {pendingSet!.rir !== undefined && (
                <Text style={styles.rirText}>RiR {pendingSet!.rir}</Text>
              )}
            </View>
          ) : (
            <Text style={styles.targetText}>
              Soll: {targetWeight ?? 0}kg × {targetReps ?? 0}
              {rirTarget !== undefined && rirTarget !== null && ` @ RiR ${rirTarget}`}
            </Text>
          )}
        </View>

        <Text style={styles.chevron}>{isExpanded ? "▼" : "▶"}</Text>
      </TouchableOpacity>

      {/* Expanded Content */}
      {isExpanded && (
        <View style={styles.expandedContent}>
          <View style={styles.targetInfo}>
            <Text style={styles.label}>Ziel:</Text>
            <Text style={styles.value}>
              {targetWeight ?? 0}kg × {targetReps ?? 0}
              {rirTarget !== undefined && rirTarget !== null && ` @ RiR ${rirTarget}`}
            </Text>
          </View>

          <View style={styles.inputRow}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Gewicht (kg)</Text>
              <TextInput
                value={weight}
                onChangeText={setWeight}
                onBlur={handleAutoSave}
                keyboardType="numeric"
                placeholder="0"
                style={styles.input}
              />
            </View>

            <Text style={styles.multiplier}>×</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Wiederholungen</Text>
              <TextInput
                value={reps}
                onChangeText={setReps}
                onBlur={handleAutoSave}
                keyboardType="numeric"
                placeholder="0"
                style={styles.input}
              />
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>RiR - Reps in Reserve (optional)</Text>
            <TextInput
              value={rir}
              onChangeText={setRir}
              onBlur={handleAutoSave}
              keyboardType="numeric"
              placeholder={rirTarget !== null && rirTarget !== undefined ? rirTarget.toString() : "0-5"}
              style={[styles.input, styles.rirInput]}
            />
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 4,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    backgroundColor: "#F8F9FA",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#E0E0E0",
  },
  headerCompleted: {
    backgroundColor: "#E8F5E9",
    borderColor: "#70e0ba",
  },
  headerPending: {
    backgroundColor: "#E3F2FD",
    borderColor: "#3083FF",
  },
  headerContent: {
    flex: 1,
    gap: 4,
  },
  setNumber: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  completedInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  completedText: {
    fontSize: 14,
    color: "#70e0ba",
    fontWeight: "600",
  },
  pendingText: {
    fontSize: 14,
    color: "#3083FF",
    fontWeight: "600",
  },
  targetText: {
    fontSize: 14,
    color: "#666",
  },
  rirText: {
    fontSize: 12,
    color: "#666",
    fontStyle: "italic",
  },
  chevron: {
    fontSize: 12,
    color: "#999",
  },
  expandedContent: {
    padding: 16,
    paddingTop: 12,
    gap: 12,
  },
  targetInfo: {
    flexDirection: "row",
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
  },
  value: {
    fontSize: 14,
    color: "#666",
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 12,
  },
  inputGroup: {
    flex: 1,
    gap: 4,
  },
  inputLabel: {
    fontSize: 12,
    color: "#666",
    fontWeight: "500",
  },
  input: {
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: "#fff",
  },
  rirInput: {
    flex: 0,
    width: 80,
  },
  multiplier: {
    fontSize: 20,
    color: "#999",
    marginBottom: 12,
  },
});
