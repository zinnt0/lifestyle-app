/**
 * Plan Recommendation Card (Collapsible Version)
 *
 * Similar to PlanRecommendationCard but with collapsible reasoning section.
 * Used in PlanListScreen to keep cards compact.
 *
 * @example
 * <PlanRecommendationCardCollapsible
 *   recommendation={recommendation}
 *   onSelect={() => handleSelectPlan(recommendation.template)}
 * />
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ViewStyle,
  TouchableOpacity,
  LayoutAnimation,
  Platform,
  UIManager,
} from 'react-native';
import type { PlanRecommendation } from '@/utils/planRecommendationScoring';
import {
  getRecommendationBadge,
} from '@/utils/planRecommendationScoring';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { theme } from '@/constants/theme';
import { ScoreBreakdownChart } from './ScoreBreakdownChart';

// Enable LayoutAnimation on Android
if (
  Platform.OS === 'android' &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

// ============================================================================
// Types
// ============================================================================

interface PlanRecommendationCardCollapsibleProps {
  /** The recommendation data to display */
  recommendation: PlanRecommendation;
  /** Callback when user selects this plan */
  onSelect: () => void;
  /** Optional rank to display (1, 2, 3) */
  rank?: number;
}

// ============================================================================
// Design Tokens (aligned with our theme)
// ============================================================================

const COLORS = {
  // Use our theme colors
  background: theme.colors.surface,
  backgroundOptimal: '#E8F5E9', // Light green
  backgroundGood: '#E3F2FD',    // Light blue
  backgroundAcceptable: '#FFF3E0', // Light orange
  text: theme.colors.text,
  textSecondary: theme.colors.textSecondary,
  textLight: '#999999',
  borderOptimal: theme.colors.success,
  borderGood: theme.colors.primary,
  borderAcceptable: theme.colors.warning,
  primary: theme.colors.primary,
  warning: theme.colors.warning,
  success: theme.colors.success,
};

const SPACING = {
  xs: theme.spacing.xs,
  sm: theme.spacing.sm,
  md: theme.spacing.md,
  lg: theme.spacing.lg,
  xl: theme.spacing.xl,
};

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  // Card wrapper
  cardWrapper: {
    marginBottom: SPACING.md,
    position: 'relative',
  },
  cardContent: {
    gap: SPACING.md,
  },

  // Background overlays for different recommendation types
  backgroundOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.4,
    borderRadius: theme.borderRadius.lg,
  },
  backgroundOptimal: {
    backgroundColor: COLORS.backgroundOptimal,
  },
  backgroundGood: {
    backgroundColor: COLORS.backgroundGood,
  },
  backgroundAcceptable: {
    backgroundColor: COLORS.backgroundAcceptable,
  },

  // Header section
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: SPACING.md,
  },

  // Badge
  badgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    alignSelf: 'flex-start',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: COLORS.background,
    marginLeft: 4,
  },

  // Score display
  scoreContainer: {
    alignItems: 'flex-end',
  },
  scoreText: {
    fontSize: 32,
    fontWeight: '700',
    color: COLORS.text,
    lineHeight: 36,
  },
  scoreLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: -4,
  },

  // Title section
  titleSection: {
    gap: SPACING.xs,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.text,
    lineHeight: 28,
  },
  subtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },

  // Completeness status
  completenessContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  completenessText: {
    fontSize: 13,
    fontWeight: '600',
  },
  completeText: {
    color: COLORS.success,
  },
  incompleteText: {
    color: COLORS.warning,
  },

  // Dynamic plan badge
  badgesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  dynamicBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.primary,
    gap: 4,
  },
  dynamicBadgeText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.primary,
  },
  dynamicInfoContainer: {
    backgroundColor: '#E3F2FD',
    padding: 12,
    borderRadius: theme.borderRadius.sm,
    flexDirection: 'row',
    gap: 8,
  },
  dynamicInfoText: {
    flex: 1,
    fontSize: 13,
    color: COLORS.text,
    lineHeight: 18,
  },

  // Divider
  divider: {
    height: 1,
    backgroundColor: '#E0E0E0',
    opacity: 0.3,
  },

  // Collapsible section header
  collapsibleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: SPACING.sm,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
  },
  expandIcon: {
    fontSize: 18,
    color: COLORS.textSecondary,
  },

  // Reasoning section
  reasoningSection: {
    gap: SPACING.sm,
  },
  reasoningItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: SPACING.sm,
  },
  reasoningBullet: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginTop: 2,
  },
  reasoningText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    flex: 1,
    lineHeight: 20,
  },

  // Volume modification
  modificationContainer: {
    backgroundColor: 'rgba(33, 150, 243, 0.1)',
    padding: 12,
    borderRadius: theme.borderRadius.sm,
    borderLeftWidth: 3,
    borderLeftColor: COLORS.primary,
    gap: 6,
  },
  modificationTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: COLORS.primary,
  },
  modificationText: {
    fontSize: 13,
    color: COLORS.text,
    lineHeight: 18,
  },

  // Rank badge
  rankBadge: {
    position: 'absolute',
    top: -8,
    left: -8,
    backgroundColor: COLORS.primary,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: COLORS.background,
    zIndex: 10,
  },
  rankText: {
    fontSize: 16,
    fontWeight: '700',
    color: COLORS.background,
  },
});

// ============================================================================
// Component
// ============================================================================

/**
 * Individual Plan Recommendation Card with Collapsible Reasoning
 * Optimized with React.memo for performance
 */
export const PlanRecommendationCardCollapsible = React.memo<PlanRecommendationCardCollapsibleProps>(({
  recommendation,
  onSelect,
  rank,
}) => {
  const [isReasoningExpanded, setIsReasoningExpanded] = useState(false);

  const {
    template,
    totalScore,
    breakdown,
    completeness,
    recommendation: recType,
    reasoning,
    volumeModification
  } = recommendation;

  const badge = getRecommendationBadge(recType);
  const isComplete = completeness === 'complete';
  const isDynamic = template.is_dynamic === true;

  // Determine background overlay style
  let backgroundStyle: ViewStyle | null = null;
  if (recType === 'optimal') {
    backgroundStyle = styles.backgroundOptimal;
  } else if (recType === 'good') {
    backgroundStyle = styles.backgroundGood;
  } else if (recType === 'acceptable') {
    backgroundStyle = styles.backgroundAcceptable;
  }

  const toggleReasoning = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setIsReasoningExpanded(!isReasoningExpanded);
  };

  return (
    <View style={styles.cardWrapper}>
      {/* Rank Badge */}
      {rank !== undefined && (
        <View style={styles.rankBadge}>
          <Text style={styles.rankText}>{rank}</Text>
        </View>
      )}

      <Card padding="large" elevation="medium">
        {/* Background overlay for color coding */}
        {backgroundStyle && (
          <View style={[styles.backgroundOverlay, backgroundStyle]} />
        )}

        <View style={styles.cardContent}>
          {/* Header: Badge and Score */}
          <View style={styles.header}>
            <View style={[styles.badgeContainer, { backgroundColor: badge.color }]}>
              <Text style={styles.badgeText}>
                {badge.emoji} {badge.text}
              </Text>
            </View>
            <View style={styles.scoreContainer}>
              <Text style={styles.scoreText}>{Math.round(totalScore)}</Text>
              <Text style={styles.scoreLabel}>/100</Text>
            </View>
          </View>

          {/* Title and Description */}
          <View style={styles.titleSection}>
            <Text style={styles.title}>
              {template.name_de || template.name}
            </Text>
            <Text style={styles.subtitle}>
              {template.description_de || template.description}
            </Text>
          </View>

          {/* Completeness Status & Dynamic Badge */}
          <View style={styles.badgesContainer}>
            <View style={styles.completenessContainer}>
              <Text>{isComplete ? '✅' : '⚠️'}</Text>
              <Text style={[
                styles.completenessText,
                isComplete ? styles.completeText : styles.incompleteText
              ]}>
                {isComplete ? 'Vollständig konfiguriert' : 'Noch in Entwicklung'}
              </Text>
            </View>
            {isDynamic && (
              <View style={styles.dynamicBadge}>
                <Text>⚡</Text>
                <Text style={styles.dynamicBadgeText}>Dynamisch</Text>
              </View>
            )}
          </View>

          {/* Dynamic Plan Info */}
          {isDynamic && (
            <View style={styles.dynamicInfoContainer}>
              <Text>💡</Text>
              <Text style={styles.dynamicInfoText}>
                Dieser Plan berechnet deine Trainingsgewichte basierend auf deinen 1RM-Werten
              </Text>
            </View>
          )}

          <View style={styles.divider} />

          {/* Collapsible Reasoning Section */}
          <TouchableOpacity
            onPress={toggleReasoning}
            activeOpacity={0.7}
            style={styles.collapsibleHeader}
          >
            <Text style={styles.sectionTitle}>Warum dieser Plan?</Text>
            <Text style={styles.expandIcon}>
              {isReasoningExpanded ? '−' : '+'}
            </Text>
          </TouchableOpacity>

          {/* Reasoning Content (Collapsible) */}
          {isReasoningExpanded && (
            <View style={styles.reasoningSection}>
              {reasoning.map((reason, index) => (
                <View key={index} style={styles.reasoningItem}>
                  <Text style={styles.reasoningBullet}>•</Text>
                  <Text style={styles.reasoningText}>{reason}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Score Breakdown - Visual Chart */}
          <ScoreBreakdownChart
            breakdown={breakdown}
            initialExpanded={false}
          />

          {/* Volume Modification (if applicable) */}
          {volumeModification && (
            <View style={styles.modificationContainer}>
              <Text style={styles.modificationTitle}>
                💡 Empfehlung für Fortgeschrittene
              </Text>
              {volumeModification.setsIncrease && (
                <Text style={styles.modificationText}>
                  Erhöhe das Volumen um {volumeModification.setsIncrease} für optimale Ergebnisse
                </Text>
              )}
              {volumeModification.advancedTechniques && volumeModification.advancedTechniques.length > 0 && (
                <Text style={styles.modificationText}>
                  Erwäge: {volumeModification.advancedTechniques.join(', ')}
                </Text>
              )}
            </View>
          )}

          {/* Action Button - Using our Button component */}
          <Button
            onPress={onSelect}
            variant="primary"
            size="large"
            fullWidth
          >
            Plan erstellen
          </Button>
        </View>
      </Card>
    </View>
  );
});

PlanRecommendationCardCollapsible.displayName = 'PlanRecommendationCardCollapsible';
