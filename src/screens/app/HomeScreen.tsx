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
   * Refresh data when screen comes into focus
   * This ensures the home screen updates after completing daily check-in
   */
  useFocusEffect(
    useCallback(() => {
      checkTodayLog();
    }, [checkTodayLog])
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

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Willkommen! 🎉</Text>

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
