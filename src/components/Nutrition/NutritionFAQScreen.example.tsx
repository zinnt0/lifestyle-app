/**
 * Example: Nutrition FAQ Screen
 *
 * Shows how to integrate the NutritionFAQ component into a screen
 */

import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
// @ts-ignore - Type definitions issue with react-native-safe-area-context
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { NutritionFAQ } from './NutritionFAQ';
import { COLORS, SPACING } from '../ui/theme';

export function NutritionFAQScreen() {
  const navigation = useNavigation();

  // Handle feedback (optional - track analytics)
  const handleFeedback = async (questionId: string, helpful: boolean) => {
    // Track analytics
    console.log(`FAQ Feedback: ${questionId} - ${helpful ? 'Helpful' : 'Not Helpful'}`);

    // Could send to analytics service:
    // await analytics.track('faq_feedback', {
    //   question_id: questionId,
    //   helpful: helpful,
    //   timestamp: new Date().toISOString(),
    // });
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Simple Header with Back Button */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>FAQ - Häufige Fragen</Text>
        <View style={styles.headerSpacer} />
      </View>
      <NutritionFAQ onFeedback={handleFeedback} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  backButton: {
    padding: SPACING.xs,
  },
  headerTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: '600',
    color: COLORS.text,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 32,
  },
});
