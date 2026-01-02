import React from "react";
import { StyleSheet, Text as RNText, TextStyle, TextProps as RNTextProps } from "react-native";
import { COLORS, TYPOGRAPHY } from './theme';

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
          fontSize: TYPOGRAPHY.sizes.xxxl,
          fontWeight: TYPOGRAPHY.weights.bold,
          lineHeight: TYPOGRAPHY.sizes.xxxl * 1.25,
          color: COLORS.text,
        };
      case "heading2":
        return {
          fontSize: TYPOGRAPHY.sizes.xxl,
          fontWeight: TYPOGRAPHY.weights.bold,
          lineHeight: TYPOGRAPHY.sizes.xxl * 1.25,
          color: COLORS.text,
        };
      case "heading3":
        return {
          fontSize: TYPOGRAPHY.sizes.lg,
          fontWeight: TYPOGRAPHY.weights.semibold,
          lineHeight: TYPOGRAPHY.sizes.lg * 1.35,
          color: COLORS.text,
        };
      case "body":
        return {
          fontSize: TYPOGRAPHY.sizes.md,
          fontWeight: TYPOGRAPHY.weights.regular,
          lineHeight: TYPOGRAPHY.sizes.md * 1.55,
          color: COLORS.text,
        };
      case "caption":
        return {
          fontSize: TYPOGRAPHY.sizes.sm,
          fontWeight: TYPOGRAPHY.weights.regular,
          lineHeight: TYPOGRAPHY.sizes.sm * 1.45,
          color: COLORS.textSecondary,
        };
      case "error":
        return {
          fontSize: TYPOGRAPHY.sizes.sm,
          fontWeight: TYPOGRAPHY.weights.medium,
          lineHeight: TYPOGRAPHY.sizes.sm * 1.4,
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

    return { fontWeight: TYPOGRAPHY.weights[weight] };
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
