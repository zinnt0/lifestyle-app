import React from "react";
import { StyleSheet, Text as RNText, TextStyle, TextProps as RNTextProps } from "react-native";

// Design System Constants
const COLORS = {
  primary: "#007AFF",
  error: "#FF3B30",
  success: "#34C759",
  warning: "#FF9500",
  text: "#000000",
  textSecondary: "#8E8E93",
  textTertiary: "#C7C7CC",
};

const FONTS = {
  sizes: {
    small: 14,
    medium: 16,
    large: 18,
    xlarge: 24,
    xxlarge: 32,
  },
  weights: {
    regular: "400" as const,
    medium: "500" as const,
    semibold: "600" as const,
    bold: "700" as const,
  },
};

type TextVariant = "heading1" | "heading2" | "heading3" | "body" | "caption" | "error";
type TextColor = "primary" | "secondary" | "tertiary" | "error" | "success" | "warning";
type TextAlign = "left" | "center" | "right" | "justify";
type TextWeight = "regular" | "medium" | "semibold" | "bold";

interface TextComponentProps extends Omit<RNTextProps, "style"> {
  /** Text content */
  children: React.ReactNode;
  /** Text variant style */
  variant?: TextVariant;
  /** Text color */
  color?: TextColor;
  /** Text alignment */
  align?: TextAlign;
  /** Font weight */
  weight?: TextWeight;
  /** Text style override */
  style?: TextStyle;
}

/**
 * Text Component
 *
 * A reusable text component with consistent typography across the app.
 * Supports different variants, colors, alignments, and weights.
 *
 * @example
 * ```tsx
 * <Text variant="heading1" align="center">
 *   Welcome
 * </Text>
 *
 * <Text variant="body" color="secondary">
 *   This is body text
 * </Text>
 *
 * <Text variant="error">
 *   Error message
 * </Text>
 * ```
 */
export const Text: React.FC<TextComponentProps> = ({
  children,
  variant = "body",
  color,
  align = "left",
  weight,
  style,
  ...rest
}) => {
  const getVariantStyle = (): TextStyle => {
    switch (variant) {
      case "heading1":
        return {
          fontSize: FONTS.sizes.xxlarge,
          fontWeight: FONTS.weights.bold,
          lineHeight: FONTS.sizes.xxlarge * 1.2,
          color: COLORS.text,
        };
      case "heading2":
        return {
          fontSize: FONTS.sizes.xlarge,
          fontWeight: FONTS.weights.bold,
          lineHeight: FONTS.sizes.xlarge * 1.2,
          color: COLORS.text,
        };
      case "heading3":
        return {
          fontSize: FONTS.sizes.large,
          fontWeight: FONTS.weights.semibold,
          lineHeight: FONTS.sizes.large * 1.3,
          color: COLORS.text,
        };
      case "body":
        return {
          fontSize: FONTS.sizes.medium,
          fontWeight: FONTS.weights.regular,
          lineHeight: FONTS.sizes.medium * 1.5,
          color: COLORS.text,
        };
      case "caption":
        return {
          fontSize: FONTS.sizes.small,
          fontWeight: FONTS.weights.regular,
          lineHeight: FONTS.sizes.small * 1.4,
          color: COLORS.textSecondary,
        };
      case "error":
        return {
          fontSize: FONTS.sizes.small,
          fontWeight: FONTS.weights.medium,
          lineHeight: FONTS.sizes.small * 1.4,
          color: COLORS.error,
        };
    }
  };

  const getColorStyle = (): TextStyle => {
    if (!color) return {};

    switch (color) {
      case "primary":
        return { color: COLORS.primary };
      case "secondary":
        return { color: COLORS.textSecondary };
      case "tertiary":
        return { color: COLORS.textTertiary };
      case "error":
        return { color: COLORS.error };
      case "success":
        return { color: COLORS.success };
      case "warning":
        return { color: COLORS.warning };
    }
  };

  const getAlignStyle = (): TextStyle => {
    return { textAlign: align };
  };

  const getWeightStyle = (): TextStyle => {
    if (!weight) return {};

    return { fontWeight: FONTS.weights[weight] };
  };

  return (
    <RNText
      style={[
        styles.text,
        getVariantStyle(),
        getColorStyle(),
        getAlignStyle(),
        getWeightStyle(),
        style,
      ]}
      accessibilityRole="text"
      {...rest}
    >
      {children}
    </RNText>
  );
};

const styles = StyleSheet.create({
  text: {
    // Base text style
  },
});
