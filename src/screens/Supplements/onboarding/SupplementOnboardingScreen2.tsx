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
import { Slider } from "../../../components/ui/Slider";
import {
  COLORS,
  SPACING,
  TYPOGRAPHY,
  SHADOWS,
  BORDER_RADIUS,
} from "../../../components/ui/theme";
import { SupplementStackParamList } from "../../../navigation/SupplementStackNavigator";

type NavigationProp = NativeStackNavigationProp<
  SupplementStackParamList,
  "SupplementOnboardingScreen2"
>;

/**
 * Supplement Onboarding Screen 2: Hydration/Schweissrate
 * Collects information about sweating and salt intake
 */
export const SupplementOnboardingScreen2: React.FC = () => {
  const navigation = useNavigation<NavigationProp>();
  const { data, updateData, progress, error } = useSupplementOnboarding();

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
          <Text style={styles.stepIndicator}>Schritt 2 von 4</Text>
          <Text style={styles.title}>Hydration</Text>
          <Text style={styles.subtitle}>
            Informationen zu deinem Schweißverhalten helfen bei
            Elektrolyt-Empfehlungen.
          </Text>
        </View>

        {/* Heavy Sweating Option */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Schwitzt du stark beim Training?
          </Text>
          <Text style={styles.sectionDescription}>
            Starkes Schwitzen erhöht den Bedarf an Elektrolyten und
            Mineralstoffen.
          </Text>

          <View style={styles.toggleContainer}>
            <TouchableOpacity
              style={[
                styles.toggleOption,
                data.heavy_sweating && styles.toggleOptionSelected,
              ]}
              onPress={() => updateData({ heavy_sweating: true })}
              activeOpacity={0.7}
            >
              <Ionicons
                name="water"
                size={32}
                color={data.heavy_sweating ? COLORS.white : COLORS.primary}
              />
              <Text
                style={[
                  styles.toggleText,
                  data.heavy_sweating && styles.toggleTextSelected,
                ]}
              >
                Ja, stark
              </Text>
              <Text
                style={[
                  styles.toggleSubtext,
                  data.heavy_sweating && styles.toggleSubtextSelected,
                ]}
              >
                Kleidung oft durchnässt
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.toggleOption,
                !data.heavy_sweating && styles.toggleOptionSelected,
              ]}
              onPress={() => updateData({ heavy_sweating: false })}
              activeOpacity={0.7}
            >
              <Ionicons
                name="water-outline"
                size={32}
                color={!data.heavy_sweating ? COLORS.white : COLORS.primary}
              />
              <Text
                style={[
                  styles.toggleText,
                  !data.heavy_sweating && styles.toggleTextSelected,
                ]}
              >
                Normal
              </Text>
              <Text
                style={[
                  styles.toggleSubtext,
                  !data.heavy_sweating && styles.toggleSubtextSelected,
                ]}
              >
                Durchschnittlich
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Info Box */}
        <View style={styles.infoBox}>
          <Ionicons name="flask-outline" size={24} color={COLORS.primary} />
          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>Warum ist das wichtig?</Text>
            <Text style={styles.infoText}>
              Starkes Schwitzen erhöht den Verlust von Natrium, Kalium und
              Magnesium. Wenig Sonnenexposition kann zu Vitamin-D-Mangel führen,
              was Immunsystem, Knochen und Stimmung beeinflusst.
            </Text>
          </View>
        </View>

        {/* Salt Intake Option */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Nimmst du viel Salz zu dir?</Text>
          <Text style={styles.sectionDescription}>
            Die Salzaufnahme beeinflusst den Elektrolythaushalt und die
            Hydration.
          </Text>

          <View style={styles.toggleContainer}>
            <TouchableOpacity
              style={[
                styles.toggleOption,
                data.high_salt_intake && styles.toggleOptionSelected,
              ]}
              onPress={() => updateData({ high_salt_intake: true })}
              activeOpacity={0.7}
            >
              <Ionicons
                name="nutrition"
                size={32}
                color={data.high_salt_intake ? COLORS.white : COLORS.secondary}
              />
              <Text
                style={[
                  styles.toggleText,
                  data.high_salt_intake && styles.toggleTextSelected,
                ]}
              >
                Ja, viel
              </Text>
              <Text
                style={[
                  styles.toggleSubtext,
                  data.high_salt_intake && styles.toggleSubtextSelected,
                ]}
              >
                Salzige Speisen bevorzugt
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.toggleOption,
                !data.high_salt_intake && styles.toggleOptionSelected,
              ]}
              onPress={() => updateData({ high_salt_intake: false })}
              activeOpacity={0.7}
            >
              <Ionicons
                name="nutrition-outline"
                size={32}
                color={!data.high_salt_intake ? COLORS.white : COLORS.secondary}
              />
              <Text
                style={[
                  styles.toggleText,
                  !data.high_salt_intake && styles.toggleTextSelected,
                ]}
              >
                Normal
              </Text>
              <Text
                style={[
                  styles.toggleSubtext,
                  !data.high_salt_intake && styles.toggleSubtextSelected,
                ]}
              >
                Durchschnittlich
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Info Box for Salt */}
        <View style={styles.infoBox}>
          <Ionicons
            name="information-circle-outline"
            size={24}
            color={COLORS.secondary}
          />
          <View style={styles.infoContent}>
            <Text style={styles.infoTitle}>Salz und Elektrolyte</Text>
            <Text style={styles.infoText}>
              Eine hohe Salzaufnahme erhöht den Natriumbedarf und kann die
              Balance mit anderen Elektrolyten wie Kalium beeinflussen. Bei
              niedriger Salzaufnahme kann zusätzliches Natrium beim Sport
              wichtig sein.
            </Text>
          </View>
        </View>

        {/* Sun Exposure Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Wie viele Stunden verbringst du pro Woche in der Sonne?
          </Text>
          <Text style={styles.sectionDescription}>
            Sonnenexposition beeinflusst deinen Vitamin-D-Spiegel und damit
            viele Körperfunktionen.
          </Text>

          <View style={styles.sliderContainer}>
            <Slider
              label="Sonnenexposition"
              value={data.sun_exposure_hours}
              minimumValue={0}
              maximumValue={20}
              step={1}
              formatValue={(val) =>
                val >= 20 ? "20+ Stunden" : `${val} Stunden`
              }
              minimumLabel="0h"
              maximumLabel="20h+"
              onValueChange={(val) => updateData({ sun_exposure_hours: val })}
            />
          </View>

          <View style={styles.sunExposureHints}>
            <View style={styles.hintRow}>
              <Ionicons name="sunny-outline" size={16} color={COLORS.warning} />
              <Text style={styles.hintText}>
                0-3h: Sehr wenig (Büroarbeit, wenig draußen)
              </Text>
            </View>
            <View style={styles.hintRow}>
              <Ionicons
                name="partly-sunny-outline"
                size={16}
                color={COLORS.secondary}
              />
              <Text style={styles.hintText}>
                4-7h: Moderat (regelmäßig draußen)
              </Text>
            </View>
            <View style={styles.hintRow}>
              <Ionicons name="sunny" size={16} color={COLORS.primary} />
              <Text style={styles.hintText}>
                8h+: Viel (Outdoor-Sport, Gartenarbeit)
              </Text>
            </View>
          </View>
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
            onPress={() => navigation.navigate("SupplementOnboardingScreen3")}
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
  section: {
    marginBottom: SPACING.xl,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  sectionDescription: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textSecondary,
    marginBottom: SPACING.lg,
    lineHeight: 20,
  },
  toggleContainer: {
    flexDirection: "row",
    gap: SPACING.md,
  },
  toggleOption: {
    flex: 1,
    padding: SPACING.lg,
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    borderWidth: 2,
    borderColor: COLORS.borderLight,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 120,
    ...SHADOWS.sm,
  },
  toggleOptionSelected: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary,
  },
  toggleText: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.text,
    marginTop: SPACING.sm,
  },
  toggleTextSelected: {
    color: COLORS.white,
  },
  toggleSubtext: {
    fontSize: TYPOGRAPHY.sizes.xs,
    color: COLORS.textSecondary,
    marginTop: 4,
    textAlign: "center",
  },
  toggleSubtextSelected: {
    color: COLORS.white + "CC",
  },
  infoBox: {
    flexDirection: "row",
    padding: SPACING.lg,
    backgroundColor: COLORS.primaryLight + "15",
    borderRadius: BORDER_RADIUS.lg,
    borderLeftWidth: 4,
    borderLeftColor: COLORS.primary,
    marginTop: SPACING.md,
    marginBottom: SPACING.lg,
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
  sliderContainer: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    ...SHADOWS.sm,
  },
  sunExposureHints: {
    marginTop: SPACING.md,
    gap: SPACING.sm,
  },
  hintRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
  },
  hintText: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textSecondary,
    flex: 1,
  },
});
