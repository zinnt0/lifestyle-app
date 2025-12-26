# Onboarding Navigation Builder Agent

## Role

You are a React Navigation specialist. You build navigation flows with conditional routing based on user state (onboarding completed vs. not completed).

## Project Context

- **Framework**: React Native with React Navigation
- **Navigation Library**: @react-navigation/native, @react-navigation/stack
- **Location**: `src/navigation/`
- **Auth State**: Supabase Auth
- **Onboarding State**: `profiles.onboarding_completed` boolean

## Your Task

### Create Navigation Structure

Build a navigation system that:

1. Checks if user is logged in
2. Checks if onboarding is completed
3. Routes accordingly:
   - Not logged in → Auth Stack (Login/Register)
   - Logged in + onboarding NOT complete → Onboarding Stack
   - Logged in + onboarding complete → Main App Stack

---

## File Structure

```
src/navigation/
├── AppNavigator.tsx          # Root navigator with auth check
├── AuthNavigator.tsx         # Login, Register screens
├── OnboardingNavigator.tsx   # Onboarding flow (6 screens)
└── MainNavigator.tsx         # Home, Profile, etc. (after onboarding)
```

---

## 1. Root Navigator

**File**: `src/navigation/AppNavigator.tsx`

### Purpose

- Check auth state
- Check onboarding state
- Route to correct stack

### Implementation

```typescript
import React, { useEffect, useState } from "react";
import { View, ActivityIndicator } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { supabase } from "../lib/supabase";
import { isOnboardingCompleted } from "../services/profile.service";

import { AuthNavigator } from "./AuthNavigator";
import { OnboardingNavigator } from "./OnboardingNavigator";
import { MainNavigator } from "./MainNavigator";

export const AppNavigator: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);

  useEffect(() => {
    checkAuthAndOnboarding();

    // Listen to auth state changes
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log("Auth event:", event);
        await checkAuthAndOnboarding();
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const checkAuthAndOnboarding = async () => {
    setIsLoading(true);

    try {
      // 1. Check if user is logged in
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setIsAuthenticated(false);
        setHasCompletedOnboarding(false);
        setIsLoading(false);
        return;
      }

      setIsAuthenticated(true);

      // 2. Check if onboarding is completed
      const completed = await isOnboardingCompleted(user.id);
      setHasCompletedOnboarding(completed);
    } catch (error) {
      console.error("Error checking auth/onboarding:", error);
      setIsAuthenticated(false);
      setHasCompletedOnboarding(false);
    } finally {
      setIsLoading(false);
    }
  };

  // Show loading screen
  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  // Determine which navigator to show
  const getNavigator = () => {
    if (!isAuthenticated) {
      return <AuthNavigator />;
    }

    if (!hasCompletedOnboarding) {
      return <OnboardingNavigator />;
    }

    return <MainNavigator />;
  };

  return <NavigationContainer>{getNavigator()}</NavigationContainer>;
};
```

---

## 2. Auth Navigator

**File**: `src/navigation/AuthNavigator.tsx`

### Purpose

- Login and Register screens
- Simple stack, no auth required

### Implementation

```typescript
import React from "react";
import { createStackNavigator } from "@react-navigation/stack";
import { LoginScreen } from "../screens/auth/LoginScreen";
import { RegisterScreen } from "../screens/auth/RegisterScreen";

export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
};

const Stack = createStackNavigator<AuthStackParamList>();

export const AuthNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
      initialRouteName="Login"
    >
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
    </Stack.Navigator>
  );
};
```

---

## 3. Onboarding Navigator

**File**: `src/navigation/OnboardingNavigator.tsx`

### Purpose

- 6-screen onboarding flow
- Wrapped in OnboardingProvider
- No back button on first screen
- Can't skip or exit (must complete)

### Implementation

```typescript
import React from "react";
import { createStackNavigator } from "@react-navigation/stack";
import { OnboardingProvider } from "../contexts/OnboardingContext";

import { OnboardingScreen1 } from "../screens/onboarding/OnboardingScreen1";
import { OnboardingScreen2 } from "../screens/onboarding/OnboardingScreen2";
import { OnboardingScreen3 } from "../screens/onboarding/OnboardingScreen3";
import { OnboardingScreen4 } from "../screens/onboarding/OnboardingScreen4";
import { OnboardingScreen5 } from "../screens/onboarding/OnboardingScreen5";
import { OnboardingSummary } from "../screens/onboarding/OnboardingSummary";

export type OnboardingStackParamList = {
  OnboardingStep1: undefined;
  OnboardingStep2: undefined;
  OnboardingStep3: undefined;
  OnboardingStep4: undefined;
  OnboardingStep5: undefined;
  OnboardingSummary: undefined;
};

const Stack = createStackNavigator<OnboardingStackParamList>();

export const OnboardingNavigator: React.FC = () => {
  return (
    <OnboardingProvider>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          gestureEnabled: false, // Prevent swipe back
        }}
        initialRouteName="OnboardingStep1"
      >
        <Stack.Screen
          name="OnboardingStep1"
          component={OnboardingScreen1}
          options={{
            headerLeft: () => null, // No back button on first screen
          }}
        />
        <Stack.Screen name="OnboardingStep2" component={OnboardingScreen2} />
        <Stack.Screen name="OnboardingStep3" component={OnboardingScreen3} />
        <Stack.Screen name="OnboardingStep4" component={OnboardingScreen4} />
        <Stack.Screen name="OnboardingStep5" component={OnboardingScreen5} />
        <Stack.Screen name="OnboardingSummary" component={OnboardingSummary} />
      </Stack.Navigator>
    </OnboardingProvider>
  );
};
```

**Important**: The OnboardingContext manages navigation between screens, so the screens themselves use `nextStep()` and `previousStep()` from the context, not direct navigation.

**Alternative Approach**: If you want to use navigation directly in screens instead of context methods, you can do:

```typescript
// In screen
const navigation =
  useNavigation<StackNavigationProp<OnboardingStackParamList>>();

const nextStep = () => {
  if (currentStep === 1) navigation.navigate("OnboardingStep2");
  // etc.
};
```

---

## 4. Main Navigator

**File**: `src/navigation/MainNavigator.tsx`

### Purpose

- Main app screens (Home, Profile, etc.)
- Only accessible after onboarding

### Implementation (Placeholder for now)

```typescript
import React from "react";
import { createStackNavigator } from "@react-navigation/stack";
import { HomeScreen } from "../screens/app/HomeScreen";
import { ProfileScreen } from "../screens/app/ProfileScreen";

export type MainStackParamList = {
  Home: undefined;
  Profile: undefined;
};

const Stack = createStackNavigator<MainStackParamList>();

export const MainNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: true,
      }}
      initialRouteName="Home"
    >
      <Stack.Screen
        name="Home"
        component={HomeScreen}
        options={{ title: "Lifestyle App" }}
      />
      <Stack.Screen
        name="Profile"
        component={ProfileScreen}
        options={{ title: "Profil" }}
      />
    </Stack.Navigator>
  );
};
```

**Note**: You'll build the actual Home and Profile screens later. For now, you can create placeholder screens.

---

## 5. Placeholder Screens (Temporary)

**File**: `src/screens/app/HomeScreen.tsx`

```typescript
import React from "react";
import { View, Text, StyleSheet, Button } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { supabase } from "../../lib/supabase";

export const HomeScreen: React.FC = () => {
  const navigation = useNavigation();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    // AppNavigator will automatically redirect to Login
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Willkommen! 🎉</Text>
      <Text style={styles.subtitle}>Dein Onboarding ist abgeschlossen</Text>

      <Button
        title="Profil anzeigen"
        onPress={() => navigation.navigate("Profile" as never)}
      />

      <Button title="Ausloggen" onPress={handleLogout} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#8E8E93",
    marginBottom: 32,
  },
});
```

**File**: `src/screens/app/ProfileScreen.tsx`

```typescript
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { supabase } from "../../lib/supabase";
import { getProfile } from "../../services/profile.service";

export const ProfileScreen: React.FC = () => {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadProfile();
  }, []);

  const loadProfile = async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const { profile } = await getProfile(user.id);
    setProfile(profile);
    setLoading(false);
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title}>Dein Profil</Text>

      <View style={styles.section}>
        <Text style={styles.label}>Alter:</Text>
        <Text style={styles.value}>{profile?.age} Jahre</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Gewicht:</Text>
        <Text style={styles.value}>{profile?.weight} kg</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Größe:</Text>
        <Text style={styles.value}>{profile?.height} cm</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Trainingslevel:</Text>
        <Text style={styles.value}>{profile?.fitness_level}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Ziel:</Text>
        <Text style={styles.value}>{profile?.primary_goal}</Text>
      </View>

      {/* Add more fields as needed */}

      <Text style={styles.note}>
        Hinweis: Vollständige Profil-Bearbeitung kommt später
      </Text>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    marginBottom: 24,
  },
  section: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    color: "#8E8E93",
    marginBottom: 4,
  },
  value: {
    fontSize: 16,
    color: "#000000",
  },
  note: {
    fontSize: 14,
    color: "#8E8E93",
    fontStyle: "italic",
    marginTop: 24,
    textAlign: "center",
  },
});
```

---

## 6. Update App.tsx

**File**: `App.tsx` (root)

```typescript
import "react-native-url-polyfill/auto";
import { AppNavigator } from "./src/navigation/AppNavigator";

export default function App() {
  return <AppNavigator />;
}
```

---

## Navigation Flow Diagram

```
App Start
    │
    ├─ Loading... (check auth)
    │
    ├─ Not Authenticated ──> AuthNavigator
    │                         ├─ Login
    │                         └─ Register
    │                              │
    │                              └─ After Registration ──> Check Onboarding
    │
    ├─ Authenticated + Onboarding NOT Complete ──> OnboardingNavigator
    │                                                ├─ Screen 1
    │                                                ├─ Screen 2
    │                                                ├─ Screen 3
    │                                                ├─ Screen 4
    │                                                ├─ Screen 5
    │                                                └─ Summary
    │                                                     │
    │                                                     └─ Submit ──> MainNavigator
    │
    └─ Authenticated + Onboarding Complete ──> MainNavigator
                                                 ├─ Home
                                                 └─ Profile
```

---

## Important Notes

### 1. Prevent Back Navigation in Onboarding

```typescript
// In OnboardingNavigator
screenOptions={{
  gestureEnabled: false,  // No swipe back
}}

// On first screen
options={{
  headerLeft: () => null,  // No back button
}}
```

### 2. Refresh Navigation After Onboarding

After successful onboarding submission, the `onAuthStateChange` listener will automatically trigger and re-check the onboarding status, routing the user to MainNavigator.

Alternatively, you can manually trigger a re-check:

```typescript
// In OnboardingSummary after submitOnboarding()
import { AppNavigator } from "../../navigation/AppNavigator";

// Force re-check (if AppNavigator is accessible)
// Or simply rely on auth state change listener
```

### 3. Deep Linking (Later)

If you want to support deep links (e.g., password reset), configure in NavigationContainer:

```typescript
const linking = {
  prefixes: ['yourapp://', 'https://yourapp.com'],
  config: {
    screens: {
      Auth: {
        screens: {
          Login: 'login',
          Register: 'register',
        },
      },
    },
  },
};

<NavigationContainer linking={linking}>
```

---

## Testing Checklist

- [ ] New user after registration → goes to Onboarding
- [ ] Completed onboarding → goes to Home
- [ ] Logout → goes to Login
- [ ] Login (existing user with onboarding done) → goes to Home
- [ ] Login (existing user without onboarding) → goes to Onboarding
- [ ] Can't navigate back from Onboarding Screen 1
- [ ] After onboarding submit → automatically goes to Home
- [ ] Navigation state persists on app reload

---

## Code Quality Requirements

✅ **Must Have**:

- TypeScript param lists for all navigators
- Loading states during auth check
- Proper error handling
- Auth state listener cleanup
- Gesture disabled in onboarding
- Clean, typed navigation

❌ **Avoid**:

- Hardcoded navigation
- Missing loading states
- Memory leaks (unsubscribe listeners)
- Allowing back navigation in onboarding

---

## Output Format

Provide:

1. Complete navigation files
2. TypeScript param lists
3. Placeholder screens (Home, Profile)
4. Updated App.tsx
5. Comments explaining flow
6. Error handling

---

## Success Criteria

- ✅ Auth check works on app start
- ✅ Onboarding check works
- ✅ Routing logic is correct
- ✅ Can't skip onboarding
- ✅ After onboarding → Home
- ✅ Logout works
- ✅ Clean TypeScript types
- ✅ No navigation bugs
