/**
 * Supplement Stack Navigator
 * Navigation configuration for supplement tracking features
 */

import React, { useEffect, useState } from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { ActivityIndicator, View, StyleSheet } from "react-native";
import { supabase } from "../lib/supabase";
import { SupplementWelcomeScreen } from "../screens/Supplements/SupplementWelcomeScreen";
import { SupplementOnboardingScreen1 } from "../screens/Supplements/onboarding/SupplementOnboardingScreen1";
import { SupplementOnboardingScreen2 } from "../screens/Supplements/onboarding/SupplementOnboardingScreen2";
import { SupplementOnboardingScreen3 } from "../screens/Supplements/onboarding/SupplementOnboardingScreen3";
import { SupplementOnboardingScreen4 } from "../screens/Supplements/onboarding/SupplementOnboardingScreen4";
import { SupplementsComingSoonScreen } from "../screens/Supplements/SupplementsComingSoonScreen";
import { SupplementOnboardingProvider } from "../contexts/SupplementOnboardingContext";
import { SupplementCalculatingScreen } from "../screens/Supplements/SupplementCalculatingScreen";
import { SupplementMainScreen } from "../screens/Supplements/SupplementMainScreen";
import { AllSupplementsScreen } from "../screens/Supplements/AllSupplementsScreen";
import { COLORS } from "../components/ui/theme";

export type SupplementStackParamList = {
  SupplementWelcome: undefined;
  SupplementOnboardingScreen1: undefined;
  SupplementOnboardingScreen2: undefined;
  SupplementOnboardingScreen3: undefined;
  SupplementOnboardingScreen4: undefined;
  SupplementCalculating: undefined;
  SupplementMain: undefined;
  AllSupplements: undefined;
  SupplementsComingSoon: undefined;
};

const Stack = createNativeStackNavigator<SupplementStackParamList>();

/**
 * Wrapper component for onboarding screens with provider
 */
const OnboardingFlow: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
  return (
    <SupplementOnboardingProvider onComplete={onComplete}>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          animation: "slide_from_right",
        }}
        initialRouteName="SupplementWelcome"
      >
        <Stack.Screen name="SupplementWelcome" component={SupplementWelcomeScreen} />
        <Stack.Screen name="SupplementOnboardingScreen1" component={SupplementOnboardingScreen1} />
        <Stack.Screen name="SupplementOnboardingScreen2" component={SupplementOnboardingScreen2} />
        <Stack.Screen name="SupplementOnboardingScreen3" component={SupplementOnboardingScreen3} />
        <Stack.Screen name="SupplementOnboardingScreen4" component={SupplementOnboardingScreen4} />
      </Stack.Navigator>
    </SupplementOnboardingProvider>
  );
};

/**
 * Main Supplement Stack Navigator
 * Checks if user has completed supplement onboarding
 */
export function SupplementStackNavigator() {
  const [isLoading, setIsLoading] = useState(true);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);
  const [showCalculating, setShowCalculating] = useState(false);

  const checkOnboardingStatus = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setIsLoading(false);
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("supplement_onboarding_completed")
        .eq("id", user.id)
        .single();

      setHasCompletedOnboarding(profile?.supplement_onboarding_completed || false);
    } catch (error) {
      console.error("Error checking supplement onboarding status:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkOnboardingStatus();
  }, []);

  const handleOnboardingComplete = () => {
    setShowCalculating(true);
  };

  const handleCalculatingComplete = () => {
    setHasCompletedOnboarding(true);
    setShowCalculating(false);
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.secondary} />
      </View>
    );
  }

  // If onboarding not completed, show onboarding flow
  if (!hasCompletedOnboarding && !showCalculating) {
    return <OnboardingFlow onComplete={handleOnboardingComplete} />;
  }

  // Show calculating screen after onboarding
  if (showCalculating) {
    return <SupplementCalculatingScreen onComplete={handleCalculatingComplete} />;
  }

  // Otherwise show the main supplements screen with navigation
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="SupplementMain" component={SupplementMainScreen} />
      <Stack.Screen name="AllSupplements" component={AllSupplementsScreen} />
    </Stack.Navigator>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.background,
  },
});
