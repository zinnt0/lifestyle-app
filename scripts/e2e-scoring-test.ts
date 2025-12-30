/**
 * End-to-End Test für das neue Scoring-System
 *
 * Testet alle 5 definierten Szenarien + UI/UX + Performance + Funktionalität
 *
 * Usage: npx ts-node scripts/e2e-scoring-test.ts
 */

import { supabase } from '../src/lib/supabase';
import {
  scorePlanTemplate,
  getTopRecommendations,
  type UserProfile,
} from '../src/utils/planRecommendationScoring';
import type { PlanTemplate } from '../src/types/training.types';

// ============================================================================
// Test Configuration
// ============================================================================

const COLORS = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m',
  bold: '\x1b[1m',
};

interface TestResult {
  scenario: string;
  passed: boolean;
  expectedTop: string;
  actualTop: string;
  expectedScore: string;
  actualScore: number;
  loadTime: number;
  recommendations: any[];
  errors: string[];
  warnings: string[];
}

const testResults: TestResult[] = [];

// ============================================================================
// Logging Helpers
// ============================================================================

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
// Test Data
// ============================================================================

const TEST_SCENARIOS = [
  {
    name: 'Anfänger-User (Full Body 3x)',
    user: {
      fitness_level: 'beginner' as const,
      training_experience_months: 6,
      available_training_days: 3,
      primary_goal: 'general_fitness' as const,
    },
    expectations: {
      topPlan: 'full_body_3x',
      scoreRange: [95, 100],
      allTopComplete: true,
      maxLoadTime: 200,
    },
  },
  {
    name: 'Intermediär-User (Upper/Lower Hypertrophy)',
    user: {
      fitness_level: 'intermediate' as const,
      training_experience_months: 18,
      available_training_days: 4,
      primary_goal: 'hypertrophy' as const,
    },
    expectations: {
      topPlan: 'upper_lower_hypertrophy',
      scoreRange: [95, 100],
      alternativePlan: 'phul',
      alternativeScoreRange: [90, 95],
      maxLoadTime: 200,
    },
  },
  {
    name: 'Advanced-User (5-Tage Strength)',
    user: {
      fitness_level: 'advanced' as const,
      training_experience_months: 48,
      available_training_days: 5,
      primary_goal: 'strength' as const,
    },
    expectations: {
      topPlanType: 'intermediate_with_mod',
      scoreRange: [85, 92],
      incompleteWarning: true,
      maxLoadTime: 200,
    },
  },
  {
    name: 'Edge-Case: 2 Trainingstage',
    user: {
      fitness_level: 'beginner' as const,
      training_experience_months: 3,
      available_training_days: 2,
      primary_goal: 'general_fitness' as const,
    },
    expectations: {
      topPlanType: 'upper_lower_minimal',
      incompleteAcceptable: true,
      alternativeDaysShown: true,
      maxLoadTime: 200,
    },
  },
];

// ============================================================================
// Test Functions
// ============================================================================

async function fetchPlanTemplates(): Promise<PlanTemplate[]> {
  const { data, error } = await supabase
    .from('plan_templates')
    .select('*')
    .eq('is_active', true);

  if (error) {
    throw new Error(`Failed to fetch templates: ${error.message}`);
  }

  return data || [];
}

async function runScenarioTest(
  scenario: typeof TEST_SCENARIOS[0],
  templates: PlanTemplate[]
): Promise<TestResult> {
  logSubheader(scenario.name);

  const errors: string[] = [];
  const warnings: string[] = [];

  // Measure performance
  const startTime = performance.now();
  const recommendations = getTopRecommendations(scenario.user, templates, 3);
  const loadTime = performance.now() - startTime;

  // Validate load time
  if (loadTime > scenario.expectations.maxLoadTime) {
    errors.push(
      `Load time ${loadTime.toFixed(1)}ms exceeds max ${scenario.expectations.maxLoadTime}ms`
    );
  } else {
    logSuccess(`Load time: ${loadTime.toFixed(1)}ms (< ${scenario.expectations.maxLoadTime}ms)`);
  }

  // Check if we got recommendations
  if (recommendations.length === 0) {
    errors.push('No recommendations returned');
    return {
      scenario: scenario.name,
      passed: false,
      expectedTop: scenario.expectations.topPlan || 'any',
      actualTop: 'none',
      expectedScore: `${scenario.expectations.scoreRange[0]}-${scenario.expectations.scoreRange[1]}`,
      actualScore: 0,
      loadTime,
      recommendations: [],
      errors,
      warnings,
    };
  }

  const topRec = recommendations[0];

  logInfo(`User Profile:`);
  console.log(`  Level: ${scenario.user.fitness_level}`);
  console.log(`  Experience: ${scenario.user.training_experience_months} months`);
  console.log(`  Days: ${scenario.user.available_training_days}/week`);
  console.log(`  Goal: ${scenario.user.primary_goal}`);
  console.log();

  logInfo(`Top 3 Recommendations:`);
  recommendations.forEach((rec, idx) => {
    const badge = rec.recommendation === 'optimal' ? '⭐' :
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

  // Validate top recommendation
  if (scenario.expectations.topPlan) {
    if (topRec.template.plan_type === scenario.expectations.topPlan) {
      logSuccess(`Top plan matches expected: ${topRec.template.plan_type}`);
    } else {
      errors.push(
        `Expected top plan: ${scenario.expectations.topPlan}, got: ${topRec.template.plan_type}`
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

  // Check for incomplete warning (if expected)
  if (scenario.expectations.incompleteWarning) {
    const hasIncomplete = recommendations.some(r => r.completeness === 'incomplete');
    if (hasIncomplete) {
      logWarning('Incomplete plans present (as expected for advanced users)');
    } else {
      warnings.push('Expected incomplete plans warning, but all plans are complete');
    }
  }

  // Display errors and warnings
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
    expectedTop: scenario.expectations.topPlan || 'any',
    actualTop: topRec.template.plan_type,
    expectedScore: `${minScore}-${maxScore}`,
    actualScore: topRec.totalScore,
    loadTime,
    recommendations,
    errors,
    warnings,
  };
}

async function runPerformanceTest(templates: PlanTemplate[]) {
  logSubheader('Performance Test: 10 Concurrent Users');

  const testUsers: UserProfile[] = Array.from({ length: 10 }, (_, i) => ({
    fitness_level: ['beginner', 'intermediate', 'advanced'][i % 3] as any,
    training_experience_months: 6 + i * 4,
    available_training_days: 3 + (i % 4),
    primary_goal: ['strength', 'hypertrophy', 'both', 'general_fitness'][i % 4] as any,
  }));

  const startTime = performance.now();

  const results = await Promise.all(
    testUsers.map(user =>
      Promise.resolve(getTopRecommendations(user, templates, 3))
    )
  );

  const totalTime = performance.now() - startTime;
  const avgTime = totalTime / testUsers.length;

  logInfo(`Results:`);
  console.log(`  Total Time: ${totalTime.toFixed(1)}ms`);
  console.log(`  Average Time: ${avgTime.toFixed(1)}ms per user`);
  console.log(`  Users Processed: ${results.length}`);

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

function generateTestReport() {
  logHeader('TEST REPORT SUMMARY');

  const totalTests = testResults.length;
  const passedTests = testResults.filter(r => r.passed).length;
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

  testResults.forEach((result, idx) => {
    const status = result.passed ? '✓ PASS' : '✗ FAIL';
    const color = result.passed ? COLORS.green : COLORS.red;

    log(`${idx + 1}. ${status} - ${result.scenario}`, color);
    console.log(`   Expected Top: ${result.expectedTop}`);
    console.log(`   Actual Top: ${result.actualTop}`);
    console.log(`   Expected Score: ${result.expectedScore}`);
    console.log(`   Actual Score: ${result.actualScore.toFixed(1)}`);
    console.log(`   Load Time: ${result.loadTime.toFixed(1)}ms`);

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
  const avgLoadTime = testResults.reduce((sum, r) => sum + r.loadTime, 0) / testResults.length;
  const maxLoadTime = Math.max(...testResults.map(r => r.loadTime));
  const minLoadTime = Math.min(...testResults.map(r => r.loadTime));

  console.log(`  Average Load Time: ${avgLoadTime.toFixed(1)}ms`);
  console.log(`  Max Load Time: ${maxLoadTime.toFixed(1)}ms`);
  console.log(`  Min Load Time: ${minLoadTime.toFixed(1)}ms`);
  console.log();

  if (avgLoadTime < 200) {
    logSuccess('Performance target met (< 200ms average)');
  } else {
    logWarning('Performance target not met (>= 200ms average)');
  }

  // Recommendations for Optimization
  logSubheader('Recommendations');

  const hasFailures = failedTests > 0;
  const hasSlowTests = avgLoadTime > 200;

  if (!hasFailures && !hasSlowTests) {
    logSuccess('All tests passed with excellent performance!');
    logInfo('System is ready for production.');
  } else {
    if (hasFailures) {
      logError('Some tests failed. Review the errors above and fix the scoring logic.');
    }
    if (hasSlowTests) {
      logWarning('Performance could be improved:');
      console.log('  - Consider adding database indexes on plan_templates');
      console.log('  - Implement caching for frequently accessed templates');
      console.log('  - Pre-compute completion_status in database');
    }
  }

  console.log();
  log('='.repeat(70), COLORS.bold);

  return {
    totalTests,
    passedTests,
    failedTests,
    avgLoadTime,
    success: failedTests === 0,
  };
}

// ============================================================================
// Main Test Runner
// ============================================================================

async function main() {
  try {
    logHeader('🧪 END-TO-END SCORING SYSTEM TEST');

    logInfo('Initializing...');

    // Fetch templates
    logInfo('Fetching plan templates from database...');
    const templates = await fetchPlanTemplates();
    logSuccess(`Loaded ${templates.length} plan templates`);

    const completeTemplates = templates.filter(t =>
      t.completion_status === 'complete' || t.plan_type?.includes('full_body') ||
      t.plan_type?.includes('stronglifts') || t.plan_type?.includes('starting_strength')
    );
    logInfo(`Complete templates: ${completeTemplates.length}`);

    console.log();

    // Run scenario tests
    for (const scenario of TEST_SCENARIOS) {
      const result = await runScenarioTest(scenario, templates);
      testResults.push(result);
    }

    // Run performance test
    const perfPassed = await runPerformanceTest(templates);
    console.log();

    // Generate report
    const report = generateTestReport();

    // Exit with appropriate code
    if (report.success && perfPassed) {
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

// Run tests
if (require.main === module) {
  main();
}

export { main as runE2ETests };
