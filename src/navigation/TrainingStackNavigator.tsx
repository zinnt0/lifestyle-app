/**
 * Training Stack Navigator
 *
 * Navigation stack for training section with all training-related screens.
 * Provides type-safe navigation with parameter definitions.
 */

import React from "react";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import type { NativeStackScreenProps } from "@react-navigation/native-stack";
import { Alert, TouchableOpacity, Text } from "react-native";

// Import Training Screens
import { TrainingDashboardScreen } from "@/screens/Training/TrainingDashboardScreen";
import { PlanConfigurationScreen } from "@/screens/Training/PlanConfigurationScreen";
import { GuidedPlanFlowScreen } from "@/screens/Training/GuidedPlanFlowScreen";
import { CustomPlanFlowScreen } from "@/screens/Training/CustomPlanFlowScreen";
import { PlanListScreen } from "@/screens/Training/PlanListScreen";
import { TrainingPlanDetailScreen } from "@/screens/Training/TrainingPlanDetailScreen";
import { WorkoutSessionScreen } from "@/screens/Training/WorkoutSessionScreen";
import WorkoutSummaryScreen from "@/screens/Training/WorkoutSummaryScreen";
import { OneRMInputScreen } from "@/screens/Training/OneRMInputScreen";

/**
 * Type-safe navigation params for Training Stack
 *
 * Defines parameters for each screen in the training flow
 */
export type TrainingStackParamList = {
  TrainingDashboard: undefined;
  PlanConfiguration: undefined;
  GuidedPlanFlow: undefined;
  CustomPlanFlow: undefined;
  PlanList: undefined;
  OneRMInput: { planTemplateId: string; requiredExerciseIds: string[] };
  TrainingPlanDetail: { planId: string };
  WorkoutSession: { sessionId: string };
  WorkoutSummary: { sessionId: string };
};

// Screen Props Types (for use in screen components)
export type TrainingDashboardScreenProps = NativeStackScreenProps<
  TrainingStackParamList,
  "TrainingDashboard"
>;

export type PlanConfigurationScreenProps = NativeStackScreenProps<
  TrainingStackParamList,
  "PlanConfiguration"
>;

export type GuidedPlanFlowScreenProps = NativeStackScreenProps<
  TrainingStackParamList,
  "GuidedPlanFlow"
>;

export type CustomPlanFlowScreenProps = NativeStackScreenProps<
  TrainingStackParamList,
  "CustomPlanFlow"
>;

export type TrainingPlanDetailScreenProps = NativeStackScreenProps<
  TrainingStackParamList,
  "TrainingPlanDetail"
>;

export type WorkoutSessionScreenProps = NativeStackScreenProps<
  TrainingStackParamList,
  "WorkoutSession"
>;

export type WorkoutSummaryScreenProps = NativeStackScreenProps<
  TrainingStackParamList,
  "WorkoutSummary"
>;

export type OneRMInputScreenProps = NativeStackScreenProps<
  TrainingStackParamList,
  "OneRMInput"
>;

export type PlanListScreenProps = NativeStackScreenProps<
  TrainingStackParamList,
  "PlanList"
>;

const Stack = createNativeStackNavigator<TrainingStackParamList>();

/**
 * TrainingStackNavigator Component
 *
 * Provides navigation between all training-related screens with:
 * - Smooth transitions
 * - Custom header configurations
 * - Special handling for workout session (prevents accidental exit)
 * - Type-safe navigation
 */
export const TrainingStackNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      initialRouteName="TrainingDashboard"
      screenOptions={{
        headerShown: true,
        animation: "slide_from_right",
        headerStyle: {
          backgroundColor: "#fff",
        },
        headerTintColor: "#333",
        headerTitleStyle: {
          fontWeight: "600",
          fontSize: 18,
        },
      }}
    >
      <Stack.Screen
        name="TrainingDashboard"
        component={TrainingDashboardScreen}
        options={{
          headerShown: false,
        }}
      />

      <Stack.Screen
        name="PlanConfiguration"
        component={PlanConfigurationScreen}
        options={{
          title: "Plan konfigurieren",
        }}
      />

      <Stack.Screen
        name="GuidedPlanFlow"
        component={GuidedPlanFlowScreen}
        options={{
          title: "Plan erstellen",
        }}
      />

      <Stack.Screen
        name="CustomPlanFlow"
        component={CustomPlanFlowScreen}
        options={{
          title: "Eigener Plan",
        }}
      />

      <Stack.Screen
        name="PlanList"
        component={PlanListScreen}
        options={{
          title: "Alle Pläne",
        }}
      />

      <Stack.Screen
        name="OneRMInput"
        component={OneRMInputScreen}
        options={{
          title: "1RM-Werte eingeben",
        }}
      />

      <Stack.Screen
        name="TrainingPlanDetail"
        component={TrainingPlanDetailScreen}
        options={{
          title: "Trainingsplan",
        }}
      />

      <Stack.Screen
        name="WorkoutSession"
        component={WorkoutSessionScreen}
        options={({ navigation }) => ({
          title: "Workout",
          // Prevent swipe-back during workout
          gestureEnabled: false,
          // Custom close button with confirmation
          headerRight: () => (
            <TouchableOpacity
              onPress={() => {
                Alert.alert(
                  "Workout beenden?",
                  "Möchtest du das Workout wirklich beenden? Dein Fortschritt wird gespeichert.",
                  [
                    { text: "Abbrechen", style: "cancel" },
                    {
                      text: "Beenden",
                      style: "destructive",
                      onPress: () => navigation.goBack(),
                    },
                  ]
                );
              }}
              style={{ paddingRight: 16 }}
            >
              <Text style={{ fontSize: 18, color: "#333" }}>✕</Text>
            </TouchableOpacity>
          ),
        })}
      />

      <Stack.Screen
        name="WorkoutSummary"
        component={WorkoutSummaryScreen}
        options={{
          title: "Zusammenfassung",
          // Prevent going back to workout
          gestureEnabled: false,
          headerLeft: () => null,
        }}
      />
    </Stack.Navigator>
  );
};
