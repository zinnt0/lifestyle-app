/**
 * Nutrition Dashboard Screen
 *
 * Main nutrition tracking screen inspired by Yazio design.
 * Features:
 * - Calorie overview (consumed vs burned vs goal)
 * - Macronutrient progress bars
 * - Meal sections (Breakfast, Lunch, Dinner, Snacks)
 * - Water tracker
 * - Weight tracker
 */

import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Image,
  Alert,
  Modal,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { NutritionStackParamList } from "../../navigation/NutritionStackNavigator";
import {
  COLORS,
  SPACING,
  BORDER_RADIUS,
  SHADOWS,
} from "../../components/ui/theme";
import { Ionicons } from "@expo/vector-icons";
import { getDailySummary, DiaryEntry } from "../../services/nutritionApi";
import { AppHeader } from "../../components/ui/AppHeader";
import { supabase } from "../../lib/supabase";
import { nutritionSyncService } from "../../services/NutritionSyncService";
import Svg, { Circle } from "react-native-svg";

type NavigationProp = NativeStackNavigationProp<
  NutritionStackParamList,
  "NutritionDashboard"
>;

interface NutritionDashboardScreenProps {
  userId: string;
}

// Calorie Ring Component
const CalorieRing = ({
  consumed,
  goal,
  size = 180,
  strokeWidth = 12,
}: {
  consumed: number;
  goal: number;
  size?: number;
  strokeWidth?: number;
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const percentage = Math.min((consumed / goal) * 100, 100);
  const strokeDashoffset = circumference - (circumference * percentage) / 100;

  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size}>
        {/* Background ring (green) */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={COLORS.success}
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Progress ring (blue) */}
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={COLORS.primary}
          strokeWidth={strokeWidth}
          fill="none"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          rotation="-90"
          origin={`${size / 2}, ${size / 2}`}
        />
      </Svg>
    </View>
  );
};

export function NutritionDashboardScreen({
  userId,
}: NutritionDashboardScreenProps) {
  const navigation = useNavigation<NavigationProp>();
  const [refreshing, setRefreshing] = useState(false);

  // Mock data - will be replaced with real data from service
  const [calorieData, setCalorieData] = useState({
    consumed: 0,
    burned: 0,
    goal: 2500,
    remaining: 2500,
  });

  const [macros, setMacros] = useState({
    carbs: { consumed: 0, goal: 300 },
    protein: { consumed: 0, goal: 130 },
    fat: { consumed: 0, goal: 85 },
    sugar: { consumed: 0, goal: 50 },
  });

  const [meals, setMeals] = useState<{
    breakfast: { calories: number; goal: number; entries: DiaryEntry[] };
    lunch: { calories: number; goal: number; entries: DiaryEntry[] };
    dinner: { calories: number; goal: number; entries: DiaryEntry[] };
    snacks: { calories: number; goal: number; entries: DiaryEntry[] };
  }>({
    breakfast: { calories: 0, goal: 750, entries: [] },
    lunch: { calories: 0, goal: 1000, entries: [] },
    dinner: { calories: 0, goal: 625, entries: [] },
    snacks: { calories: 0, goal: 125, entries: [] },
  });

  const [waterData, setWaterData] = useState({
    consumed: 0,
    goal: 2000, // ml
  });

  const [weightData, setWeightData] = useState({
    current: 80.0,
    goal: 75.0,
  });

  // Accordion state for meals
  const [expandedMeals, setExpandedMeals] = useState<{
    breakfast: boolean;
    lunch: boolean;
    dinner: boolean;
    snacks: boolean;
  }>({
    breakfast: false,
    lunch: false,
    dinner: false,
    snacks: false,
  });

  // Modal state for calorie info
  const [showCalorieInfoModal, setShowCalorieInfoModal] = useState(false);
  const [nutritionGoalData, setNutritionGoalData] = useState<any>(null);

  // Load nutrition data
  const loadNutritionData = useCallback(async () => {
    try {
      console.log("Loading nutrition data for user:", userId);

      // Get current date in YYYY-MM-DD format
      const today = new Date();
      const dateStr = today.toISOString().split("T")[0];

      const summary = await getDailySummary(userId, dateStr);

      if (summary && summary.summary) {
        const { calories, macros, water } = summary.summary;

        // Update calorie data
        setCalorieData({
          consumed: calories.consumed || 0,
          burned: calories.burned || 0,
          goal: calories.goal || 2500,
          remaining:
            (calories.goal || 2500) -
            (calories.consumed || 0) +
            (calories.burned || 0),
        });

        // Update macros
        setMacros({
          carbs: {
            consumed: macros.carbs.consumed || 0,
            goal: macros.carbs.goal || 300,
          },
          protein: {
            consumed: macros.protein.consumed || 0,
            goal: macros.protein.goal || 130,
          },
          fat: {
            consumed: macros.fat.consumed || 0,
            goal: macros.fat.goal || 85,
          },
          sugar: {
            consumed: summary.summary.micronutrients?.sugar || 0,
            goal: 50,
          },
        });

        // Update water data
        setWaterData({
          consumed: water.consumed || 0,
          goal: water.goal || 2000,
        });

        console.log("Loaded nutrition data:", summary);
      }

      // Load diary entries
      await loadDiaryEntries(dateStr);

      // Load water intake data
      await loadWaterIntake(dateStr);

      // Load burned calories from workouts
      await loadBurnedCalories(dateStr);

      // Load weight data from profile
      await loadWeightData();

      // Load nutrition goal details for info modal
      await loadNutritionGoalDetails();
    } catch (error) {
      console.error("Error loading nutrition data:", error);
      // Keep existing data on error
    }
  }, [userId]);

  // Load nutrition goal details for info modal
  const loadNutritionGoalDetails = async () => {
    try {
      const { data, error } = await supabase
        .from("user_nutrition_goals")
        .select("*")
        .eq("user_id", userId)
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error && error.code !== "PGRST116") {
        console.error("Error loading nutrition goal details:", error);
        return;
      }

      setNutritionGoalData(data);
      console.log("Loaded nutrition goal details:", data);
    } catch (error) {
      console.error("Error loading nutrition goal details:", error);
    }
  };

  // Load weight data from profile and nutrition goals
  const loadWeightData = async () => {
    try {
      // Get current weight from profile
      const { data: profileData, error: profileError } = await supabase
        .from("profiles")
        .select("weight")
        .eq("id", userId)
        .single();

      if (profileError) throw profileError;

      // Get target weight from nutrition goals (if exists)
      const { data: goalsData, error: goalsError } = await supabase
        .from("nutrition_goals")
        .select("target_weight, current_weight")
        .eq("user_id", userId)
        .eq("status", "active")
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      // Use nutrition_goals current_weight if available, otherwise profile weight
      const currentWeight =
        goalsData?.current_weight || profileData?.weight || weightData.current;
      const targetWeight =
        goalsData?.target_weight || profileData?.weight || weightData.goal;

      setWeightData({
        current: Number(currentWeight),
        goal: Number(targetWeight),
      });

      console.log("Loaded weight data:", {
        current: currentWeight,
        goal: targetWeight,
      });
    } catch (error) {
      console.error("Error loading weight data:", error);
    }
  };

  // Load burned calories from completed workouts
  const loadBurnedCalories = async (date: string) => {
    try {
      // Get all completed workout sessions for the day
      const { data: sessions, error } = await supabase
        .from("workout_sessions")
        .select("total_calories_burned")
        .eq("user_id", userId)
        .eq("date", date)
        .eq("status", "completed")
        .not("total_calories_burned", "is", null);

      if (error) throw error;

      if (sessions && sessions.length > 0) {
        // Sum up all calories burned from workouts on this day
        const totalBurned = sessions.reduce(
          (sum, session) => sum + (session.total_calories_burned || 0),
          0
        );

        // Update calorie data with burned calories
        setCalorieData((prev) => ({
          ...prev,
          burned: totalBurned,
          remaining: prev.goal - prev.consumed + totalBurned,
        }));

        console.log("Loaded burned calories:", totalBurned);
      }
    } catch (error) {
      console.error("Error loading burned calories:", error);
    }
  };

  // Load water intake for the day
  const loadWaterIntake = async (date: string) => {
    try {
      // Get total water intake for the day
      const { data, error } = await supabase
        .from("water_intake")
        .select("amount_ml")
        .eq("user_id", userId)
        .eq("intake_date", date);

      if (error) throw error;

      if (data) {
        const totalWater = data.reduce(
          (sum, intake) => sum + (intake.amount_ml || 0),
          0
        );

        setWaterData((prev) => ({
          ...prev,
          consumed: totalWater,
        }));

        console.log("Loaded water intake:", totalWater);
      }
    } catch (error) {
      console.error("Error loading water intake:", error);
    }
  };

  // Load diary entries for the day
  const loadDiaryEntries = async (date: string) => {
    try {
      const { data, error } = await supabase
        .from("user_food_diary")
        .select(
          `
          id,
          meal_type,
          quantity,
          unit,
          calories,
          protein,
          carbs,
          fat,
          food_name,
          food_items:food_item_id (
            id,
            name,
            brand,
            image_url
          )
        `
        )
        .eq("user_id", userId)
        .eq("meal_date", date)
        .order("meal_type");

      if (error) throw error;

      if (data) {
        // Group entries by meal type
        const groupedMeals = {
          breakfast: { calories: 0, goal: 750, entries: [] as DiaryEntry[] },
          lunch: { calories: 0, goal: 1000, entries: [] as DiaryEntry[] },
          dinner: { calories: 0, goal: 625, entries: [] as DiaryEntry[] },
          snacks: { calories: 0, goal: 125, entries: [] as DiaryEntry[] },
        };

        data.forEach((entry: any) => {
          const mealType =
            entry.meal_type === "snack" ? "snacks" : entry.meal_type;

          if (groupedMeals[mealType as keyof typeof groupedMeals]) {
            groupedMeals[mealType as keyof typeof groupedMeals].entries.push(
              entry
            );
            groupedMeals[mealType as keyof typeof groupedMeals].calories +=
              Number(entry.calories || 0);
          }
        });

        setMeals(groupedMeals);
        console.log("Loaded diary entries:", groupedMeals);
      }
    } catch (error) {
      console.error("Error loading diary entries:", error);
    }
  };

  // Refresh on focus
  useFocusEffect(
    useCallback(() => {
      loadNutritionData();
    }, [loadNutritionData])
  );

  // Pull to refresh
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await loadNutritionData();
    setRefreshing(false);
  }, [loadNutritionData]);

  // Navigate to food search for specific meal
  const handleAddFood = (
    mealType: "breakfast" | "lunch" | "dinner" | "snacks"
  ) => {
    navigation.navigate("FoodSearch", { mealType });
  };

  // Add water
  const handleAddWater = async (amount: number) => {
    try {
      const today = new Date();
      const dateStr = today.toISOString().split("T")[0];

      // Insert water intake into database
      const { error } = await supabase.from("water_intake").insert({
        user_id: userId,
        intake_date: dateStr,
        amount_ml: amount,
      });

      if (error) throw error;

      // Update local state optimistically
      setWaterData((prev) => ({
        ...prev,
        consumed: Math.min(prev.consumed + amount, prev.goal * 2),
      }));

      // Reload only water intake data to get accurate totals from database
      await loadWaterIntake(dateStr);

      // Update nutrition cache for today to reflect new water intake
      await nutritionSyncService.syncSingleDay(userId, dateStr);
    } catch (error) {
      console.error("Error adding water intake:", error);
      Alert.alert("Fehler", "Wasserzufuhr konnte nicht gespeichert werden.");
    }
  };

  // Toggle meal accordion
  const toggleMeal = (
    mealType: "breakfast" | "lunch" | "dinner" | "snacks"
  ) => {
    setExpandedMeals((prev) => ({
      ...prev,
      [mealType]: !prev[mealType],
    }));
  };

  // Delete a diary entry
  const handleDeleteEntry = async (entryId: string, foodName: string) => {
    Alert.alert(
      "Eintrag löschen",
      `Möchtest du "${foodName}" wirklich löschen?`,
      [
        {
          text: "Abbrechen",
          style: "cancel",
        },
        {
          text: "Löschen",
          style: "destructive",
          onPress: async () => {
            try {
              const { error } = await supabase
                .from("user_food_diary")
                .delete()
                .eq("id", entryId);

              if (error) throw error;

              // Reload data after deletion
              await loadNutritionData();
            } catch (error) {
              console.error("Error deleting entry:", error);
              Alert.alert("Fehler", "Eintrag konnte nicht gelöscht werden.");
            }
          },
        },
      ]
    );
  };

  // Update weight in profile and local state
  const updateWeight = async (newWeight: number) => {
    try {
      // Update local state immediately
      setWeightData((prev) => ({
        ...prev,
        current: newWeight,
      }));

      // Update profile in database
      const { error: profileError } = await supabase
        .from("profiles")
        .update({ weight: newWeight })
        .eq("id", userId);

      if (profileError) throw profileError;

      // Also update nutrition_goals if exists
      const { error: goalsError } = await supabase
        .from("nutrition_goals")
        .update({ current_weight: newWeight })
        .eq("user_id", userId)
        .eq("status", "active");

      // Don't throw error if no nutrition goals exist
      if (goalsError) {
        console.log("No active nutrition goals to update (this is OK)");
      }

      console.log("Weight updated successfully:", newWeight);
    } catch (error) {
      console.error("Error updating weight:", error);
      Alert.alert("Fehler", "Gewicht konnte nicht aktualisiert werden.");
    }
  };

  // Render a meal section with entries
  const renderMealSection = (
    mealType: "breakfast" | "lunch" | "dinner" | "snacks",
    emoji: string,
    title: string
  ) => {
    const meal = meals[mealType];
    const isExpanded = expandedMeals[mealType];
    const hasEntries = meal.entries.length > 0;

    return (
      <View key={mealType} style={styles.mealSection}>
        {/* Meal Header */}
        <TouchableOpacity
          style={styles.mealRow}
          onPress={() => toggleMeal(mealType)}
          activeOpacity={0.7}
        >
          <View style={styles.mealIcon}>
            <Text style={styles.mealEmoji}>{emoji}</Text>
          </View>
          <View style={styles.mealInfo}>
            <Text style={styles.mealName}>
              {title}
              {hasEntries && (
                <Text style={styles.entryCount}> ({meal.entries.length})</Text>
              )}
            </Text>
            <Text style={styles.mealCalories}>
              {meal.calories} / {meal.goal} kcal
            </Text>
          </View>
          {hasEntries && (
            <Ionicons
              name={isExpanded ? "chevron-up" : "chevron-down"}
              size={20}
              color={COLORS.textSecondary}
              style={styles.chevronIcon}
            />
          )}
          <TouchableOpacity
            style={styles.addButton}
            onPress={(e) => {
              e.stopPropagation();
              handleAddFood(mealType);
            }}
            activeOpacity={0.7}
          >
            <Ionicons name="add" size={24} color={COLORS.white} />
          </TouchableOpacity>
        </TouchableOpacity>

        {/* Meal Entries - Only show when expanded */}
        {hasEntries && isExpanded && (
          <View style={styles.entriesContainer}>
            {meal.entries.map((entry: any) => (
              <View key={entry.id} style={styles.entryRow}>
                <View style={styles.entryContent}>
                  <Text style={styles.entryName}>
                    {entry.food_items?.name || entry.food_name || "Unbekannt"}
                  </Text>
                  <Text style={styles.entryDetails}>
                    {entry.quantity}
                    {entry.unit} • {Math.round(entry.calories)} kcal
                  </Text>
                </View>
                {entry.food_items?.image_url && (
                  <Image
                    source={{ uri: entry.food_items.image_url }}
                    style={styles.entryImage}
                  />
                )}
                <TouchableOpacity
                  style={styles.entryMenuButton}
                  onPress={() =>
                    handleDeleteEntry(
                      entry.id,
                      entry.food_items?.name || entry.food_name || "Eintrag"
                    )
                  }
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Ionicons
                    name="ellipsis-vertical"
                    size={20}
                    color={COLORS.textSecondary}
                  />
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={["top"]}>
      {/* Header - Logo left, Profile right */}
      <AppHeader />

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Calorie Overview Card */}
        <View style={styles.calorieCard}>
          <View style={styles.calorieCardHeader}>
            <View>
              <Text style={styles.sectionTitle}>Heute</Text>
              <Text style={styles.dateText}>
                {new Date().toLocaleDateString("de-DE", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                })}
              </Text>
            </View>
            <TouchableOpacity
              style={styles.infoButton}
              onPress={() => setShowCalorieInfoModal(true)}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Ionicons
                name="information-circle-outline"
                size={28}
                color={COLORS.primary}
              />
            </TouchableOpacity>
          </View>

          {/* Main Calorie Circle */}
          <View style={styles.calorieCircle}>
            <CalorieRing
              consumed={calorieData.consumed}
              goal={calorieData.goal}
              size={180}
              strokeWidth={12}
            />
            <View style={styles.calorieCircleInner}>
              <Text style={styles.calorieMainNumber}>
                {calorieData.remaining.toLocaleString()}
              </Text>
              <Text style={styles.calorieLabel}>Übrig</Text>
            </View>
          </View>

          {/* Calorie Breakdown */}
          <View style={styles.calorieBreakdown}>
            <View style={styles.calorieItem}>
              <Ionicons name="restaurant" size={20} color={COLORS.success} />
              <Text style={styles.calorieItemNumber}>
                {calorieData.consumed}
              </Text>
              <Text style={styles.calorieItemLabel}>Gegessen</Text>
            </View>

            <View style={styles.calorieItem}>
              <Ionicons name="flame" size={20} color={COLORS.warning} />
              <Text style={styles.calorieItemNumber}>{calorieData.burned}</Text>
              <Text style={styles.calorieItemLabel}>Verbrannt</Text>
            </View>

            <View style={styles.calorieItem}>
              <Ionicons name="trophy" size={20} color={COLORS.primary} />
              <Text style={styles.calorieItemNumber}>{calorieData.goal}</Text>
              <Text style={styles.calorieItemLabel}>Ziel</Text>
            </View>
          </View>
        </View>

        {/* Macronutrients Progress */}
        <View style={styles.macrosCard}>
          <Text style={styles.cardTitle}>Makronährstoffe</Text>

          {/* Carbs */}
          <View style={styles.macroRow}>
            <View style={styles.macroInfo}>
              <Text style={styles.macroLabel}>Kohlenhydrate</Text>
              <Text style={styles.macroValue}>
                {macros.carbs.consumed} / {macros.carbs.goal} g
              </Text>
            </View>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${Math.min(
                      (macros.carbs.consumed / macros.carbs.goal) * 100,
                      100
                    )}%`,
                    backgroundColor: "#FFB84D",
                  },
                ]}
              />
            </View>
          </View>

          {/* Protein */}
          <View style={styles.macroRow}>
            <View style={styles.macroInfo}>
              <Text style={styles.macroLabel}>Eiweiß</Text>
              <Text style={styles.macroValue}>
                {macros.protein.consumed} / {macros.protein.goal} g
              </Text>
            </View>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${Math.min(
                      (macros.protein.consumed / macros.protein.goal) * 100,
                      100
                    )}%`,
                    backgroundColor: COLORS.success,
                  },
                ]}
              />
            </View>
          </View>

          {/* Fat */}
          <View style={styles.macroRow}>
            <View style={styles.macroInfo}>
              <Text style={styles.macroLabel}>Fett</Text>
              <Text style={styles.macroValue}>
                {macros.fat.consumed} / {macros.fat.goal} g
              </Text>
            </View>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${Math.min(
                      (macros.fat.consumed / macros.fat.goal) * 100,
                      100
                    )}%`,
                    backgroundColor: "#FF6B6B",
                  },
                ]}
              />
            </View>
          </View>

          {/* Sugar */}
          <View style={styles.macroRow}>
            <View style={styles.macroInfo}>
              <Text style={styles.macroLabel}>Zucker</Text>
              <Text style={styles.macroValue}>
                {Math.round(macros.sugar.consumed)} / {macros.sugar.goal} g
              </Text>
            </View>
            <View style={styles.progressBar}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${Math.min(
                      (macros.sugar.consumed / macros.sugar.goal) * 100,
                      100
                    )}%`,
                    backgroundColor: "#FF9F0A",
                  },
                ]}
              />
            </View>
          </View>
        </View>

        {/* Meals Section */}
        <View style={styles.mealsCard}>
          <Text style={styles.cardTitle}>Ernährung</Text>

          {renderMealSection("breakfast", "☕", "Frühstück")}
          {renderMealSection("lunch", "🍱", "Mittagessen")}
          {renderMealSection("dinner", "🍲", "Abendessen")}
          {renderMealSection("snacks", "🍎", "Snacks")}
        </View>

        {/* Water Tracker */}
        <View style={styles.waterCard}>
          <Text style={styles.cardTitle}>Wasserzähler</Text>
          <View style={styles.waterContent}>
            <Text style={styles.waterLabel}>
              Ziel: {waterData.goal / 1000} L
            </Text>
            <Text style={styles.waterValue}>
              {(waterData.consumed / 1000).toFixed(2)} l
            </Text>

            {/* Water Glasses */}
            <View style={styles.waterGlasses}>
              {[...Array(8)].map((_, index) => {
                const glassAmount = waterData.goal / 8;
                const filled = waterData.consumed >= glassAmount * (index + 1);
                return (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.waterGlass,
                      filled && styles.waterGlassFilled,
                    ]}
                    onPress={() => handleAddWater(250)}
                  >
                    <Ionicons
                      name={filled ? "water" : "water-outline"}
                      size={28}
                      color={filled ? COLORS.primary : COLORS.textTertiary}
                    />
                  </TouchableOpacity>
                );
              })}
            </View>

            <Text style={styles.waterFromFood}>
              + Wasser aus Lebensmitteln: 0 ml
            </Text>
          </View>
        </View>

        {/* Weight Tracker */}
        <View style={styles.weightCard}>
          <Text style={styles.cardTitle}>Körperwerte</Text>
          <View style={styles.weightContent}>
            <View style={styles.weightRow}>
              <View>
                <Text style={styles.weightLabel}>Gewicht</Text>
                <Text style={styles.weightValue}>
                  Ziel: {weightData.goal} kg
                </Text>
              </View>
              <View style={styles.weightCurrent}>
                <TouchableOpacity
                  onPress={() => {
                    const newWeight = Math.max(weightData.current - 0.1, 0);
                    updateWeight(Number(newWeight.toFixed(1)));
                  }}
                >
                  <Ionicons
                    name="remove-circle-outline"
                    size={28}
                    color={COLORS.textSecondary}
                  />
                </TouchableOpacity>
                <View>
                  <Text style={styles.weightCurrentNumber}>
                    {weightData.current.toFixed(1)} kg
                  </Text>
                </View>
                <TouchableOpacity
                  onPress={() => {
                    const newWeight = weightData.current + 0.1;
                    updateWeight(Number(newWeight.toFixed(1)));
                  }}
                >
                  <Ionicons
                    name="add-circle-outline"
                    size={28}
                    color={COLORS.textSecondary}
                  />
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </View>

        {/* Bottom Spacing */}
        <View style={{ height: 32 }} />
      </ScrollView>

      {/* Calorie Info Modal */}
      <Modal
        visible={showCalorieInfoModal}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowCalorieInfoModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Wie wird dein Kalorienziel berechnet?</Text>
              <TouchableOpacity
                onPress={() => setShowCalorieInfoModal(false)}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="close" size={28} color={COLORS.textSecondary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
              {nutritionGoalData ? (
                <>
                  <View style={styles.modalSection}>
                    <Text style={styles.modalSectionTitle}>📊 Deine Werte</Text>
                    <View style={styles.modalInfoRow}>
                      <Text style={styles.modalLabel}>Gewicht:</Text>
                      <Text style={styles.modalValue}>{nutritionGoalData.current_weight_kg} kg</Text>
                    </View>
                    <View style={styles.modalInfoRow}>
                      <Text style={styles.modalLabel}>Größe:</Text>
                      <Text style={styles.modalValue}>{nutritionGoalData.height_cm} cm</Text>
                    </View>
                    <View style={styles.modalInfoRow}>
                      <Text style={styles.modalLabel}>Alter:</Text>
                      <Text style={styles.modalValue}>{nutritionGoalData.age} Jahre</Text>
                    </View>
                    <View style={styles.modalInfoRow}>
                      <Text style={styles.modalLabel}>Geschlecht:</Text>
                      <Text style={styles.modalValue}>
                        {nutritionGoalData.gender === 'male' ? 'Männlich' : 'Weiblich'}
                      </Text>
                    </View>
                    {nutritionGoalData.target_weight_kg && (
                      <View style={styles.modalInfoRow}>
                        <Text style={styles.modalLabel}>Zielgewicht:</Text>
                        <Text style={styles.modalValue}>{nutritionGoalData.target_weight_kg} kg</Text>
                      </View>
                    )}
                  </View>

                  <View style={styles.modalSection}>
                    <Text style={styles.modalSectionTitle}>🔥 Grundumsatz (BMR)</Text>
                    <Text style={styles.modalDescription}>
                      Dein Körper verbraucht {Math.round(nutritionGoalData.bmr_mifflin)} kcal pro Tag im Ruhezustand.
                      {'\n\n'}
                      Berechnet mit der Mifflin-St Jeor Formel - dem wissenschaftlichen Goldstandard für BMR-Berechnungen.
                    </Text>
                  </View>

                  <View style={styles.modalSection}>
                    <Text style={styles.modalSectionTitle}>⚡ Gesamtumsatz (TDEE)</Text>
                    <Text style={styles.modalDescription}>
                      Mit deinem Aktivitätslevel (PAL {nutritionGoalData.pal_factor}) verbrauchst du täglich {Math.round(nutritionGoalData.tdee_calculated)} kcal.
                      {'\n\n'}
                      TDEE = BMR × PAL-Faktor{'\n'}
                      {Math.round(nutritionGoalData.bmr_mifflin)} × {nutritionGoalData.pal_factor} = {Math.round(nutritionGoalData.tdee_calculated)} kcal
                    </Text>
                  </View>

                  <View style={styles.modalSection}>
                    <Text style={styles.modalSectionTitle}>🎯 Dein Ziel</Text>
                    <Text style={styles.modalDescription}>
                      {nutritionGoalData.training_goal === 'weight_loss' &&
                        `Du möchtest abnehmen. Dein Kalorienziel liegt ${Math.abs(nutritionGoalData.calorie_adjustment)} kcal unter deinem Gesamtumsatz, um ein gesundes Defizit zu erreichen.`
                      }
                      {nutritionGoalData.training_goal === 'muscle_gain' &&
                        `Du möchtest Muskeln aufbauen. Dein Kalorienziel liegt ${nutritionGoalData.calorie_adjustment} kcal über deinem Gesamtumsatz für optimalen Muskelaufbau.`
                      }
                      {nutritionGoalData.training_goal === 'strength' &&
                        `Du trainierst für Kraft. Dein Kalorienziel ist auf deinen Gesamtumsatz abgestimmt für maximale Leistung.`
                      }
                      {nutritionGoalData.training_goal === 'endurance' &&
                        `Du trainierst für Ausdauer. Dein Kalorienziel berücksichtigt den erhöhten Energiebedarf.`
                      }
                      {nutritionGoalData.training_goal === 'general_fitness' &&
                        `Du trainierst für allgemeine Fitness. Dein Kalorienziel hält dein Gewicht stabil.`
                      }
                    </Text>
                    <View style={styles.modalHighlight}>
                      <Text style={styles.modalHighlightLabel}>Tägliches Kalorienziel</Text>
                      <Text style={styles.modalHighlightValue}>
                        {Math.round(nutritionGoalData.target_calories)} kcal
                      </Text>
                    </View>
                  </View>

                  <View style={styles.modalSection}>
                    <Text style={styles.modalSectionTitle}>🥗 Makronährstoffe</Text>
                    <View style={styles.modalInfoRow}>
                      <Text style={styles.modalLabel}>Protein:</Text>
                      <Text style={styles.modalValue}>
                        {Math.round(nutritionGoalData.protein_g_target)}g ({nutritionGoalData.protein_per_kg}g/kg)
                      </Text>
                    </View>
                    <View style={styles.modalInfoRow}>
                      <Text style={styles.modalLabel}>Kohlenhydrate:</Text>
                      <Text style={styles.modalValue}>
                        {Math.round(nutritionGoalData.carbs_g_target)}g ({Math.round(nutritionGoalData.carbs_percentage)}%)
                      </Text>
                    </View>
                    <View style={styles.modalInfoRow}>
                      <Text style={styles.modalLabel}>Fett:</Text>
                      <Text style={styles.modalValue}>
                        {Math.round(nutritionGoalData.fat_g_target)}g ({Math.round(nutritionGoalData.fat_percentage)}%)
                      </Text>
                    </View>
                  </View>

                  <View style={styles.modalFooter}>
                    <Text style={styles.modalFooterText}>
                      💡 Diese Werte basieren auf wissenschaftlichen Formeln und können nach 4 Wochen mit deinen echten Ergebnissen kalibriert werden.
                    </Text>
                  </View>
                </>
              ) : (
                <View style={styles.modalSection}>
                  <Text style={styles.modalDescription}>
                    Keine Ernährungsziele gefunden. Erstelle zuerst ein Ernährungsziel in den Einstellungen.
                  </Text>
                </View>
              )}
            </ScrollView>

            <TouchableOpacity
              style={styles.modalCloseButton}
              onPress={() => setShowCalorieInfoModal(false)}
            >
              <Text style={styles.modalCloseButtonText}>Schließen</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  contentContainer: {
    padding: SPACING.lg,
  },

  // Calorie Card Styles
  calorieCard: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.xl,
    marginBottom: SPACING.lg,
    ...SHADOWS.sm,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  dateText: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xl,
  },
  calorieCircle: {
    alignItems: "center",
    justifyContent: "center",
    marginVertical: SPACING.xl,
    position: "relative",
  },
  calorieCircleInner: {
    position: "absolute",
    width: 140,
    height: 140,
    alignItems: "center",
    justifyContent: "center",
  },
  calorieMainNumber: {
    fontSize: 42,
    fontWeight: "bold",
    color: COLORS.text,
  },
  calorieLabel: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginTop: SPACING.xs,
  },
  calorieBreakdown: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginTop: SPACING.xl,
  },
  calorieItem: {
    alignItems: "center",
  },
  calorieItemNumber: {
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.text,
    marginTop: SPACING.xs,
  },
  calorieItemLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: 2,
  },

  // Macros Card Styles
  macrosCard: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.xl,
    marginBottom: SPACING.lg,
    ...SHADOWS.sm,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.text,
    marginBottom: SPACING.lg,
  },
  macroRow: {
    marginBottom: SPACING.lg,
  },
  macroInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: SPACING.sm,
  },
  macroLabel: {
    fontSize: 15,
    color: COLORS.text,
    fontWeight: "500",
  },
  macroValue: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  progressBar: {
    height: 8,
    backgroundColor: COLORS.surfaceSecondary,
    borderRadius: BORDER_RADIUS.sm,
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: BORDER_RADIUS.sm,
  },

  // Meals Card Styles
  mealsCard: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.xl,
    marginBottom: SPACING.lg,
    ...SHADOWS.sm,
  },
  mealRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  mealIcon: {
    width: 52,
    height: 52,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.surfaceSecondary,
    alignItems: "center",
    justifyContent: "center",
    marginRight: SPACING.md,
  },
  mealEmoji: {
    fontSize: 28,
  },
  mealInfo: {
    flex: 1,
  },
  mealName: {
    fontSize: 16,
    fontWeight: "500",
    color: COLORS.text,
    marginBottom: 2,
  },
  mealCalories: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  entryCount: {
    fontSize: 14,
    color: COLORS.textSecondary,
    fontWeight: "400",
  },
  chevronIcon: {
    marginRight: SPACING.sm,
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.success,
    alignItems: "center",
    justifyContent: "center",
  },
  mealSection: {
    marginBottom: SPACING.md,
  },
  entriesContainer: {
    paddingLeft: SPACING.xl + 12,
    paddingTop: SPACING.sm,
    paddingBottom: SPACING.sm,
  },
  entryRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: SPACING.sm,
    backgroundColor: COLORS.surfaceSecondary,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md,
    marginBottom: SPACING.xs,
  },
  entryContent: {
    flex: 1,
  },
  entryName: {
    fontSize: 14,
    fontWeight: "500",
    color: COLORS.text,
    marginBottom: 2,
  },
  entryDetails: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  entryImage: {
    width: 40,
    height: 40,
    borderRadius: BORDER_RADIUS.sm,
    marginLeft: SPACING.sm,
  },
  entryMenuButton: {
    padding: SPACING.sm,
    marginLeft: SPACING.xs,
  },

  // Water Card Styles
  waterCard: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.xl,
    marginBottom: SPACING.lg,
    ...SHADOWS.sm,
  },
  waterContent: {
    alignItems: "center",
  },
  waterLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
  },
  waterValue: {
    fontSize: 32,
    fontWeight: "bold",
    color: COLORS.primary,
    marginBottom: SPACING.lg,
  },
  waterGlasses: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: SPACING.md,
    marginBottom: SPACING.md,
  },
  waterGlass: {
    width: 60,
    height: 60,
    borderRadius: BORDER_RADIUS.md,
    backgroundColor: COLORS.surfaceSecondary,
    alignItems: "center",
    justifyContent: "center",
  },
  waterGlassFilled: {
    backgroundColor: "#E3F2FD",
  },
  waterFromFood: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginTop: SPACING.sm,
  },

  // Weight Card Styles
  weightCard: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.xl,
    marginBottom: SPACING.lg,
    ...SHADOWS.sm,
  },
  weightContent: {},
  weightRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  weightLabel: {
    fontSize: 16,
    fontWeight: "500",
    color: COLORS.text,
    marginBottom: 4,
  },
  weightValue: {
    fontSize: 13,
    color: COLORS.textSecondary,
  },
  weightCurrent: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.md,
  },
  weightCurrentNumber: {
    fontSize: 24,
    fontWeight: "bold",
    color: COLORS.text,
  },

  // Calorie Card Header Styles
  calorieCardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: SPACING.xl,
  },
  infoButton: {
    padding: SPACING.xs,
  },

  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "center",
    alignItems: "center",
    padding: SPACING.lg,
  },
  modalContent: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    width: "100%",
    maxHeight: "85%",
    ...SHADOWS.md,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: SPACING.xl,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: COLORS.text,
    flex: 1,
    marginRight: SPACING.md,
  },
  modalScroll: {
    maxHeight: 500,
  },
  modalSection: {
    padding: SPACING.xl,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalSectionTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  modalDescription: {
    fontSize: 14,
    color: COLORS.textSecondary,
    lineHeight: 20,
  },
  modalInfoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: SPACING.sm,
  },
  modalLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  modalValue: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.text,
  },
  modalHighlight: {
    backgroundColor: COLORS.primary + "10",
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginTop: SPACING.md,
    alignItems: "center",
  },
  modalHighlightLabel: {
    fontSize: 12,
    color: COLORS.textSecondary,
    marginBottom: SPACING.xs,
  },
  modalHighlightValue: {
    fontSize: 28,
    fontWeight: "bold",
    color: COLORS.primary,
  },
  modalFooter: {
    padding: SPACING.xl,
    backgroundColor: COLORS.surfaceSecondary,
  },
  modalFooterText: {
    fontSize: 13,
    color: COLORS.textSecondary,
    lineHeight: 18,
    textAlign: "center",
  },
  modalCloseButton: {
    backgroundColor: COLORS.primary,
    padding: SPACING.md,
    margin: SPACING.lg,
    borderRadius: BORDER_RADIUS.md,
    alignItems: "center",
  },
  modalCloseButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: "600",
  },
});
