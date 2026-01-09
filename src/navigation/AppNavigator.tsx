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
import * as Linking from "expo-linking";
import { AuthNavigator } from "./AuthNavigator";
import { OnboardingNavigator } from "./OnboardingNavigator";
import { TabNavigator } from "./TabNavigator";
import { getCurrentUser, onAuthStateChange } from "../services/auth.service";
import { isOnboardingCompleted } from "../services/profile.service";
import { foodService } from "../services/FoodService";
import { profileSyncService } from "../services/ProfileSyncService";
import { nutritionSyncService } from "../services/NutritionSyncService";
import { localWorkoutHistoryCache } from "../services/cache/LocalWorkoutHistoryCache";
import { supabase } from "../lib/supabase";
import type { AuthUser } from "../services/auth.service";

/**
 * Deep Link Configuration
 *
 * Maps URLs to navigation routes for:
 * - Email confirmation (lifestyleapp://auth/callback)
 * - Password reset (lifestyleapp://auth/forgot-password)
 * - Auth screens (login, register)
 * - OAuth callbacks (exp:// for Expo Go development)
 */
const linking = {
  prefixes: ["lifestyleapp://", "exp://", "https://lifestyleapp.com"],
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

  // Initialize all cache services on app start
  useEffect(() => {
    // Initialize FoodService (includes Food, Nutrition, and Profile caches)
    foodService.initialize().catch((error) => {
      console.error("Failed to initialize FoodService:", error);
    });

    // Initialize Workout History Cache
    localWorkoutHistoryCache.initialize().catch((error) => {
      console.error("Failed to initialize WorkoutHistoryCache:", error);
    });

    // Initialize ProfileSyncService (event listeners for profile updates)
    profileSyncService.initialize();
    console.log("[AppNavigator] Cache services initialized");
  }, []);

  // Check initial auth and onboarding state
  useEffect(() => {
    checkAuthAndOnboarding();
  }, []);

  // Handle deep links for OAuth callback and email confirmation
  useEffect(() => {
    const handleDeepLink = async (url: string) => {
      console.log('[AppNavigator] Deep link received:', url);

      // Check what type of callback this is:
      // 1. Email confirmation: ?token_hash=xxx&type=signup
      // 2. Authorization code: ?code=xxx (PKCE flow for OAuth)
      // 3. Direct tokens: #access_token=xxx&refresh_token=xxx (implicit flow)
      const hasCode = url.includes('?code=') || url.includes('&code=');
      const hasTokens = url.includes('access_token=') || url.includes('refresh_token=');
      const hasTokenHash = url.includes('token_hash=');

      if (!hasCode && !hasTokens && !hasTokenHash) {
        return; // Not an auth callback
      }

      console.log('[AppNavigator] Auth callback detected');
      console.log('[AppNavigator] Has code:', hasCode, 'Has tokens:', hasTokens, 'Has token_hash:', hasTokenHash);

      try {
        if (hasTokenHash) {
          // Handle email confirmation (signup, password reset, etc.)
          console.log('[AppNavigator] Processing email confirmation...');

          const queryIndex = url.indexOf('?');
          const hashIndex = url.indexOf('#');

          let queryString = '';
          if (hashIndex !== -1) {
            queryString = url.substring(hashIndex + 1);
          } else if (queryIndex !== -1) {
            queryString = url.substring(queryIndex + 1);
          }

          const params = new URLSearchParams(queryString);
          const tokenHash = params.get('token_hash');
          const type = params.get('type');

          console.log('[AppNavigator] Email confirmation type:', type);

          if (!tokenHash) {
            console.error('[AppNavigator] Missing token_hash in URL');
            return;
          }

          // Verify the OTP token
          const { data, error } = await supabase.auth.verifyOtp({
            token_hash: tokenHash,
            type: type as any || 'email',
          });

          if (error) {
            console.error('[AppNavigator] Error verifying email:', error);
            return;
          }

          console.log('[AppNavigator] Email verified successfully!', data.user?.email);
          await checkAuthAndOnboarding();

        } else if (hasTokens) {
          // Handle direct tokens (implicit flow or hash fragment)
          console.log('[AppNavigator] Processing direct tokens...');

          const hashIndex = url.indexOf('#');
          const queryIndex = url.indexOf('?');

          let fragment = '';
          if (hashIndex !== -1) {
            fragment = url.substring(hashIndex + 1);
          } else if (queryIndex !== -1) {
            fragment = url.substring(queryIndex + 1);
          }

          console.log('[AppNavigator] Fragment:', fragment.substring(0, 50) + '...');

          const params = new URLSearchParams(fragment);
          const accessToken = params.get('access_token');
          const refreshToken = params.get('refresh_token');

          if (!accessToken || !refreshToken) {
            console.error('[AppNavigator] Missing tokens in URL');
            return;
          }

          console.log('[AppNavigator] Setting session from tokens...');
          const { data, error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });

          if (error) {
            console.error('[AppNavigator] Error setting session:', error);
            return;
          }

          console.log('[AppNavigator] Session set!', data.user?.email);
          await checkAuthAndOnboarding();

        } else if (hasCode) {
          // Handle authorization code (PKCE flow)
          console.log('[AppNavigator] Processing authorization code...');

          // Supabase client will automatically exchange the code for tokens
          // via detectSessionInUrl, but we need to help it in React Native
          const queryIndex = url.indexOf('?');
          const queryString = url.substring(queryIndex + 1);
          const params = new URLSearchParams(queryString);
          const code = params.get('code');

          if (!code) {
            console.error('[AppNavigator] No code found in URL');
            return;
          }

          console.log('[AppNavigator] Exchanging code for session...');

          // Exchange the authorization code for a session
          const { data, error } = await supabase.auth.exchangeCodeForSession(code);

          if (error) {
            console.error('[AppNavigator] Error exchanging code:', error);
            return;
          }

          console.log('[AppNavigator] Session created!', data.user?.email);
          await checkAuthAndOnboarding();
        }
      } catch (error) {
        console.error('[AppNavigator] Error handling auth callback:', error);
      }
    };

    // Handle initial URL (when app is opened via deep link)
    Linking.getInitialURL().then((url) => {
      if (url) {
        console.log('[AppNavigator] Initial URL:', url);
        handleDeepLink(url);
      }
    });

    // Listen for deep link events while app is running
    const subscription = Linking.addEventListener('url', (event) => {
      handleDeepLink(event.url);
    });

    return () => {
      subscription.remove();
    };
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

      // 3. Sync today's nutrition data on app start (fire and forget)
      if (completed) {
        nutritionSyncService.syncNutritionData(currentUser.id, {
          force: false,
          daysToSync: 1,
        }).catch((error) => {
          console.warn("[AppNavigator] Failed to sync nutrition on startup:", error);
        });
      }
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
