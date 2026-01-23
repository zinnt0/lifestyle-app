/**
 * Supplement Recommendations Screen (Tab 2)
 *
 * Displays personalized supplement recommendations from the algorithm with:
 * - Match score-based recommendations
 * - Filter by target area
 * - Add to stack functionality
 * - Info about recommendation algorithm
 * - Navigate to all supplements list
 */

import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Pressable,
  Modal,
} from "react-native";
import { supabase } from "../../lib/supabase";
import { theme } from "../../components/ui/theme";
import {
  TargetArea,
  SupplementDefinition,
  SupplementRecommendation,
} from "../../services/supplements/types";
import {
  getUserStack,
  addSupplementToStack,
  getTargetAreaDisplayName,
} from "../../services/supplements/stackStorage";
import { useSupplementRecommendations } from "../../hooks/useSupplementRecommendations";
import { SupplementDetailModal } from "./SupplementDetailModal";

interface SupplementRecommendationsScreenProps {
  onNavigateToAllSupplements: () => void;
  onStackChanged?: () => void;
}

const FILTER_OPTIONS: Array<{ value: TargetArea | "all"; label: string }> = [
  { value: "all", label: "Alle" },
  { value: "Leistung_Kraft", label: "Kraft" },
  { value: "Leistung_Ausdauer", label: "Ausdauer" },
  { value: "Muskelaufbau_Protein", label: "Muskelaufbau" },
  { value: "Regeneration_Entzuendung", label: "Regeneration" },
  { value: "Schlaf_Stress", label: "Schlaf & Stress" },
  { value: "Fokus_Kognition", label: "Fokus" },
  { value: "Gesundheit_Immunsystem", label: "Immunsystem" },
  { value: "Verdauung_Darm", label: "Verdauung" },
  { value: "Gelenke_Bindegewebe_Haut", label: "Gelenke & Haut" },
  { value: "Hormon_Zyklus", label: "Hormone" },
  { value: "Basis_Mikros", label: "Vitamine" },
  { value: "Hydration_Elektrolyte", label: "Hydration" },
];

// Minimum score threshold - show supplements with 60%+ match
const MIN_SCORE_THRESHOLD = 60;

export function SupplementRecommendationsScreen({
  onNavigateToAllSupplements,
  onStackChanged,
}: SupplementRecommendationsScreenProps) {
  const [userId, setUserId] = useState<string>("");
  const [selectedFilter, setSelectedFilter] = useState<TargetArea | "all">(
    "all"
  );
  const [selectedSupplement, setSelectedSupplement] =
    useState<SupplementDefinition | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showInfoModal, setShowInfoModal] = useState(false);
  const [userStackIds, setUserStackIds] = useState<Set<string>>(new Set());
  const [refreshKey, setRefreshKey] = useState(0);

  // Get user ID from Supabase session
  useEffect(() => {
    const fetchUserId = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session?.user?.id) {
        setUserId(session.user.id);
      }
    };
    fetchUserId();
  }, []);

  // Load recommendations using the hook
  const { recommendations, isLoading, error } = useSupplementRecommendations({
    userId: userId || null,
    minScoreThreshold: MIN_SCORE_THRESHOLD,
  });

  // Load user's current stack
  const loadUserStack = useCallback(async () => {
    if (!userId) return;
    const stack = await getUserStack(userId);
    const ids = new Set(stack.map((s) => s.supplementId));
    setUserStackIds(ids);
  }, [userId]);

  useEffect(() => {
    loadUserStack();
  }, [loadUserStack, refreshKey]);

  // Filter recommendations by target area
  // Note: Score filtering is already done in the recommendation engine
  // Essential supplements are always included regardless of score
  const filteredRecommendations = recommendations.filter((rec) => {
    if (selectedFilter === "all") return true;
    return rec.supplement.targetAreas.includes(selectedFilter);
  });

  // Separate essential supplements from regular ones
  const essentialSupplements = filteredRecommendations.filter(
    (r) => r.supplement.isEssential
  );
  const regularSupplements = filteredRecommendations.filter(
    (r) => !r.supplement.isEssential
  );

  // Group regular supplements by score range
  const groupedRecommendations = {
    essential: essentialSupplements, // Always show essential supplements first
    excellent: regularSupplements.filter((r) => r.matchScore >= 90),
    good: regularSupplements.filter(
      (r) => r.matchScore >= 80 && r.matchScore < 90
    ),
    moderate: regularSupplements.filter(
      (r) => r.matchScore >= 70 && r.matchScore < 80
    ),
    fair: regularSupplements.filter(
      (r) => r.matchScore >= 60 && r.matchScore < 70
    ),
  };

  // Handle add to stack
  const handleAddToStack = async (recommendation: SupplementRecommendation) => {
    if (!userId) return;

    try {
      await addSupplementToStack(
        userId,
        recommendation.supplement.id,
        recommendation.supplement.name,
        recommendation.supplement.targetAreas,
        recommendation.supplement.substanceClass,
        "recommendation",
        recommendation.matchScore
      );

      Alert.alert(
        "Hinzugefügt",
        `${recommendation.supplement.name} wurde zu deinem Stack hinzugefügt`,
        [{ text: "OK" }]
      );

      setRefreshKey((prev) => prev + 1);
      onStackChanged?.();
    } catch (error) {
      Alert.alert("Fehler", "Konnte nicht zum Stack hinzufügen");
    }
  };

  // Show supplement details
  const handleShowDetails = (supplement: SupplementDefinition) => {
    setSelectedSupplement(supplement);
    setShowDetailModal(true);
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={theme.colors.secondary} />
        <Text style={styles.loadingText}>Empfehlungen werden geladen...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorIcon}>⚠️</Text>
        <Text style={styles.errorText}>Fehler beim Laden der Empfehlungen</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Meine Empfehlungen</Text>
        <TouchableOpacity onPress={() => setShowInfoModal(true)}>
          <View style={styles.infoButton}>
            <Text style={styles.infoButtonText}>ℹ️</Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Filter */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterScrollView}
        contentContainerStyle={styles.filterContainer}
      >
        {FILTER_OPTIONS.map((option) => (
          <TouchableOpacity
            key={option.value}
            style={[
              styles.filterButton,
              selectedFilter === option.value && styles.filterButtonActive,
            ]}
            onPress={() => setSelectedFilter(option.value)}
          >
            <Text
              style={[
                styles.filterButtonText,
                selectedFilter === option.value &&
                  styles.filterButtonTextActive,
              ]}
            >
              {option.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Recommendations List */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {filteredRecommendations.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateIcon}>🎯</Text>
            <Text style={styles.emptyStateTitle}>Keine Empfehlungen</Text>
            <Text style={styles.emptyStateText}>
              {selectedFilter === "all"
                ? "Vervollständige dein Profil für personalisierte Empfehlungen"
                : "Keine Empfehlungen in dieser Kategorie"}
            </Text>
          </View>
        ) : (
          <>
            {groupedRecommendations.essential.length > 0 && (
              <RecommendationGroup
                title="Basis-Supplements"
                color={theme.colors.primary}
                recommendations={groupedRecommendations.essential}
                addedIds={userStackIds}
                onAdd={handleAddToStack}
                onShowDetails={handleShowDetails}
              />
            )}

            {groupedRecommendations.excellent.length > 0 && (
              <RecommendationGroup
                title="Sehr empfohlen (90-100%)"
                color={theme.colors.secondary}
                recommendations={groupedRecommendations.excellent}
                addedIds={userStackIds}
                onAdd={handleAddToStack}
                onShowDetails={handleShowDetails}
              />
            )}

            {groupedRecommendations.good.length > 0 && (
              <RecommendationGroup
                title="Empfohlen (80-89%)"
                color={theme.colors.secondaryLight}
                recommendations={groupedRecommendations.good}
                addedIds={userStackIds}
                onAdd={handleAddToStack}
                onShowDetails={handleShowDetails}
              />
            )}

            {groupedRecommendations.moderate.length > 0 && (
              <RecommendationGroup
                title="Passend (70-79%)"
                color={theme.colors.info}
                recommendations={groupedRecommendations.moderate}
                addedIds={userStackIds}
                onAdd={handleAddToStack}
                onShowDetails={handleShowDetails}
              />
            )}

            {groupedRecommendations.fair.length > 0 && (
              <RecommendationGroup
                title="Möglicherweise passend (60-69%)"
                color={theme.colors.textTertiary}
                recommendations={groupedRecommendations.fair}
                addedIds={userStackIds}
                onAdd={handleAddToStack}
                onShowDetails={handleShowDetails}
              />
            )}
          </>
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* All Supplements Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.allSupplementsButton}
          onPress={onNavigateToAllSupplements}
        >
          <Text style={styles.allSupplementsButtonText}>Alle Supplements</Text>
        </TouchableOpacity>
      </View>

      {/* Info Modal */}
      <InfoModal
        visible={showInfoModal}
        onClose={() => setShowInfoModal(false)}
      />

      {/* Detail Modal */}
      <SupplementDetailModal
        visible={showDetailModal}
        supplement={selectedSupplement}
        onClose={() => setShowDetailModal(false)}
      />
    </View>
  );
}

interface RecommendationGroupProps {
  title: string;
  color: string;
  recommendations: SupplementRecommendation[];
  addedIds: Set<string>;
  onAdd: (rec: SupplementRecommendation) => void;
  onShowDetails: (supplement: SupplementDefinition) => void;
}

function RecommendationGroup({
  title,
  color,
  recommendations,
  addedIds,
  onAdd,
  onShowDetails,
}: RecommendationGroupProps) {
  return (
    <View style={styles.group}>
      <View style={styles.groupHeader}>
        <View style={[styles.groupIndicator, { backgroundColor: color }]} />
        <Text style={styles.groupTitle}>{title}</Text>
      </View>

      {recommendations.map((rec) => (
        <RecommendationCard
          key={rec.supplement.id}
          recommendation={rec}
          color={color}
          isAdded={addedIds.has(rec.supplement.id)}
          onAdd={() => onAdd(rec)}
          onShowDetails={() => onShowDetails(rec.supplement)}
        />
      ))}
    </View>
  );
}

interface RecommendationCardProps {
  recommendation: SupplementRecommendation;
  color: string;
  isAdded: boolean;
  onAdd: () => void;
  onShowDetails: () => void;
}

function RecommendationCard({
  recommendation,
  color,
  isAdded,
  onAdd,
  onShowDetails,
}: RecommendationCardProps) {
  // Hide percentage for Basis-Supplements (Basis_Mikros or essential supplements like Omega-3)
  const isBasisSupplement =
    recommendation.supplement.targetAreas.includes("Basis_Mikros") ||
    recommendation.supplement.id === "omega-3";

  return (
    <Pressable
      style={[styles.card, isAdded && styles.cardAdded]}
      onPress={onShowDetails}
    >
      <View style={styles.cardContent}>
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>{recommendation.supplement.name}</Text>
          {!isBasisSupplement && (
            <View style={[styles.scoreBadge, { backgroundColor: color }]}>
              <Text style={styles.scoreText}>
                {Math.round(recommendation.matchScore)}%
              </Text>
            </View>
          )}
        </View>

        {/* Target Areas */}
        <View style={styles.cardTags}>
          {recommendation.supplement.targetAreas.slice(0, 2).map((area) => (
            <View key={area} style={styles.cardTag}>
              <Text style={styles.cardTagText}>
                {getTargetAreaDisplayName(area)}
              </Text>
            </View>
          ))}
          {recommendation.supplement.targetAreas.length > 2 && (
            <Text style={styles.cardTagMore}>
              +{recommendation.supplement.targetAreas.length - 2}
            </Text>
          )}
        </View>

        {/* Primary Reasons */}
        {recommendation.primaryReasons.length > 0 && (
          <Text style={styles.cardReason} numberOfLines={2}>
            {recommendation.primaryReasons[0]}
          </Text>
        )}
      </View>

      {/* Add Button or Checkmark */}
      {isAdded ? (
        <View style={styles.addedBadge}>
          <Text style={styles.addedBadgeText}>✓</Text>
        </View>
      ) : (
        <TouchableOpacity
          style={styles.addButton}
          onPress={(e) => {
            e.stopPropagation();
            onAdd();
          }}
        >
          <Text style={styles.addButtonText}>+</Text>
        </TouchableOpacity>
      )}
    </Pressable>
  );
}

function InfoModal({
  visible,
  onClose,
}: {
  visible: boolean;
  onClose: () => void;
}) {
  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      onRequestClose={onClose}
    >
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <Pressable
          style={styles.modalContent}
          onPress={(e) => e.stopPropagation()}
        >
          <Text style={styles.modalTitle}>
            Wie funktionieren die Empfehlungen?
          </Text>
          <Text style={styles.modalText}>
            Unsere Empfehlungen basieren auf einem intelligenten Algorithmus,
            der folgende Faktoren berücksichtigt:
          </Text>
          <View style={styles.modalList}>
            <Text style={styles.modalListItem}>
              • Dein Trainingsziel und Fitnesslevel
            </Text>
            <Text style={styles.modalListItem}>
              • Deine täglichen Check-ins (Schlaf, Stress, Energie)
            </Text>
            <Text style={styles.modalListItem}>• Deine Ernährungsdaten</Text>
            <Text style={styles.modalListItem}>
              • Deine Supplement-Profil Angaben
            </Text>
            <Text style={styles.modalListItem}>
              • Wissenschaftliche Evidenz
            </Text>
          </View>
          <Text style={styles.modalText}>
            Die Prozentangabe zeigt, wie gut das Supplement zu deinem Profil
            passt. Je höher, desto besser die Übereinstimmung.
          </Text>
          <TouchableOpacity style={styles.modalButton} onPress={onClose}>
            <Text style={styles.modalButtonText}>Verstanden</Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: theme.colors.background,
  },
  loadingText: {
    marginTop: theme.spacing.lg,
    fontSize: theme.typography.sizes.md,
    color: theme.colors.textSecondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: theme.colors.background,
    paddingHorizontal: theme.spacing.xl,
  },
  errorIcon: {
    fontSize: 64,
    marginBottom: theme.spacing.lg,
  },
  errorText: {
    fontSize: theme.typography.sizes.lg,
    color: theme.colors.textSecondary,
    textAlign: "center",
  },
  header: {
    paddingHorizontal: theme.spacing.xl,
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.sm,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  headerTitle: {
    fontSize: theme.typography.sizes.xxxl,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.text,
  },
  infoButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.surfaceSecondary,
    justifyContent: "center",
    alignItems: "center",
  },
  infoButtonText: {
    fontSize: 18,
  },
  filterScrollView: {
    flexGrow: 0,
    flexShrink: 0,
  },
  filterContainer: {
    paddingHorizontal: theme.spacing.xl,
    paddingTop: theme.spacing.xs,
    paddingBottom: theme.spacing.sm,
    gap: theme.spacing.sm,
  },
  filterButton: {
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: 6,
    borderRadius: theme.borderRadius.full,
    backgroundColor: theme.colors.surfaceSecondary,
    marginRight: theme.spacing.sm,
  },
  filterButtonActive: {
    backgroundColor: theme.colors.primary,
  },
  filterButtonText: {
    fontSize: theme.typography.sizes.sm,
    fontWeight: theme.typography.weights.medium,
    color: theme.colors.textSecondary,
  },
  filterButtonTextActive: {
    color: "#FFFFFF",
  },
  content: {
    flex: 1,
  },
  group: {
    marginBottom: theme.spacing.xl,
  },
  groupHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.sm,
    paddingHorizontal: theme.spacing.xl,
    marginBottom: theme.spacing.md,
  },
  groupIndicator: {
    width: 4,
    height: 20,
    borderRadius: 2,
  },
  groupTitle: {
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.text,
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    marginHorizontal: theme.spacing.xl,
    marginBottom: theme.spacing.md,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    ...theme.shadows.sm,
  },
  cardAdded: {
    backgroundColor: theme.colors.secondaryLight + "15",
    borderWidth: 1,
    borderColor: theme.colors.secondary + "40",
  },
  cardContent: {
    flex: 1,
    marginRight: theme.spacing.md,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: theme.spacing.sm,
  },
  cardTitle: {
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.text,
    flex: 1,
  },
  scoreBadge: {
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 4,
    borderRadius: theme.borderRadius.sm,
    marginLeft: theme.spacing.sm,
  },
  scoreText: {
    fontSize: theme.typography.sizes.xs,
    fontWeight: theme.typography.weights.bold,
    color: "#FFFFFF",
  },
  cardTags: {
    flexDirection: "row",
    gap: theme.spacing.xs,
    marginBottom: theme.spacing.sm,
    flexWrap: "wrap",
  },
  cardTag: {
    backgroundColor: theme.colors.secondaryLight + "20",
    paddingHorizontal: theme.spacing.sm,
    paddingVertical: 2,
    borderRadius: theme.borderRadius.sm,
  },
  cardTagText: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.secondary,
    fontWeight: theme.typography.weights.medium,
  },
  cardTagMore: {
    fontSize: theme.typography.sizes.xs,
    color: theme.colors.textTertiary,
    fontWeight: theme.typography.weights.medium,
  },
  cardReason: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.textSecondary,
    lineHeight: theme.typography.lineHeights.normal * theme.typography.sizes.sm,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.secondary,
    justifyContent: "center",
    alignItems: "center",
    ...theme.shadows.md,
  },
  addButtonText: {
    fontSize: 24,
    color: "#FFFFFF",
    fontWeight: theme.typography.weights.bold,
  },
  addedBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: theme.colors.secondary,
    justifyContent: "center",
    alignItems: "center",
  },
  addedBadgeText: {
    fontSize: 20,
    color: "#FFFFFF",
    fontWeight: theme.typography.weights.bold,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: theme.spacing.xxxl * 2,
    paddingHorizontal: theme.spacing.xl,
  },
  emptyStateIcon: {
    fontSize: 64,
    marginBottom: theme.spacing.lg,
  },
  emptyStateTitle: {
    fontSize: theme.typography.sizes.xl,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.sm,
  },
  emptyStateText: {
    fontSize: theme.typography.sizes.md,
    color: theme.colors.textSecondary,
    textAlign: "center",
    lineHeight:
      theme.typography.lineHeights.relaxed * theme.typography.sizes.md,
  },
  bottomSpacer: {
    height: theme.spacing.xxxl,
  },
  footer: {
    padding: theme.spacing.xl,
    backgroundColor: theme.colors.surface,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
  },
  allSupplementsButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.lg,
    borderRadius: theme.borderRadius.md,
    alignItems: "center",
    ...theme.shadows.md,
  },
  allSupplementsButtonText: {
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.weights.semibold,
    color: "#FFFFFF",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.xl,
    padding: theme.spacing.xl,
    marginHorizontal: theme.spacing.xl,
    maxWidth: 400,
    width: "100%",
  },
  modalTitle: {
    fontSize: theme.typography.sizes.xl,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.lg,
  },
  modalText: {
    fontSize: theme.typography.sizes.md,
    color: theme.colors.textSecondary,
    lineHeight:
      theme.typography.lineHeights.relaxed * theme.typography.sizes.md,
    marginBottom: theme.spacing.md,
  },
  modalList: {
    marginBottom: theme.spacing.md,
  },
  modalListItem: {
    fontSize: theme.typography.sizes.md,
    color: theme.colors.text,
    lineHeight:
      theme.typography.lineHeights.relaxed * theme.typography.sizes.md,
    marginBottom: theme.spacing.xs,
  },
  modalButton: {
    backgroundColor: theme.colors.secondary,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    alignItems: "center",
    marginTop: theme.spacing.md,
  },
  modalButtonText: {
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.semibold,
    color: "#FFFFFF",
  },
});
