# Onboarding Context Builder Agent

## Role

You are a React Context specialist for multi-step forms. You build type-safe, efficient state management for onboarding flows with validation and persistence.

## Project Context

- **Framework**: React Native (Expo) with TypeScript
- **State Management**: React Context API (no Redux/Zustand for MVP)
- **Location**: `src/contexts/OnboardingContext.tsx`
- **Flow**: 6-screen multi-step form
- **Persistence**: Save to Supabase at the end

## Your Task

### Create Onboarding Context

**File**: `src/contexts/OnboardingContext.tsx`

**Features**:

- Store all onboarding data across screens
- Track current step (1-6)
- Navigate between steps
- Validate each step before proceeding
- Submit all data to Supabase at the end
- TypeScript strict typing

## Data Structure

### Onboarding Data Interface

```typescript
interface OnboardingData {
  // Screen 1: Basisdaten
  age: number | null;
  weight: number | null; // kg
  height: number | null; // cm
  gender: "male" | "female" | "other" | null;

  // Screen 2: Trainingserfahrung
  fitness_level: "beginner" | "intermediate" | "advanced" | null;
  training_experience_months: number | null;
  available_training_days: number | null; // 1-7
  has_gym_access: boolean;
  home_equipment: string[]; // ['barbell', 'dumbbells', ...]

  // Screen 3: Ziele
  primary_goal:
    | "strength"
    | "hypertrophy"
    | "endurance"
    | "weight_loss"
    | "general_fitness"
    | null;

  // Screen 4: Lifestyle
  sleep_hours_avg: number | null; // 6.5, 7.0, etc.
  stress_level: number | null; // 1-10

  // Screen 5: Unverträglichkeiten (optional)
  intolerances: Array<{
    intolerance_id: string;
    severity: "mild" | "moderate" | "severe" | "life_threatening";
  }>;
}
```

## Context Interface

```typescript
interface OnboardingContextType {
  // State
  data: OnboardingData;
  currentStep: number;
  totalSteps: number;
  isSubmitting: boolean;
  error: string | null;

  // Actions
  updateData: (updates: Partial<OnboardingData>) => void;
  nextStep: () => void;
  previousStep: () => void;
  goToStep: (step: number) => void;
  submitOnboarding: () => Promise<void>;

  // Validation
  isStepValid: (step: number) => boolean;
  getStepErrors: (step: number) => string[];
}
```

## Implementation Requirements

### 1. Initial State

```typescript
const initialData: OnboardingData = {
  // Screen 1
  age: null,
  weight: null,
  height: null,
  gender: null,

  // Screen 2
  fitness_level: null,
  training_experience_months: null,
  available_training_days: null,
  has_gym_access: true,
  home_equipment: [],

  // Screen 3
  primary_goal: null,

  // Screen 4
  sleep_hours_avg: null,
  stress_level: null,

  // Screen 5
  intolerances: [],
};
```

### 2. Step Validation Rules

**Screen 1: Basisdaten**

- Age: required, 13-120
- Weight: required, > 0
- Height: required, > 0
- Gender: required

**Screen 2: Trainingserfahrung**

- Fitness level: required
- Training experience: optional (can be 0)
- Available training days: required, 1-7
- Gym access: always has value (default true)
- Home equipment: optional (can be empty)

**Screen 3: Ziele**

- Primary goal: required

**Screen 4: Lifestyle**

- Sleep hours: required, 3-12
- Stress level: required, 1-10

**Screen 5: Unverträglichkeiten**

- Optional screen (can be empty)

**Screen 6: Zusammenfassung**

- No validation (just review)

### 3. Context Provider

```typescript
export const OnboardingProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [data, setData] = useState<OnboardingData>(initialData);
  const [currentStep, setCurrentStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const totalSteps = 6;

  const updateData = (updates: Partial<OnboardingData>) => {
    setData((prev) => ({ ...prev, ...updates }));
  };

  const isStepValid = (step: number): boolean => {
    // Validation logic per step
  };

  const getStepErrors = (step: number): string[] => {
    // Return array of error messages
  };

  const nextStep = () => {
    if (!isStepValid(currentStep)) {
      const errors = getStepErrors(currentStep);
      setError(errors[0]); // Show first error
      return;
    }

    if (currentStep < totalSteps) {
      setCurrentStep((prev) => prev + 1);
      setError(null);
    }
  };

  const previousStep = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => prev - 1);
      setError(null);
    }
  };

  const goToStep = (step: number) => {
    if (step >= 1 && step <= totalSteps) {
      setCurrentStep(step);
    }
  };

  const submitOnboarding = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      // Get current user
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Nicht angemeldet");

      // Save profile
      await createProfile(user.id, data);

      // Navigate to home (done in screen)
    } catch (err: any) {
      setError(err.message || "Fehler beim Speichern");
      throw err;
    } finally {
      setIsSubmitting(false);
    }
  };

  const value: OnboardingContextType = {
    data,
    currentStep,
    totalSteps,
    isSubmitting,
    error,
    updateData,
    nextStep,
    previousStep,
    goToStep,
    submitOnboarding,
    isStepValid,
    getStepErrors,
  };

  return (
    <OnboardingContext.Provider value={value}>
      {children}
    </OnboardingContext.Provider>
  );
};
```

### 4. Custom Hook

```typescript
export const useOnboarding = () => {
  const context = useContext(OnboardingContext);
  if (!context) {
    throw new Error("useOnboarding must be used within OnboardingProvider");
  }
  return context;
};
```

## Validation Logic (Detailed)

### isStepValid(step: number)

```typescript
const isStepValid = (step: number): boolean => {
  switch (step) {
    case 1:
      return !!(
        data.age &&
        data.age >= 13 &&
        data.age <= 120 &&
        data.weight &&
        data.weight > 0 &&
        data.height &&
        data.height > 0 &&
        data.gender
      );

    case 2:
      return !!(
        data.fitness_level &&
        data.training_experience_months !== null &&
        data.available_training_days &&
        data.available_training_days >= 1 &&
        data.available_training_days <= 7
      );

    case 3:
      return !!data.primary_goal;

    case 4:
      return !!(
        data.sleep_hours_avg &&
        data.sleep_hours_avg >= 3 &&
        data.sleep_hours_avg <= 12 &&
        data.stress_level &&
        data.stress_level >= 1 &&
        data.stress_level <= 10
      );

    case 5:
      // Optional screen, always valid
      return true;

    case 6:
      // Summary screen, check all previous steps
      return (
        isStepValid(1) && isStepValid(2) && isStepValid(3) && isStepValid(4)
      );

    default:
      return false;
  }
};
```

### getStepErrors(step: number)

```typescript
const getStepErrors = (step: number): string[] => {
  const errors: string[] = [];

  switch (step) {
    case 1:
      if (!data.age) errors.push("Alter ist erforderlich");
      else if (data.age < 13)
        errors.push("Du musst mindestens 13 Jahre alt sein");
      else if (data.age > 120) errors.push("Bitte gib ein gültiges Alter ein");

      if (!data.weight) errors.push("Gewicht ist erforderlich");
      else if (data.weight <= 0) errors.push("Gewicht muss größer als 0 sein");

      if (!data.height) errors.push("Größe ist erforderlich");
      else if (data.height <= 0) errors.push("Größe muss größer als 0 sein");

      if (!data.gender) errors.push("Geschlecht ist erforderlich");
      break;

    case 2:
      if (!data.fitness_level) errors.push("Trainingslevel ist erforderlich");
      if (data.training_experience_months === null) {
        errors.push("Trainingserfahrung ist erforderlich");
      }
      if (!data.available_training_days) {
        errors.push("Verfügbare Trainingstage sind erforderlich");
      } else if (
        data.available_training_days < 1 ||
        data.available_training_days > 7
      ) {
        errors.push("Trainingstage müssen zwischen 1 und 7 liegen");
      }
      break;

    case 3:
      if (!data.primary_goal) errors.push("Trainingsziel ist erforderlich");
      break;

    case 4:
      if (!data.sleep_hours_avg) {
        errors.push("Durchschnittliche Schlafstunden sind erforderlich");
      } else if (data.sleep_hours_avg < 3 || data.sleep_hours_avg > 12) {
        errors.push("Schlafstunden müssen zwischen 3 und 12 liegen");
      }

      if (!data.stress_level) {
        errors.push("Stress-Level ist erforderlich");
      } else if (data.stress_level < 1 || data.stress_level > 10) {
        errors.push("Stress-Level muss zwischen 1 und 10 liegen");
      }
      break;
  }

  return errors;
};
```

## Progress Calculation

```typescript
const getProgress = (): number => {
  return (currentStep / totalSteps) * 100;
};

// Add to context return
return {
  ...otherValues,
  progress: getProgress(),
};
```

## Code Quality Requirements

✅ **Must Have**:

- TypeScript strict typing
- Validation before step change
- Clear error messages (German)
- Immutable state updates
- Loading states
- Error handling

❌ **Avoid**:

- Mutating state directly
- Missing validation
- No error handling
- Any types
- Uncontrolled side effects

## Example Usage in Screen

```typescript
// In OnboardingScreen1.tsx
import { useOnboarding } from "../../contexts/OnboardingContext";

export const OnboardingScreen1 = () => {
  const { data, updateData, nextStep, error } = useOnboarding();

  return (
    <View>
      <Input
        label="Alter"
        value={data.age?.toString() || ""}
        onChangeText={(text) => updateData({ age: parseInt(text) || null })}
        keyboardType="number-pad"
      />

      {error && <Text style={styles.error}>{error}</Text>}

      <Button title="Weiter" onPress={nextStep} />
    </View>
  );
};
```

## Testing Checklist

- [ ] Context provides all values
- [ ] updateData updates state correctly
- [ ] Validation works for each step
- [ ] nextStep validates before proceeding
- [ ] previousStep navigates back
- [ ] Error messages are clear (German)
- [ ] submitOnboarding calls profile service
- [ ] Loading states work
- [ ] TypeScript has no errors

## Output Format

Provide:

1. Complete `OnboardingContext.tsx` with all functionality
2. Full TypeScript interfaces
3. All validation logic implemented
4. German error messages
5. JSDoc comments for complex functions
6. Example usage in comments

## Success Criteria

- ✅ Type-safe context
- ✅ Step validation works
- ✅ Data persists across steps
- ✅ Clear error messages
- ✅ Ready for use in screens
- ✅ No prop drilling needed
- ✅ Clean, maintainable code
