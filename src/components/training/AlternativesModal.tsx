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
import { trainingService } from "@/services/trainingService";
import type { Exercise } from "@/types/training.types";

interface AlternativesModalProps {
  visible: boolean;
  exerciseId: string;
  onSelect: (alternativeId: string) => void;
  onClose: () => void;
}

export const AlternativesModal: React.FC<AlternativesModalProps> = ({
  visible,
  exerciseId,
  onSelect,
  onClose,
}) => {
  const [alternatives, setAlternatives] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (visible) {
      loadAlternatives();
    }
  }, [visible, exerciseId]);

  const loadAlternatives = async () => {
    setLoading(true);
    try {
      const alts = await trainingService.getExerciseAlternatives(exerciseId);
      setAlternatives(alts);
    } catch (error) {
      console.error("Failed to load alternatives:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (alternativeId: string) => {
    onSelect(alternativeId);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Alternative Übungen</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeIcon}>✕</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#4A90E2" />
          </View>
        ) : alternatives.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Keine Alternativen verfügbar</Text>
          </View>
        ) : (
          <ScrollView style={styles.list}>
            {alternatives.map((exercise) => (
              <TouchableOpacity
                key={exercise.id}
                style={styles.alternativeCard}
                onPress={() => handleSelect(exercise.id)}
              >
                <View style={styles.alternativeContent}>
                  <Text style={styles.alternativeName}>{exercise.name_de}</Text>
                  <Text style={styles.alternativeDetails}>
                    {exercise.movement_pattern} •{" "}
                    {exercise.equipment.join(", ")}
                  </Text>
                  <View style={styles.musclesTags}>
                    {exercise.primary_muscles.map((muscle) => (
                      <View key={muscle} style={styles.muscleTag}>
                        <Text style={styles.muscleTagText}>{muscle}</Text>
                      </View>
                    ))}
                  </View>
                </View>
                <Text style={styles.selectIcon}>→</Text>
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
    alignItems: "center",
    justifyContent: "space-between",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  title: {
    fontSize: 20,
    fontWeight: "600",
    color: "#333",
  },
  closeButton: {
    padding: 4,
  },
  closeIcon: {
    fontSize: 24,
    color: "#666",
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
  },
  list: {
    flex: 1,
    padding: 16,
  },
  alternativeCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#F5F5F5",
    borderRadius: 12,
    marginBottom: 12,
  },
  alternativeContent: {
    flex: 1,
    gap: 6,
  },
  alternativeName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  alternativeDetails: {
    fontSize: 14,
    color: "#666",
  },
  musclesTags: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 4,
  },
  muscleTag: {
    backgroundColor: "#E3F2FD",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  muscleTagText: {
    fontSize: 12,
    color: "#1976D2",
  },
  selectIcon: {
    fontSize: 20,
    color: "#4A90E2",
  },
});
