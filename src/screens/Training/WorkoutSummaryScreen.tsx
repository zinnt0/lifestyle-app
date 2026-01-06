import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { TrainingStackParamList } from '../../navigation/types';
import { supabase } from '../../lib/supabase';
import {
  calculateAndSaveWorkoutCalories,
  WorkoutCalorieCalculation
} from '../../services/calorieCalculationService';
import {
  compareWorkoutPerformance,
  WorkoutPerformanceComparison as PerformanceData,
} from '../../services/performanceComparisonService';
import CalorieCard from '../../components/training/CalorieCard';
import ExerciseCalorieBreakdown from '../../components/training/ExerciseCalorieBreakdown';
import WorkoutPerformanceComparison from '../../components/training/WorkoutPerformanceComparison';
import { localWorkoutHistoryCache } from '../../services/cache/LocalWorkoutHistoryCache';

type WorkoutSummaryScreenNavigationProp = NativeStackNavigationProp<
  TrainingStackParamList,
  'WorkoutSummary'
>;

type WorkoutSummaryScreenRouteProp = RouteProp<
  TrainingStackParamList,
  'WorkoutSummary'
>;

interface Props {
  navigation: WorkoutSummaryScreenNavigationProp;
  route: WorkoutSummaryScreenRouteProp;
}

interface WorkoutStats {
  totalVolume: number;
  totalSets: number;
  duration: number; // in minutes
  bestSet: {
    exerciseName: string;
    weight: number;
    reps: number;
    volume: number;
  } | null;
}

const WorkoutSummaryScreen: React.FC<Props> = ({ navigation, route }) => {
  const { sessionId } = route.params;
  const [stats, setStats] = useState<WorkoutStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [calorieData, setCalorieData] = useState<WorkoutCalorieCalculation | null>(null);
  const [isLoadingCalories, setIsLoadingCalories] = useState(true);
  const [performanceData, setPerformanceData] = useState<PerformanceData | null>(null);
  const [isLoadingPerformance, setIsLoadingPerformance] = useState(true);

  useEffect(() => {
    calculateStats();
    loadCalories();
    loadPerformanceComparison();
    cacheWorkoutData();
  }, [sessionId]);

  const cacheWorkoutData = async () => {
    try {
      console.log('Caching workout session data...');
      await localWorkoutHistoryCache.cacheWorkoutSession(sessionId);
      console.log('Workout data cached successfully');
    } catch (error) {
      console.error('Failed to cache workout data:', error);
      // Don't show error to user, just log it
    }
  };

  const loadCalories = async () => {
    try {
      setIsLoadingCalories(true);
      const data = await calculateAndSaveWorkoutCalories(sessionId);
      setCalorieData(data);
    } catch (error) {
      console.error('Fehler beim Laden der Kalorien:', error);
      // Don't show error to user, just log it
    } finally {
      setIsLoadingCalories(false);
    }
  };

  const loadPerformanceComparison = async () => {
    try {
      setIsLoadingPerformance(true);
      const data = await compareWorkoutPerformance(sessionId);
      setPerformanceData(data);
    } catch (error) {
      console.error('Fehler beim Laden des Performance-Vergleichs:', error);
      // Don't show error to user, just log it
    } finally {
      setIsLoadingPerformance(false);
    }
  };

  const calculateStats = async () => {
    try {
      setLoading(true);

      // Fetch session data
      const { data: session, error: sessionError } = await supabase
        .from('workout_sessions')
        .select('start_time, end_time')
        .eq('id', sessionId)
        .single();

      if (sessionError) throw sessionError;

      // Fetch all sets for this session with exercise info
      const { data: sets, error: setsError } = await supabase
        .from('workout_sets')
        .select(
          `
          id,
          weight,
          reps,
          exercise:exercises!inner (
            name_de
          )
        `
        )
        .eq('session_id', sessionId);

      if (setsError) throw setsError;

      if (!sets || sets.length === 0) {
        setStats({
          totalVolume: 0,
          totalSets: 0,
          duration: 0,
          bestSet: null,
        });
        setLoading(false);
        return;
      }

      // Calculate total volume
      let totalVolume = 0;
      let bestSet: WorkoutStats['bestSet'] = null;
      let maxVolume = 0;

      sets.forEach((set: any) => {
        const weight = set.weight || 0;
        const reps = set.reps || 0;
        const volume = weight * reps;

        totalVolume += volume;

        // Track best set
        if (volume > maxVolume && weight > 0) {
          maxVolume = volume;
          bestSet = {
            exerciseName: set.exercise.name_de,
            weight,
            reps,
            volume,
          };
        }
      });

      // Calculate duration
      let duration = 0;
      if (session?.start_time && session?.end_time) {
        const startTime = new Date(session.start_time).getTime();
        const endTime = new Date(session.end_time).getTime();
        duration = Math.round((endTime - startTime) / 1000 / 60); // Convert to minutes
      }

      setStats({
        totalVolume,
        totalSets: sets.length,
        duration,
        bestSet,
      });
    } catch (error) {
      console.error('Error calculating workout stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatVolume = (volume: number): string => {
    return volume.toLocaleString('de-DE', {
      maximumFractionDigits: 0,
    });
  };

  const formatDuration = (minutes: number): string => {
    if (minutes === 0) return 'Nicht verfügbar';
    return `${minutes} min`;
  };

  const handleFinish = () => {
    // Navigate back to Training Dashboard
    navigation.navigate('TrainingDashboard');
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4A90E2" />
          <Text style={styles.loadingText}>Berechne Statistiken...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Congratulations Header */}
        <View style={styles.header}>
          <Text style={styles.emojiLarge}>🎉</Text>
          <Text style={styles.title}>Finished Workout!</Text>
          <Text style={styles.subtitle}>Du hast es geschafft!</Text>
        </View>

        {/* Stats Card */}
        <View style={styles.statsCard}>
          <Text style={styles.statsTitle}>
            Auswertung deines heutigen Workouts!
          </Text>

          {stats && (
            <View style={styles.statsContent}>
              {/* Total Volume */}
              <View style={styles.statRow}>
                <View style={styles.statBar}>
                  <LinearGradient
                    colors={['#4A90E2', '#357ABD']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={[
                      styles.statBarFill,
                      { width: stats.totalVolume > 0 ? '100%' : '10%' },
                    ]}
                  />
                </View>
                <Text style={styles.statValue}>
                  {formatVolume(stats.totalVolume)} kg
                </Text>
              </View>

              {/* Total Sets */}
              <View style={styles.statRow}>
                <View style={styles.statBar}>
                  <LinearGradient
                    colors={['#7B68EE', '#6A5ACD']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={[
                      styles.statBarFill,
                      {
                        width:
                          stats.totalSets > 0
                            ? `${Math.min((stats.totalSets / 30) * 100, 100)}%`
                            : '10%',
                      },
                    ]}
                  />
                </View>
                <Text style={styles.statValue}>{stats.totalSets} Sätze</Text>
              </View>

              {/* Duration */}
              <View style={styles.statRow}>
                <View style={styles.statBar}>
                  <LinearGradient
                    colors={['#4CAF50', '#45A049']}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 1, y: 0 }}
                    style={[
                      styles.statBarFill,
                      {
                        width:
                          stats.duration > 0
                            ? `${Math.min((stats.duration / 90) * 100, 100)}%`
                            : '10%',
                      },
                    ]}
                  />
                </View>
                <Text style={styles.statValue}>
                  {formatDuration(stats.duration)}
                </Text>
              </View>

              {/* Best Set Highlight */}
              {stats.bestSet && (
                <View style={styles.bestSetContainer}>
                  <Text style={styles.bestSetLabel}>💪 Bester Satz:</Text>
                  <Text style={styles.bestSetExercise}>
                    {stats.bestSet.exerciseName}
                  </Text>
                  <Text style={styles.bestSetValue}>
                    {stats.bestSet.weight}kg × {stats.bestSet.reps}
                  </Text>
                </View>
              )}
            </View>
          )}
        </View>

        {/* Performance Comparison */}
        {performanceData && performanceData.exercises.length > 0 && (
          <>
            <WorkoutPerformanceComparison
              exercises={performanceData.exercises}
              isLoading={isLoadingPerformance}
            />

            {/* Explanation Info Box */}
            <View style={styles.infoBox}>
              <View style={styles.infoBoxHeader}>
                <Text style={styles.infoBoxIcon}>ℹ️</Text>
                <Text style={styles.infoBoxTitle}>Wie wird der Vergleich berechnet?</Text>
              </View>
              <View style={styles.infoBoxContent}>
                <Text style={styles.infoBoxText}>
                  Der Vergleich basiert auf deiner <Text style={styles.infoBoxBold}>letzten Session des gleichen Workouts</Text>.
                </Text>
                <Text style={styles.infoBoxText}>
                  Für jede Übung berechnen wir einen <Text style={styles.infoBoxBold}>kombinierten Score</Text> aus:
                </Text>
                <View style={styles.infoBoxList}>
                  <Text style={styles.infoBoxListItem}>• Durchschnittliches Gewicht aller Sätze</Text>
                  <Text style={styles.infoBoxListItem}>• Durchschnittliche Wiederholungen aller Sätze</Text>
                  <Text style={styles.infoBoxListItem}>• Durchschnittliches Gesamtvolumen (Gewicht × Reps)</Text>
                </View>
                <Text style={styles.infoBoxText}>
                  Die <Text style={styles.infoBoxBold}>prozentuale Änderung</Text> zeigt deine Verbesserung oder Verschlechterung im Vergleich zur letzten Session.
                </Text>
              </View>
            </View>
          </>
        )}

        {/* Calorie Card */}
        {calorieData && (
          <>
            <CalorieCard
              totalCalories={calorieData.totalCalories}
              activeTimeMinutes={calorieData.activeTimeMinutes}
              averageMET={calorieData.averageMET}
              isLoading={isLoadingCalories}
            />

            <ExerciseCalorieBreakdown
              breakdown={calorieData.breakdown}
              totalCalories={calorieData.totalCalories}
            />
          </>
        )}

        {/* Finish Button */}
        <TouchableOpacity
          style={styles.finishButton}
          onPress={handleFinish}
          activeOpacity={0.8}
        >
          <LinearGradient
            colors={['#4A90E2', '#7B68EE']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={styles.finishButtonGradient}
          >
            <Text style={styles.finishButtonText}>Fertig</Text>
          </LinearGradient>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666666',
  },
  scrollContent: {
    padding: 20,
    alignItems: 'center',
  },
  header: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 32,
  },
  emojiLarge: {
    fontSize: 64,
    marginBottom: 16,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#333333',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '400',
    color: '#666666',
    textAlign: 'center',
  },
  statsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 32,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 24,
    textAlign: 'center',
  },
  statsContent: {
    gap: 20,
  },
  statRow: {
    gap: 8,
  },
  statBar: {
    height: 32,
    backgroundColor: '#E0E0E0',
    borderRadius: 8,
    overflow: 'hidden',
  },
  statBarFill: {
    height: '100%',
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingRight: 12,
  },
  statValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
  },
  bestSetContainer: {
    marginTop: 16,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
    alignItems: 'center',
  },
  bestSetLabel: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 8,
  },
  bestSetExercise: {
    fontSize: 16,
    fontWeight: '500',
    color: '#666666',
    marginBottom: 4,
  },
  bestSetValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#4CAF50',
  },
  finishButton: {
    width: '100%',
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
  },
  finishButtonGradient: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    alignItems: 'center',
  },
  finishButtonText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  // Info Box Styles
  infoBox: {
    backgroundColor: '#E3F2FD',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderLeftWidth: 4,
    borderLeftColor: '#4A90E2',
    width: '100%',
  },
  infoBoxHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    gap: 8,
  },
  infoBoxIcon: {
    fontSize: 20,
  },
  infoBoxTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1976D2',
    flex: 1,
  },
  infoBoxContent: {
    gap: 8,
  },
  infoBoxText: {
    fontSize: 14,
    color: '#424242',
    lineHeight: 20,
  },
  infoBoxBold: {
    fontWeight: '700',
    color: '#1976D2',
  },
  infoBoxList: {
    marginLeft: 8,
    marginTop: 4,
    marginBottom: 4,
  },
  infoBoxListItem: {
    fontSize: 14,
    color: '#424242',
    lineHeight: 20,
    marginBottom: 2,
  },
});

export default WorkoutSummaryScreen;
