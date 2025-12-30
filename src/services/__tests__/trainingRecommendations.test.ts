/**
 * Manual Test Script for Training Recommendations
 *
 * This script tests the integration of the scoring system
 * with the trainingService to ensure recommendations work correctly.
 */

import { trainingService } from '../trainingService';
import { supabase } from '@/lib/supabase';
import { Profile } from '../profile.service';
import { PlanTemplate } from '@/types/training.types';

// ============================================================================
// Test Data
// ============================================================================

const TEST_USER_ID = 'test-user-123';

const mockProfile: Profile = {
  id: TEST_USER_ID,
  age: 25,
  weight: 75,
  height: 180,
  gender: 'male',
  fitness_level: 'beginner',
  training_experience_months: 2,
  available_training_days: 3,
  primary_goal: 'hypertrophy',
  sleep_hours_avg: 7,
  stress_level: 5,
  has_gym_access: true,
  home_equipment: [],
  onboarding_completed: true,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

const mockTemplates: PlanTemplate[] = [
  {
    id: 'template-1',
    name: 'Beginner Fullbody 3x',
    name_de: 'Anfänger Ganzkörper 3x',
    description: 'Perfect for beginners training 3 days per week',
    description_de: 'Perfekt für Anfänger mit 3 Trainingstagen pro Woche',
    fitness_level: 'beginner',
    training_experience_months: 3,
    days_per_week: 3,
    primary_goal: 'hypertrophy',
    plan_type: 'fullbody',
    weeks_duration: 8,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'template-2',
    name: 'Intermediate PPL 6x',
    name_de: 'Fortgeschritten PPL 6x',
    description: 'Push/Pull/Legs for intermediate lifters',
    description_de: 'Push/Pull/Legs für Fortgeschrittene',
    fitness_level: 'intermediate',
    training_experience_months: 12,
    days_per_week: 6,
    primary_goal: 'hypertrophy',
    plan_type: 'ppl',
    weeks_duration: 12,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'template-3',
    name: 'Beginner Upper/Lower 4x',
    name_de: 'Anfänger Oberkörper/Unterkörper 4x',
    description: 'Upper/Lower split for beginners',
    description_de: 'Oberkörper/Unterkörper Split für Anfänger',
    fitness_level: 'beginner',
    training_experience_months: 6,
    days_per_week: 4,
    primary_goal: 'strength',
    plan_type: 'upper_lower',
    weeks_duration: 8,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'template-4',
    name: 'Advanced Strength 5x',
    name_de: 'Fortgeschritten Kraft 5x',
    description: 'Advanced strength program',
    description_de: 'Fortgeschrittenes Kraftprogramm',
    fitness_level: 'advanced',
    training_experience_months: 36,
    days_per_week: 5,
    primary_goal: 'strength',
    plan_type: 'custom',
    weeks_duration: 16,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'template-5',
    name: 'Beginner Fullbody 2x',
    name_de: 'Anfänger Ganzkörper 2x',
    description: 'Minimal frequency fullbody',
    description_de: 'Minimale Frequenz Ganzkörper',
    fitness_level: 'beginner',
    training_experience_months: 1,
    days_per_week: 2,
    primary_goal: 'general_fitness',
    plan_type: 'fullbody',
    weeks_duration: 8,
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

// ============================================================================
// Mock Supabase
// ============================================================================

// Mock getProfile to return our test profile
jest.mock('@/services/profile.service', () => ({
  getProfile: jest.fn().mockResolvedValue({
    profile: mockProfile,
    error: null,
  }),
}));

// Mock supabase to return our test templates
jest.mock('@/lib/supabase', () => ({
  supabase: {
    from: jest.fn(() => ({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          data: mockTemplates,
          error: null,
        })),
      })),
    })),
  },
}));

// ============================================================================
// Tests
// ============================================================================

describe('Training Recommendations Integration', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('getRecommendations should return top 3 recommendations for beginner user', async () => {
    const recommendations = await trainingService.getRecommendations(TEST_USER_ID, 3);

    // Should return 3 recommendations
    expect(recommendations).toHaveLength(3);

    // First recommendation should be the best match
    const best = recommendations[0];
    expect(best.template.fitness_level).toBe('beginner');
    expect(best.template.days_per_week).toBe(3);
    expect(best.template.primary_goal).toBe('hypertrophy');

    // Should have score breakdown
    expect(best.score).toBeGreaterThan(0);
    expect(best.scoreBreakdown).toBeDefined();
    expect(best.scoreBreakdown.fitnessLevelScore).toBeGreaterThan(0);

    // Log results
    console.log('\n=== Top 3 Recommendations for Beginner User ===');
    recommendations.forEach((rec, idx) => {
      console.log(`\n${idx + 1}. ${rec.template.name_de || rec.template.name}`);
      console.log(`   Score: ${rec.score.toFixed(2)}`);
      console.log(`   Breakdown:`);
      console.log(`   - Fitness Level: ${rec.scoreBreakdown.fitnessLevelScore.toFixed(2)}`);
      console.log(`   - Experience: ${rec.scoreBreakdown.experienceScore.toFixed(2)}`);
      console.log(`   - Training Days: ${rec.scoreBreakdown.trainingDaysScore.toFixed(2)}`);
      console.log(`   - Goal Match: ${rec.scoreBreakdown.goalMatchScore.toFixed(2)}`);
      console.log(`   - Is Complete: ${rec.isComplete ? 'Yes' : 'No'}`);
    });
  });

  test('getBestPlanRecommendation should return single best recommendation', async () => {
    const best = await trainingService.getBestPlanRecommendation(TEST_USER_ID);

    expect(best).not.toBeNull();
    expect(best?.template.id).toBe('template-1'); // Should be the perfect match
    expect(best?.score).toBeGreaterThan(0);

    console.log('\n=== Best Single Recommendation ===');
    console.log(`Name: ${best?.template.name_de || best?.template.name}`);
    console.log(`Score: ${best?.score.toFixed(2)}`);
    console.log(`Match Reason: ${best?.matchReason}`);
  });

  test('Complete vs Incomplete programs are properly categorized', async () => {
    const recommendations = await trainingService.getRecommendations(TEST_USER_ID, 5);

    console.log('\n=== Complete vs Incomplete Classification ===');
    recommendations.forEach((rec) => {
      const status = rec.isComplete ? '✓ COMPLETE' : '✗ INCOMPLETE';
      console.log(`${status}: ${rec.template.name}`);
      console.log(`  Fitness Level: ${rec.scoreBreakdown.fitnessLevelScore.toFixed(2)}/100`);
      console.log(`  Experience: ${rec.scoreBreakdown.experienceScore.toFixed(2)}/100`);
      console.log(`  Training Days: ${rec.scoreBreakdown.trainingDaysScore.toFixed(2)}/100`);
      console.log(`  Goal: ${rec.scoreBreakdown.goalMatchScore.toFixed(2)}/100`);
      console.log();
    });

    // Complete programs should have high scores in all categories
    const completePrograms = recommendations.filter(r => r.isComplete);
    completePrograms.forEach(program => {
      expect(program.scoreBreakdown.fitnessLevelScore).toBeGreaterThan(70);
      expect(program.scoreBreakdown.experienceScore).toBeGreaterThan(70);
      expect(program.scoreBreakdown.trainingDaysScore).toBeGreaterThan(70);
    });
  });

  test('Different user profiles get different recommendations', async () => {
    // Mock advanced user
    const advancedProfile: Profile = {
      ...mockProfile,
      fitness_level: 'advanced',
      training_experience_months: 36,
      available_training_days: 5,
      primary_goal: 'strength',
    };

    // Update mock
    const { getProfile } = require('@/services/profile.service');
    getProfile.mockResolvedValueOnce({
      profile: advancedProfile,
      error: null,
    });

    const advancedRecs = await trainingService.getRecommendations(TEST_USER_ID, 3);

    console.log('\n=== Advanced User Recommendations ===');
    advancedRecs.forEach((rec, idx) => {
      console.log(`${idx + 1}. ${rec.template.name_de || rec.template.name}`);
      console.log(`   Score: ${rec.score.toFixed(2)}`);
      console.log(`   Fitness Level: ${rec.template.fitness_level}`);
    });

    // Advanced user should get different top recommendation
    expect(advancedRecs[0].template.fitness_level).toBe('advanced');
  });

  test('Error handling when profile not found', async () => {
    const { getProfile } = require('@/services/profile.service');
    getProfile.mockResolvedValueOnce({
      profile: null,
      error: { message: 'Profile not found' },
    });

    await expect(
      trainingService.getRecommendations(TEST_USER_ID, 3)
    ).rejects.toThrow('Profil konnte nicht geladen werden');
  });

  test('Returns empty array when no templates available', async () => {
    const supabaseMock = require('@/lib/supabase').supabase;
    supabaseMock.from.mockReturnValueOnce({
      select: jest.fn(() => ({
        eq: jest.fn(() => ({
          data: [],
          error: null,
        })),
      })),
    });

    const recommendations = await trainingService.getRecommendations(TEST_USER_ID, 3);

    expect(recommendations).toEqual([]);
  });
});

// ============================================================================
// Manual Test Runner
// ============================================================================

/**
 * Run this manually to test the integration with real data
 *
 * Usage:
 * 1. Replace TEST_USER_ID with a real user ID from your database
 * 2. Run: npx ts-node src/services/__tests__/trainingRecommendations.test.ts
 */
export async function runManualTest(userId: string) {
  console.log('='.repeat(60));
  console.log('MANUAL INTEGRATION TEST: Training Recommendations');
  console.log('='.repeat(60));

  try {
    // Test 1: Get top 3 recommendations
    console.log('\n1. Getting top 3 recommendations...');
    const recommendations = await trainingService.getRecommendations(userId, 3);

    console.log(`\n✓ Found ${recommendations.length} recommendations\n`);

    recommendations.forEach((rec, idx) => {
      console.log(`${idx + 1}. ${rec.template.name_de || rec.template.name}`);
      console.log(`   ID: ${rec.template.id}`);
      console.log(`   Score: ${rec.score.toFixed(2)}/100`);
      console.log(`   Complete: ${rec.isComplete ? 'Yes' : 'No'}`);
      console.log(`   Match Reason: ${rec.matchReason}`);
      console.log(`   Score Breakdown:`);
      console.log(`     - Fitness Level: ${rec.scoreBreakdown.fitnessLevelScore.toFixed(2)}/100`);
      console.log(`     - Experience: ${rec.scoreBreakdown.experienceScore.toFixed(2)}/100`);
      console.log(`     - Training Days: ${rec.scoreBreakdown.trainingDaysScore.toFixed(2)}/100`);
      console.log(`     - Goal Match: ${rec.scoreBreakdown.goalMatchScore.toFixed(2)}/100`);
      console.log();
    });

    // Test 2: Get best single recommendation
    console.log('\n2. Getting best single recommendation...');
    const best = await trainingService.getBestPlanRecommendation(userId);

    if (best) {
      console.log(`\n✓ Best recommendation: ${best.template.name_de || best.template.name}`);
      console.log(`   Score: ${best.score.toFixed(2)}/100`);
      console.log(`   Complete: ${best.isComplete ? 'Yes' : 'No'}`);
    } else {
      console.log('\n✗ No recommendation found');
    }

    console.log('\n' + '='.repeat(60));
    console.log('✓ Manual test completed successfully!');
    console.log('='.repeat(60));

  } catch (error) {
    console.error('\n✗ Test failed:', error);
    throw error;
  }
}
