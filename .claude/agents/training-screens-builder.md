# Training Screens Builder Agent

## Zweck

Erstellt alle Training-bezogenen Screens mit modernem, ansprechendem UI Design, basierend auf der Referenz-Grafik aber mit verbesserter Ästhetik.

## Kontext

Du arbeitest an der Lifestyle App (React Native + Expo). Die Trainings-Sektion benötigt 5 Haupt-Screens:

1. **Trainings-Dashboard** - Übersicht aller Pläne
2. **Plan-Konfiguration** - Zwei Optionen: Guided vs. Custom
3. **Trainingsplan-Detail** - Detailansicht eines Plans
4. **Workout-Session** - Aktives Training mit Card-Carousel
5. **Workout-Summary** - Nach Abschluss eines Trainings

**Design-Philosophie:**

- Clean, modern, minimalistisch
- Großzügiger Whitespace
- Klare Hierarchie durch Typography
- Sanfte Farben (keine grellen Farben)
- Smooth Animations
- Touch-optimiert für mobile

## Tech Stack

- React Native + Expo
- TypeScript
- React Navigation (Tab + Stack Navigator)
- Kein externes UI Framework (Custom Components)
- Expo Linear Gradient für Cards
- React Native Gesture Handler für Carousel

## Dein Auftrag

### 1. Trainings-Dashboard Screen

**Datei:** `src/screens/training/TrainingDashboardScreen.tsx`

**Features:**

- Aktiver Plan ganz oben (prominent)
- Inaktive Pläne darunter (Liste)
- Toggle-Switch um Plan zu aktivieren (nur EIN aktiver zur Zeit!)
- Button "Neuen Plan erstellen" am Ende
- Pull-to-Refresh

**Layout:**

```
┌─────────────────────────────────────┐
│  ← Trainings-Dashboard              │
├─────────────────────────────────────┤
│                                     │
│  ┌───────────────────────────────┐ │
│  │ 🏋️ AKTIVER PLAN              │ │
│  │                               │ │
│  │ Upper/Lower Hypertrophy       │ │
│  │ 4 Tage pro Woche             │ │
│  │                               │ │
│  │ Woche 3 von 12               │ │
│  │ ██████░░░░░░░░  25%          │ │
│  │                               │ │
│  │ [Zum Plan >]                 │ │
│  └───────────────────────────────┘ │
│                                     │
│  Weitere Pläne:                    │
│                                     │
│  ┌───────────────────────────────┐ │
│  │ PHUL                      [○] │ │ ← Toggle
│  │ 4 Tage • Kraft+Hypertrophie   │ │
│  └───────────────────────────────┘ │
│                                     │
│  ┌───────────────────────────────┐ │
│  │ Starting Strength         [○] │ │
│  │ 3 Tage • Kraft               │ │
│  └───────────────────────────────┘ │
│                                     │
│  [+ Neuen Plan erstellen]          │
└─────────────────────────────────────┘
```

**UI Details:**

- Aktiver Plan: Card mit gradient background (z.B. sanfter blau-zu-lila gradient)
- Progress Bar für Wochenfortschritt
- Inaktive Pläne: Simple Cards mit border, kein gradient
- Toggle animiert beim Wechsel
- Haptic Feedback beim Toggle

**Implementierungs-Hinweise:**

```typescript
interface TrainingDashboardScreenProps {}

const TrainingDashboardScreen: React.FC<TrainingDashboardScreenProps> = () => {
  const [activePlan, setActivePlan] = useState<TrainingPlan | null>(null);
  const [inactivePlans, setInactivePlans] = useState<TrainingPlan[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  // Lade Pläne beim Mount
  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = async () => {
    // Nutze trainingService
    const plans = await trainingService.getTrainingPlans(userId);
    // Trenne aktiv/inaktiv
  };

  const handleTogglePlan = async (planId: string) => {
    // Haptic Feedback
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

    // Aktiviere Plan
    await trainingService.setActivePlan(userId, planId);

    // Reload
    await loadPlans();
  };

  return (
    <SafeAreaView>
      <ScrollView
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Aktiver Plan Card */}
        {activePlan && <ActivePlanCard plan={activePlan} />}

        {/* Weitere Pläne */}
        <Text>Weitere Pläne:</Text>
        {inactivePlans.map((plan) => (
          <InactivePlanCard
            key={plan.id}
            plan={plan}
            onToggle={() => handleTogglePlan(plan.id)}
          />
        ))}

        {/* Neuen Plan Button */}
        <Button onPress={() => navigation.navigate("PlanConfiguration")}>
          + Neuen Plan erstellen
        </Button>
      </ScrollView>
    </SafeAreaView>
  );
};
```

### 2. Plan-Konfigurations Screen

**Datei:** `src/screens/training/PlanConfigurationScreen.tsx`

**Features:**

- Zwei große Options-Cards:
  1. "Erstelle mir einen Plan" → Guided Flow
  2. "Plan selber zusammenstellen" → Custom Flow
- Info-Text über den Optionen
- Zurück-Button

**Layout:**

```
┌─────────────────────────────────────┐
│  ← Plan konfigurieren               │
├─────────────────────────────────────┤
│                                     │
│  Bitte wähle eine Option aus:       │
│                                     │
│  ┌───────────────────────────────┐ │
│  │ 🎯 Erstelle mir einen Plan   │ │
│  │                               │ │
│  │ Beantworte ein paar Fragen   │ │
│  │ und erhalte den perfekten    │ │
│  │ Plan für dich                │ │
│  │                               │ │
│  │              [→]              │ │
│  └───────────────────────────────┘ │
│                                     │
│  ┌───────────────────────────────┐ │
│  │ 🛠️ Plan selber zusammenstellen│ │
│  │                               │ │
│  │ Wähle Trainingstage und      │ │
│  │ Übungen selbst aus           │ │
│  │                               │ │
│  │              [→]              │ │
│  └───────────────────────────────┘ │
└─────────────────────────────────────┘
```

**Navigation:**

- Option 1 → `GuidedPlanFlowScreen` (Entscheidungsbaum)
- Option 2 → `CustomPlanFlowScreen` (Custom Builder)

### 3. Guided Plan Flow Screen

**Datei:** `src/screens/training/GuidedPlanFlowScreen.tsx`

**Features:**

- Multi-Step Form basierend auf Entscheidungsbaum
- Progress Indicator oben
- Zurück-Button (speichert Zwischenstand)
- Große, tappbare Option-Cards
- Smooth Transitions zwischen Steps

**Layout für Step:**

```
┌─────────────────────────────────────┐
│  ← Schritt 2 von 3           [●●○]  │
├─────────────────────────────────────┤
│                                     │
│  Wie viele Tage pro Woche          │
│  kannst du trainieren?             │
│                                     │
│  ┌───────────────────────────────┐ │
│  │        2 Tage                 │ │
│  └───────────────────────────────┘ │
│                                     │
│  ┌───────────────────────────────┐ │
│  │        3 Tage                 │ │ ← Selected
│  └───────────────────────────────┘ │
│                                     │
│  ┌───────────────────────────────┐ │
│  │        4+ Tage                │ │
│  └───────────────────────────────┘ │
│                                     │
│                    [Weiter →]       │
└─────────────────────────────────────┘
```

**Implementierungs-Logik:**

```typescript
// State für Decision Tree
interface DecisionTreeState {
  experience?: "beginner" | "intermediate" | "advanced";
  daysPerWeek?: number;
  primaryGoal?: "strength" | "hypertrophy" | "both" | "general_fitness";
}

const [answers, setAnswers] = useState<DecisionTreeState>({});
const [currentStep, setCurrentStep] = useState(0);

// Steps basierend auf Antworten
const getNextStep = (currentAnswers: DecisionTreeState) => {
  // Logik aus trainingsplan-entscheidungsbaum.md
  if (!currentAnswers.experience) return "experience";
  if (!currentAnswers.daysPerWeek) return "daysPerWeek";
  if (!currentAnswers.primaryGoal && needsGoalQuestion(currentAnswers)) {
    return "primaryGoal";
  }
  return "result";
};

// Template-Auswahl basierend auf Antworten
const selectTemplate = (answers: DecisionTreeState): string => {
  // Mapping aus Entscheidungsbaum
  // z.B. beginner + 3 days + strength → 'starting_strength'
};
```

**Am Ende:**

- Zeige ausgewähltes Template als Preview
- Zusammenfassung der Antworten
- Button "Plan erstellen"
- Navigation zurück zum Dashboard nach Creation

### 4. Trainingsplan-Detail Screen

**Datei:** `src/screens/training/TrainingPlanDetailScreen.tsx`

**Features:**

- Header mit Plan-Name + Info
- Große Card für aktuelles/nächstes Workout
- Kleinere Cards für kommende Workouts (scrollbar)
- "Workout starten" Button prominent

**Layout:**

```
┌─────────────────────────────────────┐
│  ← Upper/Lower Hypertrophy          │
│     4 Tage • Woche 3/12             │
├─────────────────────────────────────┤
│                                     │
│  NÄCHSTES WORKOUT                  │
│  ┌───────────────────────────────┐ │
│  │                               │ │
│  │   Upper A                     │ │
│  │   7 Übungen • ~60 min        │ │
│  │                               │ │
│  │   Fokus: Horizontal Push/Pull │ │
│  │                               │ │
│  │   [▶ Workout starten]        │ │
│  │                               │ │
│  └───────────────────────────────┘ │
│                                     │
│  KOMMENDE WORKOUTS                 │
│                                     │
│  ┌─────────┐ ┌─────────┐ ┌───────┐│
│  │Lower A  │ │Upper B  │ │Lower B││ ← Horizontal Scroll
│  │Mo 30.12 │ │Mi 1.1   │ │Fr 3.1 ││
│  └─────────┘ └─────────┘ └───────┘│
│                                     │
│  PLAN-DETAILS                      │
│  • Trainingstyp: Hypertrophie      │
│  • Progression: Double Progression │
│  • Equipment: Barbell, Dumbbells   │
│                                     │
└─────────────────────────────────────┘
```

**Implementierungs-Hinweise:**

```typescript
const TrainingPlanDetailScreen: React.FC<Props> = ({ route }) => {
  const { planId } = route.params;
  const [plan, setPlan] = useState<TrainingPlanDetails | null>(null);
  const [nextWorkout, setNextWorkout] = useState<PlannedWorkout | null>(null);
  const [upcomingWorkouts, setUpcomingWorkouts] = useState<PlannedWorkout[]>(
    []
  );

  useEffect(() => {
    loadPlanDetails();
  }, [planId]);

  const loadPlanDetails = async () => {
    const details = await trainingService.getTrainingPlanDetails(planId);
    setPlan(details);

    // Bestimme nächstes Workout (basierend auf day_number und letzter Session)
    const next = await trainingService.getNextWorkout(userId);
    setNextWorkout(next);

    // Lade kommende Workouts
    const upcoming = await trainingService.getUpcomingWorkouts(planId, 7);
    setUpcomingWorkouts(upcoming);
  };

  const handleStartWorkout = async () => {
    if (!nextWorkout) return;

    // Starte Session
    const sessionId = await trainingService.startWorkoutSession(
      userId,
      planId,
      nextWorkout.workout.id
    );

    // Navigate zu Workout Screen
    navigation.navigate("WorkoutSession", { sessionId });
  };

  return (
    <ScrollView>
      {/* Next Workout Card */}
      {nextWorkout && (
        <NextWorkoutCard
          workout={nextWorkout.workout}
          onStart={handleStartWorkout}
        />
      )}

      {/* Upcoming Workouts */}
      <Text>KOMMENDE WORKOUTS</Text>
      <FlatList
        horizontal
        data={upcomingWorkouts}
        renderItem={({ item }) => <UpcomingWorkoutCard workout={item} />}
      />

      {/* Plan Details */}
      <PlanDetailsSection plan={plan} />
    </ScrollView>
  );
};
```

### 5. Workout-Session Screen (Card Carousel)

**Datei:** `src/screens/training/WorkoutSessionScreen.tsx`

**Features:**

- Progress Bar oben (Übungen-basiert, nicht Zeit)
- Card-Carousel für Exercises
- Swipe left/right zum Preview
- Auto-advance beim Completion
- Set-Tracking mit expandable Rows
- Übungs-Bild prominent
- Alternative-Auswahl via Dropdown
- "Fertig"-Haken unten rechts

**Layout:**

```
┌─────────────────────────────────────┐
│  ← Upper A                    X     │
│                                     │
│  ████████████████░░░░░░  60%       │ ← Progress
├─────────────────────────────────────┤
│                                     │
│  ┌───────────────────────────────┐ │
│  │  ╔═══════════════════════════╗ │ │
│  │  ║   [Bench Press Bild]      ║ │ │
│  │  ╚═══════════════════════════╝ │ │
│  │                               │ │
│  │  Bench Press            [▼]  │ │ ← Dropdown
│  │  3 Sätze • 8-10 Wdh         │ │
│  │                               │ │
│  │  ┌─────────────────────────┐ │ │
│  │  │ Satz 1           [v]    │ │ │ ← Expandable
│  │  │ Soll: 80kg x 10         │ │ │
│  │  │ Ist:  [__]kg x [__]     │ │ │
│  │  └─────────────────────────┘ │ │
│  │                               │ │
│  │  ┌─────────────────────────┐ │ │
│  │  │ Satz 2           [>]    │ │ │
│  │  └─────────────────────────┘ │ │
│  │                               │ │
│  │  ┌─────────────────────────┐ │ │
│  │  │ Satz 3           [>]    │ │ │
│  │  └─────────────────────────┘ │ │
│  │                               │ │
│  │  [+ Zusätzlichen Satz]       │ │
│  │                               │ │
│  │                          [✓] │ │ ← Check
│  └───────────────────────────────┘ │
│                                     │
│  ← ● ● ○ ○ ○ →                    │ ← Pagination
└─────────────────────────────────────┘
```

**Carousel Implementation:**

```typescript
import {
  GestureHandlerRootView,
  PanGestureHandler,
} from "react-native-gesture-handler";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";

const WorkoutSessionScreen: React.FC<Props> = ({ route }) => {
  const { sessionId } = route.params;
  const [exercises, setExercises] = useState<SessionExercise[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const translateX = useSharedValue(0);

  // Lade Session Exercises
  useEffect(() => {
    loadSessionExercises();
  }, [sessionId]);

  const handleSetLog = async (
    exerciseId: string,
    setNumber: number,
    weight: number,
    reps: number
  ) => {
    await trainingService.logSet(
      sessionId,
      exerciseId,
      setNumber,
      weight,
      reps
    );
    // Reload exercise
    await loadSessionExercises();
  };

  const handleExerciseComplete = async (exerciseId: string) => {
    // Haptic
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

    // Mark complete
    // ... (set all sets as done)

    // Auto-advance to next
    if (currentIndex < exercises.length - 1) {
      setCurrentIndex(currentIndex + 1);
      // Animate carousel
    } else {
      // Last exercise → Show completion modal
      showCompletionModal();
    }
  };

  const showCompletionModal = () => {
    Alert.alert(
      "Workout abgeschlossen!",
      "Glückwunsch! Du hast alle Übungen geschafft.",
      [
        {
          text: "Statistiken ansehen",
          onPress: () => navigation.navigate("WorkoutSummary", { sessionId }),
        },
        {
          text: "Fertig",
          onPress: async () => {
            await trainingService.completeWorkoutSession(sessionId);
            navigation.goBack();
          },
        },
      ]
    );
  };

  return (
    <View>
      {/* Progress Bar */}
      <ProgressBar progress={currentIndex / exercises.length} color="#4CAF50" />

      {/* Carousel */}
      <View style={{ flex: 1 }}>
        {exercises.map((exercise, index) => (
          <ExerciseCard
            key={exercise.id}
            exercise={exercise}
            isActive={index === currentIndex}
            onSetLog={handleSetLog}
            onComplete={handleExerciseComplete}
            onSubstitute={handleSubstitute}
          />
        ))}
      </View>

      {/* Pagination Dots */}
      <PaginationDots total={exercises.length} current={currentIndex} />
    </View>
  );
};
```

**ExerciseCard Component:**

```typescript
interface ExerciseCardProps {
  exercise: SessionExercise;
  isActive: boolean;
  onSetLog: (
    exerciseId: string,
    setNumber: number,
    weight: number,
    reps: number
  ) => void;
  onComplete: (exerciseId: string) => void;
  onSubstitute: (exerciseId: string) => void;
}

const ExerciseCard: React.FC<ExerciseCardProps> = ({
  exercise,
  isActive,
  onSetLog,
  onComplete,
  onSubstitute,
}) => {
  const [expandedSet, setExpandedSet] = useState<number | null>(null);
  const [showAlternatives, setShowAlternatives] = useState(false);

  if (!isActive) return null; // Only show active card

  return (
    <Animated.View style={[styles.card, animatedStyle]}>
      {/* Exercise Image */}
      <Image
        source={{ uri: exercise.exercise.video_url || defaultImage }}
        style={styles.exerciseImage}
      />

      {/* Exercise Name + Alternatives Dropdown */}
      <TouchableOpacity onPress={() => setShowAlternatives(true)}>
        <View style={styles.nameRow}>
          <Text style={styles.exerciseName}>{exercise.exercise.name_de}</Text>
          <Icon name="chevron-down" />
        </View>
      </TouchableOpacity>

      <Text style={styles.setInfo}>
        {exercise.sets} Sätze • {exercise.reps_min}-{exercise.reps_max} Wdh
      </Text>

      {/* Sets */}
      {Array.from({ length: exercise.sets }).map((_, index) => (
        <SetRow
          key={index}
          setNumber={index + 1}
          targetWeight={exercise.target_weight}
          targetReps={exercise.target_reps}
          isExpanded={expandedSet === index + 1}
          onToggle={() =>
            setExpandedSet(expandedSet === index + 1 ? null : index + 1)
          }
          onLog={(weight, reps) =>
            onSetLog(exercise.exercise_id, index + 1, weight, reps)
          }
          completedSet={exercise.completed_sets.find(
            (s) => s.set_number === index + 1
          )}
        />
      ))}

      {/* Add Extra Set */}
      <Button onPress={handleAddSet}>+ Zusätzlichen Satz</Button>

      {/* Complete Checkmark */}
      <TouchableOpacity
        style={styles.completeButton}
        onPress={() => onComplete(exercise.exercise_id)}
      >
        <Icon name="check" size={32} color="#4CAF50" />
      </TouchableOpacity>

      {/* Alternatives Modal */}
      <AlternativesModal
        visible={showAlternatives}
        exerciseId={exercise.exercise_id}
        onSelect={onSubstitute}
        onClose={() => setShowAlternatives(false)}
      />
    </Animated.View>
  );
};
```

**SetRow Component:**

```typescript
interface SetRowProps {
  setNumber: number;
  targetWeight?: number;
  targetReps?: number;
  isExpanded: boolean;
  onToggle: () => void;
  onLog: (weight: number, reps: number) => void;
  completedSet?: WorkoutSet;
}

const SetRow: React.FC<SetRowProps> = ({
  setNumber,
  targetWeight,
  targetReps,
  isExpanded,
  onToggle,
  onLog,
  completedSet,
}) => {
  const [weight, setWeight] = useState(
    completedSet?.weight_kg?.toString() || ""
  );
  const [reps, setReps] = useState(completedSet?.reps.toString() || "");

  const handleSave = () => {
    if (!weight || !reps) return;
    onLog(parseFloat(weight), parseInt(reps));
    onToggle(); // Collapse after save
  };

  return (
    <View style={styles.setRow}>
      {/* Collapsed State */}
      <TouchableOpacity onPress={onToggle} style={styles.setHeader}>
        <Text>Satz {setNumber}</Text>
        {completedSet ? (
          <Text>
            ✓ {completedSet.weight_kg}kg x {completedSet.reps}
          </Text>
        ) : (
          <Text>
            Soll: {targetWeight}kg x {targetReps}
          </Text>
        )}
        <Icon name={isExpanded ? "chevron-down" : "chevron-right"} />
      </TouchableOpacity>

      {/* Expanded State */}
      {isExpanded && (
        <View style={styles.setInputs}>
          <Text>
            Soll: {targetWeight}kg x {targetReps}
          </Text>

          <View style={styles.inputRow}>
            <Text>Ist:</Text>
            <TextInput
              value={weight}
              onChangeText={setWeight}
              keyboardType="numeric"
              placeholder="kg"
              style={styles.input}
            />
            <Text>kg x</Text>
            <TextInput
              value={reps}
              onChangeText={setReps}
              keyboardType="numeric"
              placeholder="Wdh"
              style={styles.input}
            />
          </View>

          <Button onPress={handleSave}>Speichern</Button>
        </View>
      )}
    </View>
  );
};
```

### 6. Workout-Summary Screen

**Datei:** `src/screens/training/WorkoutSummaryScreen.tsx`

**Features:**

- Congratulations Message
- Statistiken des Workouts:
  - Total Volume (kg)
  - Total Sets
  - Duration
  - Beste Leistung (Highlight)
- Progress Charts (optional)
- "Fertig" Button

**Layout:**

```
┌─────────────────────────────────────┐
│                                     │
│         Finished Workout!           │
│      Du hast es geschafft!         │
│                                     │
│  ┌───────────────────────────────┐ │
│  │  Auswertung deines heutigen   │ │
│  │  Workouts!                    │ │
│  │                               │ │
│  │  ████████████ 2.450 kg       │ │
│  │  ████████ 24 Sätze           │ │
│  │  ████ 52 min                 │ │
│  │                               │ │
│  │  💪 Bester Satz:              │ │
│  │  Bench Press: 85kg x 12      │ │
│  └───────────────────────────────┘ │
│                                     │
│            [Fertig]                 │
│                                     │
└─────────────────────────────────────┘
```

## Design Guidelines

### Farben

```typescript
const colors = {
  primary: "#4A90E2", // Blau
  secondary: "#7B68EE", // Lila
  success: "#4CAF50", // Grün
  warning: "#FF9800", // Orange
  danger: "#F44336", // Rot

  background: "#F5F5F5", // Light Grey
  cardBg: "#FFFFFF",
  text: "#333333",
  textSecondary: "#666666",

  gradientStart: "#4A90E2",
  gradientEnd: "#7B68EE",
};
```

### Typography

```typescript
const typography = {
  h1: {
    fontSize: 32,
    fontWeight: "700",
    color: colors.text,
  },
  h2: {
    fontSize: 24,
    fontWeight: "600",
    color: colors.text,
  },
  h3: {
    fontSize: 20,
    fontWeight: "600",
    color: colors.text,
  },
  body: {
    fontSize: 16,
    fontWeight: "400",
    color: colors.text,
  },
  caption: {
    fontSize: 14,
    fontWeight: "400",
    color: colors.textSecondary,
  },
};
```

### Card Styling

```typescript
const cardStyles = {
  card: {
    backgroundColor: colors.cardBg,
    borderRadius: 16,
    padding: 20,
    marginVertical: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  activeCard: {
    // Gradient background
    borderRadius: 16,
    padding: 20,
    marginVertical: 8,
  },
};
```

### Animations

```typescript
// Smooth Spring Animations
const springConfig = {
  damping: 15,
  stiffness: 150,
  mass: 1,
};

// Card Entry Animation
Animated.timing(opacity, {
  toValue: 1,
  duration: 300,
  easing: Easing.ease,
  useNativeDriver: true,
}).start();

// Carousel Swipe
withSpring(translateX.value, springConfig);
```

## Component Structure

```
src/
├── screens/
│   └── training/
│       ├── TrainingDashboardScreen.tsx
│       ├── PlanConfigurationScreen.tsx
│       ├── GuidedPlanFlowScreen.tsx
│       ├── CustomPlanFlowScreen.tsx
│       ├── TrainingPlanDetailScreen.tsx
│       ├── WorkoutSessionScreen.tsx
│       └── WorkoutSummaryScreen.tsx
├── components/
│   └── training/
│       ├── ActivePlanCard.tsx
│       ├── InactivePlanCard.tsx
│       ├── NextWorkoutCard.tsx
│       ├── UpcomingWorkoutCard.tsx
│       ├── ExerciseCard.tsx
│       ├── SetRow.tsx
│       ├── AlternativesModal.tsx
│       ├── PaginationDots.tsx
│       └── ProgressBar.tsx
└── services/
    └── trainingService.ts
```

## Implementierungs-Checkliste

- [ ] TrainingDashboardScreen mit aktiv/inaktiv Plänen
- [ ] PlanConfigurationScreen mit zwei Optionen
- [ ] GuidedPlanFlowScreen mit Entscheidungsbaum
- [ ] TrainingPlanDetailScreen mit Next Workout
- [ ] WorkoutSessionScreen mit Card Carousel
- [ ] ExerciseCard mit expandable Sets
- [ ] AlternativesModal für Exercise Substitution
- [ ] WorkoutSummaryScreen mit Stats
- [ ] Alle Screens mit deutschen Übersetzungen
- [ ] Responsive Layout für verschiedene Bildschirmgrößen
- [ ] Haptic Feedback an kritischen Stellen
- [ ] Loading States für alle async Operations
- [ ] Error Handling mit benutzerfreundlichen Messages

## Testing

Teste besonders:

1. ✅ Toggle zwischen aktiven Plänen funktioniert
2. ✅ Carousel-Swipe ist smooth
3. ✅ Set-Tracking persistiert korrekt
4. ✅ Alternative-Auswahl lädt und funktioniert
5. ✅ Workout kann pausiert/fortgesetzt werden
6. ✅ Progress Bar zeigt korrekten Fortschritt
7. ✅ Auto-advance nach Exercise-Completion

---

**Erstellt für:** Lifestyle App Training Module
**React Native + Expo + TypeScript**
