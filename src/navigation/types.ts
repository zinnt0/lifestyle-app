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
 * Main App Stack Parameter List
 *
 * Screens accessible after authentication
 */
export type AppStackParamList = {
  Home: undefined;
  Profile: undefined;
  Settings: undefined;
  Onboarding: undefined;
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
