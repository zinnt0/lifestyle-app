/**
 * Generate Analytics Test Data
 *
 * This script generates realistic test data for the analytics system.
 * Run this to populate the database with sample events for testing dashboard queries.
 *
 * Usage:
 *   npx ts-node scripts/generate-analytics-test-data.ts
 */

import { supabase } from '../src/lib/supabase';

// Configuration
const CONFIG = {
  userCount: 20, // Number of test users
  daysBack: 30, // Generate data for last N days
  eventsPerUserPerDay: 2, // Average events per user per day
  incompleteRate: 0.2, // 20% of recommendations are incomplete
  errorRate: 0.05, // 5% error rate
};

const PLAN_TYPES = [
  'muscle_building',
  'weight_loss',
  'strength',
  'endurance',
  'general_fitness',
  'powerlifting',
  'bodybuilding',
];

// Helper functions
function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomFloat(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

function randomChoice<T>(arr: T[]): T {
  return arr[randomInt(0, arr.length - 1)];
}

function randomDate(daysBack: number): Date {
  const now = new Date();
  const daysAgo = randomInt(0, daysBack);
  const date = new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000);
  // Random hour of day
  date.setHours(randomInt(6, 23));
  date.setMinutes(randomInt(0, 59));
  return date;
}

/**
 * Generate a realistic user session
 */
async function generateUserSession(userId: string, date: Date) {
  const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const events = [];

  // 1. Recommendations loaded
  const topScore = randomInt(60, 95);
  const recommendationCount = randomInt(2, 3);
  const loadTime = randomInt(100, 1500);
  const allScores = [topScore, topScore - randomInt(5, 15), topScore - randomInt(10, 25)].slice(0, recommendationCount);

  events.push({
    user_id: userId,
    event: 'recommendations_loaded',
    data: {
      topScore,
      recommendationCount,
      loadTime,
      allScores,
    },
    session_id: sessionId,
    created_at: new Date(date.getTime()).toISOString(),
  });

  // 2. Plan selected (80% of users select a plan)
  if (Math.random() < 0.8) {
    const selectedRank = Math.random() < 0.7 ? 1 : randomInt(2, recommendationCount);
    const selectedScore = allScores[selectedRank - 1];
    const selectedPlanType = randomChoice(PLAN_TYPES);
    const isIncomplete = Math.random() < CONFIG.incompleteRate;
    const completeness = isIncomplete ? 'incomplete' : 'complete';

    const selectTime = new Date(date.getTime() + randomInt(5000, 30000));

    events.push({
      user_id: userId,
      event: 'plan_selected',
      data: {
        selectedPlanType,
        selectedScore,
        selectedRank,
        completeness,
      },
      session_id: sessionId,
      created_at: selectTime.toISOString(),
    });

    // 3. Incomplete warning (if plan is incomplete)
    if (isIncomplete) {
      const warningTime = new Date(selectTime.getTime() + 1000);
      events.push({
        user_id: userId,
        event: 'incomplete_warning_shown',
        data: {
          selectedPlanType,
        },
        session_id: sessionId,
        created_at: warningTime.toISOString(),
      });

      // 4. Incomplete plan accepted (60% accept despite warning)
      if (Math.random() < 0.6) {
        const acceptTime = new Date(warningTime.getTime() + randomInt(2000, 10000));
        events.push({
          user_id: userId,
          event: 'incomplete_plan_accepted',
          data: {
            selectedPlanType,
          },
          session_id: sessionId,
          created_at: acceptTime.toISOString(),
        });

        // 5. Plan created
        const createTime = new Date(acceptTime.getTime() + randomInt(1000, 3000));
        events.push({
          user_id: userId,
          event: 'plan_created',
          data: {
            selectedPlanType,
            selectedScore,
            completeness,
          },
          session_id: sessionId,
          created_at: createTime.toISOString(),
        });
      }
    } else {
      // Plan is complete, proceed to creation (90% create)
      if (Math.random() < 0.9) {
        const createTime = new Date(selectTime.getTime() + randomInt(1000, 5000));
        events.push({
          user_id: userId,
          event: 'plan_created',
          data: {
            selectedPlanType,
            selectedScore,
            completeness,
          },
          session_id: sessionId,
          created_at: createTime.toISOString(),
        });
      }
    }
  }

  return events;
}

/**
 * Generate error events
 */
async function generateErrorEvent(userId: string, date: Date) {
  const errorMessages = [
    'Network error',
    'Failed to fetch user profile',
    'Database connection timeout',
    'Invalid user data',
  ];

  return {
    user_id: userId,
    event: 'recommendations_error',
    data: {
      errorMessage: randomChoice(errorMessages),
    },
    created_at: date.toISOString(),
  };
}

/**
 * Main function to generate all test data
 */
async function generateTestData() {
  console.log('🚀 Generating analytics test data...');
  console.log(`📊 Config: ${CONFIG.userCount} users, ${CONFIG.daysBack} days`);

  try {
    // Get authenticated user for testing
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      console.error('❌ Not authenticated. Please log in first.');
      return;
    }

    // Use the current user as one of the test users
    const userIds = [user.id];

    // Generate test events
    const allEvents = [];

    for (let day = 0; day < CONFIG.daysBack; day++) {
      for (const userId of userIds) {
        const eventsToday = randomInt(0, CONFIG.eventsPerUserPerDay * 2);

        for (let i = 0; i < eventsToday; i++) {
          const date = randomDate(day);

          // Generate error events at configured rate
          if (Math.random() < CONFIG.errorRate) {
            allEvents.push(await generateErrorEvent(userId, date));
          } else {
            // Generate normal user session
            const sessionEvents = await generateUserSession(userId, date);
            allEvents.push(...sessionEvents);
          }
        }
      }
    }

    console.log(`📝 Generated ${allEvents.length} events`);

    // Insert events in batches
    const batchSize = 100;
    for (let i = 0; i < allEvents.length; i += batchSize) {
      const batch = allEvents.slice(i, i + batchSize);
      const { error } = await supabase
        .from('recommendation_events')
        .insert(batch);

      if (error) {
        console.error(`❌ Error inserting batch ${i / batchSize + 1}:`, error);
      } else {
        console.log(`✅ Inserted batch ${i / batchSize + 1} (${batch.length} events)`);
      }
    }

    console.log('✨ Test data generation complete!');
    console.log('\n📊 Summary:');
    console.log(`   Total events: ${allEvents.length}`);
    console.log(`   Users: ${userIds.length}`);
    console.log(`   Date range: Last ${CONFIG.daysBack} days`);
    console.log('\n🔍 You can now run the analytics dashboard queries!');

  } catch (error) {
    console.error('❌ Error generating test data:', error);
  }
}

// Run the script
generateTestData();
