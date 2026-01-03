/**
 * Comprehensive Nutrition Calculator Tests
 *
 * Test Coverage:
 * - BMR Calculations (Mifflin-St Jeor Formula)
 * - TDEE Calculations (PAL Factor Application)
 * - Goal Adjustments (Calorie Surplus/Deficit)
 * - Protein Calculations (Goal-specific)
 * - Conflict Detection (Goal vs Target Weight)
 * - Target Weight Timeline Validation
 * - Macro Distribution Validation
 * - Calculation Method Generation
 * - Edge Cases
 * - Integration Tests
 *
 * Target: 100% Coverage of Calculator Core Logic
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import { NutritionCalculatorService } from '../lib/services/nutrition-calculator.service';
import type { UserNutritionProfile, TrainingGoal } from '../lib/types/nutrition.types';

describe('NutritionCalculatorService', () => {
  let calculator: NutritionCalculatorService;

  beforeEach(() => {
    calculator = new NutritionCalculatorService();
  });

  // ============================================================================
  // 1. BMR CALCULATION TESTS
  // ============================================================================

  describe('BMR Calculations', () => {
    it('should calculate BMR correctly for male user', () => {
      const profile: UserNutritionProfile = {
        gender: 'male',
        weight_kg: 70,
        height_cm: 175,
        age: 30,
        pal_factor: 1.55,
        training_goal: 'general_fitness',
      };

      const result = calculator.calculate(profile);

      // Mifflin-St Jeor for male:
      // BMR = (10 × 70) + (6.25 × 175) - (5 × 30) + 5
      // BMR = 700 + 1093.75 - 150 + 5 = 1648.75 ≈ 1649 kcal
      expect(result.bmr).toBeGreaterThanOrEqual(1644);
      expect(result.bmr).toBeLessThanOrEqual(1654);
    });

    it('should calculate BMR correctly for female user', () => {
      const profile: UserNutritionProfile = {
        gender: 'female',
        weight_kg: 60,
        height_cm: 165,
        age: 25,
        pal_factor: 1.55,
        training_goal: 'general_fitness',
      };

      const result = calculator.calculate(profile);

      // Mifflin-St Jeor for female:
      // BMR = (10 × 60) + (6.25 × 165) - (5 × 25) - 161
      // BMR = 600 + 1031.25 - 125 - 161 = 1345.25 ≈ 1345 kcal
      expect(result.bmr).toBeGreaterThanOrEqual(1340);
      expect(result.bmr).toBeLessThanOrEqual(1350);
    });

    it('should round BMR to nearest integer', () => {
      const profile: UserNutritionProfile = {
        gender: 'male',
        weight_kg: 75,
        height_cm: 180,
        age: 28,
        pal_factor: 1.55,
        training_goal: 'general_fitness',
      };

      const result = calculator.calculate(profile);

      expect(Number.isInteger(result.bmr)).toBe(true);
    });
  });

  // ============================================================================
  // 2. TDEE CALCULATION TESTS
  // ============================================================================

  describe('TDEE Calculations', () => {
    it('should calculate TDEE with sedentary lifestyle correctly', () => {
      const profile: UserNutritionProfile = {
        gender: 'male',
        weight_kg: 70,
        height_cm: 175,
        age: 30,
        pal_factor: 1.2, // Sedentary
        training_goal: 'general_fitness',
      };

      const result = calculator.calculate(profile);

      // BMR ≈ 1649, TDEE = 1649 × 1.2 ≈ 1979 kcal
      expect(result.tdee).toBeGreaterThanOrEqual(1974);
      expect(result.tdee).toBeLessThanOrEqual(1984);
    });

    it('should calculate TDEE with very active lifestyle correctly', () => {
      const profile: UserNutritionProfile = {
        gender: 'male',
        weight_kg: 70,
        height_cm: 175,
        age: 30,
        pal_factor: 1.725, // Very active
        training_goal: 'general_fitness',
      };

      const result = calculator.calculate(profile);

      // BMR ≈ 1649, TDEE = 1649 × 1.725 ≈ 2844 kcal
      expect(result.tdee).toBeGreaterThanOrEqual(2839);
      expect(result.tdee).toBeLessThanOrEqual(2849);
    });

    it('should round TDEE to nearest integer', () => {
      const profile: UserNutritionProfile = {
        gender: 'female',
        weight_kg: 55,
        height_cm: 160,
        age: 22,
        pal_factor: 1.375,
        training_goal: 'general_fitness',
      };

      const result = calculator.calculate(profile);

      expect(Number.isInteger(result.tdee)).toBe(true);
    });
  });

  // ============================================================================
  // 3. GOAL ADJUSTMENT TESTS
  // ============================================================================

  describe('Goal Adjustments', () => {
    const baseTDEE = 2556; // Example TDEE for testing

    it('should apply correct surplus for strength goal', () => {
      const profile: UserNutritionProfile = {
        gender: 'male',
        weight_kg: 75,
        height_cm: 180,
        age: 28,
        pal_factor: 1.55,
        training_goal: 'strength',
      };

      const result = calculator.calculate(profile);

      // Strength: +250 kcal surplus
      expect(result.calorieAdjustment).toBe(250);
      expect(result.targetCalories).toBe(result.tdee + 250);
    });

    it('should apply correct surplus for muscle gain goal', () => {
      const profile: UserNutritionProfile = {
        gender: 'male',
        weight_kg: 75,
        height_cm: 180,
        age: 28,
        pal_factor: 1.55,
        training_goal: 'muscle_gain',
      };

      const result = calculator.calculate(profile);

      // Muscle gain: +400 kcal surplus
      expect(result.calorieAdjustment).toBe(400);
      expect(result.targetCalories).toBe(result.tdee + 400);
    });

    it('should apply correct deficit for weight loss goal', () => {
      const profile: UserNutritionProfile = {
        gender: 'male',
        weight_kg: 75,
        height_cm: 180,
        age: 28,
        pal_factor: 1.55,
        training_goal: 'weight_loss',
      };

      const result = calculator.calculate(profile);

      // Weight loss: -500 kcal deficit
      expect(result.calorieAdjustment).toBe(-500);
      expect(result.targetCalories).toBe(result.tdee - 500);
    });

    it('should limit deficit to max 25% of TDEE for low TDEE users', () => {
      const profile: UserNutritionProfile = {
        gender: 'female',
        weight_kg: 50,
        height_cm: 155,
        age: 35,
        pal_factor: 1.2, // Low activity = low TDEE
        training_goal: 'weight_loss',
      };

      const result = calculator.calculate(profile);

      // For very low TDEE (~1600), max deficit should be ~400 kcal (25%)
      // Not the full -500 kcal
      const deficitPercentage = Math.abs(result.calorieAdjustment / result.tdee);

      // Should be either -500 or capped at ~25%
      if (result.tdee < 2000) {
        expect(deficitPercentage).toBeLessThanOrEqual(0.30);
      }
    });

    it('should apply maintenance for endurance with slight surplus', () => {
      const profile: UserNutritionProfile = {
        gender: 'male',
        weight_kg: 70,
        height_cm: 175,
        age: 30,
        pal_factor: 1.725,
        training_goal: 'endurance',
      };

      const result = calculator.calculate(profile);

      // Endurance: +100 kcal slight surplus for recovery
      expect(result.calorieAdjustment).toBe(100);
    });

    it('should adapt general fitness goal based on body fat percentage', () => {
      const highBFProfile: UserNutritionProfile = {
        gender: 'male',
        weight_kg: 80,
        height_cm: 175,
        age: 30,
        pal_factor: 1.55,
        training_goal: 'general_fitness',
        body_fat_percentage: 25, // High BF% → deficit
      };

      const lowBFProfile: UserNutritionProfile = {
        gender: 'male',
        weight_kg: 70,
        height_cm: 175,
        age: 30,
        pal_factor: 1.55,
        training_goal: 'general_fitness',
        body_fat_percentage: 15, // Low BF% → maintenance
      };

      const highBFResult = calculator.calculate(highBFProfile);
      const lowBFResult = calculator.calculate(lowBFProfile);

      // High BF should get deficit
      expect(highBFResult.calorieAdjustment).toBeLessThan(0);

      // Low BF should get maintenance or slight surplus
      expect(lowBFResult.calorieAdjustment).toBeGreaterThanOrEqual(0);
    });
  });

  // ============================================================================
  // 4. PROTEIN CALCULATION TESTS
  // ============================================================================

  describe('Protein Calculations', () => {
    it('should calculate higher protein for weight loss than muscle gain', () => {
      const weightLossProfile: UserNutritionProfile = {
        gender: 'male',
        weight_kg: 70,
        height_cm: 175,
        age: 30,
        pal_factor: 1.55,
        training_goal: 'weight_loss',
      };

      const muscleGainProfile: UserNutritionProfile = {
        ...weightLossProfile,
        training_goal: 'muscle_gain',
      };

      const weightLossResult = calculator.calculate(weightLossProfile);
      const muscleGainResult = calculator.calculate(muscleGainProfile);

      // Weight loss: 2.2 g/kg, Muscle gain: 2.0 g/kg
      expect(weightLossResult.macros.protein_per_kg).toBeGreaterThan(
        muscleGainResult.macros.protein_per_kg
      );

      // Verify actual values
      expect(weightLossResult.macros.protein_per_kg).toBe(2.2);
      expect(muscleGainResult.macros.protein_per_kg).toBe(2.0);
    });

    it('should calculate protein in grams correctly', () => {
      const profile: UserNutritionProfile = {
        gender: 'male',
        weight_kg: 70,
        height_cm: 175,
        age: 30,
        pal_factor: 1.55,
        training_goal: 'muscle_gain',
      };

      const result = calculator.calculate(profile);

      // Muscle gain: 2.0 g/kg × 70 kg = 140g
      expect(result.macros.protein_g).toBe(140);
    });

    it('should use lower protein for endurance athletes', () => {
      const profile: UserNutritionProfile = {
        gender: 'male',
        weight_kg: 70,
        height_cm: 175,
        age: 30,
        pal_factor: 1.725,
        training_goal: 'endurance',
      };

      const result = calculator.calculate(profile);

      // Endurance: 1.5 g/kg (lowest)
      expect(result.macros.protein_per_kg).toBe(1.5);
    });
  });

  // ============================================================================
  // 5. CONFLICT DETECTION TESTS
  // ============================================================================

  describe('Conflict Detection', () => {
    it('should detect conflict: weight loss goal with higher target weight', () => {
      const profile: UserNutritionProfile = {
        gender: 'male',
        weight_kg: 80,
        height_cm: 175,
        age: 30,
        pal_factor: 1.55,
        training_goal: 'weight_loss',
        target_weight_kg: 85, // Want to lose weight but target is higher
      };

      const result = calculator.calculate(profile);

      expect(result.hasConflict).toBe(true);
      expect(result.warnings.length).toBeGreaterThan(0);
    });

    it('should detect conflict: muscle gain with lower target weight', () => {
      const profile: UserNutritionProfile = {
        gender: 'male',
        weight_kg: 70,
        height_cm: 175,
        age: 30,
        pal_factor: 1.55,
        training_goal: 'muscle_gain',
        target_weight_kg: 65, // Want to gain muscle but target is lower
      };

      const result = calculator.calculate(profile);

      expect(result.hasConflict).toBe(true);
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.recommendations.length).toBeGreaterThan(0);
    });

    it('should adjust to body recomposition for muscle gain + weight loss conflict', () => {
      const profile: UserNutritionProfile = {
        gender: 'male',
        weight_kg: 80,
        height_cm: 175,
        age: 30,
        pal_factor: 1.55,
        training_goal: 'muscle_gain',
        target_weight_kg: 75, // Lose 5kg while building muscle
      };

      const result = calculator.calculate(profile);

      expect(result.hasConflict).toBe(true);

      // Should adjust to smaller deficit
      expect(result.calorieAdjustment).toBeGreaterThan(-300);
      expect(result.calorieAdjustment).toBeLessThan(0);

      // Should use very high protein
      expect(result.macros.protein_per_kg).toBe(2.2);
    });

    it('should detect conflict: strength training with significant weight loss', () => {
      const profile: UserNutritionProfile = {
        gender: 'male',
        weight_kg: 90,
        height_cm: 175,
        age: 30,
        pal_factor: 1.55,
        training_goal: 'strength',
        target_weight_kg: 75, // Lose 15kg - significant
      };

      const result = calculator.calculate(profile);

      expect(result.hasConflict).toBe(true);
      expect(result.warnings.some(w => w.includes('Kraftzuwachs'))).toBe(true);
    });

    it('should NOT detect conflict when goal and target align', () => {
      const profile: UserNutritionProfile = {
        gender: 'male',
        weight_kg: 80,
        height_cm: 175,
        age: 30,
        pal_factor: 1.55,
        training_goal: 'weight_loss',
        target_weight_kg: 75, // Aligned - want to lose and target is lower
      };

      const result = calculator.calculate(profile);

      // May have warnings about timeline but no goal conflict
      expect(result.hasConflict).toBe(false);
    });
  });

  // ============================================================================
  // 6. TARGET WEIGHT TIMELINE TESTS
  // ============================================================================

  describe('Target Weight Timeline Validation', () => {
    it('should calculate realistic timeline for 5kg loss', () => {
      const profile: UserNutritionProfile = {
        gender: 'male',
        weight_kg: 80,
        height_cm: 175,
        age: 30,
        pal_factor: 1.55,
        training_goal: 'weight_loss',
        target_weight_kg: 75,
      };

      const result = calculator.calculate(profile);

      // 5kg loss at -0.5kg/week = 10 weeks
      expect(result.progression.weeksToGoal).toBe(10);
      expect(result.progression.expectedWeeklyChange).toBe(-0.5);
    });

    it('should warn about too aggressive weight loss goal', () => {
      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() + 35); // 5 weeks

      const profile: UserNutritionProfile = {
        gender: 'male',
        weight_kg: 80,
        height_cm: 175,
        age: 30,
        pal_factor: 1.55,
        training_goal: 'weight_loss',
        target_weight_kg: 70, // 10kg in 5 weeks = 2kg/week - too aggressive
        target_date: targetDate,
      };

      const result = calculator.calculate(profile);

      // Should have warnings about aggressive rate
      expect(result.warnings.some(w => w.includes('aggressiv'))).toBe(true);
      expect(result.warnings.some(w => w.includes('2') || w.includes('kg/Woche'))).toBe(true);
    });

    it('should warn if target date is in the past', () => {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - 10);

      const profile: UserNutritionProfile = {
        gender: 'male',
        weight_kg: 80,
        height_cm: 175,
        age: 30,
        pal_factor: 1.55,
        training_goal: 'weight_loss',
        target_weight_kg: 75,
        target_date: pastDate,
      };

      const result = calculator.calculate(profile);

      expect(result.warnings.some(w => w.includes('Vergangenheit'))).toBe(true);
    });

    it('should warn about too slow progress for weight loss', () => {
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 365); // 1 year

      const profile: UserNutritionProfile = {
        gender: 'male',
        weight_kg: 80,
        height_cm: 175,
        age: 30,
        pal_factor: 1.55,
        training_goal: 'weight_loss',
        target_weight_kg: 77, // Only 3kg in 1 year - very slow
        target_date: futureDate,
      };

      const result = calculator.calculate(profile);

      // Should warn about very slow progress potentially affecting motivation
      expect(result.warnings.some(w => w.includes('langsam'))).toBe(true);
    });

    it('should calculate estimated target date correctly', () => {
      const profile: UserNutritionProfile = {
        gender: 'male',
        weight_kg: 80,
        height_cm: 175,
        age: 30,
        pal_factor: 1.55,
        training_goal: 'weight_loss',
        target_weight_kg: 75,
      };

      const result = calculator.calculate(profile);

      expect(result.progression.estimatedTargetDate).toBeDefined();

      if (result.progression.estimatedTargetDate) {
        const today = new Date();
        const daysToGoal = Math.floor(
          (result.progression.estimatedTargetDate.getTime() - today.getTime()) /
          (1000 * 60 * 60 * 24)
        );

        // Should be approximately 70 days (10 weeks)
        expect(daysToGoal).toBeGreaterThanOrEqual(65);
        expect(daysToGoal).toBeLessThanOrEqual(75);
      }
    });
  });

  // ============================================================================
  // 7. MACRO DISTRIBUTION TESTS
  // ============================================================================

  describe('Macro Distribution Validation', () => {
    it('should ensure macros sum to total calories within tolerance', () => {
      const profile: UserNutritionProfile = {
        gender: 'male',
        weight_kg: 75,
        height_cm: 180,
        age: 28,
        pal_factor: 1.55,
        training_goal: 'muscle_gain',
      };

      const result = calculator.calculate(profile);

      const proteinCalories = result.macros.protein_g * 4;
      const carbsCalories = result.macros.carbs_g * 4;
      const fatCalories = result.macros.fat_g * 9;
      const totalMacroCalories = proteinCalories + carbsCalories + fatCalories;

      // Should be within 10 kcal tolerance
      expect(Math.abs(totalMacroCalories - result.targetCalories)).toBeLessThanOrEqual(10);
    });

    it('should ensure fat is 25-30% of calories', () => {
      const profile: UserNutritionProfile = {
        gender: 'male',
        weight_kg: 75,
        height_cm: 180,
        age: 28,
        pal_factor: 1.55,
        training_goal: 'strength',
      };

      const result = calculator.calculate(profile);

      const fatCalories = result.macros.fat_g * 9;
      const fatPercentage = (fatCalories / result.targetCalories) * 100;

      // Fat should be around 27% (target)
      expect(fatPercentage).toBeGreaterThanOrEqual(25);
      expect(fatPercentage).toBeLessThanOrEqual(30);
    });

    it('should calculate higher carbs for endurance athletes', () => {
      const enduranceProfile: UserNutritionProfile = {
        gender: 'male',
        weight_kg: 70,
        height_cm: 175,
        age: 30,
        pal_factor: 1.725,
        training_goal: 'endurance',
      };

      const strengthProfile: UserNutritionProfile = {
        ...enduranceProfile,
        training_goal: 'strength',
      };

      const enduranceResult = calculator.calculate(enduranceProfile);
      const strengthResult = calculator.calculate(strengthProfile);

      // Endurance should have higher carb percentage
      expect(enduranceResult.macros.carbs_percentage).toBeGreaterThan(
        strengthResult.macros.carbs_percentage
      );
    });

    it('should return integer values for all macro grams', () => {
      const profile: UserNutritionProfile = {
        gender: 'female',
        weight_kg: 60,
        height_cm: 165,
        age: 25,
        pal_factor: 1.55,
        training_goal: 'general_fitness',
      };

      const result = calculator.calculate(profile);

      expect(Number.isInteger(result.macros.protein_g)).toBe(true);
      expect(Number.isInteger(result.macros.carbs_g)).toBe(true);
      expect(Number.isInteger(result.macros.fat_g)).toBe(true);
    });
  });

  // ============================================================================
  // 8. CALCULATION METHOD GENERATION TESTS
  // ============================================================================

  describe('Calculation Method Generation', () => {
    it('should generate complete calculation method with all fields', () => {
      const profile: UserNutritionProfile = {
        gender: 'male',
        weight_kg: 75,
        height_cm: 180,
        age: 28,
        pal_factor: 1.55,
        training_goal: 'muscle_gain',
      };

      const result = calculator.calculate(profile);

      expect(result.calculationMethod).toBeDefined();
      expect(result.calculationMethod.bmrFormula).toBe('mifflin_st_jeor');
      expect(result.calculationMethod.bmrCalculation).toBeDefined();
      expect(result.calculationMethod.palFactor).toBe(1.55);
      expect(result.calculationMethod.palDescription).toBeDefined();
      expect(result.calculationMethod.goalAdjustment).toBeDefined();
      expect(result.calculationMethod.proteinRationale).toBeDefined();
      expect(result.calculationMethod.sources).toBeDefined();
    });

    it('should include actual values in BMR calculation string', () => {
      const profile: UserNutritionProfile = {
        gender: 'male',
        weight_kg: 70,
        height_cm: 175,
        age: 30,
        pal_factor: 1.55,
        training_goal: 'strength',
      };

      const result = calculator.calculate(profile);

      const bmrCalc = result.calculationMethod.bmrCalculation;

      // Should contain actual values
      expect(bmrCalc).toContain('70');
      expect(bmrCalc).toContain('175');
      expect(bmrCalc).toContain('30');
      expect(bmrCalc).toContain(result.bmr.toLocaleString('de-DE'));
    });

    it('should include DOI links in sources', () => {
      const profile: UserNutritionProfile = {
        gender: 'male',
        weight_kg: 75,
        height_cm: 180,
        age: 28,
        pal_factor: 1.55,
        training_goal: 'weight_loss',
      };

      const result = calculator.calculate(profile);

      expect(result.calculationMethod.sources.formula).toContain('doi.org');
      expect(result.calculationMethod.sources.goalRecommendation).toContain('doi.org');
      expect(result.calculationMethod.sources.proteinRecommendation).toContain('doi.org');
    });

    it('should correctly identify goal adjustment type', () => {
      const deficitProfile: UserNutritionProfile = {
        gender: 'male',
        weight_kg: 75,
        height_cm: 180,
        age: 28,
        pal_factor: 1.55,
        training_goal: 'weight_loss',
      };

      const surplusProfile: UserNutritionProfile = {
        ...deficitProfile,
        training_goal: 'muscle_gain',
      };

      const deficitResult = calculator.calculate(deficitProfile);
      const surplusResult = calculator.calculate(surplusProfile);

      expect(deficitResult.calculationMethod.goalAdjustment.type).toBe('deficit');
      expect(surplusResult.calculationMethod.goalAdjustment.type).toBe('surplus');
    });
  });

  // ============================================================================
  // 9. EDGE CASES
  // ============================================================================

  describe('Edge Cases', () => {
    it('should handle very young user (18)', () => {
      const profile: UserNutritionProfile = {
        gender: 'male',
        weight_kg: 70,
        height_cm: 175,
        age: 18,
        pal_factor: 1.55,
        training_goal: 'muscle_gain',
      };

      const result = calculator.calculate(profile);

      expect(result.bmr).toBeGreaterThan(0);
      expect(result.tdee).toBeGreaterThan(result.bmr);
      expect(result.targetCalories).toBeGreaterThan(0);
    });

    it('should handle elderly user (80)', () => {
      const profile: UserNutritionProfile = {
        gender: 'female',
        weight_kg: 60,
        height_cm: 160,
        age: 80,
        pal_factor: 1.2,
        training_goal: 'general_fitness',
      };

      const result = calculator.calculate(profile);

      expect(result.bmr).toBeGreaterThan(0);
      expect(result.tdee).toBeGreaterThan(result.bmr);
      expect(result.targetCalories).toBeGreaterThan(0);
    });

    it('should handle very low weight user (45kg)', () => {
      const profile: UserNutritionProfile = {
        gender: 'female',
        weight_kg: 45,
        height_cm: 155,
        age: 25,
        pal_factor: 1.375,
        training_goal: 'general_fitness',
      };

      const result = calculator.calculate(profile);

      expect(result.bmr).toBeGreaterThan(0);
      expect(result.macros.protein_g).toBeGreaterThan(0);

      // Should not create unhealthy deficit
      expect(result.targetCalories).toBeGreaterThan(1200);
    });

    it('should handle very high weight user (150kg)', () => {
      const profile: UserNutritionProfile = {
        gender: 'male',
        weight_kg: 150,
        height_cm: 190,
        age: 35,
        pal_factor: 1.375,
        training_goal: 'weight_loss',
      };

      const result = calculator.calculate(profile);

      expect(result.bmr).toBeGreaterThan(0);
      expect(result.tdee).toBeGreaterThan(result.bmr);

      // Should still apply -500 deficit even for high weight
      expect(result.calorieAdjustment).toBe(-500);
    });

    it('should handle extremely high PAL (1.9)', () => {
      const profile: UserNutritionProfile = {
        gender: 'male',
        weight_kg: 75,
        height_cm: 180,
        age: 25,
        pal_factor: 1.9, // Athlete training 2x/day
        training_goal: 'endurance',
      };

      const result = calculator.calculate(profile);

      expect(result.tdee).toBeGreaterThan(result.bmr * 1.85);
      expect(result.tdee).toBeLessThan(result.bmr * 1.95);
    });

    it('should handle missing optional fields gracefully', () => {
      const profile: UserNutritionProfile = {
        gender: 'male',
        weight_kg: 75,
        height_cm: 180,
        age: 28,
        pal_factor: 1.55,
        training_goal: 'general_fitness',
        // No target_weight_kg, target_date, or body_fat_percentage
      };

      const result = calculator.calculate(profile);

      expect(result.bmr).toBeGreaterThan(0);
      expect(result.tdee).toBeGreaterThan(0);
      expect(result.hasConflict).toBe(false);
      expect(result.progression.weeksToGoal).toBeUndefined();
    });
  });

  // ============================================================================
  // 10. INTEGRATION TESTS
  // ============================================================================

  describe('Integration Tests', () => {
    it('should perform complete calculation flow without errors', () => {
      const profile: UserNutritionProfile = {
        gender: 'male',
        weight_kg: 75,
        height_cm: 180,
        age: 28,
        pal_factor: 1.55,
        training_goal: 'muscle_gain',
        target_weight_kg: 80,
        target_date: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days from now
        body_fat_percentage: 15,
      };

      const result = calculator.calculate(profile);

      // Verify all major sections are populated
      expect(result.bmr).toBeGreaterThan(0);
      expect(result.tdee).toBeGreaterThan(0);
      expect(result.targetCalories).toBeGreaterThan(0);
      expect(result.calorieAdjustment).not.toBe(0);

      expect(result.macros.protein_g).toBeGreaterThan(0);
      expect(result.macros.carbs_g).toBeGreaterThan(0);
      expect(result.macros.fat_g).toBeGreaterThan(0);

      expect(result.progression.expectedWeeklyChange).not.toBe(0);
      expect(result.progression.weeksToGoal).toBeDefined();
      expect(result.progression.estimatedTargetDate).toBeDefined();

      expect(result.calculationMethod).toBeDefined();
      expect(result.recommendations.length).toBeGreaterThan(0);
    });

    it('should handle conflicting goals and still produce valid output', () => {
      const profile: UserNutritionProfile = {
        gender: 'male',
        weight_kg: 80,
        height_cm: 175,
        age: 30,
        pal_factor: 1.55,
        training_goal: 'muscle_gain',
        target_weight_kg: 70, // Conflict: want to gain muscle but lose weight
      };

      const result = calculator.calculate(profile);

      expect(result.hasConflict).toBe(true);
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.recommendations.length).toBeGreaterThan(0);

      // Should still produce valid targets
      expect(result.targetCalories).toBeGreaterThan(0);
      expect(result.macros.protein_g).toBeGreaterThan(0);
    });

    it('should maintain consistency across multiple calculations', () => {
      const profile: UserNutritionProfile = {
        gender: 'male',
        weight_kg: 75,
        height_cm: 180,
        age: 28,
        pal_factor: 1.55,
        training_goal: 'strength',
      };

      const result1 = calculator.calculate(profile);
      const result2 = calculator.calculate(profile);

      // Same input should produce identical results
      expect(result1.bmr).toBe(result2.bmr);
      expect(result1.tdee).toBe(result2.tdee);
      expect(result1.targetCalories).toBe(result2.targetCalories);
      expect(result1.macros.protein_g).toBe(result2.macros.protein_g);
    });

    it('should produce different results for different training goals', () => {
      const baseProfile: UserNutritionProfile = {
        gender: 'male',
        weight_kg: 75,
        height_cm: 180,
        age: 28,
        pal_factor: 1.55,
        training_goal: 'strength',
      };

      const goals: TrainingGoal[] = [
        'strength',
        'muscle_gain',
        'weight_loss',
        'endurance',
        'general_fitness',
      ];

      const results = goals.map(goal =>
        calculator.calculate({ ...baseProfile, training_goal: goal })
      );

      // All should have same BMR and TDEE
      const bmr = results[0].bmr;
      const tdee = results[0].tdee;
      results.forEach(result => {
        expect(result.bmr).toBe(bmr);
        expect(result.tdee).toBe(tdee);
      });

      // But different target calories
      const targetCalories = results.map(r => r.targetCalories);
      const uniqueCalories = new Set(targetCalories);
      expect(uniqueCalories.size).toBeGreaterThan(1);
    });
  });
});
