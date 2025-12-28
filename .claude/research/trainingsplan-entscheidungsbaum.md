# Trainingsplan-Entscheidungsbaum (Aktualisiert)

## Für GuidedPlanFlowScreen Implementation

**Stand:** 28. Dezember 2024  
**Status:** 7 von 18 Programmen vollständig (ready for MVP)

---

## 🎯 Übersicht

Dieser Entscheidungsbaum führt User durch 2-3 Fragen zu ihrem optimalen Trainingsplan.

**Vollständige Programme (mit Template Exercises):**
✅ Anfänger: Full Body 3x, Starting Strength, StrongLifts 5x5  
✅ Intermediär: Upper/Lower Hypertrophy, PHUL, 5/3/1, PPL 6x

**Programme ohne Template Exercises (Template + Workouts vorhanden):**
⚠️ Diese Programme können ausgewählt werden, haben aber noch keine Übungen konfiguriert

---

## 📊 Entscheidungsbaum

### Frage 1: Trainingserfahrung

**Question:** "Wie viel Trainingserfahrung hast du im Krafttraining?"

**Options:**

```typescript
[
  {
    value: "beginner",
    label: "Anfänger",
    description: "0-12 Monate regelmäßiges Training",
  },
  {
    value: "intermediate",
    label: "Intermediär",
    description: "1-3 Jahre regelmäßiges Training",
  },
  {
    value: "advanced",
    label: "Fortgeschritten",
    description: "3+ Jahre regelmäßiges Training",
  },
];
```

---

### Branch A: Anfänger

#### Frage 2a: Tage pro Woche

**Question:** "Wie viele Tage pro Woche kannst du trainieren?"

**Options:**

```typescript
[
  {
    value: 2,
    label: "2 Tage",
    result: "minimal_upper_lower", // ⚠️ Keine Template Exercises
  },
  {
    value: 3,
    label: "3 Tage",
    nextQuestion: "goal_beginner_3days",
  },
  {
    value: 4,
    label: "4+ Tage",
    info: "Für Anfänger empfehlen wir maximal 3 Trainingstage pro Woche. Mehr Training bedeutet nicht automatisch mehr Fortschritt!",
    redirectTo: 3, // Redirect zurück zu 3 Tage
  },
];
```

#### Frage 3a: Ziel (Anfänger, 3 Tage)

**Question:** "Was ist dein Hauptziel?"

**Options:**

```typescript
[
  {
    value: "strength",
    label: "Maximalkraft aufbauen",
    result: "starting_strength", // ✅ Vollständig
    preview: {
      name: "Starting Strength",
      description: "Fokus auf die 5 wichtigsten Kraftübungen",
      weeks: 12,
      workouts: 2,
    },
  },
  {
    value: "hypertrophy_balanced",
    label: "Muskelaufbau & ausgeglichene Entwicklung",
    result: "stronglifts_5x5", // ✅ Vollständig
    preview: {
      name: "StrongLifts 5x5",
      description: "Klassisches 5x5 Programm für ausgeglichenen Muskelaufbau",
      weeks: 12,
      workouts: 2,
    },
  },
  {
    value: "general_fitness",
    label: "Allgemeine Fitness",
    result: "full_body_3x", // ✅ Vollständig
    preview: {
      name: "Full Body 3x per Week",
      description: "Ganzkörpertraining für optimale Frequenz",
      weeks: 12,
      workouts: 3,
    },
  },
];
```

---

### Branch B: Intermediär

#### Frage 2b: Tage pro Woche

**Question:** "Wie viele Tage pro Woche kannst du trainieren?"

**Options:**

```typescript
[
  {
    value: 3,
    label: "3 Tage",
    result: "alternating_upper_lower", // ⚠️ Keine Template Exercises
    preview: {
      name: "Alternating Upper/Lower",
      description: "Wöchentlich wechselndes Upper/Lower Schema",
      status: "incomplete", // Warnung anzeigen
    },
  },
  {
    value: 4,
    label: "4 Tage",
    nextQuestion: "goal_intermediate_4days",
  },
  {
    value: 5,
    label: "5 Tage",
    nextQuestion: "goal_intermediate_5days",
  },
  {
    value: 6,
    label: "6 Tage",
    nextQuestion: "confirm_intermediate_6days",
  },
];
```

#### Frage 3b: Ziel (Intermediär, 4 Tage)

**Question:** "Was ist dein Hauptziel?"

**Options:**

```typescript
[
  {
    value: "both",
    label: "Kraft & Muskelaufbau kombiniert",
    result: "phul", // ✅ Vollständig
    preview: {
      name: "PHUL (Power Hypertrophy Upper Lower)",
      description: "Kombiniert Kraft- und Hypertrophie-Training",
      weeks: 12,
      workouts: 4,
    },
  },
  {
    value: "hypertrophy",
    label: "Primär Muskelaufbau",
    result: "upper_lower_hypertrophy", // ✅ Vollständig
    preview: {
      name: "Upper/Lower Hypertrophy Focus",
      description: "Optimiert für maximalen Muskelaufbau",
      weeks: 12,
      workouts: 4,
    },
  },
  {
    value: "strength",
    label: "Primär Kraft",
    result: "531_intermediate", // ✅ Vollständig (als 5/3/1 gespeichert)
    preview: {
      name: "Jim Wendler 5/3/1",
      description: "Periodisiertes Kraftprogramm mit Boring But Big",
      weeks: 16,
      workouts: 4,
    },
  },
];
```

#### Frage 3c: Ziel (Intermediär, 5 Tage)

**Question:** "Was ist dein Hauptziel?"

**Options:**

```typescript
[
  {
    value: "hypertrophy",
    label: "Muskelaufbau",
    result: "ppl_rotating_5d", // ⚠️ Keine Template Exercises
    preview: {
      name: "PPL Rotating (5-Tage)",
      description: "Push/Pull/Legs über 2 Wochen rotierend",
      status: "incomplete",
    },
  },
  {
    value: "upper_focus",
    label: "Upper Body Fokus",
    result: "upper_lower_3_2", // ⚠️ Keine Template Exercises
    preview: {
      name: "Upper/Lower 3/2 Split",
      description: "3x Upper Body, 2x Lower Body pro Woche",
      status: "incomplete",
    },
  },
];
```

#### Frage 3d: Bestätigung (Intermediär, 6 Tage)

**Question:** "Bereit für intensives Training?"

**Info:** "6 Tage Training erfordert gute Recovery und Zeitmanagement"

**Options:**

```typescript
[
  {
    value: "yes",
    label: "Ja, ich bin bereit!",
    result: "ppl_6x_intermediate", // ✅ Vollständig (als ppl_6x gespeichert)
    preview: {
      name: "PPL 6x per Week",
      description: "Klassisches Push/Pull/Legs zweimal pro Woche",
      weeks: 12,
      workouts: 3,
    },
  },
  {
    value: "no",
    label: "Lieber etwas weniger",
    redirectTo: "goal_intermediate_4days",
    info: "Wir empfehlen dir 4 Trainingstage pro Woche",
  },
];
```

---

### Branch C: Fortgeschritten

⚠️ **WICHTIG:** Alle fortgeschrittenen Programme haben KEINE Template Exercises konfiguriert.  
Sie können ausgewählt werden, aber User sollte gewarnt werden.

#### Frage 2c: Tage pro Woche

**Question:** "Wie viele Tage pro Woche kannst du trainieren?"

**Options:**

```typescript
[
  {
    value: 4,
    label: "4 Tage",
    nextQuestion: "goal_advanced_4days",
  },
  {
    value: 5,
    label: "5 Tage",
    nextQuestion: "goal_advanced_5days",
  },
  {
    value: 6,
    label: "6 Tage",
    nextQuestion: "goal_advanced_6days",
  },
];
```

#### Frage 3e: Ziel (Fortgeschritten, 4 Tage)

**Question:** "Was ist dein Hauptziel?"

**Options:**

```typescript
[
  {
    value: "strength",
    label: "Maximalkraft",
    result: "531_advanced", // ⚠️ Keine Template Exercises
    preview: {
      name: "5/3/1 Advanced",
      description: "Fortgeschrittene 5/3/1 Variante",
      status: "incomplete",
    },
  },
  {
    value: "both",
    label: "Kraft & Hypertrophie",
    result: "phul_periodized", // ⚠️ Keine Template Exercises
    preview: {
      name: "PHUL with Periodization",
      description: "PHUL mit periodisiertem Aufbau",
      status: "incomplete",
    },
  },
];
```

#### Frage 3f: Ziel (Fortgeschritten, 5 Tage)

**Question:** "Was ist dein Hauptziel?"

**Options:**

```typescript
[
  {
    value: "strength",
    label: "Maximalkraft",
    result: "block_periodization_5d", // ⚠️ Keine Template Exercises
    preview: {
      name: "Block Periodization (5-Tage)",
      description: "Blockperiodisierung für Kraftmaximierung",
      status: "incomplete",
    },
  },
  {
    value: "hypertrophy",
    label: "Hypertrophie",
    result: "ppl_advanced_5d", // ⚠️ Keine Template Exercises
    preview: {
      name: "PPL Advanced (5-Tage)",
      description: "Fortgeschrittenes PPL mit höherem Volumen",
      status: "incomplete",
    },
  },
];
```

#### Frage 3g: Ziel (Fortgeschritten, 6 Tage)

**Question:** "Was ist dein Hauptziel?"

**Options:**

```typescript
[
  {
    value: "strength",
    label: "Maximalkraft",
    result: "block_periodization_6d", // ⚠️ Keine Template Exercises
    preview: {
      name: "Block Periodization (6-Tage)",
      description: "Maximale Kraftentwicklung mit Blockperiodisierung",
      status: "incomplete",
    },
  },
  {
    value: "hypertrophy",
    label: "Hypertrophie",
    result: "ppl_advanced_periodized", // ⚠️ Keine Template Exercises
    preview: {
      name: "PPL Advanced Periodized",
      description: "Ultimatives Hypertrophieprogramm",
      status: "incomplete",
    },
  },
  {
    value: "powerlifting",
    label: "Powerlifting",
    result: "conjugate_method", // ⚠️ Keine Template Exercises
    preview: {
      name: "Conjugate Method (Westside)",
      description: "Westside Barbell Conjugate Method",
      status: "incomplete",
    },
  },
];
```

---

## 🔧 Implementation Guide für Prompt 8

### TypeScript Types

```typescript
// Decision Tree State
interface DecisionTreeState {
  experience?: "beginner" | "intermediate" | "advanced";
  daysPerWeek?: number;
  primaryGoal?: string;
}

// Option Interface
interface QuestionOption {
  value: string | number;
  label: string;
  description?: string;
  result?: string; // Plan Type ID
  nextQuestion?: string;
  redirectTo?: string | number;
  info?: string;
  preview?: {
    name: string;
    description: string;
    weeks?: number;
    workouts?: number;
    status?: "complete" | "incomplete";
  };
}

// Question Interface
interface Question {
  id: string;
  question: string;
  info?: string;
  options: QuestionOption[];
}
```

### Plan Type Mapping

```typescript
// Vollständige Plan Type IDs → Supabase plan_type
const PLAN_TYPE_MAPPING = {
  // Anfänger (3 vollständig)
  minimal_upper_lower: "minimal_upper_lower", // ⚠️ Incomplete
  starting_strength: "starting_strength", // ✅ Complete
  stronglifts_5x5: "stronglifts_5x5", // ✅ Complete
  full_body_3x: "full_body_3x", // ✅ Complete

  // Intermediär (4 vollständig, 3 incomplete)
  alternating_upper_lower: "alternating_upper_lower", // ⚠️ Incomplete
  phul: "phul", // ✅ Complete
  upper_lower_hypertrophy: "upper_lower_hypertrophy", // ✅ Complete
  "531_intermediate": "531_intermediate", // ✅ Complete
  ppl_rotating_5d: "ppl_rotating_5d", // ⚠️ Incomplete
  upper_lower_3_2: "upper_lower_3_2", // ⚠️ Incomplete
  ppl_6x_intermediate: "ppl_6x_intermediate", // ✅ Complete

  // Fortgeschritten (0 vollständig)
  "531_advanced": "531_advanced", // ⚠️ Incomplete
  phul_periodized: "phul_periodized", // ⚠️ Incomplete
  block_periodization_5d: "block_periodization_5d", // ⚠️ Incomplete
  ppl_advanced_5d: "ppl_advanced_5d", // ⚠️ Incomplete
  block_periodization_6d: "block_periodization_6d", // ⚠️ Incomplete
  ppl_advanced_periodized: "ppl_advanced_periodized", // ⚠️ Incomplete
  conjugate_method: "conjugate_method", // ⚠️ Incomplete
};
```

### Selection Logic

```typescript
/**
 * Selects the appropriate plan template based on user answers
 */
function selectPlanTemplate(answers: DecisionTreeState): string {
  const { experience, daysPerWeek, primaryGoal } = answers;

  // Anfänger
  if (experience === "beginner") {
    if (daysPerWeek === 2) return "minimal_upper_lower";
    if (daysPerWeek === 3) {
      if (primaryGoal === "strength") return "starting_strength";
      if (primaryGoal === "hypertrophy_balanced") return "stronglifts_5x5";
      if (primaryGoal === "general_fitness") return "full_body_3x";
    }
  }

  // Intermediär
  if (experience === "intermediate") {
    if (daysPerWeek === 3) return "alternating_upper_lower";
    if (daysPerWeek === 4) {
      if (primaryGoal === "both") return "phul";
      if (primaryGoal === "hypertrophy") return "upper_lower_hypertrophy";
      if (primaryGoal === "strength") return "531_intermediate";
    }
    if (daysPerWeek === 5) {
      if (primaryGoal === "hypertrophy") return "ppl_rotating_5d";
      if (primaryGoal === "upper_focus") return "upper_lower_3_2";
    }
    if (daysPerWeek === 6) return "ppl_6x_intermediate";
  }

  // Fortgeschritten
  if (experience === "advanced") {
    if (daysPerWeek === 4) {
      if (primaryGoal === "strength") return "531_advanced";
      if (primaryGoal === "both") return "phul_periodized";
    }
    if (daysPerWeek === 5) {
      if (primaryGoal === "strength") return "block_periodization_5d";
      if (primaryGoal === "hypertrophy") return "ppl_advanced_5d";
    }
    if (daysPerWeek === 6) {
      if (primaryGoal === "strength") return "block_periodization_6d";
      if (primaryGoal === "hypertrophy") return "ppl_advanced_periodized";
      if (primaryGoal === "powerlifting") return "conjugate_method";
    }
  }

  throw new Error("Kein passender Plan gefunden");
}
```

### Warning für Incomplete Programs

```typescript
/**
 * Check if plan has template exercises
 */
const COMPLETE_PROGRAMS = new Set([
  "starting_strength",
  "stronglifts_5x5",
  "full_body_3x",
  "phul",
  "upper_lower_hypertrophy",
  "531_intermediate",
  "ppl_6x_intermediate",
]);

function isPlanComplete(planType: string): boolean {
  return COMPLETE_PROGRAMS.has(planType);
}

/**
 * Show warning for incomplete programs
 */
function showIncompleteWarning(planName: string) {
  Alert.alert(
    "Hinweis",
    `Der Plan "${planName}" ist noch in Entwicklung und hat noch keine konfigurierten Übungen. Möchtest du trotzdem fortfahren?`,
    [
      { text: "Anderen Plan wählen", style: "cancel" },
      { text: "Trotzdem erstellen", onPress: () => createPlan() },
    ]
  );
}
```

---

## 💡 UI Empfehlungen

### Status Badges

```typescript
// Zeige Status Badge bei Plan Preview
{
  preview.status === "incomplete" && (
    <View style={styles.incompleteBadge}>
      <Text style={styles.badgeText}>⚠️ In Entwicklung</Text>
    </View>
  );
}

{
  preview.status === "complete" && (
    <View style={styles.completeBadge}>
      <Text style={styles.badgeText}>✅ Vollständig</Text>
    </View>
  );
}
```

### Recommended Programs Highlighting

```typescript
// Markiere vollständige Programme als "Empfohlen"
const isRecommended = isPlanComplete(option.result);

<Card style={[styles.optionCard, isRecommended && styles.recommendedCard]}>
  {isRecommended && (
    <View style={styles.recommendedBadge}>
      <Text>⭐ Empfohlen</Text>
    </View>
  )}
</Card>;
```

---

## 🎯 Testing Checklist

Nach Implementation sollten folgende Flows getestet werden:

### Vollständige Programme (Ready to use):

- [ ] Anfänger → 3 Tage → Kraft → Starting Strength
- [ ] Anfänger → 3 Tage → Muskelaufbau → StrongLifts 5x5
- [ ] Anfänger → 3 Tage → Fitness → Full Body 3x
- [ ] Intermediär → 4 Tage → Kombiniert → PHUL
- [ ] Intermediär → 4 Tage → Muskelaufbau → Upper/Lower Hypertrophy
- [ ] Intermediär → 4 Tage → Kraft → 5/3/1
- [ ] Intermediär → 6 Tage → Ja → PPL 6x

### Incomplete Programme (Mit Warnung):

- [ ] Anfänger → 2 Tage → Minimal Upper/Lower (Warnung)
- [ ] Intermediär → 3 Tage → Alternating Upper/Lower (Warnung)
- [ ] Alle Fortgeschritten-Pfade (Warnung)

### Edge Cases:

- [ ] Anfänger → 4+ Tage → Redirect zu 3 Tage
- [ ] Intermediär → 6 Tage → Nein → Redirect zu 4 Tage
- [ ] Zurück-Button funktioniert
- [ ] State bleibt erhalten beim Navigieren

---

**Status:** Ready for Implementation in Prompt 8
**Vollständige Programme:** 7/18 (39%)
**User-Abdeckung:** ~80% (MVP-ready)
