# Onboarding Screens Builder Agent

## Role

You are a React Native screen builder specializing in multi-step onboarding flows. You create polished, user-friendly screens with proper validation, progress indicators, and smooth navigation.

## Project Context

- **Framework**: React Native (Expo) with TypeScript
- **Location**: `src/screens/onboarding/`
- **State**: OnboardingContext (from `src/contexts/OnboardingContext.tsx`)
- **Components**: UI components from `src/components/ui/`
- **Navigation**: React Navigation Stack

## Your Tasks

Build 6 onboarding screens as a progressive form flow.

### Screen Overview

1. **OnboardingScreen1** - Basisdaten (Age, Weight, Height, Gender)
2. **OnboardingScreen2** - Trainingserfahrung (Level, Days, Equipment)
3. **OnboardingScreen3** - Ziele (Primary Goal)
4. **OnboardingScreen4** - Lifestyle (Sleep, Stress)
5. **OnboardingScreen5** - Unverträglichkeiten (Optional)
6. **OnboardingSummary** - Zusammenfassung & Submit

---

## Common UI Structure

All screens share this structure:

```
┌─────────────────────────┐
│ [← Back]   [Progress]   │  <- Header with back button & progress
│                         │
│ Step X von 6            │  <- Step indicator
│                         │
│ [Titel]                 │  <- Screen title
│ [Untertitel]            │  <- Description
│                         │
│ [Form Inputs]           │  <- Screen-specific content
│                         │
│                         │
│ [Error Message]         │  <- Validation errors
│                         │
│ [Weiter Button]         │  <- Primary action
│                         │
└─────────────────────────┘
```

### Common Props/Hooks Usage

```typescript
import { useOnboarding } from "../../contexts/OnboardingContext";

const { data, updateData, nextStep, previousStep, error, currentStep } =
  useOnboarding();
```

---

## Screen 1: Basisdaten

**File**: `src/screens/onboarding/OnboardingScreen1.tsx`

### Fields

- **Alter** (number input, 13-120)
- **Gewicht** (number input with decimal, kg)
- **Größe** (number input with decimal, cm)
- **Geschlecht** (Radio buttons: Male/Female/Other)

### Validation

- All fields required
- Age: 13-120
- Weight: > 0
- Height: > 0

### Layout Example

```typescript
<ScrollView>
  <ProgressBar progress={(1 / 6) * 100} />

  <Text style={styles.step}>Schritt 1 von 6</Text>
  <Text style={styles.title}>Erzähl uns von dir</Text>
  <Text style={styles.subtitle}>
    Diese Informationen helfen uns, deinen perfekten Plan zu erstellen
  </Text>

  <Input
    label="Wie alt bist du?"
    value={data.age?.toString() || ""}
    onChangeText={(text) => updateData({ age: parseInt(text) || null })}
    keyboardType="number-pad"
    placeholder="z.B. 25"
  />

  <Input
    label="Wie viel wiegst du? (kg)"
    value={data.weight?.toString() || ""}
    onChangeText={(text) => updateData({ weight: parseFloat(text) || null })}
    keyboardType="decimal-pad"
    placeholder="z.B. 75.5"
  />

  <Input
    label="Wie groß bist du? (cm)"
    value={data.height?.toString() || ""}
    onChangeText={(text) => updateData({ height: parseFloat(text) || null })}
    keyboardType="decimal-pad"
    placeholder="z.B. 180"
  />

  <Text style={styles.label}>Geschlecht</Text>
  <RadioGroup
    options={[
      { label: "Männlich", value: "male" },
      { label: "Weiblich", value: "female" },
      { label: "Andere", value: "other" },
    ]}
    selected={data.gender}
    onSelect={(value) => updateData({ gender: value })}
  />

  {error && <ErrorMessage message={error} />}

  <Button title="Weiter" onPress={nextStep} />
</ScrollView>
```

---

## Screen 2: Trainingserfahrung

**File**: `src/screens/onboarding/OnboardingScreen2.tsx`

### Fields

- **Trainingslevel** (Buttons: Beginner/Intermediate/Advanced)
- **Trainingserfahrung** (number input, Monate)
- **Verfügbare Tage/Woche** (Number picker, 1-7)
- **Gym-Zugang** (Toggle/Switch)
- **Equipment zu Hause** (Multi-select chips)

### Equipment Options

```typescript
const equipmentOptions = [
  "barbell",
  "dumbbells",
  "kettlebells",
  "resistance_bands",
  "pull_up_bar",
  "bench",
  "squat_rack",
  "cables",
  "machines",
];

const equipmentLabels = {
  barbell: "Langhantel",
  dumbbells: "Kurzhanteln",
  kettlebells: "Kettlebells",
  resistance_bands: "Widerstandsbänder",
  pull_up_bar: "Klimmzugstange",
  bench: "Hantelbank",
  squat_rack: "Squat Rack",
  cables: "Kabelzug",
  machines: "Geräte",
};
```

### Layout Example

```typescript
<ScrollView>
  <ProgressBar progress={(2 / 6) * 100} />

  <Text style={styles.step}>Schritt 2 von 6</Text>
  <Text style={styles.title}>Deine Trainingserfahrung</Text>

  <Text style={styles.label}>Wie würdest du dein Level einschätzen?</Text>
  <View style={styles.buttonGroup}>
    <OptionButton
      label="Anfänger"
      description="< 1 Jahr Training"
      selected={data.fitness_level === "beginner"}
      onPress={() => updateData({ fitness_level: "beginner" })}
    />
    <OptionButton
      label="Fortgeschritten"
      description="1-3 Jahre"
      selected={data.fitness_level === "intermediate"}
      onPress={() => updateData({ fitness_level: "intermediate" })}
    />
    <OptionButton
      label="Experte"
      description="> 3 Jahre"
      selected={data.fitness_level === "advanced"}
      onPress={() => updateData({ fitness_level: "advanced" })}
    />
  </View>

  <Input
    label="Wie lange trainierst du schon? (Monate)"
    value={data.training_experience_months?.toString() || ""}
    onChangeText={(text) =>
      updateData({
        training_experience_months: parseInt(text) || 0,
      })
    }
    keyboardType="number-pad"
    placeholder="z.B. 12"
  />

  <NumberPicker
    label="Wie viele Tage pro Woche kannst du trainieren?"
    value={data.available_training_days || 3}
    min={1}
    max={7}
    onChange={(value) => updateData({ available_training_days: value })}
  />

  <View style={styles.toggleRow}>
    <Text style={styles.label}>Hast du Zugang zu einem Fitnessstudio?</Text>
    <Switch
      value={data.has_gym_access}
      onValueChange={(value) => updateData({ has_gym_access: value })}
    />
  </View>

  {!data.has_gym_access && (
    <>
      <Text style={styles.label}>Welches Equipment hast du zu Hause?</Text>
      <MultiSelectChips
        options={equipmentOptions}
        labels={equipmentLabels}
        selected={data.home_equipment}
        onSelectionChange={(selected) =>
          updateData({ home_equipment: selected })
        }
      />
    </>
  )}

  {error && <ErrorMessage message={error} />}

  <View style={styles.buttonRow}>
    <Button
      title="Zurück"
      variant="outline"
      onPress={previousStep}
      style={styles.backButton}
    />
    <Button title="Weiter" onPress={nextStep} style={styles.nextButton} />
  </View>
</ScrollView>
```

---

## Screen 3: Ziele

**File**: `src/screens/onboarding/OnboardingScreen3.tsx`

### Fields

- **Primäres Ziel** (Card selection)

### Goal Options

```typescript
const goals = [
  {
    value: "strength",
    label: "Kraft aufbauen",
    description: "Schwere Gewichte bewegen",
    icon: "💪",
  },
  {
    value: "hypertrophy",
    label: "Muskeln aufbauen",
    description: "Masse & Definition",
    icon: "🏋️",
  },
  {
    value: "weight_loss",
    label: "Gewicht verlieren",
    description: "Fett verbrennen",
    icon: "🔥",
  },
  {
    value: "endurance",
    label: "Ausdauer",
    description: "Länger durchhalten",
    icon: "🏃",
  },
  {
    value: "general_fitness",
    label: "Allgemeine Fitness",
    description: "Gesund & fit bleiben",
    icon: "✨",
  },
];
```

### Layout Example

```typescript
<ScrollView>
  <ProgressBar progress={(3 / 6) * 100} />

  <Text style={styles.step}>Schritt 3 von 6</Text>
  <Text style={styles.title}>Was ist dein Ziel?</Text>
  <Text style={styles.subtitle}>
    Wir passen deinen Plan an dein Hauptziel an
  </Text>

  {goals.map((goal) => (
    <GoalCard
      key={goal.value}
      label={goal.label}
      description={goal.description}
      icon={goal.icon}
      selected={data.primary_goal === goal.value}
      onPress={() => updateData({ primary_goal: goal.value })}
    />
  ))}

  {error && <ErrorMessage message={error} />}

  <View style={styles.buttonRow}>
    <Button
      title="Zurück"
      variant="outline"
      onPress={previousStep}
      style={styles.backButton}
    />
    <Button title="Weiter" onPress={nextStep} style={styles.nextButton} />
  </View>
</ScrollView>
```

---

## Screen 4: Lifestyle

**File**: `src/screens/onboarding/OnboardingScreen4.tsx`

### Fields

- **Durchschnittliche Schlafstunden** (Slider or number input, 3-12)
- **Stress-Level** (Slider, 1-10)

### Layout Example

```typescript
<ScrollView>
  <ProgressBar progress={(4 / 6) * 100} />

  <Text style={styles.step}>Schritt 4 von 6</Text>
  <Text style={styles.title}>Dein Lifestyle</Text>
  <Text style={styles.subtitle}>
    Diese Faktoren beeinflussen deine Regeneration
  </Text>

  <View style={styles.sliderContainer}>
    <Text style={styles.label}>
      Wie viele Stunden schläfst du durchschnittlich?
    </Text>
    <Text style={styles.value}>
      {data.sleep_hours_avg?.toFixed(1) || "7.0"} Stunden
    </Text>
    <Slider
      minimumValue={3}
      maximumValue={12}
      step={0.5}
      value={data.sleep_hours_avg || 7}
      onValueChange={(value) => updateData({ sleep_hours_avg: value })}
    />
    <View style={styles.sliderLabels}>
      <Text style={styles.sliderLabel}>3h</Text>
      <Text style={styles.sliderLabel}>12h</Text>
    </View>
  </View>

  <View style={styles.sliderContainer}>
    <Text style={styles.label}>Wie hoch ist dein tägliches Stress-Level?</Text>
    <Text style={styles.value}>{data.stress_level || 5} / 10</Text>
    <Slider
      minimumValue={1}
      maximumValue={10}
      step={1}
      value={data.stress_level || 5}
      onValueChange={(value) => updateData({ stress_level: value })}
    />
    <View style={styles.sliderLabels}>
      <Text style={styles.sliderLabel}>Niedrig</Text>
      <Text style={styles.sliderLabel}>Hoch</Text>
    </View>
  </View>

  {error && <ErrorMessage message={error} />}

  <View style={styles.buttonRow}>
    <Button
      title="Zurück"
      variant="outline"
      onPress={previousStep}
      style={styles.backButton}
    />
    <Button title="Weiter" onPress={nextStep} style={styles.nextButton} />
  </View>
</ScrollView>
```

---

## Screen 5: Unverträglichkeiten

**File**: `src/screens/onboarding/OnboardingScreen5.tsx`

### Fields

- **Unverträglichkeiten** (Multi-select list from catalog)
- **Severity** (Dropdown per selected item)

### Implementation

```typescript
import { getIntolerancesCatalog } from "../../services/profile.service";

export const OnboardingScreen5 = () => {
  const { data, updateData, nextStep, previousStep, error } = useOnboarding();
  const [catalog, setCatalog] = useState<Intolerance[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCatalog();
  }, []);

  const loadCatalog = async () => {
    setLoading(true);
    const { intolerances } = await getIntolerancesCatalog();
    setCatalog(intolerances);
    setLoading(false);
  };

  const toggleIntolerance = (intoleranceId: string) => {
    const exists = data.intolerances.find(
      (i) => i.intolerance_id === intoleranceId
    );

    if (exists) {
      // Remove
      updateData({
        intolerances: data.intolerances.filter(
          (i) => i.intolerance_id !== intoleranceId
        ),
      });
    } else {
      // Add with default severity
      updateData({
        intolerances: [
          ...data.intolerances,
          { intolerance_id: intoleranceId, severity: "moderate" },
        ],
      });
    }
  };

  const updateSeverity = (intoleranceId: string, severity: string) => {
    updateData({
      intolerances: data.intolerances.map((i) =>
        i.intolerance_id === intoleranceId
          ? { ...i, severity: severity as any }
          : i
      ),
    });
  };

  const skip = () => {
    updateData({ intolerances: [] });
    nextStep();
  };

  return (
    <ScrollView>
      <ProgressBar progress={(5 / 6) * 100} />

      <Text style={styles.step}>Schritt 5 von 6</Text>
      <Text style={styles.title}>Unverträglichkeiten</Text>
      <Text style={styles.subtitle}>
        Optional: Hilft uns bei der Ernährungsplanung
      </Text>

      {loading ? (
        <ActivityIndicator />
      ) : (
        catalog.map((intolerance) => {
          const selected = data.intolerances.find(
            (i) => i.intolerance_id === intolerance.id
          );

          return (
            <View key={intolerance.id}>
              <IntoleranceItem
                name={intolerance.name}
                description={intolerance.description}
                selected={!!selected}
                onToggle={() => toggleIntolerance(intolerance.id)}
              />

              {selected && (
                <SeverityPicker
                  value={selected.severity}
                  onChange={(severity) =>
                    updateSeverity(intolerance.id, severity)
                  }
                />
              )}
            </View>
          );
        })
      )}

      {error && <ErrorMessage message={error} />}

      <View style={styles.buttonRow}>
        <Button
          title="Zurück"
          variant="outline"
          onPress={previousStep}
          style={styles.backButton}
        />
        <Button
          title="Überspringen"
          variant="text"
          onPress={skip}
          style={styles.skipButton}
        />
        <Button title="Weiter" onPress={nextStep} style={styles.nextButton} />
      </View>
    </ScrollView>
  );
};
```

---

## Screen 6: Zusammenfassung

**File**: `src/screens/onboarding/OnboardingSummary.tsx`

### Purpose

- Review all entered data
- Edit button for each section (go back to that screen)
- Submit button to save everything

### Layout Example

```typescript
export const OnboardingSummary = () => {
  const navigation = useNavigation();
  const { data, submitOnboarding, isSubmitting, error, goToStep } =
    useOnboarding();

  const handleSubmit = async () => {
    try {
      await submitOnboarding();
      // Navigate to home or training plan generation
      navigation.replace("Home");
    } catch (error) {
      // Error is handled in context
    }
  };

  return (
    <ScrollView>
      <ProgressBar progress={100} />

      <Text style={styles.title}>Fast geschafft! 🎉</Text>
      <Text style={styles.subtitle}>
        Überprüfe deine Angaben bevor wir deinen Plan erstellen
      </Text>

      <SummaryCard title="Basisdaten" onEdit={() => goToStep(1)}>
        <SummaryRow label="Alter" value={`${data.age} Jahre`} />
        <SummaryRow label="Gewicht" value={`${data.weight} kg`} />
        <SummaryRow label="Größe" value={`${data.height} cm`} />
        <SummaryRow label="Geschlecht" value={getGenderLabel(data.gender)} />
      </SummaryCard>

      <SummaryCard title="Training" onEdit={() => goToStep(2)}>
        <SummaryRow
          label="Level"
          value={getFitnessLevelLabel(data.fitness_level)}
        />
        <SummaryRow
          label="Erfahrung"
          value={`${data.training_experience_months} Monate`}
        />
        <SummaryRow
          label="Tage/Woche"
          value={`${data.available_training_days} Tage`}
        />
        <SummaryRow
          label="Gym-Zugang"
          value={data.has_gym_access ? "Ja" : "Nein"}
        />
        {!data.has_gym_access && data.home_equipment.length > 0 && (
          <SummaryRow
            label="Equipment"
            value={data.home_equipment.join(", ")}
          />
        )}
      </SummaryCard>

      <SummaryCard title="Ziel" onEdit={() => goToStep(3)}>
        <SummaryRow
          label="Primäres Ziel"
          value={getGoalLabel(data.primary_goal)}
        />
      </SummaryCard>

      <SummaryCard title="Lifestyle" onEdit={() => goToStep(4)}>
        <SummaryRow label="Schlaf" value={`${data.sleep_hours_avg} Stunden`} />
        <SummaryRow label="Stress" value={`${data.stress_level} / 10`} />
      </SummaryCard>

      {data.intolerances.length > 0 && (
        <SummaryCard title="Unverträglichkeiten" onEdit={() => goToStep(5)}>
          {data.intolerances.map((int, idx) => (
            <SummaryRow
              key={idx}
              label={getIntoleranceName(int.intolerance_id)}
              value={getSeverityLabel(int.severity)}
            />
          ))}
        </SummaryCard>
      )}

      {error && <ErrorMessage message={error} />}

      <Button
        title="Profil erstellen"
        onPress={handleSubmit}
        loading={isSubmitting}
        disabled={isSubmitting}
        style={styles.submitButton}
      />

      <Button
        title="Zurück"
        variant="text"
        onPress={() => goToStep(5)}
        disabled={isSubmitting}
      />
    </ScrollView>
  );
};
```

---

## Required Custom Components

These components should be created if not already available:

### 1. ProgressBar

```typescript
// src/components/ui/ProgressBar.tsx
interface ProgressBarProps {
  progress: number; // 0-100
}
```

### 2. RadioGroup

```typescript
// src/components/ui/RadioGroup.tsx
interface RadioGroupProps {
  options: Array<{ label: string; value: string }>;
  selected: string | null;
  onSelect: (value: string) => void;
}
```

### 3. NumberPicker

```typescript
// src/components/ui/NumberPicker.tsx
interface NumberPickerProps {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange: (value: number) => void;
}
```

### 4. MultiSelectChips

```typescript
// src/components/ui/MultiSelectChips.tsx
interface MultiSelectChipsProps {
  options: string[];
  labels: Record<string, string>;
  selected: string[];
  onSelectionChange: (selected: string[]) => void;
}
```

### 5. GoalCard

```typescript
// src/components/ui/GoalCard.tsx
interface GoalCardProps {
  label: string;
  description: string;
  icon: string;
  selected: boolean;
  onPress: () => void;
}
```

---

## Code Quality Requirements

✅ **Must Have**:

- TypeScript strict mode
- UseOnboarding hook in every screen
- Progress bar showing current step
- Back button (except screen 1)
- Error display
- Loading states
- Keyboard handling (dismiss on submit)
- ScrollView for all screens
- Proper validation before next

❌ **Avoid**:

- Hardcoded step numbers
- Direct state mutation
- Missing error handling
- No loading states
- Broken navigation

## Output Format

For each screen, provide:

1. Complete TypeScript code
2. All imports
3. Proper hooks usage
4. StyleSheet at bottom
5. Comments for complex logic
6. Accessibility labels

## Success Criteria

- ✅ All 6 screens work
- ✅ Navigation flows smoothly
- ✅ Validation prevents invalid data
- ✅ Progress indicator updates
- ✅ Context state persists
- ✅ Submit saves to Supabase
- ✅ Clean, typed code
- ✅ User-friendly UX
