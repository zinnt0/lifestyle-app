/**
 * Example: Nutrition FAQ Screen
 *
 * Shows how to integrate the NutritionFAQ component into a screen
 */

import React from 'react';
import { View, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NutritionFAQ } from './NutritionFAQ';
import { AppHeader } from '../ui/AppHeader';
import { COLORS } from '../ui/theme';

export function NutritionFAQScreen() {
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
      <AppHeader title="FAQ - Häufige Fragen" showBackButton />
      <NutritionFAQ onFeedback={handleFeedback} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
});
