/**
 * Training Service
 *
 * Handles all training-related operations including:
 * - Plan Management
 * - Template Discovery
 * - Plan Creation
 */

import { supabase } from "@/lib/supabase";
import {
  TrainingPlan,
  TrainingPlanDetails,
  PlanTemplate,
  TemplateDetails,
  FitnessLevel,
  PrimaryGoal,
  WorkoutSession,
  SessionExercise,
  NextWorkout,
  PlanWorkout,
  PlanExercise,
  TemplateWorkout,
  TemplateExercise,
  WorkoutSet,
  Exercise,
} from "@/types/training.types";

// ============================================================================
// Plan Management
// ============================================================================

/**
 * Lädt alle Trainingspläne eines Users (aktiv + inaktiv)
 *
 * @param userId - Die ID des Users
 * @returns Liste aller Trainingspläne mit Template-Informationen
 */
async function getTrainingPlans(userId: string): Promise<TrainingPlan[]> {
  try {
    const { data, error } = await supabase
      .from("training_plans")
      .select(
        `
        *,
        template:plan_templates(*)
      `
      )
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Fehler beim Laden der Trainingspläne:", error);
      throw new Error("Trainingspläne konnten nicht geladen werden");
    }

    return data || [];
  } catch (error) {
    console.error("Fehler in getTrainingPlans:", error);
    throw error;
  }
}

/**
 * Lädt einen spezifischen Trainingsplan mit allen Workouts und Exercises
 *
 * @param planId - Die ID des Trainingsplans
 * @returns Detaillierte Informationen zum Trainingsplan
 */
async function getTrainingPlanDetails(
  planId: string
): Promise<TrainingPlanDetails> {
  try {
    const { data, error } = await supabase
      .from("training_plans")
      .select(
        `
        *,
        template:plan_templates(*),
        workouts:plan_workouts(
          *,
          exercises:plan_exercises(
            *,
            exercise:exercises(*)
          )
        )
      `
      )
      .eq("id", planId)
      .single();

    if (error) {
      console.error("Fehler beim Laden der Plan-Details:", error);
      throw new Error("Trainingsplan-Details konnten nicht geladen werden");
    }

    if (!data) {
      throw new Error("Trainingsplan nicht gefunden");
    }

    // Sort workouts by day_number and exercises by exercise_order
    const sortedWorkouts = (data.workouts || [])
      .map((workout: any) => ({
        ...workout,
        exercises: (workout.exercises || []).sort(
          (a: PlanExercise, b: PlanExercise) => a.exercise_order - b.exercise_order
        ),
      }))
      .sort((a: any, b: any) => a.day_number - b.day_number);

    return {
      ...data,
      workouts: sortedWorkouts,
    };
  } catch (error) {
    console.error("Fehler in getTrainingPlanDetails:", error);
    throw error;
  }
}

/**
 * Setzt einen Plan als aktiv und deaktiviert automatisch alle anderen Pläne des Users
 *
 * @param userId - Die ID des Users
 * @param planId - Die ID des Plans, der aktiviert werden soll
 */
async function setActivePlan(userId: string, planId: string): Promise<void> {
  try {
    // Validiere dass der Plan dem User gehört
    const { data: plan, error: planError } = await supabase
      .from("training_plans")
      .select("id, user_id")
      .eq("id", planId)
      .eq("user_id", userId)
      .single();

    if (planError || !plan) {
      console.error("Fehler beim Validieren des Plans:", planError);
      throw new Error("Trainingsplan nicht gefunden oder keine Berechtigung");
    }

    // Deaktiviere alle anderen Pläne des Users
    const { error: deactivateError } = await supabase
      .from("training_plans")
      .update({ status: "inactive" })
      .eq("user_id", userId)
      .neq("id", planId);

    if (deactivateError) {
      console.error("Fehler beim Deaktivieren anderer Pläne:", deactivateError);
      throw new Error("Andere Pläne konnten nicht deaktiviert werden");
    }

    // Aktiviere den ausgewählten Plan
    const { error: activateError } = await supabase
      .from("training_plans")
      .update({ status: "active" })
      .eq("id", planId)
      .eq("user_id", userId);

    if (activateError) {
      console.error("Fehler beim Aktivieren des Plans:", activateError);
      throw new Error("Plan konnte nicht aktiviert werden");
    }
  } catch (error) {
    console.error("Fehler in setActivePlan:", error);
    throw error;
  }
}

/**
 * Löscht einen Trainingsplan
 * Hinweis: Durch CASCADE werden auch alle zugehörigen Workouts und Exercises gelöscht
 *
 * @param planId - Die ID des zu löschenden Plans
 */
async function deletePlan(planId: string): Promise<void> {
  try {
    const { error } = await supabase
      .from("training_plans")
      .delete()
      .eq("id", planId);

    if (error) {
      console.error("Fehler beim Löschen des Plans:", error);
      throw new Error("Trainingsplan konnte nicht gelöscht werden");
    }
  } catch (error) {
    console.error("Fehler in deletePlan:", error);
    throw error;
  }
}

// ============================================================================
// Template Discovery
// ============================================================================

/**
 * Sucht passende Templates basierend auf Fitness-Level, Trainingstagen und Ziel
 *
 * @param fitnessLevel - Fitness-Level des Users (beginner, intermediate, advanced)
 * @param daysPerWeek - Anzahl der Trainingstage pro Woche
 * @param primaryGoal - Optional: Primäres Trainingsziel (strength, hypertrophy, both)
 * @returns Liste passender Templates
 */
async function findMatchingTemplates(
  fitnessLevel: FitnessLevel,
  daysPerWeek: number,
  primaryGoal?: PrimaryGoal
): Promise<PlanTemplate[]> {
  try {
    let query = supabase
      .from("plan_templates")
      .select("*")
      .eq("fitness_level", fitnessLevel)
      .eq("days_per_week", daysPerWeek);

    // Optionaler Filter nach primärem Ziel
    if (primaryGoal) {
      query = query.eq("primary_goal", primaryGoal);
    }

    const { data, error } = await query.order("name");

    if (error) {
      console.error("Fehler beim Suchen nach Templates:", error);
      throw new Error("Templates konnten nicht gefunden werden");
    }

    return data || [];
  } catch (error) {
    console.error("Fehler in findMatchingTemplates:", error);
    throw error;
  }
}

/**
 * Lädt die Details eines Templates mit allen Workouts und Exercises für die Preview
 *
 * @param templateId - Die ID des Templates
 * @returns Detaillierte Template-Informationen
 */
async function getTemplateDetails(templateId: string): Promise<TemplateDetails> {
  try {
    const { data, error } = await supabase
      .from("plan_templates")
      .select(
        `
        *,
        workouts:template_workouts(
          *,
          exercises:template_exercises(
            *,
            exercise:exercises(*)
          )
        )
      `
      )
      .eq("id", templateId)
      .single();

    if (error) {
      console.error("Fehler beim Laden der Template-Details:", error);
      throw new Error("Template-Details konnten nicht geladen werden");
    }

    if (!data) {
      throw new Error("Template nicht gefunden");
    }

    // Sort workouts by day_number and exercises by exercise_order
    const sortedWorkouts = (data.workouts || [])
      .map((workout: any) => ({
        ...workout,
        exercises: (workout.exercises || []).sort(
          (a: TemplateExercise, b: TemplateExercise) => a.exercise_order - b.exercise_order
        ),
      }))
      .sort((a: any, b: any) => a.day_number - b.day_number);

    return {
      ...data,
      workouts: sortedWorkouts,
    };
  } catch (error) {
    console.error("Fehler in getTemplateDetails:", error);
    throw error;
  }
}

// ============================================================================
// Plan Creation
// ============================================================================

/**
 * Erstellt einen neuen User-Plan aus einem Template
 * Kopiert alle Workouts und Exercises aus dem Template in user-spezifische Tabellen
 *
 * @param userId - Die ID des Users
 * @param templateId - Die ID des zu verwendenden Templates
 * @param planName - Name des neuen Plans
 * @param startDate - Startdatum des Plans
 * @param isActive - Ob der Plan sofort aktiviert werden soll
 * @returns Die ID des neu erstellten Plans
 */
async function createPlanFromTemplate(
  userId: string,
  templateId: string,
  planName: string,
  startDate: Date,
  isActive: boolean
): Promise<string> {
  try {
    // 1. Template laden
    const template = await getTemplateDetails(templateId);

    // 2. Wenn isActive=true, deaktiviere alle anderen Pläne
    if (isActive) {
      const { error: deactivateError } = await supabase
        .from("training_plans")
        .update({ status: "inactive" })
        .eq("user_id", userId);

      if (deactivateError) {
        console.error("Fehler beim Deaktivieren alter Pläne:", deactivateError);
        throw new Error("Bestehende Pläne konnten nicht deaktiviert werden");
      }
    }

    // 3. Erstelle den Plan
    const { data: newPlan, error: planError } = await supabase
      .from("training_plans")
      .insert({
        user_id: userId,
        source_template_id: templateId,
        name: planName,
        plan_type: template.plan_type,
        days_per_week: template.days_per_week,
        status: isActive ? "active" : "inactive",
        start_date: startDate.toISOString(),
      })
      .select()
      .single();

    if (planError || !newPlan) {
      console.error("Fehler beim Erstellen des Plans:", planError);
      throw new Error("Plan konnte nicht erstellt werden");
    }

    // 4. Kopiere Workouts
    for (const templateWorkout of template.workouts) {
      const { data: newWorkout, error: workoutError } = await supabase
        .from("plan_workouts")
        .insert({
          plan_id: newPlan.id,
          source_template_workout_id: templateWorkout.id,
          name: templateWorkout.name,
          name_de: templateWorkout.name_de,
          day_number: templateWorkout.day_number,
          week_number: templateWorkout.week_number,
          focus: templateWorkout.focus,
        })
        .select()
        .single();

      if (workoutError || !newWorkout) {
        console.error("Fehler beim Erstellen des Workouts:", workoutError);
        throw new Error("Workout konnte nicht erstellt werden");
      }

      // 5. Kopiere Exercises für dieses Workout
      const exercisesToInsert = templateWorkout.exercises.map((exercise) => ({
        workout_id: newWorkout.id,
        exercise_id: exercise.exercise_id,
        exercise_order: exercise.exercise_order,
        sets: exercise.sets,
        reps_min: exercise.reps_min,
        reps_max: exercise.reps_max,
        rpe_target: exercise.rpe_target,
        rest_seconds: exercise.rest_seconds,
        is_optional: exercise.is_optional,
        can_substitute: exercise.can_substitute,
      }));

      const { error: exercisesError } = await supabase
        .from("plan_exercises")
        .insert(exercisesToInsert);

      if (exercisesError) {
        console.error("Fehler beim Erstellen der Exercises:", exercisesError);
        throw new Error("Exercises konnten nicht erstellt werden");
      }
    }

    return newPlan.id;
  } catch (error) {
    console.error("Fehler in createPlanFromTemplate:", error);
    throw error;
  }
}

// ============================================================================
// Workout Session Management
// ============================================================================

/**
 * Startet eine neue Workout Session
 * Prüft zuerst ob bereits eine aktive Session existiert
 *
 * @param userId - Die ID des Users
 * @param planId - Die ID des Trainingsplans
 * @param workoutId - Die ID des Workouts
 * @returns Die ID der neu erstellten Session
 * @throws Error wenn bereits eine aktive Session existiert
 */
async function startWorkoutSession(
  userId: string,
  planId: string,
  workoutId: string
): Promise<string> {
  try {
    // Prüfe ob bereits eine aktive Session existiert
    const activeSession = await getActiveSession(userId);

    if (activeSession) {
      throw new Error(
        "Es läuft bereits ein Workout. Bitte beende zuerst die aktive Session."
      );
    }

    // Erstelle neue Session
    const { data: newSession, error } = await supabase
      .from("workout_sessions")
      .insert({
        user_id: userId,
        plan_id: planId,
        plan_workout_id: workoutId,
        status: "in_progress",
        started_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error || !newSession) {
      console.error("Fehler beim Starten der Workout Session:", error);
      throw new Error("Workout Session konnte nicht gestartet werden");
    }

    return newSession.id;
  } catch (error) {
    console.error("Fehler in startWorkoutSession:", error);
    throw error;
  }
}

/**
 * Lädt die aktive Workout Session eines Users (falls vorhanden)
 *
 * @param userId - Die ID des Users
 * @returns Die aktive Session oder null
 */
async function getActiveSession(
  userId: string
): Promise<WorkoutSession | null> {
  try {
    const { data, error } = await supabase
      .from("workout_sessions")
      .select(
        `
        *,
        workout:plan_workouts(
          *,
          exercises:plan_exercises(
            *,
            exercise:exercises(*)
          )
        )
      `
      )
      .eq("user_id", userId)
      .eq("status", "in_progress")
      .order("started_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error("Fehler beim Laden der aktiven Session:", error);
      throw new Error("Aktive Session konnte nicht geladen werden");
    }

    return data;
  } catch (error) {
    console.error("Fehler in getActiveSession:", error);
    throw error;
  }
}

/**
 * Schließt eine Workout Session ab
 *
 * @param sessionId - Die ID der Session
 */
async function completeWorkoutSession(sessionId: string): Promise<void> {
  try {
    const { error } = await supabase
      .from("workout_sessions")
      .update({
        status: "completed",
        completed_at: new Date().toISOString(),
      })
      .eq("id", sessionId);

    if (error) {
      console.error("Fehler beim Abschließen der Session:", error);
      throw new Error("Session konnte nicht abgeschlossen werden");
    }
  } catch (error) {
    console.error("Fehler in completeWorkoutSession:", error);
    throw error;
  }
}

/**
 * Lädt alle Exercises einer Session mit bereits geloggten Sets
 *
 * @param sessionId - Die ID der Session
 * @returns Liste der Exercises mit completed_sets und is_completed Status
 */
async function getSessionExercises(
  sessionId: string
): Promise<SessionExercise[]> {
  try {
    // Lade Session mit Workout und Exercises
    const { data: session, error: sessionError } = await supabase
      .from("workout_sessions")
      .select(
        `
        *,
        workout:plan_workouts(
          *,
          exercises:plan_exercises(
            *,
            exercise:exercises(*)
          )
        )
      `
      )
      .eq("id", sessionId)
      .single();

    if (sessionError || !session || !session.workout) {
      console.error("Fehler beim Laden der Session:", sessionError);
      throw new Error("Session konnte nicht geladen werden");
    }

    // Lade bereits geloggte Sets
    const { data: sets, error: setsError } = await supabase
      .from("workout_sets")
      .select("*")
      .eq("session_id", sessionId)
      .order("exercise_id")
      .order("set_number");

    if (setsError) {
      console.error("Fehler beim Laden der Sets:", setsError);
      throw new Error("Sets konnten nicht geladen werden");
    }

    // Merge exercises mit completed_sets
    const sessionExercises: SessionExercise[] = (
      session.workout.exercises || []
    ).map((exercise: any): SessionExercise => {
      const completedSets = (sets || []).filter(
        (set: WorkoutSet) => set.exercise_id === exercise.exercise_id
      );

      const isCompleted = completedSets.length >= exercise.sets;

      return {
        ...exercise,
        completed_sets: completedSets,
        is_completed: isCompleted,
      };
    });

    // Sortiere nach exercise_order
    return sessionExercises.sort(
      (a, b) => a.exercise_order - b.exercise_order
    );
  } catch (error) {
    console.error("Fehler in getSessionExercises:", error);
    throw error;
  }
}

// ============================================================================
// Exercise Tracking
// ============================================================================

/**
 * Loggt einen einzelnen Set
 * Verwendet upsert für Updates bestehender Sets
 *
 * @param sessionId - Die ID der Session
 * @param exerciseId - Die ID der Exercise
 * @param setNumber - Nummer des Sets (1-basiert)
 * @param weight - Gewicht in kg
 * @param reps - Anzahl Wiederholungen
 * @param rpe - Optional: Rate of Perceived Exertion (1-10)
 */
async function logSet(
  sessionId: string,
  exerciseId: string,
  setNumber: number,
  weight: number,
  reps: number,
  rpe?: number
): Promise<void> {
  try {
    const { error } = await supabase.from("workout_sets").upsert(
      {
        session_id: sessionId,
        exercise_id: exerciseId,
        set_number: setNumber,
        weight_kg: weight,
        reps: reps,
        rpe: rpe,
      },
      {
        onConflict: "session_id,exercise_id,set_number",
      }
    );

    if (error) {
      console.error("Fehler beim Loggen des Sets:", error);
      throw new Error("Set konnte nicht gespeichert werden");
    }
  } catch (error) {
    console.error("Fehler in logSet:", error);
    throw error;
  }
}

/**
 * Fügt einen zusätzlichen Set zu einer Exercise hinzu
 * Berechnet automatisch die nächste Set-Nummer
 *
 * @param sessionId - Die ID der Session
 * @param exerciseId - Die ID der Exercise
 * @param weight - Gewicht in kg
 * @param reps - Anzahl Wiederholungen
 */
async function addExtraSet(
  sessionId: string,
  exerciseId: string,
  weight: number,
  reps: number
): Promise<void> {
  try {
    // Finde höchste Set-Nummer für diese Exercise
    const { data: existingSets, error: queryError } = await supabase
      .from("workout_sets")
      .select("set_number")
      .eq("session_id", sessionId)
      .eq("exercise_id", exerciseId)
      .order("set_number", { ascending: false })
      .limit(1);

    if (queryError) {
      console.error("Fehler beim Laden bestehender Sets:", queryError);
      throw new Error("Bestehende Sets konnten nicht geladen werden");
    }

    const nextSetNumber =
      existingSets && existingSets.length > 0
        ? existingSets[0].set_number + 1
        : 1;

    // Füge neuen Set hinzu
    const { error } = await supabase.from("workout_sets").insert({
      session_id: sessionId,
      exercise_id: exerciseId,
      set_number: nextSetNumber,
      weight_kg: weight,
      reps: reps,
    });

    if (error) {
      console.error("Fehler beim Hinzufügen des Extra-Sets:", error);
      throw new Error("Extra-Set konnte nicht hinzugefügt werden");
    }
  } catch (error) {
    console.error("Fehler in addExtraSet:", error);
    throw error;
  }
}

// ============================================================================
// Exercise Alternatives
// ============================================================================

/**
 * Lädt alternative Übungen für eine gegebene Exercise
 *
 * Versucht zuerst die exercise_alternatives Tabelle zu nutzen (falls vorhanden).
 * Falls nicht vorhanden oder keine Alternatives gefunden, filtert nach gleichem movement_pattern.
 *
 * @param exerciseId - Die ID der Exercise für die Alternativen gesucht werden
 * @returns Liste alternativer Exercises, sortiert nach Relevanz
 */
async function getExerciseAlternatives(
  exerciseId: string
): Promise<Exercise[]> {
  try {
    // Lade die ursprüngliche Exercise
    const { data: originalExercise, error: exerciseError } = await supabase
      .from("exercises")
      .select("*")
      .eq("id", exerciseId)
      .single();

    if (exerciseError || !originalExercise) {
      console.error("Fehler beim Laden der Exercise:", exerciseError);
      throw new Error("Exercise konnte nicht geladen werden");
    }

    // Versuche zuerst die exercise_alternatives Tabelle zu nutzen
    const { data: alternativesData, error: alternativesError } = await supabase
      .from("exercise_alternatives")
      .select(
        `
        alternative_exercise_id,
        similarity_score,
        alternative:exercises!exercise_alternatives_alternative_exercise_id_fkey(*)
      `
      )
      .eq("exercise_id", exerciseId)
      .order("similarity_score", { ascending: false });

    // Wenn exercise_alternatives Tabelle existiert und Daten enthält
    if (!alternativesError && alternativesData && alternativesData.length > 0) {
      const validAlternatives = alternativesData
        .filter((item: any) => item.alternative)
        .map((item: any) => item.alternative) as Exercise[];
      return validAlternatives;
    }

    // Fallback: Filter nach gleichem movement_pattern
    const { data: patternAlternatives, error: patternError } = await supabase
      .from("exercises")
      .select("*")
      .eq("movement_pattern", originalExercise.movement_pattern)
      .neq("id", exerciseId) // Exclude original exercise
      .limit(10);

    if (patternError) {
      console.error("Fehler beim Laden der Pattern Alternatives:", patternError);
      return [];
    }

    return patternAlternatives || [];
  } catch (error) {
    console.error("Fehler in getExerciseAlternatives:", error);
    throw error;
  }
}

// ============================================================================
// Next Workout & Planning
// ============================================================================

/**
 * Lädt das nächste geplante Workout für einen User
 * Basiert auf dem aktiven Plan und bereits absolvierten Workouts
 *
 * @param userId - Die ID des Users
 * @returns Das nächste Workout oder null wenn kein aktiver Plan existiert
 */
async function getNextWorkout(userId: string): Promise<NextWorkout | null> {
  try {
    // Lade aktiven Plan
    const { data: activePlan, error: planError } = await supabase
      .from("training_plans")
      .select(
        `
        *,
        workouts:plan_workouts(
          *,
          exercises:plan_exercises(
            *,
            exercise:exercises(*)
          )
        )
      `
      )
      .eq("user_id", userId)
      .eq("status", "active")
      .single();

    if (planError || !activePlan) {
      return null; // Kein aktiver Plan
    }

    // Sortiere Workouts nach day_number
    const sortedWorkouts = (activePlan.workouts || []).sort(
      (a: any, b: any) => a.day_number - b.day_number
    );

    if (sortedWorkouts.length === 0) {
      return null;
    }

    // Lade zuletzt abgeschlossenes Workout
    const { data: lastSession, error: sessionError } = await supabase
      .from("workout_sessions")
      .select("plan_workout_id, completed_at")
      .eq("user_id", userId)
      .eq("plan_id", activePlan.id)
      .eq("status", "completed")
      .order("completed_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (sessionError) {
      console.error("Fehler beim Laden der letzten Session:", sessionError);
    }

    let nextWorkout: PlanWorkout;

    if (!lastSession) {
      // Noch kein Workout absolviert → erstes Workout des Plans
      nextWorkout = sortedWorkouts[0];
    } else {
      // Finde das nächste Workout nach dem letzten
      const lastWorkoutIndex = sortedWorkouts.findIndex(
        (w: any) => w.id === lastSession.plan_workout_id
      );

      if (lastWorkoutIndex === -1 || lastWorkoutIndex >= sortedWorkouts.length - 1) {
        // Letztes Workout war das letzte im Plan → fange von vorne an
        nextWorkout = sortedWorkouts[0];
      } else {
        // Nächstes Workout in der Reihenfolge
        nextWorkout = sortedWorkouts[lastWorkoutIndex + 1];
      }
    }

    return {
      workout: nextWorkout,
      plan: activePlan,
    };
  } catch (error) {
    console.error("Fehler in getNextWorkout:", error);
    throw error;
  }
}

/**
 * Lädt die kommenden Workouts eines Plans
 * Nützlich für die Trainingsplan-Detailansicht
 *
 * @param planId - Die ID des Plans
 * @param limit - Maximale Anzahl der Workouts (Standard: 7)
 * @returns Liste der kommenden Workouts
 */
async function getUpcomingWorkouts(
  planId: string,
  limit: number = 7
): Promise<PlanWorkout[]> {
  try {
    const { data: workouts, error } = await supabase
      .from("plan_workouts")
      .select(
        `
        *,
        exercises:plan_exercises(
          *,
          exercise:exercises(*)
        )
      `
      )
      .eq("plan_id", planId)
      .order("day_number")
      .order("week_number")
      .limit(limit);

    if (error) {
      console.error("Fehler beim Laden der kommenden Workouts:", error);
      throw new Error("Kommende Workouts konnten nicht geladen werden");
    }

    // Sortiere Exercises innerhalb jedes Workouts
    return (workouts || []).map((workout: any): PlanWorkout => ({
      ...workout,
      exercises: (workout.exercises || []).sort(
        (a: PlanExercise, b: PlanExercise) => a.exercise_order - b.exercise_order
      ),
    }));
  } catch (error) {
    console.error("Fehler in getUpcomingWorkouts:", error);
    throw error;
  }
}

// ============================================================================
// Export
// ============================================================================

export const trainingService = {
  // Plan Management
  getTrainingPlans,
  getTrainingPlanDetails,
  setActivePlan,
  deletePlan,

  // Template Discovery
  findMatchingTemplates,
  getTemplateDetails,

  // Plan Creation
  createPlanFromTemplate,

  // Workout Session Management
  startWorkoutSession,
  getActiveSession,
  completeWorkoutSession,
  getSessionExercises,

  // Exercise Tracking
  logSet,
  addExtraSet,

  // Exercise Alternatives
  getExerciseAlternatives,

  // Next Workout
  getNextWorkout,
  getUpcomingWorkouts,
};
