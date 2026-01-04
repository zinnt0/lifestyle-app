/**
 * Food Detail Screen (Simplified)
 * View food details and add portion information
 */

import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useRoute } from "@react-navigation/native";
import type { RouteProp } from "@react-navigation/native";
import type { NutritionStackParamList } from "../../navigation/NutritionStackNavigator";
import {
  COLORS,
  SPACING,
  BORDER_RADIUS,
  SHADOWS,
} from "../../components/ui/theme";
import { Ionicons } from "@expo/vector-icons";
import { addFoodToDiary, type FoodItem } from "../../services/nutritionApi";
import { nutritionSyncService } from "../../services/NutritionSyncService";

type FoodDetailRouteProp = RouteProp<NutritionStackParamList, "FoodDetail">;

export function FoodDetailScreen({ userId }: { userId: string }) {
  const navigation = useNavigation();
  const route = useRoute<FoodDetailRouteProp>();
  const { food, mealType } = route.params;

  const [servingSize, setServingSize] = useState(
    food.serving_size?.toString() || "100"
  );
  const [saving, setSaving] = useState(false);

  // Calculate nutrition based on serving size
  const amount = parseFloat(servingSize) || 100;
  const ratio = amount / 100;

  const calculatedCalories = Math.round((food.calories || 0) * ratio);
  const calculatedProtein = Math.round((food.protein || 0) * ratio);
  const calculatedCarbs = Math.round((food.carbs || 0) * ratio);
  const calculatedFat = Math.round((food.fat || 0) * ratio);
  const calculatedSugar = Math.round((food.sugar || 0) * ratio);

  const handleAddToDiary = async () => {
    const quantity = parseFloat(servingSize);
    if (!quantity || quantity <= 0) {
      Alert.alert("Fehler", "Bitte gib eine gültige Portionsgröße ein");
      return;
    }

    // Check if food has an ID or barcode
    if (!food.id && !food.barcode) {
      Alert.alert(
        "Fehler",
        "Dieses Lebensmittel kann nicht gespeichert werden. Es fehlt sowohl ID als auch Barcode."
      );
      return;
    }

    try {
      setSaving(true);

      // Get current date in YYYY-MM-DD format
      const today = new Date();
      const mealDate = today.toISOString().split("T")[0];

      // Determine meal type - use provided mealType or default to snack
      // Convert 'snacks' to 'snack' to match API expectation
      let finalMealType: "breakfast" | "lunch" | "dinner" | "snack" = "snack";
      if (mealType === "snacks") {
        finalMealType = "snack";
      } else if (mealType) {
        finalMealType = mealType;
      }

      // Pass either the foodItemId (if available) or the full food object
      // The API will cache it first if no ID is available
      await addFoodToDiary({
        userId,
        foodItemId: food.id,
        food: food.id ? undefined : food, // Only pass food if no ID
        mealDate,
        mealType: finalMealType,
        quantity,
        unit: "g",
      });

      // Invalidate cache for the updated date to ensure fresh data
      await nutritionSyncService.syncSingleDay(userId, mealDate);

      Alert.alert(
        "Erfolgreich",
        `${food.name} wurde zu deinem Tagebuch hinzugefügt`,
        [
          {
            text: "OK",
            onPress: () => {
              // Navigate back to dashboard (2 screens back)
              navigation.reset({
                index: 0,
                routes: [{ name: "NutritionDashboard" as never }],
              });
            },
          },
        ]
      );
    } catch (error) {
      console.error("Error adding food to diary:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Unbekannter Fehler";
      Alert.alert(
        "Fehler",
        `Das Lebensmittel konnte nicht gespeichert werden: ${errorMessage}`
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
      >
        {/* Food Header */}
        <View style={styles.headerCard}>
          <Text style={styles.foodName}>{food.name}</Text>
          {food.brand && <Text style={styles.foodBrand}>{food.brand}</Text>}
        </View>

        {/* Portion Selector */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Portionsgröße</Text>
          <View style={styles.servingSizeContainer}>
            <TextInput
              style={styles.servingSizeInput}
              value={servingSize}
              onChangeText={setServingSize}
              keyboardType="numeric"
              placeholder="100"
            />
            <Text style={styles.servingUnit}>g</Text>
          </View>
          <Text style={styles.servingHint}>
            Nährwerte werden pro 100g berechnet
          </Text>
        </View>

        {/* Nutrition Table */}
        <View style={styles.sectionCard}>
          <Text style={styles.sectionTitle}>Nährwerte</Text>
          <View style={styles.nutritionTable}>
            <View style={[styles.nutritionRow, styles.nutritionRowHighlight]}>
              <Text style={styles.nutritionLabel}>Kalorien</Text>
              <Text style={[styles.nutritionValue, { color: COLORS.success }]}>
                {calculatedCalories} kcal
              </Text>
            </View>
            <View style={styles.nutritionRow}>
              <Text style={styles.nutritionLabel}>Eiweiß</Text>
              <Text style={styles.nutritionValue}>{calculatedProtein} g</Text>
            </View>
            <View style={styles.nutritionRow}>
              <Text style={styles.nutritionLabel}>Kohlenhydrate</Text>
              <Text style={styles.nutritionValue}>{calculatedCarbs} g</Text>
            </View>
            <View style={styles.nutritionRow}>
              <Text style={styles.nutritionLabel}> davon Zucker</Text>
              <Text style={styles.nutritionValue}>{calculatedSugar} g</Text>
            </View>
            <View style={styles.nutritionRow}>
              <Text style={styles.nutritionLabel}>Fett</Text>
              <Text style={styles.nutritionValue}>{calculatedFat} g</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Add to Diary Button */}
      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.addButton, saving && styles.addButtonDisabled]}
          onPress={handleAddToDiary}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator size="small" color={COLORS.white} />
          ) : (
            <Ionicons name="add-circle" size={24} color={COLORS.white} />
          )}
          <Text style={styles.addButtonText}>
            {saving ? "Wird gespeichert..." : "Zu Tagebuch hinzufügen"}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.lg,
    paddingBottom: 100,
  },
  headerCard: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.xl,
    marginBottom: SPACING.lg,
    alignItems: "center",
    ...SHADOWS.sm,
  },
  foodName: {
    fontSize: 22,
    fontWeight: "bold",
    color: COLORS.text,
    textAlign: "center",
    marginBottom: SPACING.xs,
  },
  foodBrand: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: "center",
  },
  sectionCard: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    ...SHADOWS.sm,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  servingSizeContainer: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.md,
  },
  servingSizeInput: {
    flex: 1,
    backgroundColor: COLORS.surfaceSecondary,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.lg,
    fontSize: 24,
    fontWeight: "700",
    textAlign: "center",
  },
  servingUnit: {
    fontSize: 20,
    fontWeight: "600",
    color: COLORS.textSecondary,
  },
  servingHint: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: SPACING.sm,
    textAlign: "center",
  },
  nutritionTable: {
    gap: SPACING.xs,
  },
  nutritionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  nutritionRowHighlight: {
    backgroundColor: COLORS.surfaceSecondary,
    paddingHorizontal: SPACING.md,
    borderRadius: BORDER_RADIUS.sm,
    borderBottomWidth: 0,
  },
  nutritionLabel: {
    fontSize: 16,
    color: COLORS.text,
  },
  nutritionValue: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.text,
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: SPACING.lg,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  addButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: SPACING.sm,
    backgroundColor: COLORS.success,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.lg,
    ...SHADOWS.sm,
  },
  addButtonDisabled: {
    backgroundColor: COLORS.textSecondary,
    opacity: 0.6,
  },
  addButtonText: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: "600",
  },
});
