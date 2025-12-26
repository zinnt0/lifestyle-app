import React from 'react';
import { StyleSheet, View } from 'react-native';

interface ProgressBarProps {
  /** Progress percentage (0-100) */
  progress: number;
  /** Optional height of the progress bar */
  height?: number;
  /** Optional background color */
  backgroundColor?: string;
  /** Optional fill color */
  fillColor?: string;
}

/**
 * Progress Bar Component
 * Displays a horizontal progress indicator
 *
 * @example
 * ```tsx
 * <ProgressBar progress={50} />
 * <ProgressBar progress={75} height={8} fillColor="#34C759" />
 * ```
 */
export const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  height = 4,
  backgroundColor = COLORS.borderLight,
  fillColor = COLORS.primary,
}) => {
  // Clamp progress between 0 and 100
  const clampedProgress = Math.max(0, Math.min(100, progress));

  return (
    <View
      style={[
        styles.container,
        {
          height,
          backgroundColor,
        },
      ]}
    >
      <View
        style={[
          styles.fill,
          {
            width: `${clampedProgress}%`,
            backgroundColor: fillColor,
          },
        ]}
      />
    </View>
  );
};

const COLORS = {
  primary: '#007AFF',
  borderLight: '#E5E5EA',
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
    borderRadius: 2,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 2,
  },
});
