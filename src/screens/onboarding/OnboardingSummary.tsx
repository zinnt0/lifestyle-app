import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useOnboarding } from '../../contexts/OnboardingContext';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { getIntolerancesCatalog, Intolerance } from '../../services/profile.service';

/**
 * Onboarding Summary Screen
 * Shows a summary of all collected data before submission
 */
export const OnboardingSummary: React.FC = () => {
  const {
    data,
    goToStep,
    submitOnboarding,
    isSubmitting,
    error,
    progress,
  } = useOnboarding();

  const [intolerancesCatalog, setIntolerancesCatalog] = useState<Intolerance[]>([]);

  useEffect(() => {
    loadIntolerancesCatalog();
  }, []);

  const loadIntolerancesCatalog = async () => {
    const { intolerances } = await getIntolerancesCatalog();
    setIntolerancesCatalog(intolerances);
  };

  const handleSubmit = async () => {
    try {
      await submitOnboarding();
      // Navigation will be handled by parent component
      Alert.alert(
        'Erfolgreich! 🎉',
        'Dein Profil wurde erstellt. Wir erstellen jetzt deinen persönlichen Trainingsplan.',
        [{ text: 'Los geht\'s!' }]
      );
    } catch (err: any) {
      // Error is already set in context
      console.error('Submission error:', err);
    }
  };

  const getIntoleranceName = (id: string): string => {
    const intolerance = intolerancesCatalog.find((i) => i.id === id);
    return intolerance?.name || 'Unbekannt';
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Progress Bar */}
      <ProgressBar progress={progress} />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Fast geschafft! 🎉</Text>
        <Text style={styles.subtitle}>
          Überprüfe deine Angaben bevor wir deinen Plan erstellen
        </Text>
      </View>

      {/* Summary Cards */}
      <View style={styles.summaryContainer}>
        {/* Basisdaten */}
        <SummaryCard title="Basisdaten" onEdit={() => goToStep(1)}>
          <SummaryRow label="Alter" value={`${data.age} Jahre`} />
          <SummaryRow label="Gewicht" value={`${data.weight} kg`} />
          <SummaryRow label="Größe" value={`${data.height} cm`} />
          <SummaryRow
            label="Geschlecht"
            value={getGenderLabel(data.gender)}
          />
        </SummaryCard>

        {/* Training */}
        <SummaryCard title="Training" onEdit={() => goToStep(2)}>
          <SummaryRow
            label="Level"
            value={getFitnessLevelLabel(data.fitness_level)}
          />
          <SummaryRow
            label="Erfahrung"
            value={`${data.training_experience_months} Monate`}
          />
          <SummaryRow
            label="Tage/Woche"
            value={`${data.available_training_days} Tage`}
          />
          <SummaryRow
            label="Gym-Zugang"
            value={data.has_gym_access ? 'Ja' : 'Nein'}
          />
          {!data.has_gym_access && data.home_equipment.length > 0 && (
            <SummaryRow
              label="Equipment"
              value={data.home_equipment.map(getEquipmentLabel).join(', ')}
            />
          )}
        </SummaryCard>

        {/* Ziel */}
        <SummaryCard title="Ziel" onEdit={() => goToStep(3)}>
          <SummaryRow
            label="Primäres Ziel"
            value={getGoalLabel(data.primary_goal)}
          />
        </SummaryCard>

        {/* Lifestyle */}
        <SummaryCard title="Lifestyle" onEdit={() => goToStep(4)}>
          <SummaryRow
            label="Schlaf"
            value={`${data.sleep_hours_avg?.toFixed(1)} Stunden`}
          />
          <SummaryRow label="Stress" value={`${data.stress_level} / 10`} />
        </SummaryCard>

        {/* Unverträglichkeiten (nur wenn vorhanden) */}
        {data.intolerances.length > 0 && (
          <SummaryCard title="Unverträglichkeiten" onEdit={() => goToStep(5)}>
            {data.intolerances.map((int, idx) => (
              <SummaryRow
                key={idx}
                label={getIntoleranceName(int.intolerance_id)}
                value={getSeverityLabel(int.severity)}
              />
            ))}
          </SummaryCard>
        )}
      </View>

      {/* Error Message */}
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      {/* Submit Button */}
      <Button
        title={isSubmitting ? 'Speichern...' : 'Profil erstellen'}
        onPress={handleSubmit}
        disabled={isSubmitting}
        style={styles.submitButton}
      />

      {/* Back Button */}
      <Button
        title="Zurück"
        variant="text"
        onPress={() => goToStep(5)}
        disabled={isSubmitting}
      />

      {/* Bottom Spacing */}
      <View style={styles.bottomSpacing} />
    </ScrollView>
  );
};

/**
 * Summary Card Component
 */
interface SummaryCardProps {
  title: string;
  onEdit: () => void;
  children: React.ReactNode;
}

const SummaryCard: React.FC<SummaryCardProps> = ({
  title,
  onEdit,
  children,
}) => {
  return (
    <Card style={styles.summaryCard}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle}>{title}</Text>
        <TouchableOpacity onPress={onEdit} activeOpacity={0.7}>
          <Text style={styles.editButton}>Bearbeiten</Text>
        </TouchableOpacity>
      </View>
      <View style={styles.cardContent}>{children}</View>
    </Card>
  );
};

/**
 * Summary Row Component
 */
interface SummaryRowProps {
  label: string;
  value: string;
}

const SummaryRow: React.FC<SummaryRowProps> = ({ label, value }) => {
  return (
    <View style={styles.summaryRow}>
      <Text style={styles.rowLabel}>{label}</Text>
      <Text style={styles.rowValue}>{value}</Text>
    </View>
  );
};

/**
 * Helper functions to get German labels
 */
const getGenderLabel = (gender: string | null): string => {
  const labels: Record<string, string> = {
    male: 'Männlich',
    female: 'Weiblich',
    other: 'Divers',
  };
  return labels[gender || ''] || 'Unbekannt';
};

const getFitnessLevelLabel = (level: string | null): string => {
  const labels: Record<string, string> = {
    beginner: 'Anfänger',
    intermediate: 'Fortgeschritten',
    advanced: 'Experte',
  };
  return labels[level || ''] || 'Unbekannt';
};

const getGoalLabel = (goal: string | null): string => {
  const labels: Record<string, string> = {
    strength: 'Kraft aufbauen',
    hypertrophy: 'Muskeln aufbauen',
    weight_loss: 'Gewicht verlieren',
    endurance: 'Ausdauer',
    general_fitness: 'Allgemeine Fitness',
  };
  return labels[goal || ''] || 'Unbekannt';
};

const getSeverityLabel = (severity: string): string => {
  const labels: Record<string, string> = {
    mild: 'Leicht',
    moderate: 'Mittel',
    severe: 'Schwer',
    life_threatening: 'Lebensbedrohlich',
  };
  return labels[severity] || severity;
};

const getEquipmentLabel = (equipment: string): string => {
  const labels: Record<string, string> = {
    barbell: 'Langhantel',
    dumbbells: 'Kurzhanteln',
    kettlebells: 'Kettlebells',
    resistance_bands: 'Widerstandsbänder',
    pull_up_bar: 'Klimmzugstange',
    bench: 'Hantelbank',
    squat_rack: 'Squat Rack',
    cables: 'Kabelzug',
    machines: 'Geräte',
  };
  return labels[equipment] || equipment;
};

const COLORS = {
  primary: '#007AFF',
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
  content: {
    padding: SPACING.lg,
  },
  header: {
    marginTop: SPACING.md,
    marginBottom: SPACING.xl,
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: COLORS.text,
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
    lineHeight: 22,
    textAlign: 'center',
  },
  summaryContainer: {
    gap: SPACING.md,
  },
  summaryCard: {
    padding: 0,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
  },
  editButton: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.primary,
  },
  cardContent: {
    padding: SPACING.md,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: SPACING.sm,
  },
  rowLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
    flex: 1,
  },
  rowValue: {
    fontSize: 14,
    fontWeight: '500',
    color: COLORS.text,
    flex: 1,
    textAlign: 'right',
  },
  errorContainer: {
    backgroundColor: '#FFEBEE',
    padding: SPACING.md,
    borderRadius: 8,
    marginTop: SPACING.md,
  },
  errorText: {
    color: COLORS.error,
    fontSize: 14,
    textAlign: 'center',
  },
  submitButton: {
    marginTop: SPACING.xl,
  },
  bottomSpacing: {
    height: SPACING.xl,
  },
});
