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
  isAMRAP?: boolean;
  setNotes?: string;
  percentageLabel?: string;
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
  isAMRAP = false,
  setNotes,
  percentageLabel,
}) => {
  const [weight, setWeight] = useState(() => {
    if (completedSet?.weight !== undefined && completedSet?.weight !== null) {
      return completedSet.weight.toString();
    }
    if (pendingSet?.weight !== undefined && pendingSet?.weight !== null) {
      return pendingSet.weight.toString();
    }
    if (targetWeight !== undefined && targetWeight !== null) {
      return targetWeight.toFixed(1);
    }
    return "";
  });

  const [reps, setReps] = useState(() => {
    if (completedSet?.reps !== undefined && completedSet?.reps !== null) {
      return completedSet.reps.toString();
    }
    if (pendingSet?.reps !== undefined && pendingSet?.reps !== null) {
      return pendingSet.reps.toString();
    }
    if (targetReps !== undefined && targetReps !== null) {
      return targetReps.toString();
    }
    return "";
  });

  const [rir, setRir] = useState(() => {
    if (completedSet?.rir !== undefined && completedSet?.rir !== null) {
      return completedSet.rir.toString();
    }
    if (pendingSet?.rir !== undefined && pendingSet?.rir !== null) {
      return pendingSet.rir.toString();
    }
    if (rirTarget !== undefined && rirTarget !== null) {
      return rirTarget.toString();
    }
    return "";
  });

  const previouslyExpanded = useRef(isExpanded);

  // Auto-save when collapsing (switching to next set)
  useEffect(() => {
    if (previouslyExpanded.current && !isExpanded && !completedSet) {
      // Only auto-save if we have valid data and it's not already completed
      if (weight && reps) {
        const weightNum = parseFloat(weight);
        const repsNum = parseInt(reps);
        const rirNum = rir && rir.trim() !== '' ? parseInt(rir) : undefined;

        // Validate RIR is in valid range (0-5) if provided
        if (!isNaN(weightNum) && !isNaN(repsNum)) {
          const validRir = rirNum !== undefined && !isNaN(rirNum) && rirNum >= 0 && rirNum <= 5
            ? rirNum
            : undefined;
          onLog(weightNum, repsNum, validRir);
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
    const rirNum = rir && rir.trim() !== '' ? parseInt(rir) : undefined;

    // Validate RIR is in valid range (0-5) if provided
    if (!isNaN(weightNum) && !isNaN(repsNum)) {
      const validRir = rirNum !== undefined && !isNaN(rirNum) && rirNum >= 0 && rirNum <= 5
        ? rirNum
        : undefined;
      onLog(weightNum, repsNum, validRir);
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
          <View style={styles.setNumberRow}>
            <Text style={styles.setNumber}>Satz {setNumber}</Text>
            {percentageLabel && (
              <Text style={styles.percentageBadge}>{percentageLabel}</Text>
            )}
            {isAMRAP && (
              <Text style={styles.amrapBadge}>AMRAP</Text>
            )}
          </View>

          {isCompleted ? (
            <View style={styles.completedInfo}>
              <Text style={styles.completedText}>
                ✓ {completedSet.weight}kg × {completedSet.reps}{isAMRAP && '+'}
              </Text>
              {completedSet.rir !== undefined && (
                <Text style={styles.rirText}>RiR {completedSet.rir}</Text>
              )}
            </View>
          ) : isPending ? (
            <View style={styles.completedInfo}>
              <Text style={styles.pendingText}>
                ○ {pendingSet!.weight}kg × {pendingSet!.reps}{isAMRAP && '+'}
              </Text>
              {pendingSet!.rir !== undefined && (
                <Text style={styles.rirText}>RiR {pendingSet!.rir}</Text>
              )}
            </View>
          ) : (
            <>
              {(targetWeight !== undefined && targetWeight !== null) || (targetReps !== undefined && targetReps !== null) ? (
                <Text style={styles.targetText}>
                  Soll: {targetWeight !== undefined && targetWeight !== null ? `${targetWeight.toFixed(1)}kg` : '-'} × {targetReps ?? '-'}{isAMRAP && '+'}
                  {rirTarget !== undefined && rirTarget !== null && ` @ RiR ${rirTarget}`}
                </Text>
              ) : null}
              {setNotes && (
                <Text style={styles.setNotesText}>💡 {setNotes}</Text>
              )}
            </>
          )}
        </View>

        <Text style={styles.chevron}>{isExpanded ? "▼" : "▶"}</Text>
      </TouchableOpacity>

      {/* Expanded Content */}
      {isExpanded && (
        <View style={styles.expandedContent}>
          {(targetWeight !== undefined && targetWeight !== null) || (targetReps !== undefined && targetReps !== null) ? (
            <View style={styles.targetInfo}>
              <Text style={styles.label}>Ziel:</Text>
              <Text style={styles.value}>
                {targetWeight !== undefined && targetWeight !== null ? `${targetWeight.toFixed(1)}kg` : '-'} × {targetReps ?? '-'}{isAMRAP && '+'}
                {rirTarget !== undefined && rirTarget !== null && ` @ RiR ${rirTarget}`}
              </Text>
            </View>
          ) : null}

          {setNotes && (
            <View style={styles.targetInfo}>
              <Text style={styles.label}>💡</Text>
              <Text style={styles.value}>{setNotes}</Text>
            </View>
          )}

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
  setNumberRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  setNumber: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  percentageBadge: {
    fontSize: 12,
    fontWeight: "600",
    color: "#3b82f6",
    backgroundColor: "#E3F2FD",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  amrapBadge: {
    fontSize: 12,
    fontWeight: "700",
    color: "#FF9500",
    backgroundColor: "#FFF3E0",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
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
  setNotesText: {
    fontSize: 12,
    color: "#3b82f6",
    fontStyle: "italic",
    marginTop: 2,
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
