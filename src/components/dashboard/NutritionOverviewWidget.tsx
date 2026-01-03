/**
 * Nutrition Overview Widget
 *
 * Comprehensive dashboard widget showing:
 * - Daily calorie goals and progress
 * - Macro breakdown (Protein, Carbs, Fat)
 * - Weekly weight progress with trend
 * - Quick action buttons
 * - Smart notifications
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../../lib/supabase';
import { getDailySummary } from '../../services/nutritionApi';
import {
  COLORS,
  SPACING,
  BORDER_RADIUS,
  SHADOWS,
  TYPOGRAPHY,
} from '../ui/theme';
import Svg, { Circle } from 'react-native-svg';

interface NutritionGoal {
  id: string;
  user_id: string;
  goal_type: string;
  target_calories: number;
  target_protein: number;
  target_carbs: number;
  target_fat: number;
  target_weight: number;
  current_weight: number;
  weekly_weight_change_goal: number;
  status: string;
}

interface DailyNutrition {
  calories: { consumed: number; goal: number; remaining: number };
  macros: {
    protein: { consumed: number; goal: number; percentage: number };
    carbs: { consumed: number; goal: number; percentage: number };
    fat: { consumed: number; goal: number; percentage: number };
  };
}

interface WeeklyProgress {
  startWeight: number;
  currentWeight: number;
  change: number;
  weeklyGoal: number;
  status: 'on-track' | 'too-fast' | 'too-slow';
  chartData: Array<{ date: string; weight: number }>;
}

interface NutritionOverviewWidgetProps {
  userId: string;
  onQuickAddMeal?: () => void;
  onTrackWeight?: () => void;
  onAdjustGoals?: () => void;
}

// Mini Progress Circle Component
const MiniProgressCircle = ({
  percentage,
  size = 60,
  strokeWidth = 6,
  color,
}: {
  percentage: number;
  size?: number;
  strokeWidth?: number;
  color: string;
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const cappedPercentage = Math.min(percentage, 100);
  const strokeDashoffset = circumference - (circumference * cappedPercentage) / 100;

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size}>
        {/* Background circle */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={COLORS.surfaceSecondary}
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Progress circle */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={color}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          rotation="-90"
          origin={`${size / 2}, ${size / 2}`}
        />
      </Svg>
      <View style={styles.circleTextContainer}>
        <Text style={styles.circlePercentage}>{Math.round(cappedPercentage)}%</Text>
      </View>
    </View>
  );
};

// Mini Line Chart Component
const MiniLineChart = ({ data }: { data: Array<{ date: string; weight: number }> }) => {
  if (data.length < 2) {
    return (
      <View style={styles.chartPlaceholder}>
        <Text style={styles.chartPlaceholderText}>
          Nicht genügend Daten für Chart
        </Text>
      </View>
    );
  }

  // Simple visualization using bars
  const maxWeight = Math.max(...data.map((d) => d.weight));
  const minWeight = Math.min(...data.map((d) => d.weight));
  const range = maxWeight - minWeight || 1;

  return (
    <View style={styles.chartContainer}>
      {data.map((point, index) => {
        const heightPercentage = ((point.weight - minWeight) / range) * 100;
        return (
          <View key={index} style={styles.chartBar}>
            <View
              style={[
                styles.chartBarFill,
                {
                  height: `${Math.max(heightPercentage, 10)}%`,
                },
              ]}
            />
          </View>
        );
      })}
    </View>
  );
};

export function NutritionOverviewWidget({
  userId,
  onQuickAddMeal,
  onTrackWeight,
  onAdjustGoals,
}: NutritionOverviewWidgetProps) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Data states
  const [nutritionGoal, setNutritionGoal] = useState<NutritionGoal | null>(null);
  const [dailyData, setDailyData] = useState<DailyNutrition | null>(null);
  const [weeklyProgress, setWeeklyProgress] = useState<WeeklyProgress | null>(null);
  const [notification, setNotification] = useState<{
    type: 'success' | 'warning' | 'info';
    message: string;
  } | null>(null);

  // Load all nutrition data
  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Load nutrition goals
      const { data: goals, error: goalsError } = await supabase
        .from('user_nutrition_goals')
        .select('*')
        .eq('user_id', userId)
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (goalsError) throw goalsError;

      if (!goals) {
        setError('no-goals');
        setLoading(false);
        return;
      }

      setNutritionGoal(goals);

      // Load today's nutrition data
      const today = new Date().toISOString().split('T')[0];
      const summary = await getDailySummary(userId, today);

      if (summary && summary.summary) {
        setDailyData({
          calories: {
            consumed: summary.summary.calories.consumed || 0,
            goal: goals.target_calories || 2000,
            remaining:
              (goals.target_calories || 2000) -
              (summary.summary.calories.consumed || 0) +
              (summary.summary.calories.burned || 0),
          },
          macros: {
            protein: {
              consumed: summary.summary.macros.protein.consumed || 0,
              goal: goals.target_protein || 150,
              percentage: Math.round(
                ((summary.summary.macros.protein.consumed || 0) /
                  (goals.target_protein || 150)) *
                  100
              ),
            },
            carbs: {
              consumed: summary.summary.macros.carbs.consumed || 0,
              goal: goals.target_carbs || 200,
              percentage: Math.round(
                ((summary.summary.macros.carbs.consumed || 0) /
                  (goals.target_carbs || 200)) *
                  100
              ),
            },
            fat: {
              consumed: summary.summary.macros.fat.consumed || 0,
              goal: goals.target_fat || 70,
              percentage: Math.round(
                ((summary.summary.macros.fat.consumed || 0) /
                  (goals.target_fat || 70)) *
                  100
              ),
            },
          },
        });
      }

      // Load weekly weight progress
      await loadWeeklyProgress(goals);

      // Check for notifications
      checkNotifications(goals, summary?.summary);

      setLoading(false);
    } catch (err) {
      console.error('Error loading nutrition data:', err);
      setError('load-error');
      setLoading(false);
    }
  }, [userId]);

  // Load weekly weight progress
  const loadWeeklyProgress = async (goal: NutritionGoal) => {
    try {
      // Get weight measurements from the last 7 days
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const dateStr = sevenDaysAgo.toISOString().split('T')[0];

      const { data: measurements, error } = await supabase
        .from('body_measurements')
        .select('measurement_date, weight')
        .eq('user_id', userId)
        .gte('measurement_date', dateStr)
        .order('measurement_date', { ascending: true });

      if (error) throw error;

      if (measurements && measurements.length > 0) {
        const startWeight = measurements[0].weight;
        const currentWeight = measurements[measurements.length - 1].weight;
        const change = currentWeight - startWeight;
        const weeklyGoal = goal.weekly_weight_change_goal || -0.5;

        // Determine status
        let status: 'on-track' | 'too-fast' | 'too-slow';
        const tolerance = 0.2; // kg tolerance

        if (weeklyGoal < 0) {
          // Weight loss goal
          if (change <= weeklyGoal + tolerance && change >= weeklyGoal - tolerance) {
            status = 'on-track';
          } else if (change < weeklyGoal - tolerance) {
            status = 'too-fast';
          } else {
            status = 'too-slow';
          }
        } else {
          // Weight gain goal
          if (change >= weeklyGoal - tolerance && change <= weeklyGoal + tolerance) {
            status = 'on-track';
          } else if (change > weeklyGoal + tolerance) {
            status = 'too-fast';
          } else {
            status = 'too-slow';
          }
        }

        setWeeklyProgress({
          startWeight,
          currentWeight,
          change,
          weeklyGoal,
          status,
          chartData: measurements.map((m) => ({
            date: m.measurement_date,
            weight: m.weight,
          })),
        });
      } else {
        // Use current weight from goal
        setWeeklyProgress({
          startWeight: goal.current_weight,
          currentWeight: goal.current_weight,
          change: 0,
          weeklyGoal: goal.weekly_weight_change_goal || -0.5,
          status: 'on-track',
          chartData: [],
        });
      }
    } catch (err) {
      console.error('Error loading weekly progress:', err);
    }
  };

  // Check for notifications
  const checkNotifications = (goal: NutritionGoal, summary: any) => {
    if (!summary) return;

    const proteinPercentage = (summary.macros.protein.consumed / goal.target_protein) * 100;
    const caloriePercentage = (summary.calories.consumed / goal.target_calories) * 100;

    // Check for low protein
    if (proteinPercentage < 70) {
      setNotification({
        type: 'warning',
        message: `Du hast diese Woche nicht genug Protein! Durchschnitt: ${Math.round(
          summary.macros.protein.consumed
        )}g/Tag (Ziel: ${goal.target_protein}g)`,
      });
    }
    // Check if calories were calibrated (placeholder - would need actual calibration data)
    else if (Math.abs(goal.target_calories - 2056) < 10) {
      setNotification({
        type: 'info',
        message: `Deine Kalorien wurden kalibriert! Neue Empfehlung: ${goal.target_calories} kcal/Tag`,
      });
    }
    // Check for weekly goal achievement
    else if (weeklyProgress?.status === 'on-track') {
      setNotification({
        type: 'success',
        message: 'Glückwunsch! Du hast dein Wochenziel erreicht!',
      });
    }
  };

  // Load data on mount
  useEffect(() => {
    loadData();
  }, [loadData]);

  // Render loading state
  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Lade Ernährungsdaten...</Text>
        </View>
      </View>
    );
  }

  // Render error state
  if (error === 'no-goals') {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="nutrition-outline" size={48} color={COLORS.textTertiary} />
          <Text style={styles.errorTitle}>Noch keine Ernährungsziele gesetzt</Text>
          <Text style={styles.errorText}>
            Richte deine Ernährungsziele ein, um deine Fortschritte zu tracken
          </Text>
          <TouchableOpacity
            style={styles.setupButton}
            onPress={onAdjustGoals}
            activeOpacity={0.7}
          >
            <Text style={styles.setupButtonText}>Jetzt einrichten</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (error === 'load-error') {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={48} color={COLORS.error} />
          <Text style={styles.errorTitle}>Fehler beim Laden</Text>
          <Text style={styles.errorText}>
            Daten konnten nicht geladen werden. Bitte versuche es erneut.
          </Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={loadData}
            activeOpacity={0.7}
          >
            <Text style={styles.retryButtonText}>Erneut versuchen</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  if (!nutritionGoal || !dailyData) {
    return null;
  }

  // Calculate progress percentage
  const calorieProgress = Math.min(
    (dailyData.calories.consumed / dailyData.calories.goal) * 100,
    100
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerIcon}>🎯</Text>
        <Text style={styles.headerTitle}>Deine Ernährungsziele</Text>
      </View>

      {/* Current Stats Card */}
      <LinearGradient
        colors={['#3b82f6', '#2563eb']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.statsCard}
      >
        <Text style={styles.statsTitle}>Ziel-Kalorien</Text>
        <Text style={styles.statsGoal}>{nutritionGoal.target_calories} kcal/Tag</Text>

        {/* Progress Bar */}
        <View style={styles.progressBarContainer}>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressBarFill,
                {
                  width: `${calorieProgress}%`,
                },
              ]}
            />
          </View>
          <Text style={styles.progressText}>
            Heute gegessen: {Math.round(dailyData.calories.consumed)} /{' '}
            {dailyData.calories.goal} kcal
          </Text>
        </View>

        <Text style={styles.remainingText}>
          Noch übrig: {Math.max(Math.round(dailyData.calories.remaining), 0)} kcal
        </Text>
      </LinearGradient>

      {/* Macros Today */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Makros Heute</Text>
        <View style={styles.macrosRow}>
          {/* Protein */}
          <View style={styles.macroItem}>
            <MiniProgressCircle
              percentage={dailyData.macros.protein.percentage}
              color={COLORS.success}
            />
            <Text style={styles.macroLabel}>Protein</Text>
            <Text style={styles.macroValue}>
              {Math.round(dailyData.macros.protein.consumed)}g /{' '}
              {dailyData.macros.protein.goal}g
            </Text>
            <Text style={styles.macroPercentage}>
              ({dailyData.macros.protein.percentage}%)
            </Text>
          </View>

          {/* Carbs */}
          <View style={styles.macroItem}>
            <MiniProgressCircle
              percentage={dailyData.macros.carbs.percentage}
              color="#FFB84D"
            />
            <Text style={styles.macroLabel}>Carbs</Text>
            <Text style={styles.macroValue}>
              {Math.round(dailyData.macros.carbs.consumed)}g /{' '}
              {dailyData.macros.carbs.goal}g
            </Text>
            <Text style={styles.macroPercentage}>
              ({dailyData.macros.carbs.percentage}%)
            </Text>
          </View>

          {/* Fat */}
          <View style={styles.macroItem}>
            <MiniProgressCircle
              percentage={dailyData.macros.fat.percentage}
              color="#FF6B6B"
            />
            <Text style={styles.macroLabel}>Fett</Text>
            <Text style={styles.macroValue}>
              {Math.round(dailyData.macros.fat.consumed)}g / {dailyData.macros.fat.goal}
              g
            </Text>
            <Text style={styles.macroPercentage}>
              ({dailyData.macros.fat.percentage}%)
            </Text>
          </View>
        </View>
      </View>

      {/* Weekly Progress */}
      {weeklyProgress && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📊 Gewichtsentwicklung diese Woche</Text>
          <View style={styles.weightStats}>
            <View style={styles.weightStatRow}>
              <Text style={styles.weightStatLabel}>Start:</Text>
              <Text style={styles.weightStatValue}>
                {weeklyProgress.startWeight.toFixed(1)} kg
              </Text>
            </View>
            <View style={styles.weightStatRow}>
              <Text style={styles.weightStatLabel}>Heute:</Text>
              <Text style={styles.weightStatValue}>
                {weeklyProgress.currentWeight.toFixed(1)} kg
              </Text>
            </View>
            <View style={styles.weightStatRow}>
              <Text style={styles.weightStatLabel}>Änderung:</Text>
              <Text
                style={[
                  styles.weightStatValue,
                  {
                    color:
                      weeklyProgress.change < 0 ? COLORS.success : COLORS.warning,
                  },
                ]}
              >
                {weeklyProgress.change > 0 ? '+' : ''}
                {weeklyProgress.change.toFixed(1)} kg
              </Text>
            </View>
          </View>

          {/* Mini Chart */}
          <MiniLineChart data={weeklyProgress.chartData} />

          {/* Status */}
          <View style={styles.weeklyStatus}>
            <Text style={styles.weeklyGoal}>
              Ziel: {weeklyProgress.weeklyGoal > 0 ? '+' : ''}
              {weeklyProgress.weeklyGoal.toFixed(1)} kg/Woche
            </Text>
            <View
              style={[
                styles.statusBadge,
                {
                  backgroundColor:
                    weeklyProgress.status === 'on-track'
                      ? COLORS.success
                      : weeklyProgress.status === 'too-fast'
                      ? COLORS.warning
                      : COLORS.error,
                },
              ]}
            >
              <Text style={styles.statusIcon}>
                {weeklyProgress.status === 'on-track'
                  ? '✅'
                  : weeklyProgress.status === 'too-fast'
                  ? '⚠️'
                  : '🐌'}
              </Text>
              <Text style={styles.statusText}>
                {weeklyProgress.status === 'on-track'
                  ? 'On Track'
                  : weeklyProgress.status === 'too-fast'
                  ? 'Zu schnell'
                  : 'Zu langsam'}
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* Quick Actions */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Schnellaktionen</Text>
        <View style={styles.quickActions}>
          <TouchableOpacity
            style={styles.actionButton}
            onPress={onQuickAddMeal}
            activeOpacity={0.7}
          >
            <Ionicons name="restaurant" size={20} color={COLORS.white} />
            <Text style={styles.actionButtonText}>Mahlzeit loggen</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.actionButtonSecondary]}
            onPress={onTrackWeight}
            activeOpacity={0.7}
          >
            <Ionicons name="fitness" size={20} color={COLORS.primary} />
            <Text style={styles.actionButtonTextSecondary}>Gewicht tracken</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.actionButtonSecondary]}
            onPress={onAdjustGoals}
            activeOpacity={0.7}
          >
            <Ionicons name="settings" size={20} color={COLORS.primary} />
            <Text style={styles.actionButtonTextSecondary}>Kalorien anpassen</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Notifications */}
      {notification && (
        <View
          style={[
            styles.notification,
            {
              backgroundColor:
                notification.type === 'success'
                  ? '#D4EDDA'
                  : notification.type === 'warning'
                  ? '#FFF3CD'
                  : '#D1ECF1',
              borderColor:
                notification.type === 'success'
                  ? COLORS.success
                  : notification.type === 'warning'
                  ? COLORS.warning
                  : COLORS.info,
            },
          ]}
        >
          <Text style={styles.notificationIcon}>
            {notification.type === 'success'
              ? '🎉'
              : notification.type === 'warning'
              ? '⚠️'
              : '🔄'}
          </Text>
          <Text
            style={[
              styles.notificationText,
              {
                color:
                  notification.type === 'success'
                    ? '#155724'
                    : notification.type === 'warning'
                    ? '#856404'
                    : '#0C5460',
              },
            ]}
          >
            {notification.message}
          </Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.xl,
    ...SHADOWS.sm,
  },
  loadingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.xxxl,
  },
  loadingText: {
    marginTop: SPACING.md,
    fontSize: TYPOGRAPHY.sizes.md,
    color: COLORS.textSecondary,
  },
  errorContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: SPACING.xxxl,
  },
  errorTitle: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.text,
    marginTop: SPACING.md,
    marginBottom: SPACING.xs,
  },
  errorText: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.lg,
    paddingHorizontal: SPACING.lg,
  },
  setupButton: {
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xl,
    borderRadius: BORDER_RADIUS.md,
  },
  setupButtonText: {
    color: COLORS.white,
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: TYPOGRAPHY.weights.semibold,
  },
  retryButton: {
    backgroundColor: COLORS.error,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.xl,
    borderRadius: BORDER_RADIUS.md,
  },
  retryButtonText: {
    color: COLORS.white,
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: TYPOGRAPHY.weights.semibold,
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  headerIcon: {
    fontSize: 24,
    marginRight: SPACING.sm,
  },
  headerTitle: {
    fontSize: TYPOGRAPHY.sizes.xl,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.text,
  },

  // Stats Card
  statsCard: {
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.xl,
    marginBottom: SPACING.lg,
  },
  statsTitle: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.white,
    opacity: 0.9,
    marginBottom: SPACING.xs,
  },
  statsGoal: {
    fontSize: TYPOGRAPHY.sizes.xxl,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.white,
    marginBottom: SPACING.lg,
  },
  progressBarContainer: {
    marginBottom: SPACING.md,
  },
  progressBar: {
    height: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: BORDER_RADIUS.sm,
    overflow: 'hidden',
    marginBottom: SPACING.sm,
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.sm,
  },
  progressText: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.white,
    opacity: 0.9,
  },
  remainingText: {
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.white,
  },

  // Section
  section: {
    marginBottom: SPACING.lg,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.text,
    marginBottom: SPACING.md,
  },

  // Macros
  macrosRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: SPACING.sm,
  },
  macroItem: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: COLORS.surfaceSecondary,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
  },
  circleTextContainer: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  circlePercentage: {
    fontSize: TYPOGRAPHY.sizes.xs,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.text,
  },
  macroLabel: {
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.medium,
    color: COLORS.text,
    marginTop: SPACING.sm,
  },
  macroValue: {
    fontSize: TYPOGRAPHY.sizes.xs,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  macroPercentage: {
    fontSize: TYPOGRAPHY.sizes.xs,
    color: COLORS.textTertiary,
  },

  // Weekly Progress
  weightStats: {
    backgroundColor: COLORS.surfaceSecondary,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.md,
  },
  weightStatRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: SPACING.xs,
  },
  weightStatLabel: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textSecondary,
  },
  weightStatValue: {
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.text,
  },

  // Chart
  chartContainer: {
    flexDirection: 'row',
    height: 60,
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.sm,
    marginBottom: SPACING.md,
    backgroundColor: COLORS.surfaceSecondary,
    borderRadius: BORDER_RADIUS.sm,
    padding: SPACING.sm,
  },
  chartBar: {
    flex: 1,
    height: '100%',
    marginHorizontal: 2,
    justifyContent: 'flex-end',
  },
  chartBarFill: {
    backgroundColor: COLORS.primary,
    borderRadius: 2,
    minHeight: 4,
  },
  chartPlaceholder: {
    height: 60,
    backgroundColor: COLORS.surfaceSecondary,
    borderRadius: BORDER_RADIUS.sm,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: SPACING.md,
  },
  chartPlaceholderText: {
    fontSize: TYPOGRAPHY.sizes.xs,
    color: COLORS.textTertiary,
  },

  // Weekly Status
  weeklyStatus: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  weeklyGoal: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textSecondary,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: SPACING.xs,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.sm,
  },
  statusIcon: {
    fontSize: 14,
    marginRight: SPACING.xs,
  },
  statusText: {
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.medium,
    color: COLORS.white,
  },

  // Quick Actions
  quickActions: {
    gap: SPACING.sm,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.md,
    paddingHorizontal: SPACING.lg,
    borderRadius: BORDER_RADIUS.md,
    gap: SPACING.sm,
  },
  actionButtonSecondary: {
    backgroundColor: COLORS.surfaceSecondary,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  actionButtonText: {
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.white,
  },
  actionButtonTextSecondary: {
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.primary,
  },

  // Notifications
  notification: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    marginTop: SPACING.md,
  },
  notificationIcon: {
    fontSize: 16,
    marginRight: SPACING.sm,
  },
  notificationText: {
    flex: 1,
    fontSize: TYPOGRAPHY.sizes.sm,
    lineHeight: 20,
  },
});
