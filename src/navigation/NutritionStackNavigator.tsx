/**
 * Nutrition Stack Navigator
 * Navigation configuration for nutrition tracking features
 */

import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { NutritionDashboardScreen } from "../screens/Nutrition/NutritionDashboardScreen";
import { FoodSearchScreen } from "../screens/Nutrition/FoodSearchScreen";
import { BarcodeScannerScreen } from "../screens/Nutrition/BarcodeScannerScreen";
import { FoodDetailScreen } from "../screens/Nutrition/FoodDetailScreen";
import type { FoodItem } from "../services/nutritionApi";

export type NutritionStackParamList = {
  NutritionDashboard: undefined;
  FoodSearch: { mealType?: "breakfast" | "lunch" | "dinner" | "snacks" };
  BarcodeScanner: undefined;
  FoodDetail: {
    food: FoodItem;
    mealType?: "breakfast" | "lunch" | "dinner" | "snacks";
  };
};

const Stack = createNativeStackNavigator<NutritionStackParamList>();

interface NutritionStackNavigatorProps {
  userId: string; // Pass from auth context
}

export function NutritionStackNavigator({
  userId,
}: NutritionStackNavigatorProps) {
  return (
    <Stack.Navigator
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="NutritionDashboard">
        {(props) => <NutritionDashboardScreen {...props} userId={userId} />}
      </Stack.Screen>

      <Stack.Screen
        name="FoodSearch"
        component={FoodSearchScreen}
        options={{
          title: "Search Food",
          presentation: "modal",
        }}
      />

      <Stack.Screen
        name="BarcodeScanner"
        component={BarcodeScannerScreen}
        options={{
          title: "Scan Barcode",
          presentation: "fullScreenModal",
          headerShown: false,
        }}
      />

      <Stack.Screen
        name="FoodDetail"
        options={{
          title: "Food Details",
          presentation: "modal",
        }}
      >
        {(props) => <FoodDetailScreen {...props} userId={userId} />}
      </Stack.Screen>
    </Stack.Navigator>
  );
}
