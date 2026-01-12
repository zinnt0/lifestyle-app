/**
 * Supplement Stack Navigator
 * Navigation configuration for supplement tracking features
 */

import React, { useRef } from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import type { NavigationContainerRef } from "@react-navigation/native";
import { SupplementWelcomeScreen } from "../screens/Supplements/SupplementWelcomeScreen";
import { SupplementOnboardingScreen1 } from "../screens/Supplements/onboarding/SupplementOnboardingScreen1";
import { SupplementOnboardingScreen2 } from "../screens/Supplements/onboarding/SupplementOnboardingScreen2";
import { SupplementOnboardingScreen3 } from "../screens/Supplements/onboarding/SupplementOnboardingScreen3";
import { SupplementOnboardingScreen4 } from "../screens/Supplements/onboarding/SupplementOnboardingScreen4";
import { SupplementsComingSoonScreen } from "../screens/Supplements/SupplementsComingSoonScreen";
import { SupplementOnboardingProvider } from "../contexts/SupplementOnboardingContext";

export type SupplementStackParamList = {
  SupplementWelcome: undefined;
  SupplementOnboardingScreen1: undefined;
  SupplementOnboardingScreen2: undefined;
  SupplementOnboardingScreen3: undefined;
  SupplementOnboardingScreen4: undefined;
  SupplementsComingSoon: undefined;
};

const Stack = createNativeStackNavigator<SupplementStackParamList>();

export function SupplementStackNavigator() {
  const navigationRef =
    useRef<NavigationContainerRef<SupplementStackParamList>>(null);

  const handleOnboardingComplete = () => {
    // Navigate to Coming Soon screen after completing onboarding
    navigationRef.current?.navigate("SupplementsComingSoon");
  };

  return (
    <SupplementOnboardingProvider onComplete={handleOnboardingComplete}>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
        }}
        initialRouteName="SupplementWelcome"
      >
        <Stack.Screen
          name="SupplementWelcome"
          component={SupplementWelcomeScreen}
        />

        <Stack.Screen
          name="SupplementOnboardingScreen1"
          component={SupplementOnboardingScreen1}
        />

        <Stack.Screen
          name="SupplementOnboardingScreen2"
          component={SupplementOnboardingScreen2}
        />

        <Stack.Screen
          name="SupplementOnboardingScreen3"
          component={SupplementOnboardingScreen3}
        />

        <Stack.Screen
          name="SupplementOnboardingScreen4"
          component={SupplementOnboardingScreen4}
        />

        <Stack.Screen
          name="SupplementsComingSoon"
          component={SupplementsComingSoonScreen}
        />
      </Stack.Navigator>
    </SupplementOnboardingProvider>
  );
}
