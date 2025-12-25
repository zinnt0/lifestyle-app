/**
 * Auth Callback Screen
 *
 * Handles email confirmation callbacks from Supabase.
 * This screen is shown when the user clicks the email confirmation link.
 * Processes the confirmation and shows appropriate alerts.
 */

import React, { useEffect } from "react";
import { View, Text, StyleSheet, ActivityIndicator, Alert } from "react-native";
import { useNavigation } from "@react-navigation/native";
import * as Linking from "expo-linking";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { AuthStackParamList } from "../../navigation/types";
import { handleEmailConfirmation } from "../../services/auth.service";

type NavigationProp = NativeStackNavigationProp<AuthStackParamList, "Login">;

/**
 * AuthCallbackScreen Component
 *
 * Processes email confirmation when user clicks the link from their email.
 * Shows loading state, handles confirmation, and displays success/error alerts.
 */
export const AuthCallbackScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();

  useEffect(() => {
    const processCallback = async () => {
      try {
        // Get current URL from deep link
        const url = await Linking.getInitialURL();

        if (url) {
          console.log("Processing email confirmation:", url);

          const { error } = await handleEmailConfirmation(url);

          if (error) {
            // Error: Show error and navigate to Login
            Alert.alert("Bestätigung fehlgeschlagen", error.message, [
              {
                text: "OK",
                onPress: () => navigation.navigate("Login"),
              },
            ]);
          } else {
            // Success: Show success message and navigate to Login
            Alert.alert(
              "Email bestätigt!",
              "Deine Email-Adresse wurde erfolgreich bestätigt. Du kannst dich jetzt anmelden.",
              [
                {
                  text: "Weiter",
                  onPress: () => {
                    // TODO: Navigate to Home or Onboarding after authentication
                    navigation.navigate("Login");
                  },
                },
              ]
            );
          }
        } else {
          // No URL found, navigate back to Login
          console.warn("No URL found in callback");
          navigation.navigate("Login");
        }
      } catch (error) {
        console.error("Callback processing error:", error);
        Alert.alert(
          "Fehler",
          "Bei der Email-Bestätigung ist ein Fehler aufgetreten.",
          [
            {
              text: "OK",
              onPress: () => navigation.navigate("Login"),
            },
          ]
        );
      }
    };

    processCallback();
  }, [navigation]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color="#007AFF" />
      <Text style={styles.text}>Bestätige Email...</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
  },
  text: {
    marginTop: 16,
    fontSize: 16,
    color: "#8E8E93",
  },
});
