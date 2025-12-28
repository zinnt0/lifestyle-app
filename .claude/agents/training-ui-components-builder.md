# Training UI Components Builder Agent

## Zweck

Erstellt wiederverwendbare, moderne UI Components für die Trainings-Sektion mit konsistentem Design und Animationen.

## Kontext

Du arbeitest an der Lifestyle App (React Native + Expo). Alle Screens benötigen gemeinsame UI Components für:

- Cards (Active/Inactive Plans, Exercises, Workouts)
- Buttons und Touch-Elemente
- Input Components
- Progress Indicators
- Modals
- Lists

**Design-Prinzipien:**

- Wiederverwendbar & komponierbar
- Type-Safe mit TypeScript
- Accessible (WCAG 2.1)
- Smooth Animations
- Konsistente Spacing & Colors

## Dein Auftrag

### 1. Base Components

#### Button Component

**Datei:** `src/components/ui/Button.tsx`

```typescript
import React from "react";
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from "react-native";

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "outline"
  | "ghost"
  | "danger";
export type ButtonSize = "small" | "medium" | "large";

interface ButtonProps {
  children: React.ReactNode;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  style?: ViewStyle;
  textStyle?: TextStyle;
  icon?: React.ReactNode;
  iconPosition?: "left" | "right";
}

export const Button: React.FC<ButtonProps> = ({
  children,
  onPress,
  variant = "primary",
  size = "medium",
  disabled = false,
  loading = false,
  fullWidth = false,
  style,
  textStyle,
  icon,
  iconPosition = "left",
}) => {
  const buttonStyle = [
    styles.base,
    styles[variant],
    styles[size],
    fullWidth && styles.fullWidth,
    disabled && styles.disabled,
    style,
  ];

  const textStyles = [
    styles.text,
    styles[`${variant}Text`],
    styles[`${size}Text`],
    textStyle,
  ];

  return (
    <TouchableOpacity
      style={buttonStyle}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}
    >
      {loading ? (
        <ActivityIndicator color={variant === "primary" ? "#fff" : "#4A90E2"} />
      ) : (
        <>
          {icon && iconPosition === "left" && icon}
          <Text style={textStyles}>{children}</Text>
          {icon && iconPosition === "right" && icon}
        </>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  base: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 12,
    paddingHorizontal: 20,
    gap: 8,
  },

  // Variants
  primary: {
    backgroundColor: "#4A90E2",
  },
  secondary: {
    backgroundColor: "#7B68EE",
  },
  outline: {
    backgroundColor: "transparent",
    borderWidth: 2,
    borderColor: "#4A90E2",
  },
  ghost: {
    backgroundColor: "transparent",
  },
  danger: {
    backgroundColor: "#F44336",
  },

  // Sizes
  small: {
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  medium: {
    paddingVertical: 14,
    paddingHorizontal: 20,
  },
  large: {
    paddingVertical: 18,
    paddingHorizontal: 24,
  },

  // States
  disabled: {
    opacity: 0.5,
  },

  fullWidth: {
    width: "100%",
  },

  // Text Styles
  text: {
    fontWeight: "600",
  },
  primaryText: {
    color: "#fff",
  },
  secondaryText: {
    color: "#fff",
  },
  outlineText: {
    color: "#4A90E2",
  },
  ghostText: {
    color: "#4A90E2",
  },
  dangerText: {
    color: "#fff",
  },
  smallText: {
    fontSize: 14,
  },
  mediumText: {
    fontSize: 16,
  },
  largeText: {
    fontSize: 18,
  },
});
```

#### Card Component

**Datei:** `src/components/ui/Card.tsx`

```typescript
import React from "react";
import { View, StyleSheet, ViewStyle, TouchableOpacity } from "react-native";
import { LinearGradient } from "expo-linear-gradient";

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  onPress?: () => void;
  gradient?: boolean;
  gradientColors?: string[];
  elevated?: boolean;
}

export const Card: React.FC<CardProps> = ({
  children,
  style,
  onPress,
  gradient = false,
  gradientColors = ["#4A90E2", "#7B68EE"],
  elevated = true,
}) => {
  const cardStyle = [styles.card, elevated && styles.elevated, style];

  const content = <View style={[styles.content]}>{children}</View>;

  if (onPress) {
    return (
      <TouchableOpacity style={cardStyle} onPress={onPress} activeOpacity={0.8}>
        {gradient ? (
          <LinearGradient colors={gradientColors} style={styles.gradient}>
            {content}
          </LinearGradient>
        ) : (
          content
        )}
      </TouchableOpacity>
    );
  }

  return (
    <View style={cardStyle}>
      {gradient ? (
        <LinearGradient colors={gradientColors} style={styles.gradient}>
          {content}
        </LinearGradient>
      ) : (
        content
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    marginVertical: 8,
    overflow: "hidden",
  },
  elevated: {
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  gradient: {
    borderRadius: 16,
  },
  content: {
    padding: 20,
  },
});
```

### 2. Training-Specific Components

#### ActivePlanCard

**Datei:** `src/components/training/ActivePlanCard.tsx`

```typescript
import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { ProgressBar } from "./ProgressBar";
import type { TrainingPlan } from "@/types/training.types";

interface ActivePlanCardProps {
  plan: TrainingPlan;
  onNavigateToPlan: (planId: string) => void;
}

export const ActivePlanCard: React.FC<ActivePlanCardProps> = ({
  plan,
  onNavigateToPlan,
}) => {
  const progress = plan.current_week
    ? (plan.current_week / (plan.total_weeks || 12)) * 100
    : 0;

  return (
    <Card gradient gradientColors={["#4A90E2", "#7B68EE"]}>
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.badge}>🏋️ AKTIVER PLAN</Text>
        </View>

        <Text style={styles.planName}>{plan.name}</Text>
        <Text style={styles.details}>{plan.days_per_week} Tage pro Woche</Text>

        {plan.current_week && plan.total_weeks && (
          <>
            <Text style={styles.weekInfo}>
              Woche {plan.current_week} von {plan.total_weeks}
            </Text>
            <ProgressBar
              progress={progress}
              color="#fff"
              backgroundColor="rgba(255, 255, 255, 0.3)"
            />
          </>
        )}

        <Button
          onPress={() => onNavigateToPlan(plan.id)}
          variant="ghost"
          style={styles.button}
          textStyle={styles.buttonText}
        >
          Zum Plan →
        </Button>
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  header: {
    marginBottom: 4,
  },
  badge: {
    fontSize: 12,
    fontWeight: "700",
    color: "#fff",
    opacity: 0.9,
  },
  planName: {
    fontSize: 24,
    fontWeight: "700",
    color: "#fff",
  },
  details: {
    fontSize: 16,
    color: "#fff",
    opacity: 0.9,
  },
  weekInfo: {
    fontSize: 14,
    color: "#fff",
    opacity: 0.9,
    marginTop: 8,
  },
  button: {
    marginTop: 8,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
  },
  buttonText: {
    color: "#fff",
  },
});
```

#### InactivePlanCard

**Datei:** `src/components/training/InactivePlanCard.tsx`

```typescript
import React from "react";
import { View, Text, StyleSheet, Switch } from "react-native";
import { Card } from "@/components/ui/Card";
import type { TrainingPlan } from "@/types/training.types";

interface InactivePlanCardProps {
  plan: TrainingPlan;
  onToggle: (planId: string) => void;
}

export const InactivePlanCard: React.FC<InactivePlanCardProps> = ({
  plan,
  onToggle,
}) => {
  return (
    <Card elevated>
      <View style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.planName}>{plan.name}</Text>
          <Text style={styles.details}>
            {plan.days_per_week} Tage •{" "}
            {plan.template?.primary_goal === "strength"
              ? "Kraft"
              : plan.template?.primary_goal === "hypertrophy"
              ? "Muskelaufbau"
              : "Kraft+Hypertrophie"}
          </Text>
        </View>

        <Switch
          value={false}
          onValueChange={() => onToggle(plan.id)}
          trackColor={{ false: "#ccc", true: "#4A90E2" }}
          thumbColor="#fff"
        />
      </View>
    </Card>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  content: {
    flex: 1,
    gap: 4,
  },
  planName: {
    fontSize: 18,
    fontWeight: "600",
    color: "#333",
  },
  details: {
    fontSize: 14,
    color: "#666",
  },
});
```

#### ProgressBar

**Datei:** `src/components/training/ProgressBar.tsx`

```typescript
import React, { useEffect } from "react";
import { View, StyleSheet } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";

interface ProgressBarProps {
  progress: number; // 0-100
  color?: string;
  backgroundColor?: string;
  height?: number;
  animated?: boolean;
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  progress,
  color = "#4CAF50",
  backgroundColor = "#E0E0E0",
  height = 8,
  animated = true,
}) => {
  const progressValue = useSharedValue(0);

  useEffect(() => {
    progressValue.value = animated
      ? withSpring(progress, { damping: 15, stiffness: 150 })
      : progress;
  }, [progress, animated]);

  const animatedStyle = useAnimatedStyle(() => ({
    width: `${progressValue.value}%`,
  }));

  return (
    <View style={[styles.container, { height, backgroundColor }]}>
      <Animated.View
        style={[styles.fill, { backgroundColor: color }, animatedStyle]}
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
```

#### SetRow (Expandable)

**Datei:** `src/components/training/SetRow.tsx`

```typescript
import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  LayoutAnimation,
  Platform,
  UIManager,
} from "react-native";
import { Button } from "@/components/ui/Button";
import type { WorkoutSet } from "@/types/training.types";

if (
  Platform.OS === "android" &&
  UIManager.setLayoutAnimationEnabledExperimental
) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

interface SetRowProps {
  setNumber: number;
  targetWeight?: number;
  targetReps?: number;
  rpeTarget?: number;
  isExpanded: boolean;
  onToggle: () => void;
  onLog: (weight: number, reps: number, rpe?: number) => void;
  completedSet?: WorkoutSet;
}

export const SetRow: React.FC<SetRowProps> = ({
  setNumber,
  targetWeight,
  targetReps,
  rpeTarget,
  isExpanded,
  onToggle,
  onLog,
  completedSet,
}) => {
  const [weight, setWeight] = useState(
    completedSet?.weight_kg?.toString() || targetWeight?.toString() || ""
  );
  const [reps, setReps] = useState(
    completedSet?.reps.toString() || targetReps?.toString() || ""
  );
  const [rpe, setRpe] = useState(
    completedSet?.rpe?.toString() || rpeTarget?.toString() || ""
  );

  const handleToggle = () => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    onToggle();
  };

  const handleSave = () => {
    if (!weight || !reps) return;

    const weightNum = parseFloat(weight);
    const repsNum = parseInt(reps);
    const rpeNum = rpe ? parseFloat(rpe) : undefined;

    onLog(weightNum, repsNum, rpeNum);
    handleToggle(); // Collapse after save
  };

  const isCompleted = !!completedSet;

  return (
    <View style={styles.container}>
      {/* Header (always visible) */}
      <TouchableOpacity
        style={[styles.header, isCompleted && styles.headerCompleted]}
        onPress={handleToggle}
      >
        <View style={styles.headerContent}>
          <Text style={styles.setNumber}>Satz {setNumber}</Text>

          {isCompleted ? (
            <View style={styles.completedInfo}>
              <Text style={styles.completedText}>
                ✓ {completedSet.weight_kg}kg × {completedSet.reps}
              </Text>
              {completedSet.rpe && (
                <Text style={styles.rpeText}>RPE {completedSet.rpe}</Text>
              )}
            </View>
          ) : (
            <Text style={styles.targetText}>
              Soll: {targetWeight}kg × {targetReps}
              {rpeTarget && ` @ ${rpeTarget}`}
            </Text>
          )}
        </View>

        <Text style={styles.chevron}>{isExpanded ? "▼" : "▶"}</Text>
      </TouchableOpacity>

      {/* Expanded Content */}
      {isExpanded && (
        <View style={styles.expandedContent}>
          <View style={styles.targetInfo}>
            <Text style={styles.label}>Ziel:</Text>
            <Text style={styles.value}>
              {targetWeight}kg × {targetReps}
              {rpeTarget && ` @ RPE ${rpeTarget}`}
            </Text>
          </View>

          <View style={styles.inputRow}>
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Gewicht (kg)</Text>
              <TextInput
                value={weight}
                onChangeText={setWeight}
                keyboardType="numeric"
                placeholder="0"
                style={styles.input}
              />
            </View>

            <Text style={styles.multiplier}>×</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>Wiederholungen</Text>
              <TextInput
                value={reps}
                onChangeText={setReps}
                keyboardType="numeric"
                placeholder="0"
                style={styles.input}
              />
            </View>
          </View>

          {rpeTarget && (
            <View style={styles.inputGroup}>
              <Text style={styles.inputLabel}>RPE (optional)</Text>
              <TextInput
                value={rpe}
                onChangeText={setRpe}
                keyboardType="numeric"
                placeholder={rpeTarget.toString()}
                style={[styles.input, styles.rpeInput]}
              />
            </View>
          )}

          <Button onPress={handleSave} disabled={!weight || !reps} size="small">
            Speichern
          </Button>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 4,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    backgroundColor: "#F5F5F5",
    borderRadius: 12,
  },
  headerCompleted: {
    backgroundColor: "#E8F5E9",
  },
  headerContent: {
    flex: 1,
    gap: 4,
  },
  setNumber: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  completedInfo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  completedText: {
    fontSize: 14,
    color: "#4CAF50",
    fontWeight: "500",
  },
  targetText: {
    fontSize: 14,
    color: "#666",
  },
  rpeText: {
    fontSize: 12,
    color: "#666",
    fontStyle: "italic",
  },
  chevron: {
    fontSize: 12,
    color: "#999",
  },
  expandedContent: {
    padding: 16,
    paddingTop: 12,
    gap: 12,
  },
  targetInfo: {
    flexDirection: "row",
    gap: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: "600",
    color: "#333",
  },
  value: {
    fontSize: 14,
    color: "#666",
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 12,
  },
  inputGroup: {
    flex: 1,
    gap: 4,
  },
  inputLabel: {
    fontSize: 12,
    color: "#666",
    fontWeight: "500",
  },
  input: {
    borderWidth: 1,
    borderColor: "#E0E0E0",
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: "#fff",
  },
  rpeInput: {
    flex: 0,
    width: 80,
  },
  multiplier: {
    fontSize: 20,
    color: "#999",
    marginBottom: 12,
  },
});
```

#### ExerciseAlternativesModal

**Datei:** `src/components/training/AlternativesModal.tsx`

```typescript
import React, { useEffect, useState } from "react";
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { Button } from "@/components/ui/Button";
import { trainingService } from "@/services/trainingService";
import type { Exercise } from "@/types/training.types";

interface AlternativesModalProps {
  visible: boolean;
  exerciseId: string;
  onSelect: (alternativeId: string) => void;
  onClose: () => void;
}

export const AlternativesModal: React.FC<AlternativesModalProps> = ({
  visible,
  exerciseId,
  onSelect,
  onClose,
}) => {
  const [alternatives, setAlternatives] = useState<Exercise[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (visible) {
      loadAlternatives();
    }
  }, [visible, exerciseId]);

  const loadAlternatives = async () => {
    setLoading(true);
    try {
      const alts = await trainingService.getExerciseAlternatives(
        exerciseId,
        userId
      );
      setAlternatives(alts);
    } catch (error) {
      console.error("Failed to load alternatives:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelect = (alternativeId: string) => {
    onSelect(alternativeId);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Alternative Übungen</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <Text style={styles.closeIcon}>✕</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#4A90E2" />
          </View>
        ) : alternatives.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Keine Alternativen verfügbar</Text>
          </View>
        ) : (
          <ScrollView style={styles.list}>
            {alternatives.map((exercise) => (
              <TouchableOpacity
                key={exercise.id}
                style={styles.alternativeCard}
                onPress={() => handleSelect(exercise.id)}
              >
                <View style={styles.alternativeContent}>
                  <Text style={styles.alternativeName}>{exercise.name_de}</Text>
                  <Text style={styles.alternativeDetails}>
                    {exercise.movement_pattern} •{" "}
                    {exercise.equipment.join(", ")}
                  </Text>
                  <View style={styles.musclesTags}>
                    {exercise.primary_muscles.map((muscle) => (
                      <View key={muscle} style={styles.muscleTag}>
                        <Text style={styles.muscleTagText}>{muscle}</Text>
                      </View>
                    ))}
                  </View>
                </View>
                <Text style={styles.selectIcon}>→</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        )}
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#E0E0E0",
  },
  title: {
    fontSize: 20,
    fontWeight: "600",
    color: "#333",
  },
  closeButton: {
    padding: 4,
  },
  closeIcon: {
    fontSize: 24,
    color: "#666",
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
  },
  list: {
    flex: 1,
    padding: 16,
  },
  alternativeCard: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#F5F5F5",
    borderRadius: 12,
    marginBottom: 12,
  },
  alternativeContent: {
    flex: 1,
    gap: 6,
  },
  alternativeName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  alternativeDetails: {
    fontSize: 14,
    color: "#666",
  },
  musclesTags: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
    marginTop: 4,
  },
  muscleTag: {
    backgroundColor: "#E3F2FD",
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  muscleTagText: {
    fontSize: 12,
    color: "#1976D2",
  },
  selectIcon: {
    fontSize: 20,
    color: "#4A90E2",
  },
});
```

### 3. Utility Components

#### PaginationDots

**Datei:** `src/components/training/PaginationDots.tsx`

```typescript
import React from "react";
import { View, StyleSheet } from "react-native";

interface PaginationDotsProps {
  total: number;
  current: number;
  color?: string;
  inactiveColor?: string;
}

export const PaginationDots: React.FC<PaginationDotsProps> = ({
  total,
  current,
  color = "#4A90E2",
  inactiveColor = "#E0E0E0",
}) => {
  return (
    <View style={styles.container}>
      {Array.from({ length: total }).map((_, index) => (
        <View
          key={index}
          style={[
            styles.dot,
            {
              backgroundColor: index === current ? color : inactiveColor,
              width: index === current ? 10 : 8,
              height: index === current ? 10 : 8,
            },
          ]}
        />
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 16,
  },
  dot: {
    borderRadius: 5,
  },
});
```

## Implementierungs-Checkliste

- [ ] Base UI Components (Button, Card)
- [ ] ActivePlanCard Component
- [ ] InactivePlanCard Component
- [ ] ProgressBar mit Animation
- [ ] SetRow mit Expand/Collapse
- [ ] AlternativesModal
- [ ] PaginationDots
- [ ] Type definitions für alle Props
- [ ] Accessibility Labels
- [ ] Responsive Styling
- [ ] Dark Mode Support (optional)

## Testing

Teste:

1. ✅ Components rendern korrekt
2. ✅ Animations sind smooth
3. ✅ Touch-Feedback funktioniert
4. ✅ Type Safety (keine TS Errors)
5. ✅ Accessibility (Screen Reader)

---

**Erstellt für:** Lifestyle App Training Module
**React Native + Expo + TypeScript**
