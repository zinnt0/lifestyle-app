/**
 * Form Validation Utilities
 *
 * Provides validation functions for all form inputs in the app.
 * All error messages are in German for better UX.
 */

/**
 * Email validation utilities
 */

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MAX_EMAIL_LENGTH = 255;

/**
 * Check if email is valid
 *
 * @param email - Email address to validate
 * @returns true if valid, false otherwise
 *
 * @example
 * isValidEmail("user@example.com") // true
 * isValidEmail("invalid") // false
 */
export const isValidEmail = (email: string): boolean => {
  if (!email || email.trim().length === 0) return false;
  if (email.length > MAX_EMAIL_LENGTH) return false;
  return EMAIL_REGEX.test(email.trim());
};

/**
 * Validate email and return error message if invalid
 *
 * @param email - Email address to validate
 * @returns Error message in German or null if valid
 *
 * @example
 * validateEmail("") // "Email ist erforderlich"
 * validateEmail("invalid") // "Bitte gib eine gültige Email-Adresse ein"
 * validateEmail("user@example.com") // null
 */
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

/**
 * Check if password meets minimum requirements
 *
 * @param password - Password to validate
 * @returns true if valid, false otherwise
 *
 * @example
 * isValidPassword("12345") // false (too short)
 * isValidPassword("password123") // true
 */
export const isValidPassword = (password: string): boolean => {
  return (
    password.length >= MIN_PASSWORD_LENGTH &&
    password.length <= MAX_PASSWORD_LENGTH
  );
};

/**
 * Validate password and return error message if invalid
 *
 * @param password - Password to validate
 * @returns Error message in German or null if valid
 *
 * @example
 * validatePassword("") // "Passwort ist erforderlich"
 * validatePassword("123") // "Passwort muss mindestens 6 Zeichen haben"
 * validatePassword("password123") // null
 */
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

/**
 * Get password strength hint (not an error, just a recommendation)
 *
 * @param password - Password to check
 * @returns Hint message in German or null
 *
 * @example
 * getPasswordStrengthHint("pass12") // "Wir empfehlen mindestens 8 Zeichen für mehr Sicherheit"
 * getPasswordStrengthHint("password123") // null
 */
export const getPasswordStrengthHint = (password: string): string | null => {
  if (
    password.length >= MIN_PASSWORD_LENGTH &&
    password.length < RECOMMENDED_PASSWORD_LENGTH
  ) {
    return `Wir empfehlen mindestens ${RECOMMENDED_PASSWORD_LENGTH} Zeichen für mehr Sicherheit`;
  }
  return null;
};

/**
 * Check if two passwords match
 *
 * @param password - First password
 * @param confirmPassword - Second password to compare
 * @returns true if they match exactly, false otherwise
 *
 * @example
 * passwordsMatch("password123", "password123") // true
 * passwordsMatch("password123", "password124") // false
 */
export const passwordsMatch = (
  password: string,
  confirmPassword: string
): boolean => {
  return password === confirmPassword;
};

/**
 * Validate password confirmation
 *
 * @param password - Original password
 * @param confirmPassword - Password confirmation
 * @returns Error message in German or null if valid
 *
 * @example
 * validatePasswordConfirmation("pass123", "") // "Bitte bestätige dein Passwort"
 * validatePasswordConfirmation("pass123", "pass124") // "Passwörter stimmen nicht überein"
 * validatePasswordConfirmation("pass123", "pass123") // null
 */
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

/**
 * Check if a string value is empty (after trimming)
 *
 * @param value - String to check
 * @returns true if empty, false otherwise
 *
 * @example
 * isEmpty("") // true
 * isEmpty("  ") // true
 * isEmpty("hello") // false
 */
export const isEmpty = (value: string): boolean => {
  return value.trim().length === 0;
};

/**
 * Validate required field
 *
 * @param value - Field value
 * @param fieldName - Name of the field (in German)
 * @returns Error message or null if valid
 *
 * @example
 * validateRequired("", "Name") // "Name ist erforderlich"
 * validateRequired("John", "Name") // null
 */
export const validateRequired = (
  value: string,
  fieldName: string
): string | null => {
  if (isEmpty(value)) {
    return `${fieldName} ist erforderlich`;
  }
  return null;
};

/**
 * Validate minimum length
 *
 * @param value - Field value
 * @param minLength - Minimum length required
 * @param fieldName - Name of the field (in German)
 * @returns Error message or null if valid
 *
 * @example
 * validateMinLength("Hi", 3, "Name") // "Name muss mindestens 3 Zeichen haben"
 * validateMinLength("Hello", 3, "Name") // null
 */
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

/**
 * Validate maximum length
 *
 * @param value - Field value
 * @param maxLength - Maximum length allowed
 * @param fieldName - Name of the field (in German)
 * @returns Error message or null if valid
 *
 * @example
 * validateMaxLength("This is a very long text", 10, "Name") // "Name ist zu lang (max. 10 Zeichen)"
 * validateMaxLength("Short", 10, "Name") // null
 */
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
 * Validate name (letters, spaces, hyphens only)
 *
 * @param name - Name to validate
 * @returns Error message or null if valid
 */
export const validateName = (name: string): string | null => {
  const trimmedName = name.trim();

  if (trimmedName.length === 0) {
    return "Name ist erforderlich";
  }

  if (trimmedName.length < 2) {
    return "Name muss mindestens 2 Zeichen haben";
  }

  if (trimmedName.length > 50) {
    return "Name ist zu lang (max. 50 Zeichen)";
  }

  // Only letters, spaces, and hyphens
  const nameRegex = /^[a-zA-ZäöüÄÖÜß\s-]+$/;
  if (!nameRegex.test(trimmedName)) {
    return "Name darf nur Buchstaben enthalten";
  }

  return null;
};

/**
 * Validate age
 *
 * @param age - Age as string or number
 * @returns Error message or null if valid
 */
export const validateAge = (age: string | number): string | null => {
  const ageStr = age.toString().trim();

  if (ageStr.length === 0) {
    return "Alter ist erforderlich";
  }

  const ageNum = parseInt(ageStr, 10);

  if (isNaN(ageNum)) {
    return "Bitte gib eine Zahl ein";
  }

  if (ageNum < 13) {
    return "Du musst mindestens 13 Jahre alt sein";
  }

  if (ageNum > 120) {
    return "Bitte gib ein gültiges Alter ein";
  }

  return null;
};

/**
 * Form-specific validators
 */

/**
 * Registration form data interface
 */
export interface RegistrationFormData {
  email: string;
  password: string;
  confirmPassword: string;
}

/**
 * Login form data interface
 */
export interface LoginFormData {
  email: string;
  password: string;
}

/**
 * Validation errors interface
 */
export interface ValidationErrors {
  email?: string;
  password?: string;
  confirmPassword?: string;
  name?: string;
  age?: string;
}

/**
 * Validate complete registration form
 *
 * @param formData - Registration form data
 * @returns Object with error messages for each field
 *
 * @example
 * const errors = validateRegistrationForm({
 *   email: "invalid",
 *   password: "123",
 *   confirmPassword: "456"
 * });
 * // errors = {
 * //   email: "Bitte gib eine gültige Email-Adresse ein",
 * //   password: "Passwort muss mindestens 6 Zeichen haben",
 * //   confirmPassword: "Passwörter stimmen nicht überein"
 * // }
 */
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
 * Validate login form
 *
 * @param formData - Login form data
 * @returns Object with error messages for each field
 *
 * @example
 * const errors = validateLoginForm({
 *   email: "",
 *   password: ""
 * });
 * // errors = {
 * //   email: "Email ist erforderlich",
 * //   password: "Passwort ist erforderlich"
 * // }
 */
export const validateLoginForm = (formData: LoginFormData): ValidationErrors => {
  const errors: ValidationErrors = {};

  // Validate email
  const emailError = validateEmail(formData.email);
  if (emailError) errors.email = emailError;

  // Validate password (less strict for login)
  if (formData.password.length === 0) {
    errors.password = "Passwort ist erforderlich";
  }

  return errors;
};

/**
 * Check if validation errors object has any errors
 *
 * @param errors - Validation errors object
 * @returns true if there are errors, false otherwise
 *
 * @example
 * hasErrors({}) // false
 * hasErrors({ email: "Error" }) // true
 */
export const hasErrors = (errors: ValidationErrors): boolean => {
  return Object.keys(errors).length > 0;
};

/**
 * Get first error message from errors object
 *
 * @param errors - Validation errors object
 * @returns First error message or null
 *
 * @example
 * getFirstError({ email: "Error 1", password: "Error 2" }) // "Error 1"
 * getFirstError({}) // null
 */
export const getFirstError = (errors: ValidationErrors): string | null => {
  const errorKeys = Object.keys(errors) as Array<keyof ValidationErrors>;
  if (errorKeys.length === 0) return null;
  return errors[errorKeys[0]] || null;
};
