/**
 * Test Screen for Plan Recommendation Cards
 *
 * Demonstrates all recommendation states:
 * - Optimal match
 * - Good match
 * - Acceptable match
 * - Complete vs Incomplete programs
 * - Volume modifications for advanced users
 */

import React, { useState, useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { PlanRecommendationList } from '@/components/training/PlanRecommendationCard';
import type { PlanRecommendation, UserProfile } from '@/utils/planRecommendationScoring';
import { getTopRecommendations } from '@/utils/planRecommendationScoring';
import type { PlanTemplate } from '@/types/training.types';

/**
 * Mock Plan Templates for Testing
 */
const MOCK_TEMPLATES: PlanTemplate[] = [
  {
    id: '1',
    name: 'Starting Strength',
    name_de: 'Starting Strength',
    description: 'Classic beginner strength program focusing on compound movements',
    description_de: 'Klassisches Anfänger-Kraftprogramm mit Fokus auf Grundübungen',
    plan_type: 'starting_strength',
    fitness_level: 'beginner',
    primary_goal: 'strength',
    days_per_week: 3,
    min_training_experience_months: 0,
    estimated_duration_weeks: 12,
    difficulty_rating: 2,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '2',
    name: 'StrongLifts 5x5',
    name_de: 'StrongLifts 5x5',
    description: 'Simple and effective 5x5 strength program',
    description_de: 'Einfaches und effektives 5x5 Kraftprogramm',
    plan_type: 'stronglifts_5x5',
    fitness_level: 'beginner',
    primary_goal: 'strength',
    days_per_week: 3,
    min_training_experience_months: 0,
    estimated_duration_weeks: 12,
    difficulty_rating: 2,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '3',
    name: 'Full Body 3x',
    name_de: 'Ganzkörper 3x',
    description: 'Full body workout 3 times per week for beginners',
    description_de: 'Ganzkörper-Training 3x pro Woche für Anfänger',
    plan_type: 'full_body_3x',
    fitness_level: 'beginner',
    primary_goal: 'general_fitness',
    days_per_week: 3,
    min_training_experience_months: 0,
    estimated_duration_weeks: 8,
    difficulty_rating: 1,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '4',
    name: 'PHUL',
    name_de: 'PHUL (Power Hypertrophy)',
    description: 'Power Hypertrophy Upper Lower - 4 days per week',
    description_de: 'Power Hypertrophy Upper Lower - 4 Tage pro Woche',
    plan_type: 'phul',
    fitness_level: 'intermediate',
    primary_goal: 'both',
    days_per_week: 4,
    min_training_experience_months: 12,
    estimated_duration_weeks: 16,
    difficulty_rating: 3,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '5',
    name: 'Upper/Lower Hypertrophy',
    name_de: 'Oberkörper/Unterkörper Hypertrophie',
    description: 'Upper/Lower split focused on muscle growth',
    description_de: 'Oberkörper/Unterkörper Split mit Fokus auf Muskelaufbau',
    plan_type: 'upper_lower_hypertrophy',
    fitness_level: 'intermediate',
    primary_goal: 'hypertrophy',
    days_per_week: 4,
    min_training_experience_months: 12,
    estimated_duration_weeks: 12,
    difficulty_rating: 3,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '6',
    name: 'PPL 6x Intermediate',
    name_de: 'Push/Pull/Legs 6x Intermediär',
    description: 'Push/Pull/Legs split 6 days per week',
    description_de: 'Push/Pull/Legs Split 6 Tage pro Woche',
    plan_type: 'ppl_6x_intermediate',
    fitness_level: 'intermediate',
    primary_goal: 'hypertrophy',
    days_per_week: 6,
    min_training_experience_months: 18,
    estimated_duration_weeks: 12,
    difficulty_rating: 4,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '7',
    name: '5/3/1 Intermediate',
    name_de: '5/3/1 Intermediär',
    description: 'Wendler 5/3/1 program for intermediate lifters',
    description_de: 'Wendler 5/3/1 Programm für Fortgeschrittene',
    plan_type: '531_intermediate',
    fitness_level: 'intermediate',
    primary_goal: 'strength',
    days_per_week: 4,
    min_training_experience_months: 12,
    estimated_duration_weeks: 16,
    difficulty_rating: 3,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: '8',
    name: '5/3/1 Advanced',
    name_de: '5/3/1 Fortgeschritten',
    description: 'Advanced 5/3/1 variation with accessories',
    description_de: 'Fortgeschrittene 5/3/1 Variante mit Zusatzübungen',
    plan_type: '531_advanced',
    fitness_level: 'advanced',
    primary_goal: 'strength',
    days_per_week: 4,
    min_training_experience_months: 36,
    estimated_duration_weeks: 16,
    difficulty_rating: 5,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

/**
 * Test User Profiles
 */
const TEST_PROFILES: Record<string, UserProfile> = {
  beginnerStrength: {
    fitness_level: 'beginner',
    training_experience_months: 2,
    available_training_days: 3,
    primary_goal: 'strength',
  },
  intermediateHypertrophy: {
    fitness_level: 'intermediate',
    training_experience_months: 18,
    available_training_days: 4,
    primary_goal: 'hypertrophy',
  },
  intermediate6Days: {
    fitness_level: 'intermediate',
    training_experience_months: 24,
    available_training_days: 6,
    primary_goal: 'both',
  },
  advancedStrength: {
    fitness_level: 'advanced',
    training_experience_months: 48,
    available_training_days: 4,
    primary_goal: 'strength',
  },
};

export default function TestRecommendationsScreen() {
  const [recommendations, setRecommendations] = useState<PlanRecommendation[]>([]);
  const [currentProfile, setCurrentProfile] = useState<string>('intermediateHypertrophy');

  useEffect(() => {
    // Get recommendations for current test profile
    const profile = TEST_PROFILES[currentProfile];
    const recs = getTopRecommendations(profile, MOCK_TEMPLATES, 5);
    setRecommendations(recs);
  }, [currentProfile]);

  const handleSelectPlan = (recommendation: PlanRecommendation) => {
    console.log('Selected plan:', recommendation.template.name);
    // In a real app, navigate to plan creation
    alert(`Plan selected: ${recommendation.template.name_de}\nScore: ${Math.round(recommendation.totalScore)}/100`);
  };

  return (
    <View style={styles.container}>
      <PlanRecommendationList
        recommendations={recommendations}
        onSelectPlan={handleSelectPlan}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
});
