/**
 * Home Screen
 *
 * Main landing screen after onboarding completion.
 * Displays daily check-in status and recovery score.
 */

import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
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
import { QuickWorkoutAction } from "../../components/training/QuickWorkoutAction";
import { PausedSessionCard } from "../../components/training/PausedSessionCard";
import { RecoveryCard } from "../../components/app/RecoveryCard";
import { AppHeader } from "../../components/ui/AppHeader";
import type { NextWorkout, WorkoutSession } from "../../types/training.types";
import { getDailySummary } from "../../services/nutritionApi";
import Svg, { Circle } from "react-native-svg";
import { Ionicons } from "@expo/vector-icons";

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

/**
 * HomeScreen Component
 *
 * Displays daily check-in status and recovery score.
 * Prompts user to complete check-in if not done today.
 */
export const HomeScreen: React.FC = () => {
  const navigation = useNavigation<HomeScreenNavigationProp>();
  const [hasLogged, setHasLogged] = useState(false);
  const [recoveryScore, setRecoveryScore] = useState<number | null>(null);
  const [nextWorkout, setNextWorkout] = useState<NextWorkout | null>(null);
  const [pausedSession, setPausedSession] = useState<WorkoutSession | null>(
    null
  );
  const [calorieData, setCalorieData] = useState({
    consumed: 0,
    burned: 0,
    goal: 2500,
    remaining: 2500,
  });

  /**
   * Check if user has logged today and fetch recovery score
   */
  const checkTodayLog = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

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

      // Check for paused session first
      const paused = await trainingService.getPausedSession(user.id);
      setPausedSession(paused);

      // Load next workout
      const workout = await trainingService.getNextWorkout(user.id);
      setNextWorkout(workout);
    } catch (error) {
      console.error("Error loading next workout:", error);
      // Fail silently - user can still access training via tab
    }
  }, []);

  /**
   * Load nutrition data (calories)
   */
  const loadNutritionData = useCallback(async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const today = new Date();
      const dateStr = today.toISOString().split("T")[0];

      const summary = await getDailySummary(user.id, dateStr);

      if (summary && summary.summary) {
        const { calories } = summary.summary;

        setCalorieData({
          consumed: calories.consumed || 0,
          burned: calories.burned || 0,
          goal: calories.goal || 2500,
          remaining:
            (calories.goal || 2500) -
            (calories.consumed || 0) +
            (calories.burned || 0),
        });
      }
    } catch (error) {
      console.error("Error loading nutrition data:", error);
      // Fail silently
    }
  }, []);

  /**
   * Refresh data when screen comes into focus
   * This ensures the home screen updates after completing daily check-in
   * or starting a workout
   */
  useFocusEffect(
    useCallback(() => {
      checkTodayLog();
      loadNextWorkout();
      loadNutritionData();
    }, [checkTodayLog, loadNextWorkout, loadNutritionData])
  );

  /**
   * Handle resuming a paused workout session
   */
  const handleResumeSession = useCallback(async () => {
    if (!pausedSession) return;

    try {
      await trainingService.resumeWorkoutSession(pausedSession.id);
      // @ts-ignore - Navigation to nested navigator
      navigation.navigate("TrainingTab", {
        screen: "WorkoutSession",
        params: { sessionId: pausedSession.id },
      });
    } catch (error) {
      console.error("Error resuming session:", error);
    }
  }, [pausedSession, navigation]);

  /**
   * Handle canceling a paused workout session
   */
  const handleCancelSession = useCallback(async () => {
    if (!pausedSession) return;

    try {
      await trainingService.cancelWorkoutSession(pausedSession.id);
      await loadNextWorkout();
    } catch (error) {
      console.error("Error canceling session:", error);
    }
  }, [pausedSession, loadNextWorkout]);

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header - Logo left, Profile right */}
      <AppHeader />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Fitness Section - Shows paused workout or next workout */}
        <View style={styles.fitnessSection}>
          <Text style={styles.sectionHeader}>Fitness</Text>

          {pausedSession ? (
            <PausedSessionCard
              session={pausedSession}
              onResume={handleResumeSession}
              onCancel={handleCancelSession}
            />
          ) : (
            <QuickWorkoutAction workout={nextWorkout || undefined} />
          )}
        </View>

        {/* Calorie Overview Card */}
        <TouchableOpacity
          style={styles.calorieCard}
          onPress={() => navigation.navigate("NutritionTab" as any)}
          activeOpacity={0.7}
        >
          <Text style={styles.sectionHeader}>Kalorien</Text>

          <View style={styles.calorieContent}>
            {/* Ring on the left */}
            <View style={styles.calorieRingContainer}>
              <CalorieRing
                consumed={calorieData.consumed}
                goal={calorieData.goal}
                size={100}
                strokeWidth={8}
              />
              <View style={styles.calorieRingInner}>
                <Text style={styles.calorieRingNumber}>
                  {calorieData.remaining.toLocaleString()}
                </Text>
                <Text style={styles.calorieRingLabel}>Übrig</Text>
              </View>
            </View>

            {/* Values on the right */}
            <View style={styles.calorieStats}>
              <View style={styles.calorieStatRow}>
                <Ionicons name="restaurant" size={18} color="#6FD89E" />
                <Text style={styles.calorieStatLabel}>Gegessen</Text>
                <Text style={styles.calorieStatValue}>
                  {calorieData.consumed}
                </Text>
              </View>

              <View style={styles.calorieStatRow}>
                <Ionicons name="flame" size={18} color="#FF9500" />
                <Text style={styles.calorieStatLabel}>Verbrannt</Text>
                <Text style={styles.calorieStatValue}>
                  {calorieData.burned}
                </Text>
              </View>

              <View style={styles.calorieStatRow}>
                <Ionicons name="trophy" size={18} color="#007AFF" />
                <Text style={styles.calorieStatLabel}>Ziel</Text>
                <Text style={styles.calorieStatValue}>{calorieData.goal}</Text>
              </View>
            </View>
          </View>
        </TouchableOpacity>

        {/* Recovery Section */}
        {hasLogged ? (
          <RecoveryCard
            score={recoveryScore || 0}
            interpretation={
              getRecoveryScoreInterpretation(recoveryScore || 0).label
            }
            emoji={getRecoveryScoreInterpretation(recoveryScore || 0).emoji}
          />
        ) : (
          <TouchableOpacity
            style={styles.checkinButton}
            onPress={() => navigation.navigate("DailyCheckin")}
          >
            <Text style={styles.checkinText}>📋 Tägliches Check-in</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
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
    backgroundColor: "#F8F9FA",
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 32,
  },
  // Fitness Section Styles
  fitnessSection: {
    width: "100%",
    marginBottom: 24,
    marginTop: 16,
  },
  sectionHeader: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
    marginBottom: 12,
    marginLeft: 4,
  },
  // Recovery Section Styles
  recoveryCard: {
    backgroundColor: "#F2F2F7",
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    marginBottom: 24,
    width: "100%",
    maxWidth: 300,
  },
  recoveryLabel: {
    fontSize: 16,
    color: "#8E8E93",
    marginBottom: 12,
    textAlign: "center",
  },
  recoveryScore: {
    fontSize: 48,
    fontWeight: "bold",
    color: "#007AFF",
    marginBottom: 8,
  },
  recoveryEmoji: {
    fontSize: 32,
    textAlign: "center",
  },
  checkinButton: {
    backgroundColor: "#007AFF",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    marginBottom: 24,
    width: "100%",
    maxWidth: 300,
  },
  checkinText: {
    color: "#FFFFFF",
    fontSize: 18,
    fontWeight: "600",
  },
  // Calorie Card Styles
  calorieCard: {
    backgroundColor: "#FFFFFF",
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    width: "100%",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  calorieContent: {
    flexDirection: "row",
    alignItems: "center",
    gap: 20,
    marginTop: 8,
  },
  calorieRingContainer: {
    position: "relative",
    width: 100,
    height: 100,
    alignItems: "center",
    justifyContent: "center",
  },
  calorieRingInner: {
    position: "absolute",
    width: 84,
    height: 84,
    alignItems: "center",
    justifyContent: "center",
  },
  calorieRingNumber: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#333",
  },
  calorieRingLabel: {
    fontSize: 11,
    color: "#8E8E93",
    marginTop: 2,
  },
  calorieStats: {
    flex: 1,
    gap: 12,
  },
  calorieStatRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  calorieStatLabel: {
    fontSize: 14,
    color: "#8E8E93",
    minWidth: 80,
  },
  calorieStatValue: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
});
