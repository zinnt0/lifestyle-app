import React, { useState } from "react";
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  TextInput,
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

interface LabValueField {
  key: keyof NonNullable<
    ReturnType<typeof useSupplementOnboarding>["data"]["lab_values"]
  >;
  label: string;
  unit: string;
  placeholder: string;
  description: string;
  normalRange: string;
}

const LAB_VALUE_FIELDS: LabValueField[] = [
  {
    key: "vitamin_d",
    label: "25-OH-Vitamin D3",
    unit: "ng/mL",
    placeholder: "z.B. 35",
    description: "Vitamin D Status",
    normalRange: "30-50 ng/mL",
  },
  {
    key: "hemoglobin",
    label: "Hämoglobin",
    unit: "g/dL",
    placeholder: "z.B. 14.5",
    description: "Sauerstofftransport im Blut",
    normalRange: "M: 14-18, F: 12-16 g/dL",
  },
  {
    key: "mcv",
    label: "MCV",
    unit: "fL",
    placeholder: "z.B. 88",
    description: "Mittleres Erythrozytenvolumen",
    normalRange: "80-100 fL",
  },
  {
    key: "crp",
    label: "CRP",
    unit: "mg/L",
    placeholder: "z.B. 1.2",
    description: "Entzündungsmarker",
    normalRange: "< 5 mg/L",
  },
  {
    key: "alt",
    label: "GPT (ALT)",
    unit: "U/L",
    placeholder: "z.B. 25",
    description: "Leberenzym",
    normalRange: "< 41 U/L",
  },
  {
    key: "ggt",
    label: "Gamma-GT",
    unit: "U/L",
    placeholder: "z.B. 30",
    description: "Leberenzym",
    normalRange: "M: < 60, F: < 40 U/L",
  },
  {
    key: "testosterone",
    label: "Testosteron",
    unit: "ng/mL",
    placeholder: "z.B. 5",
    description: "Geschlechtshormon",
    normalRange: "M: 3-10, F: 0.15-0.7 ng/mL",
  },
  {
    key: "estradiol",
    label: "Östradiol (E2)",
    unit: "pg/mL",
    placeholder: "z.B. 30",
    description: "Geschlechtshormon",
    normalRange: "Variiert nach Zyklus",
  },
];

type NavigationProp = NativeStackNavigationProp<
  SupplementStackParamList,
  "SupplementOnboardingScreen4"
>;

/**
 * Supplement Onboarding Screen 4: Laborwerte (optional)
 * Collects optional lab values for more precise recommendations
 */
export const SupplementOnboardingScreen4: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const {
    data,
    updateData,
    skipLabValues,
    submitOnboarding,
    progress,
    error,
    isSubmitting,
  } = useSupplementOnboarding();

  const [localLabValues, setLocalLabValues] = useState<Record<string, string>>(
    {}
  );
  const [showAllFields, setShowAllFields] = useState(false);

  const updateLabValue = (key: string, value: string) => {
    setLocalLabValues((prev) => ({ ...prev, [key]: value }));

    // Parse and update context
    const numValue = parseFloat(value);
    const currentLabValues = data.lab_values || {};

    updateData({
      lab_values: {
        ...currentLabValues,
        [key]: isNaN(numValue) ? null : numValue,
      },
    });
  };

  const handleSubmit = async () => {
    try {
      await submitOnboarding();
      // Navigate to Coming Soon screen after successful submission
      navigation.navigate("SupplementsComingSoon");
    } catch (err) {
      // Error is handled by context
    }
  };

  const handleSkip = async () => {
    try {
      await skipLabValues();
      // Navigate to Coming Soon screen after skipping
      navigation.navigate("SupplementsComingSoon");
    } catch (err) {
      // Error is handled by context
    }
  };

  const visibleFields = showAllFields
    ? LAB_VALUE_FIELDS
    : LAB_VALUE_FIELDS.slice(0, 4);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Progress Bar */}
        <ProgressBar progress={progress} />

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.stepIndicator}>Schritt 4 von 4</Text>
          <Text style={styles.title}>Laborwerte</Text>
          <Text style={styles.subtitle}>
            Optional: Wenn du aktuelle Blutwerte hast, können wir noch präzisere
            Empfehlungen geben.
          </Text>
        </View>

        {/* Skip Notice */}
        <View style={styles.skipNotice}>
          <Ionicons name="bulb-outline" size={20} color={COLORS.warning} />
          <Text style={styles.skipNoticeText}>
            Du kannst diesen Schritt überspringen und später im Profil ergänzen.
          </Text>
        </View>

        {/* Lab Value Fields */}
        <View style={styles.fieldsContainer}>
          {visibleFields.map((field) => (
            <View key={field.key} style={styles.fieldCard}>
              <View style={styles.fieldHeader}>
                <Text style={styles.fieldLabel}>{field.label}</Text>
                <Text style={styles.fieldUnit}>{field.unit}</Text>
              </View>
              <Text style={styles.fieldDescription}>{field.description}</Text>
              <View style={styles.inputRow}>
                <TextInput
                  style={styles.input}
                  value={localLabValues[field.key] || ""}
                  onChangeText={(value) => updateLabValue(field.key, value)}
                  placeholder={field.placeholder}
                  placeholderTextColor={COLORS.textTertiary}
                  keyboardType="decimal-pad"
                  returnKeyType="done"
                />
                <View style={styles.normalRange}>
                  <Text style={styles.normalRangeLabel}>Normal:</Text>
                  <Text style={styles.normalRangeValue}>
                    {field.normalRange}
                  </Text>
                </View>
              </View>
            </View>
          ))}
        </View>

        {/* Show More Button */}
        {!showAllFields && (
          <TouchableOpacity
            style={styles.showMoreButton}
            onPress={() => setShowAllFields(true)}
            activeOpacity={0.7}
          >
            <Text style={styles.showMoreText}>
              Weitere Werte anzeigen ({LAB_VALUE_FIELDS.length - 4})
            </Text>
            <Ionicons name="chevron-down" size={20} color={COLORS.primary} />
          </TouchableOpacity>
        )}

        {/* Info Box */}
        <View style={styles.infoBox}>
          <Ionicons
            name="shield-checkmark-outline"
            size={24}
            color={COLORS.secondary}
          />
          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>Datenschutz</Text>
            <Text style={styles.infoText}>
              Deine Laborwerte werden sicher gespeichert und nur für
              personalisierte Supplement-Empfehlungen verwendet. Du kannst sie
              jederzeit löschen.
            </Text>
          </View>
        </View>

        {/* Error Message */}
        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {/* Buttons */}
        <View style={styles.buttonContainer}>
          <View style={styles.buttonRow}>
            <Button
              title="Zurück"
              variant="outline"
              onPress={() => navigation.goBack()}
              style={styles.backButton}
            />
            <Button
              title={isSubmitting ? "Speichern..." : "Fertig"}
              onPress={handleSubmit}
              style={styles.submitButton}
              disabled={isSubmitting}
            />
          </View>
          <TouchableOpacity
            style={styles.skipButton}
            onPress={handleSkip}
            disabled={isSubmitting}
          >
            <Text style={styles.skipButtonText}>
              Ohne Laborwerte fortfahren
            </Text>
          </TouchableOpacity>
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
    marginBottom: SPACING.lg,
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
  skipNotice: {
    flexDirection: "row",
    alignItems: "center",
    padding: SPACING.md,
    backgroundColor: COLORS.warning + "15",
    borderRadius: BORDER_RADIUS.md,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.warning,
    marginBottom: SPACING.lg,
    gap: SPACING.sm,
  },
  skipNoticeText: {
    flex: 1,
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.text,
    lineHeight: 20,
  },
  fieldsContainer: {
    gap: SPACING.md,
  },
  fieldCard: {
    padding: SPACING.lg,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    ...SHADOWS.sm,
  },
  fieldHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  fieldLabel: {
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.text,
  },
  fieldUnit: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textSecondary,
    fontWeight: TYPOGRAPHY.weights.medium,
  },
  fieldDescription: {
    fontSize: TYPOGRAPHY.sizes.xs,
    color: COLORS.textTertiary,
    marginBottom: SPACING.md,
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.md,
  },
  input: {
    flex: 1,
    height: 48,
    paddingHorizontal: SPACING.md,
    backgroundColor: COLORS.surfaceSecondary,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    fontSize: TYPOGRAPHY.sizes.md,
    color: COLORS.text,
  },
  normalRange: {
    alignItems: "flex-end",
  },
  normalRangeLabel: {
    fontSize: TYPOGRAPHY.sizes.xs,
    color: COLORS.textTertiary,
  },
  normalRangeValue: {
    fontSize: TYPOGRAPHY.sizes.xs,
    color: COLORS.textSecondary,
    fontWeight: TYPOGRAPHY.weights.medium,
  },
  showMoreButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: SPACING.md,
    marginTop: SPACING.md,
    gap: SPACING.xs,
  },
  showMoreText: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.primary,
    fontWeight: TYPOGRAPHY.weights.medium,
  },
  infoBox: {
    flexDirection: "row",
    padding: SPACING.lg,
    backgroundColor: COLORS.secondary + "10",
    borderRadius: BORDER_RADIUS.lg,
    marginTop: SPACING.xl,
    gap: SPACING.md,
  },
  infoContent: {
    flex: 1,
  },
  infoTitle: {
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  infoText: {
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
  buttonRow: {
    flexDirection: "row",
    gap: SPACING.md,
  },
  backButton: {
    flex: 1,
  },
  submitButton: {
    flex: 2,
  },
  skipButton: {
    alignItems: "center",
    padding: SPACING.lg,
    marginTop: SPACING.sm,
  },
  skipButtonText: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textSecondary,
    textDecorationLine: "underline",
  },
  bottomSpacing: {
    height: SPACING.xl,
  },
});
