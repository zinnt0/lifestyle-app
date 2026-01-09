/**
 * Simplified script to add test workout data
 *
 * Run with: npx tsx scripts/add-test-workout-data-simple.ts <user-id>
 * Or find user by email: npx tsx scripts/add-test-workout-data-simple.ts --email fabianzinn@icloud.com
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config();

const SUPABASE_URL = process.env.EXPO_PUBLIC_SUPABASE_URL!;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY!;

if (!SUPABASE_URL) {
  console.error('❌ Missing EXPO_PUBLIC_SUPABASE_URL in .env');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    console.log('Usage:');
    console.log('  npx tsx scripts/add-test-workout-data-simple.ts <user-id>');
    console.log('  npx tsx scripts/add-test-workout-data-simple.ts --email <email>');
    console.log('\nOr list all users:');
    console.log('  npx tsx scripts/add-test-workout-data-simple.ts --list');
    process.exit(0);
  }

  if (args[0] === '--list') {
    await listUsers();
    return;
  }

  let userId: string;

  if (args[0] === '--email' && args[1]) {
    const email = args[1];
    console.log(`🔍 Finding user by email: ${email}`);

    const { data: profiles } = await supabase
      .from('profiles')
      .select('id, username')
      .ilike('id', `%${email.split('@')[0]}%`)
      .limit(10);

    if (!profiles || profiles.length === 0) {
      console.error(`❌ No user found matching email pattern`);
      console.log('\n💡 Try listing all users: npx tsx scripts/add-test-workout-data-simple.ts --list');
      return;
    }

    console.log(`\nFound ${profiles.length} potential matches:`);
    profiles.forEach((p, i) => {
      console.log(`  ${i + 1}. ${p.username || 'No username'} (${p.id})`);
    });

    userId = profiles[0].id;
    console.log(`\n✅ Using first match: ${userId}`);
  } else {
    userId = args[0];
    console.log(`✅ Using provided user ID: ${userId}`);
  }

  await createTestWorkouts(userId);
}

async function listUsers() {
  console.log('📋 Fetching users...\n');

  const { data: profiles, error } = await supabase
    .from('profiles')
    .select('id, username, created_at')
    .order('created_at', { ascending: false })
    .limit(20);

  if (error || !profiles) {
    console.error('❌ Error fetching users:', error);
    return;
  }

  console.log(`Found ${profiles.length} users:\n`);
  profiles.forEach((p, i) => {
    const date = new Date(p.created_at).toLocaleDateString();
    console.log(`  ${i + 1}. ${p.username || 'No username'}`);
    console.log(`     ID: ${p.id}`);
    console.log(`     Created: ${date}\n`);
  });
}

async function createTestWorkouts(userId: string) {
  console.log('\n🏋️ Creating test workout data...\n');

  // Check if user exists
  const { data: userProfile } = await supabase
    .from('profiles')
    .select('username')
    .eq('id', userId)
    .single();

  if (!userProfile) {
    console.error(`❌ User not found: ${userId}`);
    return;
  }

  console.log(`✅ Creating data for: ${userProfile.username || 'User'}\n`);

  // Step 1: Get or create training plan
  console.log('📋 Step 1: Getting or creating training plan...');

  let { data: existingPlans } = await supabase
    .from('training_plans')
    .select('id, name')
    .eq('user_id', userId)
    .eq('status', 'active')
    .limit(1);

  let planId: string;

  if (existingPlans && existingPlans.length > 0) {
    planId = existingPlans[0].id;
    console.log(`✅ Using existing plan: "${existingPlans[0].name}"`);
  } else {
    const { data: newPlan, error: planError } = await supabase
      .from('training_plans')
      .insert({
        user_id: userId,
        name: 'Test Push/Pull/Legs Plan',
        plan_type: 'custom',
        days_per_week: 3,
        status: 'active',
      })
      .select()
      .single();

    if (planError || !newPlan) {
      console.error('❌ Error creating plan:', planError);
      return;
    }

    planId = newPlan.id;
    console.log(`✅ Created new plan: "${newPlan.name}"`);
  }

  // Step 2: Get or create workout
  console.log('\n💪 Step 2: Getting or creating workout...');

  let { data: planWorkouts } = await supabase
    .from('plan_workouts')
    .select('id, name')
    .eq('plan_id', planId)
    .limit(1);

  let workoutId: string;

  if (planWorkouts && planWorkouts.length > 0) {
    workoutId = planWorkouts[0].id;
    console.log(`✅ Using existing workout: "${planWorkouts[0].name}"`);
  } else {
    const { data: newWorkout, error: workoutError } = await supabase
      .from('plan_workouts')
      .insert({
        plan_id: planId,
        name: 'Push Day (Test)',
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
    console.log(`✅ Created workout: "${newWorkout.name}"`);
  }

  // Step 3: Get exercises
  console.log('\n🔍 Step 3: Finding exercises...');

  const { data: exercises, error: exercisesError } = await supabase
    .from('exercises')
    .select('id, name_de')
    .in('name', [
      'Bench Press (Barbell)',
      'Squat (Barbell)',
      'Deadlift (Barbell)',
      'Overhead Press (Barbell)',
      'Bent Over Row (Barbell)',
    ])
    .limit(5);

  if (exercisesError || !exercises || exercises.length === 0) {
    console.error('❌ No exercises found. Using fallback...');

    // Fallback: get ANY 5 exercises
    const { data: fallbackExercises } = await supabase
      .from('exercises')
      .select('id, name_de')
      .limit(5);

    if (!fallbackExercises || fallbackExercises.length === 0) {
      console.error('❌ Could not find any exercises in database');
      return;
    }

    console.log(`✅ Found ${fallbackExercises.length} fallback exercises`);
    await createSessions(userId, planId, workoutId, fallbackExercises);
  } else {
    console.log(`✅ Found ${exercises.length} exercises`);
    await createSessions(userId, planId, workoutId, exercises);
  }
}

async function createSessions(
  userId: string,
  planId: string,
  workoutId: string,
  exercises: Array<{ id: string; name_de: string }>
) {
  console.log('\n🏋️ Step 4: Creating workout sessions...');

  const sessionsToCreate = 10;
  const today = new Date();

  for (let i = 0; i < sessionsToCreate; i++) {
    const daysAgo = i * 6;
    const sessionDate = new Date(today);
    sessionDate.setDate(sessionDate.getDate() - daysAgo);

    const startTime = new Date(sessionDate);
    startTime.setHours(10, 0, 0, 0);

    const endTime = new Date(startTime);
    endTime.setMinutes(endTime.getMinutes() + 60);

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
        energy_level: 3 + Math.floor(Math.random() * 3),
        sleep_quality: 3 + Math.floor(Math.random() * 3),
      })
      .select()
      .single();

    if (sessionError || !session) {
      console.error(`❌ Error creating session ${i + 1}:`, sessionError?.message);
      continue;
    }

    console.log(`  ✅ Session ${i + 1}/${sessionsToCreate} (${sessionDate.toISOString().split('T')[0]})`);

    // Add sets for each exercise
    for (const exercise of exercises) {
      const numSets = 3 + Math.floor(Math.random() * 2);

      for (let setNum = 1; setNum <= numSets; setNum++) {
        const baseWeight = 60 + (sessionsToCreate - i) * 2.5;
        const weightVariation = Math.random() * 5 - 2.5;
        const weight = Math.round((baseWeight + weightVariation) * 2) / 2;

        const baseReps = 8;
        const repsVariation = Math.floor(Math.random() * 5);
        const reps = baseReps + repsVariation;

        const rir = Math.floor(Math.random() * 3);

        await supabase.from('workout_sets').insert({
          session_id: session.id,
          exercise_id: exercise.id,
          set_number: setNum,
          weight,
          reps,
          rir,
        });
      }
    }
  }

  console.log('\n✅ Test workout data created successfully!');
  console.log(`\n📊 Summary:`);
  console.log(`  • User ID: ${userId}`);
  console.log(`  • Sessions created: ${sessionsToCreate}`);
  console.log(`  • Exercises per session: ${exercises.length}`);
  console.log(`  • Date range: ${sessionsToCreate * 6} days ago to recent`);
  console.log(`\n💡 Now:`);
  console.log(`  1. Open the app and login`);
  console.log(`  2. Go to Training Dashboard`);
  console.log(`  3. Click "Workout-Historie"`);
  console.log(`  4. Select an exercise to see progress!`);
}

main()
  .then(() => {
    console.log('\n✅ Script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script failed:', error);
    process.exit(1);
  });
