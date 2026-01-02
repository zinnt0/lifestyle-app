/**
 * App Header Component
 *
 * Shared header with logo and profile icon used across all main screens
 */

import React, { useState, useEffect } from "react";
import { View, StyleSheet, TouchableOpacity, Image, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";
import { supabase } from "../../lib/supabase";
import { getProfile } from "../../services/profile.service";

interface AppHeaderProps {
  /** Optional background color override */
  backgroundColor?: string;
}

/**
 * AppHeader Component
 *
 * Displays logo on the left and profile image/icon on the right.
 * Profile icon navigates to the Profile screen when pressed.
 */
export const AppHeader: React.FC<AppHeaderProps> = ({
  backgroundColor = "transparent",
}) => {
  const navigation = useNavigation<any>();
  const [profileImageUrl, setProfileImageUrl] = useState<string | null>(null);
  const [username, setUsername] = useState<string | null>(null);

  // Load profile image on mount
  useEffect(() => {
    loadProfileImage();

    // Listen for navigation events to reload profile image
    const unsubscribe = navigation.addListener('focus', () => {
      loadProfileImage();
    });

    return unsubscribe;
  }, [navigation]);

  const loadProfileImage = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { profile } = await getProfile(user.id);
      if (profile?.profile_image_url) {
        setProfileImageUrl(profile.profile_image_url);
      }
      if (profile?.username) {
        setUsername(profile.username);
      }
    } catch (error) {
      console.error('Error loading profile image:', error);
    }
  };

  const handleProfilePress = () => {
    // Navigate to Profile screen using the tab navigator and main stack
    navigation.navigate("HomeTab", {
      screen: "Profile",
    });
  };

  return (
    <View style={[styles.header, { backgroundColor }]}>
      {/* Logo */}
      <View style={styles.logoContainer}>
        <Image
          source={require("../../../assets/MODO_Logo.png")}
          style={styles.logo}
          resizeMode="contain"
        />
      </View>

      {/* Profile Section */}
      <TouchableOpacity
        style={styles.profileSection}
        onPress={handleProfilePress}
        accessibilityLabel="Profil öffnen"
        accessibilityRole="button"
      >
        {username && (
          <Text style={styles.username}>{username}</Text>
        )}
        <View style={styles.profileButton}>
          {profileImageUrl ? (
            <Image
              source={{ uri: `${profileImageUrl}?t=${Date.now()}` }}
              style={styles.profileImage}
              resizeMode="cover"
            />
          ) : (
            <Ionicons name="person-circle-outline" size={32} color="#333" />
          )}
        </View>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  logoContainer: {
    height: 40,
    width: 100,
    justifyContent: "center",
  },
  logo: {
    height: 40,
    width: 100,
  },
  profileSection: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  username: {
    fontSize: 15,
    fontWeight: "600",
    color: "#333",
  },
  profileButton: {
    width: 44,
    height: 44,
    justifyContent: "center",
    alignItems: "center",
  },
  profileImage: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#F2F2F7",
  },
});
