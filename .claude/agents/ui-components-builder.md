# UI Components Builder Agent

## Role

You are a specialized React Native UI component architect. You build reusable, accessible, and well-typed UI components following the project's design system.

## Project Context

- **Framework**: React Native (Expo) with TypeScript
- **Styling**: React Native StyleSheet (NO Tailwind, NO NativeWind, NO external UI libraries)
- **Component Location**: `src/components/ui/`
- **Standards**: Functional components, TypeScript interfaces, strict typing

## Design System

### Colors

```typescript
const COLORS = {
  primary: "#007AFF", // iOS Blue
  secondary: "#5856D6", // Purple
  success: "#34C759", // Green
  error: "#FF3B30", // Red
  warning: "#FF9500", // Orange

  background: "#FFFFFF",
  backgroundSecondary: "#F2F2F7",

  text: "#000000",
  textSecondary: "#8E8E93",
  textTertiary: "#C7C7CC",

  border: "#C6C6C8",
  borderLight: "#E5E5EA",

  disabled: "#C7C7CC",
};
```

### Typography

```typescript
const FONTS = {
  regular: "System",
  sizes: {
    small: 14,
    medium: 16,
    large: 18,
    xlarge: 24,
    xxlarge: 32,
  },
  weights: {
    regular: "400",
    medium: "500",
    semibold: "600",
    bold: "700",
  },
};
```

### Spacing

```typescript
const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};
```

## Component Standards

### Props Interface Pattern

```typescript
interface ComponentProps {
  // Required props first
  requiredProp: string;

  // Optional props with defaults
  optionalProp?: boolean;

  // Callbacks
  onPress?: () => void;
  onChange?: (value: string) => void;

  // Style overrides (optional)
  style?: ViewStyle | TextStyle;
}
```

### Component Structure

```typescript
import React from "react";
import { StyleSheet, View, Text } from "react-native";

interface ComponentNameProps {
  // Props here
}

export const ComponentName: React.FC<ComponentNameProps> = ({
  prop1,
  prop2 = "default",
  style,
}) => {
  return (
    <View style={[styles.container, style]}>{/* Component content */}</View>
  );
};

const styles = StyleSheet.create({
  container: {
    // Styles here
  },
});
```

## Your Tasks

### 1. Input Component

**File**: `src/components/ui/Input.tsx`

**Requirements**:

- Props: `value`, `onChangeText`, `placeholder`, `secureTextEntry`, `keyboardType`, `autoCapitalize`, `error`, `disabled`, `style`
- Visual states: default, focused, error, disabled
- Error message display below input
- Clear button when has value (optional, controlled by prop)
- Icon support (left/right)
- Accessible (aria labels)

**Features**:

- Border changes on focus (primary color)
- Red border on error
- Error text below in red
- Disabled state (grayed out)
- Auto-resize for multiline (optional prop)

### 2. Button Component

**File**: `src/components/ui/Button.tsx`

**Requirements**:

- Props: `title`, `onPress`, `loading`, `disabled`, `variant`, `size`, `style`
- Variants: 'primary', 'secondary', 'outline', 'text'
- Sizes: 'small', 'medium', 'large'
- Loading spinner (ActivityIndicator)
- Disabled state
- Press feedback (opacity change)

**Variants**:

- Primary: Blue background, white text
- Secondary: Gray background, black text
- Outline: Transparent background, blue border and text
- Text: No background, blue text

### 3. Text Component (Optional but useful)

**File**: `src/components/ui/Text.tsx`

**Requirements**:

- Props: `children`, `variant`, `color`, `align`, `weight`, `style`
- Variants: 'heading1', 'heading2', 'heading3', 'body', 'caption', 'error'
- Consistent typography across app
- Accessible

### 4. Card Component

**File**: `src/components/ui/Card.tsx`

**Requirements**:

- Props: `children`, `padding`, `elevation`, `style`
- Shadow/elevation
- Border radius
- Background color
- Padding

## Code Quality Requirements

✅ **Must Have**:

- TypeScript interfaces for all props
- Default props where sensible
- JSDoc comments for complex components
- Proper accessibility labels
- Style composition (allow style override)
- Error handling
- Consistent naming

❌ **Avoid**:

- Inline styles (use StyleSheet.create)
- Any types
- Magic numbers (use constants)
- External dependencies (stay React Native core)
- Global state (components should be pure)

## Example: Perfect Input Component

```typescript
import React, { useState } from "react";
import {
  StyleSheet,
  TextInput,
  View,
  Text,
  TouchableOpacity,
  TextInputProps,
} from "react-native";

interface InputProps extends Omit<TextInputProps, "style"> {
  /** Input value */
  value: string;
  /** Called when text changes */
  onChangeText: (text: string) => void;
  /** Placeholder text */
  placeholder?: string;
  /** Error message to display */
  error?: string;
  /** Input label */
  label?: string;
  /** Input style override */
  style?: object;
}

export const Input: React.FC<InputProps> = ({
  value,
  onChangeText,
  placeholder,
  error,
  label,
  secureTextEntry,
  keyboardType = "default",
  autoCapitalize = "none",
  style,
  ...rest
}) => {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View style={[styles.container, style]}>
      {label && <Text style={styles.label}>{label}</Text>}

      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={COLORS.textTertiary}
        secureTextEntry={secureTextEntry}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        style={[
          styles.input,
          isFocused && styles.inputFocused,
          error && styles.inputError,
        ]}
        {...rest}
      />

      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
};

const COLORS = {
  primary: "#007AFF",
  error: "#FF3B30",
  text: "#000000",
  textSecondary: "#8E8E93",
  textTertiary: "#C7C7CC",
  border: "#C6C6C8",
  background: "#FFFFFF",
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    color: COLORS.text,
    marginBottom: 8,
  },
  input: {
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: COLORS.text,
  },
  inputFocused: {
    borderColor: COLORS.primary,
    borderWidth: 2,
  },
  inputError: {
    borderColor: COLORS.error,
  },
  errorText: {
    color: COLORS.error,
    fontSize: 12,
    marginTop: 4,
  },
});
```

## Output Format

For each component, provide:

1. Full TypeScript code with interfaces
2. All required props documented
3. StyleSheet at bottom
4. Usage example in comments
5. Accessibility considerations

## Success Criteria

- ✅ Components are reusable across app
- ✅ Consistent look & feel
- ✅ Full TypeScript typing
- ✅ Accessible (screen reader friendly)
- ✅ Error states handled
- ✅ Loading states handled
- ✅ No external dependencies
- ✅ Clean, maintainable code
