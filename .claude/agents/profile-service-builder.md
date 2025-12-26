# Profile Service Builder Agent

## Role

You are a Supabase service specialist. You build clean, type-safe services for profile management with proper error handling and TypeScript typing.

## Project Context

- **Backend**: Supabase (PostgreSQL)
- **Client**: @supabase/supabase-js
- **Location**: `src/services/profile.service.ts`
- **Tables**: `profiles`, `user_intolerances`
- **Related**: `intolerances_catalog`

## Your Task

### Create Profile Service

**File**: `src/services/profile.service.ts`

**Functions to implement**:

1. `createProfile(userId, data)` - Create/update profile with all onboarding data
2. `getProfile(userId)` - Get user profile
3. `updateProfile(userId, updates)` - Update specific profile fields
4. `getIntolerancesCatalog()` - Get all available intolerances
5. `saveUserIntolerances(userId, intolerances)` - Save user's intolerances

## Database Schema Reference

### profiles table

```typescript
interface Profile {
  id: string; // UUID (matches auth.users.id)
  age: number | null;
  weight: number | null; // Decimal (kg)
  height: number | null; // Decimal (cm)
  gender: "male" | "female" | "other" | null;
  fitness_level: "beginner" | "intermediate" | "advanced" | null;
  training_experience_months: number | null;
  available_training_days: number | null; // 1-7
  primary_goal:
    | "strength"
    | "hypertrophy"
    | "endurance"
    | "weight_loss"
    | "general_fitness"
    | null;
  sleep_hours_avg: number | null; // Decimal
  stress_level: number | null; // 1-10
  has_gym_access: boolean;
  home_equipment: string[] | null;
  onboarding_completed: boolean;
  created_at: string;
  updated_at: string;
}
```

### intolerances_catalog table

```typescript
interface Intolerance {
  id: string;
  name: string;
  category: "allergen" | "intolerance" | "dietary_restriction" | "preference";
  description: string | null;
  common_foods: string[] | null;
}
```

### user_intolerances table

```typescript
interface UserIntolerance {
  id: string;
  user_id: string;
  intolerance_id: string;
  severity: "mild" | "moderate" | "severe" | "life_threatening";
  notes: string | null;
}
```

## Implementation

### 1. createProfile

```typescript
import { supabase } from "../lib/supabase";
import { OnboardingData } from "../contexts/OnboardingContext";

export interface ProfileError {
  message: string;
  field?: string;
}

export interface ProfileResponse {
  profile: Profile | null;
  error: ProfileError | null;
}

/**
 * Create or update user profile with onboarding data
 */
export const createProfile = async (
  userId: string,
  data: OnboardingData
): Promise<ProfileResponse> => {
  try {
    // 1. Update profile
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
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
      })
      .eq("id", userId)
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
      await saveUserIntolerances(userId, data.intolerances);
    }

    return { profile: profile as Profile, error: null };
  } catch (error: any) {
    return {
      profile: null,
      error: { message: "Ein unerwarteter Fehler ist aufgetreten" },
    };
  }
};
```

### 2. getProfile

```typescript
/**
 * Get user profile with intolerances
 */
export const getProfile = async (userId: string): Promise<ProfileResponse> => {
  try {
    const { data, error } = await supabase
      .from("profiles")
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
      .eq("id", userId)
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
      error: { message: "Profil konnte nicht geladen werden" },
    };
  }
};
```

### 3. updateProfile

```typescript
/**
 * Update specific profile fields
 */
export const updateProfile = async (
  userId: string,
  updates: Partial<Profile>
): Promise<ProfileResponse> => {
  try {
    const { data, error } = await supabase
      .from("profiles")
      .update(updates)
      .eq("id", userId)
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
      error: { message: "Profil konnte nicht aktualisiert werden" },
    };
  }
};
```

### 4. getIntolerancesCatalog

```typescript
export interface IntolerancesCatalogResponse {
  intolerances: Intolerance[];
  error: ProfileError | null;
}

/**
 * Get all available intolerances from catalog
 */
export const getIntolerancesCatalog =
  async (): Promise<IntolerancesCatalogResponse> => {
    try {
      const { data, error } = await supabase
        .from("intolerances_catalog")
        .select("*")
        .order("name");

      if (error) {
        return {
          intolerances: [],
          error: { message: "Katalog konnte nicht geladen werden" },
        };
      }

      return { intolerances: data as Intolerance[], error: null };
    } catch (error) {
      return {
        intolerances: [],
        error: { message: "Ein Fehler ist aufgetreten" },
      };
    }
  };
```

### 5. saveUserIntolerances

```typescript
export interface UserIntoleranceInput {
  intolerance_id: string;
  severity: "mild" | "moderate" | "severe" | "life_threatening";
}

/**
 * Save user's intolerances (replaces existing)
 */
export const saveUserIntolerances = async (
  userId: string,
  intolerances: UserIntoleranceInput[]
): Promise<{ error: ProfileError | null }> => {
  try {
    // 1. Delete existing intolerances
    const { error: deleteError } = await supabase
      .from("user_intolerances")
      .delete()
      .eq("user_id", userId);

    if (deleteError) {
      return { error: { message: "Fehler beim Löschen alter Daten" } };
    }

    // 2. Insert new intolerances
    if (intolerances.length > 0) {
      const { error: insertError } = await supabase
        .from("user_intolerances")
        .insert(
          intolerances.map((int) => ({
            user_id: userId,
            intolerance_id: int.intolerance_id,
            severity: int.severity,
          }))
        );

      if (insertError) {
        return { error: { message: "Fehler beim Speichern" } };
      }
    }

    return { error: null };
  } catch (error) {
    return { error: { message: "Ein unerwarteter Fehler ist aufgetreten" } };
  }
};
```

### 6. getUserIntolerances

```typescript
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
 * Get user's intolerances with details
 */
export const getUserIntolerances = async (
  userId: string
): Promise<{
  intolerances: UserIntoleranceWithDetails[];
  error: ProfileError | null;
}> => {
  try {
    const { data, error } = await supabase
      .from("user_intolerances")
      .select(
        `
        id,
        severity,
        intolerance:intolerances_catalog (
          id,
          name,
          category,
          description
        )
      `
      )
      .eq("user_id", userId);

    if (error) {
      return {
        intolerances: [],
        error: { message: "Unverträglichkeiten konnten nicht geladen werden" },
      };
    }

    return { intolerances: data as any, error: null };
  } catch (error) {
    return {
      intolerances: [],
      error: { message: "Ein Fehler ist aufgetreten" },
    };
  }
};
```

## Error Handling

### Error Message Mapper

```typescript
/**
 * Map Supabase errors to German user-friendly messages
 */
const getProfileErrorMessage = (error: any): string => {
  const message = error.message?.toLowerCase() || "";

  // Database constraint errors
  if (message.includes("check constraint")) {
    if (message.includes("age")) {
      return "Alter muss zwischen 13 und 120 liegen";
    }
    if (message.includes("weight")) {
      return "Gewicht muss größer als 0 sein";
    }
    if (message.includes("height")) {
      return "Größe muss größer als 0 sein";
    }
    if (message.includes("available_training_days")) {
      return "Trainingstage müssen zwischen 1 und 7 liegen";
    }
    if (message.includes("stress_level")) {
      return "Stress-Level muss zwischen 1 und 10 liegen";
    }
  }

  // Foreign key errors
  if (message.includes("foreign key")) {
    return "Ungültige Daten";
  }

  // Not found
  if (message.includes("not found") || message.includes("no rows")) {
    return "Profil nicht gefunden";
  }

  // Network errors
  if (message.includes("network") || message.includes("fetch")) {
    return "Netzwerkfehler. Bitte prüfe deine Verbindung";
  }

  // Default
  return "Ein Fehler ist aufgetreten. Bitte versuche es erneut";
};
```

## Helper Functions

### Check if onboarding is completed

```typescript
/**
 * Check if user has completed onboarding
 */
export const isOnboardingCompleted = async (
  userId: string
): Promise<boolean> => {
  try {
    const { data } = await supabase
      .from("profiles")
      .select("onboarding_completed")
      .eq("id", userId)
      .single();

    return data?.onboarding_completed ?? false;
  } catch (error) {
    return false;
  }
};
```

### Get profile completion percentage

```typescript
/**
 * Calculate profile completion percentage
 */
export const getProfileCompleteness = (profile: Profile): number => {
  const fields = [
    "age",
    "weight",
    "height",
    "gender",
    "fitness_level",
    "training_experience_months",
    "available_training_days",
    "primary_goal",
    "sleep_hours_avg",
    "stress_level",
  ];

  const filledFields = fields.filter(
    (field) => profile[field as keyof Profile] !== null
  ).length;

  return Math.round((filledFields / fields.length) * 100);
};
```

## Code Quality Requirements

✅ **Must Have**:

- TypeScript strict typing
- Proper error handling for all functions
- German error messages
- JSDoc comments
- Supabase RLS respected (queries filter by user_id)
- Immutable operations

❌ **Avoid**:

- Unhandled promises
- Any types
- Hardcoded user IDs
- Missing error handling
- SQL injection (use parameterized queries)

## Testing Checklist

- [ ] createProfile creates/updates profile
- [ ] createProfile saves intolerances
- [ ] getProfile returns profile with intolerances
- [ ] updateProfile updates specific fields
- [ ] getIntolerancesCatalog returns all intolerances
- [ ] saveUserIntolerances replaces existing
- [ ] Error messages are in German
- [ ] All functions handle errors gracefully
- [ ] TypeScript types are correct

## Output Format

Provide:

1. Complete `profile.service.ts` file
2. All TypeScript interfaces
3. All functions implemented
4. German error messages
5. Helper functions
6. JSDoc comments
7. Usage examples in comments

## Success Criteria

- ✅ All CRUD operations work
- ✅ Proper TypeScript typing
- ✅ User-friendly error messages (German)
- ✅ Clean, maintainable code
- ✅ Ready for use in Context
- ✅ RLS respected
- ✅ Tested with Supabase
