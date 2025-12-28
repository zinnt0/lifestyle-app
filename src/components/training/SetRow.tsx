import React, { useState } from "react";
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
import { Button } from "@/components/ui/Button";
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
  rpeTarget?: number;
  isExpanded: boolean;
  onToggle: () => void;
  onLog: (weight: number, reps: number, rpe?: number) => void;
  completedSet?: WorkoutSet;
}

export const SetRow: React.FC<SetRowProps> = ({
  setNumber,
  targetWeight,
  targetReps,
  rpeTarget,
  isExpanded,
  onToggle,
  onLog,
  completedSet,
}) => {
  const [weight, setWeight] = useState(
    completedSet?.weight_kg?.toString() || targetWeight?.toString() || ""
  );
  const [reps, setReps] = useState(
    completedSet?.reps.toString() || targetReps?.toString() || ""
  );
  const [rpe, setRpe] = useState(
    completedSet?.rpe?.toString() || rpeTarget?.toString() || ""
  );

  const handleToggle = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    onToggle();
  };

  const handleSave = () => {
    if (!weight || !reps) return;

    const weightNum = parseFloat(weight);
    const repsNum = parseInt(reps);
    const rpeNum = rpe ? parseFloat(rpe) : undefined;

    onLog(weightNum, repsNum, rpeNum);
    handleToggle(); // Collapse after save
  };

  const isCompleted = !!completedSet;

  return (
    <View style={styles.container}>
      {/* Header (always visible) */}
      <TouchableOpacity
        style={[styles.header, isCompleted && styles.headerCompleted]}
        onPress={handleToggle}
      >
        <View style={styles.headerContent}>
          <Text style={styles.setNumber}>Satz {setNumber}</Text>

          {isCompleted ? (
            <View style={styles.completedInfo}>
              <Text style={styles.completedText}>
                ✓ {completedSet.weight_kg}kg × {completedSet.reps}
              </Text>
              {completedSet.rpe && (
                <Text style={styles.rpeText}>RPE {completedSet.rpe}</Text>
              )}
            </View>
          ) : (
            <Text style={styles.targetText}>
              Soll: {targetWeight}kg × {targetReps}
              {rpeTarget && ` @ ${rpeTarget}`}
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
              {targetWeight}kg × {targetReps}
              {rpeTarget && ` @ RPE ${rpeTarget}`}
            </Text>
          </View>

          <View style={styles.inputRow}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Gewicht (kg)</Text>
              <TextInput
                value={weight}
                onChangeText={setWeight}
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
                keyboardType="numeric"
                placeholder="0"
                style={styles.input}
              />
            </View>
          </View>

          {rpeTarget && (
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>RPE (optional)</Text>
              <TextInput
                value={rpe}
                onChangeText={setRpe}
                keyboardType="numeric"
                placeholder={rpeTarget.toString()}
                style={[styles.input, styles.rpeInput]}
              />
            </View>
          )}

          <Button onPress={handleSave} disabled={!weight || !reps} size="small">
            Speichern
          </Button>
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
    backgroundColor: "#F5F5F5",
    borderRadius: 12,
  },
  headerCompleted: {
    backgroundColor: "#E8F5E9",
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
    color: "#4CAF50",
    fontWeight: "500",
  },
  targetText: {
    fontSize: 14,
    color: "#666",
  },
  rpeText: {
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
  rpeInput: {
    flex: 0,
    width: 80,
  },
  multiplier: {
    fontSize: 20,
    color: "#999",
    marginBottom: 12,
  },
});
