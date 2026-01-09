import { supabase } from "../lib/supabase";
import * as Linking from 'expo-linking';

/**
 * Auth Error Interface
 */
export interface AuthError {
  message: string;
  status?: number;
}

/**
 * Auth User Interface
 */
export interface AuthUser {
  id: string;
  email: string;
  created_at: string;
}

/**
 * Auth Response Interface
 */
export interface AuthResponse {
  user: AuthUser | null;
  session: any | null;
  error: AuthError | null;
}

/**
 * Sign up a new user
 *
 * @param email - User email address
 * @param password - User password (minimum 6 characters)
 * @returns AuthResponse with user, session, or error
 *
 * @example
 * const { user, error } = await signUp("user@example.com", "password123");
 * if (error) {
 *   console.error(error.message);
 * } else {
 *   console.log("User created:", user);
 * }
 */
export const signUp = async (
  email: string,
  password: string
): Promise<AuthResponse> => {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        // ✅ WICHTIG: Custom Redirect URL
        emailRedirectTo: 'lifestyleapp://auth/callback',
      },
    });

    if (error) {
      return {
        user: null,
        session: null,
        error: { message: getAuthErrorMessage(error) },
      };
    }

    // Profil wird automatisch via Trigger erstellt

    return {
      user: data.user as AuthUser,
      session: data.session,
      error: null,
    };
  } catch (error) {
    return {
      user: null,
      session: null,
      error: { message: 'Ein unerwarteter Fehler ist aufgetreten' },
    };
  }
};

/**
 * Sign in existing user
 *
 * @param email - User email address
 * @param password - User password
 * @returns AuthResponse with user, session, or error
 *
 * @example
 * const { user, error } = await signIn("user@example.com", "password123");
 * if (error) {
 *   console.error(error.message);
 * } else {
 *   console.log("Logged in:", user);
 * }
 */
export const signIn = async (
  email: string,
  password: string
): Promise<AuthResponse> => {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      return {
        user: null,
        session: null,
        error: { message: getAuthErrorMessage(error) },
      };
    }

    return {
      user: data.user as AuthUser,
      session: data.session,
      error: null,
    };
  } catch (error) {
    return {
      user: null,
      session: null,
      error: { message: "Ein unerwarteter Fehler ist aufgetreten" },
    };
  }
};

/**
 * Sign out current user
 *
 * Clears the session and removes data from AsyncStorage
 *
 * @returns Error object if sign out fails, null otherwise
 *
 * @example
 * const { error } = await signOut();
 * if (error) {
 *   console.error(error.message);
 * } else {
 *   console.log("Logged out successfully");
 * }
 */
export const signOut = async (): Promise<{ error: AuthError | null }> => {
  try {
    const { error } = await supabase.auth.signOut();

    if (error) {
      return { error: { message: getAuthErrorMessage(error) } };
    }

    return { error: null };
  } catch (error) {
    return { error: { message: "Fehler beim Ausloggen" } };
  }
};

/**
 * Get current logged in user
 *
 * @returns AuthUser if logged in, null otherwise
 *
 * @example
 * const user = await getCurrentUser();
 * if (user) {
 *   console.log("Current user:", user.email);
 * } else {
 *   console.log("Not logged in");
 * }
 */
export const getCurrentUser = async (): Promise<AuthUser | null> => {
  try {
    const { data, error } = await supabase.auth.getUser();

    if (error || !data.user) {
      return null;
    }

    return data.user as AuthUser;
  } catch (error) {
    return null;
  }
};

/**
 * Listen to auth state changes
 *
 * @param callback - Function to call when auth state changes
 * @returns Unsubscribe function
 *
 * @example
 * const unsubscribe = onAuthStateChange((user) => {
 *   if (user) {
 *     console.log("User logged in:", user.email);
 *   } else {
 *     console.log("User logged out");
 *   }
 * });
 *
 * // Later, to stop listening:
 * unsubscribe();
 */
export const onAuthStateChange = (
  callback: (user: AuthUser | null) => void
) => {
  const { data } = supabase.auth.onAuthStateChange((_event, session) => {
    callback(session?.user as AuthUser | null);
  });

  // Return unsubscribe function
  return data.subscription.unsubscribe;
};

/**
 * Send password reset email
 *
 * @param email - User email address
 * @returns Error object if request fails, null otherwise
 *
 * @example
 * const { error } = await resetPassword("user@example.com");
 * if (error) {
 *   console.error(error.message);
 * } else {
 *   console.log("Password reset email sent");
 * }
 */
export const resetPassword = async (
  email: string
): Promise<{ error: AuthError | null }> => {
  try {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: "lifestyle://reset-password",
    });

    if (error) {
      return { error: { message: getAuthErrorMessage(error) } };
    }

    return { error: null };
  } catch (error) {
    return { error: { message: "Fehler beim Zurücksetzen" } };
  }
};

/**
 * Update user password (when logged in)
 *
 * @param newPassword - New password (minimum 6 characters)
 * @returns Error object if update fails, null otherwise
 *
 * @example
 * const { error } = await updatePassword("newPassword123");
 * if (error) {
 *   console.error(error.message);
 * } else {
 *   console.log("Password updated successfully");
 * }
 */
export const updatePassword = async (
  newPassword: string
): Promise<{ error: AuthError | null }> => {
  try {
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) {
      return { error: { message: getAuthErrorMessage(error) } };
    }

    return { error: null };
  } catch (error) {
    return { error: { message: "Fehler beim Aktualisieren des Passworts" } };
  }
};

/**
 * Map Supabase errors to German user-friendly messages
 *
 * @param error - Supabase error object
 * @returns User-friendly German error message
 */
const getAuthErrorMessage = (error: any): string => {
  const message = error.message?.toLowerCase() || "";

  if (message.includes("user already registered")) {
    return "Diese Email-Adresse ist bereits registriert";
  }
  if (message.includes("invalid login credentials")) {
    return "Falsche Email oder Passwort";
  }
  if (message.includes("email not confirmed")) {
    return "Bitte bestätige zuerst deine Email-Adresse";
  }
  if (message.includes("password should be at least")) {
    return "Passwort muss mindestens 6 Zeichen haben";
  }
  if (message.includes("invalid email")) {
    return "Ungültige Email-Adresse";
  }
  if (message.includes("network")) {
    return "Netzwerkfehler. Bitte prüfe deine Internetverbindung";
  }
  if (message.includes("weak password") || message.includes("password is too weak")) {
    return "Passwort ist zu schwach. Verwende mindestens 6 Zeichen";
  }
  if (message.includes("email rate limit")) {
    return "Zu viele Anfragen. Bitte warte einen Moment";
  }

  return "Ein Fehler ist aufgetreten. Bitte versuche es erneut";
};

/**
 * Handle Email Confirmation Callback
 * Call this when app is opened via Deep Link
 */
export const handleEmailConfirmation = async (
  url: string
): Promise<{ error: AuthError | null }> => {
  try {
    // Parse URL
    const { queryParams } = Linking.parse(url);
    
    // Supabase sendet diese Parameter:
    // - token_hash
    // - type (signup, recovery, etc.)
    
    if (!queryParams) {
      return { error: { message: 'Ungültiger Bestätigungslink' } };
    }

    // Supabase verarbeitet die Bestätigung automatisch durch den Link
    // Wir müssen nur die Session aktualisieren
    const { data, error } = await supabase.auth.getSession();

    if (error) {
      return { error: { message: getAuthErrorMessage(error) } };
    }

    return { error: null };
  } catch (error) {
    console.error('Email confirmation error:', error);
    return { error: { message: 'Fehler bei der Email-Bestätigung' } };
  }
};

/**
 * Resend confirmation email
 */
export const resendConfirmationEmail = async (
  email: string
): Promise<{ error: AuthError | null }> => {
  try {
    const { error } = await supabase.auth.resend({
      type: 'signup',
      email,
    });

    if (error) {
      return { error: { message: getAuthErrorMessage(error) } };
    }

    return { error: null };
  } catch (error) {
    return { error: { message: 'Fehler beim Versenden der Email' } };
  }
};

/**
 * Check if current user's email is confirmed
 */
export const isEmailConfirmed = async (): Promise<boolean> => {
  try {
    const { data } = await supabase.auth.getUser();
    return data.user?.email_confirmed_at !== null;
  } catch (error) {
    return false;
  }
};

/**
 * Sign in with Google OAuth
 *
 * Opens Google authentication flow in browser and redirects back to app
 * The OAuth callback is handled in AppNavigator.tsx via deep linking
 *
 * @returns Object with success status or error
 *
 * @example
 * const { error } = await signInWithGoogle();
 * if (error) console.error(error);
 */
export const signInWithGoogle = async (): Promise<{
  error: AuthError | null;
}> => {
  try {
    console.log('Starting Google OAuth...');

    // Use deep link redirect to return to the app after OAuth
    // The callback will be handled by AppNavigator's deep link listener
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: 'lifestyleapp://auth/callback',
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
        skipBrowserRedirect: false,
      },
    });

    if (error) {
      console.error('Supabase OAuth error:', error);
      return {
        error: { message: getAuthErrorMessage(error) },
      };
    }

    console.log('Opening OAuth URL in browser...');

    // Open the URL in the system browser
    // After authentication, Google will redirect to lifestyleapp://auth/callback
    // which will be caught by the deep link listener in AppNavigator
    await Linking.openURL(data?.url ?? '');

    console.log('OAuth browser opened - waiting for callback...');

    // No polling needed - the deep link will trigger the callback
    return {
      error: null,
    };
  } catch (error) {
    console.error('Exception during Google sign-in:', error);
    return {
      error: { message: 'Fehler bei Google-Anmeldung' },
    };
  }
};