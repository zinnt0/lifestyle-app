/**
 * Profile Screen
 *
 * Displays user profile information collected during onboarding.
 * Modernized with design system components and improved visual hierarchy.
 */

import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  FlatList,
  TouchableOpacity,
} from "react-native";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "../../lib/supabase";
import { useLocalProfile } from "../../hooks/useLocalProfile";
import type { MainStackParamList } from "../../navigation/types";
import { Button } from "../../components/ui/Button";
import { ProfileField } from "../../components/ui/ProfileField";
import { Card } from "../../components/ui/Card";
import { foodService } from "../../services/FoodService";
import { localFoodCache } from "../../services/cache/LocalFoodCache";
import type { FoodItem } from "../../types/nutrition";
import {
  COLORS,
  SPACING,
  TYPOGRAPHY,
  BORDER_RADIUS,
  SHADOWS,
} from "../../components/ui/theme";

type ProfileScreenNavigationProp = NativeStackNavigationProp<
  MainStackParamList,
  "Profile"
>;

/**
 * ProfileScreen Component
 *
 * Displays user profile data using local cache with automatic Supabase fallback.
 * Shows all onboarding data in a read-only format.
 * Loads instantly from cache on subsequent visits!
 */
export const ProfileScreen: React.FC = () => {
  const navigation = useNavigation<ProfileScreenNavigationProp>();
  const [userId, setUserId] = useState<string | null>(null);

  // Debug: Food Cache Modal State
  const [showCacheModal, setShowCacheModal] = useState(false);
  const [cachedFoods, setCachedFoods] = useState<FoodItem[]>([]);
  const [cacheLoading, setCacheLoading] = useState(false);
  const [cacheSize, setCacheSize] = useState(0);

  // Get user ID from Supabase auth
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      setUserId(user?.id || null);
    });
  }, []);

  // Use cache-first profile hook for instant loading
  const { profile, loading, error, refreshProfile } = useLocalProfile(userId, true);

  // Refresh profile when screen comes into focus (e.g., returning from edit)
  useFocusEffect(
    useCallback(() => {
      if (userId) {
        console.log('[ProfileScreen] Screen focused, refreshing profile...');
        refreshProfile();
      }
    }, [userId, refreshProfile])
  );

  // Debug: Load cached foods
  const loadCachedFoods = async () => {
    setCacheLoading(true);
    try {
      const foods = await localFoodCache.getTopFoods(50);
      const size = await localFoodCache.getCacheSize();
      setCachedFoods(foods);
      setCacheSize(size);
      setShowCacheModal(true);
    } catch (error) {
      console.error("Failed to load cached foods:", error);
      Alert.alert("Fehler", "Cache konnte nicht geladen werden.");
    } finally {
      setCacheLoading(false);
    }
  };

  const handleLogout = () => {
    Alert.alert("Abmelden", "Möchtest du dich wirklich abmelden?", [
      { text: "Abbrechen", style: "cancel" },
      {
        text: "Abmelden",
        style: "destructive",
        onPress: async () => {
          try {
            await supabase.auth.signOut();
            // Navigation wird automatisch durch Supabase Auth State Change gehandelt
          } catch (error) {
            Alert.alert("Fehler", "Abmeldung fehlgeschlagen");
          }
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Profil wird geladen...</Text>
      </View>
    );
  }

  if (error || !profile) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={64} color={COLORS.error} />
        <Text style={styles.errorTitle}>
          {error || "Profil nicht gefunden"}
        </Text>
        <Text style={styles.errorSubtitle}>
          Bitte versuche es später erneut
        </Text>
        <Button
          title="Erneut laden"
          onPress={refreshProfile}
          variant="primary"
          size="large"
          style={styles.retryButton}
        />
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    >
      {/* Header Section */}
      <View style={styles.header}>
        <View style={styles.avatarContainer}>
          {profile.profile_image_url ? (
            <Image
              source={{
                uri: `${profile.profile_image_url}?t=${Date.now()}`,
              }}
              style={styles.avatar}
              resizeMode="cover"
              onError={(error) => {
                console.error('Profile image load error:', error.nativeEvent.error);
                console.error('Profile image URL:', profile.profile_image_url);
              }}
              onLoad={() => {
                console.log('Profile image loaded successfully');
              }}
            />
          ) : (
            <View style={styles.avatar}>
              <Ionicons name="person" size={48} color={COLORS.surface} />
            </View>
          )}
        </View>
        <Text style={styles.userName}>
          {profile.username ? `@${profile.username}` : 'Mein Profil'}
        </Text>
        <Text style={styles.userSubtitle}>Deine persönlichen Daten</Text>
      </View>

      {/* Basic Info Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="person-outline" size={24} color={COLORS.primary} />
          <Text style={styles.sectionTitle}>Grunddaten</Text>
        </View>

        <Card elevation="small" padding="medium">
          <ProfileField label="Alter" value={`${profile.age} Jahre`} />
          <ProfileField
            label="Geschlecht"
            value={profile.gender || "Nicht angegeben"}
          />
          <ProfileField label="Gewicht" value={`${profile.weight} kg`} />
          <ProfileField
            label="Größe"
            value={`${profile.height} cm`}
            style={styles.lastField}
          />
        </Card>
      </View>

      {/* Fitness Info Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="barbell-outline" size={24} color={COLORS.primary} />
          <Text style={styles.sectionTitle}>Fitness</Text>
        </View>

        <Card elevation="small" padding="medium">
          <ProfileField
            label="Trainingslevel"
            value={profile.fitness_level || "Nicht angegeben"}
          />
          <ProfileField
            label="Trainingserfahrung"
            value={`${profile.training_experience_months} Monate`}
          />
          <ProfileField
            label="Verfügbare Trainingstage"
            value={`${profile.available_training_days} Tage/Woche`}
          />
          {profile.preferred_training_days &&
            profile.preferred_training_days.length > 0 && (
              <ProfileField
                label="Bevorzugte Trainingstage"
                value={formatPreferredDays(profile.preferred_training_days)}
              />
            )}
          <ProfileField
            label="Primäres Ziel"
            value={profile.primary_goal || "Nicht angegeben"}
            style={styles.lastField}
          />
        </Card>
      </View>

      {/* Lifestyle Info Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="bed-outline" size={24} color={COLORS.primary} />
          <Text style={styles.sectionTitle}>Lifestyle</Text>
        </View>

        <Card elevation="small" padding="medium">
          <ProfileField
            label="Durchschnittlicher Schlaf"
            value={`${profile.sleep_hours_avg} Stunden`}
          />
          <ProfileField
            label="Stress-Level"
            value={`${profile.stress_level}/10`}
            style={styles.lastField}
          />
        </Card>
      </View>

      {/* Equipment Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="fitness-outline" size={24} color={COLORS.primary} />
          <Text style={styles.sectionTitle}>Equipment</Text>
        </View>

        <Card elevation="small" padding="medium">
          <ProfileField
            label="Fitnessstudio-Zugang"
            value={profile.has_gym_access ? "Ja" : "Nein"}
          />
          {profile.home_equipment && profile.home_equipment.length > 0 && (
            <ProfileField
              label="Home Equipment"
              value={profile.home_equipment.join(", ")}
              style={styles.lastField}
            />
          )}
          {(!profile.home_equipment || profile.home_equipment.length === 0) && (
            <Text style={styles.noEquipmentText}>
              Kein Home Equipment angegeben
            </Text>
          )}
        </Card>
      </View>

      {/* Nutrition Goals Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="nutrition-outline" size={24} color={COLORS.primary} />
          <Text style={styles.sectionTitle}>Ernährungsziele</Text>
        </View>

        <Card elevation="small" padding="medium">
          <ProfileField
            label="Aktivitätslevel"
            value={getPALLabel(profile.pal_factor)}
          />
          {profile.target_weight_kg && (
            <ProfileField
              label="Zielgewicht"
              value={`${profile.target_weight_kg} kg`}
            />
          )}
          {profile.target_date && (
            <ProfileField
              label="Zieldatum"
              value={new Date(profile.target_date).toLocaleDateString('de-DE')}
            />
          )}
          {profile.body_fat_percentage && (
            <ProfileField
              label="Körperfettanteil"
              value={`${profile.body_fat_percentage}%`}
            />
          )}
          {!profile.target_weight_kg && !profile.target_date && !profile.body_fat_percentage && (
            <Text style={styles.noEquipmentText}>
              Keine zusätzlichen Ernährungsziele angegeben
            </Text>
          )}
        </Card>
      </View>

      {/* Supplement Health Data Section */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Ionicons name="medical-outline" size={24} color={COLORS.primary} />
          <Text style={styles.sectionTitle}>Gesundheitsdaten (Supplements)</Text>
        </View>

        <Card elevation="small" padding="medium">
          {/* GI Issues */}
          <ProfileField
            label="Magen-Darm-Beschwerden"
            value={formatGiIssues(profile.gi_issues)}
          />

          {/* Hydration/Sweating */}
          <ProfileField
            label="Starkes Schwitzen"
            value={profile.heavy_sweating ? "Ja" : "Nein"}
          />
          <ProfileField
            label="Hohe Salzaufnahme"
            value={profile.high_salt_intake ? "Ja" : "Nein"}
          />

          {/* Joint Issues */}
          <ProfileField
            label="Gelenkbeschwerden"
            value={formatJointIssues(profile.joint_issues)}
          />

          {/* Lab Values */}
          {profile.lab_values && Object.keys(profile.lab_values).length > 0 ? (
            <>
              <Text style={styles.labValuesTitle}>Laborwerte</Text>
              {profile.lab_values.hemoglobin && (
                <ProfileField
                  label="Hämoglobin"
                  value={`${profile.lab_values.hemoglobin} g/dL`}
                />
              )}
              {profile.lab_values.mcv && (
                <ProfileField
                  label="MCV"
                  value={`${profile.lab_values.mcv} fL`}
                />
              )}
              {profile.lab_values.vitamin_d && (
                <ProfileField
                  label="Vitamin D"
                  value={`${profile.lab_values.vitamin_d} ng/mL`}
                />
              )}
              {profile.lab_values.crp && (
                <ProfileField
                  label="CRP"
                  value={`${profile.lab_values.crp} mg/L`}
                />
              )}
              {profile.lab_values.alt && (
                <ProfileField
                  label="ALT (GPT)"
                  value={`${profile.lab_values.alt} U/L`}
                />
              )}
              {profile.lab_values.ggt && (
                <ProfileField
                  label="GGT"
                  value={`${profile.lab_values.ggt} U/L`}
                />
              )}
              {profile.lab_values.estradiol && (
                <ProfileField
                  label="Estradiol"
                  value={`${profile.lab_values.estradiol} pg/mL`}
                />
              )}
              {profile.lab_values.testosterone && (
                <ProfileField
                  label="Testosteron gesamt"
                  value={`${profile.lab_values.testosterone} ng/mL`}
                />
              )}
            </>
          ) : (
            <ProfileField
              label="Laborwerte"
              value="Keine angegeben"
              style={styles.lastField}
            />
          )}
        </Card>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionContainer}>
        <Button
          title="Profil bearbeiten"
          variant="primary"
          size="large"
          onPress={() => navigation.navigate("ProfileEdit")}
          style={styles.editButton}
        />
      </View>

      {/* Bottom Spacing */}
      <View style={styles.bottomSpacer} />

      {/* Logout Button at Bottom */}
      <View style={styles.logoutContainer}>
        <Button variant="danger" onPress={handleLogout}>
          Ausloggen
        </Button>
      </View>

      {/* Debug: Food Cache Section */}
      <View style={styles.debugContainer}>
        <Text style={styles.debugTitle}>Debug</Text>
        <View style={styles.debugButtonRow}>
          <Button
            variant="secondary"
            size="small"
            onPress={loadCachedFoods}
            style={styles.debugButton}
          >
            {cacheLoading ? "Laden..." : "Cache anzeigen"}
          </Button>
          <Button
            variant="secondary"
            size="small"
            onPress={async () => {
              try {
                await foodService.clearLocalCache();
                setCachedFoods([]);
                setCacheSize(0);
                Alert.alert("Cache geleert", "Der lokale Food-Cache wurde erfolgreich geleert.");
              } catch (error) {
                Alert.alert("Fehler", "Cache konnte nicht geleert werden.");
                console.error("Clear cache error:", error);
              }
            }}
            style={styles.debugButton}
          >
            Cache leeren
          </Button>
        </View>
      </View>

      {/* Food Cache Debug Modal */}
      <Modal
        visible={showCacheModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowCacheModal(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Lokaler Food-Cache</Text>
            <Text style={styles.modalSubtitle}>{cacheSize} Einträge</Text>
            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowCacheModal(false)}
            >
              <Ionicons name="close" size={24} color={COLORS.text} />
            </TouchableOpacity>
          </View>

          <FlatList
            data={cachedFoods}
            keyExtractor={(item) => item.barcode}
            contentContainerStyle={styles.modalList}
            renderItem={({ item, index }) => (
              <View style={styles.cacheItem}>
                <View style={styles.cacheItemHeader}>
                  <Text style={styles.cacheItemRank}>#{index + 1}</Text>
                  <Text style={styles.cacheItemName} numberOfLines={1}>
                    {item.name}
                  </Text>
                </View>
                <View style={styles.cacheItemDetails}>
                  {item.brand && (
                    <Text style={styles.cacheItemBrand}>{item.brand}</Text>
                  )}
                  <Text style={styles.cacheItemBarcode}>{item.barcode}</Text>
                </View>
                <View style={styles.cacheItemStats}>
                  <Text style={styles.cacheItemStat}>
                    <Ionicons name="flame-outline" size={12} color={COLORS.textSecondary} />
                    {" "}{item.calories ?? "?"} kcal
                  </Text>
                  <Text style={styles.cacheItemStat}>
                    <Ionicons name="repeat-outline" size={12} color={COLORS.textSecondary} />
                    {" "}{item.usage_count ?? 0}x verwendet
                  </Text>
                </View>
              </View>
            )}
            ListEmptyComponent={
              <View style={styles.emptyCache}>
                <Ionicons name="file-tray-outline" size={48} color={COLORS.textTertiary} />
                <Text style={styles.emptyCacheText}>Cache ist leer</Text>
              </View>
            }
          />
        </View>
      </Modal>
    </ScrollView>
  );
};

/**
 * Format preferred training days array to readable string
 * Converts day numbers to German day names
 */
const formatPreferredDays = (days: number[]): string => {
  const dayNames = ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"];
  return days
    .sort((a, b) => a - b)
    .map((day) => dayNames[day])
    .join(", ");
};

/**
 * Get human-readable label for PAL factor
 */
const getPALLabel = (palFactor: number | null): string => {
  if (!palFactor) return 'Moderat aktiv (Standard)';

  if (palFactor <= 1.2) return 'Sedentär (1.2)';
  if (palFactor <= 1.375) return 'Leicht aktiv (1.375)';
  if (palFactor <= 1.55) return 'Moderat aktiv (1.55)';
  if (palFactor <= 1.725) return 'Sehr aktiv (1.725)';
  return 'Extrem aktiv (1.9)';
};

/**
 * Format GI issues array to readable string
 */
const formatGiIssues = (issues: string[] | null): string => {
  if (!issues || issues.length === 0) return 'Keine';

  const labels: Record<string, string> = {
    bloating: 'Blähungen',
    irritable_bowel: 'Reizdarm',
    diarrhea: 'Durchfall',
    constipation: 'Verstopfung',
  };

  return issues.map(issue => labels[issue] || issue).join(', ');
};

/**
 * Format joint issues array to readable string
 */
const formatJointIssues = (issues: string[] | null): string => {
  if (!issues || issues.length === 0) return 'Keine';

  const labels: Record<string, string> = {
    knee: 'Knie',
    tendons: 'Sehnen',
    shoulder: 'Schulter',
    back: 'Rücken',
  };

  return issues.map(issue => labels[issue] || issue).join(', ');
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  content: {
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.xxl,
    paddingBottom: SPACING.xxxl,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.background,
  },
  loadingText: {
    marginTop: SPACING.md,
    fontSize: TYPOGRAPHY.sizes.md,
    color: COLORS.textSecondary,
    fontWeight: TYPOGRAPHY.weights.medium,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: COLORS.background,
    padding: SPACING.xxxl,
  },
  errorTitle: {
    fontSize: TYPOGRAPHY.sizes.xl,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.text,
    marginTop: SPACING.lg,
    marginBottom: SPACING.xs,
    textAlign: "center",
  },
  errorSubtitle: {
    fontSize: TYPOGRAPHY.sizes.md,
    color: COLORS.textSecondary,
    textAlign: "center",
    marginBottom: SPACING.xxl,
  },
  retryButton: {
    minWidth: 200,
  },

  // Header Section
  header: {
    alignItems: "center",
    marginBottom: SPACING.xxxl,
  },
  avatarContainer: {
    marginBottom: SPACING.lg,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.primary,
    justifyContent: "center",
    alignItems: "center",
    ...SHADOWS.md,
  },
  userName: {
    fontSize: TYPOGRAPHY.sizes.xxl,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  userSubtitle: {
    fontSize: TYPOGRAPHY.sizes.md,
    color: COLORS.textSecondary,
    fontWeight: TYPOGRAPHY.weights.medium,
  },

  // Section Styles
  section: {
    marginBottom: SPACING.xxl,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: SPACING.md,
  },
  sectionTitle: {
    fontSize: TYPOGRAPHY.sizes.lg,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.text,
    marginLeft: SPACING.sm,
  },

  // Field Styles
  lastField: {
    marginBottom: 0,
  },
  noEquipmentText: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textTertiary,
    fontStyle: "italic",
  },
  labValuesTitle: {
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.text,
    marginTop: SPACING.md,
    marginBottom: SPACING.sm,
  },

  // Action Buttons
  actionContainer: {
    marginTop: SPACING.lg,
  },
  editButton: {
    marginBottom: SPACING.md,
  },
  bottomSpacer: {
    height: SPACING.xxxl,
  },
  logoutContainer: {
    marginBottom: SPACING.xxl,
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  debugContainer: {
    marginBottom: SPACING.xxxl,
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    opacity: 0.7,
  },
  debugTitle: {
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.medium,
    color: COLORS.textTertiary,
    marginBottom: SPACING.sm,
    textAlign: "center",
  },
  debugButtonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    gap: SPACING.sm,
  },
  debugButton: {
    flex: 1,
  },

  // Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  modalHeader: {
    paddingHorizontal: SPACING.xl,
    paddingTop: SPACING.xl,
    paddingBottom: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.surface,
  },
  modalTitle: {
    fontSize: TYPOGRAPHY.sizes.xl,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.text,
  },
  modalSubtitle: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  modalCloseButton: {
    position: "absolute",
    top: SPACING.xl,
    right: SPACING.xl,
    padding: SPACING.xs,
  },
  modalList: {
    padding: SPACING.md,
  },

  // Cache Item Styles
  cacheItem: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    ...SHADOWS.sm,
  },
  cacheItemHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: SPACING.xs,
  },
  cacheItemRank: {
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.bold,
    color: COLORS.primary,
    marginRight: SPACING.sm,
    minWidth: 30,
  },
  cacheItemName: {
    fontSize: TYPOGRAPHY.sizes.md,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.text,
    flex: 1,
  },
  cacheItemDetails: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: SPACING.xs,
    paddingLeft: 30 + SPACING.sm,
  },
  cacheItemBrand: {
    fontSize: TYPOGRAPHY.sizes.sm,
    color: COLORS.textSecondary,
    marginRight: SPACING.md,
  },
  cacheItemBarcode: {
    fontSize: TYPOGRAPHY.sizes.xs,
    color: COLORS.textTertiary,
    fontFamily: "monospace",
  },
  cacheItemStats: {
    flexDirection: "row",
    paddingLeft: 30 + SPACING.sm,
    gap: SPACING.md,
  },
  cacheItemStat: {
    fontSize: TYPOGRAPHY.sizes.xs,
    color: COLORS.textSecondary,
  },

  // Empty State
  emptyCache: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: SPACING.xxxl,
  },
  emptyCacheText: {
    fontSize: TYPOGRAPHY.sizes.md,
    color: COLORS.textTertiary,
    marginTop: SPACING.md,
  },
});
