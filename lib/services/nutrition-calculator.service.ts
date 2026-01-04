/**
 * Nutrition Calculator Service
 *
 * Evidence-based calorie and macronutrient calculations for personalized nutrition planning.
 *
 * Scientific foundations:
 * - BMR: Mifflin-St Jeor Equation (DOI: 10.1093/ajcn/51.2.241)
 * - Protein: ISSN Position Stand (DOI: 10.1186/s12970-017-0177-8)
 * - Deficit limits: Sports Medicine Review (DOI: 10.1111/sms.14075)
 * - Protein in deficit: Clinical Nutrition Review (DOI: 10.1097/MCO.0000000000000980)
 */

import type {
  UserNutritionProfile,
  CalorieCalculationResult,
  CalculationMethod,
  TrainingGoal,
} from '../types/nutrition.types';

interface GoalSettings {
  adjustment: number;           // Calorie surplus/deficit (kcal/day)
  proteinPerKg: number;         // Protein intake (g/kg body weight)
  expectedWeeklyChange: number; // Expected weight change (kg/week)
  carbsPercentage?: number;     // Optional carbs target (% of calories)
  rationale: string;            // Scientific justification
  additionalInfo?: string;      // Extra recommendations
}

interface ConflictAnalysis {
  hasConflict: boolean;
  warnings: string[];
  recommendations: string[];
  adjustedSettings?: GoalSettings;
}

export class NutritionCalculatorService {
  /**
   * Main calculation method - orchestrates all nutrition calculations
   *
   * @param profile - User's comprehensive nutrition profile
   * @returns Complete calculation result with targets, macros, and recommendations
   */
  public calculate(profile: UserNutritionProfile): CalorieCalculationResult {
    // Step 1: Calculate Basal Metabolic Rate
    const bmr = this.calculateBMR(profile);

    // Step 2: Calculate Total Daily Energy Expenditure
    const tdee = this.calculateTDEE(bmr, profile.pal_factor);

    // Step 3: Get goal-specific settings
    let goalSettings = this.getGoalSettings(
      profile.training_goal,
      profile.body_fat_percentage,
      profile.gender
    );

    // Step 4: Detect and resolve conflicts
    const conflictAnalysis = this.detectConflicts(profile, goalSettings);
    if (conflictAnalysis.adjustedSettings) {
      goalSettings = conflictAnalysis.adjustedSettings;
    }

    // Step 5: Calculate target calories
    let targetCalories = tdee + goalSettings.adjustment;

    // Step 6: If target weight and date are specified, validate against timeline
    const progressionData = this.calculateProgression(
      profile,
      tdee,
      targetCalories,
      goalSettings.expectedWeeklyChange
    );

    // Step 7: Calculate macronutrient targets
    const macros = this.calculateMacros(
      targetCalories,
      goalSettings.proteinPerKg,
      profile.weight_kg,
      goalSettings.carbsPercentage
    );

    // Step 8: Generate detailed calculation methodology
    const calculationMethod = this.generateCalculationMethod(
      profile,
      bmr,
      tdee,
      targetCalories,
      goalSettings
    );

    // Step 9: Compile all recommendations and warnings
    const allRecommendations = [
      ...conflictAnalysis.recommendations,
      ...this.generateRecommendations(profile, goalSettings, macros),
    ];

    const allWarnings = [
      ...conflictAnalysis.warnings,
      ...progressionData.warnings,
    ];

    return {
      bmr,
      tdee,
      targetCalories,
      calorieAdjustment: goalSettings.adjustment,
      macros,
      progression: {
        expectedWeeklyChange: goalSettings.expectedWeeklyChange,
        weeksToGoal: progressionData.weeksToGoal,
        estimatedTargetDate: progressionData.estimatedTargetDate,
      },
      warnings: allWarnings,
      recommendations: allRecommendations,
      hasConflict: conflictAnalysis.hasConflict,
      calculationMethod,
    };
  }

  /**
   * Calculate Basal Metabolic Rate using Mifflin-St Jeor equation
   *
   * The most accurate formula for modern populations (validated 1990)
   * More accurate than Harris-Benedict for current body compositions
   *
   * Reference: Mifflin et al., 1990 (DOI: 10.1093/ajcn/51.2.241)
   *
   * Men: BMR = (10 × weight[kg]) + (6.25 × height[cm]) - (5 × age) + 5
   * Women: BMR = (10 × weight[kg]) + (6.25 × height[cm]) - (5 × age) - 161
   */
  private calculateBMR(profile: UserNutritionProfile): number {
    const { weight_kg, height_cm, age, gender } = profile;

    const baseCalculation =
      10 * weight_kg + 6.25 * height_cm - 5 * age;

    const bmr = gender === 'male'
      ? baseCalculation + 5
      : baseCalculation - 161;

    return Math.round(bmr);
  }

  /**
   * Calculate Total Daily Energy Expenditure
   *
   * TDEE represents total calories burned per day including all activity
   * Uses PAL (Physical Activity Level) factor from WHO/FAO/UNU guidelines
   *
   * Reference: WHO Human energy requirements (2001), ISBN: 92-5-105212-3
   */
  private calculateTDEE(bmr: number, palFactor: number): number {
    return Math.round(bmr * palFactor);
  }

  /**
   * Get goal-specific calorie adjustments and protein targets
   *
   * Based on evidence from sports nutrition research and clinical studies
   * Balances effectiveness with sustainability and health
   */
  private getGoalSettings(
    goal: TrainingGoal,
    bodyFatPercentage?: number,
    gender?: string
  ): GoalSettings {
    switch (goal) {
      case 'strength':
        // Slight surplus for recovery and neural adaptation
        // Protein for muscle protein synthesis support
        return {
          adjustment: 250,
          proteinPerKg: 1.9,
          expectedWeeklyChange: 0.1,
          rationale:
            'Leichter Surplus für optimale Recovery und neuronale Adaptation bei Krafttraining',
        };

      case 'muscle_gain':
        // Moderate surplus for optimal muscle protein synthesis
        // Reference: DOI: 10.1111/sms.14075 (Muscle gain in surplus)
        return {
          adjustment: 400,
          proteinPerKg: 2.0,
          expectedWeeklyChange: 0.35,
          rationale:
            'Moderater Surplus für optimale Protein-Synthese und Muskelaufbau (Quelle: DOI 10.1111/sms.14075)',
        };

      case 'weight_loss':
        // Moderate deficit - aggressive enough for progress, sustainable long-term
        // High protein to preserve lean mass during deficit
        // References:
        // - Deficit limit: DOI: 10.1111/sms.14075
        // - High protein in deficit: DOI: 10.1097/MCO.0000000000000980
        return {
          adjustment: -500,
          proteinPerKg: 2.2,
          expectedWeeklyChange: -0.5,
          rationale:
            'Moderates Defizit für nachhaltigen Fettabbau. Defizite >500 kcal erschweren Muskelerhalt (DOI: 10.1111/sms.14075)',
          additionalInfo:
            'Erhöhter Protein-Bedarf (2.2 g/kg) für Muskelerhalt während Diät (DOI: 10.1097/MCO.0000000000000980)',
        };

      case 'endurance':
        // Slight surplus for recovery, higher carbs for glycogen
        // Moderate protein - endurance athletes need less than strength athletes
        return {
          adjustment: 100,
          proteinPerKg: 1.5,
          expectedWeeklyChange: 0,
          carbsPercentage: 55, // Higher carbs for glycogen stores
          rationale:
            'Leichter Surplus für Recovery, erhöhte Carbs (55%) für optimale Glykogen-Speicher',
        };

      case 'general_fitness':
        // Adaptive approach based on body composition
        // Higher BF% → deficit, lower BF% → maintenance
        const shouldDeficit = this.shouldDeficitForGeneralFitness(
          bodyFatPercentage,
          gender
        );

        return {
          adjustment: shouldDeficit ? -300 : 0,
          proteinPerKg: 1.7,
          expectedWeeklyChange: shouldDeficit ? -0.2 : 0,
          rationale:
            'Balance zwischen allen Fitnesszielen. Moderates Defizit wenn Body Fat erhöht, sonst Maintenance.',
        };

      default:
        return {
          adjustment: 0,
          proteinPerKg: 1.6,
          expectedWeeklyChange: 0,
          rationale: 'Maintenance-Kalorien für Gewichtserhalt',
        };
    }
  }

  /**
   * Determine if general fitness goal should include deficit
   * Based on body fat percentage thresholds
   */
  private shouldDeficitForGeneralFitness(
    bodyFatPercentage?: number,
    gender?: string
  ): boolean {
    if (!bodyFatPercentage) return false;

    // Higher BF% thresholds suggest room for fat loss
    const threshold = gender === 'female' ? 25 : 20;
    return bodyFatPercentage > threshold;
  }

  /**
   * Detect conflicts between training goal and target weight
   *
   * Identifies physiologically incompatible combinations and suggests adjustments
   * Example: Building muscle while losing weight requires specialized approach
   */
  private detectConflicts(
    profile: UserNutritionProfile,
    goalSettings: GoalSettings
  ): ConflictAnalysis {
    const warnings: string[] = [];
    const recommendations: string[] = [];
    let hasConflict = false;
    let adjustedSettings: GoalSettings | undefined;

    const { weight_kg, target_weight_kg, training_goal } = profile;

    // No target weight - no conflict possible
    if (!target_weight_kg) {
      return { hasConflict, warnings, recommendations };
    }

    const weightDifference = target_weight_kg - weight_kg;

    // CONFLICT 1: Muscle gain while losing weight
    if (weightDifference < 0 && training_goal === 'muscle_gain') {
      hasConflict = true;
      warnings.push(
        'Muskelaufbau im Kaloriendefizit ist sehr schwierig und für Anfänger selten erfolgreich.'
      );
      recommendations.push(
        'Empfehlung: Body Recomposition Ansatz - moderates Defizit mit sehr hohem Protein (2.2 g/kg)'
      );
      recommendations.push(
        'Alternative: Erst Muskelaufbau im Surplus, dann Cutting-Phase für Definition'
      );

      // Adjust to body recomposition approach
      adjustedSettings = {
        adjustment: -200, // Smaller deficit
        proteinPerKg: 2.2, // Very high protein
        expectedWeeklyChange: -0.15,
        rationale:
          'Body Recomposition: Moderates Defizit mit maximalem Protein für Muskelerhalt und möglichen Neuling-Gains',
        additionalInfo:
          'Realistische Erwartung: Minimaler Muskelaufbau, primär Kraftzuwachs durch neuronale Adaptation',
      };
    }

    // CONFLICT 2: Weight loss goal but targeting higher weight
    if (weightDifference > 0 && training_goal === 'weight_loss') {
      hasConflict = true;
      warnings.push(
        'Zielgewicht ist höher als aktuelles Gewicht, aber Trainingsziel ist Gewichtsverlust.'
      );
      recommendations.push(
        'Bitte Zielgewicht oder Trainingsziel anpassen für konsistente Planung'
      );
    }

    // CONFLICT 3: Strength training with significant weight loss
    if (weightDifference < -10 && training_goal === 'strength') {
      hasConflict = true;
      warnings.push(
        'Signifikanter Gewichtsverlust kann Kraftzuwachs erschweren, besonders bei fortgeschrittenen Athleten.'
      );
      recommendations.push(
        'Empfehlung: Moderateres Defizit (-300 kcal) für bessere Krafterhaltung'
      );

      adjustedSettings = {
        adjustment: -300,
        proteinPerKg: 2.0,
        expectedWeeklyChange: -0.25,
        rationale:
          'Moderates Defizit optimiert für Krafterhalt während Gewichtsverlust',
      };
    }

    return {
      hasConflict,
      warnings,
      recommendations,
      adjustedSettings,
    };
  }

  /**
   * Calculate progression timeline and validate against target date
   *
   * Checks if goals are realistic and achievable within specified timeframe
   * Warns about overly aggressive or slow approaches
   */
  private calculateProgression(
    profile: UserNutritionProfile,
    tdee: number,
    targetCalories: number,
    expectedWeeklyChange: number
  ): {
    weeksToGoal?: number;
    estimatedTargetDate?: Date;
    warnings: string[];
  } {
    const warnings: string[] = [];
    const { weight_kg, target_weight_kg, target_date } = profile;

    if (!target_weight_kg) {
      return { warnings };
    }

    const weightDifference = target_weight_kg - weight_kg;
    const weeksToGoal = Math.abs(weightDifference / expectedWeeklyChange);
    const estimatedTargetDate = new Date();
    estimatedTargetDate.setDate(
      estimatedTargetDate.getDate() + weeksToGoal * 7
    );

    // If user specified target date, check if it's realistic
    if (target_date) {
      const today = new Date();
      const targetDateTime = new Date(target_date);
      const daysAvailable = Math.floor(
        (targetDateTime.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
      );
      const weeksAvailable = daysAvailable / 7;

      if (weeksAvailable <= 0) {
        warnings.push('Zieldatum liegt in der Vergangenheit!');
        return { weeksToGoal, estimatedTargetDate, warnings };
      }

      const requiredWeeklyChange = weightDifference / weeksAvailable;

      // Check if required rate is too aggressive (>1 kg/week)
      if (Math.abs(requiredWeeklyChange) > 1.0) {
        warnings.push(
          `Ziel erfordert ${Math.abs(requiredWeeklyChange).toFixed(1)} kg/Woche - zu aggressiv! Maximal 1 kg/Woche empfohlen.`
        );
        warnings.push(
          'Sehr aggressive Diäten führen zu Muskelverlust und Jo-Jo-Effekt'
        );

        // Calculate required daily deficit/surplus
        const requiredDailyCalories =
          tdee + (requiredWeeklyChange * 7700) / 7;
        const requiredAdjustment = requiredDailyCalories - tdee;

        if (Math.abs(requiredAdjustment) > 1000) {
          warnings.push(
            `Erforderliches Defizit/Surplus: ${Math.abs(Math.round(requiredAdjustment))} kcal/Tag - gesundheitlich bedenklich!`
          );
        }
      }

      // Check if required rate is too slow (<0.1 kg/week for weight loss)
      if (
        weightDifference < 0 &&
        Math.abs(requiredWeeklyChange) < 0.1 &&
        Math.abs(weightDifference) > 2
      ) {
        warnings.push(
          'Zieldatum erlaubt sehr langsamen Fortschritt - könnte Motivation erschweren'
        );
      }
    }

    // General safety warnings
    if (Math.abs(expectedWeeklyChange) > 0.8) {
      warnings.push(
        'Empfohlene Rate >0.8 kg/Woche - Risiko für Muskelverlust und Nährstoffmängel erhöht'
      );
    }

    return {
      weeksToGoal: Math.round(weeksToGoal),
      estimatedTargetDate,
      warnings,
    };
  }

  /**
   * Calculate macronutrient distribution
   *
   * Protein: Goal-specific (1.5-2.2 g/kg) - highest priority
   * Fat: 25-30% of calories (default 27%) - hormonal health
   * Carbs: Remaining calories - energy and performance
   *
   * Reference: ACSM Nutrition Guidelines (DOI: 10.1249/MSS.0000000000000852)
   */
  private calculateMacros(
    targetCalories: number,
    proteinPerKg: number,
    weightKg: number,
    carbsPercentage?: number
  ) {
    // 1. Calculate protein (highest priority for body composition)
    const protein_g = Math.round(weightKg * proteinPerKg);
    const proteinCalories = protein_g * 4; // 4 kcal per gram

    // 2. Calculate fat (27% of total calories - optimal for hormones)
    const fatPercentage = 0.27;
    const fat_g = Math.round((targetCalories * fatPercentage) / 9); // 9 kcal per gram
    const fatCalories = fat_g * 9;

    // 3. Calculate carbs (remaining calories)
    const remainingCalories = targetCalories - proteinCalories - fatCalories;
    const carbs_g = Math.round(remainingCalories / 4); // 4 kcal per gram
    const carbsCalories = carbs_g * 4;

    // Calculate actual percentages
    const actualCarbsPercentage = Math.round(
      (carbsCalories / targetCalories) * 100
    );
    const actualFatPercentage = Math.round(
      (fatCalories / targetCalories) * 100
    );

    return {
      protein_g,
      protein_per_kg: proteinPerKg,
      carbs_g,
      carbs_percentage: actualCarbsPercentage,
      fat_g,
      fat_percentage: actualFatPercentage,
    };
  }

  /**
   * Generate detailed calculation methodology for transparency
   *
   * Provides step-by-step breakdown with actual numbers so users can:
   * - Understand how their targets were calculated
   * - Verify calculations independently
   * - Learn about nutrition science
   */
  private generateCalculationMethod(
    profile: UserNutritionProfile,
    bmr: number,
    tdee: number,
    targetCalories: number,
    goalSettings: GoalSettings
  ): CalculationMethod {
    const { weight_kg, height_cm, age, gender, pal_factor, training_goal } =
      profile;

    // Generate human-readable BMR calculation
    const bmrBase = `(10 × ${weight_kg}kg) + (6.25 × ${height_cm}cm) - (5 × ${age} Jahre)`;
    const bmrGenderAdjust = gender === 'male' ? '+ 5' : '- 161';
    const bmrCalculation = `${bmrBase} ${bmrGenderAdjust} = ${bmr.toLocaleString('de-DE')} kcal`;

    // PAL factor description
    const palDescriptions: Record<number, string> = {
      1.2: 'Sedentär (Bürojob, wenig Bewegung)',
      1.375: 'Leicht aktiv (1-3 Tage Sport/Woche)',
      1.55: 'Moderat aktiv (3-5 Tage Sport/Woche)',
      1.725: 'Sehr aktiv (6-7 Tage Sport/Woche)',
      1.9: 'Extrem aktiv (2x täglich Training)',
    };
    const palDescription =
      palDescriptions[pal_factor] || `PAL Faktor: ${pal_factor}`;

    // Goal adjustment details
    const adjustmentType: 'deficit' | 'surplus' | 'maintenance' =
      goalSettings.adjustment < 0
        ? 'deficit'
        : goalSettings.adjustment > 0
          ? 'surplus'
          : 'maintenance';

    // Protein rationale
    const proteinRationale = `${goalSettings.proteinPerKg} g/kg Körpergewicht - ${this.getProteinRationale(training_goal)}`;

    // Scientific sources
    const sources = {
      formula: 'https://doi.org/10.1093/ajcn/51.2.241',
      goalRecommendation:
        training_goal === 'weight_loss'
          ? 'https://doi.org/10.1111/sms.14075'
          : training_goal === 'muscle_gain'
            ? 'https://doi.org/10.1111/sms.14075'
            : 'https://doi.org/10.1249/MSS.0000000000000852',
      proteinRecommendation:
        training_goal === 'weight_loss'
          ? 'https://doi.org/10.1097/MCO.0000000000000980'
          : 'https://doi.org/10.1186/s12970-017-0177-8',
    };

    return {
      bmrFormula: 'mifflin_st_jeor',
      bmrCalculation,
      palFactor: pal_factor,
      palDescription,
      goalAdjustment: {
        type: adjustmentType,
        amount: goalSettings.adjustment,
        reason: goalSettings.rationale,
      },
      proteinRationale,
      sources,
    };
  }

  /**
   * Get protein rationale based on training goal
   */
  private getProteinRationale(goal: TrainingGoal): string {
    const rationales: Record<TrainingGoal, string> = {
      strength:
        'Optimal für Muskelproteinsynthese und Recovery bei Krafttraining',
      muscle_gain:
        'Maximale Proteinsynthese für Muskelaufbau (ISSN Empfehlung)',
      weight_loss:
        'Erhöht für Muskelerhalt während Defizit (klinisch validiert)',
      endurance: 'Moderat - Ausdauersportler benötigen weniger als Kraftsportler',
      general_fitness: 'Ausgewogene Basis für allgemeine Fitness und Gesundheit',
    };

    return rationales[goal];
  }

  /**
   * Generate personalized recommendations based on profile and calculations
   */
  private generateRecommendations(
    profile: UserNutritionProfile,
    goalSettings: GoalSettings,
    macros: { protein_g: number; carbs_g: number; fat_g: number }
  ): string[] {
    const recommendations: string[] = [];

    // Protein timing recommendation
    if (goalSettings.proteinPerKg >= 2.0) {
      recommendations.push(
        `Verteile ${macros.protein_g}g Protein auf 4-5 Mahlzeiten (ca. ${Math.round(macros.protein_g / 4)}g pro Mahlzeit) für optimale Proteinsynthese`
      );
    }

    // Hydration recommendation
    recommendations.push(
      `Trinke mindestens ${Math.round(profile.weight_kg * 0.035)} Liter Wasser täglich`
    );

    // Carb timing for endurance
    if (profile.training_goal === 'endurance') {
      recommendations.push(
        'Timing: Kohlenhydrate vor/während/nach Training für optimale Glykogen-Speicher'
      );
    }

    // Weight loss specific
    if (goalSettings.adjustment < 0) {
      recommendations.push(
        'Tracking: Wiege dich 1x wöchentlich zur selben Zeit für genaues Monitoring'
      );
      recommendations.push(
        'Erwarte keine lineare Abnahme - Wasser-Schwankungen sind normal'
      );
    }

    // Muscle gain specific
    if (profile.training_goal === 'muscle_gain') {
      recommendations.push(
        'Progressive Overload im Training ist wichtiger als perfekte Ernährung'
      );
      recommendations.push(
        'Erwarte 2-4kg Muskelaufbau pro Jahr als Natural Athlet (nach Anfängerphase)'
      );
    }

    // Additional info from goal settings
    if (goalSettings.additionalInfo) {
      recommendations.push(goalSettings.additionalInfo);
    }

    return recommendations;
  }
}
