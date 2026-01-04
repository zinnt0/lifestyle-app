/**
 * Example Dashboard Screen
 *
 * Zeigt wie das NutritionOverviewWidget in einen Dashboard-Screen
 * integriert werden kann.
 */

import React from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NutritionOverviewWidget } from './NutritionOverviewWidget';
import { COLORS, SPACING } from '../ui/theme';

interface DashboardScreenProps {
  userId: string;
}

export function DashboardScreen({ userId }: DashboardScreenProps) {
  const navigation = useNavigation();
  const [refreshing, setRefreshing] = React.useState(false);

  const onRefresh = React.useCallback(() => {
    setRefreshing(true);
    // Reload wird automatisch durch re-mount des Widgets getriggert
    setTimeout(() => {
      setRefreshing(false);
    }, 1000);
  }, []);

  const handleQuickAddMeal = () => {
    // Navigation zu Food Search Screen
    navigation.navigate('NutritionStack', {
      screen: 'FoodSearch',
      params: { mealType: 'breakfast' },
    });
  };

  const handleTrackWeight = () => {
    // Navigation zu Weight Tracker oder öffnet Modal
    navigation.navigate('Profile', {
      screen: 'WeightTracker',
    });
  };

  const handleAdjustGoals = () => {
    // Navigation zu Nutrition Goals Setup
    navigation.navigate('NutritionStack', {
      screen: 'NutritionGoals',
    });
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {/* Nutrition Overview Widget */}
        <NutritionOverviewWidget
          userId={userId}
          onQuickAddMeal={handleQuickAddMeal}
          onTrackWeight={handleTrackWeight}
          onAdjustGoals={handleAdjustGoals}
        />

        {/* Weitere Dashboard Widgets können hier hinzugefügt werden */}
        {/* z.B. TrainingOverviewWidget, StepsWidget, etc. */}

        {/* Bottom Spacing */}
        <View style={{ height: SPACING.xxxl }} />
      </ScrollView>
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
});

/**
 * Alternative: Widget in Grid-Layout (Desktop/Tablet)
 */
export function DashboardGridLayout({ userId }: DashboardScreenProps) {
  const navigation = useNavigation();

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.gridContainer}
      >
        <View style={styles.gridRow}>
          {/* Left Column */}
          <View style={styles.gridColumn}>
            <NutritionOverviewWidget
              userId={userId}
              onQuickAddMeal={() => {}}
              onTrackWeight={() => {}}
              onAdjustGoals={() => {}}
            />
          </View>

          {/* Right Column */}
          <View style={styles.gridColumn}>
            {/* Andere Widgets hier */}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const gridStyles = StyleSheet.create({
  gridContainer: {
    padding: SPACING.lg,
  },
  gridRow: {
    flexDirection: 'row',
    gap: SPACING.lg,
  },
  gridColumn: {
    flex: 1,
  },
});
