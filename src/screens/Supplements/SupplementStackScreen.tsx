/**
 * Supplement Stack Screen (Tab 1)
 *
 * Displays the user's personal supplement stack with:
 * - Date display
 * - Filter by target area
 * - Daily tracking checkboxes
 * - Remove supplements option
 * - Navigate to recommendations
 */

import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Pressable,
  Alert,
} from "react-native";
import { supabase } from "../../lib/supabase";
import { theme } from "../../components/ui/theme";
import {
  TargetArea,
  SupplementDefinition,
} from "../../services/supplements/types";
import { UserStackSupplement } from "../../services/supplements/types";
import {
  getUserStack,
  removeSupplementFromStack,
  toggleSupplementIntake,
  wasSupplementTaken,
  getTodayDateString,
  formatDateDisplay,
  getTargetAreaDisplayName,
  initializeDailyTracking,
} from "../../services/supplements/stackStorage";
import { SUPPLEMENT_DEFINITIONS } from "../../services/supplements/supplementDefinitions";
import { SupplementDetailModal } from "./SupplementDetailModal";

interface SupplementStackScreenProps {
  onNavigateToRecommendations: () => void;
  refreshKey?: number;
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

export function SupplementStackScreen({
  onNavigateToRecommendations,
  refreshKey: externalRefreshKey = 0,
}: SupplementStackScreenProps) {
  const [userId, setUserId] = useState<string>("");
  const [supplements, setSupplements] = useState<UserStackSupplement[]>([]);
  const [takenStatus, setTakenStatus] = useState<Record<string, boolean>>({});
  const [selectedFilter, setSelectedFilter] = useState<TargetArea | "all">(
    "all"
  );
  const [selectedSupplement, setSelectedSupplement] =
    useState<SupplementDefinition | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [internalRefreshKey, setInternalRefreshKey] = useState(0);

  const todayDate = getTodayDateString();

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

  // Load supplements and tracking status
  const loadData = useCallback(async () => {
    if (!userId) return;

    const stackSupplements = await getUserStack(userId);
    setSupplements(stackSupplements);

    // Initialize daily tracking if needed
    await initializeDailyTracking(userId, todayDate);

    // Load taken status for each supplement
    const statusMap: Record<string, boolean> = {};
    for (const supplement of stackSupplements) {
      const taken = await wasSupplementTaken(
        userId,
        todayDate,
        supplement.supplementId
      );
      statusMap[supplement.supplementId] = taken;
    }
    setTakenStatus(statusMap);
  }, [userId, todayDate]);

  useEffect(() => {
    loadData();
  }, [loadData, internalRefreshKey, externalRefreshKey]);

  // Filter supplements
  const filteredSupplements =
    selectedFilter === "all"
      ? supplements
      : supplements.filter((s) => s.targetAreas.includes(selectedFilter));

  // Handle checkbox toggle
  const handleToggleTaken = async (supplementId: string) => {
    if (!userId) return;

    const currentStatus = takenStatus[supplementId] || false;
    const newStatus = !currentStatus;

    // Update local state immediately for responsiveness
    setTakenStatus((prev) => ({ ...prev, [supplementId]: newStatus }));

    // Save to storage
    await toggleSupplementIntake(userId, todayDate, supplementId, newStatus);
  };

  // Handle supplement removal
  const handleRemoveSupplement = (supplement: UserStackSupplement) => {
    Alert.alert(
      "Supplement entfernen",
      `Möchtest du ${supplement.supplementName} aus deinem Stack entfernen?`,
      [
        { text: "Abbrechen", style: "cancel" },
        {
          text: "Entfernen",
          style: "destructive",
          onPress: async () => {
            await removeSupplementFromStack(userId, supplement.supplementId);
            setInternalRefreshKey((prev) => prev + 1);
          },
        },
      ]
    );
  };

  // Show supplement details
  const handleShowDetails = (supplementId: string) => {
    const definition = SUPPLEMENT_DEFINITIONS.find(
      (s) => s.id === supplementId
    );
    if (definition) {
      setSelectedSupplement(definition);
      setShowDetailModal(true);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Mein Stack</Text>
        <Text style={styles.dateText}>{formatDateDisplay(todayDate)}</Text>
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

      {/* Supplement List */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {filteredSupplements.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateIcon}>📦</Text>
            <Text style={styles.emptyStateTitle}>Keine Supplements</Text>
            <Text style={styles.emptyStateText}>
              {selectedFilter === "all"
                ? "Füge Supplements aus deinen Empfehlungen hinzu"
                : "Keine Supplements in dieser Kategorie"}
            </Text>
          </View>
        ) : (
          <View style={styles.supplementList}>
            {filteredSupplements.map((supplement) => (
              <SupplementCard
                key={supplement.id}
                supplement={supplement}
                taken={takenStatus[supplement.supplementId] || false}
                onToggleTaken={() => handleToggleTaken(supplement.supplementId)}
                onRemove={() => handleRemoveSupplement(supplement)}
                onShowDetails={() => handleShowDetails(supplement.supplementId)}
              />
            ))}
          </View>
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Navigate to Recommendations Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.recommendationsButton}
          onPress={onNavigateToRecommendations}
        >
          <Text style={styles.recommendationsButtonText}>
            Meine Empfehlungen
          </Text>
        </TouchableOpacity>
      </View>

      {/* Detail Modal */}
      <SupplementDetailModal
        visible={showDetailModal}
        supplement={selectedSupplement}
        onClose={() => setShowDetailModal(false)}
      />
    </View>
  );
}

interface SupplementCardProps {
  supplement: UserStackSupplement;
  taken: boolean;
  onToggleTaken: () => void;
  onRemove: () => void;
  onShowDetails: () => void;
}

function SupplementCard({
  supplement,
  taken,
  onToggleTaken,
  onRemove,
  onShowDetails,
}: SupplementCardProps) {
  return (
    <Pressable
      style={[styles.card, taken && styles.cardTaken]}
      onPress={onShowDetails}
    >
      <View style={styles.cardLeft}>
        {/* Checkbox */}
        <TouchableOpacity
          style={[styles.checkbox, taken && styles.checkboxChecked]}
          onPress={(e) => {
            e.stopPropagation();
            onToggleTaken();
          }}
        >
          {taken && <Text style={styles.checkmark}>✓</Text>}
        </TouchableOpacity>

        {/* Supplement Info */}
        <View style={styles.cardInfo}>
          <Text style={[styles.cardTitle, taken && styles.cardTitleTaken]}>
            {supplement.supplementName}
          </Text>
          <View style={styles.cardTags}>
            {supplement.targetAreas.slice(0, 2).map((area) => (
              <View key={area} style={styles.cardTag}>
                <Text style={styles.cardTagText}>
                  {getTargetAreaDisplayName(area)}
                </Text>
              </View>
            ))}
            {supplement.targetAreas.length > 2 && (
              <Text style={styles.cardTagMore}>
                +{supplement.targetAreas.length - 2}
              </Text>
            )}
          </View>
        </View>
      </View>

      {/* Menu Button */}
      <TouchableOpacity
        style={styles.menuButton}
        onPress={(e) => {
          e.stopPropagation();
          onRemove();
        }}
      >
        <Text style={styles.menuButtonText}>⋯</Text>
      </TouchableOpacity>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    paddingHorizontal: theme.spacing.xl,
    paddingTop: theme.spacing.lg,
    paddingBottom: theme.spacing.sm,
  },
  headerTitle: {
    fontSize: theme.typography.sizes.xxxl,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  dateText: {
    fontSize: theme.typography.sizes.md,
    color: theme.colors.textSecondary,
    fontWeight: theme.typography.weights.medium,
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
  supplementList: {
    paddingHorizontal: theme.spacing.xl,
    gap: theme.spacing.md,
  },
  card: {
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.lg,
    padding: theme.spacing.lg,
    marginBottom: theme.spacing.md,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    ...theme.shadows.sm,
  },
  cardTaken: {
    opacity: 0.6,
  },
  cardLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: theme.spacing.md,
    flex: 1,
  },
  checkbox: {
    width: 28,
    height: 28,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    justifyContent: "center",
    alignItems: "center",
  },
  checkboxChecked: {
    backgroundColor: theme.colors.secondary,
    borderColor: theme.colors.secondary,
  },
  checkmark: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: theme.typography.weights.bold,
  },
  cardInfo: {
    flex: 1,
  },
  cardTitle: {
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  cardTitleTaken: {
    textDecorationLine: "line-through",
  },
  cardTags: {
    flexDirection: "row",
    gap: theme.spacing.xs,
    alignItems: "center",
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
  menuButton: {
    width: 32,
    height: 32,
    justifyContent: "center",
    alignItems: "center",
  },
  menuButtonText: {
    fontSize: 24,
    color: theme.colors.textSecondary,
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
  recommendationsButton: {
    backgroundColor: theme.colors.primary,
    paddingVertical: theme.spacing.lg,
    borderRadius: theme.borderRadius.md,
    alignItems: "center",
    ...theme.shadows.md,
  },
  recommendationsButtonText: {
    fontSize: theme.typography.sizes.lg,
    fontWeight: theme.typography.weights.semibold,
    color: "#FFFFFF",
  },
});
