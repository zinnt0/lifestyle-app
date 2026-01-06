/**
 * Local SQLite Workout History Cache Service
 *
 * Caches workout session data and exercise metrics for instant offline access
 * and historical tracking of training progress.
 */

import * as SQLite from 'expo-sqlite';
import { supabase } from '../../lib/supabase';

const LOG_PREFIX = '[LocalWorkoutHistoryCache]';
const DB_NAME = 'food_cache.db'; // Reuse same DB as food, nutrition & profile cache

export interface CachedWorkoutSession {
  id: string;
  session_id: string;
  user_id: string;
  plan_workout_id: string;
  workout_name: string;
  date: string;
  total_volume: number;
  total_sets: number;
  duration_minutes: number | null;
  cached_at: string;
}

export interface CachedExerciseMetrics {
  id: string;
  session_id: string;
  exercise_id: string;
  exercise_name: string;
  plan_workout_id: string;
  date: string;
  avg_weight: number;
  avg_reps: number;
  top_weight: number;
  top_reps: number;
  total_volume: number;
  e1rm: number | null;
  cached_at: string;
}

export interface ExerciseHistoryPoint {
  date: string;
  session_id: string;
  workout_name: string;
  avg_weight: number;
  avg_reps: number;
  top_weight: number;
  top_reps: number;
  total_volume: number;
  e1rm: number | null;
}

export class LocalWorkoutHistoryCache {
  private db: SQLite.SQLiteDatabase | null = null;
  private initialized: boolean = false;

  /**
   * Initialize the SQLite database and create workout history tables
   */
  async initialize(): Promise<void> {
    if (this.initialized) {
      console.log(`${LOG_PREFIX} Already initialized`);
      return;
    }

    try {
      console.log(`${LOG_PREFIX} Initializing SQLite database...`);

      // Open database (reuse same DB)
      this.db = await SQLite.openDatabaseAsync(DB_NAME);

      // Create tables
      await this.createTables();

      this.initialized = true;
      console.log(`${LOG_PREFIX} Successfully initialized`);
    } catch (error) {
      console.error(`${LOG_PREFIX} Initialization failed:`, error);
      throw new Error(`Failed to initialize workout history cache: ${error}`);
    }
  }

  /**
   * Cache a completed workout session
   * Fetches sets from Supabase, calculates metrics, and stores in cache
   */
  async cacheWorkoutSession(sessionId: string): Promise<void> {
    this.ensureInitialized();

    try {
      console.log(`${LOG_PREFIX} Caching workout session: ${sessionId}`);

      // Fetch session data from Supabase
      const { data: session, error: sessionError } = await supabase
        .from('workout_sessions')
        .select(`
          id,
          user_id,
          plan_workout_id,
          date,
          start_time,
          end_time,
          duration_minutes,
          workout:plan_workouts!plan_workout_id (
            name
          )
        `)
        .eq('id', sessionId)
        .single();

      if (sessionError) throw sessionError;
      if (!session) throw new Error('Session not found');

      // Fetch all sets for this session
      const { data: sets, error: setsError } = await supabase
        .from('workout_sets')
        .select(`
          id,
          exercise_id,
          weight,
          reps,
          exercise:exercises!inner (
            name_de
          )
        `)
        .eq('session_id', sessionId);

      if (setsError) throw setsError;
      if (!sets || sets.length === 0) {
        console.log(`${LOG_PREFIX} No sets found for session ${sessionId}`);
        return;
      }

      // Calculate overall workout metrics
      let totalVolume = 0;
      const exerciseGroups: Record<string, any[]> = {};

      sets.forEach((set: any) => {
        const weight = set.weight || 0;
        const reps = set.reps || 0;
        const volume = weight * reps;
        totalVolume += volume;

        // Group by exercise
        if (!exerciseGroups[set.exercise_id]) {
          exerciseGroups[set.exercise_id] = [];
        }
        exerciseGroups[set.exercise_id].push({
          weight,
          reps,
          volume,
          exerciseName: set.exercise.name_de,
        });
      });

      // Cache workout session
      await this.db!.runAsync(
        `INSERT OR REPLACE INTO workout_history_cache (
          id, session_id, user_id, plan_workout_id, workout_name,
          date, total_volume, total_sets, duration_minutes, cached_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          sessionId,
          sessionId,
          session.user_id,
          session.plan_workout_id,
          (session.workout as any)?.name || 'Workout',
          session.date,
          totalVolume,
          sets.length,
          session.duration_minutes,
          new Date().toISOString(),
        ]
      );

      // Cache exercise metrics
      for (const [exerciseId, exerciseSets] of Object.entries(exerciseGroups)) {
        const metrics = this.calculateExerciseMetrics(exerciseSets);
        const exerciseName = exerciseSets[0].exerciseName;

        await this.db!.runAsync(
          `INSERT OR REPLACE INTO exercise_history_cache (
            id, session_id, exercise_id, exercise_name, plan_workout_id,
            date, avg_weight, avg_reps, top_weight, top_reps,
            total_volume, e1rm, cached_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            `${sessionId}-${exerciseId}`,
            sessionId,
            exerciseId,
            exerciseName,
            session.plan_workout_id,
            session.date,
            metrics.avgWeight,
            metrics.avgReps,
            metrics.topWeight,
            metrics.topReps,
            metrics.totalVolume,
            metrics.e1rm,
            new Date().toISOString(),
          ]
        );
      }

      console.log(`${LOG_PREFIX} Successfully cached session ${sessionId}`);
    } catch (error) {
      console.error(`${LOG_PREFIX} Error caching session:`, error);
      throw error;
    }
  }

  /**
   * Get history for a specific exercise
   * Returns chronologically sorted data points
   */
  async getExerciseHistory(
    userId: string,
    exerciseId: string,
    limit: number = 100
  ): Promise<ExerciseHistoryPoint[]> {
    this.ensureInitialized();

    try {
      console.log(`${LOG_PREFIX} Getting history for exercise: ${exerciseId}`);

      const results = await this.db!.getAllAsync<any>(
        `SELECT
          e.date,
          e.session_id,
          e.avg_weight,
          e.avg_reps,
          e.top_weight,
          e.top_reps,
          e.total_volume,
          e.e1rm,
          w.workout_name
        FROM exercise_history_cache e
        JOIN workout_history_cache w ON e.session_id = w.session_id
        WHERE e.exercise_id = ? AND w.user_id = ?
        ORDER BY e.date DESC
        LIMIT ?`,
        [exerciseId, userId, limit]
      );

      return results.map(row => ({
        date: row.date,
        session_id: row.session_id,
        workout_name: row.workout_name,
        avg_weight: row.avg_weight,
        avg_reps: row.avg_reps,
        top_weight: row.top_weight,
        top_reps: row.top_reps,
        total_volume: row.total_volume,
        e1rm: row.e1rm,
      }));
    } catch (error) {
      console.error(`${LOG_PREFIX} Error getting exercise history:`, error);
      return [];
    }
  }

  /**
   * Get all exercises that have cached history for a user
   */
  async getExercisesWithHistory(userId: string): Promise<Array<{
    exercise_id: string;
    exercise_name: string;
    session_count: number;
    last_performed: string;
  }>> {
    this.ensureInitialized();

    try {
      const results = await this.db!.getAllAsync<any>(
        `SELECT
          e.exercise_id,
          e.exercise_name,
          COUNT(DISTINCT e.session_id) as session_count,
          MAX(e.date) as last_performed
        FROM exercise_history_cache e
        JOIN workout_history_cache w ON e.session_id = w.session_id
        WHERE w.user_id = ?
        GROUP BY e.exercise_id, e.exercise_name
        ORDER BY last_performed DESC`,
        [userId]
      );

      return results.map(row => ({
        exercise_id: row.exercise_id,
        exercise_name: row.exercise_name,
        session_count: row.session_count,
        last_performed: row.last_performed,
      }));
    } catch (error) {
      console.error(`${LOG_PREFIX} Error getting exercises with history:`, error);
      return [];
    }
  }

  /**
   * Load historical workout sessions from Supabase and cache them
   * Useful for initial setup or after cache reset
   */
  async loadHistoricalData(userId: string, monthsBack: number = 12): Promise<number> {
    this.ensureInitialized();

    try {
      console.log(`${LOG_PREFIX} Loading historical data for user ${userId} (${monthsBack} months)`);

      const dateThreshold = new Date();
      dateThreshold.setMonth(dateThreshold.getMonth() - monthsBack);

      // Fetch completed sessions
      const { data: sessions, error } = await supabase
        .from('workout_sessions')
        .select('id')
        .eq('user_id', userId)
        .eq('status', 'completed')
        .gte('date', dateThreshold.toISOString().split('T')[0])
        .order('date', { ascending: false });

      if (error) throw error;
      if (!sessions || sessions.length === 0) {
        console.log(`${LOG_PREFIX} No historical sessions found`);
        return 0;
      }

      // Cache each session
      let cachedCount = 0;
      for (const session of sessions) {
        try {
          // Check if already cached
          const existing = await this.db!.getFirstAsync<any>(
            'SELECT id FROM workout_history_cache WHERE session_id = ?',
            [session.id]
          );

          if (!existing) {
            await this.cacheWorkoutSession(session.id);
            cachedCount++;
          }
        } catch (error) {
          console.error(`${LOG_PREFIX} Error caching session ${session.id}:`, error);
          // Continue with next session
        }
      }

      console.log(`${LOG_PREFIX} Cached ${cachedCount} new sessions`);
      return cachedCount;
    } catch (error) {
      console.error(`${LOG_PREFIX} Error loading historical data:`, error);
      throw error;
    }
  }

  /**
   * Check if historical data has been loaded
   */
  async hasHistoricalData(userId: string): Promise<boolean> {
    this.ensureInitialized();

    try {
      const result = await this.db!.getFirstAsync<{ count: number }>(
        'SELECT COUNT(*) as count FROM workout_history_cache WHERE user_id = ?',
        [userId]
      );

      return (result?.count || 0) > 0;
    } catch (error) {
      console.error(`${LOG_PREFIX} Error checking historical data:`, error);
      return false;
    }
  }

  /**
   * Clear all cached workout history
   */
  async clearCache(): Promise<void> {
    this.ensureInitialized();

    try {
      console.log(`${LOG_PREFIX} Clearing workout history cache`);
      await this.db!.runAsync('DELETE FROM workout_history_cache');
      await this.db!.runAsync('DELETE FROM exercise_history_cache');
      console.log(`${LOG_PREFIX} Cache cleared`);
    } catch (error) {
      console.error(`${LOG_PREFIX} Error clearing cache:`, error);
      throw error;
    }
  }

  // ========================================================================
  // PRIVATE METHODS
  // ========================================================================

  /**
   * Create workout history cache tables
   */
  private async createTables(): Promise<void> {
    const createTablesSQL = `
      -- Workout session cache
      CREATE TABLE IF NOT EXISTS workout_history_cache (
        id TEXT PRIMARY KEY,
        session_id TEXT NOT NULL UNIQUE,
        user_id TEXT NOT NULL,
        plan_workout_id TEXT NOT NULL,
        workout_name TEXT NOT NULL,
        date TEXT NOT NULL,
        total_volume REAL NOT NULL,
        total_sets INTEGER NOT NULL,
        duration_minutes INTEGER,
        cached_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
      );

      -- Exercise metrics cache
      CREATE TABLE IF NOT EXISTS exercise_history_cache (
        id TEXT PRIMARY KEY,
        session_id TEXT NOT NULL,
        exercise_id TEXT NOT NULL,
        exercise_name TEXT NOT NULL,
        plan_workout_id TEXT NOT NULL,
        date TEXT NOT NULL,
        avg_weight REAL NOT NULL,
        avg_reps REAL NOT NULL,
        top_weight REAL NOT NULL,
        top_reps INTEGER NOT NULL,
        total_volume REAL NOT NULL,
        e1rm REAL,
        cached_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (session_id) REFERENCES workout_history_cache(session_id)
      );

      -- Indices for fast queries
      CREATE INDEX IF NOT EXISTS idx_workout_history_user ON workout_history_cache(user_id);
      CREATE INDEX IF NOT EXISTS idx_workout_history_date ON workout_history_cache(date DESC);
      CREATE INDEX IF NOT EXISTS idx_workout_history_plan_workout ON workout_history_cache(plan_workout_id);

      CREATE INDEX IF NOT EXISTS idx_exercise_history_exercise ON exercise_history_cache(exercise_id);
      CREATE INDEX IF NOT EXISTS idx_exercise_history_date ON exercise_history_cache(date DESC);
      CREATE INDEX IF NOT EXISTS idx_exercise_history_session ON exercise_history_cache(session_id);
    `;

    await this.db!.execAsync(createTablesSQL);
    console.log(`${LOG_PREFIX} Tables created`);
  }

  /**
   * Calculate metrics for an exercise from its sets
   */
  private calculateExerciseMetrics(sets: Array<{
    weight: number;
    reps: number;
    volume: number;
  }>): {
    avgWeight: number;
    avgReps: number;
    topWeight: number;
    topReps: number;
    totalVolume: number;
    e1rm: number | null;
  } {
    const totalWeight = sets.reduce((sum, set) => sum + set.weight, 0);
    const totalReps = sets.reduce((sum, set) => sum + set.reps, 0);
    const totalVolume = sets.reduce((sum, set) => sum + set.volume, 0);

    const avgWeight = totalWeight / sets.length;
    const avgReps = totalReps / sets.length;

    // Find top set (highest weight)
    const topSet = sets.reduce((best, current) =>
      current.weight > best.weight ? current : best
    );

    // Calculate estimated 1RM using Epley formula: weight × (1 + reps/30)
    const e1rm = topSet.weight > 0 && topSet.reps > 0
      ? topSet.weight * (1 + topSet.reps / 30)
      : null;

    return {
      avgWeight,
      avgReps,
      topWeight: topSet.weight,
      topReps: topSet.reps,
      totalVolume,
      e1rm,
    };
  }

  /**
   * Ensure database is initialized before operations
   */
  private ensureInitialized(): void {
    if (!this.initialized || !this.db) {
      throw new Error(
        'LocalWorkoutHistoryCache not initialized. Call initialize() first.'
      );
    }
  }
}

/**
 * Singleton instance for the app
 */
export const localWorkoutHistoryCache = new LocalWorkoutHistoryCache();
