import React, { createContext, useContext, useState, ReactNode } from 'react';
import { supabase } from '../lib/supabase';
import { createProfile } from '../services/profile.service';

/**
 * Onboarding Data Interface
 * Stores all user information collected across 7 onboarding screens
 */
export interface OnboardingData {
  // Screen 0: Username & Profilbild (neue erste Screen)
  username: string | null;
  profile_image_url: string | null; // optional

  // Screen 1: Basisdaten
  age: number | null;
  weight: number | null; // kg
  height: number | null; // cm
  gender: 'male' | 'female' | 'other' | null;

  // Screen 2: Trainingserfahrung
  fitness_level: 'beginner' | 'intermediate' | 'advanced' | null;
  training_experience_months: number | null;
  available_training_days: number | null; // 1-7
  preferred_training_days: number[] | null; // Array of weekdays: 0=Sunday, 1=Monday, ..., 6=Saturday
  has_gym_access: boolean;
  home_equipment: string[]; // ['barbell', 'dumbbells', ...]

  // Screen 3: Ziele
  primary_goal:
    | 'strength'
    | 'hypertrophy'
    | 'endurance'
    | 'weight_loss'
    | 'general_fitness'
    | null;

  // Screen 4: Lifestyle
  sleep_hours_avg: number | null; // 6.5, 7.0, etc.
  stress_level: number | null; // 1-10

  // Screen 5: Ernährungsziele
  pal_factor: number | null; // Physical Activity Level (1.2-2.5)
  target_weight_kg: number | null; // Optional target weight
  target_date: string | null; // Optional target date (ISO string)
  body_fat_percentage: number | null; // Optional body fat %

  // Screen 6: Unverträglichkeiten (optional)
  intolerances: Array<{
    intolerance_id: string;
    severity: 'mild' | 'moderate' | 'severe' | 'life_threatening';
  }>;
}

/**
 * Onboarding Context Type
 * Provides state and actions for managing the onboarding flow
 */
export interface OnboardingContextType {
  // State
  data: OnboardingData;
  currentStep: number;
  totalSteps: number;
  isSubmitting: boolean;
  error: string | null;
  progress: number;

  // Actions
  updateData: (updates: Partial<OnboardingData>) => void;
  nextStep: () => void;
  previousStep: () => void;
  goToStep: (step: number) => void;
  submitOnboarding: () => Promise<void>;

  // Validation
  isStepValid: (step: number) => boolean;
  getStepErrors: (step: number) => string[];
}

/**
 * Initial onboarding data with default values
 */
const initialData: OnboardingData = {
  // Screen 0
  username: null,
  profile_image_url: null,

  // Screen 1
  age: null,
  weight: null,
  height: null,
  gender: null,

  // Screen 2
  fitness_level: null,
  training_experience_months: null,
  available_training_days: null,
  preferred_training_days: null,
  has_gym_access: true,
  home_equipment: [],

  // Screen 3
  primary_goal: null,

  // Screen 4
  sleep_hours_avg: null,
  stress_level: null,

  // Screen 5
  pal_factor: 1.55, // Default: moderately active
  target_weight_kg: null,
  target_date: null,
  body_fat_percentage: null,

  // Screen 6
  intolerances: [],
};

const OnboardingContext = createContext<OnboardingContextType | undefined>(
  undefined
);

interface OnboardingProviderProps {
  children: ReactNode;
}

/**
 * Onboarding Provider Component
 * Manages state and validation for the 7-step onboarding flow
 */
export const OnboardingProvider: React.FC<OnboardingProviderProps> = ({
  children,
}) => {
  const [data, setData] = useState<OnboardingData>(initialData);
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const totalSteps = 8; // Increased from 7 to 8 (added nutrition goals screen)

  /**
   * Update onboarding data with partial updates
   */
  const updateData = (updates: Partial<OnboardingData>) => {
    setData((prev) => ({ ...prev, ...updates }));
  };

  /**
   * Validate a specific step based on its requirements
   */
  const isStepValid = (step: number): boolean => {
    switch (step) {
      case 0:
        // Username & Profilbild (Profilbild ist optional)
        return !!(
          data.username &&
          data.username.length >= 3 &&
          /^[a-zA-Z0-9_]+$/.test(data.username)
        );

      case 1:
        // NUR Basisdaten prüfen (age, weight, height, gender)
        return !!(
          data.age &&
          data.age >= 13 &&
          data.age <= 120 &&
          data.weight &&
          data.weight > 0 &&
          data.height &&
          data.height > 0 &&
          data.gender
        );
        // fitness_level gehört NICHT hier!

      case 2:
        // HIER wird fitness_level geprüft
        // preferred_training_days ist optional - wird nur geprüft wenn gesetzt
        const preferredDaysValid =
          !data.preferred_training_days ||
          (data.preferred_training_days.length === data.available_training_days &&
           data.preferred_training_days.every(day => day >= 0 && day <= 6) &&
           new Set(data.preferred_training_days).size === data.preferred_training_days.length);

        return !!(
          data.fitness_level &&
          data.training_experience_months !== null &&
          data.available_training_days &&
          data.available_training_days >= 1 &&
          data.available_training_days <= 7 &&
          preferredDaysValid
        );

      case 3:
        return !!data.primary_goal;

      case 4:
        return !!(
          data.sleep_hours_avg &&
          data.sleep_hours_avg >= 3 &&
          data.sleep_hours_avg <= 12 &&
          data.stress_level &&
          data.stress_level >= 1 &&
          data.stress_level <= 10
        );

      case 5:
        // Nutrition goals - PAL factor is required, rest is optional
        return !!(
          data.pal_factor &&
          data.pal_factor >= 1.2 &&
          data.pal_factor <= 2.5
        );

      case 6:
        // Intolerances - optional screen, always valid
        return true;

      case 7:
        // Summary screen, check all previous required steps
        return (
          isStepValid(0) &&
          isStepValid(1) &&
          isStepValid(2) &&
          isStepValid(3) &&
          isStepValid(4) &&
          isStepValid(5)
        );

      default:
        return false;
    }
  };

  /**
   * Get validation error messages for a specific step
   * @returns Array of German error messages
   */
  const getStepErrors = (step: number): string[] => {
    const errors: string[] = [];

    switch (step) {
      case 0:
        // Username & Profilbild
        if (!data.username) {
          errors.push('Username ist erforderlich');
        } else if (data.username.length < 3) {
          errors.push('Username muss mindestens 3 Zeichen lang sein');
        } else if (!/^[a-zA-Z0-9_]+$/.test(data.username)) {
          errors.push('Username darf nur Buchstaben, Zahlen und Unterstriche enthalten');
        }
        break;

      case 1:
        // NUR Basisdaten Fehler
        if (!data.age) {
          errors.push('Alter ist erforderlich');
        } else if (data.age < 13) {
          errors.push('Du musst mindestens 13 Jahre alt sein');
        } else if (data.age > 120) {
          errors.push('Bitte gib ein gültiges Alter ein');
        }

        if (!data.weight) {
          errors.push('Gewicht ist erforderlich');
        } else if (data.weight <= 0) {
          errors.push('Gewicht muss größer als 0 sein');
        }

        if (!data.height) {
          errors.push('Größe ist erforderlich');
        } else if (data.height <= 0) {
          errors.push('Größe muss größer als 0 sein');
        }

        if (!data.gender) {
          errors.push('Geschlecht ist erforderlich');
        }
        break;
        // fitness_level NICHT hier!

      case 2:
        // HIER kommen fitness_level Fehler
        if (!data.fitness_level) {
          errors.push('Trainingslevel ist erforderlich');
        }
        if (data.training_experience_months === null) {
          errors.push('Trainingserfahrung ist erforderlich');
        }
        if (!data.available_training_days) {
          errors.push('Verfügbare Trainingstage sind erforderlich');
        } else if (
          data.available_training_days < 1 ||
          data.available_training_days > 7
        ) {
          errors.push('Trainingstage müssen zwischen 1 und 7 liegen');
        }

        // Validate preferred_training_days if set
        if (data.preferred_training_days) {
          if (data.preferred_training_days.length !== data.available_training_days) {
            errors.push('Anzahl der ausgewählten Tage stimmt nicht mit verfügbaren Trainingstagen überein');
          }
          if (!data.preferred_training_days.every(day => day >= 0 && day <= 6)) {
            errors.push('Ungültige Wochentage ausgewählt');
          }
          if (new Set(data.preferred_training_days).size !== data.preferred_training_days.length) {
            errors.push('Doppelte Wochentage sind nicht erlaubt');
          }
        }
        break;

      case 3:
        if (!data.primary_goal) {
          errors.push('Trainingsziel ist erforderlich');
        }
        break;

      case 4:
        if (!data.sleep_hours_avg) {
          errors.push('Durchschnittliche Schlafstunden sind erforderlich');
        } else if (data.sleep_hours_avg < 3 || data.sleep_hours_avg > 12) {
          errors.push('Schlafstunden müssen zwischen 3 und 12 liegen');
        }

        if (!data.stress_level) {
          errors.push('Stress-Level ist erforderlich');
        } else if (data.stress_level < 1 || data.stress_level > 10) {
          errors.push('Stress-Level muss zwischen 1 und 10 liegen');
        }
        break;

      case 5:
        if (!data.pal_factor) {
          errors.push('Aktivitätslevel ist erforderlich');
        } else if (data.pal_factor < 1.2 || data.pal_factor > 2.5) {
          errors.push('PAL-Faktor muss zwischen 1.2 und 2.5 liegen');
        }
        // target_weight_kg, target_date, body_fat_percentage are optional
        break;

      case 7:
        // Check all previous steps for summary
        const allErrors = [
          ...getStepErrors(0),
          ...getStepErrors(1),
          ...getStepErrors(2),
          ...getStepErrors(3),
          ...getStepErrors(4),
          ...getStepErrors(5),
        ];
        return allErrors;
    }

    return errors;
  };

  /**
   * Move to the next step if current step is valid
   */
  const nextStep = () => {
    // DEBUG - TEMPORÄR
    console.log('🔍 DEBUG - Current Step:', currentStep);
    console.log('🔍 Data:', {
      age: data.age,
      weight: data.weight,
      height: data.height,
      gender: data.gender,
    });
    console.log('🔍 Step Valid?', isStepValid(currentStep));
    console.log('🔍 Errors:', getStepErrors(currentStep));
    // ENDE DEBUG

    if (!isStepValid(currentStep)) {
      const errors = getStepErrors(currentStep);
      setError(errors[0]); // Show first error
      return;
    }

    if (currentStep < totalSteps) {
      setCurrentStep((prev) => prev + 1);
      setError(null);
    }
  };

  /**
   * Move to the previous step
   */
  const previousStep = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
      setError(null);
    }
  };

  /**
   * Jump to a specific step
   */
  const goToStep = (step: number) => {
    if (step >= 0 && step <= totalSteps) {
      setCurrentStep(step);
      setError(null);
    }
  };

  /**
   * Calculate progress percentage
   */
  const getProgress = (): number => {
    return (currentStep / totalSteps) * 100;
  };

  /**
   * Submit onboarding data to Supabase
   * Creates user profile with all collected information
   */
  const submitOnboarding = async () => {
    // Validate all steps before submission
    if (!isStepValid(7)) {
      const errors = getStepErrors(7);
      setError(errors[0]);
      throw new Error(errors[0]);
    }

    setIsSubmitting(true);
    setError(null);

    try {
      // Get current authenticated user
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error('Nicht angemeldet');
      }

      // Use profile service to create profile with all onboarding data
      const { profile, error: profileError } = await createProfile(user.id, data);

      if (profileError) {
        throw new Error(profileError.message);
      }

      if (!profile) {
        throw new Error('Profil konnte nicht erstellt werden');
      }

      // Success - navigation will be handled in the screen component
    } catch (err: any) {
      const errorMessage = err.message || 'Fehler beim Speichern';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const value: OnboardingContextType = {
    data,
    currentStep,
    totalSteps,
    isSubmitting,
    error,
    progress: getProgress(),
    updateData,
    nextStep,
    previousStep,
    goToStep,
    submitOnboarding,
    isStepValid,
    getStepErrors,
  };

  return (
    <OnboardingContext.Provider value={value}>
      {children}
    </OnboardingContext.Provider>
  );
};

/**
 * Custom hook to use Onboarding Context
 * Must be used within OnboardingProvider
 *
 * @example
 * ```tsx
 * const { data, updateData, nextStep } = useOnboarding();
 *
 * <Input
 *   value={data.age?.toString() || ''}
 *   onChangeText={(text) => updateData({ age: parseInt(text) || null })}
 * />
 * ```
 */
export const useOnboarding = (): OnboardingContextType => {
  const context = useContext(OnboardingContext);
  if (!context) {
    throw new Error('useOnboarding must be used within OnboardingProvider');
  }
  return context;
};
