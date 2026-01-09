/**
 * Script to add test workout data for testing the Workout History feature
 *
 * Run with: npx tsx scripts/add-test-workout-data.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Missing Supabase credentials in .env file');
  console.error('   Please ensure EXPO_PUBLIC_SUPABASE_URL and EXPO_PUBLIC_SUPABASE_ANON_KEY are set');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const TEST_USER_EMAIL = 'fabianzinn@icloud.com';

async function addTestWorkoutData() {
  console.log('🏋️ Adding test workout data...\n');

  // 1. Get user ID
  const { data: users, error: userError } = await supabase
    .from('user_profiles')
    .select('id, username')
    .eq('id', (await supabase.auth.admin.listUsers()).data.users.find(u => u.email === TEST_USER_EMAIL)?.id!)
    .single();

  if (userError || !users) {
    console.error('❌ User not found:', TEST_USER_EMAIL);

    // Try alternate method
    const { data: { users: authUsers } } = await supabase.auth.admin.listUsers();
    const user = authUsers.find(u => u.email === TEST_USER_EMAIL);

    if (!user) {
      console.error('❌ User not found via auth either');
      return;
    }

    console.log(`✅ Found user via auth: ${user.id}`);
    const userId = user.id;

    // Continue with this user ID
    await createTestWorkouts(userId);
    return;
  }

  console.log(`✅ Found user: ${users.username || 'No username'} (${users.id})`);
  await createTestWorkouts(users.id);
}

async function createTestWorkouts(userId: string) {
  console.log('\n📋 Step 1: Getting or creating training plan...');

  // Get or create a training plan
  let { data: existingPlans } = await supabase
    .from('training_plans')
    .select('id, name')
    .eq('user_id', userId)
    .limit(1);

  let planId: string;

  if (existingPlans && existingPlans.length > 0) {
    planId = existingPlans[0].id;
    console.log(`✅ Using existing plan: ${existingPlans[0].name} (${planId})`);
  } else {
    // Create a simple test plan
    const { data: newPlan, error: planError } = await supabase
      .from('training_plans')
      .insert({
        user_id: userId,
        name: 'Test Push/Pull/Legs',
        plan_type: 'custom',
        days_per_week: 3,
        status: 'active',
        source_template_id: null,
      })
      .select()
      .single();

    if (planError || !newPlan) {
      console.error('❌ Error creating plan:', planError);
      return;
    }

    planId = newPlan.id;
    console.log(`✅ Created new plan: ${newPlan.name} (${planId})`);
  }

  // Get plan workouts
  let { data: planWorkouts } = await supabase
    .from('plan_workouts')
    .select('id, name')
    .eq('plan_id', planId);

  let workoutId: string;

  if (!planWorkouts || planWorkouts.length === 0) {
    // Create a test workout
    const { data: newWorkout, error: workoutError } = await supabase
      .from('plan_workouts')
      .insert({
        plan_id: planId,
        name: 'Push Day',
        day_number: 1,
        order_in_week: 1,
      })
      .select()
      .single();

    if (workoutError || !newWorkout) {
      console.error('❌ Error creating workout:', workoutError);
      return;
    }

    workoutId = newWorkout.id;
    console.log(`✅ Created workout: ${newWorkout.name} (${workoutId})`);
  } else {
    workoutId = planWorkouts[0].id;
    console.log(`✅ Using existing workout: ${planWorkouts[0].name} (${workoutId})`);
  }

  console.log('\n🔍 Step 2: Finding popular exercises...');

  // Get some popular exercises
  const { data: exercises, error: exercisesError } = await supabase
    .from('exercises')
    .select('id, name, name_de')
    .in('name', [
      'Bench Press (Barbell)',
      'Squat (Barbell)',
      'Deadlift (Barbell)',
      'Overhead Press (Barbell)',
      'Bent Over Row (Barbell)',
      'Pull-up',
      'Dip',
      'Bicep Curl (Barbell)',
    ])
    .limit(5);

  if (exercisesError || !exercises || exercises.length === 0) {
    console.error('❌ Error fetching exercises:', exercisesError);
    return;
  }

  console.log(`✅ Found ${exercises.length} exercises`);

  console.log('\n🏋️ Step 3: Creating workout sessions...');

  // Create 10 test workout sessions over the past 2 months
  const sessionsToCreate = 10;
  const today = new Date();

  for (let i = 0; i < sessionsToCreate; i++) {
    // Spread sessions over 2 months (every ~6 days)
    const daysAgo = i * 6;
    const sessionDate = new Date(today);
    sessionDate.setDate(sessionDate.getDate() - daysAgo);

    const startTime = new Date(sessionDate);
    startTime.setHours(10, 0, 0, 0); // 10:00 AM

    const endTime = new Date(startTime);
    endTime.setMinutes(endTime.getMinutes() + 60); // 60 minute workout

    // Create session
    const { data: session, error: sessionError } = await supabase
      .from('workout_sessions')
      .insert({
        user_id: userId,
        plan_id: planId,
        plan_workout_id: workoutId,
        date: sessionDate.toISOString().split('T')[0],
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
        duration_minutes: 60,
        status: 'completed',
        energy_level: 3 + Math.floor(Math.random() * 3), // 3-5
        sleep_quality: 3 + Math.floor(Math.random() * 3), // 3-5
      })
      .select()
      .single();

    if (sessionError || !session) {
      console.error(`❌ Error creating session ${i + 1}:`, sessionError);
      continue;
    }

    console.log(`  ✅ Session ${i + 1}/${sessionsToCreate} created (${sessionDate.toISOString().split('T')[0]})`);

    // Add sets for each exercise
    for (const exercise of exercises) {
      const numSets = 3 + Math.floor(Math.random() * 2); // 3-4 sets

      for (let setNum = 1; setNum <= numSets; setNum++) {
        // Progressive overload simulation: slightly increase weight over time
        const baseWeight = 60 + (sessionsToCreate - i) * 2.5; // Increases from 60kg to 85kg
        const weightVariation = Math.random() * 5 - 2.5; // ±2.5kg variation
        const weight = Math.round((baseWeight + weightVariation) * 2) / 2; // Round to 0.5kg

        const baseReps = 8;
        const repsVariation = Math.floor(Math.random() * 5); // 0-4 extra reps
        const reps = baseReps + repsVariation;

        const rir = Math.floor(Math.random() * 3); // 0-2 RIR

        const { error: setError } = await supabase
          .from('workout_sets')
          .insert({
            session_id: session.id,
            exercise_id: exercise.id,
            set_number: setNum,
            weight,
            reps,
            rir,
          });

        if (setError) {
          console.error(`    ❌ Error creating set for ${exercise.name_de}:`, setError);
        }
      }
    }
  }

  console.log('\n✅ Test workout data created successfully!');
  console.log(`\n📊 Summary:`);
  console.log(`  • User: ${TEST_USER_EMAIL}`);
  console.log(`  • Sessions: ${sessionsToCreate}`);
  console.log(`  • Exercises per session: ${exercises.length}`);
  console.log(`  • Total sets: ~${sessionsToCreate * exercises.length * 3.5}`);
  console.log(`\n💡 Now you can:`);
  console.log(`  1. Open the app as ${TEST_USER_EMAIL}`);
  console.log(`  2. Navigate to Training Dashboard`);
  console.log(`  3. Click on "Workout-Historie" tile`);
  console.log(`  4. Select an exercise from dropdown to see progress charts`);
}

// Run the script
addTestWorkoutData()
  .then(() => {
    console.log('\n✅ Script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });
