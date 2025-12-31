import React from "react";
import {
  StyleSheet,
  View,
  ViewStyle,
  StyleProp,
  Platform,
  TouchableOpacity,
} from "react-native";
import { LinearGradient } from "expo-linear-gradient";

// Design System Constants
const COLORS = {
  background: "#FFFFFF",
  border: "#C6C6C8",
  borderLight: "#E5E5EA",
};

const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

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
 * <Card gradient gradientColors={["#4A90E2", "#7B68EE"]}>
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
  gradientColors = ["#4A90E2", "#7B68EE"],
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
    if (Platform.OS === "ios") {
      // iOS shadow
      switch (effectiveElevation) {
        case "none":
          return {};
        case "small":
          return {
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 1 },
            shadowOpacity: 0.05,
            shadowRadius: 2,
          };
        case "medium":
          return {
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
          };
        case "large":
          return {
            shadowColor: "#000",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.15,
            shadowRadius: 8,
          };
      }
    } else {
      // Android elevation
      switch (effectiveElevation) {
        case "none":
          return { elevation: 0 };
        case "small":
          return { elevation: 2 };
        case "medium":
          return { elevation: 4 };
        case "large":
          return { elevation: 8 };
      }
    }
  };

  const cardStyle = [
    styles.card,
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
    backgroundColor: COLORS.background,
    borderRadius: 16,
    borderWidth: Platform.OS === "android" ? 1 : 0,
    borderColor: COLORS.borderLight,
    marginVertical: 8,
    overflow: "hidden", // Important for gradient clipping
  },
  gradient: {
    borderRadius: 16,
  },
  content: {
    // Content wrapper for gradient cards
  },
});
