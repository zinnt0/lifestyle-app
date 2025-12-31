/**
 * useTrainingNavigation Hook
 *
 * Type-safe navigation hook for training screens.
 * Provides autocomplete and type checking for navigation actions.
 *
 * @example
 * ```tsx
 * const navigation = useTrainingNavigation();
 *
 * // Navigate to plan detail with required planId parameter
 * navigation.navigate('TrainingPlanDetail', { planId: '123' });
 *
 * // Navigate to workout session
 * navigation.navigate('WorkoutSession', { sessionId: 'abc' });
 *
 * // Go back
 * navigation.goBack();
 * ```
 */

import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import type { TrainingStackParamList } from "@/navigation/TrainingStackNavigator";

type TrainingNavigationProp = NativeStackNavigationProp<TrainingStackParamList>;

/**
 * Hook for type-safe navigation within the Training stack
 *
 * @returns Navigation object with type-safe methods
 */
export const useTrainingNavigation = () => {
  return useNavigation<TrainingNavigationProp>();
};
