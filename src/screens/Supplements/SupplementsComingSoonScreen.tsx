/**
 * Supplements Coming Soon Screen
 *
 * Placeholder screen for the upcoming Supplements feature
 */

import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";

const { width } = Dimensions.get("window");

export const SupplementsComingSoonScreen: React.FC = () => {
  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      <LinearGradient
        colors={["#6FD89E", "#4BC97F"]}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.content}>
          {/* Icon */}
          <View style={styles.iconContainer}>
            <Ionicons name="medkit-outline" size={120} color="#fff" />
          </View>

          {/* Title */}
          <Text style={styles.title}>Supplements</Text>

          {/* Subtitle */}
          <Text style={styles.subtitle}>Bald verfügbar!</Text>

          {/* Description */}
          <View style={styles.descriptionContainer}>
            <Text style={styles.description}>
              Hier wirst du bald deine Supplement-Einnahme tracken und
              personalisierte Empfehlungen erhalten können.
            </Text>
          </View>

          {/* Features List */}
          <View style={styles.featuresList}>
            <View style={styles.featureItem}>
              <Ionicons
                name="checkmark-circle"
                size={24}
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
                size={24}
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
                size={24}
                color="#fff"
                style={styles.featureIcon}
              />
              <Text style={styles.featureText}>
                Dosierungsrichtlinien & Timing
              </Text>
            </View>
          </View>

          {/* Coming Soon Badge */}
          <View style={styles.badge}>
            <Text style={styles.badgeText}>IN ENTWICKLUNG</Text>
          </View>
        </View>
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
  content: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  iconContainer: {
    marginBottom: 32,
    opacity: 0.95,
  },
  title: {
    fontSize: 42,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 8,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 24,
    fontWeight: "600",
    color: "#fff",
    marginBottom: 24,
    textAlign: "center",
    opacity: 0.9,
  },
  descriptionContainer: {
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 16,
    padding: 20,
    marginBottom: 32,
    width: "100%",
    maxWidth: 400,
  },
  description: {
    fontSize: 16,
    color: "#fff",
    textAlign: "center",
    lineHeight: 24,
  },
  featuresList: {
    width: "100%",
    maxWidth: 400,
    marginBottom: 32,
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    padding: 16,
    borderRadius: 12,
  },
  featureIcon: {
    marginRight: 12,
  },
  featureText: {
    fontSize: 16,
    color: "#fff",
    fontWeight: "500",
    flex: 1,
  },
  badge: {
    backgroundColor: "rgba(255, 255, 255, 0.3)",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    marginTop: 16,
  },
  badgeText: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#fff",
    letterSpacing: 1.5,
  },
});
