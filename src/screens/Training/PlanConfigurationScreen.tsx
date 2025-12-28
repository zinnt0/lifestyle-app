/**
 * Plan Configuration Screen
 *
 * Screen for choosing plan creation method:
 * - Option 1: Guided flow (AI-recommended plans based on user answers)
 * - Option 2: Custom plan creation (manual selection)
 *
 * Features:
 * - Two large, touchable option cards
 * - Clean, modern layout with emojis
 * - Type-safe navigation to respective flows
 */

import React from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
} from "react-native";
import { Card } from "@/components/ui/Card";
import { useTrainingNavigation } from "@/hooks/useTrainingNavigation";
import type { PlanConfigurationScreenProps } from "@/navigation/TrainingStackNavigator";

// Design System Constants
const COLORS = {
  background: "#F8F9FA",
  text: "#333333",
  textSecondary: "#666666",
  cardBg: "#FFFFFF",
};

const TYPOGRAPHY = {
  h2: {
    fontSize: 24,
    fontWeight: "700" as const,
    color: COLORS.text,
  },
  body: {
    fontSize: 16,
    fontWeight: "400" as const,
    color: COLORS.text,
  },
  caption: {
    fontSize: 14,
    fontWeight: "400" as const,
    color: COLORS.textSecondary,
  },
};

const SPACING = {
  md: 16,
  lg: 24,
  xl: 32,
};

export const PlanConfigurationScreen: React.FC<
  PlanConfigurationScreenProps
> = () => {
  const navigation = useTrainingNavigation();

  const handleGuidedFlow = () => {
    navigation.navigate("GuidedPlanFlow");
  };

  const handleCustomFlow = () => {
    navigation.navigate("CustomPlanFlow");
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.headerText}>
            Bitte wähle eine Option aus:
          </Text>
        </View>

        {/* Option 1: Guided Plan Flow */}
        <Card
          onPress={handleGuidedFlow}
          padding="large"
          elevation="medium"
          style={styles.optionCard}
        >
          <View style={styles.cardContent}>
            {/* Icon */}
            <View style={styles.iconContainer}>
              <Text style={styles.emoji}>🎯</Text>
            </View>

            {/* Title */}
            <Text style={styles.cardTitle}>Erstelle mir einen Plan</Text>

            {/* Description */}
            <Text style={styles.cardDescription}>
              Beantworte ein paar Fragen und erhalte den perfekten Plan für
              dich
            </Text>

            {/* Arrow Indicator */}
            <View style={styles.arrowContainer}>
              <Text style={styles.arrow}>→</Text>
            </View>
          </View>
        </Card>

        {/* Option 2: Custom Plan Flow */}
        <Card
          onPress={handleCustomFlow}
          padding="large"
          elevation="medium"
          style={styles.optionCard}
        >
          <View style={styles.cardContent}>
            {/* Icon */}
            <View style={styles.iconContainer}>
              <Text style={styles.emoji}>🛠️</Text>
            </View>

            {/* Title */}
            <Text style={styles.cardTitle}>Plan selber zusammenstellen</Text>

            {/* Description */}
            <Text style={styles.cardDescription}>
              Wähle Trainingstage und Übungen selbst aus
            </Text>

            {/* Arrow Indicator */}
            <View style={styles.arrowContainer}>
              <Text style={styles.arrow}>→</Text>
            </View>
          </View>
        </Card>

        {/* Bottom spacing for better scroll experience */}
        <View style={styles.bottomSpacing} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollContent: {
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.lg,
  },
  header: {
    marginBottom: SPACING.lg,
  },
  headerText: {
    ...TYPOGRAPHY.body,
    color: COLORS.textSecondary,
  },
  optionCard: {
    marginBottom: SPACING.md,
    // Add extra visual emphasis
    minHeight: 180,
  },
  cardContent: {
    alignItems: "center",
    justifyContent: "center",
  },
  iconContainer: {
    marginBottom: SPACING.md,
  },
  emoji: {
    fontSize: 48,
    textAlign: "center",
  },
  cardTitle: {
    ...TYPOGRAPHY.h2,
    fontSize: 20,
    fontWeight: "600",
    marginBottom: SPACING.md,
    textAlign: "center",
  },
  cardDescription: {
    ...TYPOGRAPHY.caption,
    textAlign: "center",
    lineHeight: 20,
    paddingHorizontal: SPACING.md,
  },
  arrowContainer: {
    marginTop: SPACING.lg,
  },
  arrow: {
    fontSize: 24,
    color: COLORS.textSecondary,
  },
  bottomSpacing: {
    height: SPACING.xl,
  },
});
