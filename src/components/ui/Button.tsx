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
  primary: "#4A90E2",
  secondary: "#7B68EE",
  success: "#34C759",
  error: "#FF3B30",
  danger: "#F44336",
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

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "outline"
  | "ghost"
  | "danger"
  | "text"; // Keep 'text' for backwards compatibility

export type ButtonSize = "small" | "medium" | "large";

interface ButtonProps {
  /** Button content - can be text or custom components */
  children?: React.ReactNode;
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
  /** Make button full width */
  fullWidth?: boolean;
  /** Button style override */
  style?: ViewStyle;
  /** Text style override */
  textStyle?: TextStyle;
  /** Optional icon element */
  icon?: React.ReactNode;
  /** Icon position */
  iconPosition?: "left" | "right";
  /** @deprecated Use children instead */
  title?: string;
}

/**
 * Button Component
 *
 * A reusable button component with support for different variants,
 * sizes, loading states, icons, and disabled states.
 *
 * @example
 * ```tsx
 * // New API with children
 * <Button
 *   onPress={handleSignIn}
 *   variant="primary"
 *   size="large"
 *   loading={isLoading}
 * >
 *   Sign In
 * </Button>
 *
 * // With icon
 * <Button
 *   onPress={handleNext}
 *   icon={<Icon name="arrow-right" />}
 *   iconPosition="right"
 * >
 *   Next
 * </Button>
 *
 * // Legacy API (still supported)
 * <Button
 *   title="Sign In"
 *   onPress={handleSignIn}
 * />
 * ```
 */
export const Button: React.FC<ButtonProps> = ({
  children,
  title, // Legacy support
  onPress,
  loading = false,
  disabled = false,
  variant = "primary",
  size = "medium",
  fullWidth = false,
  style,
  textStyle,
  icon,
  iconPosition = "left",
}) => {
  const isDisabled = disabled || loading;
  const content = children || title; // Support both APIs

  const getButtonStyle = (): ViewStyle => {
    const baseStyle: ViewStyle = {};

    // Variant styles
    switch (variant) {
      case "primary":
        baseStyle.backgroundColor = COLORS.primary;
        break;
      case "secondary":
        baseStyle.backgroundColor = COLORS.secondary;
        break;
      case "outline":
        baseStyle.backgroundColor = "transparent";
        baseStyle.borderWidth = 2;
        baseStyle.borderColor = COLORS.primary;
        break;
      case "ghost":
      case "text": // Keep 'text' for backwards compatibility
        baseStyle.backgroundColor = "transparent";
        break;
      case "danger":
        baseStyle.backgroundColor = COLORS.danger;
        break;
    }

    // Size styles
    switch (size) {
      case "small":
        baseStyle.paddingVertical = SPACING.sm;
        baseStyle.paddingHorizontal = 12;
        break;
      case "medium":
        baseStyle.paddingVertical = 14;
        baseStyle.paddingHorizontal = 20;
        break;
      case "large":
        baseStyle.paddingVertical = 18;
        baseStyle.paddingHorizontal = 24;
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
      case "secondary":
      case "danger":
        baseStyle.color = COLORS.background;
        break;
      case "outline":
      case "ghost":
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
      case "secondary":
      case "danger":
        return COLORS.background;
      case "outline":
      case "ghost":
      case "text":
        return COLORS.primary;
    }
  };

  const renderContent = () => {
    if (loading) {
      return (
        <ActivityIndicator
          size="small"
          color={getSpinnerColor()}
          accessibilityLabel="Loading"
        />
      );
    }

    // If content is a string, wrap it in Text
    const textContent =
      typeof content === "string" ? (
        <Text
          style={[
            getTextStyle(),
            isDisabled && styles.textDisabled,
            textStyle,
          ]}
        >
          {content}
        </Text>
      ) : (
        content
      );

    // Render with icon if provided
    if (icon) {
      return (
        <>
          {iconPosition === "left" && icon}
          {textContent}
          {iconPosition === "right" && icon}
        </>
      );
    }

    return textContent;
  };

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.7}
      style={[
        styles.button,
        getButtonStyle(),
        fullWidth && styles.fullWidth,
        isDisabled && styles.buttonDisabled,
        style,
      ]}
      accessibilityLabel={typeof content === "string" ? content : "Button"}
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: loading }}
    >
      {renderContent()}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    gap: 8,
    minHeight: 44, // iOS minimum touch target
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  textDisabled: {
    color: COLORS.disabled,
  },
  fullWidth: {
    width: "100%",
  },
});
