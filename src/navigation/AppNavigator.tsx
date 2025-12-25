/**
 * App Navigator
 *
 * Root navigation structure for the entire app.
 * Handles switching between authenticated and unauthenticated flows.
 * Includes deep link configuration for email confirmation and password reset.
 */

import React, { useEffect, useState } from "react";
import { ActivityIndicator, View, StyleSheet } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { AuthNavigator } from "./AuthNavigator";
import { getCurrentUser, onAuthStateChange } from "../services/auth.service";
import type { RootStackParamList } from "./types";
import type { AuthUser } from "../services/auth.service";

const RootStack = createNativeStackNavigator<RootStackParamList>();

/**
 * Deep Link Configuration
 *
 * Maps URLs to navigation routes for:
 * - Email confirmation (lifestyleapp://auth/callback)
 * - Password reset (lifestyleapp://auth/forgot-password)
 * - Auth screens (login, register)
 */
const linking = {
  prefixes: ["lifestyleapp://", "https://lifestyleapp.com"],
  config: {
    screens: {
      Auth: {
        path: "auth",
        screens: {
          Login: "login",
          Register: "register",
          AuthCallback: "callback",
          ForgotPassword: "forgot-password",
        },
      },
      App: {
        path: "app",
        screens: {
          Home: "home",
          Profile: "profile",
          Settings: "settings",
        },
      },
    },
  },
};

/**
 * AppNavigator Component
 *
 * Main navigation component that:
 * 1. Checks authentication status on mount
 * 2. Listens to auth state changes
 * 3. Switches between Auth and App stacks
 * 4. Handles deep links for email confirmation
 */
export const AppNavigator: React.FC = () => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check initial auth state
  useEffect(() => {
    checkAuthState();
  }, []);

  // Listen to auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChange((authUser) => {
      setUser(authUser);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  /**
   * Check current authentication state
   */
  const checkAuthState = async () => {
    try {
      const currentUser = await getCurrentUser();
      setUser(currentUser);
    } catch (error) {
      console.error("Error checking auth state:", error);
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  // Show loading screen while checking auth state
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  return (
    <NavigationContainer linking={linking}>
      <RootStack.Navigator
        screenOptions={{
          headerShown: false,
          animation: "fade",
        }}
      >
        {user ? (
          // Authenticated: Show App Stack
          // TODO: Create and add AppStack when implementing main app screens
          <RootStack.Screen
            name="App"
            component={PlaceholderAppScreen}
            options={{ headerShown: false }}
          />
        ) : (
          // Not authenticated: Show Auth Stack
          <RootStack.Screen
            name="Auth"
            component={AuthNavigator}
            options={{ headerShown: false }}
          />
        )}
      </RootStack.Navigator>
    </NavigationContainer>
  );
};

/**
 * Placeholder App Screen
 *
 * Temporary screen shown when user is authenticated.
 * Replace this with actual AppStack once main screens are built.
 */
const PlaceholderAppScreen: React.FC = () => {
  return (
    <View style={styles.placeholderContainer}>
      <ActivityIndicator size="large" color="#007AFF" />
    </View>
  );
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
  },
  placeholderContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
  },
});
