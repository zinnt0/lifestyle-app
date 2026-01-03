import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { useOnboarding } from '../../contexts/OnboardingContext';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { Button } from '../../components/ui/Button';
import {
  getIntolerancesCatalog,
  Intolerance,
} from '../../services/profile.service';

/**
 * Severity options with German labels
 */
const SEVERITY_OPTIONS = [
  { value: 'mild' as const, label: 'Leicht', emoji: '😐' },
  { value: 'moderate' as const, label: 'Mittel', emoji: '😕' },
  { value: 'severe' as const, label: 'Schwer', emoji: '😰' },
  { value: 'life_threatening' as const, label: 'Lebensbedrohlich', emoji: '🚨' },
];

/**
 * Onboarding Screen 5: Unverträglichkeiten
 * Allows user to select intolerances from catalog and set severity
 */
export const OnboardingScreen5: React.FC = () => {
  const { data, updateData, nextStep, previousStep, progress, error } =
    useOnboarding();

  const [catalog, setCatalog] = useState<Intolerance[]>([]);
  const [loading, setLoading] = useState(true);
  const [catalogError, setCatalogError] = useState<string | null>(null);

  useEffect(() => {
    loadCatalog();
  }, []);

  const loadCatalog = async () => {
    setLoading(true);
    setCatalogError(null);

    const { intolerances, error } = await getIntolerancesCatalog();

    if (error) {
      setCatalogError(error.message);
    } else {
      setCatalog(intolerances);
    }

    setLoading(false);
  };

  const toggleIntolerance = (intoleranceId: string) => {
    const exists = data.intolerances.find(
      (i) => i.intolerance_id === intoleranceId
    );

    if (exists) {
      // Remove from selection
      updateData({
        intolerances: data.intolerances.filter(
          (i) => i.intolerance_id !== intoleranceId
        ),
      });
    } else {
      // Add with default severity
      updateData({
        intolerances: [
          ...data.intolerances,
          { intolerance_id: intoleranceId, severity: 'moderate' },
        ],
      });
    }
  };

  const updateSeverity = (
    intoleranceId: string,
    severity: 'mild' | 'moderate' | 'severe' | 'life_threatening'
  ) => {
    updateData({
      intolerances: data.intolerances.map((i) =>
        i.intolerance_id === intoleranceId ? { ...i, severity } : i
      ),
    });
  };

  const skip = () => {
    updateData({ intolerances: [] });
    nextStep();
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
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
          <Text style={styles.stepIndicator}>Schritt 6 von 7</Text>
          <Text style={styles.title}>Unverträglichkeiten</Text>
          <Text style={styles.subtitle}>
            Optional: Hilft uns bei der Ernährungsplanung
          </Text>
        </View>

        {/* Loading State */}
        {loading && (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
            <Text style={styles.loadingText}>Lade Katalog...</Text>
          </View>
        )}

        {/* Error State */}
        {catalogError && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{catalogError}</Text>
            <Button
              title="Erneut versuchen"
              onPress={loadCatalog}
              variant="outline"
              style={styles.retryButton}
            />
          </View>
        )}

        {/* Intolerances List */}
        {!loading && !catalogError && (
          <View style={styles.list}>
            {catalog.map((intolerance) => {
              const selected = data.intolerances.find(
                (i) => i.intolerance_id === intolerance.id
              );

              return (
                <View key={intolerance.id} style={styles.intoleranceItem}>
                  {/* Intolerance Card */}
                  <TouchableOpacity
                    style={[
                      styles.intoleranceCard,
                      selected && styles.intoleranceCardSelected,
                    ]}
                    onPress={() => toggleIntolerance(intolerance.id)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.checkboxContainer}>
                      <View
                        style={[
                          styles.checkbox,
                          selected && styles.checkboxSelected,
                        ]}
                      >
                        {selected && <Text style={styles.checkmark}>✓</Text>}
                      </View>
                    </View>

                    <View style={styles.intoleranceContent}>
                      <Text
                        style={[
                          styles.intoleranceName,
                          selected && styles.intoleranceNameSelected,
                        ]}
                      >
                        {intolerance.name}
                      </Text>
                      {intolerance.description && (
                        <Text style={styles.intoleranceDescription}>
                          {intolerance.description}
                        </Text>
                      )}
                      <Text style={styles.intoleranceCategory}>
                        {getCategoryLabel(intolerance.category)}
                      </Text>
                    </View>
                  </TouchableOpacity>

                  {/* Severity Picker (only if selected) */}
                  {selected && (
                    <View style={styles.severityContainer}>
                      <Text style={styles.severityLabel}>Schweregrad:</Text>
                      <View style={styles.severityButtons}>
                        {SEVERITY_OPTIONS.map((option) => (
                          <TouchableOpacity
                            key={option.value}
                            style={[
                              styles.severityButton,
                              selected.severity === option.value &&
                                styles.severityButtonSelected,
                            ]}
                            onPress={() =>
                              updateSeverity(intolerance.id, option.value)
                            }
                            activeOpacity={0.7}
                          >
                            <Text style={styles.severityEmoji}>
                              {option.emoji}
                            </Text>
                            <Text
                              style={[
                                styles.severityButtonText,
                                selected.severity === option.value &&
                                  styles.severityButtonTextSelected,
                              ]}
                            >
                              {option.label}
                            </Text>
                          </TouchableOpacity>
                        ))}
                      </View>
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        )}

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
            onPress={previousStep}
            style={styles.backButton}
          />
          <Button
            title="Überspringen"
            variant="text"
            onPress={skip}
            style={styles.skipButton}
          />
          <Button
            title="Weiter"
            onPress={nextStep}
            style={styles.nextButton}
          />
        </View>

        {/* Bottom Spacing */}
        <View style={styles.bottomSpacing} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

/**
 * Get German label for category
 */
const getCategoryLabel = (category: string): string => {
  const labels: Record<string, string> = {
    allergen: 'Allergen',
    intolerance: 'Unverträglichkeit',
    dietary_restriction: 'Ernährungseinschränkung',
    preference: 'Präferenz',
  };
  return labels[category] || category;
};

const COLORS = {
  primary: '#007AFF',
  success: '#34C759',
  error: '#FF3B30',
  text: '#000000',
  textSecondary: '#8E8E93',
  border: '#C6C6C8',
  borderLight: '#E5E5EA',
  background: '#FFFFFF',
  backgroundSecondary: '#F2F2F7',
};

const SPACING = {
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
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
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
    lineHeight: 22,
  },
  loadingContainer: {
    alignItems: 'center',
    paddingVertical: SPACING.xl * 2,
  },
  loadingText: {
    marginTop: SPACING.md,
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  list: {
    gap: SPACING.md,
  },
  intoleranceItem: {
    marginBottom: SPACING.md,
  },
  intoleranceCard: {
    flexDirection: 'row',
    padding: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    borderRadius: 12,
    backgroundColor: COLORS.background,
  },
  intoleranceCardSelected: {
    borderColor: COLORS.primary,
    borderWidth: 2,
    backgroundColor: COLORS.backgroundSecondary,
  },
  checkboxContainer: {
    marginRight: SPACING.md,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: COLORS.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxSelected: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  checkmark: {
    color: COLORS.background,
    fontSize: 16,
    fontWeight: '700',
  },
  intoleranceContent: {
    flex: 1,
  },
  intoleranceName: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: 4,
  },
  intoleranceNameSelected: {
    color: COLORS.primary,
  },
  intoleranceDescription: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: 4,
  },
  intoleranceCategory: {
    fontSize: 12,
    color: COLORS.textSecondary,
    fontStyle: 'italic',
  },
  severityContainer: {
    marginTop: SPACING.md,
    paddingHorizontal: SPACING.md,
  },
  severityLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  severityButtons: {
    flexDirection: 'row',
    gap: SPACING.sm,
  },
  severityButton: {
    flex: 1,
    padding: SPACING.sm,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    borderRadius: 8,
    alignItems: 'center',
  },
  severityButtonSelected: {
    borderColor: COLORS.primary,
    borderWidth: 2,
    backgroundColor: COLORS.backgroundSecondary,
  },
  severityEmoji: {
    fontSize: 20,
    marginBottom: 4,
  },
  severityButtonText: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  severityButtonTextSelected: {
    color: COLORS.primary,
    fontWeight: '600',
  },
  errorContainer: {
    backgroundColor: '#FFEBEE',
    padding: SPACING.md,
    borderRadius: 8,
    marginTop: SPACING.md,
    alignItems: 'center',
  },
  errorText: {
    color: COLORS.error,
    fontSize: 14,
    textAlign: 'center',
  },
  retryButton: {
    marginTop: SPACING.md,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: SPACING.sm,
    marginTop: SPACING.xl,
  },
  backButton: {
    flex: 1,
  },
  skipButton: {
    flex: 1,
  },
  nextButton: {
    flex: 1,
  },
  bottomSpacing: {
    height: SPACING.xl,
  },
});
