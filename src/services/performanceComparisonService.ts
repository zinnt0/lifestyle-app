/**
 * Performance Comparison Service
 *
 * Vergleicht die Performance des aktuellen Workouts mit dem gleichen Workout der letzten Woche.
 * Berechnet prozentuale Verbesserungen/Verschlechterungen pro Übung.
 */

import { supabase } from '@/lib/supabase';

export interface ExercisePerformance {
  exerciseId: string;
  exerciseName: string;
  currentAverage: number;
  previousAverage: number;
  percentageChange: number; // Positive = Verbesserung, Negative = Verschlechterung
  hasPreviousData: boolean;
}

export interface WorkoutPerformanceComparison {
  exercises: ExercisePerformance[];
}

/**
 * Berechnet einen Durchschnittswert für eine Übung basierend auf:
 * - Gewicht
 * - Reps
 * - Volumen (Gewicht × Reps)
 *
 * Formel: (normalizedWeight + normalizedReps + normalizedVolume) / 3
 *
 * @param sets - Array von Sets mit weight und reps
 * @returns Durchschnittswert für die Exercise
 */
function calculateExerciseAverage(
  sets: Array<{ weight: number; reps: number }>
): number {
  if (sets.length === 0) return 0;

  // Berechne Durchschnittswerte
  const avgWeight = sets.reduce((sum, set) => sum + set.weight, 0) / sets.length;
  const avgReps = sets.reduce((sum, set) => sum + set.reps, 0) / sets.length;
  const avgVolume = sets.reduce((sum, set) => sum + set.weight * set.reps, 0) / sets.length;

  // Normalisiere und kombiniere (gleichgewichtet)
  // Diese Formel berücksichtigt alle drei Faktoren
  return (avgWeight + avgReps + avgVolume) / 3;
}

/**
 * Lädt die Performance-Daten für ein Workout
 *
 * @param sessionId - ID der Workout-Session
 * @returns Map von exerciseId -> { name, sets[] }
 */
async function getWorkoutPerformanceData(sessionId: string): Promise<
  Map<
    string,
    {
      name: string;
      sets: Array<{ weight: number; reps: number }>;
    }
  >
> {
  const { data: sets, error } = await supabase
    .from('workout_sets')
    .select(
      `
      exercise_id,
      weight,
      reps,
      exercise:exercises!inner (
        name_de
      )
    `
    )
    .eq('session_id', sessionId);

  if (error) {
    console.error('Fehler beim Laden der Workout-Performance-Daten:', error);
    throw new Error('Workout-Daten konnten nicht geladen werden');
  }

  // Gruppiere Sets nach Exercise
  const exerciseMap = new Map<
    string,
    {
      name: string;
      sets: Array<{ weight: number; reps: number }>;
    }
  >();

  sets?.forEach((set: any) => {
    const exerciseId = set.exercise_id;
    const exerciseName = set.exercise.name_de;

    if (!exerciseMap.has(exerciseId)) {
      exerciseMap.set(exerciseId, {
        name: exerciseName,
        sets: [],
      });
    }

    exerciseMap.get(exerciseId)!.sets.push({
      weight: set.weight || 0,
      reps: set.reps || 0,
    });
  });

  return exerciseMap;
}

/**
 * Findet das gleiche Workout der letzten Woche
 *
 * @param currentSessionId - ID der aktuellen Session
 * @returns Session-ID des Vergleichs-Workouts oder null
 */
async function findPreviousWeekWorkout(
  currentSessionId: string
): Promise<string | null> {
  try {
    // Lade aktuelle Session mit Workout-Informationen
    const { data: currentSession, error: currentError } = await supabase
      .from('workout_sessions')
      .select(`
        user_id,
        plan_workout_id,
        plan_id,
        date,
        workout:plan_workouts(
          name,
          day_number
        )
      `)
      .eq('id', currentSessionId)
      .single();

    if (currentError || !currentSession || !currentSession.workout) {
      console.error('Fehler beim Laden der aktuellen Session:', currentError);
      return null;
    }

    // Suche die letzte abgeschlossene Session für das gleiche Workout (ohne Zeitbeschränkung)
    // Dies funktioniert sowohl für Template-basierte als auch für Custom-Pläne
    let { data: previousSessions, error: previousError } = await supabase
      .from('workout_sessions')
      .select('id, date')
      .eq('user_id', currentSession.user_id)
      .eq('plan_workout_id', currentSession.plan_workout_id)
      .eq('status', 'completed')
      .neq('id', currentSessionId)
      .order('date', { ascending: false })
      .limit(1);

    if (previousError) {
      console.error('Fehler beim Suchen der vorherigen Session:', previousError);
      return null;
    }

    // Wenn nichts gefunden wurde, suche nach gleichem Workout-Namen im gleichen Plan
    // (für Custom-Plans oder wenn das Workout geändert wurde)
    if (!previousSessions || previousSessions.length === 0) {
      const { data: allPreviousSessions, error: nameSearchError } = await supabase
        .from('workout_sessions')
        .select(`
          id,
          date,
          workout:plan_workouts!inner(
            name,
            day_number
          )
        `)
        .eq('user_id', currentSession.user_id)
        .eq('plan_id', currentSession.plan_id)
        .eq('status', 'completed')
        .neq('id', currentSessionId)
        .order('date', { ascending: false });

      if (nameSearchError) {
        console.error('Fehler beim Suchen nach Namen:', nameSearchError);
        return null;
      }

      // Filtere nach gleichem Workout-Namen und nimm die neueste
      const currentWorkoutName = (currentSession.workout as any).name;
      previousSessions = (allPreviousSessions || []).filter(
        (session: any) => session.workout?.name === currentWorkoutName
      );
    }

    if (!previousSessions || previousSessions.length === 0) {
      return null;
    }

    return previousSessions[0].id;
  } catch (error) {
    console.error('Fehler in findPreviousWeekWorkout:', error);
    return null;
  }
}

/**
 * Vergleicht die Performance des aktuellen Workouts mit dem gleichen Workout der letzten Woche
 *
 * @param sessionId - ID der aktuellen Workout-Session
 * @returns Performance-Vergleich pro Übung
 */
export async function compareWorkoutPerformance(
  sessionId: string
): Promise<WorkoutPerformanceComparison> {
  try {
    // Lade aktuelle Workout-Daten
    const currentData = await getWorkoutPerformanceData(sessionId);

    // Finde vorheriges Workout
    const previousSessionId = await findPreviousWeekWorkout(sessionId);

    let previousData: Map<
      string,
      {
        name: string;
        sets: Array<{ weight: number; reps: number }>;
      }
    > | null = null;

    if (previousSessionId) {
      previousData = await getWorkoutPerformanceData(previousSessionId);
    }

    // Berechne Performance-Vergleich für jede Übung
    const exercises: ExercisePerformance[] = [];

    currentData.forEach((current, exerciseId) => {
      const currentAverage = calculateExerciseAverage(current.sets);

      let previousAverage = 0;
      let hasPreviousData = false;
      let percentageChange = 0;

      if (previousData && previousData.has(exerciseId)) {
        const previous = previousData.get(exerciseId)!;
        previousAverage = calculateExerciseAverage(previous.sets);
        hasPreviousData = true;

        // Berechne prozentuale Änderung
        if (previousAverage > 0) {
          percentageChange = ((currentAverage - previousAverage) / previousAverage) * 100;
        } else if (currentAverage > 0) {
          percentageChange = 100; // Von 0 auf etwas ist 100% Verbesserung
        }
      }

      exercises.push({
        exerciseId,
        exerciseName: current.name,
        currentAverage,
        previousAverage,
        percentageChange,
        hasPreviousData,
      });
    });

    // Sortiere nach der Reihenfolge im Workout (basierend auf der Reihenfolge in currentData)
    return {
      exercises,
    };
  } catch (error) {
    console.error('Fehler in compareWorkoutPerformance:', error);
    throw error;
  }
}
