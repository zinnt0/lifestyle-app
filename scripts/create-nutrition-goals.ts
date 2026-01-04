/**
 * Script to create nutrition goals for existing users
 * Run with: npx tsx scripts/create-nutrition-goals.ts
 */

import { nutritionGoalsService } from '../lib/services/nutrition-goals.service';

async function createGoalsForUsers() {
  try {
    console.log('🎯 Creating nutrition goals for users...\n');

    // User 1: be695e36-4b00-42a1-9203-37b93768010e
    const user1Goal = await nutritionGoalsService.createNutritionGoal(
      'be695e36-4b00-42a1-9203-37b93768010e',
      {
        weight_kg: 93.5,
        height_cm: 186,
        age: 21,
        gender: 'male',
        target_weight_kg: 85,
        training_goal: 'cut',
        pal_factor: 1.6, // Moderate activity
        body_fat_percentage: 20,
      }
    );

    console.log('✅ Created goal for User 1:');
    console.log(`   Target Calories: ${user1Goal.target_calories} kcal/day`);
    console.log(`   Protein: ${user1Goal.protein_g_target}g`);
    console.log(`   Carbs: ${user1Goal.carbs_g_target}g`);
    console.log(`   Fat: ${user1Goal.fat_g_target}g`);
    console.log(`   BMR: ${user1Goal.bmr} kcal`);
    console.log(`   TDEE: ${user1Goal.tdee} kcal\n`);

    // User 2: 3687e2ab-7c22-4f9b-b7ae-ab234bfc8ae9
    const user2Goal = await nutritionGoalsService.createNutritionGoal(
      '3687e2ab-7c22-4f9b-b7ae-ab234bfc8ae9',
      {
        weight_kg: 91,
        height_cm: 181,
        age: 24,
        gender: 'male',
        target_weight_kg: 95,
        training_goal: 'bulk',
        pal_factor: 1.7, // Active
        body_fat_percentage: 15,
      }
    );

    console.log('✅ Created goal for User 2:');
    console.log(`   Target Calories: ${user2Goal.target_calories} kcal/day`);
    console.log(`   Protein: ${user2Goal.protein_g_target}g`);
    console.log(`   Carbs: ${user2Goal.carbs_g_target}g`);
    console.log(`   Fat: ${user2Goal.fat_g_target}g`);
    console.log(`   BMR: ${user2Goal.bmr} kcal`);
    console.log(`   TDEE: ${user2Goal.tdee} kcal\n`);

    console.log('🎉 Successfully created nutrition goals for all users!');
  } catch (error) {
    console.error('❌ Error creating nutrition goals:', error);
    process.exit(1);
  }
}

createGoalsForUsers();
