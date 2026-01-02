import React from "react";
import {
  StyleSheet,
  View,
  ViewStyle,
  StyleProp,
  TouchableOpacity,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { COLORS, SPACING, SHADOWS, BORDER_RADIUS } from "./theme";

type CardPadding = "none" | "small" | "medium" | "large";
type CardElevation = "none" | "small" | "medium" | "large";

interface CardProps {
  /** Card content */
  children: React.ReactNode;
  /** Padding size */
  padding?: CardPadding;
  /** Shadow elevation level */
  elevation?: CardElevation;
  /** Card style override */
  style?: StyleProp<ViewStyle>;
  /** Optional press handler to make card touchable */
  onPress?: () => void;
  /** Enable gradient background */
  gradient?: boolean;
  /** Gradient colors (only used if gradient=true) */
  gradientColors?: string[];
  /** @deprecated Use elevation instead */
  elevated?: boolean;
}

/**
 * Card Component
 *
 * A reusable card component with shadow/elevation support and optional gradient background.
 * Useful for grouping related content.
 *
 * @example
 * ```tsx
 * // Basic card
 * <Card padding="medium" elevation="medium">
 *   <Text>Card content goes here</Text>
 * </Card>
 *
 * // Gradient card
 * <Card gradient gradientColors={["#3B6FF8", "#43C59E"]}>
 *   <Text style={{ color: "#fff" }}>Gradient Card</Text>
 * </Card>
 *
 * // Touchable card
 * <Card onPress={handlePress}>
 *   <Text>Tap me!</Text>
 * </Card>
 * ```
 */
export const Card: React.FC<CardProps> = ({
  children,
  padding = "medium",
  elevation = "small",
  elevated, // Legacy support
  style,
  onPress,
  gradient = false,
  gradientColors = [COLORS.primary, COLORS.secondary],
}) => {
  // Handle legacy 'elevated' prop
  const effectiveElevation = elevated ? "medium" : elevation;

  const getPaddingStyle = (): ViewStyle => {
    switch (padding) {
      case "none":
        return { padding: 0 };
      case "small":
        return { padding: SPACING.sm };
      case "medium":
        return { padding: SPACING.md };
      case "large":
        return { padding: SPACING.lg };
    }
  };

  const getElevationStyle = (): ViewStyle => {
    switch (effectiveElevation) {
      case "none":
        return SHADOWS.none;
      case "small":
        return SHADOWS.sm;
      case "medium":
        return SHADOWS.md;
      case "large":
        return SHADOWS.lg;
    }
  };

  const cardStyle = [
    styles.card,
    gradient && { overflow: "hidden" as const }, // Only clip overflow for gradients
    !gradient && getPaddingStyle(), // Don't apply padding to outer container if gradient
    !gradient && getElevationStyle(),
    style,
  ];

  // Content wrapper with padding (used inside gradient)
  const contentStyle = [
    styles.content,
    gradient && getPaddingStyle(),
  ];

  const renderContent = () => {
    if (gradient) {
      return (
        <LinearGradient colors={gradientColors as any} style={styles.gradient}>
          <View style={contentStyle}>{children}</View>
        </LinearGradient>
      );
    }
    return children;
  };

  // If onPress is provided, wrap in TouchableOpacity
  if (onPress) {
    return (
      <TouchableOpacity
        style={cardStyle}
        onPress={onPress}
        activeOpacity={0.8}
        accessibilityRole="button"
      >
        {renderContent()}
      </TouchableOpacity>
    );
  }

  // Otherwise, render as regular View
  return (
    <View style={cardStyle} accessibilityRole="none">
      {renderContent()}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.surface,
    borderRadius: BORDER_RADIUS.xxl,
    borderWidth: 0,
    marginVertical: SPACING.md,
  },
  gradient: {
    borderRadius: BORDER_RADIUS.xxl,
  },
  content: {
    // Content wrapper for gradient cards
  },
});
