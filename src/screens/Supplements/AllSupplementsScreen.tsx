/**
 * All Supplements Screen
 *
 * Displays a complete list of all available supplements with:
 * - Search functionality
 * - Filter by target area
 * - Add to stack functionality
 * - View details
 */

import React, { useState, useCallback, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Pressable,
  Alert,
} from "react-native";
import { supabase } from "../../lib/supabase";
import { theme } from "../../components/ui/theme";
import {
  TargetArea,
  SupplementDefinition,
} from "../../services/supplements/types";
import { SUPPLEMENT_DEFINITIONS } from "../../services/supplements/supplementDefinitions";
import {
  getUserStack,
  addSupplementToStack,
  getTargetAreaDisplayName,
} from "../../services/supplements/stackStorage";
import { SupplementDetailModal } from "./SupplementDetailModal";

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

export function AllSupplementsScreen() {
  const [userId, setUserId] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState<TargetArea | "all">(
    "all"
  );
  const [selectedSupplement, setSelectedSupplement] =
    useState<SupplementDefinition | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
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

  // Filter supplements
  const filteredSupplements = SUPPLEMENT_DEFINITIONS.filter((supplement) => {
    // Filter by target area
    if (
      selectedFilter !== "all" &&
      !supplement.targetAreas.includes(selectedFilter)
    ) {
      return false;
    }

    // Filter by search query
    if (searchQuery.trim() !== "") {
      const query = searchQuery.toLowerCase();
      return supplement.name.toLowerCase().includes(query);
    }

    return true;
  });

  // Handle add to stack
  const handleAddToStack = async (supplement: SupplementDefinition) => {
    if (!userId) return;

    // Check if already in stack
    if (userStackIds.has(supplement.id)) {
      Alert.alert(
        "Bereits hinzugefügt",
        `${supplement.name} ist bereits in deinem Stack`
      );
      return;
    }

    try {
      await addSupplementToStack(
        userId,
        supplement.id,
        supplement.name,
        supplement.targetAreas,
        supplement.substanceClass,
        "manual"
      );

      Alert.alert(
        "Hinzugefügt",
        `${supplement.name} wurde zu deinem Stack hinzugefügt`,
        [{ text: "OK" }]
      );

      setRefreshKey((prev) => prev + 1);
    } catch (error) {
      Alert.alert("Fehler", "Konnte nicht zum Stack hinzufügen");
    }
  };

  // Show supplement details
  const handleShowDetails = (supplement: SupplementDefinition) => {
    setSelectedSupplement(supplement);
    setShowDetailModal(true);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Alle Supplements</Text>
        <Text style={styles.headerSubtitle}>
          {filteredSupplements.length} verfügbar
        </Text>
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          placeholder="Supplements durchsuchen..."
          placeholderTextColor={theme.colors.textTertiary}
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery("")}>
            <Text style={styles.clearButton}>✕</Text>
          </TouchableOpacity>
        )}
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

      {/* Supplements List */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {filteredSupplements.length === 0 ? (
          <View style={styles.emptyState}>
            <Text style={styles.emptyStateIcon}>🔍</Text>
            <Text style={styles.emptyStateTitle}>Keine Ergebnisse</Text>
            <Text style={styles.emptyStateText}>
              Versuche es mit einem anderen Suchbegriff oder Filter
            </Text>
          </View>
        ) : (
          <View style={styles.supplementList}>
            {filteredSupplements.map((supplement) => (
              <SupplementListItem
                key={supplement.id}
                supplement={supplement}
                isInStack={userStackIds.has(supplement.id)}
                onAdd={() => handleAddToStack(supplement)}
                onShowDetails={() => handleShowDetails(supplement)}
              />
            ))}
          </View>
        )}

        <View style={styles.bottomSpacer} />
      </ScrollView>

      {/* Detail Modal */}
      <SupplementDetailModal
        visible={showDetailModal}
        supplement={selectedSupplement}
        onClose={() => setShowDetailModal(false)}
      />
    </View>
  );
}

interface SupplementListItemProps {
  supplement: SupplementDefinition;
  isInStack: boolean;
  onAdd: () => void;
  onShowDetails: () => void;
}

function SupplementListItem({
  supplement,
  isInStack,
  onAdd,
  onShowDetails,
}: SupplementListItemProps) {
  return (
    <Pressable style={styles.card} onPress={onShowDetails}>
      <View style={styles.cardContent}>
        <Text style={styles.cardTitle}>{supplement.name}</Text>

        {/* Target Areas */}
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

        {/* Substance Class */}
        <Text style={styles.cardSubstance}>
          {getSubstanceClassDisplayName(supplement.substanceClass)}
        </Text>
      </View>

      {/* Add Button */}
      <TouchableOpacity
        style={[styles.addButton, isInStack && styles.addButtonDisabled]}
        onPress={(e) => {
          e.stopPropagation();
          if (!isInStack) onAdd();
        }}
        disabled={isInStack}
      >
        <Text
          style={[
            styles.addButtonText,
            isInStack && styles.addButtonTextDisabled,
          ]}
        >
          {isInStack ? "✓" : "+"}
        </Text>
      </TouchableOpacity>
    </Pressable>
  );
}

function getSubstanceClassDisplayName(substanceClass: string): string {
  const displayNames: Record<string, string> = {
    Aminosaeure_Derivat: "Aminosäure",
    Protein: "Protein",
    Kreatin: "Kreatin",
    Vitamin: "Vitamin",
    Mineral_Spurenelement: "Mineral",
    Fettsaeuren_Oel: "Fettsäure",
    Pflanzenextrakt: "Pflanzenextrakt",
    Pilz: "Pilz",
    Probiotikum: "Probiotikum",
    Elektrolyt_Buffer_Osmolyte: "Elektrolyt",
    Hormon_Signalstoff: "Hormon",
    Sonstiges: "Sonstiges",
  };

  return displayNames[substanceClass] || substanceClass;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    paddingHorizontal: theme.spacing.xl,
    paddingTop: 60,
    paddingBottom: theme.spacing.sm,
  },
  headerTitle: {
    fontSize: theme.typography.sizes.xxxl,
    fontWeight: theme.typography.weights.bold,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  headerSubtitle: {
    fontSize: theme.typography.sizes.md,
    color: theme.colors.textSecondary,
    fontWeight: theme.typography.weights.medium,
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: theme.colors.surface,
    marginHorizontal: theme.spacing.xl,
    marginBottom: theme.spacing.md,
    paddingHorizontal: theme.spacing.lg,
    paddingVertical: theme.spacing.md,
    borderRadius: theme.borderRadius.md,
    ...theme.shadows.sm,
  },
  searchIcon: {
    fontSize: 18,
    marginRight: theme.spacing.sm,
  },
  searchInput: {
    flex: 1,
    fontSize: theme.typography.sizes.md,
    color: theme.colors.text,
  },
  clearButton: {
    fontSize: 20,
    color: theme.colors.textTertiary,
    paddingHorizontal: theme.spacing.sm,
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
  cardContent: {
    flex: 1,
    marginRight: theme.spacing.md,
  },
  cardTitle: {
    fontSize: theme.typography.sizes.md,
    fontWeight: theme.typography.weights.semibold,
    color: theme.colors.text,
    marginBottom: theme.spacing.xs,
  },
  cardTags: {
    flexDirection: "row",
    gap: theme.spacing.xs,
    marginBottom: theme.spacing.xs,
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
  cardSubstance: {
    fontSize: theme.typography.sizes.sm,
    color: theme.colors.textTertiary,
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
  addButtonDisabled: {
    backgroundColor: theme.colors.success,
  },
  addButtonText: {
    fontSize: 24,
    color: "#FFFFFF",
    fontWeight: theme.typography.weights.bold,
  },
  addButtonTextDisabled: {
    fontSize: 20,
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
});
