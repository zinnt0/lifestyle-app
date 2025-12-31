# Training Service Builder Agent

## Zweck

Erstellt TypeScript Services für alle Training-bezogenen CRUD Operationen, inkl. Plan Management, Workout Sessions und Exercise Tracking.

## Kontext

Du arbeitest an der Lifestyle App (React Native + Expo). Die Trainings-Sektion braucht robuste Services für:

- Plan-Management (aktiv/inaktiv setzen, Templates instanziieren)
- Workout Sessions (starten, tracken, abschließen)
- Exercise Tracking (Sets, Reps, Gewichte, Alternativen)
- Progress Tracking

**Bestehende Datenbankstruktur:**

- `plan_templates` - 18 vordefinierte Programme
- `template_workouts` - Trainingstage pro Template
- `template_exercises` - Übungen pro Workout
- `training_plans` - User-spezifische Plan-Instanzen
- `plan_workouts` - User-spezifische Workout-Instanzen
- `plan_exercises` - User-spezifische Exercise-Instanzen
- `exercises` - 104 Übungen
- `workout_sessions` - Tracking aktiver Trainings
- `workout_sets` - Set-by-Set Tracking

## Dein Auftrag

### 1. Erstelle `src/services/trainingService.ts`

**Wichtige Funktionen:**

#### Plan Management

```typescript
/**
 * Lädt alle Pläne des Users (aktiv + inaktiv)
 */
getTrainingPlans(userId: string): Promise<TrainingPlan[]>

/**
 * Lädt einen spezifischen Plan mit allen Workouts
 */
getTrainingPlanDetails(planId: string): Promise<TrainingPlanDetails>

/**
 * Setzt einen Plan als aktiv (deaktiviert automatisch andere)
 */
setActivePlan(userId: string, planId: string): Promise<void>

/**
 * Erstellt neuen User-Plan aus Template
 */
createPlanFromTemplate(
  userId: string,
  templateId: string,
  planName: string,
  startDate: Date,
  isActive: boolean
): Promise<string> // Returns planId

/**
 * Löscht einen Plan
 */
deletePlan(planId: string): Promise<void>
```

#### Template Discovery

```typescript
/**
 * Sucht passende Templates basierend auf Entscheidungsbaum
 */
findMatchingTemplates(
  fitnessLevel: 'beginner' | 'intermediate' | 'advanced',
  daysPerWeek: number,
  primaryGoal?: 'strength' | 'hypertrophy' | 'both'
): Promise<PlanTemplate[]>

/**
 * Lädt Template-Details für Preview
 */
getTemplateDetails(templateId: string): Promise<TemplateDetails>
```

#### Workout Session Management

```typescript
/**
 * Startet eine neue Workout Session
 */
startWorkoutSession(
  userId: string,
  planId: string,
  workoutId: string
): Promise<string> // Returns sessionId

/**
 * Lädt aktive Workout Session (falls vorhanden)
 */
getActiveSession(userId: string): Promise<WorkoutSession | null>

/**
 * Schließt eine Workout Session ab
 */
completeWorkoutSession(sessionId: string): Promise<void>

/**
 * Lädt alle Exercises für eine Session mit aktuellen Gewichten
 */
getSessionExercises(sessionId: string): Promise<SessionExercise[]>
```

#### Exercise Tracking

```typescript
/**
 * Loggt einen einzelnen Set
 */
logSet(
  sessionId: string,
  exerciseId: string,
  setNumber: number,
  weight: number,
  reps: number,
  rpe?: number
): Promise<void>

/**
 * Fügt zusätzlichen Set zu Exercise hinzu
 */
addExtraSet(
  sessionId: string,
  exerciseId: string,
  weight: number,
  reps: number
): Promise<void>

/**
 * Lädt Alternative Exercises
 */
getExerciseAlternatives(
  exerciseId: string,
  userId: string
): Promise<Exercise[]>

/**
 * Ersetzt Exercise in Session
 */
substituteExercise(
  sessionId: string,
  originalExerciseId: string,
  alternativeExerciseId: string,
  reason: SubstitutionReason
): Promise<void>
```

#### Dashboard Data

```typescript
/**
 * Lädt nächstes geplantes Workout
 */
getNextWorkout(userId: string): Promise<NextWorkout | null>

/**
 * Lädt Training-Statistiken für Home Dashboard
 */
getTrainingStats(userId: string): Promise<TrainingStats>

/**
 * Lädt kommende Workouts (für Trainingsplan-Detailansicht)
 */
getUpcomingWorkouts(
  planId: string,
  limit: number = 7
): Promise<PlannedWorkout[]>
```

#### Progress Tracking

```typescript
/**
 * Lädt Workout-Verlauf
 */
getWorkoutHistory(
  userId: string,
  limit: number = 10
): Promise<WorkoutHistoryItem[]>

/**
 * Lädt Progress für spezifische Exercise
 */
getExerciseProgress(
  userId: string,
  exerciseId: string,
  weeks: number = 12
): Promise<ExerciseProgress[]>
```

### 2. TypeScript Types erstellen

Erstelle `src/types/training.types.ts` mit allen benötigten Interfaces:

```typescript
export interface TrainingPlan {
  id: string;
  user_id: string;
  source_template_id: string;
  name: string;
  plan_type: string;
  days_per_week: number;
  status: "active" | "inactive" | "completed";
  start_date: string;
  created_at: string;
  template?: PlanTemplate;
}

export interface TrainingPlanDetails extends TrainingPlan {
  workouts: PlanWorkout[];
  current_week?: number;
  total_weeks?: number;
}

export interface PlanWorkout {
  id: string;
  plan_id: string;
  name: string;
  name_de: string;
  day_number: number;
  week_number?: number;
  focus?: string;
  estimated_duration?: number;
  exercises: PlanExercise[];
}

export interface PlanExercise {
  id: string;
  workout_id: string;
  exercise_id: string;
  exercise_order: number;
  sets: number;
  reps_min?: number;
  reps_max?: number;
  target_reps?: number;
  target_weight?: number;
  rpe_target?: number;
  rest_seconds?: number;
  is_optional: boolean;
  can_substitute: boolean;
  exercise?: Exercise;
}

export interface Exercise {
  id: string;
  name: string;
  name_de: string;
  equipment: string[];
  movement_pattern: string;
  primary_muscles: string[];
  secondary_muscles: string[];
  difficulty: "beginner" | "intermediate" | "advanced";
  video_url?: string;
  instruction?: string;
  instruction_de?: string;
}

export interface WorkoutSession {
  id: string;
  user_id: string;
  plan_id: string;
  plan_workout_id: string;
  status: "in_progress" | "completed" | "skipped";
  started_at: string;
  completed_at?: string;
  notes?: string;
  workout?: PlanWorkout;
}

export interface SessionExercise extends PlanExercise {
  completed_sets: WorkoutSet[];
  is_completed: boolean;
}

export interface WorkoutSet {
  id: string;
  session_id: string;
  exercise_id: string;
  set_number: number;
  weight_kg?: number;
  reps: number;
  rpe?: number;
  notes?: string;
  created_at: string;
}

export interface PlanTemplate {
  id: string;
  name: string;
  name_de: string;
  plan_type: string;
  fitness_level: "beginner" | "intermediate" | "advanced";
  days_per_week: number;
  primary_goal: "strength" | "hypertrophy" | "both";
  description?: string;
  description_de?: string;
  scientific_rationale?: string;
  requirements?: string;
  progression_type?: string;
}

export interface TemplateDetails extends PlanTemplate {
  workouts: TemplateWorkout[];
}

export interface TemplateWorkout {
  id: string;
  template_id: string;
  name: string;
  name_de: string;
  day_number: number;
  week_number?: number;
  focus?: string;
  exercises: TemplateExercise[];
}

export interface TemplateExercise {
  id: string;
  workout_id: string;
  exercise_id: string;
  exercise_order: number;
  sets: number;
  reps_min?: number;
  reps_max?: number;
  rpe_target?: number;
  rest_seconds?: number;
  is_optional: boolean;
  can_substitute: boolean;
  exercise?: Exercise;
}

export interface NextWorkout {
  workout: PlanWorkout;
  plan: TrainingPlan;
  scheduled_date?: string;
}

export interface TrainingStats {
  total_workouts: number;
  current_week_workouts: number;
  current_streak: number;
  total_volume_kg: number; // Last 30 days
  favorite_exercise?: Exercise;
}

export interface WorkoutHistoryItem {
  session: WorkoutSession;
  workout: PlanWorkout;
  total_sets: number;
  total_volume_kg: number;
  duration_minutes?: number;
}

export interface ExerciseProgress {
  date: string;
  weight_kg: number;
  reps: number;
  volume: number; // weight * reps * sets
  estimated_1rm?: number;
}

export type SubstitutionReason =
  | "equipment_unavailable"
  | "equipment_occupied"
  | "injury_prevention"
  | "user_preference"
  | "other";
```

### 3. Error Handling

- Alle Funktionen sollten try-catch haben
- Fehler sollten geloggt werden
- Benutzerfreundliche Error Messages auf Deutsch
- Validierung von User IDs und Foreign Keys

### 4. Besondere Implementierungs-Hinweise

#### Plan Activation Logic

Wenn ein Plan aktiviert wird:

1. Alle anderen Pläne des Users auf `inactive` setzen
2. Nur EIN aktiver Plan zur Zeit möglich
3. Transaction verwenden für Atomarität

#### Session Management

- Prüfe beim Start ob bereits eine aktive Session existiert
- Zeige Warnung falls User Session beenden will ohne abzuschließen
- Auto-complete nach 24h ohne Aktivität (optional)

#### Exercise Alternatives

- Lade nur Alternatives mit ähnlichem `movement_pattern`
- Berücksichtige User's verfügbares Equipment (falls in Profil)
- Sortiere nach `similarity_score` (wenn exercise_alternatives Tabelle existiert)

#### Weight Calculation

- Falls `target_weight` NULL: Nutze letztes Gewicht für diese Exercise
- Falls keine Historie: Vorschlag basierend auf User's 1RM (falls vorhanden)
- Ansonsten: User muss selbst eingeben

### 5. Performance Optimierungen

```typescript
// Nutze Joins statt multiple queries
const planWithWorkouts = await supabase
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
  .eq("id", planId)
  .single();

// Cache Templates (ändern sich selten)
const TEMPLATE_CACHE_KEY = "plan_templates";
const CACHE_DURATION = 1000 * 60 * 60; // 1 hour
```

## Implementierungs-Checkliste

- [ ] TypeScript Types in `src/types/training.types.ts`
- [ ] Training Service in `src/services/trainingService.ts`
- [ ] Error Handling für alle Functions
- [ ] JSDoc Kommentare für alle Public Functions
- [ ] Unit Tests für kritische Logik (Plan Activation, Session Management)
- [ ] Performance-Tests für komplexe Queries

## Beispiel-Verwendung

```typescript
// Im Component
import { trainingService } from "@/services/trainingService";

// Plan laden
const plans = await trainingService.getTrainingPlans(userId);

// Plan aktivieren
await trainingService.setActivePlan(userId, planId);

// Workout starten
const sessionId = await trainingService.startWorkoutSession(
  userId,
  planId,
  workoutId
);

// Set loggen
await trainingService.logSet(
  sessionId,
  exerciseId,
  setNumber,
  weight,
  reps,
  rpe
);

// Session abschließen
await trainingService.completeWorkoutSession(sessionId);
```

## Testing

Teste besonders:

1. ✅ Nur EIN aktiver Plan zur Zeit
2. ✅ Session kann nicht zweimal gestartet werden
3. ✅ Set-Tracking ist persistent
4. ✅ Alternative Exercises laden korrekt
5. ✅ Stats berechnen sich korrekt

## Notizen

- Service sollte Supabase Client nutzen
- Alle User-spezifischen Queries sollten RLS respektieren
- Deutsche Übersetzungen bevorzugen (`name_de` statt `name`)
- Timestamps in ISO Format für Datum/Zeit

---

**Erstellt für:** Lifestyle App Training Module
**React Native + Expo + TypeScript + Supabase**
