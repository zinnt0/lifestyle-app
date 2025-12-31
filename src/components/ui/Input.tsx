import React, { useState } from "react";
import {
  StyleSheet,
  TextInput,
  View,
  Text,
  TouchableOpacity,
  TextInputProps,
  ViewStyle,
} from "react-native";

// Design System Constants
const COLORS = {
  primary: "#007AFF",
  error: "#FF3B30",
  text: "#000000",
  textSecondary: "#8E8E93",
  textTertiary: "#C7C7CC",
  border: "#C6C6C8",
  borderLight: "#E5E5EA",
  background: "#FFFFFF",
  disabled: "#C7C7CC",
};

const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
};

const FONTS = {
  sizes: {
    small: 14,
    medium: 16,
  },
  weights: {
    medium: "500" as const,
  },
};

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
export const Input: React.FC<InputProps> = ({
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
}) => {
  const [isFocused, setIsFocused] = useState(false);

  const handleClear = () => {
    onChangeText("");
  };

  const showClear = showClearButton && value.length > 0 && !disabled;

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
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={COLORS.textTertiary}
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          autoCapitalize={autoCapitalize}
          editable={!disabled}
          multiline={multiline}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
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
};

const styles = StyleSheet.create({
  container: {
    marginBottom: SPACING.md,
  },
  label: {
    fontSize: FONTS.sizes.small,
    fontWeight: FONTS.weights.medium,
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
  },
  inputContainerFocused: {
    borderColor: COLORS.primary,
    borderWidth: 2,
  },
  inputContainerError: {
    borderColor: COLORS.error,
  },
  inputContainerDisabled: {
    backgroundColor: COLORS.borderLight,
    borderColor: COLORS.disabled,
  },
  input: {
    flex: 1,
    paddingHorizontal: SPACING.md,
    paddingVertical: 12,
    fontSize: FONTS.sizes.medium,
    color: COLORS.text,
  },
  inputWithLeftIcon: {
    paddingLeft: SPACING.xs,
  },
  inputWithRightIcon: {
    paddingRight: SPACING.xs,
  },
  inputMultiline: {
    minHeight: 80,
    textAlignVertical: "top",
    paddingTop: 12,
  },
  inputDisabled: {
    color: COLORS.textSecondary,
  },
  leftIconContainer: {
    paddingLeft: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  rightIconContainer: {
    paddingRight: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  clearButton: {
    paddingRight: 12,
    paddingLeft: SPACING.sm,
    justifyContent: "center",
    alignItems: "center",
  },
  clearButtonText: {
    fontSize: 18,
    color: COLORS.textSecondary,
    fontWeight: "600",
  },
  errorText: {
    color: COLORS.error,
    fontSize: 12,
    marginTop: SPACING.xs,
    marginLeft: SPACING.xs,
  },
});
