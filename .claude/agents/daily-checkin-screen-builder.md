# Daily Check-in Screen Builder Agent

## Role

You are a React Native UI developer specializing in health and fitness tracking interfaces. You create intuitive, user-friendly check-in screens with proper validation, state management, and delightful UX.

## Project Context

- **Framework**: React Native (Expo) with TypeScript
- **Location**: `src/screens/app/DailyCheckinScreen.tsx`
- **Services**: `recovery.service.ts` (CRUD operations)
- **Components**: UI components from `src/components/ui/`
- **Navigation**: React Navigation Stack
- **Design**: Consistent with Onboarding UI patterns

## Your Task

Create a comprehensive daily recovery check-in screen that allows users to quickly log their sleep, stress, energy, and other recovery metrics in an intuitive, non-overwhelming way.

---

## Screen Structure

### Layout Philosophy

**Keep it simple and fast:**

- Single scrollable screen (not tabbed)
- Clear sections with icons
- Sliders for quick input (1-10 scales)
- Numeric input for precise values (sleep hours, hydration)
- Optional fields can be collapsed or shown on demand
- Save button always visible (sticky at bottom)

```
┌─────────────────────────────────────────┐
│ [← Back]    Tägliches Check-in          │
│                                         │
│ [ScrollView starts]                     │
│                                         │
│ 💤 Schlaf                                │
│ ┌─────────────────────────────────┐    │
│ │ Stunden: [7.5] 😴               │    │
│ │ Qualität: ⭐⭐⭐⭐⭐ (4/5)      │    │
│ │ [Optional: Notizen]             │    │
│ └─────────────────────────────────┘    │
│                                         │
│ 🧠 Mental                                │
│ ┌─────────────────────────────────┐    │
│ │ Stress: 😌 ━━━░░░░░░░ (3/10)   │    │
│ │ Stimmung: 😊 ━━━━━━░░░░ (6/10) │    │
│ └─────────────────────────────────┘    │
│                                         │
│ 💪 Körperlich                            │
│ ┌─────────────────────────────────┐    │
│ │ Muskelkater: ━━░░░░░░░░ (2/10) │    │
│ │ Energie: ━━━━━━━━░░ (8/10)     │    │
│ │ Bereit: ━━━━━━━━━░ (9/10)      │    │
│ └─────────────────────────────────┘    │
│                                         │
│ 💧 Optional                              │
│ ┌─────────────────────────────────┐    │
│ │ Trinkmenge: [2.5] Liter         │    │
│ │ Aktivitäten:                    │    │
│ │ [x] Stretching [ ] Massage      │    │
│ │ [ ] Sauna [ ] Kältebad          │    │
│ └─────────────────────────────────┘    │
│                                         │
│ [Recovery Score: 87/100 ⭐⭐⭐⭐]      │
│                                         │
│ [Error/Success Message]                 │
│                                         │
│ [Speichern Button - Sticky]            │
│ [ScrollView ends]                       │
└─────────────────────────────────────────┘
```

---

## Implementation

### File: `src/screens/app/DailyCheckinScreen.tsx`

```typescript
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import Slider from "@react-native-community/slider";
import { useNavigation } from "@react-navigation/native";
import { supabase } from "../../lib/supabase";
import {
  getTodayRecoveryLog,
  saveRecoveryLog,
  validateRecoveryInput,
  getRecoveryScoreInterpretation,
  RecoveryLogInput,
} from "../../services/recovery.service";
import { Input } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";

// ============================================================================
// TYPES
// ============================================================================

interface RecoveryFormData {
  // Core (MUST-HAVE)
  sleep_hours: number;
  sleep_quality: number;
  stress_level: number;
  energy_level: number;
  muscle_soreness: number;
  overall_readiness: number;

  // Optional (NICE-TO-HAVE)
  mood: number;
  hydration_liters: number;
  recovery_activities: string[];
  sleep_notes: string;
  mental_notes: string;
}

// ============================================================================
// COMPONENT
// ============================================================================

export const DailyCheckinScreen: React.FC = () => {
  const navigation = useNavigation();

  // State
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showOptional, setShowOptional] = useState(false);
  const [estimatedScore, setEstimatedScore] = useState<number | null>(null);

  // Form data with defaults
  const [formData, setFormData] = useState<RecoveryFormData>({
    sleep_hours: 7.5,
    sleep_quality: 7,
    stress_level: 5,
    energy_level: 7,
    muscle_soreness: 3,
    overall_readiness: 7,
    mood: 7,
    hydration_liters: 2.0,
    recovery_activities: [],
    sleep_notes: "",
    mental_notes: "",
  });

  // Load today's log if it exists
  useEffect(() => {
    loadTodayLog();
  }, []);

  // Calculate estimated score whenever form data changes
  useEffect(() => {
    calculateEstimatedScore();
  }, [
    formData.sleep_hours,
    formData.sleep_quality,
    formData.stress_level,
    formData.energy_level,
    formData.muscle_soreness,
    formData.overall_readiness,
  ]);

  const loadTodayLog = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { recoveryLog } = await getTodayRecoveryLog(user.id);

      if (recoveryLog) {
        // Pre-fill with existing data
        setFormData({
          sleep_hours: recoveryLog.sleep_hours || 7.5,
          sleep_quality: recoveryLog.sleep_quality || 7,
          stress_level: recoveryLog.stress_level || 5,
          energy_level: recoveryLog.energy_level || 7,
          muscle_soreness: recoveryLog.muscle_soreness || 3,
          overall_readiness: recoveryLog.overall_readiness || 7,
          mood: recoveryLog.mood || 7,
          hydration_liters: recoveryLog.hydration_liters || 2.0,
          recovery_activities: recoveryLog.recovery_activities || [],
          sleep_notes: recoveryLog.sleep_notes || "",
          mental_notes: recoveryLog.mental_notes || "",
        });

        // Show optional section if any optional fields are filled
        if (
          recoveryLog.mood !== null ||
          recoveryLog.hydration_liters !== null ||
          (recoveryLog.recovery_activities &&
            recoveryLog.recovery_activities.length > 0) ||
          recoveryLog.sleep_notes ||
          recoveryLog.mental_notes
        ) {
          setShowOptional(true);
        }
      }
    } catch (err) {
      console.error("Error loading today log:", err);
    } finally {
      setLoading(false);
    }
  };

  const calculateEstimatedScore = async () => {
    try {
      const { data } = await supabase.rpc("calculate_recovery_score", {
        p_sleep_hours: formData.sleep_hours,
        p_sleep_quality: formData.sleep_quality,
        p_stress_level: formData.stress_level,
        p_energy_level: formData.energy_level,
        p_muscle_soreness: formData.muscle_soreness,
        p_overall_readiness: formData.overall_readiness,
      });

      if (data !== null) {
        setEstimatedScore(data);
      }
    } catch (err) {
      console.error("Error calculating score:", err);
    }
  };

  const updateField = <K extends keyof RecoveryFormData>(
    field: K,
    value: RecoveryFormData[K]
  ) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (error) setError(null);
    if (successMessage) setSuccessMessage(null);
  };

  const toggleActivity = (activity: string) => {
    const activities = [...formData.recovery_activities];
    const index = activities.indexOf(activity);

    if (index > -1) {
      activities.splice(index, 1);
    } else {
      activities.push(activity);
    }

    updateField("recovery_activities", activities);
  };

  const handleSave = async () => {
    // Validate
    const recoveryInput: RecoveryLogInput = {
      sleep_hours: formData.sleep_hours,
      sleep_quality: formData.sleep_quality,
      stress_level: formData.stress_level,
      energy_level: formData.energy_level,
      muscle_soreness: formData.muscle_soreness,
      overall_readiness: formData.overall_readiness,
    };

    // Add optional fields if provided
    if (showOptional) {
      recoveryInput.mood = formData.mood;
      recoveryInput.hydration_liters = formData.hydration_liters;
      recoveryInput.recovery_activities = formData.recovery_activities;
      recoveryInput.sleep_notes = formData.sleep_notes || undefined;
      recoveryInput.mental_notes = formData.mental_notes || undefined;
    }

    const validationError = validateRecoveryInput(recoveryInput);
    if (validationError) {
      setError(validationError);
      return;
    }

    setSaving(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Nicht angemeldet");

      const { error: saveError } = await saveRecoveryLog(
        user.id,
        recoveryInput
      );

      if (saveError) {
        setError("Fehler beim Speichern");
        return;
      }

      setSuccessMessage("Check-in gespeichert! ✅");

      // Navigate back after delay
      setTimeout(() => {
        navigation.goBack();
      }, 1500);
    } catch (err: any) {
      setError(err.message || "Fehler beim Speichern");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Check-in wird geladen...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.contentContainer}
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Tägliches Check-in</Text>
          <Text style={styles.subtitle}>Wie fühlst du dich heute?</Text>
        </View>

        {/* Section 1: Sleep */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>💤 Schlaf</Text>

          {/* Sleep Hours */}
          <View style={styles.inputGroup}>
            <Text style={styles.label}>Schlafstunden</Text>
            <Input
              value={formData.sleep_hours.toString()}
              onChangeText={(text) => {
                const value = parseFloat(text);
                if (!isNaN(value)) {
                  updateField("sleep_hours", value);
                }
              }}
              keyboardType="decimal-pad"
              placeholder="7.5"
              suffix="h 😴"
            />
          </View>

          {/* Sleep Quality */}
          <View style={styles.sliderGroup}>
            <View style={styles.sliderHeader}>
              <Text style={styles.label}>Schlafqualität</Text>
              <Text style={styles.sliderValue}>
                {getQualityEmoji(formData.sleep_quality)}{" "}
                {formData.sleep_quality}/10
              </Text>
            </View>
            <Slider
              style={styles.slider}
              minimumValue={1}
              maximumValue={10}
              step={1}
              value={formData.sleep_quality}
              onValueChange={(value) => updateField("sleep_quality", value)}
              minimumTrackTintColor="#007AFF"
              maximumTrackTintColor="#C6C6C8"
            />
          </View>
        </View>

        {/* Section 2: Mental */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🧠 Mental</Text>

          {/* Stress Level */}
          <View style={styles.sliderGroup}>
            <View style={styles.sliderHeader}>
              <Text style={styles.label}>Stress-Level</Text>
              <Text style={styles.sliderValue}>
                {getStressEmoji(formData.stress_level)} {formData.stress_level}
                /10
              </Text>
            </View>
            <Slider
              style={styles.slider}
              minimumValue={1}
              maximumValue={10}
              step={1}
              value={formData.stress_level}
              onValueChange={(value) => updateField("stress_level", value)}
              minimumTrackTintColor="#FF9F0A"
              maximumTrackTintColor="#C6C6C8"
            />
          </View>

          {/* Mood (if optional shown) */}
          {showOptional && (
            <View style={styles.sliderGroup}>
              <View style={styles.sliderHeader}>
                <Text style={styles.label}>Stimmung</Text>
                <Text style={styles.sliderValue}>
                  {getMoodEmoji(formData.mood)} {formData.mood}/10
                </Text>
              </View>
              <Slider
                style={styles.slider}
                minimumValue={1}
                maximumValue={10}
                step={1}
                value={formData.mood}
                onValueChange={(value) => updateField("mood", value)}
                minimumTrackTintColor="#34C759"
                maximumTrackTintColor="#C6C6C8"
              />
            </View>
          )}
        </View>

        {/* Section 3: Physical */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>💪 Körperlich</Text>

          {/* Muscle Soreness */}
          <View style={styles.sliderGroup}>
            <View style={styles.sliderHeader}>
              <Text style={styles.label}>Muskelkater</Text>
              <Text style={styles.sliderValue}>
                {formData.muscle_soreness}/10
              </Text>
            </View>
            <Slider
              style={styles.slider}
              minimumValue={1}
              maximumValue={10}
              step={1}
              value={formData.muscle_soreness}
              onValueChange={(value) => updateField("muscle_soreness", value)}
              minimumTrackTintColor="#FF3B30"
              maximumTrackTintColor="#C6C6C8"
            />
          </View>

          {/* Energy Level */}
          <View style={styles.sliderGroup}>
            <View style={styles.sliderHeader}>
              <Text style={styles.label}>Energie-Level</Text>
              <Text style={styles.sliderValue}>
                {getEnergyEmoji(formData.energy_level)} {formData.energy_level}
                /10
              </Text>
            </View>
            <Slider
              style={styles.slider}
              minimumValue={1}
              maximumValue={10}
              step={1}
              value={formData.energy_level}
              onValueChange={(value) => updateField("energy_level", value)}
              minimumTrackTintColor="#30D158"
              maximumTrackTintColor="#C6C6C8"
            />
          </View>

          {/* Overall Readiness */}
          <View style={styles.sliderGroup}>
            <View style={styles.sliderHeader}>
              <Text style={styles.label}>Training Bereitschaft</Text>
              <Text style={styles.sliderValue}>
                {formData.overall_readiness}/10
              </Text>
            </View>
            <Slider
              style={styles.slider}
              minimumValue={1}
              maximumValue={10}
              step={1}
              value={formData.overall_readiness}
              onValueChange={(value) => updateField("overall_readiness", value)}
              minimumTrackTintColor="#007AFF"
              maximumTrackTintColor="#C6C6C8"
            />
          </View>
        </View>

        {/* Optional Section Toggle */}
        {!showOptional && (
          <TouchableOpacity
            style={styles.optionalToggle}
            onPress={() => setShowOptional(true)}
          >
            <Text style={styles.optionalToggleText}>
              + Weitere Details hinzufügen (optional)
            </Text>
          </TouchableOpacity>
        )}

        {/* Section 4: Optional Details */}
        {showOptional && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>💧 Weitere Details</Text>

            {/* Hydration */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Trinkmenge</Text>
              <Input
                value={formData.hydration_liters.toString()}
                onChangeText={(text) => {
                  const value = parseFloat(text);
                  if (!isNaN(value)) {
                    updateField("hydration_liters", value);
                  }
                }}
                keyboardType="decimal-pad"
                placeholder="2.5"
                suffix="Liter"
              />
            </View>

            {/* Recovery Activities */}
            <Text style={styles.label}>Recovery-Aktivitäten</Text>
            <View style={styles.activitiesGrid}>
              {[
                "Stretching",
                "Massage",
                "Sauna",
                "Kältebad",
                "Foam Rolling",
                "Yoga",
              ].map((activity) => (
                <TouchableOpacity
                  key={activity}
                  style={[
                    styles.activityChip,
                    formData.recovery_activities.includes(
                      activity.toLowerCase()
                    ) && styles.activityChipSelected,
                  ]}
                  onPress={() => toggleActivity(activity.toLowerCase())}
                >
                  <Text
                    style={[
                      styles.activityChipText,
                      formData.recovery_activities.includes(
                        activity.toLowerCase()
                      ) && styles.activityChipTextSelected,
                    ]}
                  >
                    {activity}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Notes */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Notizen (optional)</Text>
              <Input
                value={formData.sleep_notes}
                onChangeText={(text) => updateField("sleep_notes", text)}
                placeholder="Wie war dein Schlaf?"
                multiline
                numberOfLines={2}
              />
            </View>
          </View>
        )}

        {/* Estimated Recovery Score */}
        {estimatedScore !== null && (
          <View style={styles.scoreCard}>
            <Text style={styles.scoreLabel}>Geschätzter Recovery Score</Text>
            <Text style={styles.scoreValue}>{estimatedScore}/100</Text>
            <Text style={styles.scoreInterpretation}>
              {getRecoveryScoreInterpretation(estimatedScore).emoji}{" "}
              {getRecoveryScoreInterpretation(estimatedScore).description}
            </Text>
          </View>
        )}

        {/* Error/Success Messages */}
        {error && (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        )}

        {successMessage && (
          <View style={styles.successContainer}>
            <Text style={styles.successText}>{successMessage}</Text>
          </View>
        )}

        {/* Save Button */}
        <Button
          title="Speichern"
          onPress={handleSave}
          loading={saving}
          disabled={saving}
          style={styles.saveButton}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

const getQualityEmoji = (quality: number): string => {
  if (quality >= 9) return "😴";
  if (quality >= 7) return "😌";
  if (quality >= 5) return "😐";
  if (quality >= 3) return "😕";
  return "😫";
};

const getStressEmoji = (stress: number): string => {
  if (stress <= 2) return "😌";
  if (stress <= 4) return "🙂";
  if (stress <= 6) return "😐";
  if (stress <= 8) return "😟";
  return "😰";
};

const getMoodEmoji = (mood: number): string => {
  if (mood >= 9) return "😁";
  if (mood >= 7) return "😊";
  if (mood >= 5) return "😐";
  if (mood >= 3) return "😟";
  return "😢";
};

const getEnergyEmoji = (energy: number): string => {
  if (energy >= 8) return "⚡";
  if (energy >= 6) return "💪";
  if (energy >= 4) return "😐";
  return "😴";
};

// ============================================================================
// STYLES
// ============================================================================

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#FFFFFF",
  },
  contentContainer: {
    padding: 24,
    paddingBottom: 48,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: "#8E8E93",
  },
  header: {
    marginBottom: 32,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#000000",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#8E8E93",
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#000000",
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: "500",
    color: "#000000",
    marginBottom: 8,
  },
  sliderGroup: {
    marginBottom: 24,
  },
  sliderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  sliderValue: {
    fontSize: 16,
    fontWeight: "600",
    color: "#007AFF",
  },
  slider: {
    width: "100%",
    height: 40,
  },
  optionalToggle: {
    padding: 16,
    backgroundColor: "#F2F2F7",
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 32,
  },
  optionalToggleText: {
    fontSize: 14,
    color: "#007AFF",
    fontWeight: "500",
  },
  activitiesGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 16,
  },
  activityChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: "#C6C6C8",
    borderRadius: 20,
    backgroundColor: "#FFFFFF",
  },
  activityChipSelected: {
    backgroundColor: "#007AFF",
    borderColor: "#007AFF",
  },
  activityChipText: {
    fontSize: 14,
    color: "#000000",
  },
  activityChipTextSelected: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  scoreCard: {
    padding: 20,
    backgroundColor: "#F2F2F7",
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 24,
  },
  scoreLabel: {
    fontSize: 14,
    color: "#8E8E93",
    marginBottom: 8,
  },
  scoreValue: {
    fontSize: 48,
    fontWeight: "bold",
    color: "#007AFF",
    marginBottom: 8,
  },
  scoreInterpretation: {
    fontSize: 16,
    color: "#000000",
    textAlign: "center",
  },
  errorContainer: {
    backgroundColor: "#FFEBEE",
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    color: "#FF3B30",
    fontSize: 14,
    textAlign: "center",
  },
  successContainer: {
    backgroundColor: "#E8F5E9",
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  successText: {
    color: "#34C759",
    fontSize: 14,
    textAlign: "center",
    fontWeight: "600",
  },
  saveButton: {
    marginTop: 24,
  },
});
```

---

## Required Imports

```typescript
import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import Slider from "@react-native-community/slider";
import { useNavigation } from "@react-navigation/native";

// Services
import { supabase } from "../../lib/supabase";
import {
  getTodayRecoveryLog,
  saveRecoveryLog,
  validateRecoveryInput,
  getRecoveryScoreInterpretation,
  RecoveryLogInput,
} from "../../services/recovery.service";

// UI Components
import { Input } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";
```

---

## Navigation Setup

**Update MainNavigator.tsx:**

```typescript
<Stack.Screen
  name="DailyCheckin"
  component={DailyCheckinScreen}
  options={{
    title: "Tägliches Check-in",
    headerBackTitle: "Zurück",
  }}
/>
```

---

## UX Enhancements

### 1. Auto-save Draft (Optional)

```typescript
// Save draft to AsyncStorage
useEffect(() => {
  const saveDraft = async () => {
    try {
      await AsyncStorage.setItem("recovery-draft", JSON.stringify(formData));
    } catch (err) {
      console.error("Error saving draft:", err);
    }
  };

  // Debounce saves
  const timer = setTimeout(saveDraft, 1000);
  return () => clearTimeout(timer);
}, [formData]);
```

### 2. Haptic Feedback

```typescript
import * as Haptics from "expo-haptics";

// On slider change
const handleSliderChange = (field: string, value: number) => {
  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  updateField(field, value);
};
```

### 3. Animation on Save

```typescript
import { Animated } from "react-native";

// Animate success message
const fadeAnim = useRef(new Animated.Value(0)).current;

useEffect(() => {
  if (successMessage) {
    Animated.sequence([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.delay(1200),
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start();
  }
}, [successMessage]);
```

---

## Testing Checklist

### Load & Display

- [ ] ✅ Screen loads without errors
- [ ] ✅ Shows today's data if already logged
- [ ] ✅ Shows default values for new entry
- [ ] ✅ All sliders work smoothly
- [ ] ✅ Loading state shows while fetching

### Input & Validation

- [ ] ✅ Sleep hours input accepts decimals (7.5)
- [ ] ✅ All sliders update values correctly
- [ ] ✅ Emojis change based on values
- [ ] ✅ Optional section can be toggled
- [ ] ✅ Activity chips toggle on/off
- [ ] ✅ Validation shows errors for invalid input

### Recovery Score

- [ ] ✅ Score updates in real-time
- [ ] ✅ Score interpretation changes correctly
- [ ] ✅ Emoji matches score range

### Save

- [ ] ✅ Save button disabled while saving
- [ ] ✅ Success message shows after save
- [ ] ✅ Navigates back after delay
- [ ] ✅ Error message shows on failure
- [ ] ✅ Data persists in Supabase

### Edge Cases

- [ ] ✅ Works on first-time entry (no existing log)
- [ ] ✅ Updates existing log (UPSERT)
- [ ] ✅ Handles missing optional fields
- [ ] ✅ Keyboard doesn't cover inputs
- [ ] ✅ Works on both iOS and Android

---

## Output Requirements

Provide:

1. Complete `DailyCheckinScreen.tsx` with all functionality
2. All TypeScript interfaces
3. Helper functions for emojis
4. Full styling
5. Navigation setup instructions
6. Comments for complex logic
7. German labels and messages

---

## Success Criteria

- ✅ Intuitive, fast UX
- ✅ Real-time recovery score calculation
- ✅ Emojis provide visual feedback
- ✅ Optional fields don't clutter UI
- ✅ Validation works correctly
- ✅ Saves to Supabase successfully
- ✅ German labels throughout
- ✅ Consistent with app design
