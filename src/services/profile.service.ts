import { supabase } from '../lib/supabase';
import { OnboardingData } from '../contexts/OnboardingContext';

/**
 * Profile Interface
 * Matches the profiles table schema in Supabase
 */
export interface Profile {
  id: string; // UUID (matches auth.users.id)
  age: number | null;
  weight: number | null; // Decimal (kg)
  height: number | null; // Decimal (cm)
  gender: 'male' | 'female' | 'other' | null;
  fitness_level: 'beginner' | 'intermediate' | 'advanced' | null;
  training_experience_months: number | null;
  available_training_days: number | null; // 1-7
  primary_goal:
    | 'strength'
    | 'hypertrophy'
    | 'endurance'
    | 'weight_loss'
    | 'general_fitness'
    | null;
  sleep_hours_avg: number | null; // Decimal
  stress_level: number | null; // 1-10
  has_gym_access: boolean;
  home_equipment: string[] | null;
  onboarding_completed: boolean;
  created_at: string;
  updated_at: string;
}

/**
 * Intolerance Catalog Interface
 */
export interface Intolerance {
  id: string;
  name: string;
  category: 'allergen' | 'intolerance' | 'dietary_restriction' | 'preference';
  description: string | null;
  common_foods: string[] | null;
}

/**
 * User Intolerance Interface
 */
export interface UserIntolerance {
  id: string;
  user_id: string;
  intolerance_id: string;
  severity: 'mild' | 'moderate' | 'severe' | 'life_threatening';
  notes: string | null;
}

/**
 * User Intolerance Input for creating/updating
 */
export interface UserIntoleranceInput {
  intolerance_id: string;
  severity: 'mild' | 'moderate' | 'severe' | 'life_threatening';
}

/**
 * User Intolerance with Details (joined with catalog)
 */
export interface UserIntoleranceWithDetails {
  id: string;
  severity: string;
  intolerance: {
    id: string;
    name: string;
    category: string;
    description: string | null;
  };
}

/**
 * Profile Error Interface
 */
export interface ProfileError {
  message: string;
  field?: string;
}

/**
 * Profile Response Interface
 */
export interface ProfileResponse {
  profile: Profile | null;
  error: ProfileError | null;
}

/**
 * Intolerances Catalog Response Interface
 */
export interface IntolerancesCatalogResponse {
  intolerances: Intolerance[];
  error: ProfileError | null;
}

/**
 * Map Supabase errors to German user-friendly messages
 */
const getProfileErrorMessage = (error: any): string => {
  const message = error.message?.toLowerCase() || '';

  // Database constraint errors
  if (message.includes('check constraint')) {
    if (message.includes('age')) {
      return 'Alter muss zwischen 13 und 120 liegen';
    }
    if (message.includes('weight')) {
      return 'Gewicht muss größer als 0 sein';
    }
    if (message.includes('height')) {
      return 'Größe muss größer als 0 sein';
    }
    if (message.includes('available_training_days')) {
      return 'Trainingstage müssen zwischen 1 und 7 liegen';
    }
    if (message.includes('stress_level')) {
      return 'Stress-Level muss zwischen 1 und 10 liegen';
    }
  }

  // Foreign key errors
  if (message.includes('foreign key')) {
    return 'Ungültige Daten';
  }

  // Not found
  if (message.includes('not found') || message.includes('no rows')) {
    return 'Profil nicht gefunden';
  }

  // Network errors
  if (message.includes('network') || message.includes('fetch')) {
    return 'Netzwerkfehler. Bitte prüfe deine Verbindung';
  }

  // Default
  return 'Ein Fehler ist aufgetreten. Bitte versuche es erneut';
};

/**
 * Create or update user profile with onboarding data
 *
 * @param userId - The user's UUID from auth.users
 * @param data - Onboarding data collected from the onboarding flow
 * @returns ProfileResponse with created/updated profile or error
 *
 * @example
 * ```typescript
 * const { profile, error } = await createProfile(user.id, onboardingData);
 * if (error) {
 *   console.error(error.message);
 * } else {
 *   console.log('Profile created:', profile);
 * }
 * ```
 */
export const createProfile = async (
  userId: string,
  data: OnboardingData
): Promise<ProfileResponse> => {
  try {
    // 1. Update profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .update({
        age: data.age,
        weight: data.weight,
        height: data.height,
        gender: data.gender,
        fitness_level: data.fitness_level,
        training_experience_months: data.training_experience_months,
        available_training_days: data.available_training_days,
        primary_goal: data.primary_goal,
        sleep_hours_avg: data.sleep_hours_avg,
        stress_level: data.stress_level,
        has_gym_access: data.has_gym_access,
        home_equipment: data.home_equipment,
        onboarding_completed: true,
        updated_at: new Date().toISOString(),
      })
      .eq('id', userId)
      .select()
      .single();

    if (profileError) {
      return {
        profile: null,
        error: { message: getProfileErrorMessage(profileError) },
      };
    }

    // 2. Save intolerances if any
    if (data.intolerances.length > 0) {
      const intolerancesResult = await saveUserIntolerances(
        userId,
        data.intolerances
      );
      if (intolerancesResult.error) {
        // Profile was saved, but intolerances failed
        // Return success with a warning
        console.warn('Profile saved but intolerances failed:', intolerancesResult.error);
      }
    }

    return { profile: profile as Profile, error: null };
  } catch (error: any) {
    return {
      profile: null,
      error: { message: 'Ein unerwarteter Fehler ist aufgetreten' },
    };
  }
};

/**
 * Get user profile with intolerances
 *
 * @param userId - The user's UUID
 * @returns ProfileResponse with profile data or error
 *
 * @example
 * ```typescript
 * const { profile, error } = await getProfile(user.id);
 * if (error) {
 *   console.error(error.message);
 * } else {
 *   console.log('User age:', profile?.age);
 * }
 * ```
 */
export const getProfile = async (userId: string): Promise<ProfileResponse> => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select(
        `
        *,
        user_intolerances (
          id,
          severity,
          notes,
          intolerance:intolerances_catalog (
            id,
            name,
            category,
            description
          )
        )
      `
      )
      .eq('id', userId)
      .single();

    if (error) {
      return {
        profile: null,
        error: { message: getProfileErrorMessage(error) },
      };
    }

    return { profile: data as any, error: null };
  } catch (error) {
    return {
      profile: null,
      error: { message: 'Profil konnte nicht geladen werden' },
    };
  }
};

/**
 * Update specific profile fields
 *
 * @param userId - The user's UUID
 * @param updates - Partial profile object with fields to update
 * @returns ProfileResponse with updated profile or error
 *
 * @example
 * ```typescript
 * const { profile, error } = await updateProfile(user.id, {
 *   weight: 75,
 *   available_training_days: 5
 * });
 * ```
 */
export const updateProfile = async (
  userId: string,
  updates: Partial<Profile>
): Promise<ProfileResponse> => {
  try {
    // Add updated_at timestamp
    const updateData = {
      ...updates,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      return {
        profile: null,
        error: { message: getProfileErrorMessage(error) },
      };
    }

    return { profile: data as Profile, error: null };
  } catch (error) {
    return {
      profile: null,
      error: { message: 'Profil konnte nicht aktualisiert werden' },
    };
  }
};

/**
 * Get all available intolerances from catalog
 *
 * @returns IntolerancesCatalogResponse with list of intolerances or error
 *
 * @example
 * ```typescript
 * const { intolerances, error } = await getIntolerancesCatalog();
 * if (!error) {
 *   intolerances.forEach(int => console.log(int.name));
 * }
 * ```
 */
export const getIntolerancesCatalog =
  async (): Promise<IntolerancesCatalogResponse> => {
    try {
      const { data, error } = await supabase
        .from('intolerances_catalog')
        .select('*')
        .order('name');

      if (error) {
        return {
          intolerances: [],
          error: { message: 'Katalog konnte nicht geladen werden' },
        };
      }

      return { intolerances: data as Intolerance[], error: null };
    } catch (error) {
      return {
        intolerances: [],
        error: { message: 'Ein Fehler ist aufgetreten' },
      };
    }
  };

/**
 * Save user's intolerances (replaces existing)
 *
 * @param userId - The user's UUID
 * @param intolerances - Array of intolerance inputs with severity
 * @returns Object with error or null
 *
 * @example
 * ```typescript
 * const result = await saveUserIntolerances(user.id, [
 *   { intolerance_id: 'lactose-id', severity: 'moderate' },
 *   { intolerance_id: 'gluten-id', severity: 'severe' }
 * ]);
 * if (result.error) {
 *   console.error(result.error.message);
 * }
 * ```
 */
export const saveUserIntolerances = async (
  userId: string,
  intolerances: UserIntoleranceInput[]
): Promise<{ error: ProfileError | null }> => {
  try {
    // 1. Delete existing intolerances
    const { error: deleteError } = await supabase
      .from('user_intolerances')
      .delete()
      .eq('user_id', userId);

    if (deleteError) {
      return { error: { message: 'Fehler beim Löschen alter Daten' } };
    }

    // 2. Insert new intolerances
    if (intolerances.length > 0) {
      const { error: insertError } = await supabase
        .from('user_intolerances')
        .insert(
          intolerances.map((int) => ({
            user_id: userId,
            intolerance_id: int.intolerance_id,
            severity: int.severity,
          }))
        );

      if (insertError) {
        return { error: { message: 'Fehler beim Speichern' } };
      }
    }

    return { error: null };
  } catch (error) {
    return { error: { message: 'Ein unerwarteter Fehler ist aufgetreten' } };
  }
};

/**
 * Get user's intolerances with details from catalog
 *
 * @param userId - The user's UUID
 * @returns Object with intolerances array and error
 *
 * @example
 * ```typescript
 * const { intolerances, error } = await getUserIntolerances(user.id);
 * if (!error) {
 *   intolerances.forEach(int => {
 *     console.log(`${int.intolerance.name}: ${int.severity}`);
 *   });
 * }
 * ```
 */
export const getUserIntolerances = async (
  userId: string
): Promise<{
  intolerances: UserIntoleranceWithDetails[];
  error: ProfileError | null;
}> => {
  try {
    const { data, error } = await supabase
      .from('user_intolerances')
      .select(
        `
        id,
        severity,
        notes,
        intolerance:intolerances_catalog (
          id,
          name,
          category,
          description
        )
      `
      )
      .eq('user_id', userId);

    if (error) {
      return {
        intolerances: [],
        error: { message: 'Unverträglichkeiten konnten nicht geladen werden' },
      };
    }

    return { intolerances: data as any, error: null };
  } catch (error) {
    return {
      intolerances: [],
      error: { message: 'Ein Fehler ist aufgetreten' },
    };
  }
};

/**
 * Check if user has completed onboarding
 *
 * @param userId - The user's UUID
 * @returns Boolean indicating if onboarding is completed
 *
 * @example
 * ```typescript
 * const completed = await isOnboardingCompleted(user.id);
 * if (!completed) {
 *   navigation.navigate('Onboarding');
 * }
 * ```
 */
export const isOnboardingCompleted = async (
  userId: string
): Promise<boolean> => {
  try {
    const { data } = await supabase
      .from('profiles')
      .select('onboarding_completed')
      .eq('id', userId)
      .single();

    return data?.onboarding_completed ?? false;
  } catch (error) {
    return false;
  }
};

/**
 * Calculate profile completion percentage
 *
 * @param profile - User profile object
 * @returns Completion percentage (0-100)
 *
 * @example
 * ```typescript
 * const completeness = getProfileCompleteness(profile);
 * console.log(`Profile is ${completeness}% complete`);
 * ```
 */
export const getProfileCompleteness = (profile: Profile): number => {
  const fields = [
    'age',
    'weight',
    'height',
    'gender',
    'fitness_level',
    'training_experience_months',
    'available_training_days',
    'primary_goal',
    'sleep_hours_avg',
    'stress_level',
  ];

  const filledFields = fields.filter(
    (field) => profile[field as keyof Profile] !== null
  ).length;

  return Math.round((filledFields / fields.length) * 100);
};
