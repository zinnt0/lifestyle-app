# Profile Edit Screen Builder Agent

## Role

You are a React Native screen builder specializing in profile management. You create polished, user-friendly edit screens with proper validation, state management, and error handling.

## Project Context

- **Framework**: React Native (Expo) with TypeScript
- **Location**: `src/screens/app/ProfileEditScreen.tsx`
- **Services**: `profile.service.ts` (already exists)
- **Validation**: `validation.ts` (already exists, can be extended)
- **Components**: UI components from `src/components/ui/`
- **Navigation**: React Navigation Stack
- **Design**: Reuse Onboarding UI patterns

## Your Task

### Create Profile Edit Screen

**File**: `src/screens/app/ProfileEditScreen.tsx`

Build a comprehensive profile editing screen that allows users to modify all their onboarding data in a single, well-organized form.

---

## Screen Structure

### Layout

```
┌─────────────────────────┐
│ [← Zurück]   Profil     │  <- Header with back button
│                         │
│ [Sections with Forms]   │  <- Collapsible or Tabs
│                         │
│ Section 1: Basisdaten   │
│ - Age, Weight, Height   │
│ - Gender                │
│                         │
│ Section 2: Training     │
│ - Level, Days, Equip    │
│                         │
│ Section 3: Ziele        │
│ - Primary Goal          │
│                         │
│ Section 4: Lifestyle    │
│ - Sleep, Stress         │
│                         │
│ Section 5: Unverträgl.  │
│ - Intolerances list     │
│                         │
│ [Error Message]         │
│                         │
│ [Speichern Button]      │
│ [Abbrechen Button]      │
│                         │
└─────────────────────────┘
```

**Design Approaches:**

**Option A: Single Scrollable Form** (Recommended for MVP)

- All fields in one ScrollView
- Clear section headers
- Simpler UX
- Faster to implement

**Option B: Tabbed Interface**

- Tab 1: Basisdaten
- Tab 2: Training
- Tab 3: Ziele & Lifestyle
- Tab 4: Unverträglichkeiten

**Option C: Collapsible Sections**

- Accordion-style sections
- User expands sections to edit

**Recommendation:** Start with Option A (single scrollable), can upgrade later.

---

## Implementation

### State Management

```typescript
import React, { useState, useEffect } from "react";
import { useNavigation } from "@react-navigation/native";
import { supabase } from "../../lib/supabase";
import {
  getProfile,
  updateProfile,
  getUserIntolerances,
  saveUserIntolerances,
  getIntolerancesCatalog,
} from "../../services/profile.service";

interface ProfileFormData {
  // Section 1: Basisdaten
  age: number | null;
  weight: number | null;
  height: number | null;
  gender: "male" | "female" | "other" | null;

  // Section 2: Training
  fitness_level: "beginner" | "intermediate" | "advanced" | null;
  training_experience_months: number | null;
  available_training_days: number | null;
  has_gym_access: boolean;
  home_equipment: string[];

  // Section 3: Ziele
  primary_goal:
    | "strength"
    | "hypertrophy"
    | "endurance"
    | "weight_loss"
    | "general_fitness"
    | null;

  // Section 4: Lifestyle
  sleep_hours_avg: number | null;
  stress_level: number | null;
}

interface UserIntoleranceInput {
  intolerance_id: string;
  severity: "mild" | "moderate" | "severe" | "life_threatening";
}

export const ProfileEditScreen: React.FC = () => {
  const navigation = useNavigation();

  // State
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Form data
  const [formData, setFormData] = useState<ProfileFormData>({
    age: null,
    weight: null,
    height: null,
    gender: null,
    fitness_level: null,
    training_experience_months: null,
    available_training_days: null,
    has_gym_access: true,
    home_equipment: [],
    primary_goal: null,
    sleep_hours_avg: null,
    stress_level: null,
  });

  // Intolerances
  const [intolerances, setIntolerances] = useState<UserIntoleranceInput[]>([]);
  const [intolerancesCatalog, setIntolerancesCatalog] = useState<any[]>([]);

  // Load profile on mount
  useEffect(() => {
    loadProfile();
    loadIntolerancesCatalog();
  }, []);

  const loadProfile = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;

      const { profile, error } = await getProfile(user.id);
      if (error) {
        setError(error.message);
        return;
      }

      if (profile) {
        setFormData({
          age: profile.age,
          weight: profile.weight,
          height: profile.height,
          gender: profile.gender,
          fitness_level: profile.fitness_level,
          training_experience_months: profile.training_experience_months,
          available_training_days: profile.available_training_days,
          has_gym_access: profile.has_gym_access,
          home_equipment: profile.home_equipment || [],
          primary_goal: profile.primary_goal,
          sleep_hours_avg: profile.sleep_hours_avg,
          stress_level: profile.stress_level,
        });
      }

      // Load intolerances
      const { intolerances: userIntolerances } = await getUserIntolerances(
        user.id
      );
      if (userIntolerances) {
        setIntolerances(
          userIntolerances.map((int) => ({
            intolerance_id: int.intolerance.id,
            severity: int.severity as any,
          }))
        );
      }
    } catch (err) {
      console.error("Error loading profile:", err);
      setError("Fehler beim Laden des Profils");
    } finally {
      setLoading(false);
    }
  };

  const loadIntolerancesCatalog = async () => {
    const { intolerances } = await getIntolerancesCatalog();
    setIntolerancesCatalog(intolerances || []);
  };

  const updateField = (field: keyof ProfileFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    // Clear error on change
    if (error) setError(null);
    if (successMessage) setSuccessMessage(null);
  };

  const validateForm = (): string | null => {
    // Age
    if (!formData.age || formData.age < 13 || formData.age > 120) {
      return "Alter muss zwischen 13 und 120 liegen";
    }

    // Weight
    if (!formData.weight || formData.weight <= 0) {
      return "Gewicht muss größer als 0 sein";
    }

    // Height
    if (!formData.height || formData.height <= 0) {
      return "Größe muss größer als 0 sein";
    }

    // Gender
    if (!formData.gender) {
      return "Geschlecht ist erforderlich";
    }

    // Fitness level
    if (!formData.fitness_level) {
      return "Trainingslevel ist erforderlich";
    }

    // Training experience
    if (
      formData.training_experience_months === null ||
      formData.training_experience_months < 0
    ) {
      return "Trainingserfahrung muss angegeben werden";
    }

    // Training days
    if (
      !formData.available_training_days ||
      formData.available_training_days < 1 ||
      formData.available_training_days > 7
    ) {
      return "Trainingstage müssen zwischen 1 und 7 liegen";
    }

    // Goal
    if (!formData.primary_goal) {
      return "Trainingsziel ist erforderlich";
    }

    // Sleep
    if (
      !formData.sleep_hours_avg ||
      formData.sleep_hours_avg < 3 ||
      formData.sleep_hours_avg > 12
    ) {
      return "Schlafstunden müssen zwischen 3 und 12 liegen";
    }

    // Stress
    if (
      !formData.stress_level ||
      formData.stress_level < 1 ||
      formData.stress_level > 10
    ) {
      return "Stress-Level muss zwischen 1 und 10 liegen";
    }

    return null;
  };

  const handleSave = async () => {
    // Validate
    const validationError = validateForm();
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

      // Update profile
      const { error: profileError } = await updateProfile(user.id, formData);
      if (profileError) {
        setError(profileError.message);
        return;
      }

      // Update intolerances
      const { error: intolerancesError } = await saveUserIntolerances(
        user.id,
        intolerances
      );
      if (intolerancesError) {
        setError(intolerancesError.message);
        return;
      }

      // Success
      setSuccessMessage("Profil erfolgreich gespeichert! ✅");

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

  const handleCancel = () => {
    navigation.goBack();
  };

  // Intolerance helpers (same as OnboardingScreen5)
  const toggleIntolerance = (intoleranceId: string) => {
    const exists = intolerances.find((i) => i.intolerance_id === intoleranceId);

    if (exists) {
      setIntolerances(
        intolerances.filter((i) => i.intolerance_id !== intoleranceId)
      );
    } else {
      setIntolerances([
        ...intolerances,
        { intolerance_id: intoleranceId, severity: "moderate" },
      ]);
    }
  };

  const updateSeverity = (intoleranceId: string, severity: string) => {
    setIntolerances(
      intolerances.map((i) =>
        i.intolerance_id === intoleranceId
          ? { ...i, severity: severity as any }
          : i
      )
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={styles.loadingText}>Profil wird geladen...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Profil bearbeiten</Text>
        <Text style={styles.subtitle}>
          Ändere deine Daten und speichere sie
        </Text>
      </View>

      {/* Section 1: Basisdaten */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Basisdaten</Text>

        <Input
          label="Alter"
          value={formData.age?.toString() || ""}
          onChangeText={(text) => updateField("age", parseInt(text) || null)}
          keyboardType="number-pad"
          placeholder="z.B. 25"
        />

        <Input
          label="Gewicht (kg)"
          value={formData.weight?.toString() || ""}
          onChangeText={(text) =>
            updateField("weight", parseFloat(text) || null)
          }
          keyboardType="decimal-pad"
          placeholder="z.B. 75.5"
        />

        <Input
          label="Größe (cm)"
          value={formData.height?.toString() || ""}
          onChangeText={(text) =>
            updateField("height", parseFloat(text) || null)
          }
          keyboardType="decimal-pad"
          placeholder="z.B. 180"
        />

        <Text style={styles.label}>Geschlecht</Text>
        <RadioGroup
          options={[
            { label: "Männlich", value: "male" },
            { label: "Weiblich", value: "female" },
            { label: "Andere", value: "other" },
          ]}
          selected={formData.gender}
          onSelect={(value) => updateField("gender", value)}
        />
      </View>

      {/* Section 2: Training */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Training</Text>

        <Text style={styles.label}>Trainingslevel</Text>
        <View style={styles.buttonGroup}>
          <OptionButton
            label="Anfänger"
            selected={formData.fitness_level === "beginner"}
            onPress={() => updateField("fitness_level", "beginner")}
          />
          <OptionButton
            label="Fortgeschritten"
            selected={formData.fitness_level === "intermediate"}
            onPress={() => updateField("fitness_level", "intermediate")}
          />
          <OptionButton
            label="Experte"
            selected={formData.fitness_level === "advanced"}
            onPress={() => updateField("fitness_level", "advanced")}
          />
        </View>

        <Input
          label="Trainingserfahrung (Monate)"
          value={formData.training_experience_months?.toString() || ""}
          onChangeText={(text) =>
            updateField("training_experience_months", parseInt(text) || 0)
          }
          keyboardType="number-pad"
          placeholder="z.B. 12"
        />

        <NumberPicker
          label="Trainingstage pro Woche"
          value={formData.available_training_days || 3}
          min={1}
          max={7}
          onChange={(value) => updateField("available_training_days", value)}
        />

        <View style={styles.toggleRow}>
          <Text style={styles.label}>Gym-Zugang</Text>
          <Switch
            value={formData.has_gym_access}
            onValueChange={(value) => updateField("has_gym_access", value)}
          />
        </View>

        {!formData.has_gym_access && (
          <>
            <Text style={styles.label}>Equipment zu Hause</Text>
            <MultiSelectChips
              options={[
                "barbell",
                "dumbbells",
                "kettlebells",
                "resistance_bands",
                "pull_up_bar",
                "bench",
              ]}
              labels={{
                barbell: "Langhantel",
                dumbbells: "Kurzhanteln",
                kettlebells: "Kettlebells",
                resistance_bands: "Widerstandsbänder",
                pull_up_bar: "Klimmzugstange",
                bench: "Hantelbank",
              }}
              selected={formData.home_equipment}
              onSelectionChange={(selected) =>
                updateField("home_equipment", selected)
              }
            />
          </>
        )}
      </View>

      {/* Section 3: Ziele */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Trainingsziel</Text>

        {[
          { value: "strength", label: "Kraft aufbauen", icon: "💪" },
          { value: "hypertrophy", label: "Muskeln aufbauen", icon: "🏋️" },
          { value: "weight_loss", label: "Gewicht verlieren", icon: "🔥" },
          { value: "endurance", label: "Ausdauer", icon: "🏃" },
          { value: "general_fitness", label: "Allgemeine Fitness", icon: "✨" },
        ].map((goal) => (
          <GoalCard
            key={goal.value}
            label={goal.label}
            description=""
            icon={goal.icon}
            selected={formData.primary_goal === goal.value}
            onPress={() => updateField("primary_goal", goal.value)}
          />
        ))}
      </View>

      {/* Section 4: Lifestyle */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Lifestyle</Text>

        <View style={styles.sliderContainer}>
          <Text style={styles.label}>Durchschnittliche Schlafstunden</Text>
          <Text style={styles.value}>
            {formData.sleep_hours_avg?.toFixed(1) || "7.0"} Stunden
          </Text>
          <Slider
            minimumValue={3}
            maximumValue={12}
            step={0.5}
            value={formData.sleep_hours_avg || 7}
            onValueChange={(value) => updateField("sleep_hours_avg", value)}
          />
        </View>

        <View style={styles.sliderContainer}>
          <Text style={styles.label}>Stress-Level</Text>
          <Text style={styles.value}>{formData.stress_level || 5} / 10</Text>
          <Slider
            minimumValue={1}
            maximumValue={10}
            step={1}
            value={formData.stress_level || 5}
            onValueChange={(value) => updateField("stress_level", value)}
          />
        </View>
      </View>

      {/* Section 5: Unverträglichkeiten */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Unverträglichkeiten</Text>

        {intolerancesCatalog.map((intolerance) => {
          const selected = intolerances.find(
            (i) => i.intolerance_id === intolerance.id
          );

          return (
            <View key={intolerance.id} style={styles.intoleranceItem}>
              <TouchableOpacity
                style={styles.intoleranceRow}
                onPress={() => toggleIntolerance(intolerance.id)}
              >
                <View style={styles.checkbox}>
                  {selected && <Text style={styles.checkmark}>✓</Text>}
                </View>
                <View style={styles.intoleranceInfo}>
                  <Text style={styles.intoleranceName}>{intolerance.name}</Text>
                  {intolerance.description && (
                    <Text style={styles.intoleranceDescription}>
                      {intolerance.description}
                    </Text>
                  )}
                </View>
              </TouchableOpacity>

              {selected && (
                <View style={styles.severityPicker}>
                  <Text style={styles.severityLabel}>Schweregrad:</Text>
                  {["mild", "moderate", "severe", "life_threatening"].map(
                    (sev) => (
                      <TouchableOpacity
                        key={sev}
                        style={[
                          styles.severityOption,
                          selected.severity === sev &&
                            styles.severityOptionSelected,
                        ]}
                        onPress={() => updateSeverity(intolerance.id, sev)}
                      >
                        <Text
                          style={[
                            styles.severityText,
                            selected.severity === sev &&
                              styles.severityTextSelected,
                          ]}
                        >
                          {getSeverityLabel(sev)}
                        </Text>
                      </TouchableOpacity>
                    )
                  )}
                </View>
              )}
            </View>
          );
        })}
      </View>

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

      {/* Action Buttons */}
      <View style={styles.buttonContainer}>
        <Button
          title="Speichern"
          onPress={handleSave}
          loading={saving}
          disabled={saving}
          style={styles.saveButton}
        />

        <Button
          title="Abbrechen"
          variant="outline"
          onPress={handleCancel}
          disabled={saving}
          style={styles.cancelButton}
        />
      </View>
    </ScrollView>
  );
};

// Helper functions
const getSeverityLabel = (severity: string): string => {
  const labels: Record<string, string> = {
    mild: "Leicht",
    moderate: "Moderat",
    severe: "Schwer",
    life_threatening: "Lebensbedrohlich",
  };
  return labels[severity] || severity;
};

// OptionButton component (if not in ui/)
const OptionButton: React.FC<{
  label: string;
  selected: boolean;
  onPress: () => void;
}> = ({ label, selected, onPress }) => (
  <TouchableOpacity
    style={[styles.optionButton, selected && styles.optionButtonSelected]}
    onPress={onPress}
  >
    <Text style={[styles.optionText, selected && styles.optionTextSelected]}>
      {label}
    </Text>
  </TouchableOpacity>
);

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
  label: {
    fontSize: 14,
    fontWeight: "500",
    color: "#000000",
    marginBottom: 8,
    marginTop: 16,
  },
  buttonGroup: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 16,
  },
  optionButton: {
    flex: 1,
    padding: 12,
    borderWidth: 1,
    borderColor: "#C6C6C8",
    borderRadius: 8,
    alignItems: "center",
  },
  optionButtonSelected: {
    backgroundColor: "#007AFF",
    borderColor: "#007AFF",
  },
  optionText: {
    fontSize: 14,
    color: "#000000",
  },
  optionTextSelected: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
  toggleRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginVertical: 16,
  },
  sliderContainer: {
    marginVertical: 16,
  },
  value: {
    fontSize: 18,
    fontWeight: "600",
    color: "#007AFF",
    marginBottom: 8,
  },
  intoleranceItem: {
    marginBottom: 16,
  },
  intoleranceRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    backgroundColor: "#F2F2F7",
    borderRadius: 8,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: "#007AFF",
    borderRadius: 4,
    marginRight: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  checkmark: {
    color: "#007AFF",
    fontSize: 16,
    fontWeight: "bold",
  },
  intoleranceInfo: {
    flex: 1,
  },
  intoleranceName: {
    fontSize: 16,
    fontWeight: "500",
    color: "#000000",
  },
  intoleranceDescription: {
    fontSize: 14,
    color: "#8E8E93",
    marginTop: 2,
  },
  severityPicker: {
    marginTop: 8,
    marginLeft: 36,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  severityLabel: {
    fontSize: 14,
    color: "#8E8E93",
  },
  severityOption: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: "#C6C6C8",
    borderRadius: 4,
  },
  severityOptionSelected: {
    backgroundColor: "#007AFF",
    borderColor: "#007AFF",
  },
  severityText: {
    fontSize: 12,
    color: "#000000",
  },
  severityTextSelected: {
    color: "#FFFFFF",
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
  buttonContainer: {
    gap: 12,
    marginTop: 24,
  },
  saveButton: {
    backgroundColor: "#007AFF",
  },
  cancelButton: {
    backgroundColor: "transparent",
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
  Switch,
} from "react-native";
import Slider from "@react-native-community/slider";
import { useNavigation } from "@react-navigation/native";

// Services
import { supabase } from "../../lib/supabase";
import {
  getProfile,
  updateProfile,
  getUserIntolerances,
  saveUserIntolerances,
  getIntolerancesCatalog,
} from "../../services/profile.service";

// UI Components
import { Input } from "../../components/ui/Input";
import { Button } from "../../components/ui/Button";
import { RadioGroup } from "../../components/ui/RadioGroup";
import { NumberPicker } from "../../components/ui/NumberPicker";
import { MultiSelectChips } from "../../components/ui/MultiSelectChips";
import { GoalCard } from "../../components/ui/GoalCard";
```

---

## Navigation Setup

**Update MainNavigator.tsx:**

```typescript
// Add ProfileEdit screen to stack
<Stack.Screen
  name="ProfileEdit"
  component={ProfileEditScreen}
  options={{
    title: "Profil bearbeiten",
    headerBackTitle: "Zurück",
  }}
/>
```

**Update ProfileScreen.tsx:**

```typescript
// Add Edit button
import { useNavigation } from "@react-navigation/native";

const navigation = useNavigation();

<Button
  title="Profil bearbeiten"
  onPress={() => navigation.navigate("ProfileEdit")}
/>;
```

---

## Dependencies

Install Slider if not already:

```bash
npx expo install @react-native-community/slider
```

---

## Code Quality Requirements

✅ **Must Have**:

- TypeScript strict typing
- Loading state while fetching profile
- Validation before save
- Success/Error messages
- All fields editable
- Reuse existing UI components
- Reuse existing validation logic
- German error messages

❌ **Avoid**:

- Hardcoded user IDs
- Missing validation
- No loading states
- Unhandled errors
- Any types
- Prop drilling (use services directly)

---

## Testing Checklist

### Load Profile

- [ ] ✅ Profile loads on screen open
- [ ] ✅ All fields populated correctly
- [ ] ✅ Intolerances loaded and displayed
- [ ] ✅ Loading spinner shows during fetch

### Edit Fields

- [ ] ✅ Can change age, weight, height
- [ ] ✅ Can change gender
- [ ] ✅ Can change fitness level
- [ ] ✅ Can change training days
- [ ] ✅ Can toggle gym access
- [ ] ✅ Can select home equipment
- [ ] ✅ Can change goal
- [ ] ✅ Can adjust sleep slider
- [ ] ✅ Can adjust stress slider
- [ ] ✅ Can toggle intolerances
- [ ] ✅ Can change severity

### Validation

- [ ] ✅ Shows error for invalid age
- [ ] ✅ Shows error for invalid weight
- [ ] ✅ Shows error for invalid height
- [ ] ✅ Shows error for missing fields
- [ ] ✅ Cannot save with errors

### Save

- [ ] ✅ Save button disabled while saving
- [ ] ✅ Success message shows after save
- [ ] ✅ Navigates back after success
- [ ] ✅ Data persists in Supabase
- [ ] ✅ Error message shows on failure

### Cancel

- [ ] ✅ Cancel button navigates back
- [ ] ✅ No data saved on cancel
- [ ] ✅ Works during loading/saving

---

## Enhancements (Optional)

### 1. Confirmation Dialog on Cancel

If user has unsaved changes, show confirmation:

```typescript
const [hasChanges, setHasChanges] = useState(false);

const handleCancel = () => {
  if (hasChanges) {
    Alert.alert(
      "Änderungen verwerfen?",
      "Du hast ungespeicherte Änderungen. Möchtest du wirklich abbrechen?",
      [
        { text: "Nein", style: "cancel" },
        { text: "Ja", onPress: () => navigation.goBack() },
      ]
    );
  } else {
    navigation.goBack();
  }
};
```

### 2. Field-by-Field Validation

Show errors next to fields instead of general error:

```typescript
const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
```

### 3. Undo Changes

Reset to original values:

```typescript
const [originalData, setOriginalData] = useState<ProfileFormData | null>(null);

const handleReset = () => {
  if (originalData) {
    setFormData(originalData);
  }
};
```

---

## Output Format

Provide:

1. Complete `ProfileEditScreen.tsx` with all functionality
2. All TypeScript interfaces
3. Full validation logic
4. German error messages
5. Navigation setup instructions
6. Dependency installation commands
7. Comments for complex logic

---

## Success Criteria

- ✅ Screen loads profile data
- ✅ All fields editable
- ✅ Validation works
- ✅ Save persists to Supabase
- ✅ Success/Error feedback
- ✅ Navigation works
- ✅ Clean, typed code
- ✅ Reuses existing components
- ✅ User-friendly UX
