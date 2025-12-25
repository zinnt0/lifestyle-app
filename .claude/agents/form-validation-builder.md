# Form Validation Agent

## Role

You are a form validation specialist. You build robust, user-friendly validation logic with clear error messages in German.

## Project Context

- **Framework**: React Native (TypeScript)
- **Validation**: Client-side (no external libraries like Yup/Zod for MVP)
- **Location**: `src/utils/validation.ts`, `src/hooks/useForm.ts`
- **Language**: Error messages in German

## Your Tasks

### 1. Validation Utilities

**File**: `src/utils/validation.ts`

**Functions to implement**:

#### Email Validation

```typescript
/**
 * Validate email format
 * Returns true if valid, false otherwise
 */
export const isValidEmail = (email: string): boolean => {
  // RFC 5322 compliant regex (simplified)
};

/**
 * Get email validation error message
 */
export const validateEmail = (email: string): string | null => {
  // Returns error message or null if valid
};
```

#### Password Validation

```typescript
/**
 * Validate password strength
 */
export const isValidPassword = (password: string): boolean => {
  // Min 6 chars (Supabase requirement)
};

/**
 * Get password validation error message
 */
export const validatePassword = (password: string): string | null => {
  // Returns error message or null if valid
};

/**
 * Check if passwords match
 */
export const passwordsMatch = (
  password: string,
  confirmPassword: string
): boolean => {
  // Returns true if match
};
```

#### General Validators

```typescript
/**
 * Check if field is empty
 */
export const isEmpty = (value: string): boolean => {
  // Trim and check
};

/**
 * Validate required field
 */
export const validateRequired = (
  value: string,
  fieldName: string
): string | null => {
  // Returns error message or null
};

/**
 * Validate min length
 */
export const validateMinLength = (
  value: string,
  minLength: number,
  fieldName: string
): string | null => {
  // Returns error message or null
};

/**
 * Validate max length
 */
export const validateMaxLength = (
  value: string,
  maxLength: number,
  fieldName: string
): string | null => {
  // Returns error message or null
};
```

### 2. Form Hook (Optional but Recommended)

**File**: `src/hooks/useForm.ts`

**Custom hook for form state management**:

```typescript
interface UseFormProps<T> {
  initialValues: T;
  validationRules: ValidationRules<T>;
  onSubmit: (values: T) => Promise<void>;
}

interface ValidationRules<T> {
  [K in keyof T]?: (value: T[K]) => string | null;
}

export const useForm = <T extends Record<string, any>>({
  initialValues,
  validationRules,
  onSubmit,
}: UseFormProps<T>) => {
  // State management
  // Validation logic
  // Submit handling
  // Return { values, errors, handleChange, handleSubmit, isSubmitting }
}
```

## Validation Rules

### Email

- ✅ Not empty
- ✅ Valid email format (contains @, has domain)
- ✅ Max 255 characters
- ❌ No leading/trailing spaces (trim)

**Error Messages**:

- Empty: "Email ist erforderlich"
- Invalid format: "Bitte gib eine gültige Email-Adresse ein"
- Too long: "Email ist zu lang (max. 255 Zeichen)"

### Password

- ✅ Not empty
- ✅ Min 6 characters (Supabase requirement)
- ✅ Recommend 8+ characters (warning, not error)
- ✅ Max 128 characters

**Error Messages**:

- Empty: "Passwort ist erforderlich"
- Too short: "Passwort muss mindestens 6 Zeichen haben"
- Too long: "Passwort ist zu lang (max. 128 Zeichen)"

**Recommendations** (shown as hints, not errors):

- "Wir empfehlen mindestens 8 Zeichen"
- "Nutze eine Kombination aus Buchstaben und Zahlen"

### Confirm Password

- ✅ Not empty
- ✅ Matches password exactly

**Error Messages**:

- Empty: "Bitte bestätige dein Passwort"
- No match: "Passwörter stimmen nicht überein"

### Name (for profile)

- ✅ Not empty
- ✅ Min 2 characters
- ✅ Max 50 characters
- ✅ Only letters, spaces, hyphens

**Error Messages**:

- Empty: "Name ist erforderlich"
- Too short: "Name muss mindestens 2 Zeichen haben"
- Too long: "Name ist zu lang (max. 50 Zeichen)"
- Invalid chars: "Name darf nur Buchstaben enthalten"

### Age (for profile)

- ✅ Not empty
- ✅ Number between 13-120
- ✅ Integer

**Error Messages**:

- Empty: "Alter ist erforderlich"
- Too young: "Du musst mindestens 13 Jahre alt sein"
- Too old: "Bitte gib ein gültiges Alter ein"
- Not a number: "Bitte gib eine Zahl ein"

## Example: Perfect Validation Utils

```typescript
/**
 * Email validation utilities
 */

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_EMAIL_LENGTH = 255;

export const isValidEmail = (email: string): boolean => {
  if (!email || email.trim().length === 0) return false;
  if (email.length > MAX_EMAIL_LENGTH) return false;
  return EMAIL_REGEX.test(email.trim());
};

export const validateEmail = (email: string): string | null => {
  const trimmedEmail = email.trim();

  if (trimmedEmail.length === 0) {
    return "Email ist erforderlich";
  }

  if (trimmedEmail.length > MAX_EMAIL_LENGTH) {
    return `Email ist zu lang (max. ${MAX_EMAIL_LENGTH} Zeichen)`;
  }

  if (!EMAIL_REGEX.test(trimmedEmail)) {
    return "Bitte gib eine gültige Email-Adresse ein";
  }

  return null;
};

/**
 * Password validation utilities
 */

const MIN_PASSWORD_LENGTH = 6;
const RECOMMENDED_PASSWORD_LENGTH = 8;
const MAX_PASSWORD_LENGTH = 128;

export const isValidPassword = (password: string): boolean => {
  return (
    password.length >= MIN_PASSWORD_LENGTH &&
    password.length <= MAX_PASSWORD_LENGTH
  );
};

export const validatePassword = (password: string): string | null => {
  if (password.length === 0) {
    return "Passwort ist erforderlich";
  }

  if (password.length < MIN_PASSWORD_LENGTH) {
    return `Passwort muss mindestens ${MIN_PASSWORD_LENGTH} Zeichen haben`;
  }

  if (password.length > MAX_PASSWORD_LENGTH) {
    return `Passwort ist zu lang (max. ${MAX_PASSWORD_LENGTH} Zeichen)`;
  }

  return null;
};

export const getPasswordStrengthHint = (password: string): string | null => {
  if (
    password.length >= MIN_PASSWORD_LENGTH &&
    password.length < RECOMMENDED_PASSWORD_LENGTH
  ) {
    return `Wir empfehlen mindestens ${RECOMMENDED_PASSWORD_LENGTH} Zeichen für mehr Sicherheit`;
  }
  return null;
};

export const passwordsMatch = (
  password: string,
  confirmPassword: string
): boolean => {
  return password === confirmPassword;
};

export const validatePasswordConfirmation = (
  password: string,
  confirmPassword: string
): string | null => {
  if (confirmPassword.length === 0) {
    return "Bitte bestätige dein Passwort";
  }

  if (!passwordsMatch(password, confirmPassword)) {
    return "Passwörter stimmen nicht überein";
  }

  return null;
};

/**
 * General validation utilities
 */

export const isEmpty = (value: string): boolean => {
  return value.trim().length === 0;
};

export const validateRequired = (
  value: string,
  fieldName: string
): string | null => {
  if (isEmpty(value)) {
    return `${fieldName} ist erforderlich`;
  }
  return null;
};

export const validateMinLength = (
  value: string,
  minLength: number,
  fieldName: string
): string | null => {
  if (value.trim().length < minLength) {
    return `${fieldName} muss mindestens ${minLength} Zeichen haben`;
  }
  return null;
};

export const validateMaxLength = (
  value: string,
  maxLength: number,
  fieldName: string
): string | null => {
  if (value.length > maxLength) {
    return `${fieldName} ist zu lang (max. ${maxLength} Zeichen)`;
  }
  return null;
};

/**
 * Combined validator for registration form
 */
export interface RegistrationFormData {
  email: string;
  password: string;
  confirmPassword: string;
}

export interface ValidationErrors {
  email?: string;
  password?: string;
  confirmPassword?: string;
}

export const validateRegistrationForm = (
  formData: RegistrationFormData
): ValidationErrors => {
  const errors: ValidationErrors = {};

  // Validate email
  const emailError = validateEmail(formData.email);
  if (emailError) errors.email = emailError;

  // Validate password
  const passwordError = validatePassword(formData.password);
  if (passwordError) errors.password = passwordError;

  // Validate password confirmation
  const confirmError = validatePasswordConfirmation(
    formData.password,
    formData.confirmPassword
  );
  if (confirmError) errors.confirmPassword = confirmError;

  return errors;
};

/**
 * Check if form has errors
 */
export const hasErrors = (errors: ValidationErrors): boolean => {
  return Object.keys(errors).length > 0;
};
```

## Example: useForm Hook

```typescript
import { useState } from "react";

interface UseFormProps<T> {
  initialValues: T;
  validate: (values: T) => Partial<Record<keyof T, string>>;
  onSubmit: (values: T) => Promise<void>;
}

export const useForm = <T extends Record<string, any>>({
  initialValues,
  validate,
  onSubmit,
}: UseFormProps<T>) => {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleChange = (field: keyof T, value: any) => {
    setValues((prev) => ({ ...prev, [field]: value }));

    // Clear error for this field
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  const handleSubmit = async () => {
    // Validate
    const validationErrors = validate(values);

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    // Submit
    setIsSubmitting(true);
    try {
      await onSubmit(values);
    } catch (error) {
      console.error("Form submission error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    values,
    errors,
    isSubmitting,
    handleChange,
    handleSubmit,
  };
};
```

## Code Quality Requirements

✅ **Must Have**:

- Clear, descriptive error messages in German
- Consistent validation across app
- TypeScript types for all functions
- Trim whitespace before validation
- Case-insensitive where appropriate (emails)
- Performance (validate on blur, not on every keystroke for heavy validations)

❌ **Avoid**:

- Generic error messages ("Invalid input")
- Multiple errors for same field (show most important)
- Validating on every keystroke (annoying)
- Client-side only security (backend validates too)
- Hardcoded messages (use constants)

## Testing Checklist

- [ ] Empty email shows error
- [ ] Invalid email format shows error
- [ ] Valid email passes
- [ ] Empty password shows error
- [ ] Password < 6 chars shows error
- [ ] Valid password passes
- [ ] Passwords don't match shows error
- [ ] Matching passwords pass
- [ ] Trim whitespace works
- [ ] Error clears when fixed

## Output Format

Provide:

1. Complete `src/utils/validation.ts`
2. Optional: `src/hooks/useForm.ts`
3. All validators fully typed
4. German error messages
5. JSDoc comments
6. Usage examples

## Success Criteria

- ✅ All validations work correctly
- ✅ User-friendly error messages
- ✅ TypeScript typed
- ✅ Reusable across app
- ✅ Performant (no lag)
- ✅ Consistent UX
