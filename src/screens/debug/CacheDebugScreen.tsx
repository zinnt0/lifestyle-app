/**
 * Cache Debug Screen
 *
 * Development tool for inspecting and managing local SQLite caches
 * - Food Cache (Top 50 foods)
 * - Nutrition Cache (Last 30 days)
 * - Profile Cache (Permanent)
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { localFoodCache } from '@/services/cache/LocalFoodCache';
import { localNutritionCache } from '@/services/cache/LocalNutritionCache';
import { localProfileCache } from '@/services/cache/LocalProfileCache';
import { localWorkoutHistoryCache } from '@/services/cache/LocalWorkoutHistoryCache';
import { nutritionSyncService } from '@/services/NutritionSyncService';
import { profileSyncService } from '@/services/ProfileSyncService';

interface CacheStats {
  food: {
    count: number;
    topFoods: any[];
  };
  nutrition: {
    total_days: number;
    oldest_date: string | null;
    newest_date: string | null;
    last_sync: string | null;
    entries: any[]; // All cached nutrition entries
  };
  profile: {
    isCached: boolean;
    cached_at: string | null;
    updated_at: string | null;
  };
  workoutHistory: {
    sessionCount: number;
    exerciseCount: number;
    exercises: any[];
  };
}

export default function CacheDebugScreen({ route }: { route?: any }) {
  const userId = route?.params?.userId || 'current-user';

  const [stats, setStats] = useState<CacheStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);

  /**
   * Load cache statistics
   */
  const loadStats = async () => {
    try {
      setLoading(true);

      // Food cache stats
      const foodCount = await localFoodCache.getCacheSize();
      const topFoods = await localFoodCache.getTopFoods(10);

      // Nutrition cache stats
      const nutritionStats = await localNutritionCache.getCacheStats();
      const nutritionEntries = await localNutritionCache.getAllCachedEntries();

      // Profile cache stats
      const profileCached = await localProfileCache.isProfileCached(userId);
      const profileMeta = await localProfileCache.getCacheMetadata(userId);

      // Workout history cache stats
      const hasWorkoutHistory = await localWorkoutHistoryCache.hasHistoricalData(userId);
      const workoutExercises = hasWorkoutHistory
        ? await localWorkoutHistoryCache.getExercisesWithHistory(userId)
        : [];

      setStats({
        food: {
          count: foodCount,
          topFoods: topFoods,
        },
        nutrition: {
          ...nutritionStats,
          entries: nutritionEntries,
        },
        profile: {
          isCached: profileCached,
          cached_at: profileMeta.cached_at,
          updated_at: profileMeta.updated_at,
        },
        workoutHistory: {
          sessionCount: workoutExercises.reduce((sum, ex) => sum + ex.session_count, 0),
          exerciseCount: workoutExercises.length,
          exercises: workoutExercises.slice(0, 10), // Top 10
        },
      });
    } catch (error) {
      console.error('[CacheDebug] Error loading stats:', error);
      Alert.alert('Error', 'Failed to load cache stats');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Refresh stats
   */
  const handleRefresh = async () => {
    setRefreshing(true);
    await loadStats();
    setRefreshing(false);
  };

  /**
   * Clear food cache
   */
  const handleClearFoodCache = () => {
    Alert.alert(
      'Clear Food Cache',
      `Are you sure? This will delete ${stats?.food.count || 0} cached foods.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            try {
              await localFoodCache.clearCache();
              Alert.alert('Success', 'Food cache cleared');
              await loadStats();
            } catch (error) {
              Alert.alert('Error', 'Failed to clear food cache');
            }
          },
        },
      ]
    );
  };

  /**
   * Clear nutrition cache
   */
  const handleClearNutritionCache = () => {
    Alert.alert(
      'Clear Nutrition Cache',
      `Are you sure? This will delete ${stats?.nutrition.total_days || 0} days of nutrition data.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            try {
              await localNutritionCache.clearCache();
              Alert.alert('Success', 'Nutrition cache cleared');
              await loadStats();
            } catch (error) {
              Alert.alert('Error', 'Failed to clear nutrition cache');
            }
          },
        },
      ]
    );
  };

  /**
   * Clear profile cache
   */
  const handleClearProfileCache = () => {
    Alert.alert(
      'Clear Profile Cache',
      'Are you sure? You will need to reload profile from Supabase.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            try {
              await localProfileCache.deleteProfile(userId);
              Alert.alert('Success', 'Profile cache cleared');
              await loadStats();
            } catch (error) {
              Alert.alert('Error', 'Failed to clear profile cache');
            }
          },
        },
      ]
    );
  };

  /**
   * Force sync nutrition
   */
  const handleSyncNutrition = async () => {
    try {
      Alert.alert('Syncing...', 'Fetching today from Supabase');
      const result = await nutritionSyncService.syncNutritionData(userId, {
        force: true,
        daysToSync: 1,
      });

      Alert.alert(
        'Sync Complete',
        `Synced ${result.daysSynced} days\nErrors: ${result.errors.length}`
      );
      await loadStats();
    } catch (error) {
      Alert.alert('Error', 'Failed to sync nutrition data');
    }
  };

  /**
   * Force sync profile
   */
  const handleSyncProfile = async () => {
    try {
      Alert.alert('Syncing...', 'Fetching profile from Supabase');
      await profileSyncService.refreshProfile(userId);
      Alert.alert('Success', 'Profile synced successfully');
      await loadStats();
    } catch (error) {
      Alert.alert('Error', 'Failed to sync profile');
    }
  };

  /**
   * Clear workout history cache
   */
  const handleClearWorkoutHistoryCache = () => {
    Alert.alert(
      'Clear Workout History Cache',
      `Are you sure? This will delete ${stats?.workoutHistory.sessionCount || 0} cached workout sessions.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            try {
              await localWorkoutHistoryCache.clearCache();
              Alert.alert('Success', 'Workout history cache cleared');
              await loadStats();
            } catch (error) {
              Alert.alert('Error', 'Failed to clear workout history cache');
            }
          },
        },
      ]
    );
  };

  /**
   * Load historical workout data
   */
  const handleLoadHistoricalWorkouts = async () => {
    try {
      Alert.alert('Loading...', 'Fetching historical workout data from Supabase');
      const cachedCount = await localWorkoutHistoryCache.loadHistoricalData(userId, 12);
      Alert.alert('Success', `Loaded ${cachedCount} workout sessions into cache`);
      await loadStats();
    } catch (error) {
      Alert.alert('Error', 'Failed to load historical workout data');
    }
  };

  /**
   * Clear all caches
   */
  const handleClearAllCaches = () => {
    Alert.alert(
      'Clear ALL Caches',
      'This will delete ALL cached data. Are you absolutely sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear Everything',
          style: 'destructive',
          onPress: async () => {
            try {
              await localFoodCache.clearCache();
              await localNutritionCache.clearCache();
              await localProfileCache.deleteProfile(userId);
              await localWorkoutHistoryCache.clearCache();
              Alert.alert('Success', 'All caches cleared');
              await loadStats();
            } catch (error) {
              Alert.alert('Error', 'Failed to clear all caches');
            }
          },
        },
      ]
    );
  };

  /**
   * Toggle section expansion
   */
  const toggleSection = (section: string) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  // Initial load
  useEffect(() => {
    loadStats();
  }, []);

  if (loading && !stats) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" />
        <Text style={styles.loadingText}>Loading cache stats...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>🔧 Cache Debug</Text>
        <Text style={styles.subtitle}>Local SQLite Cache Inspector</Text>
      </View>

      {/* Food Cache Section */}
      <View style={styles.section}>
        <TouchableOpacity
          style={styles.sectionHeader}
          onPress={() => toggleSection('food')}
        >
          <Text style={styles.sectionTitle}>
            🍔 Food Cache ({stats?.food.count || 0} items)
          </Text>
          <Text style={styles.expandIcon}>
            {expandedSection === 'food' ? '▼' : '▶'}
          </Text>
        </TouchableOpacity>

        {expandedSection === 'food' && (
          <View style={styles.sectionContent}>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Cached Foods:</Text>
              <Text style={styles.statValue}>{stats?.food.count || 0}/50</Text>
            </View>

            <Text style={styles.subheading}>Top 10 Most Used:</Text>
            {stats?.food.topFoods.map((food, index) => (
              <View key={food.barcode} style={styles.foodItem}>
                <Text style={styles.foodRank}>#{index + 1}</Text>
                <View style={styles.foodInfo}>
                  <Text style={styles.foodName}>{food.name}</Text>
                  <Text style={styles.foodMeta}>
                    {food.brand || 'No brand'} • Used {food.usage_count}x
                  </Text>
                </View>
              </View>
            ))}

            <TouchableOpacity
              style={styles.dangerButton}
              onPress={handleClearFoodCache}
            >
              <Text style={styles.buttonText}>Clear Food Cache</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Nutrition Cache Section */}
      <View style={styles.section}>
        <TouchableOpacity
          style={styles.sectionHeader}
          onPress={() => toggleSection('nutrition')}
        >
          <Text style={styles.sectionTitle}>
            📊 Nutrition Cache ({stats?.nutrition.total_days || 0} days)
          </Text>
          <Text style={styles.expandIcon}>
            {expandedSection === 'nutrition' ? '▼' : '▶'}
          </Text>
        </TouchableOpacity>

        {expandedSection === 'nutrition' && (
          <View style={styles.sectionContent}>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Cached Days:</Text>
              <Text style={styles.statValue}>
                {stats?.nutrition.total_days || 0}/30
              </Text>
            </View>

            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Oldest Date:</Text>
              <Text style={styles.statValue}>
                {stats?.nutrition.oldest_date || 'N/A'}
              </Text>
            </View>

            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Newest Date:</Text>
              <Text style={styles.statValue}>
                {stats?.nutrition.newest_date || 'N/A'}
              </Text>
            </View>

            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Last Sync:</Text>
              <Text style={styles.statValue}>
                {stats?.nutrition.last_sync
                  ? new Date(stats.nutrition.last_sync).toLocaleString()
                  : 'Never'}
              </Text>
            </View>

            <Text style={styles.subheading}>Cached Entries:</Text>
            {stats?.nutrition.entries && stats.nutrition.entries.length > 0 ? (
              stats.nutrition.entries.map((entry) => {
                const isToday = entry.date === new Date().toISOString().split('T')[0];
                const entryDate = new Date(entry.date);
                const daysAgo = Math.floor((Date.now() - entryDate.getTime()) / (1000 * 60 * 60 * 24));

                return (
                  <View key={entry.date} style={styles.nutritionEntry}>
                    <View style={styles.nutritionEntryHeader}>
                      <Text style={[styles.nutritionDate, isToday && styles.todayDate]}>
                        {entry.date} {isToday && '(Today)'}
                      </Text>
                      <Text style={styles.daysAgo}>
                        {daysAgo === 0 ? 'Today' : `${daysAgo}d ago`}
                      </Text>
                    </View>
                    <View style={styles.nutritionEntryContent}>
                      <Text style={styles.nutritionStat}>
                        🔥 {Math.round(entry.calories_consumed)} / {entry.calorie_goal} kcal
                      </Text>
                      <Text style={styles.nutritionStat}>
                        💪 {Math.round(entry.protein_consumed)}g protein
                      </Text>
                      <Text style={styles.nutritionStat}>
                        💧 {Math.round(entry.water_consumed_ml)}ml water
                      </Text>
                    </View>
                    <Text style={styles.lastSyncText}>
                      Synced: {new Date(entry.last_synced).toLocaleString()}
                    </Text>
                  </View>
                );
              })
            ) : (
              <Text style={styles.noDataText}>No cached entries</Text>
            )}

            <TouchableOpacity
              style={styles.primaryButton}
              onPress={handleSyncNutrition}
            >
              <Text style={styles.buttonText}>Sync Today's Data</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.dangerButton}
              onPress={handleClearNutritionCache}
            >
              <Text style={styles.buttonText}>Clear Nutrition Cache</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Profile Cache Section */}
      <View style={styles.section}>
        <TouchableOpacity
          style={styles.sectionHeader}
          onPress={() => toggleSection('profile')}
        >
          <Text style={styles.sectionTitle}>
            👤 Profile Cache ({stats?.profile.isCached ? 'Cached' : 'Not Cached'})
          </Text>
          <Text style={styles.expandIcon}>
            {expandedSection === 'profile' ? '▼' : '▶'}
          </Text>
        </TouchableOpacity>

        {expandedSection === 'profile' && (
          <View style={styles.sectionContent}>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Status:</Text>
              <Text
                style={[
                  styles.statValue,
                  { color: stats?.profile.isCached ? '#4CAF50' : '#F44336' },
                ]}
              >
                {stats?.profile.isCached ? '✓ Cached' : '✗ Not Cached'}
              </Text>
            </View>

            {stats?.profile.isCached && (
              <>
                <View style={styles.statRow}>
                  <Text style={styles.statLabel}>Cached At:</Text>
                  <Text style={styles.statValue}>
                    {stats.profile.cached_at
                      ? new Date(stats.profile.cached_at).toLocaleString()
                      : 'N/A'}
                  </Text>
                </View>

                <View style={styles.statRow}>
                  <Text style={styles.statLabel}>Updated At:</Text>
                  <Text style={styles.statValue}>
                    {stats.profile.updated_at
                      ? new Date(stats.profile.updated_at).toLocaleString()
                      : 'N/A'}
                  </Text>
                </View>
              </>
            )}

            <TouchableOpacity
              style={styles.primaryButton}
              onPress={handleSyncProfile}
            >
              <Text style={styles.buttonText}>
                {stats?.profile.isCached ? 'Refresh Profile' : 'Sync Profile'}
              </Text>
            </TouchableOpacity>

            {stats?.profile.isCached && (
              <TouchableOpacity
                style={styles.dangerButton}
                onPress={handleClearProfileCache}
              >
                <Text style={styles.buttonText}>Clear Profile Cache</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>

      {/* Workout History Cache Section */}
      <View style={styles.section}>
        <TouchableOpacity
          style={styles.sectionHeader}
          onPress={() => toggleSection('workoutHistory')}
        >
          <Text style={styles.sectionTitle}>
            💪 Workout History ({stats?.workoutHistory.sessionCount || 0} sessions)
          </Text>
          <Text style={styles.expandIcon}>
            {expandedSection === 'workoutHistory' ? '▼' : '▶'}
          </Text>
        </TouchableOpacity>

        {expandedSection === 'workoutHistory' && (
          <View style={styles.sectionContent}>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Total Sessions:</Text>
              <Text style={styles.statValue}>
                {stats?.workoutHistory.sessionCount || 0}
              </Text>
            </View>

            <View style={styles.statRow}>
              <Text style={styles.statLabel}>Tracked Exercises:</Text>
              <Text style={styles.statValue}>
                {stats?.workoutHistory.exerciseCount || 0}
              </Text>
            </View>

            {(stats?.workoutHistory.exerciseCount || 0) > 0 && (
              <>
                <Text style={styles.subheading}>Top 10 Exercises:</Text>
                {stats?.workoutHistory.exercises.map((exercise, index) => (
                  <View key={exercise.exercise_id} style={styles.foodItem}>
                    <Text style={styles.foodRank}>#{index + 1}</Text>
                    <View style={styles.foodInfo}>
                      <Text style={styles.foodName}>{exercise.exercise_name}</Text>
                      <Text style={styles.foodMeta}>
                        {exercise.session_count} sessions • Last: {exercise.last_performed}
                      </Text>
                    </View>
                  </View>
                ))}
              </>
            )}

            <TouchableOpacity
              style={styles.primaryButton}
              onPress={handleLoadHistoricalWorkouts}
            >
              <Text style={styles.buttonText}>Load Historical Data (12 months)</Text>
            </TouchableOpacity>

            {(stats?.workoutHistory.sessionCount || 0) > 0 && (
              <TouchableOpacity
                style={styles.dangerButton}
                onPress={handleClearWorkoutHistoryCache}
              >
                <Text style={styles.buttonText}>Clear Workout History Cache</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>

      {/* Clear All Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>⚠️ Danger Zone</Text>
        </View>
        <View style={styles.sectionContent}>
          <Text style={styles.warningText}>
            This will delete ALL cached data from your device.
          </Text>
          <TouchableOpacity
            style={styles.clearAllButton}
            onPress={handleClearAllCaches}
          >
            <Text style={styles.buttonText}>Clear ALL Caches</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Footer Info */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          💾 All data is stored in SQLite database: food_cache.db
        </Text>
        <Text style={styles.footerText}>
          🔄 Pull to refresh • Tap sections to expand
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    backgroundColor: '#2196F3',
    padding: 20,
    paddingTop: 60,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#fff',
  },
  subtitle: {
    fontSize: 14,
    color: '#fff',
    opacity: 0.9,
    marginTop: 4,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  section: {
    backgroundColor: '#fff',
    marginTop: 12,
    marginHorizontal: 12,
    borderRadius: 8,
    overflow: 'hidden',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#f9f9f9',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
  },
  expandIcon: {
    fontSize: 16,
    color: '#666',
  },
  sectionContent: {
    padding: 16,
  },
  statRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  statLabel: {
    fontSize: 14,
    color: '#666',
  },
  statValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  subheading: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginTop: 16,
    marginBottom: 8,
  },
  foodItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  foodRank: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#2196F3',
    width: 40,
  },
  foodInfo: {
    flex: 1,
  },
  foodName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  foodMeta: {
    fontSize: 12,
    color: '#999',
    marginTop: 2,
  },
  primaryButton: {
    backgroundColor: '#2196F3',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  dangerButton: {
    backgroundColor: '#F44336',
    padding: 14,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 8,
  },
  clearAllButton: {
    backgroundColor: '#D32F2F',
    padding: 16,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 12,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  warningText: {
    fontSize: 14,
    color: '#F44336',
    textAlign: 'center',
    marginBottom: 8,
  },
  footer: {
    padding: 20,
    alignItems: 'center',
  },
  footerText: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    marginTop: 4,
  },
  nutritionEntry: {
    backgroundColor: '#f9f9f9',
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#2196F3',
  },
  nutritionEntryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  nutritionDate: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  todayDate: {
    color: '#2196F3',
    fontWeight: 'bold',
  },
  daysAgo: {
    fontSize: 12,
    color: '#999',
  },
  nutritionEntryContent: {
    gap: 4,
  },
  nutritionStat: {
    fontSize: 13,
    color: '#666',
    marginBottom: 2,
  },
  lastSyncText: {
    fontSize: 11,
    color: '#999',
    marginTop: 6,
    fontStyle: 'italic',
  },
  noDataText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    padding: 16,
    fontStyle: 'italic',
  },
});
