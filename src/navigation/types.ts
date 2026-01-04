/**
 * Navigation Type Definitions
 *
 * Defines parameter lists for all navigation stacks in the app.
 * Provides type safety for navigation props.
 */

/**
 * Auth Stack Parameter List
 *
 * Screens accessible before authentication
 */
export type AuthStackParamList = {
  Login: undefined;
  Register: undefined;
  ForgotPassword: undefined;
  Welcome: undefined;
  AuthCallback: undefined; // Email confirmation callback
};

/**
 * Onboarding Stack Parameter List
 *
 * Screens in the onboarding flow (6 screens)
 */
export type OnboardingStackParamList = {
  OnboardingStep1: undefined;
  OnboardingStep2: undefined;
  OnboardingStep3: undefined;
  OnboardingStep4: undefined;
  OnboardingStep5: undefined;
  OnboardingSummary: undefined;
};

/**
 * Main App Stack Parameter List
 *
 * Screens accessible after authentication and onboarding completion
 */
export type MainStackParamList = {
  Home: undefined;
  Profile: undefined;
  ProfileEdit: undefined;
  Settings: undefined;
  DailyCheckin: undefined;
  NutritionTest: undefined;
  CacheDebug: { userId?: string };
};

/**
 * Training Stack Parameter List
 *
 * Screens in the training section
 */
export type TrainingStackParamList = {
  TrainingDashboard: undefined;
  PlanConfiguration: undefined;
  GuidedPlanFlow: undefined;
  CustomPlanFlow: undefined;
  TrainingPlanDetail: { planId: string };
  WorkoutSession: { sessionId: string };
  WorkoutSummary: { sessionId: string };
};

/**
 * Tab Navigator Parameter List
 *
 * Main app tabs
 */
export type TabNavigatorParamList = {
  HomeTab: undefined;
  TrainingTab: undefined;
  NutritionTab: undefined;
};

/**
 * Root Navigator Parameter List
 *
 * Top-level navigation structure
 */
export type RootStackParamList = {
  Auth: undefined;
  App: undefined;
};
