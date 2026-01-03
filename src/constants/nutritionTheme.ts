/**
 * Nutrition-specific theme extensions
 * Extends the base theme with nutrition-related colors and styles
 */

export const nutritionTheme = {
  colors: {
    // Macronutrient colors
    protein: '#FF6B6B',     // Red/Pink for protein
    carbs: '#4ECDC4',       // Teal for carbohydrates
    fat: '#FFD93D',         // Yellow for fats
    fiber: '#95E1D3',       // Light teal for fiber
    water: '#3498DB',       // Blue for water

    // Progress colors
    goalMet: '#34C759',     // Green - goal achieved
    goalNear: '#FF9500',    // Orange - 80-100% of goal
    goalFar: '#FF3B30',     // Red - below 80%
    goalOver: '#5856D6',    // Purple - over 100%

    // Nutriscore grades
    nutriscoreA: '#038141', // Dark green
    nutriscoreB: '#85BB2F', // Light green
    nutriscoreC: '#FECB02', // Yellow
    nutriscoreD: '#EE8100', // Orange
    nutriscoreE: '#E63E11', // Red

    // UI elements
    cardBackground: '#FFFFFF',
    cardShadow: 'rgba(0, 0, 0, 0.08)',
    divider: '#E5E5EA',
    shimmer: '#F0F0F0',
  },

  nutrition: {
    // Progress thresholds
    thresholds: {
      goalFar: 0.8,      // Below 80% - red
      goalNear: 0.95,    // 80-95% - orange
      goalMet: 1.0,      // 95-105% - green
      goalOver: 1.05,    // Above 105% - purple
    },

    // Calorie ring sizes
    calorieRing: {
      size: 180,
      strokeWidth: 16,
    },

    // Macro ring sizes (smaller)
    macroRing: {
      size: 100,
      strokeWidth: 10,
    },

    // Water glass animation
    waterGlass: {
      width: 60,
      height: 120,
      maxLevel: 100,
    },
  },

  animations: {
    // Progress bar animation duration
    progressDuration: 800,

    // Fade in duration
    fadeInDuration: 300,

    // Spring config for bouncy animations
    spring: {
      damping: 15,
      stiffness: 150,
    },
  },

  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
    xxl: 48,
  },

  borderRadius: {
    sm: 8,
    md: 12,
    lg: 16,
    xl: 24,
    round: 9999,
  },

  shadows: {
    card: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.08,
      shadowRadius: 8,
      elevation: 3,
    },
    button: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 2,
    },
  },

  typography: {
    h1: {
      fontSize: 32,
      fontWeight: '700' as const,
      lineHeight: 40,
    },
    h2: {
      fontSize: 24,
      fontWeight: '600' as const,
      lineHeight: 32,
    },
    h3: {
      fontSize: 20,
      fontWeight: '600' as const,
      lineHeight: 28,
    },
    body: {
      fontSize: 16,
      fontWeight: '400' as const,
      lineHeight: 24,
    },
    bodyBold: {
      fontSize: 16,
      fontWeight: '600' as const,
      lineHeight: 24,
    },
    caption: {
      fontSize: 14,
      fontWeight: '400' as const,
      lineHeight: 20,
    },
    small: {
      fontSize: 12,
      fontWeight: '400' as const,
      lineHeight: 16,
    },
    tiny: {
      fontSize: 10,
      fontWeight: '400' as const,
      lineHeight: 14,
    },
  },
};

/**
 * Helper to get progress color based on percentage
 */
export function getProgressColor(percentage: number): string {
  const { colors, nutrition } = nutritionTheme;

  if (percentage < nutrition.thresholds.goalFar) {
    return colors.goalFar;
  } else if (percentage < nutrition.thresholds.goalNear) {
    return colors.goalNear;
  } else if (percentage <= nutrition.thresholds.goalOver) {
    return colors.goalMet;
  } else {
    return colors.goalOver;
  }
}

/**
 * Helper to get nutriscore color
 */
export function getNutriscoreColor(grade?: string): string {
  if (!grade) return nutritionTheme.colors.divider;

  const gradeUpper = grade.toUpperCase();
  switch (gradeUpper) {
    case 'A':
      return nutritionTheme.colors.nutriscoreA;
    case 'B':
      return nutritionTheme.colors.nutriscoreB;
    case 'C':
      return nutritionTheme.colors.nutriscoreC;
    case 'D':
      return nutritionTheme.colors.nutriscoreD;
    case 'E':
      return nutritionTheme.colors.nutriscoreE;
    default:
      return nutritionTheme.colors.divider;
  }
}

/**
 * Helper to format nutrition values
 */
export function formatNutritionValue(value: number | undefined, unit: string = 'g'): string {
  if (value === undefined || value === null) return '-';
  return `${Math.round(value)}${unit}`;
}

/**
 * Helper to format calories
 */
export function formatCalories(calories: number | undefined): string {
  if (calories === undefined || calories === null) return '0';
  return Math.round(calories).toString();
}
