import React from "react";
import { StyleSheet, View, ViewStyle, Platform } from "react-native";

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
  style?: ViewStyle;
}

/**
 * Card Component
 *
 * A reusable card component with shadow/elevation support.
 * Useful for grouping related content.
 *
 * @example
 * ```tsx
 * <Card padding="medium" elevation="medium">
 *   <Text variant="heading3">Card Title</Text>
 *   <Text variant="body">Card content goes here</Text>
 * </Card>
 * ```
 */
export const Card: React.FC<CardProps> = ({
  children,
  padding = "medium",
  elevation = "small",
  style,
}) => {
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
      switch (elevation) {
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
      switch (elevation) {
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

  return (
    <View
      style={[
        styles.card,
        getPaddingStyle(),
        getElevationStyle(),
        style,
      ]}
      accessibilityRole="none"
    >
      {children}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: COLORS.background,
    borderRadius: 12,
    borderWidth: Platform.OS === "android" ? 1 : 0,
    borderColor: COLORS.borderLight,
  },
});
