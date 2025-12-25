/**
 * Auth Navigator
 *
 * Stack navigator for authentication screens (Login, Register, etc.)
 * Shown when user is not authenticated.
 */

import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { LoginScreen } from "../screens/auth/LoginScreen";
import { RegisterScreen } from "../screens/auth/RegisterScreen";
import { AuthCallbackScreen } from "../screens/auth/AuthCallbackScreen";
import type { AuthStackParamList } from "./types";

const Stack = createNativeStackNavigator<AuthStackParamList>();

/**
 * AuthNavigator Component
 *
 * Provides navigation between authentication screens.
 * All screens have headers hidden for a cleaner look.
 */
export const AuthNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
        animation: "slide_from_right",
      }}
      initialRouteName="Login"
    >
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Register" component={RegisterScreen} />
      <Stack.Screen name="AuthCallback" component={AuthCallbackScreen} />
    </Stack.Navigator>
  );
};
