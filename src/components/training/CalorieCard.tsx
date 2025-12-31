import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface CalorieCardProps {
  totalCalories: number;
  activeTimeMinutes: number;
  averageMET: number;
  isLoading?: boolean;
}

const CalorieCard: React.FC<CalorieCardProps> = ({
  totalCalories,
  activeTimeMinutes,
  averageMET,
  isLoading = false,
}) => {
  if (isLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.card}>
          <ActivityIndicator size="large" color="#FF6B35" />
          <Text style={styles.loadingText}>Berechne Kalorien...</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#FF6B35', '#FF8C42']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.card}
      >
        <View style={styles.header}>
          <Text style={styles.icon}>🔥</Text>
          <Text style={styles.title}>Verbrannte Kalorien</Text>
        </View>

        <View style={styles.calorieSection}>
          <Text style={styles.calorieNumber}>{Math.round(totalCalories)}</Text>
          <Text style={styles.calorieUnit}>kcal</Text>
        </View>

        <View style={styles.statsRow}>
          <Text style={styles.subtitle}>
            {activeTimeMinutes.toFixed(1)} Min Training • {averageMET.toFixed(1)} METs Ø
          </Text>
        </View>
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    marginBottom: 16,
  },
  card: {
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  icon: {
    fontSize: 28,
    marginRight: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  calorieSection: {
    alignItems: 'center',
    marginBottom: 16,
  },
  calorieNumber: {
    fontSize: 56,
    fontWeight: '700',
    color: '#FFFFFF',
    lineHeight: 64,
  },
  calorieUnit: {
    fontSize: 24,
    fontWeight: '400',
    color: '#FFF5F0',
    marginTop: -8,
  },
  statsRow: {
    alignItems: 'center',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.3)',
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#FFF5F0',
    textAlign: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
  },
});

export default CalorieCard;
