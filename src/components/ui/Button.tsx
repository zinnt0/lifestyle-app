import React from "react";
import {
  StyleSheet,
  TouchableOpacity,
  Text,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from "react-native";

// Design System Constants
const COLORS = {
  primary: "#007AFF",
  secondary: "#5856D6",
  success: "#34C759",
  error: "#FF3B30",
  background: "#FFFFFF",
  backgroundSecondary: "#F2F2F7",
  text: "#000000",
  textSecondary: "#8E8E93",
  border: "#C6C6C8",
  disabled: "#C7C7CC",
};

const SPACING = {
  sm: 8,
  md: 16,
  lg: 24,
};

const FONTS = {
  sizes: {
    small: 14,
    medium: 16,
    large: 18,
  },
  weights: {
    medium: "500" as const,
    semibold: "600" as const,
  },
};

type ButtonVariant = "primary" | "secondary" | "outline" | "text";
type ButtonSize = "small" | "medium" | "large";

interface ButtonProps {
  /** Button text */
  title: string;
  /** Called when button is pressed */
  onPress: () => void;
  /** Show loading spinner */
  loading?: boolean;
  /** Disable the button */
  disabled?: boolean;
  /** Button style variant */
  variant?: ButtonVariant;
  /** Button size */
  size?: ButtonSize;
  /** Button style override */
  style?: ViewStyle;
  /** Text style override */
  textStyle?: TextStyle;
}

/**
 * Button Component
 *
 * A reusable button component with support for different variants,
 * sizes, loading states, and disabled states.
 *
 * @example
 * ```tsx
 * <Button
 *   title="Sign In"
 *   onPress={handleSignIn}
 *   variant="primary"
 *   size="large"
 *   loading={isLoading}
 * />
 * ```
 */
export const Button: React.FC<ButtonProps> = ({
  title,
  onPress,
  loading = false,
  disabled = false,
  variant = "primary",
  size = "medium",
  style,
  textStyle,
}) => {
  const isDisabled = disabled || loading;

  const getButtonStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {};

    // Variant styles
    switch (variant) {
      case "primary":
        baseStyle.backgroundColor = COLORS.primary;
        break;
      case "secondary":
        baseStyle.backgroundColor = COLORS.backgroundSecondary;
        break;
      case "outline":
        baseStyle.backgroundColor = "transparent";
        baseStyle.borderWidth = 2;
        baseStyle.borderColor = COLORS.primary;
        break;
      case "text":
        baseStyle.backgroundColor = "transparent";
        break;
    }

    // Size styles
    switch (size) {
      case "small":
        baseStyle.paddingVertical = SPACING.sm;
        baseStyle.paddingHorizontal = SPACING.md;
        break;
      case "medium":
        baseStyle.paddingVertical = 12;
        baseStyle.paddingHorizontal = SPACING.lg;
        break;
      case "large":
        baseStyle.paddingVertical = SPACING.md;
        baseStyle.paddingHorizontal = 32;
        break;
    }

    return baseStyle;
  };

  const getTextStyle = (): TextStyle => {
    const baseStyle: TextStyle = {
      fontWeight: FONTS.weights.semibold,
    };

    // Variant text colors
    switch (variant) {
      case "primary":
        baseStyle.color = COLORS.background;
        break;
      case "secondary":
        baseStyle.color = COLORS.text;
        break;
      case "outline":
      case "text":
        baseStyle.color = COLORS.primary;
        break;
    }

    // Size text styles
    switch (size) {
      case "small":
        baseStyle.fontSize = FONTS.sizes.small;
        break;
      case "medium":
        baseStyle.fontSize = FONTS.sizes.medium;
        break;
      case "large":
        baseStyle.fontSize = FONTS.sizes.large;
        break;
    }

    return baseStyle;
  };

  const getSpinnerColor = (): string => {
    switch (variant) {
      case "primary":
        return COLORS.background;
      case "secondary":
      case "outline":
      case "text":
        return COLORS.primary;
    }
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.7}
      style={[
        styles.button,
        getButtonStyle(),
        isDisabled && styles.buttonDisabled,
        style,
      ]}
      accessibilityLabel={title}
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
    >
      {loading ? (
        <ActivityIndicator
          size="small"
          color={getSpinnerColor()}
          accessibilityLabel="Loading"
        />
      ) : (
        <Text
          style={[
            getTextStyle(),
            isDisabled && styles.textDisabled,
            textStyle,
          ]}
        >
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    minHeight: 44, // iOS minimum touch target
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  textDisabled: {
    color: COLORS.disabled,
  },
});
