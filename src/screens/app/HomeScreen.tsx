/**
 * Home Screen
 *
 * Main landing screen after onboarding completion.
 * Placeholder for now - will be expanded with main app features.
 */

import React from "react";
import { View, Text, StyleSheet, Button } from "react-native";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { MainStackParamList } from "../../navigation/types";
import { supabase } from "../../lib/supabase";

type HomeScreenNavigationProp = NativeStackNavigationProp<
  MainStackParamList,
  "Home"
>;

/**
 * HomeScreen Component
 *
 * Displays welcome message and provides navigation to other screens.
 * Includes logout functionality.
 */
export const HomeScreen: React.FC = () => {
  const navigation = useNavigation<HomeScreenNavigationProp>();

  /**
   * Handle user logout
   * Signs out user and AppNavigator will automatically redirect to Login
   */
  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      // AppNavigator's auth state listener will handle redirect
    } catch (error) {
      console.error("Error logging out:", error);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Willkommen! 🎉</Text>
      <Text style={styles.subtitle}>Dein Onboarding ist abgeschlossen</Text>
      <Text style={styles.description}>
        Dies ist der Startbildschirm der App. Hier werden später deine
        Trainingspläne, Ernährungstipps und Fortschritte angezeigt.
      </Text>

      <View style={styles.buttonContainer}>
        <Button
          title="Profil anzeigen"
          onPress={() => navigation.navigate("Profile")}
        />
      </View>

      <View style={styles.buttonContainer}>
        <Button title="Ausloggen" onPress={handleLogout} color="#FF3B30" />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 24,
    backgroundColor: "#FFFFFF",
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: "#8E8E93",
    marginBottom: 16,
    textAlign: "center",
  },
  description: {
    fontSize: 14,
    color: "#8E8E93",
    marginBottom: 32,
    textAlign: "center",
    lineHeight: 20,
  },
  buttonContainer: {
    marginTop: 16,
    width: "100%",
    maxWidth: 300,
  },
});
