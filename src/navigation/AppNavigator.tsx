/**
 * App Navigator
 *
 * Root navigation structure for the entire app.
 * Handles switching between:
 * - Auth flow (not authenticated)
 * - Onboarding flow (authenticated but onboarding not completed)
 * - Main app flow (authenticated and onboarding completed)
 * Includes deep link configuration for email confirmation and password reset.
 */

import React, { useEffect, useState } from "react";
import { ActivityIndicator, View, StyleSheet } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { AuthNavigator } from "./AuthNavigator";
import { OnboardingNavigator } from "./OnboardingNavigator";
import { TabNavigator } from "./TabNavigator";
import { getCurrentUser, onAuthStateChange } from "../services/auth.service";
import { isOnboardingCompleted } from "../services/profile.service";
import { foodService } from "../services/FoodService";
import type { AuthUser } from "../services/auth.service";

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
      Login: "login",
      Register: "register",
      AuthCallback: "callback",
      ForgotPassword: "forgot-password",
      Home: "home",
      Profile: "profile",
      Settings: "settings",
    },
  },
};

/**
 * AppNavigator Component
 *
 * Main navigation component that:
 * 1. Checks authentication status on mount
 * 2. Checks onboarding completion status
 * 3. Listens to auth state changes
 * 4. Routes to correct navigator:
 *    - Not authenticated → AuthNavigator
 *    - Authenticated + onboarding NOT complete → OnboardingNavigator
 *    - Authenticated + onboarding complete → MainNavigator
 * 5. Handles deep links for email confirmation
 */
export const AppNavigator: React.FC = () => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Initialize FoodService on app start
  useEffect(() => {
    foodService.initialize().catch((error) => {
      console.error("Failed to initialize FoodService:", error);
    });
  }, []);

  // Check initial auth and onboarding state
  useEffect(() => {
    checkAuthAndOnboarding();
  }, []);

  // Listen to auth state changes
  useEffect(() => {
    const unsubscribe = onAuthStateChange(async (authUser) => {
      setUser(authUser);
      // Re-check onboarding when auth state changes
      await checkAuthAndOnboarding();
    });

    return () => {
      unsubscribe();
    };
  }, []);

  /**
   * Check current authentication and onboarding state
   */
  const checkAuthAndOnboarding = async () => {
    setIsLoading(true);

    try {
      // 1. Check if user is logged in
      const currentUser = await getCurrentUser();

      if (!currentUser) {
        setUser(null);
        setHasCompletedOnboarding(false);
        setIsLoading(false);
        return;
      }

      setUser(currentUser);

      // 2. Check if onboarding is completed
      const completed = await isOnboardingCompleted(currentUser.id);
      setHasCompletedOnboarding(completed);
    } catch (error) {
      console.error("Error checking auth/onboarding:", error);
      setUser(null);
      setHasCompletedOnboarding(false);
    } finally {
      setIsLoading(false);
    }
  };

  // Show loading screen while checking auth and onboarding
  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  /**
   * Determine which navigator to show based on auth and onboarding status
   */
  const getNavigator = () => {
    // Not authenticated → Show Auth Stack
    if (!user) {
      return <AuthNavigator />;
    }

    // Authenticated but onboarding not complete → Show Onboarding Stack
    if (!hasCompletedOnboarding) {
      return <OnboardingNavigator />;
    }

    // Authenticated and onboarding complete → Show Tab Navigator
    return <TabNavigator />;
  };

  return <NavigationContainer linking={linking}>{getNavigator()}</NavigationContainer>;
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
