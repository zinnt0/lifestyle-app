/**
 * Supplement Calculating Screen
 *
 * Loading screen shown while the recommendation algorithm is calculating
 * the user's personalized supplement stack
 */

import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ActivityIndicator, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../../components/ui/theme';

interface SupplementCalculatingScreenProps {
  onComplete: () => void;
}

export function SupplementCalculatingScreen({ onComplete }: SupplementCalculatingScreenProps) {
  const pulseAnim = React.useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Pulsing animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Simulate calculation time (2-3 seconds)
    const timer = setTimeout(() => {
      onComplete();
    }, 2500);

    return () => clearTimeout(timer);
  }, [onComplete]);

  return (
    <LinearGradient
      colors={[theme.colors.secondary, theme.colors.secondaryDark]}
      style={styles.container}
    >
      <View style={styles.content}>
        <Animated.View style={[styles.iconContainer, { transform: [{ scale: pulseAnim }] }]}>
          <Text style={styles.icon}>💊</Text>
        </Animated.View>

        <ActivityIndicator size="large" color="#FFFFFF" style={styles.loader} />

        <Text style={styles.title}>Deine Empfehlungen werden berechnet</Text>
        <Text style={styles.subtitle}>
          Wir analysieren deine Daten und erstellen personalisierte Supplement-Empfehlungen für dich
        </Text>

        <View style={styles.stepsContainer}>
          <StepIndicator label="Profil analysieren" completed />
          <StepIndicator label="Ziele auswerten" completed />
          <StepIndicator label="Empfehlungen erstellen" active />
        </View>
      </View>
    </LinearGradient>
  );
}

interface StepIndicatorProps {
  label: string;
  completed?: boolean;
  active?: boolean;
}

function StepIndicator({ label, completed, active }: StepIndicatorProps) {
  return (
    <View style={styles.step}>
      <View style={[
        styles.stepDot,
        completed && styles.stepDotCompleted,
        active && styles.stepDotActive,
      ]}>
        {completed && <Text style={styles.checkmark}>✓</Text>}
      </View>
      <Text style={[
        styles.stepLabel,
        (completed || active) && styles.stepLabelActive,
      ]}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: theme.spacing.xl,
  },
  iconContainer: {
    marginBottom: theme.spacing.xxl,
  },
  icon: {
    fontSize: 80,
  },
  loader: {
    marginBottom: theme.spacing.xxl,
  },
  title: {
    fontSize: theme.typography.sizes.xxl,
    fontWeight: theme.typography.weights.bold,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: theme.spacing.md,
  },
  subtitle: {
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.regular,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    lineHeight: theme.typography.lineHeights.relaxed * theme.typography.sizes.md,
    marginBottom: theme.spacing.xxxl,
  },
  stepsContainer: {
    width: '100%',
    gap: theme.spacing.lg,
  },
  step: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: theme.spacing.md,
  },
  stepDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepDotCompleted: {
    backgroundColor: '#FFFFFF',
  },
  stepDotActive: {
    backgroundColor: 'rgba(255, 255, 255, 0.6)',
  },
  checkmark: {
    color: theme.colors.secondary,
    fontSize: 14,
    fontWeight: theme.typography.weights.bold,
  },
  stepLabel: {
    fontSize: theme.typography.sizes.md,
    color: 'rgba(255, 255, 255, 0.7)',
    fontWeight: theme.typography.weights.medium,
  },
  stepLabelActive: {
    color: '#FFFFFF',
    fontWeight: theme.typography.weights.semibold,
  },
});
