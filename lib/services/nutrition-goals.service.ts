/**
 * Nutrition Goals Service
 *
 * Handles all database operations for user nutrition goals including:
 * - Creating and updating nutrition goals
 * - Calculating calorie and macro targets
 * - Tracking goal history
 * - TDEE calibration based on actual results
 */

import { supabase } from '../../src/lib/supabase';
import { NutritionCalculatorService } from './nutrition-calculator.service';
import type {
  UserNutritionGoal,
  UserNutritionProfile,
  CalculationMethod,
  TrainingGoal,
  Gender,
} from '../types/nutrition.types';

/**
 * Input type for creating a new nutrition goal
 * Contains only user-provided data (calculated fields are auto-generated)
 */
export interface CreateNutritionGoalInput {
  weight_kg: number;
  height_cm: number;
  age: number;
  gender: Gender;
  target_weight_kg?: number;
  target_date?: Date;
  training_goal: TrainingGoal;
  pal_factor: number;
  body_fat_percentage?: number;
}

/**
 * Result of TDEE calibration based on real-world data
 */
export interface TDEECalibrationResult {
  calibratedTDEE: number;
  calculatedTDEE: number;
  adjustment: number;
  adjustmentPercentage: number;
  dataPoints: number;
  averageCalories: number;
  weightChange: number;
  recommendation: string;
  confidence: 'low' | 'medium' | 'high';
}

/**
 * Service class for managing nutrition goals in Supabase
 */
export class NutritionGoalsService {
  private calculator = new NutritionCalculatorService();

  /**
   * Create a new nutrition goal with calculated targets
   *
   * Process:
   * 1. Validates input data
   * 2. Calculates BMR, TDEE, and macros using NutritionCalculatorService
   * 3. Deactivates previous goals (sets is_active = false)
   * 4. Inserts new goal with is_active = true
   *
   * @param userId - User's UUID from auth.users
   * @param data - User's nutrition profile input
   * @returns Created nutrition goal with all calculated fields
   * @throws Error if validation fails or database operation fails
   */
  async createNutritionGoal(
    userId: string,
    data: CreateNutritionGoalInput
  ): Promise<UserNutritionGoal> {
    try {
      // Step 1: Validate input
      this.validateNutritionGoalInput(data);

      // Step 2: Build profile for calculation
      const profile: UserNutritionProfile = {
        weight_kg: data.weight_kg,
        height_cm: data.height_cm,
        age: data.age,
        gender: data.gender,
        target_weight_kg: data.target_weight_kg,
        target_date: data.target_date,
        training_goal: data.training_goal,
        pal_factor: data.pal_factor,
        body_fat_percentage: data.body_fat_percentage,
      };

      // Step 3: Calculate all targets
      const calculationResult = this.calculator.calculate(profile);

      // Step 4: Deactivate previous goals
      const { error: deactivateError } = await supabase
        .from('user_nutrition_goals')
        .update({ is_active: false })
        .eq('user_id', userId)
        .eq('is_active', true);

      if (deactivateError) {
        console.error('Error deactivating previous goals:', deactivateError);
        throw new Error(
          `Fehler beim Deaktivieren vorheriger Ziele: ${deactivateError.message}`
        );
      }

      // Step 5: Prepare goal data for insertion
      // Map to correct database column names
      const goalData = {
        user_id: userId,
        current_weight_kg: data.weight_kg,
        height_cm: data.height_cm,
        age: data.age,
        gender: data.gender,
        target_weight_kg: data.target_weight_kg ?? null,
        target_date: data.target_date?.toISOString().split('T')[0] ?? null, // DATE format (YYYY-MM-DD)
        training_goal: data.training_goal,
        pal_factor: data.pal_factor,
        body_fat_percentage: data.body_fat_percentage ?? null,
        bmr_mifflin: calculationResult.bmr,
        tdee_calculated: calculationResult.tdee,
        tdee_calibrated: null, // Will be set after calibration
        target_calories: calculationResult.targetCalories,
        calorie_adjustment: calculationResult.calorieAdjustment,
        protein_g_target: calculationResult.macros.protein_g,
        protein_per_kg: calculationResult.macros.protein_per_kg,
        carbs_g_target: calculationResult.macros.carbs_g,
        carbs_percentage: calculationResult.macros.carbs_percentage,
        fat_g_target: calculationResult.macros.fat_g,
        fat_percentage: calculationResult.macros.fat_percentage,
        expected_weekly_weight_change_kg: calculationResult.progression.expectedWeeklyChange,
        weeks_to_goal: calculationResult.progression.weeksToGoal ?? null,
        has_goal_conflict: calculationResult.hasConflict,
        conflict_warning: calculationResult.warnings.length > 0 ? calculationResult.warnings.join(' ') : null,
        recommendations: calculationResult.recommendations,
        calculation_method: calculationResult.calculationMethod,
        is_active: true,
      };

      // Step 6: Insert new goal
      const { data: createdGoal, error: insertError } = await supabase
        .from('user_nutrition_goals')
        .insert(goalData)
        .select()
        .single();

      if (insertError) {
        console.error('Error creating nutrition goal:', insertError);
        throw new Error(
          `Fehler beim Erstellen des Ernährungsziels: ${insertError.message}`
        );
      }

      return createdGoal;
    } catch (error) {
      console.error('Error in createNutritionGoal:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Unbekannter Fehler beim Erstellen des Ernährungsziels');
    }
  }

  /**
   * Get user's currently active nutrition goal
   *
   * @param userId - User's UUID
   * @returns Active nutrition goal or null if none exists
   * @throws Error if database query fails
   */
  async getCurrentNutritionGoal(
    userId: string
  ): Promise<UserNutritionGoal | null> {
    try {
      const { data, error } = await supabase
        .from('user_nutrition_goals')
        .select('*')
        .eq('user_id', userId)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('Error fetching current nutrition goal:', error);
        throw new Error(
          `Fehler beim Laden des aktuellen Ziels: ${error.message}`
        );
      }

      return data;
    } catch (error) {
      console.error('Error in getCurrentNutritionGoal:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Unbekannter Fehler beim Laden des Ernährungsziels');
    }
  }

  /**
   * Update an existing nutrition goal
   *
   * If key fields change (weight, goal, pal_factor), recalculates all targets
   *
   * @param goalId - UUID of goal to update
   * @param updates - Partial updates to apply
   * @returns Updated nutrition goal
   * @throws Error if goal not found or update fails
   */
  async updateNutritionGoal(
    goalId: string,
    updates: Partial<CreateNutritionGoalInput>
  ): Promise<UserNutritionGoal> {
    try {
      // Step 1: Fetch existing goal
      const { data: existingGoal, error: fetchError } = await supabase
        .from('user_nutrition_goals')
        .select('*')
        .eq('id', goalId)
        .single();

      if (fetchError || !existingGoal) {
        throw new Error('Ernährungsziel nicht gefunden');
      }

      // Step 2: Check if recalculation is needed
      const needsRecalculation =
        updates.weight_kg !== undefined ||
        updates.height_cm !== undefined ||
        updates.age !== undefined ||
        updates.gender !== undefined ||
        updates.training_goal !== undefined ||
        updates.pal_factor !== undefined ||
        updates.target_weight_kg !== undefined ||
        updates.target_date !== undefined ||
        updates.body_fat_percentage !== undefined;

      let updateData: Partial<typeof existingGoal> = {
        ...updates,
        target_date: updates.target_date?.toISOString() ?? existingGoal.target_date,
      };

      // Step 3: Recalculate if necessary
      if (needsRecalculation) {
        const profile: UserNutritionProfile = {
          weight_kg: updates.weight_kg ?? existingGoal.weight_kg,
          height_cm: updates.height_cm ?? existingGoal.height_cm,
          age: updates.age ?? existingGoal.age,
          gender: updates.gender ?? existingGoal.gender,
          target_weight_kg: updates.target_weight_kg ?? existingGoal.target_weight_kg ?? undefined,
          target_date: updates.target_date
            ? updates.target_date
            : existingGoal.target_date
              ? new Date(existingGoal.target_date)
              : undefined,
          training_goal: updates.training_goal ?? existingGoal.training_goal,
          pal_factor: updates.pal_factor ?? existingGoal.pal_factor,
          body_fat_percentage:
            updates.body_fat_percentage ?? existingGoal.body_fat_percentage ?? undefined,
        };

        const calculationResult = this.calculator.calculate(profile);

        updateData = {
          ...updateData,
          bmr: calculationResult.bmr,
          tdee: calculationResult.tdee,
          target_calories: calculationResult.targetCalories,
          target_protein_g: calculationResult.macros.protein_g,
          target_carbs_g: calculationResult.macros.carbs_g,
          target_fat_g: calculationResult.macros.fat_g,
          expected_weekly_change: calculationResult.progression.expectedWeeklyChange,
          weeks_to_goal: calculationResult.progression.weeksToGoal ?? null,
          has_conflict: calculationResult.hasConflict,
          warnings: calculationResult.warnings,
          recommendations: calculationResult.recommendations,
          calculation_method: calculationResult.calculationMethod,
        };
      }

      // Step 4: Update goal
      const { data: updatedGoal, error: updateError } = await supabase
        .from('user_nutrition_goals')
        .update(updateData)
        .eq('id', goalId)
        .select()
        .single();

      if (updateError) {
        console.error('Error updating nutrition goal:', updateError);
        throw new Error(
          `Fehler beim Aktualisieren des Ziels: ${updateError.message}`
        );
      }

      return updatedGoal;
    } catch (error) {
      console.error('Error in updateNutritionGoal:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Unbekannter Fehler beim Aktualisieren des Ziels');
    }
  }

  /**
   * Get user's nutrition goal history
   *
   * @param userId - User's UUID
   * @param limit - Maximum number of goals to return
   * @returns Array of nutrition goals, sorted by creation date (newest first)
   * @throws Error if database query fails
   */
  async getNutritionGoalHistory(
    userId: string,
    limit = 10
  ): Promise<UserNutritionGoal[]> {
    try {
      const { data, error } = await supabase
        .from('user_nutrition_goals')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) {
        console.error('Error fetching nutrition goal history:', error);
        throw new Error(
          `Fehler beim Laden der Ziel-Historie: ${error.message}`
        );
      }

      return data || [];
    } catch (error) {
      console.error('Error in getNutritionGoalHistory:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Unbekannter Fehler beim Laden der Ziel-Historie');
    }
  }

  /**
   * Calibrate TDEE based on actual results from the last 4 weeks
   *
   * Uses real-world data to adjust calculated TDEE:
   * - Actual calorie intake from nutrition logs
   * - Actual weight change from body measurements
   *
   * Formula:
   * daily_surplus_or_deficit = (weight_change_kg × 7700 kcal) / 28 days
   * calibrated_TDEE = avg_calories - daily_surplus_or_deficit
   *
   * @param userId - User's UUID
   * @returns Calibration result with adjusted TDEE and recommendations
   * @throws Error if insufficient data or database query fails
   */
  async calibrateTDEE(userId: string): Promise<TDEECalibrationResult> {
    try {
      const fourWeeksAgo = new Date();
      fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);

      // Step 1: Get current nutrition goal for calculated TDEE
      const currentGoal = await this.getCurrentNutritionGoal(userId);
      if (!currentGoal) {
        throw new Error('Kein aktives Ernährungsziel gefunden');
      }

      // Step 2: Fetch nutrition logs from last 4 weeks
      const { data: nutritionLogs, error: logsError } = await supabase
        .from('daily_nutrition_log')
        .select('total_calories, log_date')
        .eq('user_id', userId)
        .gte('log_date', fourWeeksAgo.toISOString())
        .order('log_date', { ascending: true });

      if (logsError) {
        throw new Error(
          `Fehler beim Laden der Ernährungsdaten: ${logsError.message}`
        );
      }

      if (!nutritionLogs || nutritionLogs.length < 14) {
        throw new Error(
          'Nicht genügend Daten für Kalibrierung (mindestens 14 Tage benötigt)'
        );
      }

      // Step 3: Fetch weight measurements from last 4 weeks
      const { data: measurements, error: measurementsError } = await supabase
        .from('body_measurements')
        .select('weight_kg, measured_at')
        .eq('user_id', userId)
        .gte('measured_at', fourWeeksAgo.toISOString())
        .order('measured_at', { ascending: true });

      if (measurementsError) {
        throw new Error(
          `Fehler beim Laden der Körpermessungen: ${measurementsError.message}`
        );
      }

      if (!measurements || measurements.length < 2) {
        throw new Error(
          'Nicht genügend Gewichtsmessungen (mindestens 2 benötigt)'
        );
      }

      // Step 4: Calculate average calories
      const totalCalories = nutritionLogs.reduce(
        (sum, log) => sum + (log.total_calories || 0),
        0
      );
      const averageCalories = totalCalories / nutritionLogs.length;

      // Step 5: Calculate weight change
      const firstWeight = measurements[0].weight_kg;
      const lastWeight = measurements[measurements.length - 1].weight_kg;
      const weightChange = lastWeight - firstWeight;

      // Step 6: Calculate daily calorie surplus/deficit from weight change
      // 1 kg fat = ~7700 kcal
      const daysTracked = nutritionLogs.length;
      const dailyCalorieEffect = (weightChange * 7700) / daysTracked;

      // Step 7: Calculate calibrated TDEE
      // If weight went up, avg_calories was above TDEE
      // If weight went down, avg_calories was below TDEE
      const calibratedTDEE = Math.round(averageCalories - dailyCalorieEffect);
      const calculatedTDEE = currentGoal.tdee_calibrated ?? currentGoal.tdee;
      const adjustment = calibratedTDEE - calculatedTDEE;
      const adjustmentPercentage = (adjustment / calculatedTDEE) * 100;

      // Step 8: Determine confidence level
      const confidence = this.determineCalibrationConfidence(
        nutritionLogs.length,
        measurements.length,
        Math.abs(adjustmentPercentage)
      );

      // Step 9: Generate recommendation
      const recommendation = this.generateCalibrationRecommendation(
        adjustment,
        adjustmentPercentage,
        confidence,
        weightChange,
        currentGoal.training_goal
      );

      // Step 10: Update goal with calibrated TDEE
      await supabase
        .from('user_nutrition_goals')
        .update({
          tdee_calibrated: calibratedTDEE,
          last_calibration_date: new Date().toISOString(),
        })
        .eq('id', currentGoal.id);

      return {
        calibratedTDEE,
        calculatedTDEE,
        adjustment,
        adjustmentPercentage: Math.round(adjustmentPercentage * 10) / 10,
        dataPoints: nutritionLogs.length,
        averageCalories: Math.round(averageCalories),
        weightChange: Math.round(weightChange * 100) / 100,
        recommendation,
        confidence,
      };
    } catch (error) {
      console.error('Error in calibrateTDEE:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Unbekannter Fehler bei der TDEE-Kalibrierung');
    }
  }

  /**
   * Get detailed calculation method explanation for a goal
   *
   * Returns the stored calculation methodology so users can understand
   * how their targets were determined
   *
   * @param goalId - UUID of nutrition goal
   * @returns Calculation method details
   * @throws Error if goal not found
   */
  async getCalculationMethodExplanation(
    goalId: string
  ): Promise<CalculationMethod> {
    try {
      const { data, error } = await supabase
        .from('user_nutrition_goals')
        .select('calculation_method')
        .eq('id', goalId)
        .single();

      if (error || !data) {
        throw new Error('Ernährungsziel nicht gefunden');
      }

      return data.calculation_method as CalculationMethod;
    } catch (error) {
      console.error('Error in getCalculationMethodExplanation:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error(
        'Unbekannter Fehler beim Laden der Berechnungsmethode'
      );
    }
  }

  /**
   * Validate nutrition goal input data
   * @throws Error if validation fails
   */
  private validateNutritionGoalInput(data: CreateNutritionGoalInput): void {
    if (data.weight_kg <= 0 || data.weight_kg > 300) {
      throw new Error('Gewicht muss zwischen 0 und 300 kg liegen');
    }

    if (data.height_cm <= 0 || data.height_cm > 250) {
      throw new Error('Größe muss zwischen 0 und 250 cm liegen');
    }

    if (data.age <= 0 || data.age > 120) {
      throw new Error('Alter muss zwischen 0 und 120 Jahren liegen');
    }

    if (data.pal_factor < 1.2 || data.pal_factor > 2.5) {
      throw new Error('PAL-Faktor muss zwischen 1.2 und 2.5 liegen');
    }

    if (data.body_fat_percentage !== undefined) {
      if (data.body_fat_percentage < 3 || data.body_fat_percentage > 60) {
        throw new Error('Körperfettanteil muss zwischen 3% und 60% liegen');
      }
    }

    if (data.target_weight_kg !== undefined) {
      if (data.target_weight_kg <= 0 || data.target_weight_kg > 300) {
        throw new Error('Zielgewicht muss zwischen 0 und 300 kg liegen');
      }
    }

    if (data.target_date !== undefined) {
      const today = new Date();
      if (data.target_date < today) {
        throw new Error('Zieldatum kann nicht in der Vergangenheit liegen');
      }
    }
  }

  /**
   * Determine confidence level for TDEE calibration
   */
  private determineCalibrationConfidence(
    nutritionDataPoints: number,
    weightDataPoints: number,
    adjustmentPercentage: number
  ): 'low' | 'medium' | 'high' {
    // High confidence: lots of data, small adjustment needed
    if (
      nutritionDataPoints >= 25 &&
      weightDataPoints >= 8 &&
      adjustmentPercentage < 10
    ) {
      return 'high';
    }

    // Low confidence: little data or massive adjustment (indicates inconsistency)
    if (
      nutritionDataPoints < 20 ||
      weightDataPoints < 4 ||
      adjustmentPercentage > 20
    ) {
      return 'low';
    }

    return 'medium';
  }

  /**
   * Generate calibration recommendation based on results
   */
  private generateCalibrationRecommendation(
    adjustment: number,
    adjustmentPercentage: number,
    confidence: string,
    weightChange: number,
    trainingGoal: TrainingGoal
  ): string {
    const absAdjustment = Math.abs(adjustment);

    // Small adjustment - good accuracy
    if (absAdjustment < 100) {
      return `Dein berechneter TDEE war sehr genau! Nur ${absAdjustment} kcal Anpassung nötig. Behalte deinen aktuellen Plan bei.`;
    }

    // Medium adjustment
    if (absAdjustment < 300) {
      const direction = adjustment > 0 ? 'höher' : 'niedriger';
      return `Dein tatsächlicher TDEE ist ${absAdjustment} kcal ${direction} als berechnet. Plan wurde angepasst. ${confidence === 'high' ? 'Hohe Datenqualität!' : 'Sammle weiter Daten für mehr Genauigkeit.'}`;
    }

    // Large adjustment - investigate
    const direction = adjustment > 0 ? 'höher' : 'niedriger';
    let recommendation = `Großer Unterschied: Dein TDEE ist ${absAdjustment} kcal ${direction} als berechnet (${adjustmentPercentage.toFixed(1)}%). `;

    if (confidence === 'low') {
      recommendation +=
        'Niedrige Datenqualität - bitte tracke konsequenter für 2-3 weitere Wochen.';
    } else if (Math.abs(weightChange) > 3) {
      recommendation +=
        'Starke Gewichtsveränderung kann Wasserschwankungen beinhalten. Beobachte weitere 2 Wochen.';
    } else {
      recommendation +=
        'Möglicherweise hat sich deine Aktivität verändert oder du hast deinen PAL-Faktor falsch eingeschätzt.';
    }

    return recommendation;
  }
}

// Export singleton instance
export const nutritionGoalsService = new NutritionGoalsService();
