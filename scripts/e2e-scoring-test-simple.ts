/**
 * Simplified E2E Test für das Scoring-System (ohne Supabase)
 *
 * Nutzt Mock-Daten um das Scoring-System zu testen
 */

import {
  calculateExperienceMatch,
  calculateFrequencyMatch,
  calculateGoalMatch,
  calculateVolumeMatch,
  getTopRecommendations,
  type UserProfile,
} from '../src/utils/planRecommendationScoring';
import type { PlanTemplate } from '../src/types/training.types';

// ============================================================================
// Colors
// ============================================================================

const COLORS = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m',
};

function log(msg: string, color: string = COLORS.reset) {
  console.log(`${color}${msg}${COLORS.reset}`);
}

function logHeader(title: string) {
  console.log('\n' + '='.repeat(70));
  log(title, COLORS.bold + COLORS.cyan);
  console.log('='.repeat(70));
}

function logSubheader(title: string) {
  console.log();
  log(`▶ ${title}`, COLORS.blue);
  console.log('-'.repeat(70));
}

function logSuccess(msg: string) {
  log(`✓ ${msg}`, COLORS.green);
}

function logError(msg: string) {
  log(`✗ ${msg}`, COLORS.red);
}

function logWarning(msg: string) {
  log(`⚠ ${msg}`, COLORS.yellow);
}

function logInfo(msg: string) {
  log(`ℹ ${msg}`, COLORS.cyan);
}

// ============================================================================
// Mock Templates (basierend auf echten Daten aus DB)
// ============================================================================

const MOCK_TEMPLATES: PlanTemplate[] = [
  // Complete Programs
  {
    id: '1',
    name: 'Starting Strength',
    name_de: 'Starting Strength',
    plan_type: 'starting_strength',
    fitness_level: 'beginner',
    days_per_week: 3,
    primary_goal: 'strength',
    min_training_experience_months: 0,
    exercises_per_workout: 3,
    estimated_sets_per_week: 9,
    completion_status: 'complete',
  },
  {
    id: '2',
    name: 'StrongLifts 5x5',
    name_de: 'StrongLifts 5x5',
    plan_type: 'stronglifts_5x5',
    fitness_level: 'beginner',
    days_per_week: 3,
    primary_goal: 'strength',
    min_training_experience_months: 0,
    exercises_per_workout: 2,
    estimated_sets_per_week: 15,
    completion_status: 'complete',
  },
  {
    id: '3',
    name: 'Full Body 3x',
    name_de: 'Ganzkörper 3x',
    plan_type: 'full_body_3x',
    fitness_level: 'beginner',
    days_per_week: 3,
    primary_goal: 'general_fitness',
    min_training_experience_months: 0,
    exercises_per_workout: 6,
    estimated_sets_per_week: 18,
    completion_status: 'complete',
  },
  {
    id: '4',
    name: 'PHUL',
    name_de: 'PHUL',
    plan_type: 'phul',
    fitness_level: 'intermediate',
    days_per_week: 4,
    primary_goal: 'both',
    min_training_experience_months: 12,
    exercises_per_workout: 6,
    estimated_sets_per_week: 24,
    completion_status: 'complete',
  },
  {
    id: '5',
    name: 'Upper/Lower Hypertrophy',
    name_de: 'Oberkörper/Unterkörper Hypertrophie',
    plan_type: 'upper_lower_hypertrophy',
    fitness_level: 'intermediate',
    days_per_week: 4,
    primary_goal: 'hypertrophy',
    min_training_experience_months: 12,
    exercises_per_workout: 7,
    estimated_sets_per_week: 28,
    completion_status: 'complete',
  },
  {
    id: '6',
    name: '5/3/1 Intermediate',
    name_de: '5/3/1 Intermediär',
    plan_type: '531_intermediate',
    fitness_level: 'intermediate',
    days_per_week: 4,
    primary_goal: 'strength',
    min_training_experience_months: 12,
    exercises_per_workout: 5,
    estimated_sets_per_week: 21,
    completion_status: 'complete',
  },
  {
    id: '7',
    name: 'PPL 6x Intermediate',
    name_de: 'PPL 6x Intermediär',
    plan_type: 'ppl_6x_intermediate',
    fitness_level: 'intermediate',
    days_per_week: 6,
    primary_goal: 'hypertrophy',
    min_training_experience_months: 12,
    exercises_per_workout: 5,
    estimated_sets_per_week: 30,
    completion_status: 'complete',
  },
  // Incomplete Programs
  {
    id: '8',
    name: 'Minimal Upper/Lower',
    name_de: 'Minimal Oberkörper/Unterkörper',
    plan_type: 'minimal_upper_lower',
    fitness_level: 'beginner',
    days_per_week: 2,
    primary_goal: 'general_fitness',
    min_training_experience_months: 0,
    completion_status: 'incomplete',
  },
  {
    id: '9',
    name: '5/3/1 Advanced',
    name_de: '5/3/1 Fortgeschritten',
    plan_type: '531_advanced',
    fitness_level: 'advanced',
    days_per_week: 4,
    primary_goal: 'strength',
    min_training_experience_months: 36,
    completion_status: 'incomplete',
  },
];

// ============================================================================
// Test Scenarios
// ============================================================================

interface TestScenario {
  name: string;
  user: UserProfile;
  expectations: {
    topPlanType?: string;
    scoreRange: [number, number];
    allTopComplete?: boolean;
    maxLoadTime: number;
  };
}

const TEST_SCENARIOS: TestScenario[] = [
  {
    name: 'Szenario 1: Anfänger-User (Full Body 3x)',
    user: {
      fitness_level: 'beginner',
      training_experience_months: 6,
      available_training_days: 3,
      primary_goal: 'general_fitness',
    },
    expectations: {
      topPlanType: 'full_body_3x',
      scoreRange: [95, 100],
      allTopComplete: true,
      maxLoadTime: 200,
    },
  },
  {
    name: 'Szenario 2: Intermediär-User (Upper/Lower Hypertrophy)',
    user: {
      fitness_level: 'intermediate',
      training_experience_months: 18,
      available_training_days: 4,
      primary_goal: 'hypertrophy',
    },
    expectations: {
      topPlanType: 'upper_lower_hypertrophy',
      scoreRange: [95, 100],
      allTopComplete: true,
      maxLoadTime: 200,
    },
  },
  {
    name: 'Szenario 3: Advanced-User (5-Tage Strength)',
    user: {
      fitness_level: 'advanced',
      training_experience_months: 48,
      available_training_days: 5,
      primary_goal: 'strength',
    },
    expectations: {
      scoreRange: [85, 92],
      maxLoadTime: 200,
    },
  },
  {
    name: 'Szenario 4: Edge-Case (2 Trainingstage)',
    user: {
      fitness_level: 'beginner',
      training_experience_months: 3,
      available_training_days: 2,
      primary_goal: 'general_fitness',
    },
    expectations: {
      scoreRange: [50, 90],
      maxLoadTime: 200,
    },
  },
];

// ============================================================================
// Test Functions
// ============================================================================

interface TestResult {
  scenario: string;
  passed: boolean;
  loadTime: number;
  topPlan: string;
  topScore: number;
  recommendations: number;
  errors: string[];
  warnings: string[];
}

async function runScenarioTest(scenario: TestScenario): Promise<TestResult> {
  logSubheader(scenario.name);

  const errors: string[] = [];
  const warnings: string[] = [];

  // User Profile Info
  logInfo('User Profile:');
  console.log(`  Level: ${scenario.user.fitness_level}`);
  console.log(`  Experience: ${scenario.user.training_experience_months} months`);
  console.log(`  Days: ${scenario.user.available_training_days}/week`);
  console.log(`  Goal: ${scenario.user.primary_goal}`);
  console.log();

  // Measure Performance
  const startTime = performance.now();
  const recommendations = getTopRecommendations(scenario.user, MOCK_TEMPLATES, 3);
  const loadTime = performance.now() - startTime;

  // Validate load time
  if (loadTime > scenario.expectations.maxLoadTime) {
    errors.push(
      `Load time ${loadTime.toFixed(1)}ms exceeds max ${scenario.expectations.maxLoadTime}ms`
    );
  } else {
    logSuccess(`Load time: ${loadTime.toFixed(1)}ms (< ${scenario.expectations.maxLoadTime}ms)`);
  }

  // Check recommendations
  if (recommendations.length === 0) {
    errors.push('No recommendations returned');
    return {
      scenario: scenario.name,
      passed: false,
      loadTime,
      topPlan: 'none',
      topScore: 0,
      recommendations: 0,
      errors,
      warnings,
    };
  }

  const topRec = recommendations[0];

  // Display Top 3
  logInfo('Top 3 Recommendations:');
  recommendations.forEach((rec, idx) => {
    const badge =
      rec.recommendation === 'optimal' ? '⭐' :
      rec.recommendation === 'good' ? '👍' :
      rec.recommendation === 'acceptable' ? '✓' : '⚠️';

    console.log(`  ${idx + 1}. ${badge} ${rec.template.name_de || rec.template.name}`);
    console.log(`     Score: ${rec.totalScore.toFixed(1)}/100 (${rec.recommendation})`);
    console.log(`     Status: ${rec.completeness === 'complete' ? '✅ Complete' : '⚠️ Incomplete'}`);
    console.log(`     Plan Type: ${rec.template.plan_type}`);
    console.log(`     Breakdown:`);
    console.log(`       - Experience: ${rec.breakdown.experienceScore.toFixed(0)}%`);
    console.log(`       - Frequency: ${rec.breakdown.frequencyScore.toFixed(0)}%`);
    console.log(`       - Goal: ${rec.breakdown.goalScore.toFixed(0)}%`);
    console.log(`       - Volume: ${rec.breakdown.volumeScore.toFixed(0)}%`);
    console.log();
  });

  // Validate top plan
  if (scenario.expectations.topPlanType) {
    if (topRec.template.plan_type === scenario.expectations.topPlanType) {
      logSuccess(`Top plan matches expected: ${topRec.template.plan_type}`);
    } else {
      errors.push(
        `Expected top plan: ${scenario.expectations.topPlanType}, got: ${topRec.template.plan_type}`
      );
    }
  }

  // Validate score range
  const [minScore, maxScore] = scenario.expectations.scoreRange;
  if (topRec.totalScore >= minScore && topRec.totalScore <= maxScore) {
    logSuccess(`Score ${topRec.totalScore.toFixed(1)} within expected range ${minScore}-${maxScore}`);
  } else {
    warnings.push(
      `Score ${topRec.totalScore.toFixed(1)} outside expected range ${minScore}-${maxScore}`
    );
  }

  // Validate all top 3 are complete (if expected)
  if (scenario.expectations.allTopComplete) {
    const incompleteCount = recommendations.filter(r => r.completeness === 'incomplete').length;
    if (incompleteCount === 0) {
      logSuccess('All top 3 recommendations are complete');
    } else {
      errors.push(`${incompleteCount} of top 3 recommendations are incomplete`);
    }
  }

  // Display errors/warnings
  if (errors.length > 0) {
    console.log();
    errors.forEach(err => logError(err));
  }
  if (warnings.length > 0) {
    console.log();
    warnings.forEach(warn => logWarning(warn));
  }

  return {
    scenario: scenario.name,
    passed: errors.length === 0,
    loadTime,
    topPlan: topRec.template.plan_type,
    topScore: topRec.totalScore,
    recommendations: recommendations.length,
    errors,
    warnings,
  };
}

async function runPerformanceTest(): Promise<boolean> {
  logSubheader('Performance Test: 10 Concurrent Users');

  const testUsers: UserProfile[] = Array.from({ length: 10 }, (_, i) => ({
    fitness_level: (['beginner', 'intermediate', 'advanced'] as const)[i % 3],
    training_experience_months: 6 + i * 4,
    available_training_days: 3 + (i % 4),
    primary_goal: (['strength', 'hypertrophy', 'both', 'general_fitness'] as const)[i % 4],
  }));

  const startTime = performance.now();

  const results = testUsers.map(user =>
    getTopRecommendations(user, MOCK_TEMPLATES, 3)
  );

  const totalTime = performance.now() - startTime;
  const avgTime = totalTime / testUsers.length;

  logInfo('Results:');
  console.log(`  Total Time: ${totalTime.toFixed(1)}ms`);
  console.log(`  Average Time: ${avgTime.toFixed(1)}ms per user`);
  console.log(`  Users Processed: ${results.length}`);
  console.log();

  if (avgTime < 300) {
    logSuccess(`Average response time ${avgTime.toFixed(1)}ms < 300ms target`);
    return true;
  } else {
    logError(`Average response time ${avgTime.toFixed(1)}ms exceeds 300ms target`);
    return false;
  }
}

// ============================================================================
// Report Generation
// ============================================================================

function generateTestReport(results: TestResult[], perfPassed: boolean) {
  logHeader('TEST REPORT SUMMARY');

  const totalTests = results.length;
  const passedTests = results.filter(r => r.passed).length;
  const failedTests = totalTests - passedTests;

  console.log();
  log(`Total Tests: ${totalTests}`, COLORS.bold);
  log(`Passed: ${passedTests}`, passedTests === totalTests ? COLORS.green : COLORS.yellow);
  if (failedTests > 0) {
    log(`Failed: ${failedTests}`, COLORS.red);
  }

  console.log();
  console.log('Test Results:');
  console.log();

  results.forEach((result, idx) => {
    const status = result.passed ? '✓ PASS' : '✗ FAIL';
    const color = result.passed ? COLORS.green : COLORS.red;

    log(`${idx + 1}. ${status} - ${result.scenario}`, color);
    console.log(`   Top Plan: ${result.topPlan}`);
    console.log(`   Score: ${result.topScore.toFixed(1)}`);
    console.log(`   Load Time: ${result.loadTime.toFixed(1)}ms`);
    console.log(`   Recommendations: ${result.recommendations}`);

    if (result.errors.length > 0) {
      console.log(`   Errors:`);
      result.errors.forEach(err => console.log(`     - ${err}`));
    }

    if (result.warnings.length > 0) {
      console.log(`   Warnings:`);
      result.warnings.forEach(warn => console.log(`     - ${warn}`));
    }

    console.log();
  });

  // Performance Metrics
  logSubheader('Performance Metrics');
  const avgLoadTime = results.reduce((sum, r) => sum + r.loadTime, 0) / results.length;
  const maxLoadTime = Math.max(...results.map(r => r.loadTime));
  const minLoadTime = Math.min(...results.map(r => r.loadTime));

  console.log(`  Average Load Time: ${avgLoadTime.toFixed(1)}ms`);
  console.log(`  Max Load Time: ${maxLoadTime.toFixed(1)}ms`);
  console.log(`  Min Load Time: ${minLoadTime.toFixed(1)}ms`);
  console.log();

  if (avgLoadTime < 200) {
    logSuccess('Performance target met (< 200ms average)');
  } else {
    logWarning('Performance target not met (>= 200ms average)');
  }

  // Final Summary
  logSubheader('Summary');

  const hasFailures = failedTests > 0;
  const hasSlowPerf = !perfPassed;

  if (!hasFailures && perfPassed) {
    logSuccess('All tests passed with excellent performance!');
    logInfo('System is ready for production.');
  } else {
    if (hasFailures) {
      logError('Some tests failed. Review the errors above.');
    }
    if (hasSlowPerf) {
      logWarning('Performance could be improved.');
    }
  }

  console.log();
  log('='.repeat(70), COLORS.bold);

  return {
    totalTests,
    passedTests,
    failedTests,
    avgLoadTime,
    success: failedTests === 0 && perfPassed,
  };
}

// ============================================================================
// Main
// ============================================================================

async function main() {
  try {
    logHeader('🧪 END-TO-END SCORING SYSTEM TEST');

    logInfo(`Testing with ${MOCK_TEMPLATES.length} mock templates`);
    logInfo(`Complete templates: ${MOCK_TEMPLATES.filter(t => t.completion_status === 'complete').length}`);
    console.log();

    // Run scenario tests
    const results: TestResult[] = [];
    for (const scenario of TEST_SCENARIOS) {
      const result = await runScenarioTest(scenario);
      results.push(result);
    }

    // Run performance test
    const perfPassed = await runPerformanceTest();

    // Generate report
    const report = generateTestReport(results, perfPassed);

    // Exit with appropriate code
    if (report.success) {
      process.exit(0);
    } else {
      process.exit(1);
    }

  } catch (error) {
    logError(`Test execution failed: ${error instanceof Error ? error.message : String(error)}`);
    console.error(error);
    process.exit(1);
  }
}

main();
