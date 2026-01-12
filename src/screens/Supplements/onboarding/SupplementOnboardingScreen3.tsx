import React from "react";
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useSupplementOnboarding } from "../../../contexts/SupplementOnboardingContext";
import { ProgressBar } from "../../../components/ui/ProgressBar";
import { Button } from "../../../components/ui/Button";
import {
  COLORS,
  SPACING,
  TYPOGRAPHY,
  SHADOWS,
  BORDER_RADIUS,
} from "../../../components/ui/theme";
import { SupplementStackParamList } from "../../../navigation/SupplementStackNavigator";

type JointIssue = "knee" | "tendons" | "shoulder" | "back";

interface JointOption {
  id: JointIssue;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  description: string;
}

const JOINT_OPTIONS: JointOption[] = [
  {
    id: "knee",
    label: "Knie",
    icon: "body-outline",
    description: "Schmerzen oder Beschwerden im Kniegelenk",
  },
  {
    id: "tendons",
    label: "Sehnen",
    icon: "fitness-outline",
    description: "Sehnenentzündungen oder -reizungen",
  },
  {
    id: "shoulder",
    label: "Schulter",
    icon: "accessibility-outline",
    description: "Schulterprobleme oder eingeschränkte Beweglichkeit",
  },
  {
    id: "back",
    label: "Rücken",
    icon: "walk-outline",
    description: "Rückenschmerzen oder Verspannungen",
  },
];

type NavigationProp = NativeStackNavigationProp<
  SupplementStackParamList,
  "SupplementOnboardingScreen3"
>;

/**
 * Supplement Onboarding Screen 3: Verletzungen/Gelenkbeschwerden
 * Collects information about joint issues and injuries
 */
export const SupplementOnboardingScreen3: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { data, updateData, progress, error } = useSupplementOnboarding();

  const toggleJointIssue = (issue: JointIssue) => {
    const currentIssues = data.joint_issues || [];
    const isSelected = currentIssues.includes(issue);

    if (isSelected) {
      updateData({ joint_issues: currentIssues.filter((i) => i !== issue) });
    } else {
      updateData({ joint_issues: [...currentIssues, issue] });
    }
  };

  const isSelected = (issue: JointIssue) =>
    data.joint_issues?.includes(issue) || false;

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Progress Bar */}
        <ProgressBar progress={progress} />

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.stepIndicator}>Schritt 3 von 4</Text>
          <Text style={styles.title}>Gelenke & Verletzungen</Text>
          <Text style={styles.subtitle}>
            Hast du aktuelle oder chronische Beschwerden? Dies hilft uns,
            Supplements für Gelenkgesundheit zu empfehlen.
          </Text>
        </View>

        {/* Options Grid */}
        <View style={styles.optionsGrid}>
          {JOINT_OPTIONS.map((option) => (
            <TouchableOpacity
              key={option.id}
              style={[
                styles.optionCard,
                isSelected(option.id) && styles.optionCardSelected,
              ]}
              onPress={() => toggleJointIssue(option.id)}
              activeOpacity={0.7}
            >
              <View
                style={[
                  styles.iconContainer,
                  isSelected(option.id) && styles.iconContainerSelected,
                ]}
              >
                <Ionicons
                  name={option.icon}
                  size={32}
                  color={
                    isSelected(option.id) ? COLORS.white : COLORS.secondary
                  }
                />
              </View>
              <Text
                style={[
                  styles.optionLabel,
                  isSelected(option.id) && styles.optionLabelSelected,
                ]}
              >
                {option.label}
              </Text>
              <Text style={styles.optionDescription}>{option.description}</Text>
              {isSelected(option.id) && (
                <View style={styles.checkBadge}>
                  <Ionicons name="checkmark" size={16} color={COLORS.white} />
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Recommendation Box */}
        <View style={styles.recommendationBox}>
          <View style={styles.recommendationHeader}>
            <Ionicons name="leaf-outline" size={20} color={COLORS.secondary} />
            <Text style={styles.recommendationTitle}>
              Empfohlene Supplements
            </Text>
          </View>
          <Text style={styles.recommendationText}>
            Bei Gelenkbeschwerden koennen Kollagen, Glucosamin, Hyaluron und
            Omega-3-Fettsaeuren unterstuetzend wirken.
          </Text>
        </View>

        {/* Hint */}
        <View style={styles.hintContainer}>
          <Ionicons
            name="information-circle-outline"
            size={20}
            color={COLORS.textSecondary}
          />
          <Text style={styles.hintText}>
            Mehrfachauswahl moeglich. Keine Auswahl bedeutet keine bekannten
            Beschwerden.
          </Text>
        </View>

        {/* Error Message */}
        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* Buttons */}
        <View style={styles.buttonRow}>
          <Button
            title="Zurück"
            variant="outline"
            onPress={() => navigation.goBack()}
            style={styles.backButton}
          />
          <Button
            title="Weiter"
            onPress={() => navigation.navigate("SupplementOnboardingScreen4")}
            style={styles.nextButton}
          />
        </View>

        {/* Bottom Spacing */}
        <View style={styles.bottomSpacing} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.lg,
  },
  header: {
    marginTop: SPACING.md,
    marginBottom: SPACING.xl,
  },
  stepIndicator: {
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.medium,
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
  },
  title: {
    fontSize: TYPOGRAPHY.sizes.xxxl,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  subtitle: {
    fontSize: TYPOGRAPHY.sizes.md,
    color: COLORS.textSecondary,
    lineHeight: 22,
  },
  optionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: SPACING.md,
    marginBottom: SPACING.lg,
  },
  optionCard: {
    width: "47%",
    padding: SPACING.lg,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 2,
    borderColor: COLORS.borderLight,
    alignItems: "center",
    position: "relative",
    ...SHADOWS.sm,
  },
  optionCardSelected: {
    borderColor: COLORS.secondary,
    backgroundColor: COLORS.secondaryLight + "15",
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.secondaryLight + "20",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: SPACING.md,
  },
  iconContainerSelected: {
    backgroundColor: COLORS.secondary,
  },
  optionLabel: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.text,
    marginBottom: SPACING.xs,
    textAlign: "center",
  },
  optionLabelSelected: {
    color: COLORS.secondary,
  },
  optionDescription: {
    fontSize: TYPOGRAPHY.sizes.xs,
    color: COLORS.textSecondary,
    textAlign: "center",
    lineHeight: 16,
  },
  checkBadge: {
    position: "absolute",
    top: SPACING.sm,
    right: SPACING.sm,
    width: 24,
    height: 24,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.secondary,
    justifyContent: "center",
    alignItems: "center",
  },
  recommendationBox: {
    padding: SPACING.lg,
    backgroundColor: COLORS.secondary + "10",
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.secondary + "30",
    marginBottom: SPACING.lg,
  },
  recommendationHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
    marginBottom: SPACING.sm,
  },
  recommendationTitle: {
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.text,
  },
  recommendationText: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  hintContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: SPACING.md,
    backgroundColor: COLORS.surfaceSecondary,
    borderRadius: BORDER_RADIUS.md,
    gap: SPACING.sm,
  },
  hintText: {
    flex: 1,
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  errorContainer: {
    backgroundColor: "#FFEBEE",
    padding: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    marginTop: SPACING.md,
  },
  errorText: {
    color: COLORS.error,
    fontSize: TYPOGRAPHY.sizes.sm,
    textAlign: "center",
  },
  buttonRow: {
    flexDirection: "row",
    gap: SPACING.md,
    marginTop: SPACING.xl,
  },
  backButton: {
    flex: 1,
  },
  nextButton: {
    flex: 2,
  },
  bottomSpacing: {
    height: SPACING.xl,
  },
});
