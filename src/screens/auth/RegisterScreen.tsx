/**
 * Register Screen
 *
 * Allows new users to create an account with email and password.
 * Includes comprehensive validation and password confirmation.
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
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { Input } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";
import { signUp } from "../../services/auth.service";
import {
  validateEmail,
  validatePassword,
  validatePasswordConfirmation,
  getPasswordStrengthHint,
} from "../../utils/validation";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { AuthStackParamList } from "../../navigation/types";

type RegisterScreenNavigationProp = NativeStackNavigationProp<
  AuthStackParamList,
  "Register"
>;

/**
 * RegisterScreen Component
 *
 * Features:
 * - Email, password, and password confirmation inputs
 * - Real-time validation feedback
 * - Password strength hints
 * - Client-side validation before API call
 * - Loading state during registration
 * - Error display for registration failures
 * - Navigation to Login screen
 */
export const RegisterScreen: React.FC = () => {
  const navigation = useNavigation<RegisterScreenNavigationProp>();

  // Form state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  // Error state for each field
  const [errors, setErrors] = useState<{
    email?: string;
    password?: string;
    confirmPassword?: string;
  }>({});

  /**
   * Clear error for a specific field
   */
  const clearError = (field: keyof typeof errors) => {
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  /**
   * Handle email change
   */
  const handleEmailChange = (value: string) => {
    setEmail(value);
    clearError("email");
  };

  /**
   * Handle password change
   */
  const handlePasswordChange = (value: string) => {
    setPassword(value);
    clearError("password");
  };

  /**
   * Handle confirm password change
   */
  const handleConfirmPasswordChange = (value: string) => {
    setConfirmPassword(value);
    clearError("confirmPassword");
  };

  /**
   * Handle registration submission
   *
   * 1. Validates all fields
   * 2. Calls signUp service
   * 3. Handles success/error responses
   */
  const handleRegister = async () => {
    // Clear all errors
    setErrors({});

    // Client-side validation
    const validationErrors: typeof errors = {};

    const emailError = validateEmail(email);
    if (emailError) validationErrors.email = emailError;

    const passwordError = validatePassword(password);
    if (passwordError) validationErrors.password = passwordError;

    const confirmError = validatePasswordConfirmation(password, confirmPassword);
    if (confirmError) validationErrors.confirmPassword = confirmError;

    // If there are validation errors, display them
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    // Attempt registration
    setLoading(true);
    try {
      const { user, error: authError } = await signUp(email.trim(), password);

      if (authError) {
        // Backend error - usually email already exists
        setErrors({ email: authError.message });
        setLoading(false);
        return;
      }

      if (user) {
        // Registration successful
        console.log("Registration successful:", user.email);
        Alert.alert(
          "Account erstellt!",
          "Bitte überprüfe deine E-Mail um deinen Account zu bestätigen.",
          [
            {
              text: "OK",
              onPress: () => navigation.navigate("Login"),
            },
          ]
        );
      }
    } catch (err) {
      console.error("Registration error:", err);
      setErrors({ email: "Ein unerwarteter Fehler ist aufgetreten" });
    } finally {
      setLoading(false);
    }
  };

  /**
   * Navigate to Login screen
   */
  const handleNavigateToLogin = () => {
    navigation.navigate("Login");
  };

  // Get password strength hint
  const passwordHint = password ? getPasswordStrengthHint(password) : null;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Account erstellen</Text>
            <Text style={styles.subtitle}>
              Registriere dich um loszulegen
            </Text>
          </View>

          {/* Form */}
          <View style={styles.form}>
            <Input
              label="Email"
              value={email}
              onChangeText={handleEmailChange}
              placeholder="deine@email.de"
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              textContentType="emailAddress"
              editable={!loading}
              error={errors.email}
            />

            <Input
              label="Passwort"
              value={password}
              onChangeText={handlePasswordChange}
              placeholder="Mindestens 6 Zeichen"
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              autoComplete="password"
              textContentType="newPassword"
              editable={!loading}
              error={errors.password}
              style={styles.passwordInput}
              rightIcon={
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  accessibilityLabel={
                    showPassword ? "Passwort verbergen" : "Passwort anzeigen"
                  }
                  accessibilityRole="button"
                >
                  <Text style={styles.showPasswordText}>
                    {showPassword ? "Verbergen" : "Anzeigen"}
                  </Text>
                </TouchableOpacity>
              }
            />

            {/* Password Hint */}
            {passwordHint && !errors.password && (
              <View style={styles.hintContainer}>
                <Text style={styles.hintText}>{passwordHint}</Text>
              </View>
            )}

            <Input
              label="Passwort bestätigen"
              value={confirmPassword}
              onChangeText={handleConfirmPasswordChange}
              placeholder="Passwort wiederholen"
              secureTextEntry={!showPassword}
              autoCapitalize="none"
              autoComplete="password"
              textContentType="newPassword"
              editable={!loading}
              error={errors.confirmPassword}
              style={styles.confirmPasswordInput}
            />

            {/* Register Button */}
            <Button
              title="Registrieren"
              onPress={handleRegister}
              loading={loading}
              disabled={loading}
              style={styles.registerButton}
            />
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>Bereits registriert? </Text>
            <TouchableOpacity
              onPress={handleNavigateToLogin}
              disabled={loading}
            >
              <Text style={styles.footerLink}>Anmelden</Text>
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
  passwordInput: {
    marginTop: 16,
  },
  confirmPasswordInput: {
    marginTop: 16,
  },
  hintContainer: {
    backgroundColor: "#F2F2F7",
    padding: 12,
    borderRadius: 8,
    marginTop: 8,
  },
  hintText: {
    color: "#8E8E93",
    fontSize: 13,
    textAlign: "center",
  },
  showPasswordText: {
    fontSize: 14,
    color: "#007AFF",
    fontWeight: "600",
  },
  registerButton: {
    marginTop: 24,
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
