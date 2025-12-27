/**
 * Profile Screen
 *
 * Displays user profile information collected during onboarding.
 * Read-only for now - editing functionality will be added later.
 */

import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { supabase } from "../../lib/supabase";
import { getProfile } from "../../services/profile.service";
import type { Profile } from "../../services/profile.service";
import type { MainStackParamList } from "../../navigation/types";
import { Button } from "../../components/ui/Button";

type ProfileScreenNavigationProp = NativeStackNavigationProp<
  MainStackParamList,
  'Profile'
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

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
      </View>
    );
  }

  if (!profile) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Profil konnte nicht geladen werden</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.headerContainer}>
        <Text style={styles.title}>Dein Profil</Text>
        <Button
          title="Bearbeiten"
          variant="outline"
          size="small"
          onPress={() => navigation.navigate('ProfileEdit')}
        />
      </View>

      {/* Basic Info */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Grunddaten</Text>

        <ProfileField label="Alter" value={`${profile.age} Jahre`} />
        <ProfileField label="Geschlecht" value={profile.gender || "Nicht angegeben"} />
        <ProfileField label="Gewicht" value={`${profile.weight} kg`} />
        <ProfileField label="Größe" value={`${profile.height} cm`} />
      </View>

      {/* Fitness Info */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Fitness</Text>

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
        <ProfileField
          label="Primäres Ziel"
          value={profile.primary_goal || "Nicht angegeben"}
        />
      </View>

      {/* Lifestyle Info */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Lifestyle</Text>

        <ProfileField
          label="Durchschnittlicher Schlaf"
          value={`${profile.sleep_hours_avg} Stunden`}
        />
        <ProfileField
          label="Stress-Level"
          value={`${profile.stress_level}/10`}
        />
      </View>

      {/* Equipment */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Equipment</Text>

        <ProfileField
          label="Fitnessstudio-Zugang"
          value={profile.has_gym_access ? "Ja" : "Nein"}
        />
        {profile.home_equipment && profile.home_equipment.length > 0 && (
          <ProfileField
            label="Home Equipment"
            value={profile.home_equipment.join(", ")}
          />
        )}
      </View>

    </ScrollView>
  );
};

/**
 * ProfileField Component
 *
 * Reusable component for displaying a label-value pair
 */
const ProfileField: React.FC<{ label: string; value: string | number | null }> = ({
  label,
  value,
}) => (
  <View style={styles.field}>
    <Text style={styles.label}>{label}</Text>
    <Text style={styles.value}>{value || "Nicht angegeben"}</Text>
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  content: {
    padding: 24,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#FFFFFF",
  },
  headerContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 12,
    color: "#000000",
  },
  field: {
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    color: "#8E8E93",
    marginBottom: 4,
  },
  value: {
    fontSize: 16,
    color: "#000000",
    fontWeight: "500",
  },
  errorText: {
    fontSize: 16,
    color: "#FF3B30",
    textAlign: "center",
  },
});
