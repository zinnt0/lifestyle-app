# Onboarding Screens

6-stufiger Onboarding-Flow für die Lifestyle App.

## Übersicht

Der Onboarding-Flow sammelt alle notwendigen Benutzerdaten zur Erstellung eines personalisierten Trainings- und Ernährungsplans.

### Screens

1. **OnboardingScreen1** - Basisdaten (Alter, Gewicht, Größe, Geschlecht)
2. **OnboardingScreen2** - Trainingserfahrung (Level, Tage/Woche, Equipment)
3. **OnboardingScreen3** - Ziele (Primäres Fitnessziel)
4. **OnboardingScreen4** - Lifestyle (Schlaf, Stress)
5. **OnboardingScreen5** - Unverträglichkeiten (Optional, aus Katalog)
6. **OnboardingSummary** - Zusammenfassung & Submit

## Usage

### 1. Wrap mit OnboardingProvider

```tsx
import { OnboardingProvider } from '../../contexts/OnboardingContext';
import { OnboardingScreen1 } from '../../screens/onboarding';

function OnboardingFlow() {
  return (
    <OnboardingProvider>
      <OnboardingNavigator />
    </OnboardingProvider>
  );
}
```

### 2. Navigation Setup

Der Onboarding-Flow kann mit React Navigation Stack Navigator implementiert werden:

```tsx
import { createStackNavigator } from '@react-navigation/stack';
import {
  OnboardingScreen1,
  OnboardingScreen2,
  OnboardingScreen3,
  OnboardingScreen4,
  OnboardingScreen5,
  OnboardingSummary,
} from './screens/onboarding';

const Stack = createStackNavigator();

function OnboardingNavigator() {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="OnboardingScreen1" component={OnboardingScreen1} />
      <Stack.Screen name="OnboardingScreen2" component={OnboardingScreen2} />
      <Stack.Screen name="OnboardingScreen3" component={OnboardingScreen3} />
      <Stack.Screen name="OnboardingScreen4" component={OnboardingScreen4} />
      <Stack.Screen name="OnboardingScreen5" component={OnboardingScreen5} />
      <Stack.Screen name="OnboardingSummary" component={OnboardingSummary} />
    </Stack.Navigator>
  );
}
```

### 3. Alternative: Swiper/Pagination

Oder mit einem Screen-Index-basierten Ansatz:

```tsx
import { useOnboarding } from '../../contexts/OnboardingContext';

function OnboardingContainer() {
  const { currentStep } = useOnboarding();

  const renderScreen = () => {
    switch (currentStep) {
      case 1:
        return <OnboardingScreen1 />;
      case 2:
        return <OnboardingScreen2 />;
      case 3:
        return <OnboardingScreen3 />;
      case 4:
        return <OnboardingScreen4 />;
      case 5:
        return <OnboardingScreen5 />;
      case 6:
        return <OnboardingSummary />;
      default:
        return <OnboardingScreen1 />;
    }
  };

  return <View style={{ flex: 1 }}>{renderScreen()}</View>;
}
```

## Features

### State Management

- Zentraler State in `OnboardingContext`
- Automatische Validierung pro Screen
- Progress Tracking (0-100%)
- Error Handling mit deutschen Fehlermeldungen

### Navigation

- `nextStep()` - Nächster Screen (mit Validierung)
- `previousStep()` - Zurück
- `goToStep(step)` - Direkt zu einem Screen (z.B. von Summary)

### Validation

Jeder Screen validiert seine Daten vor Navigation:

```tsx
const { nextStep, error } = useOnboarding();

// nextStep() validiert automatisch
// Bei Fehler wird error gesetzt
```

### Submission

In `OnboardingSummary` wird `submitOnboarding()` aufgerufen:

```tsx
const handleSubmit = async () => {
  try {
    await submitOnboarding();
    // Success - navigate to home
    navigation.replace('Home');
  } catch (error) {
    // Error is displayed in UI
  }
};
```

## Data Flow

1. User füllt Screen 1 aus → `updateData({ age, weight, ... })`
2. User klickt "Weiter" → `nextStep()` validiert Daten
3. Bei Fehler: Error wird angezeigt
4. Bei Success: Wechsel zu Screen 2
5. ...Prozess wiederholt sich...
6. Screen 6 (Summary): User klickt "Profil erstellen"
7. `submitOnboarding()` speichert alle Daten in Supabase
8. Navigation zu Home/Dashboard

## UI Components

Alle verwendeten UI Components sind in `src/components/ui/`:

- `ProgressBar` - Progress Indicator
- `Input` - Text Input
- `RadioGroup` - Radio Buttons
- `NumberPicker` - +/- Number Selector
- `MultiSelectChips` - Multi-Select Chips
- `GoalCard` - Large Goal Selection Card
- `Slider` - Slider mit Labels
- `Button` - Standard Button
- `Card` - Container Card

## Styling

Alle Screens verwenden:

- `KeyboardAvoidingView` für Keyboard-Handling
- `ScrollView` für scrollbare Inhalte
- Consistent spacing (SPACING constant)
- Consistent colors (COLORS constant)

## Integration mit Supabase

- Screen 5 lädt Intolerances Catalog aus `intolerances_catalog` Tabelle
- `submitOnboarding()` ruft `createProfile()` aus `profile.service.ts`
- Daten werden in `profiles` und `user_intolerances` Tabellen gespeichert

## Next Steps

Nach erfolgreichem Onboarding:

1. `onboarding_completed` wird auf `true` gesetzt
2. User wird zu Home/Dashboard navigiert
3. Trainingsplan-Generator kann gestartet werden
