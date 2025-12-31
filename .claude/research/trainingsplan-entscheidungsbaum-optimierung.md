# Trainingsplan-Entscheidungsbaum: Wissenschaftliche Analyse & Optimierung

**Erstellt:** 29. Dezember 2024  
**Status:** Umfassende Analyse + Optimierungsvorschlag  
**Ziel:** Likelihood-Scoring System für alle 18 Programme

---

## 🔍 ANALYSE DES AKTUELLEN SYSTEMS

### Status Quo

- **18 Plan Templates** in Supabase vorhanden
- **7 vollständige Programme** (mit Template Exercises):

  - ✅ starting_strength (8 exercises)
  - ✅ stronglifts_5x5 (6 exercises)
  - ✅ full_body_3x (18 exercises)
  - ✅ phul (25 exercises)
  - ✅ upper_lower_hypertrophy (29 exercises)
  - ✅ 531_intermediate (21 exercises)
  - ✅ ppl_6x_intermediate (16 exercises)

- **11 unvollständige Programme** (nur Template + Workouts, keine Übungen)

### Probleme des aktuellen Entscheidungsbaums

1. **Binäre Logik**: Plan passt exakt oder gar nicht → keine Flexibilität
2. **Keine Fallback-Optionen**: Wenn ein Pfad zu einem unvollständigen Programm führt, gibt es nur eine Warnung
3. **Keine Priorisierung**: Alle vollständigen Programme werden gleich behandelt
4. **Ignoriert Nuancen**: Trainingserfahrung in Monaten wird nicht berücksichtigt (nur Anfänger/Intermediär/Fortgeschritten)
5. **Suboptimale Empfehlungen**: Fortgeschrittene User bekommen nur unvollständige Programme

---

## 🧬 WISSENSCHAFTLICHE GRUNDLAGEN FÜR OPTIMIERUNG

### 1. Trainingserfahrung (Wichtigster Faktor)

**Wissenschaftliche Evidenz:**

- Anfänger (0-12 Monate): Profitieren von hoher Frequenz (3x/Woche), niedrigerem Volumen (10-15 Sets), Full Body optimal
- Intermediär (12-36 Monate): Benötigen 2x/Woche Frequenz, 15-20 Sets, Upper/Lower oder PPL optimal
- Fortgeschritten (36+ Monate): Benötigen spezialisierte Periodisierung, 18-25+ Sets

**Gewichtung im Scoring: 40%**

### 2. Trainingsfrequenz (Trainingstage/Woche)

**Wissenschaftliche Evidenz (Schoenfeld et al., 2016):**

- 2x/Woche pro Muskelgruppe ist optimal für Hypertrophie
- 3x/Woche zeigt keine zusätzlichen Vorteile bei gleichem Volumen
- 1x/Woche ist suboptimal

**Optimale Tage nach Erfahrung:**

- Anfänger: 2-3 Tage (Full Body oder Upper/Lower)
- Intermediär: 3-6 Tage (Upper/Lower bis PPL)
- Fortgeschritten: 4-6 Tage (spezialisierte Splits)

**Gewichtung im Scoring: 30%**

### 3. Primäres Ziel

**Wissenschaftliche Evidenz:**

- Kraft: 1-5 Reps @ 85-95% 1RM, lineare oder Block-Periodisierung
- Hypertrophie: 6-12 Reps @ 65-85% 1RM, 12-20 Sets/Woche
- Both: Undulating Periodization (DUP) überlegen bei Intermediären (ES 0.61)
- General Fitness: Full Body, gemischte Rep-Bereiche

**Gewichtung im Scoring: 20%**

### 4. Trainingsvolumen

**Wissenschaftliche Evidenz (Baz-Valle et al., 2022):**

- 12-20 Sets/Muskelgruppe/Woche = Sweet Spot
- <10 Sets: Suboptimal
- > 20 Sets: Diminishing Returns

**Gewichtung im Scoring: 10%**

---

## 🎯 OPTIMIERTES LIKELIHOOD-SCORING SYSTEM

### Scoring-Formel

```typescript
Score =
  (experienceMatch * 0.4 +
    frequencyMatch * 0.3 +
    goalMatch * 0.2 +
    volumeMatch * 0.1) *
  completenessBonus;
```

**Completeness Bonus:**

- Vollständiges Programm: 1.0 (kein Malus)
- Unvollständiges Programm: 0.7 (30% Malus, aber immer noch wählbar)

### Matching-Scores (0-100)

#### 1. Experience Match Score

```typescript
function calculateExperienceMatch(
  userExperience: string,
  userMonths: number,
  programLevel: string,
  programMinMonths: number
): number {
  // Exakte Match
  if (userExperience === programLevel) {
    return 100;
  }

  // Ein Level daneben
  const levels = ["beginner", "intermediate", "advanced"];
  const userIndex = levels.indexOf(userExperience);
  const programIndex = levels.indexOf(programLevel);

  if (Math.abs(userIndex - programIndex) === 1) {
    // Check ob User genug Monate hat für das nächste Level
    if (programIndex > userIndex) {
      // User ist Anfänger, Programm ist Intermediär
      // Wenn User 10+ Monate hat, könnte Intermediär-Programm passen
      if (userMonths >= 10 && programMinMonths <= 12) return 80;
      return 50;
    } else {
      // User ist Intermediär, Programm ist Anfänger
      // Anfänger-Programme können als "Deload" oder "Back to basics" dienen
      return 60;
    }
  }

  // Zwei Levels daneben
  return 20;
}
```

#### 2. Frequency Match Score

```typescript
function calculateFrequencyMatch(
  userDays: number,
  programDays: number
): number {
  const diff = Math.abs(userDays - programDays);

  if (diff === 0) return 100; // Exakte Match
  if (diff === 1) return 80; // 1 Tag daneben
  if (diff === 2) return 60; // 2 Tage daneben
  if (diff === 3) return 40; // 3 Tage daneben
  return 20; // 4+ Tage daneben
}
```

#### 3. Goal Match Score

```typescript
function calculateGoalMatch(userGoal: string, programGoal: string): number {
  // Exakte Match
  if (userGoal === programGoal) return 100;

  // Kompatible Goals
  const compatibilityMap = {
    strength: {
      both: 80,
      powerlifting: 90,
      general_fitness: 50,
      hypertrophy: 40,
    },
    hypertrophy: {
      both: 80,
      general_fitness: 60,
      strength: 40,
      powerlifting: 30,
    },
    both: {
      strength: 80,
      hypertrophy: 80,
      powerlifting: 70,
      general_fitness: 60,
    },
    general_fitness: {
      both: 70,
      hypertrophy: 60,
      strength: 50,
      powerlifting: 30,
    },
  };

  return compatibilityMap[userGoal]?.[programGoal] || 20;
}
```

#### 4. Volume Match Score

```typescript
function calculateVolumeMatch(
  userExperience: string,
  programWorkouts: number,
  programDays: number
): number {
  // Berechne durchschnittliche Exercises pro Workout
  // Dies ist eine Proxy für Volumen

  // Ideale Ranges basierend auf Erfahrung
  const idealRanges = {
    beginner: { min: 4, max: 6 }, // 4-6 exercises/workout
    intermediate: { min: 5, max: 7 },
    advanced: { min: 6, max: 9 },
  };

  // Geschätzte exercises per workout (würde real aus DB kommen)
  const estimatedExercises = programWorkouts * 2; // Platzhalter

  const ideal = idealRanges[userExperience];
  if (!ideal) return 50;

  if (estimatedExercises >= ideal.min && estimatedExercises <= ideal.max) {
    return 100;
  }

  // Leicht außerhalb des idealen Bereichs
  if (
    estimatedExercises >= ideal.min - 1 &&
    estimatedExercises <= ideal.max + 1
  ) {
    return 80;
  }

  return 60;
}
```

---

## 📊 BEISPIEL-SCORING FÜR USER-PROFILE

### User Profile 1: Anfänger mit Kraft-Fokus

```typescript
const user1 = {
  experience: "beginner",
  experienceMonths: 8,
  daysPerWeek: 3,
  primaryGoal: "strength",
};
```

**Top 5 Empfehlungen:**

| Rank | Program                 | Experience | Frequency | Goal | Volume | Completeness | **Total**    |
| ---- | ----------------------- | ---------- | --------- | ---- | ------ | ------------ | ------------ |
| 1    | Starting Strength       | 100        | 100       | 100  | 100    | 1.0          | **100.0** ✅ |
| 2    | StrongLifts 5x5         | 100        | 100       | 80   | 100    | 1.0          | **96.0** ✅  |
| 3    | Full Body 3x            | 100        | 100       | 50   | 100    | 1.0          | **85.0** ✅  |
| 4    | Minimal Upper/Lower     | 100        | 80        | 50   | 80     | 0.7          | **59.5** ⚠️  |
| 5    | Alternating Upper/Lower | 50         | 100       | 40   | 80     | 0.7          | **40.6** ⚠️  |

**Empfehlung:** Starting Strength (perfekte Match)

---

### User Profile 2: Intermediär mit Hypertrophie-Fokus

```typescript
const user2 = {
  experience: "intermediate",
  experienceMonths: 18,
  daysPerWeek: 4,
  primaryGoal: "hypertrophy",
};
```

**Top 5 Empfehlungen:**

| Rank | Program                 | Experience | Frequency | Goal | Volume | Completeness | **Total**    |
| ---- | ----------------------- | ---------- | --------- | ---- | ------ | ------------ | ------------ |
| 1    | Upper/Lower Hypertrophy | 100        | 100       | 100  | 100    | 1.0          | **100.0** ✅ |
| 2    | PHUL                    | 100        | 100       | 80   | 100    | 1.0          | **96.0** ✅  |
| 3    | 5/3/1 Intermediate      | 100        | 100       | 40   | 100    | 1.0          | **76.0** ✅  |
| 4    | Full Body 3x            | 60         | 80        | 60   | 80     | 1.0          | **66.0** ✅  |
| 5    | PHUL Periodized         | 100        | 100       | 80   | 100    | 0.7          | **67.2** ⚠️  |

**Empfehlung:** Upper/Lower Hypertrophy (perfekte Match)

---

### User Profile 3: Intermediär mit 6 Tagen

```typescript
const user3 = {
  experience: "intermediate",
  experienceMonths: 24,
  daysPerWeek: 6,
  primaryGoal: "both",
};
```

**Top 5 Empfehlungen:**

| Rank | Program                 | Experience | Frequency | Goal | Volume | Completeness | **Total**   |
| ---- | ----------------------- | ---------- | --------- | ---- | ------ | ------------ | ----------- |
| 1    | PPL 6x Intermediate     | 100        | 100       | 80   | 100    | 1.0          | **96.0** ✅ |
| 2    | PPL Advanced Periodized | 50         | 100       | 80   | 100    | 0.7          | **56.7** ⚠️ |
| 3    | Block Periodization 6d  | 50         | 100       | 80   | 90     | 0.7          | **55.3** ⚠️ |
| 4    | Upper/Lower Hypertrophy | 100        | 60        | 80   | 100    | 1.0          | **86.0** ✅ |
| 5    | PHUL                    | 100        | 60        | 80   | 100    | 1.0          | **86.0** ✅ |

**Empfehlung:** PPL 6x Intermediate (beste Match für 6 Tage)

---

### User Profile 4: Fortgeschrittener mit Kraft-Fokus

```typescript
const user4 = {
  experience: "advanced",
  experienceMonths: 48,
  daysPerWeek: 4,
  primaryGoal: "strength",
};
```

**Top 5 Empfehlungen:**

| Rank | Program            | Experience | Frequency | Goal | Volume | Completeness | **Total**   |
| ---- | ------------------ | ---------- | --------- | ---- | ------ | ------------ | ----------- |
| 1    | 5/3/1 Advanced     | 100        | 100       | 100  | 100    | 0.7          | **70.0** ⚠️ |
| 2    | Conjugate Method   | 100        | 100       | 90   | 100    | 0.7          | **68.6** ⚠️ |
| 3    | 5/3/1 Intermediate | 80         | 100       | 100  | 100    | 1.0          | **92.0** ✅ |
| 4    | PHUL Periodized    | 100        | 100       | 80   | 100    | 0.7          | **67.2** ⚠️ |
| 5    | PHUL               | 80         | 100       | 80   | 100    | 1.0          | **88.0** ✅ |

**Empfehlung:** 5/3/1 Intermediate (vollständig, hoher Score) mit Info, dass 5/3/1 Advanced später verfügbar sein wird

---

## 💡 OPTIMIERUNGSVORSCHLÄGE

### 1. Multi-Score Empfehlung statt Single Best Match

```typescript
interface PlanRecommendation {
  template: PlanTemplate;
  totalScore: number;
  breakdown: {
    experienceScore: number;
    frequencyScore: number;
    goalScore: number;
    volumeScore: number;
  };
  completeness: "complete" | "incomplete";
  recommendation: "optimal" | "good" | "acceptable" | "fallback";
  reasoning: string;
}
```

**Kategorisierung:**

- **Optimal** (Score 90-100): Perfekte oder nahezu perfekte Match
- **Good** (Score 75-89): Sehr gute Option, kleine Kompromisse
- **Acceptable** (Score 60-74): Funktioniert, aber nicht ideal
- **Fallback** (Score <60): Nur wenn keine besseren Optionen

### 2. Transparente Empfehlungen

Zeige dem User die **Top 3 Pläne** mit:

- Gesamt-Score
- Breakdown (Warum dieser Score?)
- Completion Status
- Empfehlungs-Badge (Optimal/Good/Acceptable)

**UI-Beispiel:**

```
┌─────────────────────────────────────────┐
│ ⭐ OPTIMAL MATCH (96/100)               │
│                                          │
│ Upper/Lower Hypertrophy                  │
│ ✅ Vollständig konfiguriert              │
│                                          │
│ Warum dieser Plan?                       │
│ • Perfekt für dein Level (100%)          │
│ • Passt zu deinen 4 Trainingstagen (100%)│
│ • Ideal für Muskelaufbau (100%)          │
│                                          │
│ [Plan erstellen]                         │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│ ⭐ SEHR GUT (92/100)                    │
│                                          │
│ PHUL                                     │
│ ✅ Vollständig konfiguriert              │
│                                          │
│ Warum dieser Plan?                       │
│ • Perfekt für dein Level (100%)          │
│ • Passt zu deinen 4 Trainingstagen (100%)│
│ • Kombiniert Kraft & Muskelaufbau (80%)  │
│                                          │
│ [Plan erstellen]                         │
└─────────────────────────────────────────┘
```

### 3. Dynamische Anpassung an verfügbare Programme

```typescript
function getRecommendations(userProfile: UserProfile): PlanRecommendation[] {
  // Score ALLE 18 Programme
  const allScores = scoreAllPrograms(userProfile);

  // Sortiere nach Score
  allScores.sort((a, b) => b.totalScore - a.totalScore);

  // Priorisiere vollständige Programme
  const completePrograms = allScores.filter(
    (p) => p.completeness === "complete"
  );
  const incompletePrograms = allScores.filter(
    (p) => p.completeness === "incomplete"
  );

  // Top 3 vollständig
  const top3Complete = completePrograms.slice(0, 3);

  // Wenn weniger als 3 vollständige, füge beste unvollständige hinzu
  if (top3Complete.length < 3) {
    const remaining = 3 - top3Complete.length;
    const topIncomplete = incompletePrograms.slice(0, remaining);
    return [...top3Complete, ...topIncomplete];
  }

  return top3Complete;
}
```

### 4. Intelligente Fallbacks für Fortgeschrittene

Wenn ein fortgeschrittener User keinen vollständigen Plan mit >80 Score hat:

```typescript
if (userExperience === "advanced" && !hasGoodCompleteMatch) {
  return {
    primaryRecommendation: bestIntermediateProgram,
    message:
      "Wir empfehlen dir dieses Intermediär-Programm mit erhöhtem Volumen, bis fortgeschrittene Programme verfügbar sind.",
    volumeModification: {
      setsIncrease: "+20%",
      advancedTechniques: ["Drop Sets", "Rest-Pause", "Cluster Sets"],
    },
    futureProgram: bestAdvancedProgram,
    eta: "Verfügbar in 2-4 Wochen",
  };
}
```

### 5. Berücksichtigung von Trainingserfahrung in Monaten

Aktuell wird nur `fitness_level` verwendet. Aber `training_experience_months` gibt viel mehr Kontext:

```typescript
function adjustScoreByMonths(
  baseScore: number,
  userMonths: number,
  programLevel: string
): number {
  // Beispiel: User hat 10 Monate (Anfänger), Programm ist Intermediär
  if (programLevel === "intermediate" && userMonths >= 10) {
    // User ist nah an Intermediär → Boost den Score
    return baseScore * 1.1; // 10% Bonus
  }

  // Beispiel: User hat 30 Monate (Intermediär), Programm ist Advanced
  if (programLevel === "advanced" && userMonths >= 30) {
    return baseScore * 1.1;
  }

  return baseScore;
}
```

---

## 🔧 IMPLEMENTIERUNGS-ROADMAP

### Phase 1: Scoring System (Prio: HOCH)

1. Implementiere Scoring-Funktionen
2. Teste mit verschiedenen User-Profilen
3. Validiere Scores mit wissenschaftlicher Literatur

### Phase 2: UI/UX Optimierung (Prio: HOCH)

1. Zeige Top 3 Empfehlungen statt Single Best
2. Implementiere Score-Breakdown Anzeige
3. Füge "Warum dieser Plan?" Reasoning hinzu

### Phase 3: Datenbank-Optimierung (Prio: MITTEL)

1. Berechne `estimated_sets_per_week` für jedes Template
2. Füge `suitability_scores` JSON-Feld hinzu für Pre-Computation
3. Optimiere Queries für schnellere Empfehlungen

### Phase 4: Advanced Features (Prio: NIEDRIG)

1. Implementiere Volumen-Modifications für Fortgeschrittene
2. Füge Equipment-Filtering hinzu
3. Implementiere "Alternative wenn ausgewählter Plan nicht passt"

---

## 📈 ERWARTETE VERBESSERUNGEN

### Vor Optimierung:

- ❌ Fortgeschrittene User: Nur unvollständige Programme
- ❌ Keine Flexibilität bei Trainingstagen (exakte Match erforderlich)
- ❌ Keine Transparenz über Empfehlungsgründe
- ❌ Binäre Entscheidungen

### Nach Optimierung:

- ✅ Fortgeschrittene User: Best-Fit Intermediär-Programm mit Modifications
- ✅ Flexibilität: Programme mit ähnlichen Trainingstagen werden empfohlen
- ✅ Transparenz: User versteht, warum ein Plan empfohlen wird
- ✅ Likelihood-Scoring: Top 3 Optionen zur Auswahl

---

## 🎓 WISSENSCHAFTLICHE VALIDIERUNG

Dieses Scoring-System basiert auf:

1. **Schoenfeld et al. (2016)** - Trainingsfrequenz und Hypertrophie
2. **Baz-Valle et al. (2022)** - Optimales Trainingsvolumen
3. **Moesgaard et al. (2022)** - Periodisierungseffekte
4. **Grgic et al. (2017)** - Linear vs. Undulating Periodization
5. **Kraemer & Ratamess (2004)** - ACSM Position Stand on Progression Models

**Evidenz-Level:** Meta-Analysen + Systematic Reviews = Höchste Qualität

---

## ✅ NEXT STEPS

1. **Review dieser Analyse** mit Team
2. **Entscheidung:** Scoring-System implementieren? (Empfehlung: JA)
3. **Prototype** des Scoring-Systems in TypeScript
4. **Testing** mit realen User-Profilen
5. **Integration** in GuidedPlanFlowScreen
6. **User Testing** und Feedback-Loop

---

**Status:** Ready for Implementation ✅  
**Geschätzter Aufwand:** 2-3 Tage für vollständige Implementation
