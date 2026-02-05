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
import {
  scorePlanTemplate,
  getTopRecommendations,
  getBestRecommendation,
  type UserProfile,
  type PlanRecommendation
} from "@/utils/planRecommendationScoring";
import { getProfile } from "@/services/profile.service";

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

    // Sort workouts by day_number and exercises by order_in_workout
    const sortedWorkouts = (data.workouts || [])
      .map((workout: any) => ({
        ...workout,
        exercises: (workout.exercises || []).sort(
          (a: PlanExercise, b: PlanExercise) => a.order_in_workout - b.order_in_workout
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

    // Lösche unterbrochene/aktive Workouts aus anderen Plänen
    // Dies verhindert den Fehler "Du hast ein unterbrochenes Workout" beim Planwechsel
    const { error: deleteSessionsError } = await supabase
      .from("workout_sessions")
      .delete()
      .eq("user_id", userId)
      .neq("plan_id", planId)
      .in("status", ["paused", "in_progress"]);

    if (deleteSessionsError) {
      console.error("Fehler beim Löschen unterbrochener Workouts:", deleteSessionsError);
      // Kein throw - wir versuchen trotzdem fortzufahren
    }

    // Deaktiviere alle anderen Pläne des Users
    const { error: deactivateError } = await supabase
      .from("training_plans")
      .update({ status: "paused" as const })
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
    // Try to load from plan_templates first (male plans)
    const { data: templateData, error: templateError } = await supabase
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

    // If found in plan_templates, return it
    if (templateData && !templateError) {
      const sortedWorkouts = (templateData.workouts || [])
        .map((workout: any) => ({
          ...workout,
          exercises: (workout.exercises || []).sort(
            (a: TemplateExercise, b: TemplateExercise) => a.order_in_workout - b.order_in_workout
          ),
        }))
        .sort((a: any, b: any) => a.day_number - b.day_number);

      return {
        ...templateData,
        workouts: sortedWorkouts,
      };
    }

    // If not found in plan_templates, try training_plans (women's plans)
    const { data: trainingPlanData, error: trainingPlanError } = await supabase
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
      .eq("id", templateId)
      .eq("is_template", true)
      .single();

    if (trainingPlanError || !trainingPlanData) {
      console.error("Fehler beim Laden der Template-Details:", trainingPlanError || templateError);
      throw new Error("Template-Details konnten nicht geladen werden");
    }

    // Check if template has workouts configured
    if (!trainingPlanData.workouts || trainingPlanData.workouts.length === 0) {
      console.warn("Template has no workouts configured:", templateId);
      throw new Error("Dieser Trainingsplan ist noch in Entwicklung und hat noch keine konfigurierten Workouts. Bitte wähle einen anderen Plan.");
    }

    // Sort workouts by day_number and exercises by order_in_workout
    const sortedWorkouts = (trainingPlanData.workouts || [])
      .map((workout: any) => ({
        ...workout,
        exercises: (workout.exercises || []).sort(
          (a: TemplateExercise, b: TemplateExercise) => a.order_in_workout - b.order_in_workout
        ),
      }))
      .sort((a: any, b: any) => a.day_number - b.day_number);

    return {
      ...trainingPlanData,
      workouts: sortedWorkouts,
      isWomenTemplate: true, // Flag to indicate this is from training_plans, not plan_templates
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
        .update({ status: "paused" as const })
        .eq("user_id", userId);

      if (deactivateError) {
        console.error("Fehler beim Deaktivieren alter Pläne:", deactivateError);
        throw new Error("Bestehende Pläne konnten nicht deaktiviert werden");
      }
    }

    // 3. Erstelle den Plan
    // Use template_id for women's plans (from training_plans), source_template_id for men's plans (from plan_templates)
    const templateReference = template.isWomenTemplate
      ? { template_id: templateId }
      : { source_template_id: templateId };

    const { data: newPlan, error: planError } = await supabase
      .from("training_plans")
      .insert({
        user_id: userId,
        ...templateReference,
        name: planName,
        plan_type: template.plan_type,
        days_per_week: template.days_per_week,
        status: isActive ? "active" : "paused",
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
      // For women's templates, don't set source_template_workout_id (it references template_workouts which is for men's plans)
      const workoutData: any = {
        plan_id: newPlan.id,
        name: templateWorkout.name_de || templateWorkout.name,
        day_number: templateWorkout.day_number,
        week_number: templateWorkout.week_number,
        order_in_week: templateWorkout.order_in_week,
        focus: templateWorkout.focus,
      };

      // Only set source_template_workout_id for men's plans (from template_workouts)
      if (!template.isWomenTemplate) {
        workoutData.source_template_workout_id = templateWorkout.id;
      }

      const { data: newWorkout, error: workoutError } = await supabase
        .from("plan_workouts")
        .insert(workoutData)
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
        order_in_workout: exercise.order_in_workout,
        sets: exercise.sets,
        reps_min: exercise.reps_min,
        reps_max: exercise.reps_max,
        rir_target: exercise.rir_target,
        rest_seconds: exercise.rest_seconds,
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

/**
 * Erstellt einen dynamischen Trainingsplan mit 1RM-basierten Gewichtsberechnungen
 *
 * Diese Funktion:
 * 1. Validiert dass alle benötigten 1RM-Werte vorhanden sind
 * 2. Erstellt den Trainingsplan mit tm_percentage aus dem Template
 * 3. Ruft initialize_dynamic_plan RPC auf um user_current_1rm Einträge zu erstellen
 * 4. Kopiert Workouts und Exercises aus dem Template
 *
 * @param userId - Die ID des Users
 * @param templateId - Die ID des dynamischen Templates
 * @param oneRMValues - Map von exercise_id -> weight_kg
 * @param planName - Name des neuen Plans
 * @param startDate - Startdatum des Plans
 * @param isActive - Ob der Plan sofort aktiviert werden soll
 * @returns Die ID des neu erstellten Plans
 * @throws Error wenn 1RM-Werte fehlen oder Plan-Erstellung fehlschlägt
 */
async function createDynamicPlan(
  userId: string,
  templateId: string,
  oneRMValues: Record<string, number>,
  planName: string,
  startDate: Date,
  isActive: boolean
): Promise<string> {
  try {
    // 1. Template laden
    const template = await getTemplateDetails(templateId);

    // Validiere dass Template dynamisch ist
    if (!template.is_dynamic) {
      throw new Error("Template ist nicht als dynamisch markiert");
    }

    // 2. Validiere dass alle benötigten 1RM-Werte vorhanden sind
    const requiredExercises = template.requires_1rm_for_exercises || [];
    const missingExercises = requiredExercises.filter(
      (exerciseId) => !oneRMValues[exerciseId] || oneRMValues[exerciseId] <= 0
    );

    if (missingExercises.length > 0) {
      throw new Error(
        `Fehlende 1RM-Werte für Exercises: ${missingExercises.join(", ")}`
      );
    }

    // 3. Wenn isActive=true, deaktiviere alle anderen Pläne
    if (isActive) {
      const { error: deactivateError } = await supabase
        .from("training_plans")
        .update({ status: "paused" as const })
        .eq("user_id", userId);

      if (deactivateError) {
        console.error("Fehler beim Deaktivieren alter Pläne:", deactivateError);
        throw new Error("Bestehende Pläne konnten nicht deaktiviert werden");
      }
    }

    // 4. Erstelle den Plan mit tm_percentage
    const { data: newPlan, error: planError } = await supabase
      .from("training_plans")
      .insert({
        user_id: userId,
        source_template_id: templateId,
        name: planName,
        plan_type: template.plan_type,
        days_per_week: template.days_per_week,
        status: isActive ? "active" : "paused",
        start_date: startDate.toISOString(),
        tm_percentage: template.tm_percentage || 100, // Default to 100% if not specified
      })
      .select()
      .single();

    if (planError || !newPlan) {
      console.error("Fehler beim Erstellen des Plans:", planError);
      throw new Error("Plan konnte nicht erstellt werden");
    }

    try {
      // 5. Initialisiere dynamische 1RM-Werte via RPC
      const exerciseIds = Object.keys(oneRMValues);

      const { error: rpcError } = await supabase.rpc("initialize_dynamic_plan", {
        p_plan_id: newPlan.id,
        p_user_id: userId,
        p_exercise_ids: exerciseIds,
      });

      if (rpcError) {
        console.error("Fehler beim Initialisieren dynamischer Plan:", rpcError);
        throw new Error(
          "Dynamische Plan-Initialisierung fehlgeschlagen: " + rpcError.message
        );
      }

      // 6. Kopiere Workouts
      for (const templateWorkout of template.workouts) {
        const { data: newWorkout, error: workoutError } = await supabase
          .from("plan_workouts")
          .insert({
            plan_id: newPlan.id,
            source_template_workout_id: templateWorkout.id,
            name: templateWorkout.name_de || templateWorkout.name,
            day_number: templateWorkout.day_number,
            week_number: templateWorkout.week_number,
            order_in_week: templateWorkout.order_in_week,
            focus: templateWorkout.focus,
          })
          .select()
          .single();

        if (workoutError || !newWorkout) {
          console.error("Fehler beim Erstellen des Workouts:", workoutError);
          throw new Error("Workout konnte nicht erstellt werden");
        }

        // 7. Kopiere Exercises für dieses Workout
        // Für dynamische Pläne kopieren wir percentage_1rm UND set_configurations aus dem Template
        const exercisesToInsert = templateWorkout.exercises.map((exercise) => ({
          workout_id: newWorkout.id,
          exercise_id: exercise.exercise_id,
          order_in_workout: exercise.order_in_workout,
          sets: exercise.sets,
          reps_min: exercise.reps_min,
          reps_max: exercise.reps_max,
          rir_target: exercise.rir_target,
          rest_seconds: exercise.rest_seconds,
          percentage_1rm: exercise.percentage_1rm, // Wichtig für dynamische Pläne!
          set_configurations: exercise.set_configurations, // Wichtig für Wendler 5/3/1 und detaillierte Satz-Prozente!
          notes: exercise.notes, // Kopiere auch die Notes mit den Beschreibungen
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
    } catch (initError) {
      // Rollback: Lösche den erstellten Plan bei Fehlern
      console.error("Fehler bei Plan-Initialisierung, führe Rollback durch:", initError);

      const { error: deleteError } = await supabase
        .from("training_plans")
        .delete()
        .eq("id", newPlan.id);

      if (deleteError) {
        console.error("Fehler beim Rollback (Plan löschen):", deleteError);
      }

      throw initError;
    }
  } catch (error) {
    console.error("Fehler in createDynamicPlan:", error);
    throw error;
  }
}

// ============================================================================
// Workout Session Management
// ============================================================================

/**
 * Startet eine neue Workout Session
 * Prüft zuerst ob bereits eine aktive oder pausierte Session existiert
 *
 * @param userId - Die ID des Users
 * @param planId - Die ID des Trainingsplans
 * @param workoutId - Die ID des Workouts
 * @returns Die ID der neu erstellten Session
 * @throws Error wenn bereits eine aktive oder pausierte Session existiert
 */
async function startWorkoutSession(
  userId: string,
  planId: string,
  workoutId: string
): Promise<string> {
  try {
    // Lösche unterbrochene/aktive Workouts aus ANDEREN Plänen
    // Dies stellt sicher, dass beim Planwechsel keine alten Sessions blockieren
    await supabase
      .from("workout_sessions")
      .delete()
      .eq("user_id", userId)
      .neq("plan_id", planId)
      .in("status", ["paused", "in_progress"]);

    // Prüfe beide Stati in einer Query (effizienter) - nur für aktuellen Plan
    const { data: existingSessions, error: checkError } = await supabase
      .from("workout_sessions")
      .select("id, status")
      .eq("user_id", userId)
      .eq("plan_id", planId)
      .in("status", ["in_progress", "paused"])
      .order("start_time", { ascending: false })
      .limit(1);

    if (checkError) {
      console.error("Fehler beim Prüfen auf existierende Sessions:", checkError);
    }

    if (existingSessions && existingSessions.length > 0) {
      const existingSession = existingSessions[0];

      if (existingSession.status === "in_progress") {
        throw new Error(
          "Es läuft bereits ein Workout. Bitte beende zuerst die aktive Session."
        );
      }

      if (existingSession.status === "paused") {
        throw new Error(
          "Du hast ein unterbrochenes Workout. Bitte setze es fort oder breche es ab."
        );
      }
    }

    // Erstelle neue Session
    const { data: newSession, error } = await supabase
      .from("workout_sessions")
      .insert({
        user_id: userId,
        plan_id: planId,
        plan_workout_id: workoutId,
        status: "in_progress",
        start_time: new Date().toISOString(),
        date: new Date().toISOString().split('T')[0],
      })
      .select()
      .single();

    if (error || !newSession) {
      console.error("Fehler beim Starten der Workout Session:", error);
      throw new Error("Workout Session konnte nicht gestartet werden");
    }

    return newSession.id;
  } catch (error) {
    // Don't log expected errors (active/paused workout exists) - they are handled in UI
    const errorMessage = error instanceof Error ? error.message : "";
    const isExpectedError = errorMessage.includes("bereits ein Workout") ||
                            errorMessage.includes("unterbrochenes Workout");
    if (!isExpectedError) {
      console.error("Fehler in startWorkoutSession:", error);
    }
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
      .order("start_time", { ascending: false })
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
 * Bei Custom-Plänen wird automatisch geprüft, ob alle Workouts der Woche absolviert wurden
 * und ggf. die Woche hochgezählt
 *
 * @param sessionId - Die ID der Session
 */
async function completeWorkoutSession(sessionId: string): Promise<void> {
  try {
    // Lade Session-Details um Plan-ID und aktuelles Datum zu bekommen
    const { data: session, error: sessionError } = await supabase
      .from("workout_sessions")
      .select("id, plan_id, plan_workout_id, user_id, date")
      .eq("id", sessionId)
      .single();

    if (sessionError || !session) {
      console.error("Fehler beim Laden der Session:", sessionError);
      throw new Error("Session konnte nicht geladen werden");
    }

    // Aktuelles Datum (heute)
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    const workoutDate = session.date;

    // Prüfe ob das Workout verspätet abgeschlossen wird
    const shouldUpdateDate = today > workoutDate;

    // Schließe die Session ab und aktualisiere ggf. das Datum
    const updateData: any = {
      status: "completed",
      end_time: new Date().toISOString(),
    };

    // Wenn das heutige Datum neuer ist als das Workout-Datum, aktualisiere es
    if (shouldUpdateDate) {
      updateData.date = today;
      console.log(`Workout-Datum aktualisiert von ${workoutDate} auf ${today}`);
    }

    const { error } = await supabase
      .from("workout_sessions")
      .update(updateData)
      .eq("id", sessionId);

    if (error) {
      console.error("Fehler beim Abschließen der Session:", error);
      throw new Error("Session konnte nicht abgeschlossen werden");
    }

    // Prüfe ob es ein Custom-Plan ist und aktualisiere ggf. die Woche
    if (session.plan_id) {
      await checkAndUpdateCustomPlanWeek(session.user_id, session.plan_id);
    }
  } catch (error) {
    console.error("Fehler in completeWorkoutSession:", error);
    throw error;
  }
}

/**
 * Prüft ob alle Workouts der aktuellen Woche für einen Custom-Plan absolviert wurden
 * und erhöht ggf. current_week um 1
 *
 * Diese Funktion wird nach jedem abgeschlossenen Workout für Custom-Pläne aufgerufen.
 *
 * @param userId - Die ID des Users
 * @param planId - Die ID des Plans
 */
async function checkAndUpdateCustomPlanWeek(
  userId: string,
  planId: string
): Promise<void> {
  try {
    // Lade Plan-Details
    const { data: plan, error: planError } = await supabase
      .from("training_plans")
      .select("id, plan_type, days_per_week, current_week")
      .eq("id", planId)
      .single();

    if (planError || !plan) {
      console.error("Fehler beim Laden des Plans:", planError);
      return; // Silent fail - wichtiger ist dass das Workout gespeichert wurde
    }

    // Nur für Custom-Pläne
    if (plan.plan_type !== "custom") {
      return;
    }

    // Lade alle Workouts des Plans
    const { data: allWorkouts, error: workoutsError } = await supabase
      .from("plan_workouts")
      .select("id")
      .eq("plan_id", planId);

    if (workoutsError || !allWorkouts) {
      console.error("Fehler beim Laden der Workouts:", workoutsError);
      return;
    }

    const totalWorkoutsInPlan = allWorkouts.length;

    // Berechne wie viele Wochen basierend auf abgeschlossenen Zyklen abgeschlossen wurden
    // Ein Zyklus = alle N verschiedenen Workouts wurden mindestens einmal absolviert
    const { data: allCompletedSessions, error: sessionsError } = await supabase
      .from("workout_sessions")
      .select("id, plan_workout_id, end_time")
      .eq("user_id", userId)
      .eq("plan_id", planId)
      .eq("status", "completed")
      .order("end_time", { ascending: true }); // Chronologisch von alt nach neu

    if (sessionsError) {
      console.error("Fehler beim Laden der Sessions:", sessionsError);
      return;
    }

    if (!allCompletedSessions || allCompletedSessions.length === 0) {
      return;
    }

    // Zähle wie viele vollständige "Wochen" (Zyklen) absolviert wurden
    // Ein Zyklus ist abgeschlossen, wenn alle N unterschiedlichen Workouts gemacht wurden
    let completedCycles = 0;
    let currentCycleWorkouts = new Set<string>();

    for (const session of allCompletedSessions) {
      currentCycleWorkouts.add(session.plan_workout_id);

      // Wenn wir alle verschiedenen Workouts gesehen haben
      if (currentCycleWorkouts.size === totalWorkoutsInPlan) {
        completedCycles++;
        currentCycleWorkouts.clear(); // Neuer Zyklus beginnt
      }
    }

    // Die Wochenzahl sollte completedCycles + 1 sein (aktueller unvollständiger Zyklus)
    const calculatedWeek = completedCycles + 1;

    // Nur updaten wenn sich die Woche geändert hat
    if (calculatedWeek !== (plan.current_week || 1)) {
      console.log(
        `[checkAndUpdateCustomPlanWeek] Aktualisiere Woche von ${plan.current_week || 1} auf ${calculatedWeek}`
      );

      const { error: updateError } = await supabase
        .from("training_plans")
        .update({
          current_week: calculatedWeek,
        })
        .eq("id", planId);

      if (updateError) {
        console.error("Fehler beim Aktualisieren der Woche:", updateError);
      }
    }
  } catch (error) {
    console.error("Fehler in checkAndUpdateCustomPlanWeek:", error);
    // Silent fail - wichtiger ist dass das Workout gespeichert wurde
  }
}

/**
 * Pausiert eine Workout Session
 * Wird aufgerufen wenn der User den Screen verlässt
 *
 * @param sessionId - Die ID der Session
 */
async function pauseWorkoutSession(sessionId: string): Promise<void> {
  try {
    // Erst Session laden um Status zu prüfen
    const { data: session, error: fetchError } = await supabase
      .from("workout_sessions")
      .select("status")
      .eq("id", sessionId)
      .single();

    if (fetchError) {
      console.error("Fehler beim Laden der Session:", fetchError);
      throw new Error("Session konnte nicht geladen werden");
    }

    // Nur pausieren wenn Status "in_progress" ist
    if (session.status !== "in_progress") {
      console.log(`Session ist bereits ${session.status}, überspringe Pause`);
      return;
    }

    const { error } = await supabase
      .from("workout_sessions")
      .update({
        status: "paused",
      })
      .eq("id", sessionId)
      .eq("status", "in_progress"); // Nur pausieren wenn noch in_progress

    if (error) {
      console.error("Fehler beim Pausieren der Session:", error);
      throw new Error("Session konnte nicht pausiert werden");
    }
  } catch (error) {
    console.error("Fehler in pauseWorkoutSession:", error);
    throw error;
  }
}

/**
 * Setzt eine pausierte Session fort
 *
 * @param sessionId - Die ID der Session
 */
async function resumeWorkoutSession(sessionId: string): Promise<void> {
  try {
    const { error } = await supabase
      .from("workout_sessions")
      .update({
        status: "in_progress",
      })
      .eq("id", sessionId);

    if (error) {
      console.error("Fehler beim Fortsetzen der Session:", error);
      throw new Error("Session konnte nicht fortgesetzt werden");
    }
  } catch (error) {
    console.error("Fehler in resumeWorkoutSession:", error);
    throw error;
  }
}

/**
 * Lädt eine pausierte Workout Session eines Users (falls vorhanden)
 *
 * @param userId - Die ID des Users
 * @returns Die pausierte Session oder null
 */
async function getPausedSession(
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
      .eq("status", "paused")
      .order("start_time", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) {
      console.error("Fehler beim Laden der pausierten Session:", error);
      throw new Error("Pausierte Session konnte nicht geladen werden");
    }

    return data;
  } catch (error) {
    console.error("Fehler in getPausedSession:", error);
    throw error;
  }
}

/**
 * Bricht eine Session ab und setzt den Status auf "skipped"
 *
 * @param sessionId - Die ID der Session
 */
async function cancelWorkoutSession(sessionId: string): Promise<void> {
  try {
    const { error } = await supabase
      .from("workout_sessions")
      .update({
        status: "skipped",
        end_time: new Date().toISOString(),
      })
      .eq("id", sessionId);

    if (error) {
      console.error("Fehler beim Abbrechen der Session:", error);
      throw new Error("Session konnte nicht abgebrochen werden");
    }
  } catch (error) {
    console.error("Fehler in cancelWorkoutSession:", error);
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

    // Sortiere nach order_in_workout
    return sessionExercises.sort(
      (a, b) => a.order_in_workout - b.order_in_workout
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
 * @param rir - Optional: Reps in Reserve (0-5)
 */
async function logSet(
  sessionId: string,
  exerciseId: string,
  setNumber: number,
  weight: number,
  reps: number,
  rir?: number
): Promise<void> {
  try {
    // Convert undefined to null for database compatibility
    // Ensure rir is null if undefined or invalid
    const rirValue = rir !== undefined && rir !== null && !isNaN(rir) ? rir : null;

    const { error } = await supabase.from("workout_sets").upsert(
      {
        session_id: sessionId,
        exercise_id: exerciseId,
        set_number: setNumber,
        weight: weight,
        reps: reps,
        rir: rirValue,
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
      weight: weight,
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
// Plan Recommendations (Scoring System)
// ============================================================================

/**
 * Simple in-memory cache for plan templates
 * Reduces DB queries for frequently accessed templates
 */
interface TemplateCache {
  data: PlanTemplate[] | null;
  timestamp: number;
}

const templateCache: TemplateCache = {
  data: null,
  timestamp: 0,
};

const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Invalidates the template cache
 * Should be called when templates are added, updated, or deleted
 */
export function invalidateTemplateCache(): void {
  console.log('[TemplateCache] Cache invalidated');
  templateCache.data = null;
  templateCache.timestamp = 0;
}

/**
 * Lädt Plan-Empfehlungen für einen User basierend auf seinem Profil
 *
 * OPTIMIZED VERSION - Uses pre-computed DB fields and minimal SELECT
 *
 * Verwendet das Scoring-System um die am besten passenden Templates zu finden.
 * Berücksichtigt Fitness-Level, Trainingstage, Trainingserfahrung und Ziel.
 *
 * @param userId - Die ID des Users
 * @param limit - Maximale Anzahl der Empfehlungen (Standard: 3)
 * @returns Liste der top Empfehlungen mit Scores
 */
async function getRecommendations(
  userId: string,
  limit: number = 3
): Promise<PlanRecommendation[]> {
  const startTime = Date.now();

  try {
    // 1. Lade User-Profil
    const profileStart = Date.now();
    const { profile, error: profileError } = await getProfile(userId);
    if (profileError || !profile) {
      throw new Error('Profil konnte nicht geladen werden');
    }
    const profileDuration = Date.now() - profileStart;

    // Check if user is female - if so, use women's training plan system
    if (profile.gender === 'female') {
      console.log('[getRecommendations] User is female, using women training plan system');

      // Import and use women's training plan service
      const { getTopWomenPlanRecommendations } = await import('./womenTrainingPlanService');

      // Derive equipment from training location and home equipment
      let equipment: string[] = [];
      if (profile.training_location === 'gym' || profile.training_location === 'both') {
        // User has gym access - assume full gym equipment
        equipment = ['freie_gewichte', 'maschinen', 'langhantel', 'kurzhanteln', 'kabelzug'];
      } else if (profile.training_location === 'home') {
        // Use home equipment from profile
        equipment = profile.home_equipment || [];
      }

      const womenData = {
        training_goals: profile.training_goals || [],
        training_experience_months: profile.training_experience_months || 0,
        available_training_days: profile.available_training_days || 3,
        cardio_per_week: profile.cardio_per_week || 0,
        training_location: profile.training_location || 'gym',
        equipment,
        load_preference: profile.load_preference || undefined,
        split_preference: profile.split_preference || undefined,
        fitness_level: profile.fitness_level || 'beginner',
      };

      const womenPlans = await getTopWomenPlanRecommendations(womenData, limit);

      // Plans are already limited by the function
      const limitedWomenPlans = womenPlans;

      // Convert ScoredPlan[] to PlanRecommendation[] format
      const recommendations: PlanRecommendation[] = limitedWomenPlans.map((scoredPlan) => ({
        template: {
          id: scoredPlan.plan.id,
          name: scoredPlan.plan.name,
          name_de: scoredPlan.plan.name,
          plan_type: scoredPlan.plan.training_split || 'custom',
          fitness_level: scoredPlan.plan.fitness_level || 'beginner',
          days_per_week: scoredPlan.plan.days_per_week || 3,
          primary_goal: 'hypertrophy' as const, // Women plans focus on hypertrophy/bodyforming
          description: scoredPlan.plan.description,
          description_de: scoredPlan.plan.description,
          completion_status: 'complete' as const,
          target_gender: 'female' as const,
        },
        totalScore: scoredPlan.score,
        breakdown: {
          experienceScore: scoredPlan.matchDetails.levelMatch,
          frequencyScore: scoredPlan.matchDetails.frequencyMatch,
          goalScore: scoredPlan.matchDetails.goalsMatch,
          volumeScore: scoredPlan.matchDetails.otherMatch,
        },
        completeness: 'complete' as const,
        recommendation: scoredPlan.score >= 80 ? 'optimal' : scoredPlan.score >= 60 ? 'good' : 'acceptable',
        reasoning: [
          `Ziele: ${Math.round(scoredPlan.matchDetails.goalsMatch)}%`,
          `Level: ${Math.round(scoredPlan.matchDetails.levelMatch)}%`,
          `Frequenz: ${Math.round(scoredPlan.matchDetails.frequencyMatch)}%`,
          `Equipment: ${Math.round(scoredPlan.matchDetails.equipmentMatch)}%`,
        ],
      }));

      return recommendations;
    }

    // 2. For male/other users: Check cache first
    let templates: PlanTemplate[];
    let queryDuration = 0;
    const now = Date.now();

    // Determine target gender for filtering
    const targetGender = profile.gender === 'male' ? 'male' : 'male'; // Default to male for 'other' as well

    if (
      templateCache.data &&
      now - templateCache.timestamp < CACHE_DURATION
    ) {
      console.log('[getRecommendations] Using cached templates', {
        age: `${Math.round((now - templateCache.timestamp) / 1000)}s`,
        count: templateCache.data.length,
      });
      templates = templateCache.data;

      // Filter by target gender
      templates = templates.filter(t => t.target_gender === targetGender);
    } else {
      // OPTIMIZED QUERY - fetch only what we need with new computed fields + gender filter
      const queryStart = Date.now();
      const { data: fetchedTemplates, error: templatesError } = await supabase
        .from('plan_templates')
        .select(`
          id,
          name,
          name_de,
          description,
          description_de,
          plan_type,
          fitness_level,
          days_per_week,
          duration_weeks,
          primary_goal,
          min_training_experience_months,
          estimated_sets_per_week,
          exercises_per_workout,
          completion_status,
          is_dynamic,
          requires_1rm_for_exercises,
          tm_percentage,
          target_gender
        `)
        .eq('is_active', true)
        .eq('target_gender', targetGender)
        .order('completion_status', { ascending: false }) // Complete programs first
        .order('popularity_score', { ascending: false });

      queryDuration = Date.now() - queryStart;

      if (templatesError) {
        console.error('Fehler beim Laden der Templates:', templatesError);
        throw new Error('Templates konnten nicht geladen werden');
      }

      if (!fetchedTemplates || fetchedTemplates.length === 0) {
        console.log('[getRecommendations] No templates found');
        return [];
      }

      // Update cache
      templateCache.data = fetchedTemplates;
      templateCache.timestamp = now;
      templates = fetchedTemplates;

      console.log('[getRecommendations] Templates fetched and cached', {
        count: templates.length,
        duration: `${queryDuration}ms`,
        targetGender,
      });
    }

    // 3. Erstelle UserProfile für Scoring
    // Map profile.primary_goal zu scoring system goals
    let mappedGoal: UserProfile['primary_goal'] = 'general_fitness';
    if (profile.primary_goal === 'strength' ||
        profile.primary_goal === 'hypertrophy' ||
        profile.primary_goal === 'general_fitness') {
      mappedGoal = profile.primary_goal;
    }
    // Map 'endurance' und 'weight_loss' zu 'general_fitness'
    // Map 'both' goals werden als 'general_fitness' behandelt

    const userProfile: UserProfile = {
      fitness_level: profile.fitness_level || 'beginner',
      training_experience_months: profile.training_experience_months || 0,
      available_training_days: profile.available_training_days || 3,
      primary_goal: mappedGoal,
    };

    // 4. Hole Top-Empfehlungen via Scoring-System
    const scoringStart = Date.now();
    const recommendations = getTopRecommendations(
      userProfile,
      templates,
      limit
    );
    const scoringDuration = Date.now() - scoringStart;

    const totalDuration = Date.now() - startTime;

    // Performance logging
    console.log('[getRecommendations] Performance:', {
      total: `${totalDuration}ms`,
      profile: `${profileDuration}ms`,
      query: `${queryDuration}ms`,
      scoring: `${scoringDuration}ms`,
      templates: templates.length,
      recommendations: recommendations.length,
    });

    if (totalDuration > 1000) {
      console.warn('⚠️ [getRecommendations] Slow performance detected!', {
        userId,
        duration: totalDuration,
      });
    }

    return recommendations;
  } catch (error) {
    const duration = Date.now() - startTime;
    console.error('[getRecommendations] Failed', { duration, error });
    throw error;
  }
}

/**
 * Lädt ALLE verfügbaren Pläne mit Ratings für einen User
 *
 * Sortiert nach totalScore (höchste zuerst).
 * Praktisch für PlanListScreen mit Browsing aller Pläne.
 *
 * @param userId - Die ID des Users
 * @returns Liste aller Pläne mit Scores, sortiert nach Rating
 */
async function getAllPlansWithRatings(
  userId: string
): Promise<PlanRecommendation[]> {
  try {
    // Reuse getRecommendations logic but without limit
    // Pass a very high number to get all templates
    const allRecommendations = await getRecommendations(userId, 999);

    // Already sorted by score in getTopRecommendations()
    return allRecommendations;
  } catch (error) {
    console.error('[getAllPlansWithRatings] Failed', error);
    throw error;
  }
}

/**
 * Lädt die beste Plan-Empfehlung für einen User
 *
 * Praktisch für direkten Plan-Vorschlag nach Onboarding.
 *
 * @param userId - Die ID des Users
 * @returns Die beste Empfehlung oder null
 */
async function getBestPlanRecommendation(
  userId: string
): Promise<PlanRecommendation | null> {
  try {
    const recommendations = await getRecommendations(userId, 1);
    return recommendations[0] || null;
  } catch (error) {
    console.error('Fehler in getBestPlanRecommendation:', error);
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

    // Sortiere Workouts nach week_number, dann order_in_week, dann day_number
    // Dies stellt sicher, dass bei Plänen mit mehreren Wochen (z.B. Jim Wendler)
    // die Workouts in der richtigen Reihenfolge durchlaufen werden
    const sortedWorkouts = (activePlan.workouts || []).sort((a: any, b: any) => {
      // Zuerst nach week_number sortieren (falls vorhanden)
      const weekA = a.week_number ?? 1;
      const weekB = b.week_number ?? 1;
      if (weekA !== weekB) return weekA - weekB;

      // Dann nach order_in_week sortieren
      if (a.order_in_week !== b.order_in_week) {
        return a.order_in_week - b.order_in_week;
      }

      // Zuletzt nach day_number sortieren (Fallback)
      return a.day_number - b.day_number;
    });

    console.log('[getNextWorkout] Sorted workouts:', sortedWorkouts.map((w: any) => ({
      id: w.id,
      name: w.name,
      week: w.week_number,
      order: w.order_in_week,
      day: w.day_number
    })));

    if (sortedWorkouts.length === 0) {
      return null;
    }

    // Lade zuletzt abgeschlossenes Workout
    const { data: lastSession, error: sessionError } = await supabase
      .from("workout_sessions")
      .select("plan_workout_id, end_time")
      .eq("user_id", userId)
      .eq("plan_id", activePlan.id)
      .eq("status", "completed")
      .order("end_time", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (sessionError) {
      console.error("Fehler beim Laden der letzten Session:", sessionError);
    }

    console.log('[getNextWorkout] Last completed session:', lastSession);

    let nextWorkout: PlanWorkout;

    if (!lastSession) {
      // Noch kein Workout absolviert → erstes Workout des Plans
      nextWorkout = sortedWorkouts[0];
      console.log('[getNextWorkout] No previous session, selecting first workout:', nextWorkout.name);
    } else {
      // Finde das nächste Workout nach dem letzten
      const lastWorkoutIndex = sortedWorkouts.findIndex(
        (w: any) => w.id === lastSession.plan_workout_id
      );

      console.log('[getNextWorkout] Last workout index:', lastWorkoutIndex, 'Total workouts:', sortedWorkouts.length);

      if (lastWorkoutIndex === -1 || lastWorkoutIndex >= sortedWorkouts.length - 1) {
        // Letztes Workout war das letzte im Plan → fange von vorne an
        nextWorkout = sortedWorkouts[0];
        console.log('[getNextWorkout] Cycling back to first workout:', nextWorkout.name);
      } else {
        // Nächstes Workout in der Reihenfolge
        nextWorkout = sortedWorkouts[lastWorkoutIndex + 1];
        console.log('[getNextWorkout] Next workout in sequence:', nextWorkout.name, 'at index', lastWorkoutIndex + 1);
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
 * Lädt die kommenden Workouts eines Plans ab dem nächsten geplanten Workout
 * Nützlich für die Trainingsplan-Detailansicht
 *
 * @param userId - Die ID des Users
 * @param planId - Die ID des Plans
 * @param limit - Maximale Anzahl der Workouts (Standard: 7)
 * @returns Liste der kommenden Workouts in der richtigen Reihenfolge
 */
async function getUpcomingWorkouts(
  userId: string,
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
      .eq("plan_id", planId);

    if (error) {
      console.error("Fehler beim Laden der kommenden Workouts:", error);
      throw new Error("Kommende Workouts konnten nicht geladen werden");
    }

    // Sortiere Workouts nach week_number, dann order_in_week, dann day_number
    // (gleiche Logik wie in getNextWorkout)
    const sortedWorkouts = (workouts || []).sort((a: any, b: any) => {
      // Zuerst nach week_number sortieren (falls vorhanden)
      const weekA = a.week_number ?? 1;
      const weekB = b.week_number ?? 1;
      if (weekA !== weekB) return weekA - weekB;

      // Dann nach order_in_week sortieren
      if (a.order_in_week !== b.order_in_week) {
        return a.order_in_week - b.order_in_week;
      }

      // Zuletzt nach day_number sortieren (Fallback)
      return a.day_number - b.day_number;
    });

    if (sortedWorkouts.length === 0) {
      return [];
    }

    // Finde das nächste Workout basierend auf der letzten abgeschlossenen Session
    const { data: lastSession, error: sessionError } = await supabase
      .from("workout_sessions")
      .select("plan_workout_id")
      .eq("user_id", userId)
      .eq("plan_id", planId)
      .eq("status", "completed")
      .order("end_time", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (sessionError) {
      console.error("Fehler beim Laden der letzten Session:", sessionError);
    }

    // Bestimme den Startindex für die kommenden Workouts
    let startIndex = 0;

    if (lastSession) {
      // Finde das nächste Workout nach dem letzten
      const lastWorkoutIndex = sortedWorkouts.findIndex(
        (w: any) => w.id === lastSession.plan_workout_id
      );

      if (lastWorkoutIndex !== -1) {
        // Starte beim nächsten Workout nach dem letzten
        startIndex = lastWorkoutIndex + 1;

        // Wenn wir am Ende sind, fange von vorne an
        if (startIndex >= sortedWorkouts.length) {
          startIndex = 0;
        }
      }
    }

    // Erstelle eine Liste der kommenden Workouts, die am richtigen Punkt startet
    // und bei Bedarf am Anfang fortsetzt (zyklisch)
    const upcomingWorkouts: PlanWorkout[] = [];

    for (let i = 0; i < Math.min(limit, sortedWorkouts.length); i++) {
      const workoutIndex = (startIndex + i) % sortedWorkouts.length;
      const workout = sortedWorkouts[workoutIndex];

      upcomingWorkouts.push({
        ...workout,
        exercises: (workout.exercises || []).sort(
          (a: PlanExercise, b: PlanExercise) => a.order_in_workout - b.order_in_workout
        ),
      });
    }

    return upcomingWorkouts;
  } catch (error) {
    console.error("Fehler in getUpcomingWorkouts:", error);
    throw error;
  }
}

// ============================================================================
// Workout History
// ============================================================================

/**
 * Lädt vergangene Workout-Sessions eines Users
 * Sortiert nach Datum (neueste zuerst)
 *
 * @param userId - Die ID des Users
 * @param limit - Maximale Anzahl der Sessions (Standard: 50)
 * @returns Liste der vergangenen Sessions mit Plan und Workout Details
 */
async function getCompletedSessions(
  userId: string,
  limit: number = 50
): Promise<WorkoutSession[]> {
  try {
    const { data, error } = await supabase
      .from("workout_sessions")
      .select(
        `
        *,
        plan:training_plans(id, name),
        workout:plan_workouts(id, name)
      `
      )
      .eq("user_id", userId)
      .eq("status", "completed")
      .order("date", { ascending: false })
      .limit(limit);

    if (error) {
      console.error("Fehler beim Laden der vergangenen Sessions:", error);
      throw new Error("Vergangene Sessions konnten nicht geladen werden");
    }

    return data || [];
  } catch (error) {
    console.error("Fehler in getCompletedSessions:", error);
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

  // Plan Recommendations (Scoring System)
  getRecommendations,
  getBestPlanRecommendation,
  getAllPlansWithRatings,

  // Plan Creation
  createPlanFromTemplate,
  createDynamicPlan,

  // Workout Session Management
  startWorkoutSession,
  getActiveSession,
  getPausedSession,
  completeWorkoutSession,
  pauseWorkoutSession,
  resumeWorkoutSession,
  cancelWorkoutSession,
  getSessionExercises,

  // Exercise Tracking
  logSet,
  addExtraSet,

  // Exercise Alternatives
  getExerciseAlternatives,

  // Next Workout
  getNextWorkout,
  getUpcomingWorkouts,

  // Workout History
  getCompletedSessions,
};
