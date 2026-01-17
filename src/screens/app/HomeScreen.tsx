/**
 * Home Screen - Redesigned Dashboard
 *
 * Main landing screen with modern layout:
 * - Workout & Recovery section (70/30 split)
 * - Nutrition overview with quick add
 * - Daily supplement tracker
 */

import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { MainStackParamList } from "../../navigation/types";
import { supabase } from "../../lib/supabase";
import {
  getTodayRecoveryWithScore,
  hasLoggedToday,
  getRecoveryScoreInterpretation,
} from "../../services/recovery.service";
import { trainingService } from "../../services/trainingService";
import { AppHeader } from "../../components/ui/AppHeader";
import type { NextWorkout, WorkoutSession } from "../../types/training.types";
import { useLocalNutrition } from "../../hooks/useLocalNutrition";
import { theme } from "../../components/ui/theme";
import Svg, { Circle, Path, G } from "react-native-svg";
import { Ionicons } from "@expo/vector-icons";
import {
  getUserStack,
  toggleSupplementIntake,
  wasSupplementTaken,
  getTodayDateString,
  initializeDailyTracking,
} from "../../services/supplements/stackStorage";
import type { UserStackSupplement } from "../../services/supplements/types";

type HomeScreenNavigationProp = NativeStackNavigationProp<
  MainStackParamList,
  "Home"
>;

// Calorie Ring Component
const CalorieRing = ({
  consumed,
  goal,
  size = 180,
  strokeWidth = 12,
}: {
  consumed: number;
  goal: number;
  size?: number;
  strokeWidth?: number;
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const percentage = Math.min((consumed / goal) * 100, 100);
  const strokeDashoffset = circumference - (circumference * percentage) / 100;

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size}>
        {/* Background ring (green) */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#6FD89E"
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Progress ring (blue) */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#007AFF"
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          rotation="-90"
          origin={`${size / 2}, ${size / 2}`}
        />
      </Svg>
    </View>
  );
};

// Recovery Gauge Component (Tacho-Style - Semicircle, opening at top)
const RecoveryGauge = ({
  score,
  size = 70,
}: {
  score: number;
  size?: number;
}) => {
  // Clamp score between 0-100
  const clampedScore = Math.max(0, Math.min(100, score));

  // Calculate angle for needle (0° to 180° = 180° semicircle arc, opening at top)
  // Score 0 = 180° (left), Score 100 = 0° (right)
  // But arc opens upward, so we map: Score 0 = -180° (left), Score 100 = 0° (right)
  const needleAngle = -180 + (clampedScore / 100) * 180;

  // Get color based on score - matching app color scheme
  const getScoreColor = (s: number): string => {
    if (s >= 66) return "#4ECDC4"; // Teal/green - Good to Excellent (from Carbs macro)
    if (s >= 33) return "#FFE66D"; // Yellow - Moderate (from Fats macro)
    return "#FF6B6B"; // Red - Low (from Protein macro)
  };

  const scoreColor = getScoreColor(clampedScore);
  const centerX = size / 2;
  const centerY = size * 0.52;
  const radius = size * 0.4;
  const strokeWidth = size * 0.11;

  // Arc path for semicircle opening upward (-180° to 0°)
  const createArc = (startAngle: number, endAngle: number): string => {
    const startRad = (startAngle * Math.PI) / 180;
    const endRad = (endAngle * Math.PI) / 180;
    const x1 = centerX + radius * Math.cos(startRad);
    const y1 = centerY + radius * Math.sin(startRad);
    const x2 = centerX + radius * Math.cos(endRad);
    const y2 = centerY + radius * Math.sin(endRad);
    const largeArc = Math.abs(endAngle - startAngle) > 180 ? 1 : 0;
    return `M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2}`;
  };

  // Needle calculations
  const needleLength = radius * 0.85;
  const needleRad = (needleAngle * Math.PI) / 180;
  const needleX = centerX + needleLength * Math.cos(needleRad);
  const needleY = centerY + needleLength * Math.sin(needleRad);

  return (
    <View style={{ width: size, height: size * 0.55, alignItems: "center" }}>
      <Svg width={size} height={size * 0.55} viewBox={`0 0 ${size} ${size * 0.55}`}>
        {/* Background arc (subtle) */}
        <Path
          d={createArc(-180, 0)}
          stroke="rgba(0, 0, 0, 0.15)"
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
        />

        {/* Colored progress arc */}
        {clampedScore > 0 && (
          <Path
            d={createArc(-180, -180 + (clampedScore / 100) * 180)}
            stroke={scoreColor}
            strokeWidth={strokeWidth}
            fill="none"
            strokeLinecap="round"
          />
        )}

        {/* Needle */}
        <Path
          d={`M ${centerX} ${centerY} L ${needleX} ${needleY}`}
          stroke="#0E7490"
          strokeWidth={2}
          strokeLinecap="round"
        />

        {/* Center dot */}
        <Circle cx={centerX} cy={centerY} r={3} fill="#0E7490" />
      </Svg>
    </View>
  );
};

// Macro Row Component
const MacroRow = ({
  label,
  consumed,
  goal,
  color,
}: {
  label: string;
  consumed: number;
  goal: number;
  color: string;
}) => {
  const percentage = Math.min((consumed / goal) * 100, 100);

  return (
    <View style={styles.macroRow}>
      <Text style={styles.macroLabel}>{label}</Text>
      <View style={styles.macroBar}>
        <View
          style={[
            styles.macroBarFill,
            { width: `${percentage}%`, backgroundColor: color },
          ]}
        />
        <Text style={styles.macroValueInBar}>
          {Math.round(consumed)}g / {goal}g
        </Text>
      </View>
    </View>
  );
};

/**
 * HomeScreen Component
 *
 * Displays daily check-in status and recovery score.
 * Prompts user to complete check-in if not done today.
 */
export const HomeScreen: React.FC = () => {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const [userId, setUserId] = useState<string | null>(null);
  const [hasLogged, setHasLogged] = useState(false);
  const [recoveryScore, setRecoveryScore] = useState<number | null>(null);
  const [nextWorkout, setNextWorkout] = useState<NextWorkout | null>(null);
  const [pausedSession, setPausedSession] = useState<WorkoutSession | null>(
    null
  );
  const [supplements, setSupplements] = useState<UserStackSupplement[]>([]);
  const [supplementsTaken, setSupplementsTaken] = useState<
    Record<string, boolean>
  >({});
  const [showMealSelectModal, setShowMealSelectModal] = useState(false);

  const today = new Date().toISOString().split("T")[0];
  const todayDate = getTodayDateString();

  // Use cache-first nutrition hook for instant calorie display
  const { data: nutritionData } = useLocalNutrition(today, {
    autoSync: true,
    syncInterval: 5,
  });

  // Derive calorie data
  const calorieData = {
    consumed: nutritionData?.calories_consumed || 0,
    burned: nutritionData?.calories_burned || 0,
    goal: nutritionData?.calorie_goal || 2500,
    protein: {
      consumed: nutritionData?.protein_consumed || 0,
      goal: nutritionData?.protein_goal || 150,
    },
    carbs: {
      consumed: nutritionData?.carbs_consumed || 0,
      goal: nutritionData?.carbs_goal || 200,
    },
    fat: {
      consumed: nutritionData?.fat_consumed || 0,
      goal: nutritionData?.fat_goal || 70,
    },
  };

  /**
   * Check if user has logged today and fetch recovery score
   */
  const checkTodayLog = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    setUserId(user.id);

    const logged = await hasLoggedToday(user.id);
    setHasLogged(logged);

    if (logged) {
      const { recoveryLog } = await getTodayRecoveryWithScore(user.id);
      if (recoveryLog) {
        setRecoveryScore(recoveryLog.recovery_score);
      }
    }
  }, []);

  /**
   * Load next scheduled workout and paused session
   */
  const loadNextWorkout = useCallback(async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      // Load both in parallel for better performance
      const [paused, workout] = await Promise.all([
        trainingService.getPausedSession(user.id),
        trainingService.getNextWorkout(user.id),
      ]);

      // Only show paused session if it belongs to the active plan
      // This ensures consistency with TrainingPlanDetailScreen behavior
      if (paused && workout && paused.plan_id === workout.plan.id) {
        setPausedSession(paused);
      } else {
        setPausedSession(null);
      }

      // Set next workout (can be null)
      setNextWorkout(workout);
    } catch (error) {
      console.error("Error loading next workout:", error);
      // Reset states on error to avoid showing stale data
      setPausedSession(null);
      setNextWorkout(null);
    }
  }, []);

  /**
   * Load supplements for today
   */
  const loadSupplements = useCallback(async () => {
    if (!userId) return;

    const stackSupplements = await getUserStack(userId);
    setSupplements(stackSupplements);

    await initializeDailyTracking(userId, todayDate);

    const statusMap: Record<string, boolean> = {};
    for (const supplement of stackSupplements) {
      const taken = await wasSupplementTaken(
        userId,
        todayDate,
        supplement.supplementId
      );
      statusMap[supplement.supplementId] = taken;
    }
    setSupplementsTaken(statusMap);
  }, [userId, todayDate]);

  /**
   * Toggle supplement taken status
   */
  const handleToggleSupplement = async (supplementId: string) => {
    if (!userId) return;

    const currentStatus = supplementsTaken[supplementId] || false;
    const newStatus = !currentStatus;

    setSupplementsTaken((prev) => ({ ...prev, [supplementId]: newStatus }));
    await toggleSupplementIntake(userId, todayDate, supplementId, newStatus);
  };

  /**
   * Refresh data when screen comes into focus
   */
  useFocusEffect(
    useCallback(() => {
      checkTodayLog();
      loadNextWorkout();
      loadSupplements();
    }, [checkTodayLog, loadNextWorkout, loadSupplements])
  );

  /**
   * Handle resuming a paused workout session
   */
  const handleResumeSession = useCallback(async () => {
    if (!pausedSession) return;

    try {
      await trainingService.resumeWorkoutSession(pausedSession.id);
      // @ts-ignore
      navigation.navigate("TrainingTab", {
        screen: "WorkoutSession",
        params: { sessionId: pausedSession.id },
      });
    } catch (error) {
      console.error("Error resuming session:", error);
    }
  }, [pausedSession, navigation]);

  /**
   * Handle starting next workout
   */
  const handleStartWorkout = useCallback(async () => {
    if (!nextWorkout?.workout || !nextWorkout?.plan || !userId) return;

    try {
      const sessionId = await trainingService.startWorkoutSession(
        userId,
        nextWorkout.plan.id,
        nextWorkout.workout.id
      );
      // @ts-ignore
      navigation.navigate("TrainingTab", {
        screen: "WorkoutSession",
        params: { sessionId },
      });
    } catch (error) {
      console.error("Error starting workout:", error);
    }
  }, [nextWorkout, userId, navigation]);

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <AppHeader />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Top Section: Workout (70%) + Recovery/Check-in (30%) */}
        <View style={styles.topSection}>
          {/* Workout Card - 70% */}
          <TouchableOpacity
            style={styles.workoutCard}
            onPress={pausedSession ? handleResumeSession : handleStartWorkout}
            activeOpacity={0.8}
          >
            <View style={styles.workoutCardInner}>
              <View style={styles.workoutMiddle}>
                <Text style={styles.workoutTitle} numberOfLines={2}>
                  {pausedSession
                    ? pausedSession.workout?.name || "Workout"
                    : nextWorkout?.workout?.name || "Kein Workout geplant"}
                </Text>
                <Text style={styles.workoutMeta}>
                  {pausedSession
                    ? nextWorkout?.plan?.name || ""
                    : nextWorkout?.plan?.name || ""}
                </Text>
              </View>

              <TouchableOpacity
                style={[
                  styles.workoutButton,
                  pausedSession && styles.workoutButtonPaused,
                ]}
                onPress={
                  pausedSession ? handleResumeSession : handleStartWorkout
                }
              >
                <Text style={styles.workoutButtonText}>
                  {pausedSession ? "▶ Fortsetzen" : "Workout starten"}
                </Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>

          {/* Recovery/Check-in Card - 30% */}
          <TouchableOpacity
            style={styles.recoveryCard}
            onPress={() => navigation.navigate("DailyCheckin")}
            activeOpacity={0.8}
          >
            {hasLogged ? (
              <View style={styles.recoveryContent}>
                <Text style={styles.recoveryLabel}>Recovery</Text>
                <RecoveryGauge score={recoveryScore || 0} size={75} />
                <Text style={styles.recoveryScore}>{recoveryScore || 0}</Text>
              </View>
            ) : (
              <View style={styles.checkinContent}>
                <View style={styles.checkinIconContainer}>
                  <Ionicons
                    name="clipboard-outline"
                    size={24}
                    color="#FFFFFF"
                  />
                </View>
                <Text style={styles.checkinLabel}>Check-in</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Nutrition Section */}
        <TouchableOpacity
          style={styles.nutritionCard}
          onPress={() => navigation.navigate("NutritionTab" as any)}
          activeOpacity={0.8}
        >
          <View style={styles.nutritionHeader}>
            <Text style={styles.sectionTitle}>Nutrition</Text>
            {/* Quick Add Button */}
            <TouchableOpacity
              style={styles.quickAddButton}
              onPress={(e) => {
                e.stopPropagation();
                setShowMealSelectModal(true);
              }}
            >
              <Ionicons name="add" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          <View style={styles.nutritionContent}>
            {/* Calorie Ring */}
            <View style={styles.calorieRingSection}>
              <CalorieRing
                consumed={calorieData.consumed}
                goal={calorieData.goal}
                size={100}
                strokeWidth={8}
              />
              <View style={styles.calorieRingCenter}>
                <Text style={styles.calorieNumber}>
                  {Math.max(
                    0,
                    calorieData.goal - calorieData.consumed + calorieData.burned
                  )}
                </Text>
                <Text style={styles.calorieLabel}>übrig</Text>
              </View>
            </View>

            {/* Macros */}
            <View style={styles.macrosSection}>
              <MacroRow
                label="Protein"
                consumed={calorieData.protein.consumed}
                goal={calorieData.protein.goal}
                color="#FF6B6B"
              />
              <MacroRow
                label="Carbs"
                consumed={calorieData.carbs.consumed}
                goal={calorieData.carbs.goal}
                color="#4ECDC4"
              />
              <MacroRow
                label="Fats"
                consumed={calorieData.fat.consumed}
                goal={calorieData.fat.goal}
                color="#FFE66D"
              />
            </View>
          </View>
        </TouchableOpacity>

        {/* Supplements Section */}
        <View style={styles.supplementsSection}>
          <View style={styles.supplementsHeader}>
            <Text style={styles.sectionTitle}>Supplement Today</Text>
          </View>

          {supplements.length === 0 ? (
            <View style={styles.emptySupplements}>
              <Text style={styles.emptySupplementsText}>
                Keine Supplements für heute
              </Text>
            </View>
          ) : (
            <ScrollView
              style={styles.supplementsScrollView}
              showsVerticalScrollIndicator={false}
            >
              <View style={styles.supplementsList}>
                {supplements.map((supplement) => (
                  <TouchableOpacity
                    key={supplement.id}
                    style={styles.supplementItem}
                    onPress={() =>
                      handleToggleSupplement(supplement.supplementId)
                    }
                    activeOpacity={0.7}
                  >
                    <View
                      style={[
                        styles.supplementCheckbox,
                        supplementsTaken[supplement.supplementId] &&
                          styles.supplementCheckboxChecked,
                      ]}
                    >
                      {supplementsTaken[supplement.supplementId] && (
                        <Text style={styles.supplementCheckmark}>✓</Text>
                      )}
                    </View>
                    <Text
                      style={[
                        styles.supplementName,
                        supplementsTaken[supplement.supplementId] &&
                          styles.supplementNameTaken,
                      ]}
                    >
                      {supplement.supplementName}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </ScrollView>
          )}
        </View>
      </ScrollView>

      {/* Meal Selection Modal */}
      <Modal
        visible={showMealSelectModal}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowMealSelectModal(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowMealSelectModal(false)}
        >
          <View style={styles.mealModalContent}>
            <Text style={styles.mealModalTitle}>Mahlzeit wählen</Text>

            <TouchableOpacity
              style={styles.mealOption}
              onPress={() => {
                setShowMealSelectModal(false);
                navigation.navigate("NutritionTab" as any, {
                  screen: "FoodSearch",
                  params: { mealType: "breakfast" },
                });
              }}
            >
              <Text style={styles.mealEmoji}>☕</Text>
              <Text style={styles.mealOptionText}>Frühstück</Text>
              <Ionicons name="chevron-forward" size={20} color={theme.colors.textSecondary} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.mealOption}
              onPress={() => {
                setShowMealSelectModal(false);
                navigation.navigate("NutritionTab" as any, {
                  screen: "FoodSearch",
                  params: { mealType: "lunch" },
                });
              }}
            >
              <Text style={styles.mealEmoji}>🍱</Text>
              <Text style={styles.mealOptionText}>Mittagessen</Text>
              <Ionicons name="chevron-forward" size={20} color={theme.colors.textSecondary} />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.mealOption}
              onPress={() => {
                setShowMealSelectModal(false);
                navigation.navigate("NutritionTab" as any, {
                  screen: "FoodSearch",
                  params: { mealType: "dinner" },
                });
              }}
            >
              <Text style={styles.mealEmoji}>🍲</Text>
              <Text style={styles.mealOptionText}>Abendessen</Text>
              <Ionicons name="chevron-forward" size={20} color={theme.colors.textSecondary} />
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.mealOption, styles.mealOptionLast]}
              onPress={() => {
                setShowMealSelectModal(false);
                navigation.navigate("NutritionTab" as any, {
                  screen: "FoodSearch",
                  params: { mealType: "snacks" },
                });
              }}
            >
              <Text style={styles.mealEmoji}>🍎</Text>
              <Text style={styles.mealOptionText}>Snacks</Text>
              <Ionicons name="chevron-forward" size={20} color={theme.colors.textSecondary} />
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "transparent",
  },
  scrollView: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  contentContainer: {
    paddingHorizontal: theme.spacing.lg,
    paddingTop: 0,
    paddingBottom: 120,
  },

  // Top Section - Workout & Recovery (70/30 split)
  topSection: {
    flexDirection: "row",
    gap: theme.spacing.md,
    marginBottom: theme.spacing.lg,
    height: 120,
  },
  workoutCard: {
    flex: 7,
    backgroundColor: "#5B9EFF",
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.md,
    paddingTop: theme.spacing.lg,
    ...theme.shadows.lg,
  },
  workoutCardInner: {
    flex: 1,
    justifyContent: "space-between",
  },
  workoutMiddle: {
    flex: 1,
    justifyContent: "center",
  },
  workoutTitle: {
    fontSize: 18,
    fontWeight: theme.typography.weights.bold,
    color: "#FFFFFF",
  },
  workoutMeta: {
    fontSize: theme.typography.sizes.sm,
    color: "rgba(255, 255, 255, 0.8)",
    marginBottom: 4,
  },
  workoutButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: theme.borderRadius.md,
    alignItems: "center",
  },
  workoutButtonPaused: {
    backgroundColor: "#FF9500",
  },
  workoutButtonText: {
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.semibold,
    color: "#FFFFFF",
  },
  recoveryCard: {
    flex: 3,
    backgroundColor: theme.colors.secondary,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.sm,
    paddingTop: theme.spacing.md,
    justifyContent: "space-between",
    alignItems: "center",
    ...theme.shadows.lg,
  },
  recoveryContent: {
    alignItems: "center",
    justifyContent: "flex-start",
    flex: 1,
    width: "100%",
    paddingTop: 2,
  },
  recoveryLabel: {
    fontSize: 15,
    color: "#FFFFFF",
    fontWeight: theme.typography.weights.bold,
    marginBottom: 6,
  },
  recoveryScore: {
    fontSize: 22,
    fontWeight: theme.typography.weights.bold,
    color: "#FFFFFF",
    marginTop: 4,
    marginBottom: 8,
  },
  checkinContent: {
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
  },
  checkinIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: "rgba(255, 255, 255, 0.25)",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 6,
  },
  checkinLabel: {
    fontSize: theme.typography.sizes.sm,
    color: "#FFFFFF",
    textAlign: "center",
    fontWeight: theme.typography.weights.semibold,
  },

  // Nutrition Section
  nutritionCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
    paddingBottom: theme.spacing.lg,
    marginBottom: theme.spacing.lg,
    ...theme.shadows.md,
    position: "relative",
  },
  nutritionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: theme.spacing.lg,
  },
  sectionTitle: {
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.text,
  },
  nutritionContent: {
    flexDirection: "row",
    gap: theme.spacing.md,
    alignItems: "center",
  },
  calorieRingSection: {
    position: "relative",
    width: 100,
    height: 100,
    justifyContent: "center",
    alignItems: "center",
  },
  calorieRingCenter: {
    position: "absolute",
    alignItems: "center",
  },
  calorieNumber: {
    fontSize: 20,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.text,
  },
  calorieLabel: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.textSecondary,
  },
  macrosSection: {
    flex: 1,
    gap: theme.spacing.xs,
  },
  macroRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
  },
  macroLabel: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.textSecondary,
    fontWeight: theme.typography.weights.medium,
    width: 50,
  },
  macroBar: {
    flex: 1,
    height: 20,
    backgroundColor: theme.colors.surfaceSecondary,
    borderRadius: 10,
    overflow: "hidden",
    position: "relative",
    justifyContent: "center",
  },
  macroBarFill: {
    height: "100%",
    borderRadius: 10,
    justifyContent: "center",
    paddingHorizontal: 8,
  },
  macroValueInBar: {
    position: "absolute",
    right: 8,
    fontSize: 11,
    color: "#666666",
    fontWeight: theme.typography.weights.semibold,
  },
  quickAddButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.secondary,
    justifyContent: "center",
    alignItems: "center",
    ...theme.shadows.md,
  },

  // Supplements Section
  supplementsSection: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
    ...theme.shadows.md,
  },
  supplementsHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
    marginBottom: theme.spacing.md,
  },
  emptySupplements: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptySupplementsText: {
    fontSize: theme.typography.sizes.md,
    color: theme.colors.textSecondary,
  },
  supplementsScrollView: {
    maxHeight: 200,
  },
  supplementsList: {
    gap: theme.spacing.xs,
  },
  supplementItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.md,
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.sm,
    backgroundColor: "#FF9500" + "10",
    borderRadius: theme.borderRadius.md,
    borderLeftWidth: 3,
    borderLeftColor: "#FF9500",
  },
  supplementCheckbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: "#FF9500",
    backgroundColor: theme.colors.surface,
    justifyContent: "center",
    alignItems: "center",
  },
  supplementCheckboxChecked: {
    backgroundColor: "#FF9500",
    borderColor: "#FF9500",
  },
  supplementCheckmark: {
    color: "#FFFFFF",
    fontSize: 14,
    fontWeight: theme.typography.weights.bold,
  },
  supplementName: {
    fontSize: theme.typography.sizes.md,
    color: theme.colors.text,
    fontWeight: theme.typography.weights.medium,
    flex: 1,
  },
  supplementNameTaken: {
    textDecorationLine: "line-through",
    opacity: 0.5,
  },

  // Meal Selection Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: theme.spacing.lg,
  },
  mealModalContent: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.lg,
    width: "100%",
    maxWidth: 320,
    ...theme.shadows.lg,
  },
  mealModalTitle: {
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.text,
    textAlign: "center",
    marginBottom: theme.spacing.lg,
  },
  mealOption: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: theme.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  mealOptionLast: {
    borderBottomWidth: 0,
  },
  mealEmoji: {
    fontSize: 24,
    marginRight: theme.spacing.md,
  },
  mealOptionText: {
    flex: 1,
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.medium,
    color: theme.colors.text,
  },
});
