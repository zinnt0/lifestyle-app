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

type HomeScreenNavigationProp = NativeStackNavigationProp<
  MainStackParamList,
  "Home"
>;

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
   * Refresh data when screen comes into focus
   * This ensures the home screen updates after completing daily check-in
   * or starting a workout
   */
  useFocusEffect(
    useCallback(() => {
      checkTodayLog();
      loadNextWorkout();
    }, [checkTodayLog, loadNextWorkout])
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

        {/* Nutrition API Test Button - Development Only */}
        <TouchableOpacity
          style={styles.testButton}
          onPress={() => navigation.navigate("NutritionTest")}
        >
          <Text style={styles.testButtonText}>🧪 Nutrition API Test</Text>
        </TouchableOpacity>
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
  testButton: {
    backgroundColor: "#FF6B6B",
    borderRadius: 12,
    padding: 16,
    alignItems: "center",
    marginTop: 16,
    width: "100%",
    maxWidth: 300,
  },
  testButtonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
});
