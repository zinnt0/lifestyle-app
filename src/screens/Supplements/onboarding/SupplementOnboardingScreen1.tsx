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

type GIIssue = "bloating" | "irritable_bowel" | "diarrhea" | "constipation";

interface GIOption {
  id: GIIssue;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  description: string;
}

const GI_OPTIONS: GIOption[] = [
  {
    id: "bloating",
    label: "Blähungen",
    icon: "cloudy-outline",
    description: "Häufiges Völlegefühl oder aufgeblähter Bauch",
  },
  {
    id: "irritable_bowel",
    label: "Reizdarm",
    icon: "pulse-outline",
    description: "Wiederkehrende Bauchschmerzen mit verändertem Stuhlgang",
  },
  {
    id: "diarrhea",
    label: "Durchfall",
    icon: "water-outline",
    description: "Häufiger oder chronischer Durchfall",
  },
  {
    id: "constipation",
    label: "Verstopfung",
    icon: "pause-outline",
    description: "Regelmäßige Verstopfung oder seltener Stuhlgang",
  },
];

/**
 * Supplement Onboarding Screen 1: GI-Beschwerden
 * Collects information about gastrointestinal issues
 */
type NavigationProp = NativeStackNavigationProp<
  SupplementStackParamList,
  "SupplementOnboardingScreen1"
>;

export const SupplementOnboardingScreen1: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { data, updateData, progress, error } = useSupplementOnboarding();

  const toggleGIIssue = (issue: GIIssue) => {
    const currentIssues = data.gi_issues || [];
    const isSelected = currentIssues.includes(issue);

    if (isSelected) {
      updateData({ gi_issues: currentIssues.filter((i) => i !== issue) });
    } else {
      updateData({ gi_issues: [...currentIssues, issue] });
    }
  };

  const isSelected = (issue: GIIssue) =>
    data.gi_issues?.includes(issue) || false;

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
          <Text style={styles.stepIndicator}>Schritt 1 von 4</Text>
          <Text style={styles.title}>Verdauung</Text>
          <Text style={styles.subtitle}>
            Hast du regelmäßig Magen-Darm-Beschwerden? Diese Information hilft
            uns, passende Supplements zu empfehlen.
          </Text>
        </View>

        {/* Options */}
        <View style={styles.optionsContainer}>
          {GI_OPTIONS.map((option) => (
            <TouchableOpacity
              key={option.id}
              style={[
                styles.optionCard,
                isSelected(option.id) && styles.optionCardSelected,
              ]}
              onPress={() => toggleGIIssue(option.id)}
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
                  size={28}
                  color={isSelected(option.id) ? COLORS.white : COLORS.primary}
                />
              </View>
              <View style={styles.optionContent}>
                <Text
                  style={[
                    styles.optionLabel,
                    isSelected(option.id) && styles.optionLabelSelected,
                  ]}
                >
                  {option.label}
                </Text>
                <Text
                  style={[
                    styles.optionDescription,
                    isSelected(option.id) && styles.optionDescriptionSelected,
                  ]}
                >
                  {option.description}
                </Text>
              </View>
              <View
                style={[
                  styles.checkbox,
                  isSelected(option.id) && styles.checkboxSelected,
                ]}
              >
                {isSelected(option.id) && (
                  <Ionicons name="checkmark" size={18} color={COLORS.white} />
                )}
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {/* Hint */}
        <View style={styles.hintContainer}>
          <Ionicons
            name="information-circle-outline"
            size={20}
            color={COLORS.textSecondary}
          />
          <Text style={styles.hintText}>
            Du kannst mehrere Optionen auswählen oder keine, wenn du keine
            Beschwerden hast.
          </Text>
        </View>

        {/* Error Message */}
        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* Button */}
        <View style={styles.buttonContainer}>
          <Button
            title="Weiter"
            onPress={() => navigation.navigate("SupplementOnboardingScreen2")}
            style={styles.button}
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
  optionsContainer: {
    gap: SPACING.md,
  },
  optionCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: SPACING.lg,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 2,
    borderColor: COLORS.borderLight,
    ...SHADOWS.sm,
  },
  optionCardSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLight + "15",
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.primaryLight + "20",
    justifyContent: "center",
    alignItems: "center",
    marginRight: SPACING.md,
  },
  iconContainerSelected: {
    backgroundColor: COLORS.primary,
  },
  optionContent: {
    flex: 1,
  },
  optionLabel: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.text,
    marginBottom: 4,
  },
  optionLabelSelected: {
    color: COLORS.primary,
  },
  optionDescription: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
  optionDescriptionSelected: {
    color: COLORS.textSecondary,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: BORDER_RADIUS.sm,
    borderWidth: 2,
    borderColor: COLORS.borderLight,
    justifyContent: "center",
    alignItems: "center",
    marginLeft: SPACING.sm,
  },
  checkboxSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  hintContainer: {
    flexDirection: "row",
    alignItems: "flex-start",
    marginTop: SPACING.xl,
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
  buttonContainer: {
    marginTop: SPACING.xl,
  },
  button: {
    width: "100%",
  },
  bottomSpacing: {
    height: SPACING.xl,
  },
});
