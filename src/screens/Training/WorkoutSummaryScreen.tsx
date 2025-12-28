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

  useEffect(() => {
    calculateStats();
  }, [sessionId]);

  const calculateStats = async () => {
    try {
      setLoading(true);

      // Fetch session data
      const { data: session, error: sessionError } = await supabase
        .from('workout_sessions')
        .select('started_at, completed_at')
        .eq('id', sessionId)
        .single();

      if (sessionError) throw sessionError;

      // Fetch all sets for this session with exercise info
      const { data: sets, error: setsError } = await supabase
        .from('workout_sets')
        .select(
          `
          id,
          weight_kg,
          reps,
          workout_exercises!inner (
            exercises!inner (
              name_de
            )
          )
        `
        )
        .eq('workout_exercises.session_id', sessionId);

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
        const weight = set.weight_kg || 0;
        const reps = set.reps || 0;
        const volume = weight * reps;

        totalVolume += volume;

        // Track best set
        if (volume > maxVolume && weight > 0) {
          maxVolume = volume;
          bestSet = {
            exerciseName: set.workout_exercises.exercises.name_de,
            weight,
            reps,
            volume,
          };
        }
      });

      // Calculate duration
      let duration = 0;
      if (session?.started_at && session?.completed_at) {
        const startTime = new Date(session.started_at).getTime();
        const endTime = new Date(session.completed_at).getTime();
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
});

export default WorkoutSummaryScreen;
