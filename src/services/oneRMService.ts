/**
 * One Rep Max (1RM) Service
 *
 * Handles all 1RM-related operations including:
 * - Loading current 1RM values
 * - Saving new 1RM values
 * - Calculating working weights
 * - Estimating 1RM from workout data
 * - Checking for missing 1RM values
 */

import { supabase } from "@/lib/supabase";

// ============================================================================
// Types
// ============================================================================

export interface UserOneRM {
  user_id: string;
  exercise_id: string;
  weight: number;
  date: string;
  is_estimated: boolean;
  notes?: string;
  created_at: string;
}

export interface CurrentOneRM {
  exercise_id: string;
  exercise_name: string;
  exercise_name_de: string;
  weight: number;
  date: string;
  is_estimated: boolean;
}

export interface PlanTemplateRequirements {
  template_id: string;
  requires_1rm_for_exercises: string[]; // Array of exercise_ids
}

export interface MissingOneRMInfo {
  exercise_id: string;
  exercise_name: string;
  exercise_name_de: string;
}

// ============================================================================
// Get Current 1RM
// ============================================================================

/**
 * Holt den aktuellen 1RM-Wert für eine Exercise eines Users
 * Nutzt die view user_current_1rm die automatisch den neuesten Wert pro Exercise liefert
 *
 * @param userId - Die ID des Users
 * @param exerciseId - Die ID der Exercise
 * @returns Der aktuelle 1RM oder null wenn keiner existiert
 */
export async function getCurrentOneRM(
  userId: string,
  exerciseId: string
): Promise<CurrentOneRM | null> {
  try {
    const { data, error } = await supabase
      .from("user_current_1rm")
      .select("exercise_id, exercise_name, exercise_name_de, current_1rm, last_updated, is_estimated")
      .eq("user_id", userId)
      .eq("exercise_id", exerciseId)
      .maybeSingle();

    if (error) {
      console.error("Fehler beim Laden des aktuellen 1RM:", error);
      throw new Error("Aktueller 1RM konnte nicht geladen werden");
    }

    if (!data) return null;

    // Map view columns to interface
    return {
      exercise_id: data.exercise_id,
      exercise_name: data.exercise_name,
      exercise_name_de: data.exercise_name_de,
      weight: data.current_1rm,
      date: data.last_updated,
      is_estimated: data.is_estimated,
    };
  } catch (error) {
    console.error("Fehler in getCurrentOneRM:", error);
    throw error;
  }
}

/**
 * Holt alle aktuellen 1RM-Werte für einen User
 *
 * @param userId - Die ID des Users
 * @returns Liste aller aktuellen 1RM-Werte des Users
 */
export async function getAllCurrentOneRMs(
  userId: string
): Promise<CurrentOneRM[]> {
  try {
    const { data, error } = await supabase
      .from("user_current_1rm")
      .select("exercise_id, exercise_name, exercise_name_de, current_1rm, last_updated, is_estimated")
      .eq("user_id", userId)
      .order("exercise_name_de");

    if (error) {
      console.error("Fehler beim Laden der 1RM-Werte:", error);
      throw new Error("1RM-Werte konnten nicht geladen werden");
    }

    // Map view columns to interface
    return (data || []).map((item) => ({
      exercise_id: item.exercise_id,
      exercise_name: item.exercise_name,
      exercise_name_de: item.exercise_name_de,
      weight: item.current_1rm,
      date: item.last_updated,
      is_estimated: item.is_estimated,
    }));
  } catch (error) {
    console.error("Fehler in getAllCurrentOneRMs:", error);
    throw error;
  }
}

// ============================================================================
// Save 1RM
// ============================================================================

/**
 * Speichert einen neuen 1RM-Wert in die user_1rm Tabelle
 * Kann sowohl gemessene als auch geschätzte Werte speichern
 *
 * @param userId - Die ID des Users
 * @param exerciseId - Die ID der Exercise
 * @param weight - Gewicht in kg
 * @param isEstimated - Ob der Wert geschätzt oder gemessen wurde (default: false)
 * @param notes - Optional: Notizen zum 1RM
 */
export async function saveOneRM(
  userId: string,
  exerciseId: string,
  weight: number,
  isEstimated: boolean = false,
  notes?: string
): Promise<void> {
  try {
    // Validierung
    if (weight <= 0) {
      throw new Error("Gewicht muss größer als 0 sein");
    }

    const { error } = await supabase.from("user_1rm").insert({
      user_id: userId,
      exercise_id: exerciseId,
      weight: weight,
      date: new Date().toISOString().split("T")[0], // YYYY-MM-DD
      is_estimated: isEstimated,
      notes: notes,
    });

    if (error) {
      console.error("Fehler beim Speichern des 1RM:", error);
      throw new Error("1RM konnte nicht gespeichert werden");
    }
  } catch (error) {
    console.error("Fehler in saveOneRM:", error);
    throw error;
  }
}

// ============================================================================
// Plan Template Requirements
// ============================================================================

/**
 * Holt die Liste der Exercises für die ein 1RM benötigt wird
 * Basierend auf dem requires_1rm_for_exercises Feld im Template
 *
 * @param planType - Der plan_type des Templates (z.B. "powerbuilding_4day")
 * @returns Array von Exercise-IDs die einen 1RM benötigen
 */
export async function getRequiredOneRMExercises(
  planType: string
): Promise<string[]> {
  try {
    const { data, error } = await supabase
      .from("plan_templates")
      .select("requires_1rm_for_exercises")
      .eq("plan_type", planType)
      .maybeSingle();

    if (error) {
      console.error("Fehler beim Laden der Template-Requirements:", error);
      throw new Error("Template-Requirements konnten nicht geladen werden");
    }

    if (!data || !data.requires_1rm_for_exercises) {
      return [];
    }

    return data.requires_1rm_for_exercises;
  } catch (error) {
    console.error("Fehler in getRequiredOneRMExercises:", error);
    throw error;
  }
}

// ============================================================================
// Calculate Working Weight
// ============================================================================

/**
 * Berechnet das Arbeitsgewicht basierend auf 1RM und percentage_1rm
 * Nutzt die RPC-Funktion calculate_working_weight() die auch TM% berücksichtigt
 *
 * Beispiele:
 * - 1RM = 100kg, percentage_1rm = 80, tm_percentage = 90 → 72kg
 * - 1RM = 100kg, percentage_1rm = 80, tm_percentage = 100 → 80kg
 *
 * @param userId - Die ID des Users
 * @param exerciseId - Die ID der Exercise
 * @param percentageRM - Prozentsatz vom 1RM (z.B. 80 für 80%)
 * @param tmPercentage - Training Max Prozentsatz (z.B. 90 für 90%, default: 100)
 * @returns Das berechnete Arbeitsgewicht oder null wenn kein 1RM existiert
 */
export async function calculateWorkingWeight(
  userId: string,
  exerciseId: string,
  percentageRM: number,
  tmPercentage: number = 100
): Promise<number | null> {
  try {
    // Validierung
    if (percentageRM <= 0 || percentageRM > 100) {
      throw new Error("percentageRM muss zwischen 0 und 100 liegen");
    }

    if (tmPercentage <= 0 || tmPercentage > 100) {
      throw new Error("tmPercentage muss zwischen 0 und 100 liegen");
    }

    const { data, error } = await supabase.rpc("calculate_working_weight", {
      p_user_id: userId,
      p_exercise_id: exerciseId,
      p_percentage_1rm: percentageRM,
      p_tm_percentage: tmPercentage,
    });

    if (error) {
      console.error("Fehler beim Berechnen des Working Weight:", error);
      throw new Error("Working Weight konnte nicht berechnet werden");
    }

    console.log('[calculateWorkingWeight] RPC response:', JSON.stringify(data));

    // RPC returns an array with one object, extract the first element
    if (Array.isArray(data) && data.length > 0) {
      const result = data[0];
      if (result && typeof result === 'object' && 'working_weight' in result) {
        console.log('[calculateWorkingWeight] Extracted working_weight:', result.working_weight);
        return result.working_weight;
      }
    }

    // Fallback: if data is already a number, return it
    if (typeof data === 'number') {
      console.log('[calculateWorkingWeight] Data is already a number:', data);
      return data;
    }

    console.log('[calculateWorkingWeight] Could not extract weight, returning null');
    return null;
  } catch (error) {
    console.error("Fehler in calculateWorkingWeight:", error);
    throw error;
  }
}

// ============================================================================
// Check Missing 1RM
// ============================================================================

/**
 * Prüft welche 1RM-Werte für die gegebenen Exercises fehlen
 * Nützlich vor dem Start eines neuen Plans um zu prüfen ob alle Daten vorhanden sind
 *
 * @param userId - Die ID des Users
 * @param exerciseIds - Array von Exercise-IDs die geprüft werden sollen
 * @returns Array von Exercise-Informationen für die kein 1RM existiert
 */
export async function checkMissingOneRM(
  userId: string,
  exerciseIds: string[]
): Promise<MissingOneRMInfo[]> {
  try {
    if (exerciseIds.length === 0) {
      return [];
    }

    // Hole alle aktuellen 1RM-Werte des Users
    const { data: currentOneRMs, error: oneRMError } = await supabase
      .from("user_current_1rm")
      .select("exercise_id")
      .eq("user_id", userId)
      .in("exercise_id", exerciseIds);

    if (oneRMError) {
      console.error("Fehler beim Prüfen der 1RM-Werte:", oneRMError);
      throw new Error("1RM-Werte konnten nicht geprüft werden");
    }

    // Erstelle Set der vorhandenen Exercise-IDs
    const existingExerciseIds = new Set(
      (currentOneRMs || []).map((item) => item.exercise_id)
    );

    // Finde fehlende Exercise-IDs
    const missingExerciseIds = exerciseIds.filter(
      (id) => !existingExerciseIds.has(id)
    );

    if (missingExerciseIds.length === 0) {
      return [];
    }

    // Lade Exercise-Details für fehlende IDs
    const { data: exercises, error: exerciseError } = await supabase
      .from("exercises")
      .select("id, name, name_de")
      .in("id", missingExerciseIds);

    if (exerciseError) {
      console.error("Fehler beim Laden der Exercise-Details:", exerciseError);
      throw new Error("Exercise-Details konnten nicht geladen werden");
    }

    return (
      exercises?.map((exercise) => ({
        exercise_id: exercise.id,
        exercise_name: exercise.name,
        exercise_name_de: exercise.name_de,
      })) || []
    );
  } catch (error) {
    console.error("Fehler in checkMissingOneRM:", error);
    throw error;
  }
}

// ============================================================================
// Estimate 1RM
// ============================================================================

/**
 * Schätzt den 1RM-Wert basierend auf Gewicht und Wiederholungen
 * Nutzt die Epley-Formel: 1RM = weight * (1 + reps/30)
 *
 * Diese Formel ist am genauesten für 1-10 Wiederholungen.
 * Für höhere Wiederholungszahlen wird die Schätzung ungenauer.
 *
 * Beispiele:
 * - 100kg x 5 reps → 116.67kg
 * - 80kg x 8 reps → 101.33kg
 * - 60kg x 1 rep → 60kg
 *
 * @param weight - Verwendetes Gewicht in kg
 * @param reps - Anzahl der Wiederholungen
 * @returns Geschätzter 1RM-Wert in kg
 */
export function estimateOneRMFromWorkout(weight: number, reps: number): number {
  // Validierung
  if (weight <= 0) {
    throw new Error("Gewicht muss größer als 0 sein");
  }

  if (reps <= 0) {
    throw new Error("Wiederholungen müssen größer als 0 sein");
  }

  // Epley-Formel: 1RM = weight * (1 + reps/30)
  const estimatedOneRM = weight * (1 + reps / 30);

  // Runde auf 0.5kg genau
  return Math.round(estimatedOneRM * 2) / 2;
}

/**
 * Schätzt und speichert einen 1RM-Wert basierend auf einem Workout-Set
 * Kombiniert estimateOneRMFromWorkout() und saveOneRM()
 *
 * @param userId - Die ID des Users
 * @param exerciseId - Die ID der Exercise
 * @param weight - Verwendetes Gewicht in kg
 * @param reps - Anzahl der Wiederholungen
 * @param notes - Optional: Notizen zum 1RM
 */
export async function estimateAndSaveOneRM(
  userId: string,
  exerciseId: string,
  weight: number,
  reps: number,
  notes?: string
): Promise<number> {
  try {
    const estimatedOneRM = estimateOneRMFromWorkout(weight, reps);

    const noteText = notes
      ? `${notes} (Geschätzt aus ${weight}kg x ${reps} Wdh.)`
      : `Geschätzt aus ${weight}kg x ${reps} Wdh.`;

    await saveOneRM(userId, exerciseId, estimatedOneRM, true, noteText);

    return estimatedOneRM;
  } catch (error) {
    console.error("Fehler in estimateAndSaveOneRM:", error);
    throw error;
  }
}

// ============================================================================
// Export
// ============================================================================

export const oneRMService = {
  // Get current 1RM
  getCurrentOneRM,
  getAllCurrentOneRMs,

  // Save 1RM
  saveOneRM,
  estimateAndSaveOneRM,

  // Requirements
  getRequiredOneRMExercises,

  // Calculate working weight
  calculateWorkingWeight,

  // Check missing
  checkMissingOneRM,

  // Estimate
  estimateOneRMFromWorkout,
};
