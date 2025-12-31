// src/services/calorieCalculationService.ts
/**
 * Kalorienberechnung für Workouts
 * Basierend auf wissenschaftlichen MET-Werten (Metabolic Equivalents)
 * 
 * Formel: Kalorien/Min = (MET × 3.5 × Gewicht_kg) / 200
 * 
 * Quellen:
 * - 2011 & 2024 Compendium of Physical Activities
 * - Ainsworth BE, et al. (2011)
 */

import { supabase } from '@/lib/supabase';

// =====================================================
// TYPES
// =====================================================

export interface WorkoutCalorieCalculation {
  totalCalories: number;
  activeTimeMinutes: number;
  restTimeMinutes: number;
  averageMET: number;
  breakdown: ExerciseCalorieBreakdown[];
  calculationMethod: 'met_standard' | 'met_with_rest' | 'met_corrected';
}

export interface ExerciseCalorieBreakdown {
  exerciseName: string;
  category: string;
  sets: number;
  totalReps: number;
  averageWeight: number;
  calories: number;
  timeMinutes: number;
  met: number;
}

export interface SetCalorieData {
  setId: string;
  exerciseName: string;
  reps: number;
  weight: number;
  met: number;
  estimatedSeconds: number;
  calories: number;
}

// =====================================================
// HAUPTFUNKTION: Berechne Workout-Kalorien
// =====================================================

/**
 * Berechnet die gesamten verbrannten Kalorien für ein Workout
 * @param sessionId - ID der Workout-Session
 * @param userWeight - Gewicht des Nutzers in kg
 * @param includeRestCalories - Sollen Pausenkalorien einberechnet werden?
 * @returns Detaillierte Kalorienberechnung
 */
export async function calculateWorkoutCalories(
  sessionId: string,
  userWeight?: number,
  includeRestCalories: boolean = true
): Promise<WorkoutCalorieCalculation> {
  
  // 1. Hole User-Gewicht falls nicht übergeben
  if (!userWeight) {
    const { data: session } = await supabase
      .from('workout_sessions')
      .select('user_id, profiles(weight)')
      .eq('id', sessionId)
      .single();
    
    if (!session?.profiles?.weight) {
      throw new Error('User weight not found');
    }
    userWeight = session.profiles.weight;
  }
  
  // 2. Hole alle abgeschlossenen Sets (keine Warmup-Sätze)
  const { data: workoutSets, error } = await supabase
    .from('workout_sets')
    .select(`
      id,
      reps,
      weight,
      rpe,
      rir,
      exercise:exercises(
        id,
        name_de,
        category,
        met_base
      )
    `)
    .eq('session_id', sessionId)
    .eq('completed', true)
    .eq('is_warmup', false);
  
  if (error || !workoutSets) {
    throw new Error(`Failed to fetch workout sets: ${error?.message}`);
  }
  
  // 3. Berechne Kalorien pro Set
  const setCalculations: SetCalorieData[] = [];
  let totalActiveSeconds = 0;
  
  for (const set of workoutSets) {
    const calculation = calculateSetCalories(
      set,
      userWeight
    );
    
    setCalculations.push(calculation);
    totalActiveSeconds += calculation.estimatedSeconds;
  }
  
  // 4. Aggregiere nach Übung
  const breakdown = aggregateByExercise(setCalculations);
  
  // 5. Berechne Gesamt-Statistiken
  const totalActiveCalories = setCalculations.reduce(
    (sum, set) => sum + set.calories, 
    0
  );
  const activeTimeMinutes = totalActiveSeconds / 60;
  const averageMET = totalActiveCalories > 0 
    ? (totalActiveCalories * 200) / (3.5 * userWeight * activeTimeMinutes)
    : 5.5;
  
  // 6. Berechne Pausenkalorien falls gewünscht
  let restTimeMinutes = 0;
  let restCalories = 0;
  
  if (includeRestCalories) {
    const { data: session } = await supabase
      .from('workout_sessions')
      .select('duration_minutes')
      .eq('id', sessionId)
      .single();
    
    if (session?.duration_minutes) {
      restTimeMinutes = Math.max(0, session.duration_minutes - activeTimeMinutes);
      // MET für Stehen/leichte Aktivität = 1.3
      restCalories = calculateRestCalories(restTimeMinutes, userWeight);
    }
  }
  
  // 7. Rückgabe
  return {
    totalCalories: Math.round(totalActiveCalories + restCalories),
    activeTimeMinutes: Math.round(activeTimeMinutes * 10) / 10,
    restTimeMinutes: Math.round(restTimeMinutes * 10) / 10,
    averageMET: Math.round(averageMET * 10) / 10,
    breakdown,
    calculationMethod: includeRestCalories ? 'met_with_rest' : 'met_standard'
  };
}

// =====================================================
// HILFSFUNKTIONEN
// =====================================================

/**
 * Berechnet Kalorien für einen einzelnen Satz
 */
function calculateSetCalories(
  set: any,
  userWeight: number
): SetCalorieData {
  
  const exercise = set.exercise;
  const baseMET = exercise.met_base || 5.5;
  
  // Schätze Dauer des Satzes
  const estimatedSeconds = estimateSetDuration(
    set.reps,
    exercise.category
  );
  
  // Adjustiere MET basierend auf Intensität (RPE/RIR)
  const adjustedMET = adjustMETForIntensity(
    baseMET,
    set.rpe,
    set.rir
  );
  
  // Berechne Kalorien: (MET × 3.5 × weight_kg × minutes) / 200
  const timeMinutes = estimatedSeconds / 60;
  const calories = (adjustedMET * 3.5 * userWeight * timeMinutes) / 200;
  
  return {
    setId: set.id,
    exerciseName: exercise.name_de,
    reps: set.reps,
    weight: set.weight || 0,
    met: adjustedMET,
    estimatedSeconds,
    calories: Math.round(calories * 100) / 100
  };
}

/**
 * Schätzt die Dauer eines Satzes basierend auf Wiederholungen
 * Compound-Übungen brauchen länger pro Rep als Isolation
 */
function estimateSetDuration(
  reps: number,
  category: string
): number {
  const secondsPerRep = category === 'compound' ? 3.5 : 2.5;
  return Math.round(reps * secondsPerRep);
}

/**
 * Passt MET-Wert basierend auf wahrgenommener Intensität an
 * Höhere Intensität (RPE 8-10 oder RIR 0-2) = +10%
 * Niedrigere Intensität (RPE <6 oder RIR >4) = -10%
 */
function adjustMETForIntensity(
  baseMET: number,
  rpe?: number,
  rir?: number
): number {
  
  // Priorisiere RPE wenn vorhanden
  if (rpe !== null && rpe !== undefined) {
    if (rpe >= 8) {
      return baseMET * 1.1; // Hohe Intensität
    } else if (rpe < 6) {
      return baseMET * 0.9; // Niedrige Intensität
    }
  } 
  // Nutze RIR falls kein RPE
  else if (rir !== null && rir !== undefined) {
    if (rir <= 2) {
      return baseMET * 1.1; // Hohe Intensität
    } else if (rir > 4) {
      return baseMET * 0.9; // Niedrige Intensität
    }
  }
  
  // Moderate Intensität - keine Änderung
  return baseMET;
}

/**
 * Berechnet Kalorien während Pausenzeiten
 * Verwendet MET 1.3 für Stehen/leichte Aktivität
 */
function calculateRestCalories(
  restTimeMinutes: number,
  userWeight: number
): number {
  const REST_MET = 1.3; // Stehen, leichte Aktivität
  return (REST_MET * 3.5 * userWeight * restTimeMinutes) / 200;
}

/**
 * Aggregiert Set-Daten nach Übung
 */
function aggregateByExercise(
  setCalculations: SetCalorieData[]
): ExerciseCalorieBreakdown[] {
  
  const exerciseMap = new Map<string, ExerciseCalorieBreakdown>();
  
  for (const set of setCalculations) {
    const key = set.exerciseName;
    
    if (!exerciseMap.has(key)) {
      exerciseMap.set(key, {
        exerciseName: set.exerciseName,
        category: '', // Wird später gesetzt
        sets: 0,
        totalReps: 0,
        averageWeight: 0,
        calories: 0,
        timeMinutes: 0,
        met: 0
      });
    }
    
    const current = exerciseMap.get(key)!;
    current.sets += 1;
    current.totalReps += set.reps;
    current.calories += set.calories;
    current.timeMinutes += set.estimatedSeconds / 60;
    current.averageWeight = ((current.averageWeight * (current.sets - 1)) + set.weight) / current.sets;
    current.met = ((current.met * (current.sets - 1)) + set.met) / current.sets;
  }
  
  // Sortiere nach Kalorien (höchste zuerst)
  return Array.from(exerciseMap.values())
    .map(ex => ({
      ...ex,
      calories: Math.round(ex.calories),
      timeMinutes: Math.round(ex.timeMinutes * 10) / 10,
      met: Math.round(ex.met * 10) / 10,
      averageWeight: Math.round(ex.averageWeight * 10) / 10
    }))
    .sort((a, b) => b.calories - a.calories);
}

// =====================================================
// DATENBANK-UPDATE FUNKTIONEN
// =====================================================

/**
 * Speichert die Kalorienberechnung in der Datenbank
 */
export async function saveWorkoutCalories(
  sessionId: string,
  calculation: WorkoutCalorieCalculation
): Promise<void> {
  
  const { error } = await supabase
    .from('workout_sessions')
    .update({
      total_calories_burned: calculation.totalCalories,
      active_time_minutes: calculation.activeTimeMinutes,
      average_met: calculation.averageMET,
      calculation_method: calculation.calculationMethod
    })
    .eq('id', sessionId);
  
  if (error) {
    throw new Error(`Failed to save calories: ${error.message}`);
  }
}

/**
 * Berechnet und speichert Kalorien für ein Workout in einem Schritt
 */
export async function calculateAndSaveWorkoutCalories(
  sessionId: string,
  userWeight?: number,
  includeRestCalories: boolean = true
): Promise<WorkoutCalorieCalculation> {
  
  const calculation = await calculateWorkoutCalories(
    sessionId,
    userWeight,
    includeRestCalories
  );
  
  await saveWorkoutCalories(sessionId, calculation);
  
  return calculation;
}

// =====================================================
// STATISTIK-FUNKTIONEN
// =====================================================

/**
 * Holt Kalorien-Statistiken für einen Zeitraum
 */
export async function getCalorieStats(
  userId: string,
  startDate: Date,
  endDate: Date
): Promise<{
  totalWorkouts: number;
  totalCalories: number;
  averageCaloriesPerWorkout: number;
  totalActiveTime: number;
}> {
  
  const { data: sessions, error } = await supabase
    .from('workout_sessions')
    .select('total_calories_burned, active_time_minutes')
    .eq('user_id', userId)
    .eq('status', 'completed')
    .gte('date', startDate.toISOString().split('T')[0])
    .lte('date', endDate.toISOString().split('T')[0])
    .not('total_calories_burned', 'is', null);
  
  if (error || !sessions) {
    return {
      totalWorkouts: 0,
      totalCalories: 0,
      averageCaloriesPerWorkout: 0,
      totalActiveTime: 0
    };
  }
  
  const totalCalories = sessions.reduce(
    (sum, s) => sum + (s.total_calories_burned || 0), 
    0
  );
  
  const totalActiveTime = sessions.reduce(
    (sum, s) => sum + (s.active_time_minutes || 0),
    0
  );
  
  return {
    totalWorkouts: sessions.length,
    totalCalories,
    averageCaloriesPerWorkout: sessions.length > 0 
      ? Math.round(totalCalories / sessions.length) 
      : 0,
    totalActiveTime: Math.round(totalActiveTime)
  };
}

/**
 * Holt Top-Übungen nach Kalorienverbrauch
 */
export async function getTopCalorieBurningExercises(
  userId: string,
  limit: number = 10
): Promise<Array<{
  exerciseName: string;
  totalCalories: number;
  totalSets: number;
  averageCaloriesPerSet: number;
}>> {
  
  const { data, error } = await supabase
    .from('workout_exercise_calorie_breakdown')
    .select('exercise_name, total_calories, sets_count')
    .eq('user_id', userId)
    .order('total_calories', { ascending: false })
    .limit(limit);
  
  if (error || !data) {
    return [];
  }
  
  return data.map(ex => ({
    exerciseName: ex.exercise_name,
    totalCalories: ex.total_calories,
    totalSets: ex.sets_count,
    averageCaloriesPerSet: Math.round(ex.total_calories / ex.sets_count)
  }));
}

// =====================================================
// ERWEITERTE FUNKTIONEN (für zukünftige Features)
// =====================================================

/**
 * Berechnet Kalorien mit personalisiertem RMR (Harris-Benedict)
 * Genauer als Standard-MET, berücksichtigt Alter, Größe, Geschlecht
 */
export async function calculateCaloriesWithCorrectedMET(
  sessionId: string,
  userId: string
): Promise<WorkoutCalorieCalculation> {
  
  // Hole User-Profile mit allen Daten
  const { data: profile } = await supabase
    .from('profiles')
    .select('weight, height, age, gender')
    .eq('id', userId)
    .single();
  
  if (!profile) {
    throw new Error('User profile not found');
  }
  
  // Berechne RMR mit Harris-Benedict Formel
  const rmr = calculateRMR(
    profile.weight,
    profile.height,
    profile.age,
    profile.gender
  );
  
  // Konvertiere zu kcal/min
  const rmrPerMin = rmr / (24 * 60);
  
  // Standard MET basiert auf 3.5 ml O2/kg/min
  // Korrigierter Faktor = individueller RMR / Standard RMR
  const standardRMR = (3.5 * profile.weight) / 200;
  const correctionFactor = rmrPerMin / standardRMR;
  
  // Berechne mit Standard-Methode
  const standardCalc = await calculateWorkoutCalories(sessionId, profile.weight);
  
  // Wende Korrekturfaktor an
  return {
    ...standardCalc,
    totalCalories: Math.round(standardCalc.totalCalories * correctionFactor),
    calculationMethod: 'met_corrected'
  };
}

/**
 * Harris-Benedict Formel für RMR (Resting Metabolic Rate)
 */
function calculateRMR(
  weight: number,
  height: number,
  age: number,
  gender: 'male' | 'female' | 'other'
): number {
  
  if (gender === 'male') {
    return 66.4730 + (13.7516 * weight) + (5.0033 * height) - (6.7550 * age);
  } else {
    // female or other
    return 655.0955 + (9.5634 * weight) + (1.8496 * height) - (4.6756 * age);
  }
}

// =====================================================
// EXPORT
// =====================================================

export default {
  calculateWorkoutCalories,
  calculateAndSaveWorkoutCalories,
  saveWorkoutCalories,
  getCalorieStats,
  getTopCalorieBurningExercises,
  calculateCaloriesWithCorrectedMET
};
