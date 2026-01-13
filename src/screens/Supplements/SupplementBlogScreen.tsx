/**
 * Supplement Blog Screen (Tab 3)
 *
 * Coming soon placeholder for supplement news and studies
 */

import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { theme } from '../../components/ui/theme';

export function SupplementBlogScreen() {
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.contentContainer}>
      <LinearGradient
        colors={[theme.colors.secondary, theme.colors.secondaryDark]}
        style={styles.heroSection}
      >
        <View style={styles.badge}>
          <Text style={styles.badgeText}>COMING SOON</Text>
        </View>
        <Text style={styles.heroIcon}>📰</Text>
        <Text style={styles.heroTitle}>Supplement News & Studien</Text>
        <Text style={styles.heroSubtitle}>
          Bald verfügbar: Die neuesten Erkenntnisse und wissenschaftlichen Studien zu Supplements
        </Text>
      </LinearGradient>

      <View style={styles.content}>
        <Text style={styles.sectionTitle}>Was dich erwartet</Text>

        <FeatureCard
          icon="🔬"
          title="Wissenschaftliche Studien"
          description="Aktuelle Forschungsergebnisse zu Supplementen, verständlich aufbereitet"
        />

        <FeatureCard
          icon="📊"
          title="Evidenz-Bewertungen"
          description="Objektive Einschätzungen zur wissenschaftlichen Evidenz verschiedener Supplements"
        />

        <FeatureCard
          icon="💡"
          title="Anwendungstipps"
          description="Praktische Hinweise zu Dosierung, Timing und Kombinationen"
        />

        <FeatureCard
          icon="⚠️"
          title="Wichtige Warnhinweise"
          description="Aktuelle Informationen zu Nebenwirkungen und Wechselwirkungen"
        />

        <FeatureCard
          icon="🆕"
          title="Neue Supplements"
          description="Vorstellung neuer Supplements und deren wissenschaftliche Basis"
        />

        <View style={styles.infoBox}>
          <Text style={styles.infoText}>
            Wir arbeiten daran, dir hochwertige, wissenschaftlich fundierte Informationen zu Supplements bereitzustellen. Diese Funktion wird in Kürze verfügbar sein.
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

interface FeatureCardProps {
  icon: string;
  title: string;
  description: string;
}

function FeatureCard({ icon, title, description }: FeatureCardProps) {
  return (
    <View style={styles.featureCard}>
      <Text style={styles.featureIcon}>{icon}</Text>
      <View style={styles.featureContent}>
        <Text style={styles.featureTitle}>{title}</Text>
        <Text style={styles.featureDescription}>{description}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  contentContainer: {
    paddingBottom: theme.spacing.xxxl,
  },
  heroSection: {
    paddingTop: theme.spacing.xxxl * 2,
    paddingBottom: theme.spacing.xxxl,
    paddingHorizontal: theme.spacing.xl,
    alignItems: 'center',
  },
  badge: {
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.sm,
    borderRadius: theme.borderRadius.full,
    marginBottom: theme.spacing.xl,
  },
  badgeText: {
    fontSize: theme.typography.sizes.xs,
    fontWeight: theme.typography.weights.bold,
    color: '#FFFFFF',
    letterSpacing: 1,
  },
  heroIcon: {
    fontSize: 80,
    marginBottom: theme.spacing.lg,
  },
  heroTitle: {
    fontSize: theme.typography.sizes.xxxl,
    fontWeight: theme.typography.weights.bold,
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: theme.spacing.md,
  },
  heroSubtitle: {
    fontSize: theme.typography.sizes.md,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    lineHeight: theme.typography.lineHeights.relaxed * theme.typography.sizes.md,
    maxWidth: 320,
  },
  content: {
    paddingHorizontal: theme.spacing.xl,
    paddingTop: theme.spacing.xl,
  },
  sectionTitle: {
    fontSize: theme.typography.sizes.xl,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.lg,
  },
  featureCard: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: theme.spacing.md,
    ...theme.shadows.sm,
  },
  featureIcon: {
    fontSize: 32,
  },
  featureContent: {
    flex: 1,
  },
  featureTitle: {
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  featureDescription: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.textSecondary,
    lineHeight: theme.typography.lineHeights.normal * theme.typography.sizes.sm,
  },
  infoBox: {
    backgroundColor: theme.colors.secondaryLight + '15',
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.secondary,
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.md,
    marginTop: theme.spacing.xl,
  },
  infoText: {
    fontSize: theme.typography.sizes.md,
    color: theme.colors.text,
    lineHeight: theme.typography.lineHeights.relaxed * theme.typography.sizes.md,
  },
});
