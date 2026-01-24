import React, { useState, useRef, useCallback, forwardRef, useImperativeHandle, memo } from "react";
import {
  StyleSheet,
  TextInput,
  View,
  Text,
  TouchableOpacity,
  TextInputProps,
  ViewStyle,
} from "react-native";
import { COLORS, SPACING, TYPOGRAPHY, SHADOWS, BORDER_RADIUS } from "./theme";

interface InputProps extends Omit<TextInputProps, "style"> {
  /** Input value */
  value: string;
  /** Called when text changes */
  onChangeText: (text: string) => void;
  /** Placeholder text */
  placeholder?: string;
  /** Error message to display */
  error?: string;
  /** Input label */
  label?: string;
  /** Disable the input */
  disabled?: boolean;
  /** Show clear button when input has value */
  showClearButton?: boolean;
  /** Left icon component */
  leftIcon?: React.ReactNode;
  /** Right icon component */
  rightIcon?: React.ReactNode;
  /** Input container style override */
  style?: ViewStyle;
  /** Enable multiline with auto-resize */
  multiline?: boolean;
}

/**
 * Input Component
 *
 * A reusable text input component with support for labels, errors,
 * icons, and clear functionality.
 *
 * @example
 * ```tsx
 * <Input
 *   label="Email"
 *   value={email}
 *   onChangeText={setEmail}
 *   placeholder="Enter your email"
 *   keyboardType="email-address"
 *   error={emailError}
 * />
 * ```
 */
const InputComponent = forwardRef<TextInput, InputProps>(({
  value,
  onChangeText,
  placeholder,
  error,
  label,
  disabled = false,
  showClearButton = false,
  leftIcon,
  rightIcon,
  secureTextEntry,
  keyboardType = "default",
  autoCapitalize = "none",
  multiline = false,
  style,
  ...rest
}, ref) => {
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<TextInput>(null);

  // Expose the input ref to parent components
  useImperativeHandle(ref, () => inputRef.current as TextInput);

  const handleClear = useCallback(() => {
    onChangeText("");
    // Refocus the input after clearing
    inputRef.current?.focus();
  }, [onChangeText]);

  const handleFocus = useCallback(() => {
    setIsFocused(true);
  }, []);

  const handleBlur = useCallback(() => {
    setIsFocused(false);
  }, []);

  const showClear = showClearButton && value && value.length > 0 && !disabled;

  return (
    <View style={[styles.container, style]}>
      {label && <Text style={styles.label}>{label}</Text>}

      <View
        style={[
          styles.inputContainer,
          isFocused && styles.inputContainerFocused,
          error && styles.inputContainerError,
          disabled && styles.inputContainerDisabled,
        ]}
      >
        {leftIcon && <View style={styles.leftIconContainer}>{leftIcon}</View>}

        <TextInput
          ref={inputRef}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={COLORS.textTertiary}
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          editable={!disabled}
          multiline={multiline}
          onFocus={handleFocus}
          onBlur={handleBlur}
          blurOnSubmit={false}
          style={[
            styles.input,
            leftIcon ? styles.inputWithLeftIcon : undefined,
            (rightIcon || showClear) ? styles.inputWithRightIcon : undefined,
            multiline ? styles.inputMultiline : undefined,
            disabled ? styles.inputDisabled : undefined,
          ]}
          accessibilityLabel={label || placeholder}
          accessibilityHint={error}
          accessibilityState={{ disabled }}
          {...rest}
        />

        {showClear && (
          <TouchableOpacity
            onPress={handleClear}
            style={styles.clearButton}
            accessibilityLabel="Clear input"
            accessibilityRole="button"
          >
            <Text style={styles.clearButtonText}>✕</Text>
          </TouchableOpacity>
        )}

        {rightIcon && !showClear && (
          <View style={styles.rightIconContainer}>{rightIcon}</View>
        )}
      </View>

      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
});

// Wrap with memo to prevent unnecessary re-renders from parent components
export const Input = memo(InputComponent);

const styles = StyleSheet.create({
  container: {
    marginBottom: SPACING.lg,
  },
  label: {
    fontSize: TYPOGRAPHY.sizes.sm,
    fontWeight: TYPOGRAPHY.weights.semibold,
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.surface,
    borderWidth: 2,
    borderColor: COLORS.borderLight,
    borderRadius: BORDER_RADIUS.lg,
  },
  inputContainerFocused: {
    borderColor: COLORS.primary,
    ...SHADOWS.sm,
  },
  inputContainerError: {
    borderColor: COLORS.error,
  },
  inputContainerDisabled: {
    backgroundColor: COLORS.borderLight,
    borderColor: COLORS.borderLight,
  },
  input: {
    flex: 1,
    paddingHorizontal: SPACING.lg,
    paddingVertical: 14,
    fontSize: TYPOGRAPHY.sizes.md,
    color: COLORS.text,
  },
  inputWithLeftIcon: {
    paddingLeft: SPACING.sm,
  },
  inputWithRightIcon: {
    paddingRight: SPACING.sm,
  },
  inputMultiline: {
    minHeight: 80,
    textAlignVertical: "top",
    paddingTop: 14,
  },
  inputDisabled: {
    color: COLORS.textSecondary,
  },
  leftIconContainer: {
    paddingLeft: SPACING.lg,
    justifyContent: "center",
    alignItems: "center",
  },
  rightIconContainer: {
    paddingRight: SPACING.lg,
    justifyContent: "center",
    alignItems: "center",
  },
  clearButton: {
    marginRight: SPACING.sm,
    marginLeft: SPACING.sm,
    width: 28,
    height: 28,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: COLORS.borderLight,
    justifyContent: "center",
    alignItems: "center",
  },
  clearButtonText: {
    fontSize: TYPOGRAPHY.sizes.md,
    color: COLORS.textSecondary,
    fontWeight: TYPOGRAPHY.weights.semibold,
  },
  errorText: {
    color: COLORS.error,
    fontSize: TYPOGRAPHY.sizes.xs,
    marginTop: SPACING.sm,
    marginLeft: SPACING.sm,
  },
});
