/**
 * Profile Screen
 *
 * Displays user profile information collected during onboarding.
 * Modernized with design system components and improved visual hierarchy.
 */

import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Alert,
  Image,
} from "react-native";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Ionicons } from "@expo/vector-icons";
import { supabase } from "../../lib/supabase";
import { getProfile } from "../../services/profile.service";
import type { Profile } from "../../services/profile.service";
import type { MainStackParamList } from "../../navigation/types";
import { Button } from "../../components/ui/Button";
import { ProfileField } from "../../components/ui/ProfileField";
import { Card } from "../../components/ui/Card";
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
 * Fetches and displays user profile data from Supabase.
 * Shows all onboarding data in a read-only format.
 */
export const ProfileScreen: React.FC = () => {
  const navigation = useNavigation<ProfileScreenNavigationProp>();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  /**
   * Reload profile whenever screen comes into focus
   * This ensures we see updated data after editing
   */
  useFocusEffect(
    useCallback(() => {
      loadProfile();
    }, [])
  );

  /**
   * Load user profile from Supabase
   */
  const loadProfile = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setLoading(false);
        return;
      }

      const { profile, error } = await getProfile(user.id);

      if (error) {
        console.error("Error loading profile:", error.message);
      } else {
        setProfile(profile);
      }
    } catch (error) {
      console.error("Unexpected error loading profile:", error);
    } finally {
      setLoading(false);
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

  if (!profile) {
    return (
      <View style={styles.errorContainer}>
        <Ionicons name="alert-circle-outline" size={64} color={COLORS.error} />
        <Text style={styles.errorTitle}>Profil nicht gefunden</Text>
        <Text style={styles.errorSubtitle}>
          Bitte versuche es später erneut
        </Text>
        <Button
          title="Erneut laden"
          onPress={loadProfile}
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
});
