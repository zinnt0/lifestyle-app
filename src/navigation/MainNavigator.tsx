/**
 * Main Navigator
 *
 * Stack navigator for main app screens (after onboarding completion).
 * Contains Home, Profile, and other app screens.
 */

import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import type { MainStackParamList } from "./types";

// Main app screens
import { HomeScreen } from "../screens/app/HomeScreen";
import { ProfileScreen } from "../screens/app/ProfileScreen";
import { ProfileEditScreen } from "../screens/app/ProfileEditScreen";
import { DailyCheckinScreen } from "../screens/app/DailyCheckinScreen";
import NutritionTestScreen from "../screens/NutritionTestScreen";
import CacheDebugScreen from "../screens/debug/CacheDebugScreen";

const Stack = createNativeStackNavigator<MainStackParamList>();

/**
 * MainNavigator Component
 *
 * Provides navigation between main app screens.
 * Only accessible after user has completed onboarding.
 */
export const MainNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: true,
        animation: "slide_from_right",
      }}
      initialRouteName="Home"
    >
      <Stack.Screen
        name="Home"
        component={HomeScreen}
        options={{
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          title: "Profil",
        }}
      />
      <Stack.Screen
        name="ProfileEdit"
        component={ProfileEditScreen}
        options={{
          title: "Profil bearbeiten",
          headerBackTitle: "Zurück",
        }}
      />
      <Stack.Screen
        name="DailyCheckin"
        component={DailyCheckinScreen}
        options={{
          title: "Tägliches Check-in",
        }}
      />
      <Stack.Screen
        name="NutritionTest"
        component={NutritionTestScreen}
        options={{
          title: "Nutrition API Test",
        }}
      />
      <Stack.Screen
        name="CacheDebug"
        component={CacheDebugScreen}
        options={{
          title: "Cache Debug",
          headerBackTitle: "Zurück",
        }}
      />
    </Stack.Navigator>
  );
};
