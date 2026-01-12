/**
 * Tab Navigator
 *
 * Bottom tab navigation for main app sections:
 * - Home (Dashboard and main features)
 * - Training (Workout plans and sessions)
 * - More (Profile, Settings, etc.)
 */

import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Platform, Text } from "react-native";
import { Ionicons } from "@expo/vector-icons";

// Import Stack Navigators
import { MainNavigator } from "./MainNavigator";
import { TrainingStackNavigator } from "./TrainingStackNavigator";
import { NutritionStackNavigator } from "./NutritionStackNavigator";
import { SupplementStackNavigator } from "./SupplementStackNavigator";
import { GlowUpComingSoonScreen } from "../screens/GlowUp/GlowUpComingSoonScreen";
import { supabase } from "../lib/supabase";

const Tab = createBottomTabNavigator();

/**
 * TabNavigator Component
 *
 * Provides bottom tab navigation with:
 * - Home tab (Main features)
 * - Training tab (Workout plans and tracking)
 * - Nutrition tab (Food tracking and nutrition)
 */
export const TabNavigator: React.FC = () => {
  const [userId, setUserId] = React.useState<string>("");

  // Get current user ID
  React.useEffect(() => {
    const getUserId = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
      }
    };
    getUserId();
  }, []);

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#6FD89E",
        tabBarInactiveTintColor: "#999",
        tabBarStyle: {
          borderTopWidth: 1,
          borderTopColor: "#E0E0E0",
          height: Platform.OS === "ios" ? 88 : 60,
          paddingBottom: Platform.OS === "ios" ? 28 : 8,
          paddingTop: 8,
          backgroundColor: "#fff",
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "600",
        },
      }}
    >
      {/* Home Tab */}
      <Tab.Screen
        name="HomeTab"
        component={MainNavigator}
        options={{
          tabBarLabel: "Home",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home-outline" size={size} color={color} />
          ),
        }}
      />

      {/* Training Tab */}
      <Tab.Screen
        name="TrainingTab"
        component={TrainingStackNavigator}
        options={{
          tabBarLabel: "Training",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="fitness-outline" size={size} color={color} />
          ),
        }}
      />

      {/* Nutrition Tab */}
      <Tab.Screen
        name="NutritionTab"
        options={{
          tabBarLabel: "Ernährung",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="nutrition-outline" size={size} color={color} />
          ),
        }}
      >
        {() => <NutritionStackNavigator userId={userId} />}
      </Tab.Screen>

      {/* Supplements Tab */}
      <Tab.Screen
        name="SupplementsTab"
        component={SupplementStackNavigator}
        options={{
          tabBarLabel: "Supplements",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="medkit-outline" size={size} color={color} />
          ),
        }}
      />

      {/* GlowUp Tab */}
      <Tab.Screen
        name="GlowUpTab"
        component={GlowUpComingSoonScreen}
        options={{
          tabBarLabel: "GlowUp",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="sparkles-outline" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};
