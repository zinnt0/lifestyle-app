/**
 * Workout History Screen
 *
 * Displays historical workout data for exercises with:
 * - Exercise selector dropdown
 * - Tabbed metrics view (Top Set, Avg Reps, Avg Weight, Volume, e1RM)
 * - Line charts for progress visualization
 */

import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  TouchableOpacity,
  Dimensions,
  Modal,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LineChart } from 'react-native-chart-kit';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RouteProp } from '@react-navigation/native';
import { TrainingStackParamList } from '../../navigation/types';
import { supabase } from '../../lib/supabase';
import {
  localWorkoutHistoryCache,
  ExerciseHistoryPoint,
} from '../../services/cache/LocalWorkoutHistoryCache';

type WorkoutHistoryScreenNavigationProp = NativeStackNavigationProp<
  TrainingStackParamList,
  'WorkoutHistory'
>;

type WorkoutHistoryScreenRouteProp = RouteProp<
  TrainingStackParamList,
  'WorkoutHistory'
>;

interface Props {
  navigation: WorkoutHistoryScreenNavigationProp;
  route: WorkoutHistoryScreenRouteProp;
}

type MetricTab = 'top_set' | 'avg_reps' | 'avg_weight' | 'volume' | 'e1rm';

interface ExerciseOption {
  exercise_id: string;
  exercise_name: string;
  session_count: number;
}

type SessionFilter = 5 | 10 | 15 | 'all';

const WorkoutHistoryScreen: React.FC<Props> = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [exercises, setExercises] = useState<ExerciseOption[]>([]);
  const [selectedExercise, setSelectedExercise] = useState<string>('');
  const [selectedTab, setSelectedTab] = useState<MetricTab>('top_set');
  const [historyData, setHistoryData] = useState<ExerciseHistoryPoint[]>([]);
  const [userId, setUserId] = useState<string>('');
  const [dropdownVisible, setDropdownVisible] = useState(false);
  const [sessionFilter, setSessionFilter] = useState<SessionFilter>(10);

  useEffect(() => {
    loadUserAndExercises();
  }, []);

  useEffect(() => {
    if (selectedExercise && userId) {
      loadExerciseHistory();
    }
  }, [selectedExercise, userId]);

  const loadUserAndExercises = async () => {
    try {
      setLoading(true);

      // Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        console.error('No user found');
        return;
      }

      setUserId(user.id);

      // Check if we have cached data, if not load historical data first
      const hasData = await localWorkoutHistoryCache.hasHistoricalData(user.id);

      if (!hasData) {
        console.log('[WorkoutHistory] No cached data found, loading historical data...');
        const cachedCount = await localWorkoutHistoryCache.loadHistoricalData(user.id, 12);
        console.log(`[WorkoutHistory] Cached ${cachedCount} historical sessions`);
      }

      // Load exercises with history
      const exercisesList = await localWorkoutHistoryCache.getExercisesWithHistory(user.id);

      if (exercisesList.length === 0) {
        console.log('No exercises with history found');
        setExercises([]);
        setLoading(false);
        return;
      }

      setExercises(exercisesList);
      setSelectedExercise(exercisesList[0].exercise_id);
    } catch (error) {
      console.error('Error loading exercises:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadExerciseHistory = async () => {
    try {
      const history = await localWorkoutHistoryCache.getExerciseHistory(
        userId,
        selectedExercise,
        50 // Last 50 sessions
      );

      // Reverse to show oldest first (for chart)
      setHistoryData(history.reverse());
    } catch (error) {
      console.error('Error loading exercise history:', error);
    }
  };

  const getFilteredData = () => {
    if (historyData.length === 0) return [];

    if (sessionFilter === 'all') {
      return historyData;
    }

    return historyData.slice(-sessionFilter);
  };

  const getChartData = () => {
    const filteredData = getFilteredData();

    if (filteredData.length === 0) {
      return {
        labels: ['No Data'],
        datasets: [{ data: [0] }],
      };
    }

    // Use filtered data for chart
    const recentData = filteredData;

    const labels = recentData.map((point) => {
      const date = new Date(point.date);
      return `${date.getDate()}.${date.getMonth() + 1}`;
    });

    let dataPoints: number[] = [];
    let tooltipSuffix = '';

    switch (selectedTab) {
      case 'top_set':
        dataPoints = recentData.map((point) => point.top_weight);
        tooltipSuffix = 'kg';
        break;
      case 'avg_reps':
        dataPoints = recentData.map((point) => point.avg_reps);
        tooltipSuffix = 'reps';
        break;
      case 'avg_weight':
        dataPoints = recentData.map((point) => point.avg_weight);
        tooltipSuffix = 'kg';
        break;
      case 'volume':
        dataPoints = recentData.map((point) => point.total_volume);
        tooltipSuffix = 'kg';
        break;
      case 'e1rm':
        dataPoints = recentData.map((point) => point.e1rm || 0);
        tooltipSuffix = 'kg';
        break;
    }

    return {
      labels,
      datasets: [
        {
          data: dataPoints,
          color: (opacity = 1) => `rgba(74, 144, 226, ${opacity})`,
          strokeWidth: 3,
        },
      ],
      legend: [tooltipSuffix],
    };
  };

  const getTooltipData = (index: number): string => {
    if (historyData.length === 0) return '';

    const recentData = historyData.slice(-10);
    if (index >= recentData.length) return '';

    const point = recentData[index];

    switch (selectedTab) {
      case 'top_set':
        return `${point.top_weight} kg × ${point.top_reps}`;
      case 'avg_reps':
        return `${point.avg_reps.toFixed(1)} reps`;
      case 'avg_weight':
        return `${point.avg_weight.toFixed(1)} kg`;
      case 'volume':
        return `${point.total_volume.toFixed(0)} kg`;
      case 'e1rm':
        return point.e1rm ? `${point.e1rm.toFixed(1)} kg` : 'N/A';
      default:
        return '';
    }
  };

  const renderTabButton = (tab: MetricTab, label: string) => {
    const isSelected = selectedTab === tab;
    return (
      <TouchableOpacity
        key={tab}
        style={[styles.tabButton, isSelected && styles.tabButtonActive]}
        onPress={() => setSelectedTab(tab)}
      >
        <Text style={[styles.tabButtonText, isSelected && styles.tabButtonTextActive]}>
          {label}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderFilterButton = (filter: SessionFilter, label: string) => {
    const isSelected = sessionFilter === filter;
    return (
      <TouchableOpacity
        key={filter}
        style={[styles.filterButton, isSelected && styles.filterButtonActive]}
        onPress={() => setSessionFilter(filter)}
      >
        <Text style={[styles.filterButtonText, isSelected && styles.filterButtonTextActive]}>
          {label}
        </Text>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#4A90E2" />
          <Text style={styles.loadingText}>Lade Historie...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (exercises.length === 0) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Text style={styles.backButtonText}>← Zurück</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Workout-Historie</Text>
        </View>
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyEmoji}>📊</Text>
          <Text style={styles.emptyTitle}>Noch keine Daten</Text>
          <Text style={styles.emptyText}>
            Absolviere dein erstes Workout, um deine Historie zu starten!
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  const selectedExerciseName =
    exercises.find((ex) => ex.exercise_id === selectedExercise)?.exercise_name ||
    'Übung auswählen';

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Text style={styles.backButtonText}>← Zurück</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Workout-Historie</Text>
        </View>

        {/* Exercise Selector */}
        <View style={styles.pickerCard}>
          <Text style={styles.pickerLabel}>Übung auswählen:</Text>
          <TouchableOpacity
            style={styles.dropdownButton}
            onPress={() => setDropdownVisible(true)}
          >
            <Text style={styles.dropdownButtonText}>
              {exercises.find((ex) => ex.exercise_id === selectedExercise)?.exercise_name ||
                'Übung auswählen'}
            </Text>
            <Text style={styles.dropdownIcon}>▼</Text>
          </TouchableOpacity>
        </View>

        {/* Dropdown Modal */}
        <Modal
          visible={dropdownVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setDropdownVisible(false)}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setDropdownVisible(false)}
          >
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Übung auswählen</Text>
                <TouchableOpacity onPress={() => setDropdownVisible(false)}>
                  <Text style={styles.modalCloseButton}>✕</Text>
                </TouchableOpacity>
              </View>
              <FlatList
                data={exercises}
                keyExtractor={(item) => item.exercise_id}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={[
                      styles.dropdownItem,
                      item.exercise_id === selectedExercise && styles.dropdownItemSelected,
                    ]}
                    onPress={() => {
                      setSelectedExercise(item.exercise_id);
                      setDropdownVisible(false);
                    }}
                  >
                    <Text
                      style={[
                        styles.dropdownItemText,
                        item.exercise_id === selectedExercise &&
                          styles.dropdownItemTextSelected,
                      ]}
                    >
                      {item.exercise_name}
                    </Text>
                    <Text
                      style={[
                        styles.dropdownItemCount,
                        item.exercise_id === selectedExercise &&
                          styles.dropdownItemCountSelected,
                      ]}
                    >
                      {item.session_count}x
                    </Text>
                  </TouchableOpacity>
                )}
              />
            </View>
          </TouchableOpacity>
        </Modal>

        {/* Tab Buttons */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsContainer}
        >
          {renderTabButton('top_set', 'Top Set (kg)')}
          {renderTabButton('avg_reps', 'Avg Reps')}
          {renderTabButton('avg_weight', 'Avg Weight (kg)')}
          {renderTabButton('volume', 'Volume')}
          {renderTabButton('e1rm', 'e1RM')}
        </ScrollView>

        {/* Chart Card */}
        {historyData.length > 0 ? (
          <View style={styles.chartCard}>
            <Text style={styles.chartTitle}>
              {selectedTab === 'top_set' && 'Höchstes Gewicht pro Session'}
              {selectedTab === 'avg_reps' && 'Durchschnittliche Wiederholungen'}
              {selectedTab === 'avg_weight' && 'Durchschnittliches Gewicht'}
              {selectedTab === 'volume' && 'Gesamtvolumen'}
              {selectedTab === 'e1rm' && 'Geschätztes 1RM (Epley-Formel)'}
            </Text>

            <LineChart
              data={getChartData()}
              width={Dimensions.get('window').width - 64}
              height={240}
              chartConfig={{
                backgroundColor: '#FFFFFF',
                backgroundGradientFrom: '#FFFFFF',
                backgroundGradientTo: '#FFFFFF',
                decimalPlaces: 1,
                color: (opacity = 1) => `rgba(74, 144, 226, ${opacity})`,
                labelColor: (opacity = 1) => `rgba(51, 51, 51, ${opacity})`,
                style: {
                  borderRadius: 16,
                },
                propsForDots: {
                  r: '5',
                  strokeWidth: '2',
                  stroke: '#4A90E2',
                },
              }}
              bezier
              style={styles.chart}
              withInnerLines={true}
              withOuterLines={true}
              withVerticalLines={false}
              withHorizontalLines={true}
              withVerticalLabels={true}
              withHorizontalLabels={true}
              fromZero={false}
              verticalLabelRotation={45}
            />

            {/* Session Filter - inside chart card */}
            <View style={styles.chartFilterContainer}>
              <Text style={styles.chartFilterLabel}>Anzahl Sessions:</Text>
              <View style={styles.chartFilterButtons}>
                {renderFilterButton(5, '5')}
                {renderFilterButton(10, '10')}
                {renderFilterButton(15, '15')}
                {renderFilterButton('all', 'Alle')}
              </View>
            </View>
          </View>
        ) : (
          <View style={styles.noDataCard}>
            <Text style={styles.noDataText}>
              Keine Daten für diese Übung verfügbar
            </Text>
          </View>
        )}

        {/* Stats Summary */}
        {historyData.length > 0 && (() => {
          const filteredData = getFilteredData();
          return (
            <View style={styles.statsCard}>
              <Text style={styles.statsTitle}>Zusammenfassung</Text>
              <View style={styles.statsGrid}>
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>Sessions</Text>
                  <Text style={styles.statValue}>{filteredData.length}</Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>Top Weight</Text>
                  <Text style={styles.statValue}>
                    {Math.max(...filteredData.map((d) => d.top_weight)).toFixed(1)} kg
                  </Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>Avg Reps</Text>
                  <Text style={styles.statValue}>
                    {(
                      filteredData.reduce((sum, d) => sum + d.avg_reps, 0) /
                      filteredData.length
                    ).toFixed(1)}
                  </Text>
                </View>
                <View style={styles.statItem}>
                  <Text style={styles.statLabel}>Total Volume</Text>
                  <Text style={styles.statValue}>
                    {filteredData
                      .reduce((sum, d) => sum + d.total_volume, 0)
                      .toFixed(0)}{' '}
                    kg
                  </Text>
                </View>
              </View>
            </View>
          );
        })()}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  scrollContent: {
    padding: 20,
  },
  header: {
    marginBottom: 24,
  },
  backButton: {
    marginBottom: 12,
  },
  backButtonText: {
    fontSize: 16,
    color: '#4A90E2',
    fontWeight: '600',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#333333',
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
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#333333',
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 24,
  },
  pickerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  pickerLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 12,
  },
  dropdownButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  dropdownButtonText: {
    fontSize: 16,
    color: '#333333',
    flex: 1,
  },
  dropdownIcon: {
    fontSize: 12,
    color: '#666666',
    marginLeft: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    width: '100%',
    maxHeight: '70%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
  },
  modalCloseButton: {
    fontSize: 24,
    color: '#666666',
    fontWeight: '300',
  },
  dropdownItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  dropdownItemSelected: {
    backgroundColor: '#E8F4FF',
  },
  dropdownItemText: {
    fontSize: 16,
    color: '#333333',
    flex: 1,
  },
  dropdownItemTextSelected: {
    color: '#4A90E2',
    fontWeight: '600',
  },
  dropdownItemCount: {
    fontSize: 14,
    color: '#666666',
    marginLeft: 8,
  },
  dropdownItemCountSelected: {
    color: '#4A90E2',
    fontWeight: '600',
  },
  filterCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  filterLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 12,
  },
  filterButtonsContainer: {
    flexDirection: 'row',
    gap: 8,
    flexWrap: 'wrap',
  },
  filterButton: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
    alignItems: 'center',
  },
  filterButtonActive: {
    backgroundColor: '#4A90E2',
    borderColor: '#4A90E2',
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666666',
  },
  filterButtonTextActive: {
    color: '#FFFFFF',
  },
  tabsContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  tabButton: {
    backgroundColor: '#FFFFFF',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  tabButtonActive: {
    backgroundColor: '#4A90E2',
    borderColor: '#4A90E2',
  },
  tabButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666666',
  },
  tabButtonTextActive: {
    color: '#FFFFFF',
  },
  chartCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  chartTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 16,
    textAlign: 'center',
  },
  chart: {
    marginVertical: 8,
    borderRadius: 16,
  },
  chartFilterContainer: {
    marginTop: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#E0E0E0',
  },
  chartFilterLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 12,
  },
  chartFilterButtons: {
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'space-between',
  },
  legendContainer: {
    marginTop: 12,
    alignItems: 'center',
  },
  legendText: {
    fontSize: 12,
    color: '#666666',
  },
  noDataCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 40,
    marginBottom: 16,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  noDataText: {
    fontSize: 16,
    color: '#666666',
    textAlign: 'center',
  },
  statsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  statsTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333333',
    marginBottom: 16,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  statItem: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: '#F5F5F5',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  statLabel: {
    fontSize: 12,
    color: '#666666',
    marginBottom: 4,
  },
  statValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#4A90E2',
  },
});

export default WorkoutHistoryScreen;
