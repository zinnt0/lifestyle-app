/**
 * Plan Recommendation Scoring System Test File
 *
 * Tests all scoring functions to ensure they work correctly.
 *
 * Ausführung:
 * npm run test:scoring
 */

import {
  calculateExperienceMatch,
  calculateFrequencyMatch,
  calculateGoalMatch,
  calculateVolumeMatch,
  adjustScoreByMonths,
  scorePlanTemplate,
  getTopRecommendations,
  getBestRecommendation,
  formatScoreBreakdown,
  getRecommendationBadge,
  type UserProfile,
  type PlanRecommendation,
  type ScoreBreakdown,
} from '../planRecommendationScoring';
import type { PlanTemplate } from '@/types/training.types';

// Farben für Console Output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

const log = {
  success: (msg: string) => console.log(`${colors.green}✓ ${msg}${colors.reset}`),
  error: (msg: string) => console.log(`${colors.red}✗ ${msg}${colors.reset}`),
  info: (msg: string) => console.log(`${colors.cyan}ℹ ${msg}${colors.reset}`),
  test: (msg: string) => console.log(`${colors.blue}\n▶ ${msg}${colors.reset}`),
};

let totalTests = 0;
let passedTests = 0;

function assert(condition: boolean, message: string) {
  totalTests++;
  if (condition) {
    passedTests++;
    log.success(message);
  } else {
    log.error(message);
  }
}

function assertEqual(actual: any, expected: any, message: string) {
  assert(actual === expected, `${message} (expected: ${expected}, got: ${actual})`);
}

function assertRange(value: number, min: number, max: number, message: string) {
  assert(
    value >= min && value <= max,
    `${message} (expected: ${min}-${max}, got: ${value})`
  );
}

/**
 * Experience Match Tests
 */
function testCalculateExperienceMatch() {
  log.test('calculateExperienceMatch Tests');

  // Exact match
  assertEqual(
    calculateExperienceMatch('beginner', 3, 'beginner', 0),
    100,
    'Exact beginner match returns 100'
  );
  assertEqual(
    calculateExperienceMatch('intermediate', 18, 'intermediate', 12),
    100,
    'Exact intermediate match returns 100'
  );
  assertEqual(
    calculateExperienceMatch('advanced', 48, 'advanced', 36),
    100,
    'Exact advanced match returns 100'
  );

  // One level apart - user below program level
  assertEqual(
    calculateExperienceMatch('beginner', 11, 'intermediate', 12),
    80,
    'Beginner close to intermediate (11 months) returns 80'
  );
  assertEqual(
    calculateExperienceMatch('beginner', 6, 'intermediate', 12),
    50,
    'Beginner not ready for intermediate (6 months) returns 50'
  );
  assertEqual(
    calculateExperienceMatch('intermediate', 32, 'advanced', 36),
    80,
    'Intermediate close to advanced (32 months) returns 80'
  );

  // One level apart - user above program level
  assertEqual(
    calculateExperienceMatch('intermediate', 18, 'beginner', 0),
    60,
    'Intermediate doing beginner program returns 60'
  );

  // Two levels apart
  assertEqual(
    calculateExperienceMatch('beginner', 3, 'advanced', 36),
    20,
    'Beginner doing advanced program returns 20'
  );
  assertEqual(
    calculateExperienceMatch('advanced', 48, 'beginner', 0),
    20,
    'Advanced doing beginner program returns 20'
  );
}

/**
 * Frequency Match Tests
 */
function testCalculateFrequencyMatch() {
  log.test('calculateFrequencyMatch Tests');

  // Perfect match
  assertEqual(calculateFrequencyMatch(3, 3), 100, 'Perfect match returns 100');
  assertEqual(calculateFrequencyMatch(6, 6), 100, 'Perfect match 6 days returns 100');

  // 1 day difference
  assertEqual(calculateFrequencyMatch(3, 4), 80, '1 day off (3 vs 4) returns 80');
  assertEqual(calculateFrequencyMatch(5, 4), 80, '1 day off (5 vs 4) returns 80');

  // 2 days difference
  assertEqual(calculateFrequencyMatch(3, 5), 60, '2 days off returns 60');
  assertEqual(calculateFrequencyMatch(6, 4), 60, '2 days off returns 60');

  // 3 days difference
  assertEqual(calculateFrequencyMatch(3, 6), 40, '3 days off returns 40');

  // 4+ days difference
  assertEqual(calculateFrequencyMatch(2, 6), 20, '4 days off returns 20');
  assertEqual(calculateFrequencyMatch(1, 6), 20, '5 days off returns 20');
}

/**
 * Goal Match Tests
 */
function testCalculateGoalMatch() {
  log.test('calculateGoalMatch Tests');

  // Exact matches
  assertEqual(calculateGoalMatch('strength', 'strength'), 100, 'Strength match returns 100');
  assertEqual(
    calculateGoalMatch('hypertrophy', 'hypertrophy'),
    100,
    'Hypertrophy match returns 100'
  );
  assertEqual(calculateGoalMatch('both', 'both'), 100, 'Both match returns 100');

  // Compatible goals
  assertEqual(
    calculateGoalMatch('strength', 'powerlifting'),
    90,
    'Strength + powerlifting returns 90'
  );
  assertEqual(calculateGoalMatch('strength', 'both'), 80, 'Strength + both returns 80');
  assertEqual(
    calculateGoalMatch('hypertrophy', 'both'),
    80,
    'Hypertrophy + both returns 80'
  );

  // Less compatible goals
  assertEqual(
    calculateGoalMatch('strength', 'hypertrophy'),
    40,
    'Strength + hypertrophy returns 40'
  );
  assertEqual(
    calculateGoalMatch('hypertrophy', 'strength'),
    40,
    'Hypertrophy + strength returns 40'
  );

  // Incompatible goals
  assertEqual(
    calculateGoalMatch('strength', 'general_fitness'),
    50,
    'Strength + general_fitness returns 50'
  );
  assertEqual(
    calculateGoalMatch('hypertrophy', 'powerlifting'),
    30,
    'Hypertrophy + powerlifting returns 30'
  );

  // Default fallback for unknown goals
  assertEqual(
    calculateGoalMatch('unknown' as any, 'strength'),
    20,
    'Unknown goal returns 20'
  );
}

/**
 * Volume Match Tests
 */
function testCalculateVolumeMatch() {
  log.test('calculateVolumeMatch Tests');

  // Beginner ideal range (4-6 exercises)
  assertEqual(
    calculateVolumeMatch('beginner', 15, 3),
    100,
    'Beginner with 5 exercises per workout returns 100'
  );
  assertEqual(
    calculateVolumeMatch('beginner', 18, 3),
    100,
    'Beginner with 6 exercises per workout returns 100'
  );

  // Intermediate ideal range (5-7 exercises)
  assertEqual(
    calculateVolumeMatch('intermediate', 15, 3),
    100,
    'Intermediate with 5 exercises per workout returns 100'
  );
  assertEqual(
    calculateVolumeMatch('intermediate', 21, 3),
    100,
    'Intermediate with 7 exercises per workout returns 100'
  );

  // Advanced ideal range (6-9 exercises)
  assertEqual(
    calculateVolumeMatch('advanced', 24, 4),
    100,
    'Advanced with 6 exercises per workout returns 100'
  );
  assertEqual(
    calculateVolumeMatch('advanced', 36, 4),
    100,
    'Advanced with 9 exercises per workout returns 100'
  );

  // Slightly outside ideal range
  assertEqual(
    calculateVolumeMatch('beginner', 9, 3),
    80,
    'Beginner slightly below ideal returns 80'
  );
  assertEqual(
    calculateVolumeMatch('intermediate', 24, 3),
    80,
    'Intermediate slightly above ideal returns 80'
  );

  // Further outside ideal range
  assertEqual(
    calculateVolumeMatch('beginner', 6, 3),
    60,
    'Beginner well below ideal returns 60'
  );
}

/**
 * Adjust Score by Months Tests
 */
function testAdjustScoreByMonths() {
  log.test('adjustScoreByMonths Tests');

  // Bonus for users close to intermediate
  assertEqual(
    adjustScoreByMonths(80, 11, 'intermediate'),
    88,
    'User with 11 months gets 10% bonus for intermediate program'
  );

  // Bonus for users close to advanced
  assertEqual(
    adjustScoreByMonths(80, 32, 'advanced'),
    88,
    'User with 32 months gets 10% bonus for advanced program'
  );

  // No bonus - already at level
  assertEqual(
    adjustScoreByMonths(80, 3, 'beginner'),
    80,
    'Beginner with 3 months gets no bonus'
  );
  assertEqual(
    adjustScoreByMonths(80, 24, 'intermediate'),
    80,
    'Intermediate with 24 months gets no bonus'
  );

  // No bonus - not close enough to next level
  assertEqual(
    adjustScoreByMonths(80, 8, 'intermediate'),
    80,
    'User with 8 months gets no bonus for intermediate program'
  );
}

/**
 * Score Plan Template Tests
 */
function testScorePlanTemplate() {
  log.test('scorePlanTemplate Tests');

  // Mock user profile
  const beginnerUser: UserProfile = {
    fitness_level: 'beginner',
    training_experience_months: 3,
    available_training_days: 3,
    primary_goal: 'both',
  };

  // Mock plan template
  const mockTemplate: PlanTemplate = {
    id: '1',
    name: 'Starting Strength',
    name_de: 'Starting Strength',
    plan_type: 'starting_strength',
    fitness_level: 'beginner',
    days_per_week: 3,
    primary_goal: 'strength',
    min_training_experience_months: 0,
  };

  const result = scorePlanTemplate(beginnerUser, mockTemplate);

  // Check structure
  assert(result.template !== undefined, 'Result contains template');
  assert(result.totalScore !== undefined, 'Result contains totalScore');
  assert(result.breakdown !== undefined, 'Result contains breakdown');
  assert(result.completeness !== undefined, 'Result contains completeness');
  assert(result.recommendation !== undefined, 'Result contains recommendation');
  assert(result.reasoning !== undefined, 'Result contains reasoning');

  // Check score range
  assertRange(result.totalScore, 0, 100, 'Total score is between 0 and 100');

  // Check breakdown scores
  assertRange(
    result.breakdown.experienceScore,
    0,
    100,
    'Experience score is between 0 and 100'
  );
  assertRange(
    result.breakdown.frequencyScore,
    0,
    100,
    'Frequency score is between 0 and 100'
  );
  assertRange(result.breakdown.goalScore, 0, 100, 'Goal score is between 0 and 100');
  assertRange(
    result.breakdown.volumeScore,
    0,
    100,
    'Volume score is between 0 and 100'
  );

  // Check completeness (Starting Strength is a complete program)
  assertEqual(result.completeness, 'complete', 'Starting Strength is complete');

  // Check recommendation category
  assert(
    ['optimal', 'good', 'acceptable', 'fallback'].includes(result.recommendation),
    'Recommendation is valid category'
  );

  // Check reasoning is not empty
  assert(result.reasoning.length > 0, 'Reasoning array is not empty');

  log.info(`Total Score: ${result.totalScore.toFixed(1)}`);
  log.info(`Recommendation: ${result.recommendation}`);
  log.info(`Reasoning: ${result.reasoning.join(' | ')}`);
}

/**
 * Get Top Recommendations Tests
 */
function testGetTopRecommendations() {
  log.test('getTopRecommendations Tests');

  const user: UserProfile = {
    fitness_level: 'beginner',
    training_experience_months: 6,
    available_training_days: 3,
    primary_goal: 'both',
  };

  const templates: PlanTemplate[] = [
    {
      id: '1',
      name: 'Starting Strength',
      name_de: 'Starting Strength',
      plan_type: 'starting_strength',
      fitness_level: 'beginner',
      days_per_week: 3,
      primary_goal: 'strength',
    },
    {
      id: '2',
      name: 'StrongLifts 5x5',
      name_de: 'StrongLifts 5x5',
      plan_type: 'stronglifts_5x5',
      fitness_level: 'beginner',
      days_per_week: 3,
      primary_goal: 'strength',
    },
    {
      id: '3',
      name: 'PPL 6x',
      name_de: 'PPL 6x',
      plan_type: 'ppl_6x_intermediate',
      fitness_level: 'intermediate',
      days_per_week: 6,
      primary_goal: 'hypertrophy',
    },
  ];

  const recommendations = getTopRecommendations(user, templates, 3);

  // Check that we get recommendations
  assert(recommendations.length > 0, 'Returns at least one recommendation');
  assert(recommendations.length <= 3, 'Returns max 3 recommendations');

  // Check that they're sorted by score
  for (let i = 0; i < recommendations.length - 1; i++) {
    assert(
      recommendations[i].totalScore >= recommendations[i + 1].totalScore,
      `Recommendations are sorted by score (${i} vs ${i + 1})`
    );
  }

  log.info(`Returned ${recommendations.length} recommendations`);
  recommendations.forEach((rec, idx) => {
    log.info(
      `${idx + 1}. ${rec.template.name} - Score: ${rec.totalScore.toFixed(1)} (${rec.recommendation})`
    );
  });
}

/**
 * Get Best Recommendation Tests
 */
function testGetBestRecommendation() {
  log.test('getBestRecommendation Tests');

  const user: UserProfile = {
    fitness_level: 'intermediate',
    training_experience_months: 18,
    available_training_days: 4,
    primary_goal: 'hypertrophy',
  };

  const templates: PlanTemplate[] = [
    {
      id: '1',
      name: 'Starting Strength',
      name_de: 'Starting Strength',
      plan_type: 'starting_strength',
      fitness_level: 'beginner',
      days_per_week: 3,
      primary_goal: 'strength',
    },
    {
      id: '2',
      name: 'PHUL',
      name_de: 'PHUL',
      plan_type: 'phul',
      fitness_level: 'intermediate',
      days_per_week: 4,
      primary_goal: 'both',
    },
  ];

  const best = getBestRecommendation(user, templates);

  assert(best !== null, 'Returns a recommendation');

  if (best) {
    assert(best.template !== undefined, 'Best recommendation has template');
    log.info(`Best: ${best.template.name} - Score: ${best.totalScore.toFixed(1)}`);
  }

  // Test with empty templates
  const noBest = getBestRecommendation(user, []);
  assertEqual(noBest, null, 'Returns null for empty templates');
}

/**
 * Format Score Breakdown Tests
 */
function testFormatScoreBreakdown() {
  log.test('formatScoreBreakdown Tests');

  const breakdown: ScoreBreakdown = {
    experienceScore: 100,
    frequencyScore: 80,
    goalScore: 90,
    volumeScore: 70,
  };

  const formatted = formatScoreBreakdown(breakdown);

  assert(formatted.includes('Trainingslevel: 100%'), 'Contains experience score');
  assert(formatted.includes('Trainingsfrequenz: 80%'), 'Contains frequency score');
  assert(formatted.includes('Trainingsziel: 90%'), 'Contains goal score');
  assert(formatted.includes('Trainingsvolumen: 70%'), 'Contains volume score');

  log.info('Formatted breakdown:');
  console.log(formatted);
}

/**
 * Get Recommendation Badge Tests
 */
function testGetRecommendationBadge() {
  log.test('getRecommendationBadge Tests');

  const optimalBadge = getRecommendationBadge('optimal');
  assertEqual(optimalBadge.text, 'OPTIMAL', 'Optimal badge text is correct');
  assertEqual(optimalBadge.emoji, '⭐', 'Optimal badge emoji is correct');

  const goodBadge = getRecommendationBadge('good');
  assertEqual(goodBadge.text, 'SEHR GUT', 'Good badge text is correct');
  assertEqual(goodBadge.emoji, '👍', 'Good badge emoji is correct');

  const acceptableBadge = getRecommendationBadge('acceptable');
  assertEqual(acceptableBadge.text, 'AKZEPTABEL', 'Acceptable badge text is correct');
  assertEqual(acceptableBadge.emoji, '✓', 'Acceptable badge emoji is correct');

  const fallbackBadge = getRecommendationBadge('fallback');
  assertEqual(fallbackBadge.text, 'FALLBACK', 'Fallback badge text is correct');
  assertEqual(fallbackBadge.emoji, '⚠️', 'Fallback badge emoji is correct');

  const unknownBadge = getRecommendationBadge('unknown');
  assertEqual(unknownBadge.text, 'UNBEKANNT', 'Unknown badge text is correct');
}

/**
 * Run all tests
 */
function runAllTests() {
  console.log('\n' + '='.repeat(60));
  console.log('🧪 Plan Recommendation Scoring Tests');
  console.log('='.repeat(60));

  testCalculateExperienceMatch();
  testCalculateFrequencyMatch();
  testCalculateGoalMatch();
  testCalculateVolumeMatch();
  testAdjustScoreByMonths();
  testScorePlanTemplate();
  testGetTopRecommendations();
  testGetBestRecommendation();
  testFormatScoreBreakdown();
  testGetRecommendationBadge();

  console.log('\n' + '='.repeat(60));
  console.log('📊 Test Ergebnisse');
  console.log('='.repeat(60));

  if (passedTests === totalTests) {
    log.success(`Alle Tests bestanden! (${passedTests}/${totalTests})`);
  } else {
    log.error(`${passedTests}/${totalTests} Tests bestanden`);
  }

  console.log('='.repeat(60) + '\n');

  // Exit with error code if tests failed
  if (passedTests !== totalTests) {
    process.exit(1);
  }
}

// Run tests
runAllTests();
