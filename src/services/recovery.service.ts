import { supabase } from "../lib/supabase";

// ============================================================================
// TYPES
// ============================================================================

export interface RecoveryLog {
  id: string;
  user_id: string;
  date: string; // 'YYYY-MM-DD'

  // Core metrics (MUST-HAVE)
  sleep_hours: number | null;
  sleep_quality: number | null; // 1-10
  stress_level: number | null; // 1-10
  energy_level: number | null; // 1-10
  muscle_soreness: number | null; // 1-10
  overall_readiness: number | null; // 1-10

  // Optional metrics (NICE-TO-HAVE)
  mood?: number | null; // 1-10
  hydration_liters?: number | null;
  recovery_activities?: string[] | null;
  sleep_notes?: string | null;
  mental_notes?: string | null;
  hrv?: number | null;
  resting_heart_rate?: number | null;

  // Timestamps
  created_at: string;
  updated_at: string;
}

export interface RecoveryLogWithScore extends RecoveryLog {
  recovery_score: number; // 0-100, calculated by DB
}

export interface RecoveryLogInput {
  // Core metrics
  sleep_hours?: number;
  sleep_quality?: number;
  stress_level?: number;
  energy_level?: number;
  muscle_soreness?: number;
  overall_readiness?: number;

  // Optional metrics
  mood?: number;
  hydration_liters?: number;
  recovery_activities?: string[];
  sleep_notes?: string;
  mental_notes?: string;
  hrv?: number;
  resting_heart_rate?: number;
}

export interface RecoveryTrends {
  avg_sleep_hours: number;
  avg_sleep_quality: number;
  avg_stress_level: number;
  avg_energy_level: number;
  avg_muscle_soreness: number;
  avg_overall_readiness: number;
  avg_recovery_score: number;
  total_entries: number;
}

// ============================================================================
// CRUD OPERATIONS
// ============================================================================

/**
 * Get today's recovery log for a user
 */
export const getTodayRecoveryLog = async (userId: string) => {
  try {
    const today = new Date().toISOString().split("T")[0]; // 'YYYY-MM-DD'

    const { data, error } = await supabase
      .from("daily_recovery_log")
      .select("*")
      .eq("user_id", userId)
      .eq("date", today)
      .single();

    if (error && error.code !== "PGRST116") {
      // PGRST116 = no rows
      console.error("Error fetching today recovery log:", error);
      return { recoveryLog: null, error };
    }

    return { recoveryLog: data as RecoveryLog | null, error: null };
  } catch (err) {
    console.error("Unexpected error in getTodayRecoveryLog:", err);
    return { recoveryLog: null, error: err };
  }
};

/**
 * Get today's recovery log WITH calculated recovery score
 */
export const getTodayRecoveryWithScore = async (userId: string) => {
  try {
    const today = new Date().toISOString().split("T")[0];

    const { data, error } = await supabase
      .from("daily_recovery_with_score")
      .select("*")
      .eq("user_id", userId)
      .eq("date", today)
      .single();

    if (error && error.code !== "PGRST116") {
      console.error("Error fetching today recovery with score:", error);
      return { recoveryLog: null, error };
    }

    return { recoveryLog: data as RecoveryLogWithScore | null, error: null };
  } catch (err) {
    console.error("Unexpected error in getTodayRecoveryWithScore:", err);
    return { recoveryLog: null, error: err };
  }
};

/**
 * Get recovery log for a specific date
 */
export const getRecoveryLog = async (userId: string, date: string) => {
  try {
    const { data, error } = await supabase
      .from("daily_recovery_log")
      .select("*")
      .eq("user_id", userId)
      .eq("date", date)
      .single();

    if (error && error.code !== "PGRST116") {
      console.error("Error fetching recovery log:", error);
      return { recoveryLog: null, error };
    }

    return { recoveryLog: data as RecoveryLog | null, error: null };
  } catch (err) {
    console.error("Unexpected error in getRecoveryLog:", err);
    return { recoveryLog: null, error: err };
  }
};

/**
 * Get recovery history for a user (last N days)
 */
export const getRecoveryHistory = async (userId: string, days: number = 30) => {
  try {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    const startDateStr = startDate.toISOString().split("T")[0];

    const { data, error } = await supabase
      .from("daily_recovery_with_score")
      .select("*")
      .eq("user_id", userId)
      .gte("date", startDateStr)
      .order("date", { ascending: false });

    if (error) {
      console.error("Error fetching recovery history:", error);
      return { history: [], error };
    }

    return { history: data as RecoveryLogWithScore[], error: null };
  } catch (err) {
    console.error("Unexpected error in getRecoveryHistory:", err);
    return { history: [], error: err };
  }
};

/**
 * Save or update today's recovery log (UPSERT)
 */
export const saveRecoveryLog = async (
  userId: string,
  recoveryData: RecoveryLogInput,
  date?: string // Optional: defaults to today
) => {
  try {
    const logDate = date || new Date().toISOString().split("T")[0];

    const { data, error } = await supabase
      .from("daily_recovery_log")
      .upsert(
        {
          user_id: userId,
          date: logDate,
          ...recoveryData,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "user_id,date", // Update if exists
        }
      )
      .select()
      .single();

    if (error) {
      console.error("Error saving recovery log:", error);
      return { recoveryLog: null, error };
    }

    return { recoveryLog: data as RecoveryLog, error: null };
  } catch (err) {
    console.error("Unexpected error in saveRecoveryLog:", err);
    return { recoveryLog: null, error: err };
  }
};

/**
 * Delete a recovery log entry
 */
export const deleteRecoveryLog = async (userId: string, date: string) => {
  try {
    const { error } = await supabase
      .from("daily_recovery_log")
      .delete()
      .eq("user_id", userId)
      .eq("date", date);

    if (error) {
      console.error("Error deleting recovery log:", error);
      return { success: false, error };
    }

    return { success: true, error: null };
  } catch (err) {
    console.error("Unexpected error in deleteRecoveryLog:", err);
    return { success: false, error: err };
  }
};

// ============================================================================
// ANALYTICS & TRENDS
// ============================================================================

/**
 * Calculate recovery trends over a period
 */
export const getRecoveryTrends = async (userId: string, days: number = 30) => {
  try {
    const { history, error } = await getRecoveryHistory(userId, days);

    if (error || history.length === 0) {
      return { trends: null, error: error || new Error("No data available") };
    }

    // Calculate averages
    const trends: RecoveryTrends = {
      avg_sleep_hours: 0,
      avg_sleep_quality: 0,
      avg_stress_level: 0,
      avg_energy_level: 0,
      avg_muscle_soreness: 0,
      avg_overall_readiness: 0,
      avg_recovery_score: 0,
      total_entries: history.length,
    };

    let sleepCount = 0;
    let qualityCount = 0;
    let stressCount = 0;
    let energyCount = 0;
    let sorenessCount = 0;
    let readinessCount = 0;
    let scoreCount = 0;

    history.forEach((log) => {
      if (log.sleep_hours !== null) {
        trends.avg_sleep_hours += log.sleep_hours;
        sleepCount++;
      }
      if (log.sleep_quality !== null) {
        trends.avg_sleep_quality += log.sleep_quality;
        qualityCount++;
      }
      if (log.stress_level !== null) {
        trends.avg_stress_level += log.stress_level;
        stressCount++;
      }
      if (log.energy_level !== null) {
        trends.avg_energy_level += log.energy_level;
        energyCount++;
      }
      if (log.muscle_soreness !== null) {
        trends.avg_muscle_soreness += log.muscle_soreness;
        sorenessCount++;
      }
      if (log.overall_readiness !== null) {
        trends.avg_overall_readiness += log.overall_readiness;
        readinessCount++;
      }
      if (log.recovery_score !== null) {
        trends.avg_recovery_score += log.recovery_score;
        scoreCount++;
      }
    });

    // Calculate averages
    if (sleepCount > 0)
      trends.avg_sleep_hours = trends.avg_sleep_hours / sleepCount;
    if (qualityCount > 0)
      trends.avg_sleep_quality = trends.avg_sleep_quality / qualityCount;
    if (stressCount > 0)
      trends.avg_stress_level = trends.avg_stress_level / stressCount;
    if (energyCount > 0)
      trends.avg_energy_level = trends.avg_energy_level / energyCount;
    if (sorenessCount > 0)
      trends.avg_muscle_soreness = trends.avg_muscle_soreness / sorenessCount;
    if (readinessCount > 0)
      trends.avg_overall_readiness =
        trends.avg_overall_readiness / readinessCount;
    if (scoreCount > 0)
      trends.avg_recovery_score = trends.avg_recovery_score / scoreCount;

    return { trends, error: null };
  } catch (err) {
    console.error("Unexpected error in getRecoveryTrends:", err);
    return { trends: null, error: err };
  }
};

/**
 * Check if user has logged recovery today
 */
export const hasLoggedToday = async (userId: string): Promise<boolean> => {
  const { recoveryLog } = await getTodayRecoveryLog(userId);
  return recoveryLog !== null;
};

/**
 * Get streak (consecutive days with logs)
 */
export const getRecoveryStreak = async (userId: string) => {
  try {
    const { history, error } = await getRecoveryHistory(userId, 365); // Last year

    if (error || history.length === 0) {
      return { streak: 0, error };
    }

    // Sort by date descending (most recent first)
    const sortedHistory = [...history].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    );

    let streak = 0;
    let currentDate = new Date();

    for (const log of sortedHistory) {
      const logDate = new Date(log.date);
      const expectedDate = new Date(currentDate);
      expectedDate.setDate(expectedDate.getDate() - streak);

      // Check if this log is for the expected date
      if (
        logDate.toISOString().split("T")[0] ===
        expectedDate.toISOString().split("T")[0]
      ) {
        streak++;
      } else {
        break; // Streak broken
      }
    }

    return { streak, error: null };
  } catch (err) {
    console.error("Unexpected error in getRecoveryStreak:", err);
    return { streak: 0, error: err };
  }
};

// ============================================================================
// PROFILE SETTINGS
// ============================================================================

/**
 * Enable/disable daily recovery tracking for a user
 */
export const setRecoveryTrackingEnabled = async (
  userId: string,
  enabled: boolean
) => {
  try {
    const { error } = await supabase
      .from("profiles")
      .update({ enable_daily_recovery_tracking: enabled })
      .eq("id", userId);

    if (error) {
      console.error("Error updating recovery tracking setting:", error);
      return { success: false, error };
    }

    return { success: true, error: null };
  } catch (err) {
    console.error("Unexpected error in setRecoveryTrackingEnabled:", err);
    return { success: false, error: err };
  }
};

/**
 * Check if user has recovery tracking enabled
 */
export const isRecoveryTrackingEnabled = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from("profiles")
      .select("enable_daily_recovery_tracking")
      .eq("id", userId)
      .single();

    if (error) {
      console.error("Error checking recovery tracking setting:", error);
      return { enabled: false, error };
    }

    return {
      enabled: data?.enable_daily_recovery_tracking || false,
      error: null,
    };
  } catch (err) {
    console.error("Unexpected error in isRecoveryTrackingEnabled:", err);
    return { enabled: false, error: err };
  }
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Validate recovery log input
 */
export const validateRecoveryInput = (
  data: RecoveryLogInput
): string | null => {
  // Sleep hours
  if (data.sleep_hours !== undefined) {
    if (data.sleep_hours < 0 || data.sleep_hours > 24) {
      return "Schlafstunden müssen zwischen 0 und 24 liegen";
    }
  }

  // Sleep quality
  if (data.sleep_quality !== undefined) {
    if (data.sleep_quality < 1 || data.sleep_quality > 10) {
      return "Schlafqualität muss zwischen 1 und 10 liegen";
    }
  }

  // Stress level
  if (data.stress_level !== undefined) {
    if (data.stress_level < 1 || data.stress_level > 10) {
      return "Stress-Level muss zwischen 1 und 10 liegen";
    }
  }

  // Energy level
  if (data.energy_level !== undefined) {
    if (data.energy_level < 1 || data.energy_level > 10) {
      return "Energie-Level muss zwischen 1 und 10 liegen";
    }
  }

  // Muscle soreness
  if (data.muscle_soreness !== undefined) {
    if (data.muscle_soreness < 1 || data.muscle_soreness > 10) {
      return "Muskelkater muss zwischen 1 und 10 liegen";
    }
  }

  // Overall readiness
  if (data.overall_readiness !== undefined) {
    if (data.overall_readiness < 1 || data.overall_readiness > 10) {
      return "Training Readiness muss zwischen 1 und 10 liegen";
    }
  }

  // Mood
  if (data.mood !== undefined && data.mood !== null) {
    if (data.mood < 1 || data.mood > 10) {
      return "Stimmung muss zwischen 1 und 10 liegen";
    }
  }

  // Hydration
  if (data.hydration_liters !== undefined && data.hydration_liters !== null) {
    if (data.hydration_liters < 0) {
      return "Trinkmenge kann nicht negativ sein";
    }
  }

  // HRV
  if (data.hrv !== undefined && data.hrv !== null) {
    if (data.hrv <= 0) {
      return "HRV muss größer als 0 sein";
    }
  }

  // Resting heart rate
  if (
    data.resting_heart_rate !== undefined &&
    data.resting_heart_rate !== null
  ) {
    if (data.resting_heart_rate <= 0 || data.resting_heart_rate >= 220) {
      return "Ruhepuls muss zwischen 1 und 220 liegen";
    }
  }

  return null; // Valid
};

/**
 * Get recovery score interpretation
 */
export const getRecoveryScoreInterpretation = (
  score: number
): {
  label: string;
  emoji: string;
  color: string;
  description: string;
} => {
  if (score >= 80) {
    return {
      label: "Exzellent",
      emoji: "⭐⭐⭐⭐⭐",
      color: "#34C759",
      description: "Perfekt für ein intensives Training!",
    };
  } else if (score >= 60) {
    return {
      label: "Gut",
      emoji: "⭐⭐⭐⭐",
      color: "#30D158",
      description: "Du bist bereit für dein Workout.",
    };
  } else if (score >= 40) {
    return {
      label: "Moderat",
      emoji: "⭐⭐⭐",
      color: "#FFD60A",
      description: "Normales Training möglich, höre auf deinen Körper.",
    };
  } else if (score >= 20) {
    return {
      label: "Niedrig",
      emoji: "⭐⭐",
      color: "#FF9F0A",
      description: "Erwäge ein Deload-Workout oder leichtes Training.",
    };
  } else {
    return {
      label: "Sehr niedrig",
      emoji: "⭐",
      color: "#FF3B30",
      description: "Ruhetag empfohlen. Dein Körper braucht Erholung.",
    };
  }
};

/**
 * Format date for display (German format)
 */
export const formatRecoveryDate = (dateStr: string): string => {
  const date = new Date(dateStr);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const dateOnly = date.toISOString().split("T")[0];
  const todayOnly = today.toISOString().split("T")[0];
  const yesterdayOnly = yesterday.toISOString().split("T")[0];

  if (dateOnly === todayOnly) {
    return "Heute";
  } else if (dateOnly === yesterdayOnly) {
    return "Gestern";
  } else {
    // German format: DD.MM.YYYY
    const day = date.getDate().toString().padStart(2, "0");
    const month = (date.getMonth() + 1).toString().padStart(2, "0");
    const year = date.getFullYear();
    return `${day}.${month}.${year}`;
  }
};
