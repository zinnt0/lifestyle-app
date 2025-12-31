import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
} from 'react-native';

interface ExerciseCalorieItem {
  exerciseName: string;
  sets: number;
  calories: number;
}

interface ExerciseCalorieBreakdownProps {
  breakdown: ExerciseCalorieItem[];
  totalCalories: number;
}

const ExerciseCalorieBreakdown: React.FC<ExerciseCalorieBreakdownProps> = ({
  breakdown,
  totalCalories,
}) => {
  // Sort by calories (highest first)
  const sortedBreakdown = [...breakdown].sort((a, b) => b.calories - a.calories);

  const renderItem = ({ item }: { item: ExerciseCalorieItem }) => {
    const percentage = totalCalories > 0 ? (item.calories / totalCalories) * 100 : 0;

    // Color intensity based on calorie amount
    const getBarColor = (percent: number): string => {
      if (percent >= 30) return '#FF6B35'; // High
      if (percent >= 15) return '#FF8C42'; // Medium
      return '#FFB366'; // Low
    };

    return (
      <View style={styles.item}>
        <View style={styles.itemHeader}>
          <Text style={styles.exerciseName}>{item.exerciseName}</Text>
          <Text style={styles.calorieValue}>{item.calories} kcal</Text>
        </View>

        <Text style={styles.setsInfo}>{item.sets} Sätze</Text>

        <View style={styles.progressBarContainer}>
          <View
            style={[
              styles.progressBarFill,
              {
                width: `${percentage}%`,
                backgroundColor: getBarColor(percentage),
              },
            ]}
          />
        </View>

        <Text style={styles.percentage}>{percentage.toFixed(0)}%</Text>
      </View>
    );
  };

  if (breakdown.length === 0) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Kalorienverteilung</Text>
        <Text style={styles.subtitle}>nach Übung</Text>
      </View>

      <FlatList
        data={sortedBreakdown}
        renderItem={renderItem}
        keyExtractor={(item, index) => `${item.exerciseName}-${index}`}
        scrollEnabled={false}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    marginBottom: 20,
    alignItems: 'center',
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
  },
  item: {
    paddingVertical: 12,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  exerciseName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    flex: 1,
  },
  calorieValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FF6B35',
    marginLeft: 12,
  },
  setsInfo: {
    fontSize: 14,
    fontWeight: '400',
    color: '#666666',
    marginBottom: 8,
  },
  progressBarContainer: {
    height: 8,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 6,
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  percentage: {
    fontSize: 12,
    fontWeight: '500',
    color: '#999999',
    textAlign: 'right',
  },
  separator: {
    height: 1,
    backgroundColor: '#F0F0F0',
    marginVertical: 8,
  },
});

export default ExerciseCalorieBreakdown;
