// src/navigation/OnboardingNavigator.tsx
import React from 'react';
import { View } from 'react-native';
import { OnboardingProvider, useOnboarding } from '../contexts/OnboardingContext';
import { OnboardingScreen0 } from '../screens/onboarding/OnboardingScreen0';
import { OnboardingScreen1 } from '../screens/onboarding/OnboardingScreen1';
import { OnboardingScreen2 } from '../screens/onboarding/OnboardingScreen2';
import { OnboardingScreen3 } from '../screens/onboarding/OnboardingScreen3';
import { OnboardingScreen4 } from '../screens/onboarding/OnboardingScreen4';
import { OnboardingScreen5 } from '../screens/onboarding/OnboardingScreen5';
import { OnboardingSummary } from '../screens/onboarding/OnboardingSummary';

// Wrapper Component das den aktuellen Screen basierend auf currentStep rendert
const OnboardingScreens: React.FC = () => {
  const { currentStep } = useOnboarding();

  switch (currentStep) {
    case 0:
      return <OnboardingScreen0 />;
    case 1:
      return <OnboardingScreen1 />;
    case 2:
      return <OnboardingScreen2 />;
    case 3:
      return <OnboardingScreen3 />;
    case 4:
      return <OnboardingScreen4 />;
    case 5:
      return <OnboardingScreen5 />;
    case 6:
      return <OnboardingSummary />;
    default:
      return <OnboardingScreen0 />;
  }
};

export const OnboardingNavigator: React.FC = () => {
  return (
    <OnboardingProvider>
      <View style={{ flex: 1 }}>
        <OnboardingScreens />
      </View>
    </OnboardingProvider>
  );
};
