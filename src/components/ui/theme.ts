/**
 * Design System Theme
 * Central theme configuration based on modern UI design patterns
 */

export const COLORS = {
  // Primary colors - vibrant blue (from "Start Workout" button in image)
  primary: '#3b82f6',
  primaryDark: '#2563eb',
  primaryLight: '#60a5fa',

  // Secondary colors - fresh mint green (from "Track Food" button in image)
  secondary: '#6FD89E',
  secondaryDark: '#5BC98C',
  secondaryLight: '#8BE0B0',

  // Accent colors
  success: '#6FD89E',
  warning: '#FFB84D',
  error: '#FF6B6B',
  info: '#3b82f6',

  // Neutral colors - very light background (from image)
  background: '#F6F8FB',
  surface: '#FFFFFF',
  surfaceSecondary: '#F9FAFB',

  // Text colors - darker for better contrast (from image)
  text: '#2C3E50',
  textSecondary: '#6B7B8C',
  textTertiary: '#9AA6B5',
  textDisabled: '#CBD5E0',

  // Border colors - very subtle (from image)
  border: '#E8ECF2',
  borderLight: '#F0F3F7',
  borderDark: '#CBD5E0',

  // Special colors
  white: '#FFFFFF',
  black: '#1A202C',
  overlay: 'rgba(0, 0, 0, 0.4)',
} as const;

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 32,
} as const;

export const BORDER_RADIUS = {
  sm: 10,
  md: 14,
  lg: 18,
  xl: 22,
  xxl: 26,
  full: 999,
} as const;

export const SHADOWS = {
  none: {
    shadowColor: 'transparent',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0,
    shadowRadius: 0,
    elevation: 0,
  },
  sm: {
    shadowColor: '#1A202C',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  md: {
    shadowColor: '#1A202C',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
    elevation: 6,
  },
  lg: {
    shadowColor: '#1A202C',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.12,
    shadowRadius: 28,
    elevation: 10,
  },
  xl: {
    shadowColor: '#1A202C',
    shadowOffset: { width: 0, height: 15 },
    shadowOpacity: 0.15,
    shadowRadius: 36,
    elevation: 15,
  },
} as const;

export const TYPOGRAPHY = {
  sizes: {
    xs: 12,
    sm: 14,
    md: 16,
    lg: 18,
    xl: 20,
    xxl: 24,
    xxxl: 32,
  },
  weights: {
    regular: '400' as const,
    medium: '500' as const,
    semibold: '600' as const,
    bold: '700' as const,
  },
  lineHeights: {
    tight: 1.2,
    normal: 1.5,
    relaxed: 1.75,
  },
} as const;

export const TRANSITIONS = {
  fast: 150,
  normal: 250,
  slow: 350,
} as const;

// Consolidated theme object for easy imports
export const theme = {
  colors: COLORS,
  spacing: SPACING,
  borderRadius: BORDER_RADIUS,
  shadows: SHADOWS,
  typography: TYPOGRAPHY,
  transitions: TRANSITIONS,
} as const;
