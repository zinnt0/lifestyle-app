import React, { createContext, useContext, useState, ReactNode } from 'react';
import { supabase } from '../lib/supabase';

/**
 * Supplement Onboarding Data Interface
 * Stores all supplement-specific information collected across 4 onboarding screens
 */
export interface SupplementOnboardingData {
  // Screen 1: GI-Beschwerden (Gastrointestinal issues)
  gi_issues: Array<'bloating' | 'irritable_bowel' | 'diarrhea' | 'constipation'>;

  // Screen 2: Hydration/Schweissrate/Sonnenexposition
  heavy_sweating: boolean;
  high_salt_intake: boolean;
  sun_exposure_hours: number; // Stunden Sonnenexposition pro Woche (0-20+)

  // Screen 3: Verletzungen/Gelenkbeschwerden
  joint_issues: Array<'knee' | 'tendons' | 'shoulder' | 'back'>;

  // Screen 4: Laborwerte (optional)
  lab_values: {
    hemoglobin?: number | null; // g/dL
    mcv?: number | null; // fL (mean corpuscular volume)
    vitamin_d?: number | null; // ng/mL (25-OH-Vitamin D3)
    crp?: number | null; // mg/L (C-reactive protein)
    alt?: number | null; // U/L (GPT/ALT)
    ggt?: number | null; // U/L (Gamma-GT)
    estradiol?: number | null; // pg/mL (E2)
    testosterone?: number | null; // ng/dL
  } | null;
}

/**
 * Supplement Onboarding Context Type
 */
export interface SupplementOnboardingContextType {
  // State
  data: SupplementOnboardingData;
  currentStep: number;
  totalSteps: number;
  isSubmitting: boolean;
  error: string | null;
  progress: number;

  // Actions
  updateData: (updates: Partial<SupplementOnboardingData>) => void;
  nextStep: () => void;
  previousStep: () => void;
  goToStep: (step: number) => void;
  submitOnboarding: () => Promise<void>;
  skipLabValues: () => void;

  // Validation
  isStepValid: (step: number) => boolean;
}

/**
 * Initial supplement onboarding data
 */
const initialData: SupplementOnboardingData = {
  gi_issues: [],
  heavy_sweating: false,
  high_salt_intake: false,
  sun_exposure_hours: 5, // Default: 5 Stunden pro Woche
  joint_issues: [],
  lab_values: null,
};

const SupplementOnboardingContext = createContext<SupplementOnboardingContextType | undefined>(
  undefined
);

interface SupplementOnboardingProviderProps {
  children: ReactNode;
  onComplete?: () => void;
}

/**
 * Supplement Onboarding Provider Component
 * Manages state for the 4-step supplement onboarding flow
 */
export const SupplementOnboardingProvider: React.FC<SupplementOnboardingProviderProps> = ({
  children,
  onComplete,
}) => {
  const [data, setData] = useState<SupplementOnboardingData>(initialData);
  const [currentStep, setCurrentStep] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const totalSteps = 4; // GI, Hydration, Injuries, Lab Values

  /**
   * Update onboarding data with partial updates
   */
  const updateData = (updates: Partial<SupplementOnboardingData>) => {
    setData((prev) => ({ ...prev, ...updates }));
  };

  /**
   * Validate a specific step
   */
  const isStepValid = (step: number): boolean => {
    // All steps are optional/always valid since user can skip
    return true;
  };

  /**
   * Move to the next step
   */
  const nextStep = () => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep((prev) => prev + 1);
      setError(null);
    } else {
      // Last step - submit
      submitOnboarding();
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
    if (step >= 0 && step < totalSteps) {
      setCurrentStep(step);
      setError(null);
    }
  };

  /**
   * Skip lab values and complete onboarding
   */
  const skipLabValues = () => {
    updateData({ lab_values: null });
    submitOnboarding();
  };

  /**
   * Calculate progress percentage
   */
  const getProgress = (): number => {
    return ((currentStep + 1) / totalSteps) * 100;
  };

  /**
   * Submit supplement onboarding data to Supabase
   */
  const submitOnboarding = async () => {
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

      // Update profile with supplement data
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          gi_issues: data.gi_issues,
          heavy_sweating: data.heavy_sweating,
          high_salt_intake: data.high_salt_intake,
          sun_exposure_hours: data.sun_exposure_hours,
          joint_issues: data.joint_issues,
          lab_values: data.lab_values,
          supplement_onboarding_completed: true,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id);

      if (updateError) {
        throw new Error(updateError.message);
      }

      // Success - call onComplete callback
      onComplete?.();
    } catch (err: any) {
      const errorMessage = err.message || 'Fehler beim Speichern';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  const value: SupplementOnboardingContextType = {
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
    skipLabValues,
    isStepValid,
  };

  return (
    <SupplementOnboardingContext.Provider value={value}>
      {children}
    </SupplementOnboardingContext.Provider>
  );
};

/**
 * Custom hook to use Supplement Onboarding Context
 */
export const useSupplementOnboarding = (): SupplementOnboardingContextType => {
  const context = useContext(SupplementOnboardingContext);
  if (!context) {
    throw new Error('useSupplementOnboarding must be used within SupplementOnboardingProvider');
  }
  return context;
};
