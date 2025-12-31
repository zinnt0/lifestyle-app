import React from 'react';
import { View, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { ExercisePerformance } from '@/services/performanceComparisonService';
import ExercisePerformanceBar from './ExercisePerformanceBar';

interface WorkoutPerformanceComparisonProps {
  exercises: ExercisePerformance[];
  isLoading?: boolean;
}

const WorkoutPerformanceComparison: React.FC<WorkoutPerformanceComparisonProps> = ({
  exercises,
  isLoading = false,
}) => {
  if (isLoading) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Performance-Vergleich</Text>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="small" color="#4A90E2" />
          <Text style={styles.loadingText}>Berechne Performance...</Text>
        </View>
      </View>
    );
  }

  if (!exercises || exercises.length === 0) {
    return null;
  }

  // Prüfe ob mindestens eine Übung Vergleichsdaten hat
  const hasAnyComparison = exercises.some((ex) => ex.hasPreviousData);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Performance-Vergleich</Text>
      <Text style={styles.subtitle}>
        {hasAnyComparison
          ? 'Vergleich zur letzten Woche'
          : 'Keine Vergleichsdaten verfügbar'
        }
      </Text>

      <View style={styles.exercisesContainer}>
        {exercises.map((exercise) => (
          <ExercisePerformanceBar
            key={exercise.exerciseId}
            exerciseName={exercise.exerciseName}
            percentageChange={exercise.percentageChange}
            hasPreviousData={exercise.hasPreviousData}
          />
        ))}
      </View>

      {hasAnyComparison && (
        <View style={styles.legend}>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, styles.positiveDot]} />
            <Text style={styles.legendText}>Verbesserung (nach rechts)</Text>
          </View>
          <View style={styles.legendItem}>
            <View style={[styles.legendDot, styles.negativeDot]} />
            <Text style={styles.legendText}>Verschlechterung (nach links)</Text>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 20,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '400',
    color: '#666666',
    marginBottom: 20,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
  },
  loadingText: {
    marginLeft: 12,
    fontSize: 14,
    color: '#666666',
  },
  exercisesContainer: {
    marginBottom: 16,
  },
  legend: {
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    gap: 8,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  legendDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  positiveDot: {
    backgroundColor: '#4CAF50',
  },
  negativeDot: {
    backgroundColor: '#F44336',
  },
  legendText: {
    fontSize: 12,
    color: '#666666',
  },
});

export default WorkoutPerformanceComparison;
