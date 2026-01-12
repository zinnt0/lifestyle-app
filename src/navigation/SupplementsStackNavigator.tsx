/**
 * Supplements Stack Navigator
 *
 * Handles navigation for the Supplements section including:
 * - Onboarding flow for first-time users
 * - Main supplements dashboard (coming soon)
 */

import React, { useEffect, useState } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { ActivityIndicator, View, StyleSheet } from 'react-native';
import { supabase } from '../lib/supabase';
import { SupplementOnboardingProvider } from '../contexts/SupplementOnboardingContext';
import {
  SupplementOnboardingScreen1,
  SupplementOnboardingScreen2,
  SupplementOnboardingScreen3,
  SupplementOnboardingScreen4,
} from '../screens/Supplements/onboarding';
import { SupplementsComingSoonScreen } from '../screens/Supplements/SupplementsComingSoonScreen';
import { COLORS } from '../components/ui/theme';

export type SupplementsStackParamList = {
  SupplementsOnboarding1: undefined;
  SupplementsOnboarding2: undefined;
  SupplementsOnboarding3: undefined;
  SupplementsOnboarding4: undefined;
  SupplementsDashboard: undefined;
};

const Stack = createNativeStackNavigator<SupplementsStackParamList>();

/**
 * Wrapper component for onboarding screens with provider
 */
const OnboardingFlow: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
  return (
    <SupplementOnboardingProvider onComplete={onComplete}>
      <Stack.Navigator
        screenOptions={{
          headerShown: false,
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="SupplementsOnboarding1" component={SupplementOnboardingScreen1} />
        <Stack.Screen name="SupplementsOnboarding2" component={SupplementOnboardingScreen2} />
        <Stack.Screen name="SupplementsOnboarding3" component={SupplementOnboardingScreen3} />
        <Stack.Screen name="SupplementsOnboarding4" component={SupplementOnboardingScreen4} />
      </Stack.Navigator>
    </SupplementOnboardingProvider>
  );
};

/**
 * Main Supplements Stack Navigator
 * Checks if user has completed supplement onboarding
 */
export const SupplementsStackNavigator: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);

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
        .from('profiles')
        .select('supplement_onboarding_completed')
        .eq('id', user.id)
        .single();

      setHasCompletedOnboarding(profile?.supplement_onboarding_completed || false);
    } catch (error) {
      console.error('Error checking supplement onboarding status:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    checkOnboardingStatus();
  }, []);

  const handleOnboardingComplete = () => {
    setHasCompletedOnboarding(true);
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.secondary} />
      </View>
    );
  }

  // If onboarding not completed, show onboarding flow
  if (!hasCompletedOnboarding) {
    return <OnboardingFlow onComplete={handleOnboardingComplete} />;
  }

  // Otherwise show the main supplements screen (coming soon for now)
  return <SupplementsComingSoonScreen />;
};

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
});
