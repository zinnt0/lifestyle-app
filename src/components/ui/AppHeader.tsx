/**
 * App Header Component
 *
 * Shared header with logo and profile icon used across all main screens
 */

import React from "react";
import { View, StyleSheet, TouchableOpacity, Image } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";

interface AppHeaderProps {
  /** Optional background color override */
  backgroundColor?: string;
}

/**
 * AppHeader Component
 *
 * Displays logo on the left and profile icon on the right.
 * Profile icon navigates to the Profile screen when pressed.
 */
export const AppHeader: React.FC<AppHeaderProps> = ({
  backgroundColor = "transparent",
}) => {
  const navigation = useNavigation<any>();

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

      {/* Profile Icon Button */}
      <TouchableOpacity
        style={styles.profileButton}
        onPress={handleProfilePress}
        accessibilityLabel="Profil öffnen"
        accessibilityRole="button"
      >
        <Ionicons name="person-circle-outline" size={32} color="#333" />
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
  profileButton: {
    width: 44,
    height: 44,
    justifyContent: "center",
    alignItems: "center",
  },
});
