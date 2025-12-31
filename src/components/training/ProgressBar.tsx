import React from "react";
import { View, StyleSheet, Animated } from "react-native";

interface ProgressBarProps {
  /** Progress value from 0 to 100 */
  progress: number;
  /** Color of the progress fill */
  color?: string;
  /** Background color of the track */
  backgroundColor?: string;
  /** Height of the progress bar */
  height?: number;
  /** Enable smooth animation */
  animated?: boolean;
}

/**
 * ProgressBar Component
 *
 * An animated progress bar with smooth animations.
 * Perfect for showing training plan progress.
 *
 * @example
 * ```tsx
 * <ProgressBar
 *   progress={75}
 *   color="#4CAF50"
 *   height={8}
 * />
 * ```
 */
export const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  color = "#4CAF50",
  backgroundColor = "#E0E0E0",
  height = 8,
  animated = true,
}) => {
  const progressValue = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (animated) {
      Animated.spring(progressValue, {
        toValue: progress,
        useNativeDriver: false,
        damping: 15,
        stiffness: 150,
      }).start();
    } else {
      progressValue.setValue(progress);
    }
  }, [progress, animated, progressValue]);

  const widthInterpolate = progressValue.interpolate({
    inputRange: [0, 100],
    outputRange: ["0%", "100%"],
  });

  return (
    <View style={[styles.container, { height, backgroundColor }]}>
      <Animated.View
        style={[
          styles.fill,
          { backgroundColor: color, width: widthInterpolate },
        ]}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: "100%",
    borderRadius: 4,
    overflow: "hidden",
  },
  fill: {
    height: "100%",
    borderRadius: 4,
  },
});
