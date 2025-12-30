/**
 * Home Screen
 *
 * Main landing screen after onboarding completion.
 * Displays daily check-in status and recovery score.
 */

import React, { useState, useCallback } from "react";
import { View, Text, StyleSheet, Button, TouchableOpacity } from "react-native";
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
import { FitnessStats } from "../../components/training/FitnessStats";
import { PausedSessionCard } from "../../components/training/PausedSessionCard";
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
  const [pausedSession, setPausedSession] = useState<WorkoutSession | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  /**
   * Check if user has logged today and fetch recovery score
   */
  const checkTodayLog = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    // Set user ID for stats component
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
   * Handle user logout
   * Signs out user and AppNavigator will automatically redirect to Login
   */
  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      // AppNavigator's auth state listener will handle redirect
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

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
    <View style={styles.container}>
      <Text style={styles.title}>Willkommen! 🎉</Text>

      {/* Fitness Section - Shows paused workout or next workout + stats */}
      <View style={styles.fitnessSection}>
        <Text style={styles.sectionTitle}>FITNESS</Text>

        <View style={styles.fitnessContent}>
          {/* Left: Paused Session or Next Workout */}
          <View style={styles.workoutColumn}>
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

          {/* Right: Fitness Stats */}
          <View style={styles.statsColumn}>
            <FitnessStats userId={userId || undefined} />
          </View>
        </View>
      </View>

      {/* Recovery Section */}
      {hasLogged ? (
        <View style={styles.recoveryCard}>
          <Text style={styles.recoveryLabel}>Heutiger Recovery Score</Text>
          <Text style={styles.recoveryScore}>{recoveryScore}/100</Text>
          <Text style={styles.recoveryEmoji}>
            {getRecoveryScoreInterpretation(recoveryScore || 0).emoji}
          </Text>
        </View>
      ) : (
        <TouchableOpacity
          style={styles.checkinButton}
          onPress={() => navigation.navigate("DailyCheckin")}
        >
          <Text style={styles.checkinText}>📋 Tägliches Check-in</Text>
        </TouchableOpacity>
      )}

      <View style={styles.buttonContainer}>
        <Button
          title="Profil anzeigen"
          onPress={() => navigation.navigate("Profile")}
        />
      </View>

      <View style={styles.buttonContainer}>
        <Button title="Ausloggen" onPress={handleLogout} color="#FF3B30" />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    backgroundColor: "#FFFFFF",
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    marginBottom: 24,
    textAlign: "center",
  },
  // Fitness Section Styles
  fitnessSection: {
    width: "100%",
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: "700",
    letterSpacing: 1,
    color: "#8E8E93",
    marginBottom: 12,
  },
  fitnessContent: {
    flexDirection: "row",
    gap: 12,
  },
  workoutColumn: {
    flex: 2,
  },
  statsColumn: {
    flex: 1,
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
  buttonContainer: {
    marginTop: 16,
    width: "100%",
    maxWidth: 300,
  },
});
