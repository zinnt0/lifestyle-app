/**
 * Login Screen
 *
 * Allows users to sign in with email and password.
 * Includes client-side validation and error handling.
 */

import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  ScrollView,
  Alert,
  TextInput,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Button } from "../../components/ui/Button";
import { signIn } from "../../services/auth.service";
import { validateEmail, validatePassword } from "../../utils/validation";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { AuthStackParamList } from "../../navigation/types";

type LoginScreenNavigationProp = NativeStackNavigationProp<
  AuthStackParamList,
  "Login"
>;

/**
 * LoginScreen Component
 *
 * Features:
 * - Email and password inputs with validation
 * - Client-side validation before API call
 * - Loading state during authentication
 * - Error display for auth failures
 * - Navigation to Register screen
 * - Keyboard-aware layout
 */
export const LoginScreen: React.FC = () => {
  const navigation = useNavigation<LoginScreenNavigationProp>();

  // Form state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Handle login submission
   *
   * 1. Clears previous errors
   * 2. Validates email and password client-side
   * 3. Calls signIn service
   * 4. Handles success/error responses
   */
  const handleLogin = async () => {
    // Clear previous errors
    setError(null);

    // Client-side validation
    const emailError = validateEmail(email);
    if (emailError) {
      setError(emailError);
      return;
    }

    const passwordError = validatePassword(password);
    if (passwordError) {
      setError(passwordError);
      return;
    }

    // Attempt login
    setLoading(true);
    try {
      const { user, error: authError } = await signIn(email.trim(), password);

      if (authError) {
        setError(authError.message);
        setLoading(false);
        return;
      }

      if (user) {
        // Login successful
        console.log("Login successful:", user.email);
        // TODO: Navigate to Home or Onboarding based on user state
        // For now, just show success
        Alert.alert(
          "Erfolgreich!",
          `Willkommen zurück, ${user.email}!`,
          [{ text: "OK" }]
        );
      }
    } catch (err) {
      console.error("Login error:", err);
      setError("Ein unerwarteter Fehler ist aufgetreten");
    } finally {
      setLoading(false);
    }
  };

  /**
   * Navigate to Register screen
   */
  const handleNavigateToRegister = () => {
    navigation.navigate("Register");
  };

  /**
   * Handle forgot password (placeholder for MVP)
   */
  const handleForgotPassword = () => {
    Alert.alert(
      "Passwort vergessen?",
      "Die Passwort-Zurücksetzen Funktion ist bald verfügbar.",
      [{ text: "OK" }]
    );
  };


  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="always"
        keyboardDismissMode="none"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Willkommen zurück</Text>
            <Text style={styles.subtitle}>Melde dich an um fortzufahren</Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            <View style={styles.inputWrapper}>
              <Text style={styles.inputLabel}>Email</Text>
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="deine@email.de"
                placeholderTextColor="#8E8E93"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                editable={!loading}
                style={styles.textInput}
              />
            </View>

            <View style={[styles.inputWrapper, styles.passwordInput]}>
              <Text style={styles.inputLabel}>Passwort</Text>
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="••••••••"
                placeholderTextColor="#8E8E93"
                secureTextEntry={true}
                autoCapitalize="none"
                autoCorrect={false}
                editable={!loading}
                style={styles.textInput}
              />
            </View>

            {/* Error Message */}
            {error && (
              <View style={styles.errorContainer}>
                <Text style={styles.errorText}>{error}</Text>
              </View>
            )}

            {/* Login Button */}
            <Button
              title="Anmelden"
              onPress={handleLogin}
              loading={loading}
              disabled={loading}
              style={styles.loginButton}
            />

            {/* Forgot Password */}
            <TouchableOpacity
              style={styles.forgotPassword}
              onPress={handleForgotPassword}
              disabled={loading}
            >
              <Text style={styles.forgotPasswordText}>
                Passwort vergessen?
              </Text>
            </TouchableOpacity>

          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Noch kein Account? </Text>
            <TouchableOpacity
              onPress={handleNavigateToRegister}
              disabled={loading}
            >
              <Text style={styles.footerLink}>Registrieren</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 24,
  },
  header: {
    marginBottom: 48,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#000000",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#8E8E93",
  },
  form: {
    marginBottom: 32,
  },
  inputWrapper: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: "#000000",
    marginBottom: 8,
  },
  textInput: {
    backgroundColor: "#F5F5F5",
    borderWidth: 2,
    borderColor: "#E0E0E0",
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: "#000000",
  },
  passwordInput: {
    marginTop: 0,
  },
  errorContainer: {
    backgroundColor: "#FFEBEE",
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
    marginBottom: 8,
  },
  errorText: {
    color: "#FF3B30",
    fontSize: 14,
    textAlign: "center",
  },
  loginButton: {
    marginTop: 16,
  },
  forgotPassword: {
    alignSelf: "center",
    marginTop: 16,
    padding: 8,
  },
  forgotPasswordText: {
    color: "#007AFF",
    fontSize: 14,
  },
  footer: {
    flexDirection: "row",
    justifyContent: "center",
    marginTop: "auto",
    paddingTop: 24,
  },
  footerText: {
    fontSize: 14,
    color: "#8E8E93",
  },
  footerLink: {
    fontSize: 14,
    color: "#007AFF",
    fontWeight: "600",
  },
});
