# Training Navigation Builder Agent

## Zweck

Erstellt die Navigation-Struktur für die Trainings-Sektion und integriert sie in die bestehende App-Navigation.

## Kontext

Du arbeitest an der Lifestyle App (React Native + Expo). Die App verwendet React Navigation mit:

- Bottom Tab Navigator (Hauptnavigation: Home, Training, Ernährung, Mehr)
- Stack Navigator pro Tab
- TypeScript für Type-Safe Navigation

Die Trainings-Sektion benötigt ihre eigene Stack-Navigation mit mehreren Screens.

## Dein Auftrag

### 1. Training Stack Navigator

**Datei:** `src/navigation/TrainingStackNavigator.tsx`

```typescript
import React from "react";
import { createStackNavigator } from "@react-navigation/stack";
import type { StackScreenProps } from "@react-navigation/stack";

// Import Screens
import TrainingDashboardScreen from "@/screens/training/TrainingDashboardScreen";
import PlanConfigurationScreen from "@/screens/training/PlanConfigurationScreen";
import GuidedPlanFlowScreen from "@/screens/training/GuidedPlanFlowScreen";
import CustomPlanFlowScreen from "@/screens/training/CustomPlanFlowScreen";
import TrainingPlanDetailScreen from "@/screens/training/TrainingPlanDetailScreen";
import WorkoutSessionScreen from "@/screens/training/WorkoutSessionScreen";
import WorkoutSummaryScreen from "@/screens/training/WorkoutSummaryScreen";

// Type-safe navigation params
export type TrainingStackParamList = {
  TrainingDashboard: undefined;
  PlanConfiguration: undefined;
  GuidedPlanFlow: undefined;
  CustomPlanFlow: undefined;
  TrainingPlanDetail: { planId: string };
  WorkoutSession: { sessionId: string };
  WorkoutSummary: { sessionId: string };
};

export type TrainingDashboardScreenProps = StackScreenProps<
  TrainingStackParamList,
  "TrainingDashboard"
>;

export type PlanConfigurationScreenProps = StackScreenProps<
  TrainingStackParamList,
  "PlanConfiguration"
>;

export type GuidedPlanFlowScreenProps = StackScreenProps<
  TrainingStackParamList,
  "GuidedPlanFlow"
>;

export type CustomPlanFlowScreenProps = StackScreenProps<
  TrainingStackParamList,
  "CustomPlanFlow"
>;

export type TrainingPlanDetailScreenProps = StackScreenProps<
  TrainingStackParamList,
  "TrainingPlanDetail"
>;

export type WorkoutSessionScreenProps = StackScreenProps<
  TrainingStackParamList,
  "WorkoutSession"
>;

export type WorkoutSummaryScreenProps = StackScreenProps<
  TrainingStackParamList,
  "WorkoutSummary"
>;

const Stack = createStackNavigator<TrainingStackParamList>();

export const TrainingStackNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      initialRouteName="TrainingDashboard"
      screenOptions={{
        headerStyle: {
          backgroundColor: "#fff",
          elevation: 0,
          shadowOpacity: 0,
          borderBottomWidth: 1,
          borderBottomColor: "#e0e0e0",
        },
        headerTintColor: "#333",
        headerTitleStyle: {
          fontWeight: "600",
          fontSize: 18,
        },
        headerBackTitleVisible: false,
        gestureEnabled: true,
        cardStyleInterpolator: ({ current, layouts }) => {
          return {
            cardStyle: {
              transform: [
                {
                  translateX: current.progress.interpolate({
                    inputRange: [0, 1],
                    outputRange: [layouts.screen.width, 0],
                  }),
                },
              ],
            },
          };
        },
      }}
    >
      <Stack.Screen
        name="TrainingDashboard"
        component={TrainingDashboardScreen}
        options={{
          title: "Trainings-Dashboard",
          headerShown: true,
        }}
      />

      <Stack.Screen
        name="PlanConfiguration"
        component={PlanConfigurationScreen}
        options={{
          title: "Plan konfigurieren",
          headerShown: true,
        }}
      />

      <Stack.Screen
        name="GuidedPlanFlow"
        component={GuidedPlanFlowScreen}
        options={{
          title: "Plan erstellen",
          headerShown: true,
        }}
      />

      <Stack.Screen
        name="CustomPlanFlow"
        component={CustomPlanFlowScreen}
        options={{
          title: "Eigener Plan",
          headerShown: true,
        }}
      />

      <Stack.Screen
        name="TrainingPlanDetail"
        component={TrainingPlanDetailScreen}
        options={({ route }) => ({
          title: "Trainingsplan",
          headerShown: true,
        })}
      />

      <Stack.Screen
        name="WorkoutSession"
        component={WorkoutSessionScreen}
        options={{
          title: "Workout",
          headerShown: true,
          // Prevent swipe-back während Training
          gestureEnabled: false,
          // Custom close button
          headerRight: () => (
            <TouchableOpacity
              onPress={() => {
                Alert.alert(
                  "Workout beenden?",
                  "Möchtest du das Workout wirklich beenden? Dein Fortschritt wird gespeichert.",
                  [
                    { text: "Abbrechen", style: "cancel" },
                    {
                      text: "Beenden",
                      style: "destructive",
                      onPress: () => navigation.goBack(),
                    },
                  ]
                );
              }}
              style={{ paddingRight: 16 }}
            >
              <Icon name="x" size={24} color="#333" />
            </TouchableOpacity>
          ),
        }}
      />

      <Stack.Screen
        name="WorkoutSummary"
        component={WorkoutSummaryScreen}
        options={{
          title: "Zusammenfassung",
          headerShown: true,
          // Prevent going back to workout
          gestureEnabled: false,
          headerLeft: () => null,
        }}
      />
    </Stack.Navigator>
  );
};
```

### 2. Integration in Tab Navigator

**Datei:** `src/navigation/TabNavigator.tsx` (Update)

```typescript
import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { TrainingStackNavigator } from "./TrainingStackNavigator";

// ... andere Imports

const Tab = createBottomTabNavigator();

export const TabNavigator: React.FC = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#4A90E2",
        tabBarInactiveTintColor: "#999",
        tabBarStyle: {
          borderTopWidth: 1,
          borderTopColor: "#e0e0e0",
          height: 60,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "600",
        },
      }}
    >
      {/* Home Tab */}
      <Tab.Screen
        name="HomeTab"
        component={HomeStackNavigator}
        options={{
          tabBarLabel: "Home",
          tabBarIcon: ({ color, size }) => (
            <Icon name="home" size={size} color={color} />
          ),
        }}
      />

      {/* Training Tab */}
      <Tab.Screen
        name="TrainingTab"
        component={TrainingStackNavigator}
        options={{
          tabBarLabel: "Training",
          tabBarIcon: ({ color, size }) => (
            <Icon name="dumbbell" size={size} color={color} />
          ),
          // Badge für aktive Session
          tabBarBadge: hasActiveSession ? "!" : undefined,
        }}
      />

      {/* ... andere Tabs */}
    </Tab.Navigator>
  );
};
```

### 3. Navigation Helper Hook

**Datei:** `src/hooks/useTrainingNavigation.ts`

```typescript
import { useNavigation } from "@react-navigation/native";
import type { StackNavigationProp } from "@react-navigation/stack";
import type { TrainingStackParamList } from "@/navigation/TrainingStackNavigator";

type TrainingNavigationProp = StackNavigationProp<TrainingStackParamList>;

export const useTrainingNavigation = () => {
  return useNavigation<TrainingNavigationProp>();
};

// Usage in components:
// const navigation = useTrainingNavigation();
// navigation.navigate('TrainingPlanDetail', { planId: '123' });
```

### 4. Deep Linking Configuration

**Datei:** `src/navigation/linkingConfiguration.ts` (Update)

```typescript
import { LinkingOptions } from "@react-navigation/native";

export const linking: LinkingOptions<ReactNavigation.RootParamList> = {
  prefixes: ["lifestyleapp://", "https://lifestyleapp.com"],
  config: {
    screens: {
      Main: {
        screens: {
          TrainingTab: {
            screens: {
              TrainingDashboard: "training",
              PlanConfiguration: "training/configure",
              TrainingPlanDetail: "training/plan/:planId",
              WorkoutSession: "training/workout/:sessionId",
            },
          },
        },
      },
    },
  },
};

// Deep link examples:
// lifestyleapp://training/plan/abc123
// lifestyleapp://training/workout/xyz789
```

### 5. Navigation Guards (Optional)

**Datei:** `src/navigation/guards/TrainingGuard.tsx`

```typescript
import React from "react";
import { Alert } from "react-native";
import { useNavigation } from "@react-navigation/native";

/**
 * Guard to prevent navigating away from active workout session
 */
export const useWorkoutSessionGuard = () => {
  const navigation = useNavigation();
  const [isSessionActive, setIsSessionActive] = React.useState(false);

  React.useEffect(() => {
    // Check if there's an active session
    const checkActiveSession = async () => {
      const session = await trainingService.getActiveSession(userId);
      setIsSessionActive(!!session);
    };

    checkActiveSession();
  }, []);

  React.useEffect(() => {
    if (!isSessionActive) return;

    // Add listener for navigation attempts
    const unsubscribe = navigation.addListener("beforeRemove", (e) => {
      // Only prevent if trying to leave WorkoutSession screen
      if (e.data.action.type !== "GO_BACK") return;

      e.preventDefault();

      Alert.alert(
        "Workout beenden?",
        "Du hast ein aktives Workout. Möchtest du wirklich beenden?",
        [
          { text: "Weitermachen", style: "cancel" },
          {
            text: "Beenden",
            style: "destructive",
            onPress: () => {
              // Save progress
              // ...
              navigation.dispatch(e.data.action);
            },
          },
        ]
      );
    });

    return unsubscribe;
  }, [isSessionActive, navigation]);
};
```

### 6. Navigation State Persistence (Optional)

**Datei:** `src/navigation/navigationPersistence.ts`

```typescript
import AsyncStorage from "@react-native-async-storage/async-storage";

const NAVIGATION_STATE_KEY = "NAVIGATION_STATE";

export const saveNavigationState = async (state: any) => {
  try {
    await AsyncStorage.setItem(NAVIGATION_STATE_KEY, JSON.stringify(state));
  } catch (e) {
    console.warn("Failed to save navigation state", e);
  }
};

export const loadNavigationState = async () => {
  try {
    const state = await AsyncStorage.getItem(NAVIGATION_STATE_KEY);
    return state ? JSON.parse(state) : undefined;
  } catch (e) {
    console.warn("Failed to load navigation state", e);
    return undefined;
  }
};

// In App.tsx:
const [initialState, setInitialState] = useState();

useEffect(() => {
  loadNavigationState().then(setInitialState);
}, []);

return (
  <NavigationContainer
    initialState={initialState}
    onStateChange={saveNavigationState}
  >
    {/* ... */}
  </NavigationContainer>
);
```

### 7. Quick Actions für Home Screen

**Datei:** `src/components/training/QuickWorkoutAction.tsx`

```typescript
import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { useTrainingNavigation } from "@/hooks/useTrainingNavigation";

interface QuickWorkoutActionProps {
  workout?: NextWorkout;
}

/**
 * Shows next workout as quick action on Home Dashboard
 */
export const QuickWorkoutAction: React.FC<QuickWorkoutActionProps> = ({
  workout,
}) => {
  const navigation = useTrainingNavigation();

  if (!workout) {
    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate("TrainingDashboard")}
      >
        <Text style={styles.title}>Noch kein Trainingsplan</Text>
        <Text style={styles.subtitle}>Erstelle jetzt deinen ersten Plan</Text>
      </TouchableOpacity>
    );
  }

  const handleStartWorkout = async () => {
    try {
      const sessionId = await trainingService.startWorkoutSession(
        userId,
        workout.plan.id,
        workout.workout.id
      );

      navigation.navigate("WorkoutSession", { sessionId });
    } catch (error) {
      Alert.alert("Fehler", "Workout konnte nicht gestartet werden.");
    }
  };

  return (
    <View style={styles.card}>
      <Text style={styles.title}>Nächstes Workout</Text>
      <Text style={styles.workoutName}>{workout.workout.name_de}</Text>
      <Text style={styles.details}>
        {workout.workout.exercises.length} Übungen •{" "}
        {workout.workout.estimated_duration} min
      </Text>

      <TouchableOpacity style={styles.button} onPress={handleStartWorkout}>
        <Text style={styles.buttonText}>▶ Workout starten</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    marginVertical: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  title: {
    fontSize: 14,
    color: "#666",
    marginBottom: 8,
  },
  workoutName: {
    fontSize: 20,
    fontWeight: "600",
    color: "#333",
    marginBottom: 4,
  },
  details: {
    fontSize: 14,
    color: "#666",
    marginBottom: 16,
  },
  button: {
    backgroundColor: "#4A90E2",
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
```

## Navigation Flow Diagramm

```
TabNavigator
  └── TrainingTab
       └── TrainingStack
            ├── TrainingDashboard (Initial)
            │    ├── → PlanConfiguration
            │    └── → TrainingPlanDetail
            │
            ├── PlanConfiguration
            │    ├── → GuidedPlanFlow
            │    └── → CustomPlanFlow
            │
            ├── GuidedPlanFlow
            │    └── → TrainingDashboard (after creation)
            │
            ├── CustomPlanFlow
            │    └── → TrainingDashboard (after creation)
            │
            ├── TrainingPlanDetail
            │    └── → WorkoutSession
            │
            ├── WorkoutSession
            │    └── → WorkoutSummary
            │
            └── WorkoutSummary
                 └── → TrainingDashboard
```

## Gestures & Animations

```typescript
// Screen Transitions
const screenOptions = {
  // Slide from right
  cardStyleInterpolator: CardStyleInterpolators.forHorizontalIOS,

  // Or custom transition:
  transitionSpec: {
    open: {
      animation: "spring",
      config: {
        stiffness: 1000,
        damping: 500,
        mass: 3,
        overshootClamping: true,
        restDisplacementThreshold: 0.01,
        restSpeedThreshold: 0.01,
      },
    },
    close: {
      animation: "spring",
      config: {
        stiffness: 1000,
        damping: 500,
        mass: 3,
        overshootClamping: true,
        restDisplacementThreshold: 0.01,
        restSpeedThreshold: 0.01,
      },
    },
  },
};
```

## Implementierungs-Checkliste

- [ ] TrainingStackNavigator mit allen Screens
- [ ] Type-safe Navigation Params
- [ ] Integration in TabNavigator
- [ ] useTrainingNavigation Hook
- [ ] Deep Linking Configuration
- [ ] Navigation Guards für aktive Sessions
- [ ] QuickWorkoutAction für Home Screen
- [ ] Screen Transitions & Animations
- [ ] Badge für aktive Session im Tab
- [ ] Back-Handler für WorkoutSession

## Testing

Teste:

1. ✅ Navigation zwischen allen Screens funktioniert
2. ✅ Type Safety (keine TypeScript Errors)
3. ✅ Back-Button Behavior ist korrekt
4. ✅ WorkoutSession kann nicht versehentlich verlassen werden
5. ✅ Deep Links funktionieren
6. ✅ Tab Badge zeigt aktive Session
7. ✅ Navigation State wird persistiert (optional)

---

**Erstellt für:** Lifestyle App Training Module
**React Native + Expo + React Navigation + TypeScript**
