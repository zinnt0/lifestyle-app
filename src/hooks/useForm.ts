/**
 * useForm Hook
 *
 * Custom hook for managing form state, validation, and submission.
 * Provides a clean API for handling forms with validation.
 */

import { useState } from "react";

/**
 * Props for useForm hook
 */
interface UseFormProps<T> {
  /** Initial values for the form fields */
  initialValues: T;
  /** Validation function that returns errors for each field */
  validate: (values: T) => Partial<Record<keyof T, string>>;
  /** Function to call when form is submitted (after validation) */
  onSubmit: (values: T) => Promise<void>;
}

/**
 * Return type of useForm hook
 */
interface UseFormReturn<T> {
  /** Current form values */
  values: T;
  /** Current validation errors */
  errors: Partial<Record<keyof T, string>>;
  /** Whether form is currently being submitted */
  isSubmitting: boolean;
  /** Update a field value */
  handleChange: (field: keyof T, value: any) => void;
  /** Submit the form (validates first) */
  handleSubmit: () => Promise<void>;
  /** Manually set errors */
  setErrors: (errors: Partial<Record<keyof T, string>>) => void;
  /** Reset form to initial values */
  resetForm: () => void;
  /** Validate a single field */
  validateField: (field: keyof T) => void;
}

/**
 * Custom hook for form management
 *
 * Handles form state, validation, and submission with proper error handling.
 * Automatically clears errors when fields are changed.
 *
 * @param props - Form configuration
 * @returns Form state and handlers
 *
 * @example
 * const { values, errors, handleChange, handleSubmit } = useForm({
 *   initialValues: { email: "", password: "" },
 *   validate: (values) => {
 *     const errors = {};
 *     if (!values.email) errors.email = "Email ist erforderlich";
 *     return errors;
 *   },
 *   onSubmit: async (values) => {
 *     await signIn(values.email, values.password);
 *   }
 * });
 *
 * // In component:
 * <Input
 *   value={values.email}
 *   onChangeText={(text) => handleChange("email", text)}
 *   error={errors.email}
 * />
 * <Button onPress={handleSubmit}>Submit</Button>
 */
export const useForm = <T extends Record<string, any>>({
  initialValues,
  validate,
  onSubmit,
}: UseFormProps<T>): UseFormReturn<T> => {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<Partial<Record<keyof T, string>>>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  /**
   * Handle field value change
   * Automatically clears error for the changed field
   */
  const handleChange = (field: keyof T, value: any) => {
    setValues((prev) => ({ ...prev, [field]: value }));

    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  /**
   * Validate a single field
   * Useful for onBlur validation
   */
  const validateField = (field: keyof T) => {
    const validationErrors = validate(values);
    if (validationErrors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: validationErrors[field],
      }));
    } else {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };

  /**
   * Handle form submission
   * Validates all fields before calling onSubmit
   */
  const handleSubmit = async () => {
    // Run validation
    const validationErrors = validate(values);

    // If there are errors, set them and don't submit
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    // Submit form
    setIsSubmitting(true);
    try {
      await onSubmit(values);
      // Form submitted successfully
    } catch (error) {
      console.error("Form submission error:", error);
      // Error is handled by onSubmit (e.g., auth errors)
    } finally {
      setIsSubmitting(false);
    }
  };

  /**
   * Reset form to initial values
   */
  const resetForm = () => {
    setValues(initialValues);
    setErrors({});
    setIsSubmitting(false);
  };

  return {
    values,
    errors,
    isSubmitting,
    handleChange,
    handleSubmit,
    setErrors,
    resetForm,
    validateField,
  };
};

/**
 * Example usage:
 *
 * // Login Form
 * const loginForm = useForm({
 *   initialValues: { email: "", password: "" },
 *   validate: validateLoginForm,
 *   onSubmit: async (values) => {
 *     const { error } = await signIn(values.email, values.password);
 *     if (error) {
 *       loginForm.setErrors({ email: error.message });
 *     }
 *   }
 * });
 *
 * // Registration Form
 * const registerForm = useForm({
 *   initialValues: { email: "", password: "", confirmPassword: "" },
 *   validate: validateRegistrationForm,
 *   onSubmit: async (values) => {
 *     const { error } = await signUp(values.email, values.password);
 *     if (error) {
 *       registerForm.setErrors({ email: error.message });
 *     }
 *   }
 * });
 */
