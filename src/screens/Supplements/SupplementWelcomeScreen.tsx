/**
 * Supplement Welcome Screen
 *
 * First-time welcome screen for Supplements feature
 */

import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

type SupplementStackParamList = {
  SupplementWelcome: undefined;
  SupplementOnboardingScreen1: undefined;
  SupplementOnboardingScreen2: undefined;
  SupplementOnboardingScreen3: undefined;
  SupplementOnboardingScreen4: undefined;
};

type NavigationProp = NativeStackNavigationProp<SupplementStackParamList>;

export const SupplementWelcomeScreen: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();

  const handleStartOnboarding = () => {
    navigation.navigate("SupplementOnboardingScreen1");
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <LinearGradient
        colors={["#6FD89E", "#4BC97F"]}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Title */}
          <Text style={styles.title}>Willkommen bei{"\n"}Supplements</Text>

          {/* Description */}
          <View style={styles.descriptionContainer}>
            <Text style={styles.description}>
              Tracke deine Supplement-Einnahme und erhalte personalisierte
              Empfehlungen für optimale Ergebnisse.
            </Text>
          </View>

          {/* Features List */}
          <View style={styles.featuresList}>
            <View style={styles.featureItem}>
              <Ionicons
                name="checkmark-circle"
                size={22}
                color="#fff"
                style={styles.featureIcon}
              />
              <Text style={styles.featureText}>
                Supplement-Tracking & Erinnerungen
              </Text>
            </View>

            <View style={styles.featureItem}>
              <Ionicons
                name="checkmark-circle"
                size={22}
                color="#fff"
                style={styles.featureIcon}
              />
              <Text style={styles.featureText}>
                Personalisierte Empfehlungen
              </Text>
            </View>

            <View style={styles.featureItem}>
              <Ionicons
                name="checkmark-circle"
                size={22}
                color="#fff"
                style={styles.featureIcon}
              />
              <Text style={styles.featureText}>
                Dosierungsrichtlinien & Timing
              </Text>
            </View>
          </View>

          {/* Start Button */}
          <TouchableOpacity
            style={styles.startButton}
            onPress={handleStartOnboarding}
            activeOpacity={0.8}
          >
            <Text style={styles.startButtonText}>Jetzt starten</Text>
            <Ionicons name="arrow-forward" size={24} color="#6FD89E" />
          </TouchableOpacity>
        </ScrollView>
      </LinearGradient>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#6FD89E",
  },
  gradient: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
    paddingTop: 60,
    paddingBottom: 40,
  },
  title: {
    fontSize: 34,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 20,
    textAlign: "center",
    lineHeight: 42,
  },
  descriptionContainer: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 16,
    padding: 18,
    marginBottom: 24,
    width: "100%",
    maxWidth: 400,
  },
  description: {
    fontSize: 15,
    color: "#fff",
    textAlign: "center",
    lineHeight: 22,
  },
  featuresList: {
    width: "100%",
    maxWidth: 400,
    marginBottom: 32,
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    padding: 14,
    borderRadius: 12,
  },
  featureIcon: {
    marginRight: 12,
  },
  featureText: {
    fontSize: 15,
    color: "#fff",
    fontWeight: "500",
    flex: 1,
  },
  startButton: {
    backgroundColor: "#fff",
    paddingHorizontal: 40,
    paddingVertical: 18,
    borderRadius: 30,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  startButtonText: {
    fontSize: 18,
    fontWeight: "700",
    color: "#6FD89E",
  },
});
