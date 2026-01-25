/**
 * Custom Plan Flow Screen
 *
 * Multi-step form for creating fully custom training plans:
 * 1. Select number of training days per week (2-6)
 * 2. Select which days and times (optional)
 * 3. Configure each day with carousel view
 * 4. Preview and create plan
 */

import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Alert,
  ActivityIndicator,
  TouchableOpacity,
  TextInput,
  Dimensions,
  FlatList,
} from "react-native";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { useTrainingNavigation } from "@/hooks/useTrainingNavigation";
import { supabase } from "@/lib/supabase";
import type { Exercise } from "@/types/training.types";
import * as Haptics from "expo-haptics";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

// ============================================================================
// Types
// ============================================================================

interface DaySchedule {
  dayOfWeek: string; // "Montag", "Dienstag", etc.
  time?: string; // "18:00"
}

interface DayConfiguration {
  dayNumber: number;
  schedule: DaySchedule;
  muscleGroups: MuscleGroup[];
  selectedExercisesByGroup: Record<string, SelectedExercise[]>; // groupId -> exercises
}

interface CustomPlanState {
  daysPerWeek: number | null;
  planName: string;
  durationWeeks: number | null;
  dayConfigurations: DayConfiguration[];
}

interface MuscleGroup {
  id: string;
  name: string;
  name_de: string;
  icon: string;
}

interface SelectedExercise {
  exercise: Exercise;
  sets: number;
  repsMin: number;
  repsMax: number;
}

type Step = "days" | "duration" | "schedule" | "configureDays" | "preview";

// ============================================================================
// Constants
// ============================================================================

const COLORS = {
  background: "#F8F9FA",
  text: "#333333",
  textSecondary: "#666666",
  primary: "#4A90E2",
  success: "#4CAF50",
  selected: "#E3F2FD",
  selectedBorder: "#4A90E2",
  border: "#E5E5EA",
  white: "#FFFFFF",
};

const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
};

const MUSCLE_GROUPS: MuscleGroup[] = [
  { id: "chest", name: "Chest", name_de: "Brust", icon: "💪" },
  { id: "back", name: "Back", name_de: "Rücken", icon: "🏋️" },
  { id: "shoulders", name: "Shoulders", name_de: "Schultern", icon: "🔺" },
  { id: "arms", name: "Arms", name_de: "Arme", icon: "💪" },
  { id: "legs", name: "Legs", name_de: "Beine", icon: "🦵" },
  { id: "core", name: "Core", name_de: "Rumpf", icon: "⭕" },
];

const WEEKDAYS = ["Montag", "Dienstag", "Mittwoch", "Donnerstag", "Freitag", "Samstag", "Sonntag"];

const MUSCLE_GROUP_DB_MAPPING: Record<string, string[]> = {
  chest: ["chest"],
  back: ["lats", "middle_back", "rhomboids", "erectors", "traps"],
  shoulders: ["anterior_deltoid", "lateral_deltoid", "posterior_deltoid"],
  arms: ["biceps", "triceps", "forearms"],
  legs: ["quadriceps", "quads", "hamstrings", "glutes", "calves"],
  core: ["core", "obliques"],
};

const DEFAULT_SETS = 3;
const DEFAULT_REPS_MIN = 8;
const DEFAULT_REPS_MAX = 12;

// ============================================================================
// Component
// ============================================================================

export const CustomPlanFlowScreen: React.FC = () => {
  const navigation = useTrainingNavigation();
  const carouselRef = useRef<FlatList>(null);

  // State
  const [currentStep, setCurrentStep] = useState<Step>("days");
  const [loading, setLoading] = useState(false);
  const [planState, setPlanState] = useState<CustomPlanState>({
    daysPerWeek: null,
    planName: "",
    durationWeeks: null,
    dayConfigurations: [],
  });

  // Day configuration state
  const [currentDayIndex, setCurrentDayIndex] = useState(0);
  const [currentMuscleGroupTab, setCurrentMuscleGroupTab] = useState<string | null>(null);
  const [availableExercises, setAvailableExercises] = useState<Exercise[]>([]);
  const [loadingExercises, setLoadingExercises] = useState(false);
  const [equipmentFilter, setEquipmentFilter] = useState<string>('all');
  const [expandedExerciseId, setExpandedExerciseId] = useState<string | null>(null);

  // Calculate progress
  const calculateProgress = (): number => {
    const stepProgress: Record<Step, number> = {
      days: 0.2,
      duration: 0.4,
      schedule: 0.6,
      configureDays: 0.8,
      preview: 1.0,
    };
    return stepProgress[currentStep];
  };

  const progress = calculateProgress();

  // Equipment filter options
  const EQUIPMENT_OPTIONS = [
    { id: 'all', label: 'Alle Übungen', values: [] as string[] },
    { id: 'dumbbell', label: 'Kurzhantel', values: ['dumbbell', 'dumbbells'] },
    { id: 'barbell', label: 'Langhantel', values: ['barbell', 'ez_bar', 'trap_bar'] },
    { id: 'cable', label: 'Kabel', values: ['cable', 'cable_machine'] },
    { id: 'bodyweight', label: 'Körpergewicht', values: ['none'] },
    { id: 'machine', label: 'Maschine', values: ['machine', 'leg_press_machine', 'leg_curl_machine', 'leg_extension_machine', 'calf_raise_machine'] },
  ];

  // Initialize day configurations when days are selected
  useEffect(() => {
    if (planState.daysPerWeek && planState.dayConfigurations.length === 0) {
      const configs: DayConfiguration[] = [];
      for (let i = 0; i < planState.daysPerWeek; i++) {
        configs.push({
          dayNumber: i + 1,
          schedule: {
            dayOfWeek: WEEKDAYS[i] || `Tag ${i + 1}`,
            time: undefined,
          },
          muscleGroups: [],
          selectedExercisesByGroup: {},
        });
      }
      setPlanState({ ...planState, dayConfigurations: configs });
    }
  }, [planState.daysPerWeek]);

  // ============================================================================
  // Step 1: Days Per Week Selection
  // ============================================================================

  const renderDaysStep = () => {
    const daysOptions = [2, 3, 4, 5, 6];

    return (
      <View style={styles.stepContainer}>
        <ScrollView
          style={styles.stepScrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.stepScrollContent}
        >
          <Text style={styles.stepTitle}>
            Wie viele Tage pro Woche möchtest du trainieren?
          </Text>
          <Text style={styles.stepSubtitle}>
            Wähle eine realistische Anzahl, die zu deinem Zeitplan passt
          </Text>

          <View style={styles.optionsContainer}>
            {daysOptions.map((days) => (
              <Card
                key={days}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setPlanState({ ...planState, daysPerWeek: days, dayConfigurations: [] });
                }}
                padding="large"
                elevation={planState.daysPerWeek === days ? "large" : "medium"}
                style={[
                  styles.optionCard,
                  planState.daysPerWeek === days && styles.optionCardSelected,
                ]}
              >
                <Text style={styles.daysNumber}>{days}</Text>
                <Text style={styles.daysLabel}>
                  {days === 1 ? "Tag" : "Tage"} pro Woche
                </Text>
                {planState.daysPerWeek === days && (
                  <View style={styles.checkmark}>
                    <Text style={styles.checkmarkText}>✓</Text>
                  </View>
                )}
              </Card>
            ))}
          </View>
        </ScrollView>

        <View style={styles.navigationButtons}>
          <Button
            variant="secondary"
            onPress={() => navigation.goBack()}
            style={styles.navButton}
          >
            Abbrechen
          </Button>
          <Button
            variant="primary"
            onPress={() => setCurrentStep("duration")}
            disabled={planState.daysPerWeek === null}
            style={styles.navButton}
          >
            Weiter
          </Button>
        </View>
      </View>
    );
  };

  // ============================================================================
  // Step 2: Duration Selection
  // ============================================================================

  const renderDurationStep = () => {
    const durationOptions = [
      { weeks: null, label: "Unbegrenzt", description: "Kein festes Enddatum" },
      { weeks: 4, label: "4 Wochen", description: "Kurzer Fokus-Plan" },
      { weeks: 8, label: "8 Wochen", description: "Standard-Plan" },
      { weeks: 12, label: "12 Wochen", description: "Langfristiger Plan" },
      { weeks: 16, label: "16 Wochen", description: "Erweiterter Plan" },
    ];

    return (
      <View style={styles.stepContainer}>
        <ScrollView
          style={styles.stepScrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.stepScrollContent}
        >
          <Text style={styles.stepTitle}>
            Wie lange soll dein Plan laufen?
          </Text>
          <Text style={styles.stepSubtitle}>
            Du kannst einen zeitlich begrenzten oder unbegrenzten Plan erstellen
          </Text>

          <View style={styles.optionsContainer}>
            {durationOptions.map((option) => (
              <Card
                key={option.weeks === null ? 'unlimited' : option.weeks}
                onPress={() => {
                  Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
                  setPlanState({ ...planState, durationWeeks: option.weeks });
                }}
                padding="large"
                elevation={planState.durationWeeks === option.weeks ? "large" : "medium"}
                style={[
                  styles.optionCard,
                  planState.durationWeeks === option.weeks && styles.optionCardSelected,
                ]}
              >
                <Text style={styles.daysNumber}>{option.label}</Text>
                <Text style={styles.daysLabel}>{option.description}</Text>
                {planState.durationWeeks === option.weeks && (
                  <View style={styles.checkmark}>
                    <Text style={styles.checkmarkText}>✓</Text>
                  </View>
                )}
              </Card>
            ))}
          </View>
        </ScrollView>

        <View style={styles.navigationButtons}>
          <Button
            variant="secondary"
            onPress={() => setCurrentStep("days")}
            style={styles.navButton}
          >
            Zurück
          </Button>
          <Button
            variant="primary"
            onPress={() => setCurrentStep("schedule")}
            disabled={planState.durationWeeks === undefined}
            style={styles.navButton}
          >
            Weiter
          </Button>
        </View>
      </View>
    );
  };

  // ============================================================================
  // Step 3: Schedule Selection
  // ============================================================================

  const updateDaySchedule = (dayIndex: number, field: keyof DaySchedule, value: string) => {
    const updatedConfigs = [...planState.dayConfigurations];
    updatedConfigs[dayIndex].schedule = {
      ...updatedConfigs[dayIndex].schedule,
      [field]: value,
    };
    setPlanState({ ...planState, dayConfigurations: updatedConfigs });
  };

  const renderScheduleStep = () => {
    return (
      <View style={styles.stepContainer}>
        <ScrollView
          style={styles.stepScrollView}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.stepScrollContent}
        >
          <Text style={styles.stepTitle}>Welche Tage und wann?</Text>
          <Text style={styles.stepSubtitle}>
            Optionale Angabe - wichtig für spätere Kalenderanbindung
          </Text>

          {planState.dayConfigurations.map((dayConfig, index) => (
            <Card key={index} padding="medium" style={styles.scheduleCard}>
              <Text style={styles.scheduleCardTitle}>Tag {index + 1}</Text>

              <View style={styles.scheduleInputGroup}>
                <Text style={styles.inputLabel}>Wochentag</Text>
                <View style={styles.weekdaySelector}>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                    {WEEKDAYS.map((day) => (
                      <TouchableOpacity
                        key={day}
                        onPress={() => updateDaySchedule(index, "dayOfWeek", day)}
                        style={[
                          styles.weekdayChip,
                          dayConfig.schedule.dayOfWeek === day && styles.weekdayChipSelected,
                        ]}
                      >
                        <Text
                          style={[
                            styles.weekdayChipText,
                            dayConfig.schedule.dayOfWeek === day &&
                              styles.weekdayChipTextSelected,
                          ]}
                        >
                          {day.substring(0, 2)}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </View>
              </View>

              <View style={styles.scheduleInputGroup}>
                <Text style={styles.inputLabel}>Uhrzeit (optional)</Text>
                <TextInput
                  style={styles.timeInput}
                  placeholder="z.B. 18:00"
                  value={dayConfig.schedule.time || ""}
                  onChangeText={(text) => updateDaySchedule(index, "time", text)}
                  placeholderTextColor={COLORS.textSecondary}
                  keyboardType="default"
                />
              </View>
            </Card>
          ))}
        </ScrollView>

        <View style={styles.navigationButtons}>
          <Button
            variant="secondary"
            onPress={() => setCurrentStep("duration")}
            style={styles.navButton}
          >
            Zurück
          </Button>
          <Button
            variant="primary"
            onPress={() => {
              setCurrentDayIndex(0);
              setCurrentStep("configureDays");
            }}
            style={styles.navButton}
          >
            Weiter
          </Button>
        </View>
      </View>
    );
  };

  // ============================================================================
  // Step 4: Configure Days with Carousel
  // ============================================================================

  const currentDayConfig = planState.dayConfigurations[currentDayIndex];

  // Load exercises when muscle groups change or tab changes
  useEffect(() => {
    if (currentStep === "configureDays" && currentDayConfig && currentMuscleGroupTab) {
      loadExercisesForMuscleGroup(currentMuscleGroupTab);
    }
  }, [currentStep, currentMuscleGroupTab]);

  // Set first muscle group as active tab when muscle groups change
  useEffect(() => {
    if (currentDayConfig?.muscleGroups.length > 0 && !currentMuscleGroupTab) {
      setCurrentMuscleGroupTab(currentDayConfig.muscleGroups[0].id);
    } else if (currentDayConfig?.muscleGroups.length === 0) {
      setCurrentMuscleGroupTab(null);
    }
  }, [currentDayConfig?.muscleGroups]);

  const loadExercisesForMuscleGroup = async (groupId: string) => {
    setLoadingExercises(true);
    try {
      const dbMuscles = MUSCLE_GROUP_DB_MAPPING[groupId] || [groupId];

      const orConditions = dbMuscles
        .filter((muscle) => muscle && muscle.trim().length > 0)
        .map((muscle) => `primary_muscles.cs.{${muscle}}`)
        .join(",");

      if (!orConditions) {
        setAvailableExercises([]);
        return;
      }

      const { data, error } = await supabase
        .from("exercises")
        .select("*")
        .or(orConditions)
        .eq("is_active", true)
        .order("name_de");

      if (error) {
        console.error("Fehler beim Laden der Übungen:", error);
        Alert.alert("Fehler", "Übungen konnten nicht geladen werden.");
        return;
      }

      setAvailableExercises(data || []);
    } catch (error) {
      console.error("Fehler in loadExercisesForMuscleGroup:", error);
      Alert.alert("Fehler", "Ein unerwarteter Fehler ist aufgetreten.");
    } finally {
      setLoadingExercises(false);
    }
  };

  // Filter exercises based on selected equipment
  const getFilteredExercises = (): Exercise[] => {
    if (equipmentFilter === 'all') {
      return availableExercises;
    }

    // Find the selected equipment option
    const selectedOption = EQUIPMENT_OPTIONS.find(opt => opt.id === equipmentFilter);
    if (!selectedOption || selectedOption.values.length === 0) {
      return availableExercises;
    }

    // Filter by specific equipment type
    return availableExercises.filter(exercise => {
      const requiredEquipment = exercise.equipment_required || [];

      // Check if the exercise uses any of the selected equipment values
      return requiredEquipment.some(equipment =>
        selectedOption.values.includes(equipment)
      );
    });
  };

  const handleToggleMuscleGroup = (group: MuscleGroup) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const updatedDayConfigs = [...planState.dayConfigurations];
    const dayConfig = updatedDayConfigs[currentDayIndex];

    const isSelected = dayConfig.muscleGroups.some((g) => g.id === group.id);

    if (isSelected) {
      // Remove muscle group and its exercises
      dayConfig.muscleGroups = dayConfig.muscleGroups.filter((g) => g.id !== group.id);
      delete dayConfig.selectedExercisesByGroup[group.id];

      // Switch to another tab if current tab was removed
      if (currentMuscleGroupTab === group.id) {
        setCurrentMuscleGroupTab(dayConfig.muscleGroups[0]?.id || null);
      }
    } else {
      // Add muscle group
      dayConfig.muscleGroups = [...dayConfig.muscleGroups, group];
      dayConfig.selectedExercisesByGroup[group.id] = [];

      // Switch to the new tab
      setCurrentMuscleGroupTab(group.id);
    }

    setPlanState({ ...planState, dayConfigurations: updatedDayConfigs });
  };

  const handleToggleExercise = (exercise: Exercise) => {
    if (!currentMuscleGroupTab) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const updatedDayConfigs = [...planState.dayConfigurations];
    const dayConfig = updatedDayConfigs[currentDayIndex];
    const exercises = dayConfig.selectedExercisesByGroup[currentMuscleGroupTab] || [];

    const isSelected = exercises.some((e) => e.exercise.id === exercise.id);

    if (isSelected) {
      // Deselect: remove exercise and collapse
      dayConfig.selectedExercisesByGroup[currentMuscleGroupTab] = exercises.filter(
        (e) => e.exercise.id !== exercise.id
      );
      if (expandedExerciseId === exercise.id) {
        setExpandedExerciseId(null);
      }
    } else {
      // Select: add exercise and expand it
      dayConfig.selectedExercisesByGroup[currentMuscleGroupTab] = [
        ...exercises,
        {
          exercise,
          sets: DEFAULT_SETS,
          repsMin: DEFAULT_REPS_MIN,
          repsMax: DEFAULT_REPS_MAX,
        },
      ];
      setExpandedExerciseId(exercise.id);
    }

    setPlanState({ ...planState, dayConfigurations: updatedDayConfigs });
  };

  const handleToggleAccordion = (exerciseId: string) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    setExpandedExerciseId(expandedExerciseId === exerciseId ? null : exerciseId);
  };

  const updateExerciseConfig = (
    exerciseId: string,
    field: "sets" | "repsMin" | "repsMax",
    value: number
  ) => {
    if (!currentMuscleGroupTab) return;

    const updatedDayConfigs = [...planState.dayConfigurations];
    const dayConfig = updatedDayConfigs[currentDayIndex];
    const exercises = dayConfig.selectedExercisesByGroup[currentMuscleGroupTab] || [];

    dayConfig.selectedExercisesByGroup[currentMuscleGroupTab] = exercises.map((ex) =>
      ex.exercise.id === exerciseId ? { ...ex, [field]: value } : ex
    );

    setPlanState({ ...planState, dayConfigurations: updatedDayConfigs });
  };

  const getTotalExercisesForDay = (dayConfig: DayConfiguration): number => {
    return Object.values(dayConfig.selectedExercisesByGroup).reduce(
      (sum, exercises) => sum + exercises.length,
      0
    );
  };

  const goToNextDay = () => {
    if (currentDayConfig.muscleGroups.length === 0) {
      Alert.alert(
        "Hinweis",
        `Bitte wähle mindestens eine Muskelgruppe für ${currentDayConfig.schedule.dayOfWeek} aus.`
      );
      return;
    }

    if (getTotalExercisesForDay(currentDayConfig) === 0) {
      Alert.alert(
        "Hinweis",
        `Bitte wähle mindestens eine Übung für ${currentDayConfig.schedule.dayOfWeek} aus.`
      );
      return;
    }

    if (currentDayIndex < planState.dayConfigurations.length - 1) {
      setCurrentDayIndex(currentDayIndex + 1);
      setCurrentMuscleGroupTab(null);
      carouselRef.current?.scrollToIndex({ index: currentDayIndex + 1, animated: true });
    } else {
      setCurrentStep("preview");
    }
  };

  const goToPreviousDay = () => {
    if (currentDayIndex > 0) {
      setCurrentDayIndex(currentDayIndex - 1);
      setCurrentMuscleGroupTab(null);
      carouselRef.current?.scrollToIndex({ index: currentDayIndex - 1, animated: true });
    } else {
      setCurrentStep("schedule");
    }
  };

  const renderDayCarouselItem = ({ item, index }: { item: DayConfiguration; index: number }) => {
    const isActive = index === currentDayIndex;
    if (!isActive) return <View style={{ width: SCREEN_WIDTH - 32 }} />;

    const currentGroupExercises =
      currentMuscleGroupTab && item.selectedExercisesByGroup[currentMuscleGroupTab]
        ? item.selectedExercisesByGroup[currentMuscleGroupTab]
        : [];

    return (
      <View style={styles.carouselPage}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.carouselScrollContent}
        >
          <Text style={styles.carouselDayTitle}>{item.schedule.dayOfWeek}</Text>
          {item.schedule.time && (
            <Text style={styles.carouselDayTime}>🕐 {item.schedule.time}</Text>
          )}

          {/* Muscle Groups Selection */}
          <View style={styles.sectionContainer}>
            <Text style={styles.sectionTitle}>Muskelgruppen</Text>
            <View style={styles.muscleGroupsGrid}>
              {MUSCLE_GROUPS.map((group) => {
                const isSelected = item.muscleGroups.some((g) => g.id === group.id);

                return (
                  <Card
                    key={group.id}
                    onPress={() => handleToggleMuscleGroup(group)}
                    padding="small"
                    elevation={isSelected ? "large" : "medium"}
                    style={[
                      styles.muscleGroupCard,
                      isSelected && styles.muscleGroupCardSelected,
                    ]}
                  >
                    <Text style={styles.muscleGroupIcon}>{group.icon}</Text>
                    <Text style={styles.muscleGroupName}>{group.name_de}</Text>
                    {isSelected && (
                      <View style={styles.muscleGroupCheck}>
                        <Text style={styles.checkmarkText}>✓</Text>
                      </View>
                    )}
                  </Card>
                );
              })}
            </View>
          </View>

          {/* Muscle Group Tabs */}
          {item.muscleGroups.length > 0 && (
            <View style={styles.sectionContainer}>
              <Text style={styles.sectionTitle}>Übungen</Text>

              {/* Tabs for multiple muscle groups */}
              {item.muscleGroups.length > 1 && (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.muscleTabsContainer}
                >
                  {item.muscleGroups.map((group) => {
                    const isActiveTab = currentMuscleGroupTab === group.id;
                    const exerciseCount =
                      item.selectedExercisesByGroup[group.id]?.length || 0;

                    return (
                      <TouchableOpacity
                        key={group.id}
                        onPress={() => setCurrentMuscleGroupTab(group.id)}
                        style={[
                          styles.muscleTab,
                          isActiveTab && styles.muscleTabActive,
                        ]}
                      >
                        <Text
                          style={[
                            styles.muscleTabText,
                            isActiveTab && styles.muscleTabTextActive,
                          ]}
                        >
                          {group.name_de}
                        </Text>
                        {exerciseCount > 0 && (
                          <View style={styles.muscleTabBadge}>
                            <Text style={styles.muscleTabBadgeText}>{exerciseCount}</Text>
                          </View>
                        )}
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
              )}

              {/* Equipment Filter - Always show if exercises are loaded */}
              {availableExercises.length > 0 && (
                <ScrollView
                  horizontal
                  showsHorizontalScrollIndicator={false}
                  style={styles.equipmentFilterContainer}
                >
                  {EQUIPMENT_OPTIONS.map((option) => (
                    <TouchableOpacity
                      key={option.id}
                      onPress={() => setEquipmentFilter(option.id)}
                      style={[
                        styles.filterChip,
                        equipmentFilter === option.id && styles.filterChipActive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.filterChipText,
                          equipmentFilter === option.id && styles.filterChipTextActive,
                        ]}
                      >
                        {option.label}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}

              {/* Exercise List */}
              {loadingExercises ? (
                <ActivityIndicator size="large" color={COLORS.primary} />
              ) : (
                <View style={styles.exercisesList}>
                  {getFilteredExercises().map((exercise) => {
                    const selectedExercise = currentGroupExercises.find(
                      (e) => e.exercise.id === exercise.id
                    );
                    const isSelected = !!selectedExercise;
                    const isExpanded = expandedExerciseId === exercise.id && isSelected;

                    return (
                      <Card
                        key={exercise.id}
                        padding="medium"
                        elevation={isSelected ? "large" : "small"}
                        style={[
                          styles.exerciseCard,
                          isSelected && styles.exerciseCardSelected,
                        ]}
                      >
                        {/* Exercise Header - always visible */}
                        <TouchableOpacity
                          onPress={() => {
                            if (isSelected) {
                              handleToggleAccordion(exercise.id);
                            } else {
                              handleToggleExercise(exercise);
                            }
                          }}
                          style={styles.exerciseCardContent}
                          activeOpacity={0.7}
                        >
                          <View style={styles.exerciseInfo}>
                            <Text style={styles.exerciseName}>{exercise.name_de}</Text>
                            <Text style={styles.exerciseEquipment}>
                              {(exercise.equipment_required || []).join(", ")}
                            </Text>
                            {isSelected && selectedExercise && (
                              <Text style={styles.exerciseConfigSummary}>
                                {selectedExercise.sets} Sätze × {selectedExercise.repsMin}-{selectedExercise.repsMax} Wdh
                              </Text>
                            )}
                          </View>
                          <View style={styles.exerciseActions}>
                            {isSelected && (
                              <TouchableOpacity
                                onPress={() => handleToggleExercise(exercise)}
                                style={styles.removeButton}
                                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                              >
                                <Text style={styles.removeButtonText}>×</Text>
                              </TouchableOpacity>
                            )}
                            {isSelected ? (
                              <Text style={styles.accordionArrow}>
                                {isExpanded ? "▲" : "▼"}
                              </Text>
                            ) : (
                              <View style={styles.addButton}>
                                <Text style={styles.addButtonText}>+</Text>
                              </View>
                            )}
                          </View>
                        </TouchableOpacity>

                        {/* Accordion Content - Sets & Reps Configuration */}
                        {isExpanded && selectedExercise && (
                          <View style={styles.accordionContent}>
                            <View style={styles.configInputs}>
                              {/* Sets */}
                              <View style={styles.configInputGroup}>
                                <Text style={styles.configLabel}>Sätze</Text>
                                <View style={styles.numberInput}>
                                  <TouchableOpacity
                                    onPress={() =>
                                      updateExerciseConfig(
                                        selectedExercise.exercise.id,
                                        "sets",
                                        Math.max(1, selectedExercise.sets - 1)
                                      )
                                    }
                                    style={styles.numberButton}
                                  >
                                    <Text style={styles.numberButtonText}>-</Text>
                                  </TouchableOpacity>
                                  <Text style={styles.numberValue}>{selectedExercise.sets}</Text>
                                  <TouchableOpacity
                                    onPress={() =>
                                      updateExerciseConfig(
                                        selectedExercise.exercise.id,
                                        "sets",
                                        Math.min(10, selectedExercise.sets + 1)
                                      )
                                    }
                                    style={styles.numberButton}
                                  >
                                    <Text style={styles.numberButtonText}>+</Text>
                                  </TouchableOpacity>
                                </View>
                              </View>

                              {/* Reps Min */}
                              <View style={styles.configInputGroup}>
                                <Text style={styles.configLabel}>Wdh Min</Text>
                                <View style={styles.numberInput}>
                                  <TouchableOpacity
                                    onPress={() =>
                                      updateExerciseConfig(
                                        selectedExercise.exercise.id,
                                        "repsMin",
                                        Math.max(1, selectedExercise.repsMin - 1)
                                      )
                                    }
                                    style={styles.numberButton}
                                  >
                                    <Text style={styles.numberButtonText}>-</Text>
                                  </TouchableOpacity>
                                  <Text style={styles.numberValue}>{selectedExercise.repsMin}</Text>
                                  <TouchableOpacity
                                    onPress={() =>
                                      updateExerciseConfig(
                                        selectedExercise.exercise.id,
                                        "repsMin",
                                        Math.min(selectedExercise.repsMax, selectedExercise.repsMin + 1)
                                      )
                                    }
                                    style={styles.numberButton}
                                  >
                                    <Text style={styles.numberButtonText}>+</Text>
                                  </TouchableOpacity>
                                </View>
                              </View>

                              {/* Reps Max */}
                              <View style={styles.configInputGroup}>
                                <Text style={styles.configLabel}>Wdh Max</Text>
                                <View style={styles.numberInput}>
                                  <TouchableOpacity
                                    onPress={() =>
                                      updateExerciseConfig(
                                        selectedExercise.exercise.id,
                                        "repsMax",
                                        Math.max(selectedExercise.repsMin, selectedExercise.repsMax - 1)
                                      )
                                    }
                                    style={styles.numberButton}
                                  >
                                    <Text style={styles.numberButtonText}>-</Text>
                                  </TouchableOpacity>
                                  <Text style={styles.numberValue}>{selectedExercise.repsMax}</Text>
                                  <TouchableOpacity
                                    onPress={() =>
                                      updateExerciseConfig(
                                        selectedExercise.exercise.id,
                                        "repsMax",
                                        Math.min(50, selectedExercise.repsMax + 1)
                                      )
                                    }
                                    style={styles.numberButton}
                                  >
                                    <Text style={styles.numberButtonText}>+</Text>
                                  </TouchableOpacity>
                                </View>
                              </View>
                            </View>
                          </View>
                        )}
                      </Card>
                    );
                  })}
                </View>
              )}
            </View>
          )}
        </ScrollView>
      </View>
    );
  };

  const renderConfigureDaysStep = () => {
    return (
      <View style={styles.stepContainer}>
        {/* Day Indicator */}
        <View style={styles.dayIndicatorContainer}>
          <Text style={styles.dayIndicatorText}>
            Tag {currentDayIndex + 1} von {planState.dayConfigurations.length}
          </Text>
          <View style={styles.dayDotsContainer}>
            {planState.dayConfigurations.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.dayDot,
                  index === currentDayIndex && styles.dayDotActive,
                  getTotalExercisesForDay(planState.dayConfigurations[index]) > 0 &&
                    styles.dayDotCompleted,
                ]}
              />
            ))}
          </View>
        </View>

        {/* Carousel */}
        <FlatList
          ref={carouselRef}
          data={planState.dayConfigurations}
          renderItem={renderDayCarouselItem}
          keyExtractor={(item) => item.dayNumber.toString()}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          scrollEnabled={false}
          style={styles.carousel}
          contentContainerStyle={styles.carouselContent}
        />

        {/* Navigation */}
        <View style={styles.navigationButtons}>
          <Button variant="secondary" onPress={goToPreviousDay} style={styles.navButton}>
            Zurück
          </Button>
          <Button
            variant="primary"
            onPress={goToNextDay}
            disabled={
              !currentDayConfig ||
              currentDayConfig.muscleGroups.length === 0 ||
              getTotalExercisesForDay(currentDayConfig) === 0
            }
            style={styles.navButton}
          >
            {currentDayIndex < planState.dayConfigurations.length - 1
              ? "Nächster Tag"
              : "Zur Vorschau"}
          </Button>
        </View>
      </View>
    );
  };

  // ============================================================================
  // Step 5: Preview & Create
  // ============================================================================

  const handleCreatePlan = async () => {
    if (!planState.planName.trim()) {
      Alert.alert("Hinweis", "Bitte gib deinem Plan einen Namen.");
      return;
    }

    setLoading(true);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        throw new Error("Nicht angemeldet");
      }

      // Deactivate other plans
      const { error: deactivateError } = await supabase
        .from("training_plans")
        .update({ status: "paused" })
        .eq("user_id", user.id);

      if (deactivateError) {
        console.error("Fehler beim Deaktivieren anderer Pläne:", deactivateError);
        throw new Error("Andere Pläne konnten nicht deaktiviert werden");
      }

      // Calculate end date if duration is set
      let endDate = null;
      if (planState.durationWeeks !== null) {
        const startDate = new Date();
        endDate = new Date(startDate);
        endDate.setDate(endDate.getDate() + (planState.durationWeeks * 7));
      }

      // Create the plan
      const { data: newPlan, error: planError } = await supabase
        .from("training_plans")
        .insert({
          user_id: user.id,
          name: planState.planName,
          plan_type: "custom",
          days_per_week: planState.daysPerWeek!,
          status: "active",
          start_date: new Date().toISOString(),
          end_date: endDate ? endDate.toISOString() : null,
          total_weeks: planState.durationWeeks,
          current_week: 1,
        })
        .select()
        .single();

      if (planError || !newPlan) {
        console.error("Fehler beim Erstellen des Plans:", planError);
        throw new Error("Plan konnte nicht erstellt werden");
      }

      // Create workouts for each day
      for (const dayConfig of planState.dayConfigurations) {
        const focusNames = dayConfig.muscleGroups.map((g) => g.name_de).join(" & ");

        const { data: newWorkout, error: workoutError } = await supabase
          .from("plan_workouts")
          .insert({
            plan_id: newPlan.id,
            name: `${dayConfig.schedule.dayOfWeek}${
              dayConfig.schedule.time ? ` (${dayConfig.schedule.time})` : ""
            }`,
            day_number: dayConfig.dayNumber,
            week_number: 1,
            order_in_week: dayConfig.dayNumber,
            focus: focusNames,
          })
          .select()
          .single();

        if (workoutError || !newWorkout) {
          console.error("Workout Error Details:", workoutError);
          throw new Error("Workout konnte nicht erstellt werden");
        }

        // Create exercises for this workout from all muscle groups
        const allExercises: SelectedExercise[] = [];
        Object.values(dayConfig.selectedExercisesByGroup).forEach((exercises) => {
          allExercises.push(...exercises);
        });

        const exercisesToInsert = allExercises.map((ex, index) => ({
          workout_id: newWorkout.id,
          exercise_id: ex.exercise.id,
          order_in_workout: index + 1,
          sets: ex.sets,
          reps_min: ex.repsMin,
          reps_max: ex.repsMax,
        }));

        if (exercisesToInsert.length > 0) {
          const { error: exercisesError } = await supabase
            .from("plan_exercises")
            .insert(exercisesToInsert);

          if (exercisesError) {
            console.error("Fehler beim Erstellen der Exercises:", exercisesError);
            throw new Error("Übungen konnten nicht erstellt werden");
          }
        }
      }

      // Success!
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      Alert.alert(
        "Plan erstellt!",
        `Dein individueller Plan "${planState.planName}" wurde erfolgreich erstellt.`,
        [
          {
            text: "OK",
            onPress: () => {
              navigation.navigate("TrainingDashboard");
            },
          },
        ]
      );
    } catch (error) {
      console.error("Fehler beim Erstellen des Plans:", error);
      Alert.alert(
        "Fehler",
        error instanceof Error ? error.message : "Plan konnte nicht erstellt werden."
      );
    } finally {
      setLoading(false);
    }
  };

  const renderPreviewStep = () => {
    const totalExercises = planState.dayConfigurations.reduce(
      (sum, day) => sum + getTotalExercisesForDay(day),
      0
    );

    return (
      <View style={styles.stepContainer}>
        <Text style={styles.stepTitle}>Plan-Vorschau</Text>
        <Text style={styles.stepSubtitle}>
          Überprüfe deinen Plan und gib ihm einen Namen
        </Text>

        <ScrollView style={styles.previewScroll} showsVerticalScrollIndicator={false}>
          {/* Plan Name Input */}
          <Card padding="medium" style={styles.nameCard}>
            <Text style={styles.nameLabel}>Plan-Name</Text>
            <TextInput
              style={styles.nameInput}
              placeholder="z.B. Mein Custom Plan"
              value={planState.planName}
              onChangeText={(text) => setPlanState({ ...planState, planName: text })}
              placeholderTextColor={COLORS.textSecondary}
            />
          </Card>

          {/* Plan Stats */}
          <Card padding="large">
            <Text style={styles.previewSectionTitle}>Übersicht</Text>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>📅 Trainingstage:</Text>
              <Text style={styles.statValue}>{planState.daysPerWeek} pro Woche</Text>
            </View>
            <View style={styles.statRow}>
              <Text style={styles.statLabel}>🏋️ Übungen gesamt:</Text>
              <Text style={styles.statValue}>{totalExercises}</Text>
            </View>
          </Card>

          {/* Day Breakdown */}
          {planState.dayConfigurations.map((day) => {
            const allExercises: SelectedExercise[] = [];
            Object.values(day.selectedExercisesByGroup).forEach((exercises) => {
              allExercises.push(...exercises);
            });

            return (
              <Card key={day.dayNumber} padding="large" style={{ marginBottom: SPACING.md }}>
                <Text style={styles.previewSectionTitle}>{day.schedule.dayOfWeek}</Text>
                {day.schedule.time && (
                  <Text style={styles.previewDayTime}>🕐 {day.schedule.time}</Text>
                )}
                <View style={styles.statRow}>
                  <Text style={styles.statLabel}>💪 Muskelgruppen:</Text>
                  <Text style={styles.statValue}>
                    {day.muscleGroups.map((g) => g.name_de).join(", ")}
                  </Text>
                </View>
                <View style={styles.statRow}>
                  <Text style={styles.statLabel}>🏋️ Übungen:</Text>
                  <Text style={styles.statValue}>{allExercises.length}</Text>
                </View>
                <View style={styles.exercisePreviewList}>
                  {allExercises.map((ex) => (
                    <Text key={ex.exercise.id} style={styles.exercisePreviewItem}>
                      • {ex.exercise.name_de} ({ex.sets}x{ex.repsMin}-{ex.repsMax})
                    </Text>
                  ))}
                </View>
              </Card>
            );
          })}
        </ScrollView>

        <View style={styles.navigationButtons}>
          <Button
            variant="secondary"
            onPress={() => {
              setCurrentDayIndex(planState.dayConfigurations.length - 1);
              setCurrentStep("configureDays");
            }}
            style={styles.navButton}
          >
            Zurück
          </Button>
          <Button
            variant="primary"
            onPress={handleCreatePlan}
            disabled={loading || !planState.planName.trim()}
            style={styles.navButton}
          >
            {loading ? "Erstelle..." : "Plan erstellen"}
          </Button>
        </View>
      </View>
    );
  };

  // ============================================================================
  // Render
  // ============================================================================

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Progress Bar */}
        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${progress * 100}%` }]} />
          </View>
          <Text style={styles.progressText}>
            {currentStep === "days" && "Schritt 1 von 5"}
            {currentStep === "duration" && "Schritt 2 von 5"}
            {currentStep === "schedule" && "Schritt 3 von 5"}
            {currentStep === "configureDays" && "Schritt 4 von 5"}
            {currentStep === "preview" && "Schritt 5 von 5"}
          </Text>
        </View>

        {/* Step Content */}
        {currentStep === "days" && renderDaysStep()}
        {currentStep === "duration" && renderDurationStep()}
        {currentStep === "schedule" && renderScheduleStep()}
        {currentStep === "configureDays" && renderConfigureDaysStep()}
        {currentStep === "preview" && renderPreviewStep()}
      </View>
    </SafeAreaView>
  );
};

// ============================================================================
// Styles
// ============================================================================

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  progressContainer: {
    paddingHorizontal: SPACING.md,
    paddingTop: SPACING.md,
    paddingBottom: SPACING.lg,
  },
  progressBar: {
    height: 6,
    backgroundColor: "#E5E5EA",
    borderRadius: 3,
    overflow: "hidden",
    marginBottom: SPACING.sm,
  },
  progressFill: {
    height: "100%",
    backgroundColor: COLORS.primary,
    borderRadius: 3,
  },
  progressText: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: "center",
  },
  stepContainer: {
    flex: 1,
    paddingHorizontal: SPACING.md,
  },
  stepScrollView: {
    flex: 1,
  },
  stepScrollContent: {
    paddingBottom: SPACING.md,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: SPACING.sm,
    lineHeight: 32,
  },
  stepSubtitle: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: SPACING.lg,
    lineHeight: 20,
  },
  optionsContainer: {
    gap: SPACING.md,
    marginBottom: SPACING.xl,
  },
  optionCard: {
    position: "relative",
  },
  optionCardSelected: {
    backgroundColor: COLORS.selected,
    borderWidth: 2,
    borderColor: COLORS.selectedBorder,
  },
  daysNumber: {
    fontSize: 32,
    fontWeight: "700",
    color: COLORS.primary,
    textAlign: "center",
  },
  daysLabel: {
    fontSize: 16,
    color: COLORS.text,
    textAlign: "center",
    marginTop: SPACING.sm,
  },
  checkmark: {
    position: "absolute",
    top: 12,
    right: 12,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  checkmarkText: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: "700",
  },
  navigationButtons: {
    flexDirection: "row",
    gap: SPACING.md,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.background,
  },
  navButton: {
    flex: 1,
  },
  // Schedule Step
  scheduleCard: {
    marginBottom: SPACING.md,
  },
  scheduleCardTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  scheduleInputGroup: {
    marginBottom: SPACING.md,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  weekdaySelector: {
    marginBottom: SPACING.sm,
  },
  weekdayChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: "#E5E5EA",
    marginRight: SPACING.sm,
  },
  weekdayChipSelected: {
    backgroundColor: COLORS.primary,
  },
  weekdayChipText: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.text,
  },
  weekdayChipTextSelected: {
    color: COLORS.white,
  },
  timeInput: {
    fontSize: 16,
    color: COLORS.text,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    backgroundColor: "#F5F5F5",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  // Carousel
  dayIndicatorContainer: {
    alignItems: "center",
    marginBottom: SPACING.md,
  },
  dayIndicatorText: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  dayDotsContainer: {
    flexDirection: "row",
    gap: SPACING.sm,
  },
  dayDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#E5E5EA",
  },
  dayDotActive: {
    backgroundColor: COLORS.primary,
    width: 24,
  },
  dayDotCompleted: {
    backgroundColor: COLORS.success,
  },
  carousel: {
    flex: 1,
  },
  carouselContent: {
    paddingHorizontal: 0,
  },
  carouselPage: {
    width: SCREEN_WIDTH - 32,
    paddingHorizontal: 0,
  },
  carouselScrollContent: {
    paddingBottom: SPACING.md,
  },
  carouselDayTitle: {
    fontSize: 28,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  carouselDayTime: {
    fontSize: 16,
    color: COLORS.textSecondary,
    marginBottom: SPACING.lg,
  },
  // Sections
  sectionContainer: {
    marginBottom: SPACING.lg,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  muscleGroupsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: SPACING.sm,
  },
  muscleGroupCard: {
    width: "31%",
    alignItems: "center",
    position: "relative",
  },
  muscleGroupCardSelected: {
    backgroundColor: COLORS.selected,
    borderWidth: 2,
    borderColor: COLORS.selectedBorder,
  },
  muscleGroupIcon: {
    fontSize: 28,
    marginBottom: 4,
  },
  muscleGroupName: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.text,
    textAlign: "center",
  },
  muscleGroupCheck: {
    position: "absolute",
    top: 4,
    right: 4,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  // Muscle Group Tabs
  muscleTabsContainer: {
    marginBottom: SPACING.md,
  },
  muscleTab: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: 20,
    backgroundColor: "#E5E5EA",
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
    marginRight: SPACING.sm,
  },
  muscleTabActive: {
    backgroundColor: COLORS.primary,
  },
  muscleTabText: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.text,
  },
  muscleTabTextActive: {
    color: COLORS.white,
  },
  muscleTabBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: COLORS.success,
    alignItems: "center",
    justifyContent: "center",
  },
  muscleTabBadgeText: {
    fontSize: 10,
    fontWeight: "700",
    color: COLORS.white,
  },
  exercisesList: {
    gap: SPACING.sm,
  },
  exerciseCard: {
    marginBottom: SPACING.sm,
  },
  exerciseCardSelected: {
    backgroundColor: COLORS.selected,
    borderWidth: 2,
    borderColor: COLORS.selectedBorder,
  },
  exerciseCardContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  exerciseInfo: {
    flex: 1,
  },
  exerciseName: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.text,
    marginBottom: 4,
  },
  exerciseEquipment: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  exerciseConfigSummary: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: "600",
    marginTop: 4,
  },
  exerciseActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: SPACING.sm,
  },
  removeButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: "#FF6B6B",
    alignItems: "center",
    justifyContent: "center",
  },
  removeButtonText: {
    color: COLORS.white,
    fontSize: 20,
    fontWeight: "700",
    lineHeight: 22,
  },
  addButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  addButtonText: {
    color: COLORS.white,
    fontSize: 20,
    fontWeight: "700",
    lineHeight: 22,
  },
  accordionArrow: {
    fontSize: 12,
    color: COLORS.primary,
    marginLeft: 4,
  },
  accordionContent: {
    marginTop: SPACING.md,
    paddingTop: SPACING.md,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  smallCheckmark: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  configCard: {
    marginBottom: SPACING.md,
  },
  configExerciseName: {
    fontSize: 16,
    fontWeight: "600",
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  configInputs: {
    flexDirection: "row",
    gap: SPACING.md,
  },
  configInputGroup: {
    flex: 1,
  },
  configLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
  },
  numberInput: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  numberButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.primary,
    alignItems: "center",
    justifyContent: "center",
  },
  numberButtonText: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: "700",
  },
  numberValue: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.text,
    minWidth: 32,
    textAlign: "center",
  },
  // Preview
  previewScroll: {
    flex: 1,
    marginBottom: SPACING.md,
  },
  nameCard: {
    marginBottom: SPACING.md,
  },
  nameLabel: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  nameInput: {
    fontSize: 16,
    color: COLORS.text,
    paddingVertical: SPACING.sm,
    paddingHorizontal: SPACING.md,
    backgroundColor: "#F5F5F5",
    borderRadius: 8,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  previewSectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: SPACING.md,
  },
  previewDayTime: {
    fontSize: 14,
    color: COLORS.textSecondary,
    marginBottom: SPACING.sm,
  },
  statRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: SPACING.sm,
  },
  statLabel: {
    fontSize: 14,
    color: COLORS.textSecondary,
  },
  statValue: {
    fontSize: 14,
    fontWeight: "600",
    color: COLORS.text,
    flex: 1,
    textAlign: "right",
  },
  exercisePreviewList: {
    marginTop: SPACING.sm,
    gap: 4,
  },
  exercisePreviewItem: {
    fontSize: 12,
    color: COLORS.textSecondary,
    lineHeight: 18,
  },
  // Equipment Filter
  equipmentFilterContainer: {
    marginBottom: SPACING.md,
  },
  filterChip: {
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: 20,
    backgroundColor: "#E5E5EA",
    alignItems: "center",
    marginRight: SPACING.sm,
  },
  filterChipActive: {
    backgroundColor: COLORS.primary,
  },
  filterChipText: {
    fontSize: 13,
    fontWeight: "600",
    color: COLORS.text,
  },
  filterChipTextActive: {
    color: COLORS.white,
  },
});
