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

const Tab = createBottomTabNavigator();

/**
 * TabNavigator Component
 *
 * Provides bottom tab navigation with:
 * - Home tab (Main features)
 * - Training tab (Workout plans and tracking)
 * - More tab (Profile and settings)
 */
export const TabNavigator: React.FC = () => {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#4A90E2",
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

      {/* More Tab */}
      <Tab.Screen
        name="MoreTab"
        component={MainNavigator}
        options={{
          tabBarLabel: "Mehr",
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="ellipsis-horizontal" size={size} color={color} />
          ),
        }}
      />
    </Tab.Navigator>
  );
};
