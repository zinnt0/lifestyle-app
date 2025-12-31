/**
 * Fitness Stats Component
 *
 * Displays key fitness statistics on the Home Dashboard.
 * Shows workout completion stats and current streak.
 */

import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet } from "react-native";
import { Card } from "../ui/Card";
import { supabase } from "@/lib/supabase";

interface FitnessStatsProps {
  /** User ID to fetch stats for */
  userId?: string;
}

interface Stats {
  workoutsThisWeek: number;
  workoutsThisMonth: number;
  currentStreak: number;
}

/**
 * FitnessStats Component
 *
 * Displays fitness statistics including:
 * - Workouts this week
 * - Workouts this month
 * - Current workout streak (days)
 */
export const FitnessStats: React.FC<FitnessStatsProps> = ({ userId }) => {
  const [stats, setStats] = useState<Stats>({
    workoutsThisWeek: 0,
    workoutsThisMonth: 0,
    currentStreak: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (userId) {
      loadStats();
    }
  }, [userId]);

  const loadStats = async () => {
    if (!userId) return;

    try {
      // Get current date boundaries
      const now = new Date();
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - now.getDay()); // Start of week (Sunday)
      startOfWeek.setHours(0, 0, 0, 0);

      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      // Fetch completed sessions this week
      const { data: weekSessions, error: weekError } = await supabase
        .from("workout_sessions")
        .select("id")
        .eq("user_id", userId)
        .eq("status", "completed")
        .gte("end_time", startOfWeek.toISOString());

      if (weekError) {
        console.error("Error loading week stats:", weekError);
      }

      // Fetch completed sessions this month
      const { data: monthSessions, error: monthError } = await supabase
        .from("workout_sessions")
        .select("id")
        .eq("user_id", userId)
        .eq("status", "completed")
        .gte("end_time", startOfMonth.toISOString());

      if (monthError) {
        console.error("Error loading month stats:", monthError);
      }

      // Calculate streak (simplified - counts consecutive days with workouts)
      const { data: recentSessions, error: streakError } = await supabase
        .from("workout_sessions")
        .select("date")
        .eq("user_id", userId)
        .eq("status", "completed")
        .order("date", { ascending: false })
        .limit(30);

      let streak = 0;
      if (!streakError && recentSessions && recentSessions.length > 0) {
        const uniqueDates = Array.from(
          new Set(recentSessions.map((s: any) => s.date))
        ).sort((a, b) => new Date(b).getTime() - new Date(a).getTime());

        // Calculate consecutive days
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        let checkDate = new Date(today);

        // Check if there's a workout today or yesterday (grace period)
        const latestWorkoutDate = new Date(uniqueDates[0]);
        latestWorkoutDate.setHours(0, 0, 0, 0);
        const daysDiff = Math.floor(
          (today.getTime() - latestWorkoutDate.getTime()) / (1000 * 60 * 60 * 24)
        );

        if (daysDiff <= 1) {
          // Start counting from latest workout
          for (const dateStr of uniqueDates) {
            const workoutDate = new Date(dateStr);
            workoutDate.setHours(0, 0, 0, 0);

            if (workoutDate.getTime() === checkDate.getTime() ||
                workoutDate.getTime() === checkDate.getTime() - (1000 * 60 * 60 * 24)) {
              streak++;
              checkDate = new Date(workoutDate);
              checkDate.setDate(checkDate.getDate() - 1);
            } else {
              break;
            }
          }
        }
      }

      setStats({
        workoutsThisWeek: weekSessions?.length || 0,
        workoutsThisMonth: monthSessions?.length || 0,
        currentStreak: streak,
      });
    } catch (error) {
      console.error("Error loading fitness stats:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card padding="medium" elevation="small" style={styles.card}>
      <Text style={styles.title}>Fitness Stats</Text>

      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{stats.workoutsThisWeek}</Text>
          <Text style={styles.statLabel}>Diese Woche</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.statItem}>
          <Text style={styles.statValue}>{stats.workoutsThisMonth}</Text>
          <Text style={styles.statLabel}>Diesen Monat</Text>
        </View>

        <View style={styles.divider} />

        <View style={styles.statItem}>
          <Text style={styles.statValue}>
            {stats.currentStreak}
            <Text style={styles.streakEmoji}> 🔥</Text>
          </Text>
          <Text style={styles.statLabel}>Streak (Tage)</Text>
        </View>
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  card: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
    marginBottom: 16,
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  statItem: {
    flex: 1,
    alignItems: "center",
  },
  statValue: {
    fontSize: 24,
    fontWeight: "700",
    color: "#4A90E2",
    marginBottom: 4,
  },
  streakEmoji: {
    fontSize: 20,
  },
  statLabel: {
    fontSize: 11,
    color: "#666",
    textAlign: "center",
    fontWeight: "500",
  },
  divider: {
    width: 1,
    height: 40,
    backgroundColor: "#E5E5EA",
    marginHorizontal: 8,
  },
});
