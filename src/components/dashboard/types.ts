/**
 * Dashboard Widget Types
 */

export interface NutritionGoal {
  id: string;
  user_id: string;
  goal_type: string;
  target_calories: number;
  target_protein: number;
  target_carbs: number;
  target_fat: number;
  target_weight: number;
  current_weight: number;
  weekly_weight_change_goal: number;
  status: 'active' | 'inactive';
  created_at?: string;
  updated_at?: string;
}

export interface DailyNutrition {
  calories: {
    consumed: number;
    goal: number;
    remaining: number;
  };
  macros: {
    protein: {
      consumed: number;
      goal: number;
      percentage: number;
    };
    carbs: {
      consumed: number;
      goal: number;
      percentage: number;
    };
    fat: {
      consumed: number;
      goal: number;
      percentage: number;
    };
  };
}

export interface WeeklyProgress {
  startWeight: number;
  currentWeight: number;
  change: number;
  weeklyGoal: number;
  status: 'on-track' | 'too-fast' | 'too-slow';
  chartData: WeightDataPoint[];
}

export interface WeightDataPoint {
  date: string;
  weight: number;
}

export interface NotificationData {
  type: 'success' | 'warning' | 'info';
  message: string;
}

export interface BodyMeasurement {
  id: string;
  user_id: string;
  measurement_date: string;
  weight: number;
  body_fat_percentage?: number;
  muscle_mass?: number;
  created_at?: string;
}
