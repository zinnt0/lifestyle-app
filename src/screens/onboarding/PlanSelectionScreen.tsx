import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useOnboarding } from '../../contexts/OnboardingContext';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { Button } from '../../components/ui/Button';
import {
  getTopWomenPlanRecommendations,
  convertOnboardingDataToWomenData,
  type ScoredPlan,
} from '../../services/womenTrainingPlanService';
import { getTopRecommendations } from '../../utils/planRecommendationScoring';

/**
 * Plan Selection Screen
 * Shows recommended training plans based on user's onboarding data
 * For women: Uses the decision tree algorithm
 * For men: Uses the existing recommendation system
 */
export const PlanSelectionScreen: React.FC = () => {
  const { data, updateData, previousStep, submitOnboarding, progress, isSubmitting } = useOnboarding();

  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPlanId, setSelectedPlanId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isFemale = data.gender === 'female';

  useEffect(() => {
    loadRecommendations();
  }, []);

  const loadRecommendations = async () => {
    try {
      setLoading(true);
      setError(null);

      if (isFemale) {
        // Use women's training plan recommendation system
        const womenData = convertOnboardingDataToWomenData(data);
        const womenRecs = await getTopWomenPlanRecommendations(womenData);
        setRecommendations(womenRecs);
      } else {
        // Use existing recommendation system for men
        const userProfile = {
          fitness_level: data.fitness_level,
          available_training_days: data.available_training_days || 3,
          primary_goal: data.primary_goal,
          has_gym_access: data.has_gym_access,
          training_experience_months: data.training_experience_months || 0,
        };
        const menRecs = await getTopRecommendations(userProfile as any);
        setRecommendations(menRecs);
      }
    } catch (err: any) {
      console.error('Error loading recommendations:', err);
      setError(err.message || 'Fehler beim Laden der Trainingspläne');
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPlan = (planId: string) => {
    setSelectedPlanId(planId);
  };

  const handleContinue = async () => {
    if (!selectedPlanId) {
      Alert.alert('Hinweis', 'Bitte wähle einen Trainingsplan aus');
      return;
    }

    // Store selected plan ID
    // The actual plan creation will happen in the onboarding submission
    updateData({ selected_plan_template_id: selectedPlanId } as any);

    // Submit onboarding
    await submitOnboarding();
  };

  const handleSkip = async () => {
    // User can skip plan selection and choose later
    await submitOnboarding();
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Suche passende Trainingspläne...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorTitle}>😕 Fehler</Text>
        <Text style={styles.errorText}>{error}</Text>
        <Button onPress={loadRecommendations} style={styles.retryButton}>
          Erneut versuchen
        </Button>
        <Button variant="outline" onPress={handleSkip}>
          Überspringen
        </Button>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Progress Bar */}
        <ProgressBar progress={progress} />

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.stepIndicator}>Schritt 8 von 8</Text>
          <Text style={styles.title}>Deine Trainingsplan-Empfehlungen</Text>
          <Text style={styles.subtitle}>
            {isFemale
              ? 'Basierend auf deinen Zielen und deiner Erfahrung haben wir diese Pläne für dich ausgewählt'
              : 'Wir haben diese Pläne basierend auf deinem Profil für dich ausgewählt'
            }
          </Text>
        </View>

        {/* Plan Cards */}
        {recommendations.length === 0 ? (
          <View style={styles.noPlansContainer}>
            <Text style={styles.noPlansText}>
              Keine passenden Pläne gefunden. Du kannst später einen Plan auswählen.
            </Text>
          </View>
        ) : (
          <View style={styles.plansContainer}>
            {recommendations.map((rec, index) => {
              const plan = isFemale ? rec.plan : rec.template;
              const score = rec.score;
              const isSelected = selectedPlanId === plan.id;
              const isTopPick = index === 0;

              return (
                <TouchableOpacity
                  key={plan.id}
                  style={[
                    styles.planCard,
                    isSelected && styles.planCardSelected,
                    isTopPick && styles.planCardTopPick,
                  ]}
                  onPress={() => handleSelectPlan(plan.id)}
                >
                  {isTopPick && (
                    <View style={styles.topPickBadge}>
                      <Text style={styles.topPickBadgeText}>🌟 Top Empfehlung</Text>
                    </View>
                  )}

                  {/* Plan Header */}
                  <View style={styles.planHeader}>
                    <Text style={styles.planName}>{plan.name}</Text>
                    <View style={styles.scoreContainer}>
                      <Text style={styles.scoreText}>{score}%</Text>
                      <Text style={styles.scoreLabel}>Match</Text>
                    </View>
                  </View>

                  {/* Plan Description */}
                  {plan.description && (
                    <Text style={styles.planDescription}>{plan.description}</Text>
                  )}

                  {/* Plan Details */}
                  <View style={styles.planDetails}>
                    <View style={styles.detailItem}>
                      <Text style={styles.detailIcon}>📅</Text>
                      <Text style={styles.detailText}>
                        {plan.days_per_week}x pro Woche
                      </Text>
                    </View>

                    {plan.fitness_level && (
                      <View style={styles.detailItem}>
                        <Text style={styles.detailIcon}>💪</Text>
                        <Text style={styles.detailText}>
                          {plan.fitness_level === 'beginner' && 'Anfänger'}
                          {plan.fitness_level === 'intermediate' && 'Fortgeschritten'}
                          {plan.fitness_level === 'advanced' && 'Profi'}
                        </Text>
                      </View>
                    )}

                    {plan.training_split && (
                      <View style={styles.detailItem}>
                        <Text style={styles.detailIcon}>🎯</Text>
                        <Text style={styles.detailText}>
                          {plan.training_split === 'ganzkoerper' && 'Ganzkörper'}
                          {plan.training_split === 'oberkoerper_unterkoerper' && 'OK/UK-Split'}
                          {plan.training_split === 'push_pull' && 'Push/Pull'}
                        </Text>
                      </View>
                    )}

                    {plan.cardio_sessions_per_week > 0 && (
                      <View style={styles.detailItem}>
                        <Text style={styles.detailIcon}>🏃</Text>
                        <Text style={styles.detailText}>
                          +{plan.cardio_sessions_per_week}x Cardio
                        </Text>
                      </View>
                    )}
                  </View>

                  {/* Match Details for Women */}
                  {isFemale && rec.matchDetails && (
                    <View style={styles.matchDetails}>
                      <Text style={styles.matchDetailsTitle}>Warum dieser Plan?</Text>
                      <View style={styles.matchDetailsList}>
                        {rec.matchDetails.goalsMatch > 70 && (
                          <Text style={styles.matchDetail}>✅ Passt zu deinen Zielen</Text>
                        )}
                        {rec.matchDetails.levelMatch > 70 && (
                          <Text style={styles.matchDetail}>✅ Passt zu deinem Level</Text>
                        )}
                        {rec.matchDetails.equipmentMatch > 70 && (
                          <Text style={styles.matchDetail}>✅ Benötigtes Equipment vorhanden</Text>
                        )}
                        {rec.matchDetails.frequencyMatch > 70 && (
                          <Text style={styles.matchDetail}>✅ Passt zu deiner Trainingsfrequenz</Text>
                        )}
                      </View>
                    </View>
                  )}

                  {isSelected && (
                    <View style={styles.selectedIndicator}>
                      <Text style={styles.selectedIndicatorText}>✓ Ausgewählt</Text>
                    </View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* Buttons */}
        <View style={styles.buttonRow}>
          <Button
            variant="outline"
            onPress={previousStep}
            style={styles.backButton}
            disabled={isSubmitting}
          >
            Zurück
          </Button>
          <Button
            onPress={handleContinue}
            style={styles.continueButton}
            disabled={!selectedPlanId || isSubmitting}
          >
            {isSubmitting ? 'Wird gespeichert...' : 'Fertig'}
          </Button>
        </View>

        <TouchableOpacity onPress={handleSkip} style={styles.skipButton} disabled={isSubmitting}>
          <Text style={styles.skipButtonText}>Später auswählen</Text>
        </TouchableOpacity>

        <View style={styles.bottomSpacing} />
      </ScrollView>
    </View>
  );
};

const COLORS = {
  primary: '#007AFF',
  success: '#34C759',
  error: '#FF3B30',
  text: '#000000',
  textSecondary: '#8E8E93',
  background: '#FFFFFF',
  cardBackground: '#F9F9F9',
  border: '#E5E5EA',
};

const SPACING = {
  xs: 4,
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.background,
  },
  loadingText: {
    marginTop: SPACING.md,
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: SPACING.lg,
    backgroundColor: COLORS.background,
  },
  errorTitle: {
    fontSize: 48,
    marginBottom: SPACING.md,
  },
  errorText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.lg,
  },
  retryButton: {
    marginBottom: SPACING.md,
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
  noPlansContainer: {
    padding: SPACING.xl,
    alignItems: 'center',
  },
  noPlansText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
  },
  plansContainer: {
    gap: SPACING.md,
    marginBottom: SPACING.lg,
  },
  planCard: {
    backgroundColor: COLORS.cardBackground,
    borderRadius: 16,
    padding: SPACING.lg,
    borderWidth: 2,
    borderColor: COLORS.border,
  },
  planCardSelected: {
    borderColor: COLORS.primary,
    backgroundColor: '#007AFF08',
  },
  planCardTopPick: {
    borderColor: COLORS.success,
  },
  topPickBadge: {
    position: 'absolute',
    top: SPACING.sm,
    right: SPACING.sm,
    backgroundColor: COLORS.success,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: 12,
  },
  topPickBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: SPACING.md,
  },
  planName: {
    fontSize: 20,
    fontWeight: '700',
    color: COLORS.text,
    flex: 1,
    paddingRight: SPACING.md,
  },
  scoreContainer: {
    alignItems: 'center',
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: 12,
  },
  scoreText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  scoreLabel: {
    fontSize: 10,
    color: '#FFFFFF',
    opacity: 0.9,
  },
  planDescription: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
    marginBottom: SPACING.md,
  },
  planDetails: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: SPACING.sm,
    marginBottom: SPACING.md,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  detailIcon: {
    fontSize: 14,
    marginRight: SPACING.xs,
  },
  detailText: {
    fontSize: 12,
    fontWeight: '500',
    color: COLORS.text,
  },
  matchDetails: {
    marginTop: SPACING.md,
    padding: SPACING.md,
    backgroundColor: '#F0F9FF',
    borderRadius: 8,
  },
  matchDetailsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.primary,
    marginBottom: SPACING.sm,
  },
  matchDetailsList: {
    gap: SPACING.xs,
  },
  matchDetail: {
    fontSize: 12,
    color: COLORS.text,
    lineHeight: 18,
  },
  selectedIndicator: {
    marginTop: SPACING.md,
    padding: SPACING.md,
    backgroundColor: COLORS.primary,
    borderRadius: 8,
    alignItems: 'center',
  },
  selectedIndicatorText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  buttonRow: {
    flexDirection: 'row',
    gap: SPACING.md,
    marginTop: SPACING.xl,
  },
  backButton: {
    flex: 1,
  },
  continueButton: {
    flex: 2,
  },
  skipButton: {
    marginTop: SPACING.md,
    padding: SPACING.md,
    alignItems: 'center',
  },
  skipButtonText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    textDecorationLine: 'underline',
  },
  bottomSpacing: {
    height: SPACING.xl,
  },
});
