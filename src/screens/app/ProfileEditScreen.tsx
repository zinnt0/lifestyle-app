import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Switch,
  Image,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { pickImage, uploadProfileImage, deleteProfileImage } from '../../services/storage.service';
import { supabase } from '../../lib/supabase';
import {
  getProfile,
  updateProfile,
  getUserIntolerances,
  saveUserIntolerances,
  getIntolerancesCatalog,
  Intolerance,
} from '../../services/profile.service';
import { profileSyncService } from '../../services/ProfileSyncService';
import { NutritionGoalsService } from '../../../lib/services/nutrition-goals.service';
import type { TrainingGoal, Gender } from '../../../lib/types/nutrition.types';
import { NumericInput } from '../../components/ui/NumericInput';
import { Button } from '../../components/ui/Button';
import { RadioGroup } from '../../components/ui/RadioGroup';
import { NumberPicker } from '../../components/ui/NumberPicker';
import { MultiSelectChips } from '../../components/ui/MultiSelectChips';
import { WeekdaySelector } from '../../components/ui/WeekdaySelector';
import { GoalCard } from '../../components/ui/GoalCard';
import { Slider } from '../../components/ui/Slider';
import { OptionButton } from '../../components/ui/OptionButton';

/**
 * Profile Form Data Interface
 * Matches the structure needed for profile updates
 */
interface ProfileFormData {
  // Profile
  profile_image_url: string | null;

  // Section 1: Basisdaten
  age: number | null;
  weight: number | null;
  height: number | null;
  gender: 'male' | 'female' | 'other' | null;

  // Section 2: Training
  fitness_level: 'beginner' | 'intermediate' | 'advanced' | null;
  training_experience_months: number | null;
  available_training_days: number | null;
  preferred_training_days: number[] | null;
  has_gym_access: boolean;
  home_equipment: string[];

  // Section 3: Ziele
  primary_goal:
    | 'strength'
    | 'hypertrophy'
    | 'endurance'
    | 'weight_loss'
    | 'general_fitness'
    | null;

  // Women-specific training fields
  training_goals?: string[] | null;
  cardio_per_week?: number | null;
  training_location?: 'gym' | 'home' | 'both' | null;
  load_preference?: 'low_impact' | 'normal' | 'high_intensity' | null;
  split_preference?: 'full_body' | 'upper_lower' | 'push_pull' | 'no_preference' | null;

  // Section 4: Lifestyle
  sleep_hours_avg: number | null;
  stress_level: number | null;

  // Section 5: Nutrition (for calorie calculation)
  pal_factor: number | null;
  target_weight_kg: number | null;
  target_date: string | null;
  body_fat_percentage: number | null;

  // Section 6: Supplement Health Data
  gi_issues: Array<'bloating' | 'irritable_bowel' | 'diarrhea' | 'constipation'>;
  heavy_sweating: boolean;
  high_salt_intake: boolean;
  joint_issues: Array<'knee' | 'tendons' | 'shoulder' | 'back'>;
  lab_values: {
    hemoglobin?: number | null;
    mcv?: number | null;
    vitamin_d?: number | null;
    crp?: number | null;
    alt?: number | null;
    ggt?: number | null;
    estradiol?: number | null;
    testosterone?: number | null;
  } | null;
}

/**
 * User Intolerance Input Interface
 */
interface UserIntoleranceInput {
  intolerance_id: string;
  severity: 'mild' | 'moderate' | 'severe' | 'life_threatening';
}

/**
 * Profile Edit Screen
 *
 * Allows users to edit all their profile data in a single comprehensive form.
 * Loads existing profile data, validates input, and saves changes to Supabase.
 */
export const ProfileEditScreen: React.FC = () => {
  const navigation = useNavigation();

  // State
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [pickingImage, setPickingImage] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  // Form data
  const [formData, setFormData] = useState<ProfileFormData>({
    profile_image_url: null,
    age: null,
    weight: null,
    height: null,
    gender: null,
    fitness_level: null,
    training_experience_months: null,
    available_training_days: null,
    preferred_training_days: null,
    has_gym_access: true,
    home_equipment: [],
    primary_goal: null,
    training_goals: null,
    cardio_per_week: null,
    training_location: null,
    load_preference: null,
    split_preference: null,
    sleep_hours_avg: null,
    stress_level: null,
    pal_factor: 1.55, // Default: moderately active
    target_weight_kg: null,
    target_date: null,
    body_fat_percentage: null,
    // Supplement Health Data
    gi_issues: [],
    heavy_sweating: false,
    high_salt_intake: false,
    joint_issues: [],
    lab_values: null,
  });


  // Intolerances
  const [intolerances, setIntolerances] = useState<UserIntoleranceInput[]>([]);
  const [intolerancesCatalog, setIntolerancesCatalog] = useState<Intolerance[]>([]);

  // Load profile on mount
  useEffect(() => {
    loadProfile();
    loadIntolerancesCatalog();
  }, []);

  /**
   * Load user profile and intolerances from Supabase
   */
  const loadProfile = async () => {
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        setError('Nicht angemeldet');
        setLoading(false);
        return;
      }

      const { profile, error: profileError } = await getProfile(user.id);
      if (profileError) {
        setError(profileError.message);
        setLoading(false);
        return;
      }

      if (profile) {
        setFormData({
          profile_image_url: profile.profile_image_url,
          age: profile.age,
          weight: profile.weight,
          height: profile.height,
          gender: profile.gender,
          fitness_level: profile.fitness_level,
          training_experience_months: profile.training_experience_months,
          available_training_days: profile.available_training_days,
          preferred_training_days: profile.preferred_training_days,
          has_gym_access: profile.has_gym_access,
          home_equipment: profile.home_equipment || [],
          primary_goal: profile.primary_goal,
          training_goals: profile.training_goals,
          cardio_per_week: profile.cardio_per_week,
          training_location: profile.training_location,
          load_preference: profile.load_preference,
          split_preference: profile.split_preference,
          sleep_hours_avg: profile.sleep_hours_avg,
          stress_level: profile.stress_level,
          pal_factor: profile.pal_factor ?? 1.55,
          target_weight_kg: profile.target_weight_kg,
          target_date: profile.target_date,
          body_fat_percentage: profile.body_fat_percentage,
          // Supplement Health Data
          gi_issues: profile.gi_issues || [],
          heavy_sweating: profile.heavy_sweating ?? false,
          high_salt_intake: profile.high_salt_intake ?? false,
          joint_issues: profile.joint_issues || [],
          lab_values: profile.lab_values || null,
        });
      }

      // Load intolerances
      const { intolerances: userIntolerances } = await getUserIntolerances(user.id);
      if (userIntolerances) {
        setIntolerances(
          userIntolerances.map((int) => ({
            intolerance_id: int.intolerance.id,
            severity: int.severity as any,
          }))
        );
      }
    } catch (err) {
      console.error('Error loading profile:', err);
      setError('Fehler beim Laden des Profils');
    } finally {
      setLoading(false);
    }
  };

  /**
   * Load intolerances catalog from Supabase
   */
  const loadIntolerancesCatalog = async () => {
    const { intolerances } = await getIntolerancesCatalog();
    setIntolerancesCatalog(intolerances || []);
  };

  /**
   * Update a single form field
   * Memoized to prevent unnecessary re-renders and input focus loss
   */
  const updateField = useCallback((field: keyof ProfileFormData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  }, []);


  /**
   * Handle image selection from media library
   */
  const handlePickImage = async () => {
    try {
      setPickingImage(true);
      const asset = await pickImage();

      if (asset) {
        setUploadingImage(true);

        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          throw new Error('Nicht angemeldet');
        }

        // Delete old image if exists
        if (formData.profile_image_url && formData.profile_image_url.includes('supabase')) {
          await deleteProfileImage(formData.profile_image_url);
        }

        // Upload new image
        const { url, error: uploadError } = await uploadProfileImage(asset.uri, user.id);

        if (uploadError) {
          throw new Error(uploadError);
        }

        if (!url) {
          throw new Error('Keine URL vom Upload erhalten');
        }

        console.log('Upload successful, URL:', url);

        // Update form data with new URL
        updateField('profile_image_url', url);

        // Save immediately to database
        const { error: updateError } = await updateProfile(user.id, {
          profile_image_url: url,
        });

        if (updateError) {
          throw new Error(updateError.message);
        }

        console.log('Profile updated in database with image URL');

        setSuccessMessage('Profilbild erfolgreich hochgeladen!');

        // Clear success message after 3 seconds
        setTimeout(() => setSuccessMessage(null), 3000);
      }
    } catch (error: any) {
      Alert.alert('Fehler', error.message || 'Fehler beim Hochladen des Bildes');
      setError(error.message || 'Fehler beim Hochladen des Bildes');
    } finally {
      setPickingImage(false);
      setUploadingImage(false);
    }
  };

  /**
   * Validate the form before submission
   * Returns error message or null if valid
   */
  const validateForm = (): string | null => {
    // Age
    if (!formData.age || formData.age < 13 || formData.age > 120) {
      return 'Alter muss zwischen 13 und 120 liegen';
    }

    // Weight
    if (!formData.weight || formData.weight <= 0) {
      return 'Gewicht muss größer als 0 sein';
    }

    // Height
    if (!formData.height || formData.height <= 0) {
      return 'Größe muss größer als 0 sein';
    }

    // Gender
    if (!formData.gender) {
      return 'Geschlecht ist erforderlich';
    }

    // Fitness level
    if (!formData.fitness_level) {
      return 'Trainingslevel ist erforderlich';
    }

    // Training experience
    if (
      formData.training_experience_months === null ||
      formData.training_experience_months < 0
    ) {
      return 'Trainingserfahrung muss angegeben werden';
    }

    // Training days
    if (
      !formData.available_training_days ||
      formData.available_training_days < 1 ||
      formData.available_training_days > 7
    ) {
      return 'Trainingstage müssen zwischen 1 und 7 liegen';
    }

    // Goal
    if (!formData.primary_goal) {
      return 'Trainingsziel ist erforderlich';
    }

    // Sleep
    if (
      !formData.sleep_hours_avg ||
      formData.sleep_hours_avg < 3 ||
      formData.sleep_hours_avg > 12
    ) {
      return 'Schlafstunden müssen zwischen 3 und 12 liegen';
    }

    // Stress
    if (
      formData.stress_level === null ||
      formData.stress_level < 1 ||
      formData.stress_level > 10
    ) {
      return 'Stress-Level muss zwischen 1 und 10 liegen';
    }

    return null;
  };

  /**
   * Save profile changes to Supabase
   */
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
      if (!user) throw new Error('Nicht angemeldet');

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

      // Recalculate nutrition goals if relevant fields changed
      // Check if any nutrition-related fields are present
      if (
        formData.age &&
        formData.weight &&
        formData.height &&
        formData.gender &&
        formData.primary_goal &&
        formData.pal_factor
      ) {
        try {
          const nutritionService = new NutritionGoalsService();

          // Map primary_goal to training_goal
          const trainingGoalMap: Record<string, TrainingGoal> = {
            'strength': 'strength',
            'hypertrophy': 'muscle_gain',
            'muscle_gain': 'muscle_gain',
            'endurance': 'endurance',
            'weight_loss': 'weight_loss',
            'general_fitness': 'general_fitness',
          };

          await nutritionService.createNutritionGoal(user.id, {
            weight_kg: formData.weight,
            height_cm: formData.height,
            age: formData.age,
            gender: formData.gender as Gender,
            target_weight_kg: formData.target_weight_kg ?? undefined,
            target_date: formData.target_date ? new Date(formData.target_date) : undefined,
            training_goal: trainingGoalMap[formData.primary_goal] || 'general_fitness',
            pal_factor: formData.pal_factor,
            body_fat_percentage: formData.body_fat_percentage ?? undefined,
          });

          console.log('✅ Nutrition goals recalculated successfully');
        } catch (nutritionError: any) {
          console.warn('Failed to recalculate nutrition goals:', nutritionError);
          // Don't fail the whole save if nutrition calculation fails
        }
      }

      // Refresh the local profile cache so ProfileScreen shows updated data
      await profileSyncService.refreshProfile(user.id);
      console.log('✅ Profile cache refreshed');

      // Success
      setSuccessMessage('Profil erfolgreich gespeichert!');

      // Navigate back after delay
      setTimeout(() => {
        navigation.goBack();
      }, 1500);
    } catch (err: any) {
      setError(err.message || 'Fehler beim Speichern');
    } finally {
      setSaving(false);
    }
  };

  /**
   * Cancel editing and go back
   */
  const handleCancel = () => {
    navigation.goBack();
  };

  /**
   * Toggle intolerance selection
   */
  const toggleIntolerance = (intoleranceId: string) => {
    const exists = intolerances.find((i) => i.intolerance_id === intoleranceId);

    if (exists) {
      setIntolerances(
        intolerances.filter((i) => i.intolerance_id !== intoleranceId)
      );
    } else {
      setIntolerances([
        ...intolerances,
        { intolerance_id: intoleranceId, severity: 'moderate' },
      ]);
    }
  };

  /**
   * Update severity for a selected intolerance
   */
  const updateSeverity = (intoleranceId: string, severity: string) => {
    setIntolerances(
      intolerances.map((i) =>
        i.intolerance_id === intoleranceId
          ? { ...i, severity: severity as any }
          : i
      )
    );
  };

  // Loading state
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
      keyboardShouldPersistTaps="handled"
      removeClippedSubviews={false}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Profil bearbeiten</Text>
        <Text style={styles.subtitle}>
          Ändere deine Daten und speichere sie
        </Text>
      </View>

      {/* Profile Image Section */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Profilbild</Text>
        <View style={styles.imageSection}>
          <TouchableOpacity
            style={styles.imageContainer}
            onPress={handlePickImage}
            disabled={pickingImage || uploadingImage}
          >
            {uploadingImage ? (
              <View style={styles.placeholderImage}>
                <ActivityIndicator size="large" color="#007AFF" />
                <Text style={styles.uploadingText}>Wird hochgeladen...</Text>
              </View>
            ) : formData.profile_image_url ? (
              <Image
                source={{
                  uri: `${formData.profile_image_url}?t=${Date.now()}`,
                }}
                style={styles.profileImage}
                resizeMode="cover"
                onError={(error) => {
                  console.error('Image load error:', error.nativeEvent.error);
                  console.error('Image URL:', formData.profile_image_url);
                  setError('Bild konnte nicht geladen werden. URL: ' + formData.profile_image_url);
                }}
                onLoad={() => {
                  console.log('Image loaded successfully:', formData.profile_image_url);
                }}
              />
            ) : (
              <View style={styles.placeholderImage}>
                <Ionicons name="camera" size={32} color="#8E8E93" />
                <Text style={styles.placeholderText}>Bild auswählen</Text>
              </View>
            )}
          </TouchableOpacity>
          {formData.profile_image_url && !uploadingImage && (
            <TouchableOpacity
              style={styles.removeButton}
              onPress={async () => {
                // Delete from storage if it's a Supabase URL
                if (formData.profile_image_url && formData.profile_image_url.includes('supabase')) {
                  await deleteProfileImage(formData.profile_image_url);
                }
                updateField('profile_image_url', null);
              }}
            >
              <Text style={styles.removeButtonText}>Bild entfernen</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Section 1: Basisdaten */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Basisdaten</Text>

        <NumericInput
          label="Alter"
          value={formData.age}
          onValueChange={(value) => updateField('age', value)}
          keyboardType="number-pad"
          placeholder="z.B. 25"
        />

        <NumericInput
          label="Gewicht (kg)"
          value={formData.weight}
          onValueChange={(value) => updateField('weight', value)}
          keyboardType="decimal-pad"
          placeholder="z.B. 75.5"
        />

        <NumericInput
          label="Größe (cm)"
          value={formData.height}
          onValueChange={(value) => updateField('height', value)}
          keyboardType="decimal-pad"
          placeholder="z.B. 180"
        />

        <Text style={styles.label}>Geschlecht</Text>
        <RadioGroup
          options={[
            { label: 'Männlich', value: 'male' },
            { label: 'Weiblich', value: 'female' },
            { label: 'Andere', value: 'other' },
          ]}
          selected={formData.gender}
          onSelect={(value) => updateField('gender', value)}
        />
      </View>

      {/* Section 2: Training */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Training</Text>

        <Text style={styles.label}>Trainingslevel</Text>
        <View style={styles.buttonGroup}>
          <OptionButton
            label="Anfänger"
            selected={formData.fitness_level === 'beginner'}
            onPress={() => updateField('fitness_level', 'beginner')}
          />
          <OptionButton
            label="Fortgeschritten"
            selected={formData.fitness_level === 'intermediate'}
            onPress={() => updateField('fitness_level', 'intermediate')}
          />
          <OptionButton
            label="Experte"
            selected={formData.fitness_level === 'advanced'}
            onPress={() => updateField('fitness_level', 'advanced')}
          />
        </View>

        <NumericInput
          label="Trainingserfahrung (Monate)"
          value={formData.training_experience_months}
          onValueChange={(value) => updateField('training_experience_months', value)}
          keyboardType="number-pad"
          placeholder="z.B. 12"
        />

        <NumberPicker
          label="Trainingstage pro Woche"
          value={formData.available_training_days || 3}
          min={1}
          max={7}
          onChange={(value) => {
            updateField('available_training_days', value);
            // Reset preferred_training_days if count changes
            if (formData.preferred_training_days?.length !== value) {
              updateField('preferred_training_days', null);
            }
          }}
        />

        {formData.available_training_days && (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Bevorzugte Trainingstage</Text>
            <Text style={styles.sectionHint}>
              Wähle {formData.available_training_days}{' '}
              {formData.available_training_days === 1 ? 'Tag' : 'Tage'} aus
            </Text>
            <WeekdaySelector
              selectedDays={formData.preferred_training_days || []}
              onDaysChange={(days) => updateField('preferred_training_days', days)}
              maxDays={formData.available_training_days}
            />
          </View>
        )}

        <View style={styles.toggleRow}>
          <Text style={styles.label}>Gym-Zugang</Text>
          <Switch
            value={formData.has_gym_access}
            onValueChange={(value) => updateField('has_gym_access', value)}
          />
        </View>

        {!formData.has_gym_access && (
          <>
            <Text style={styles.label}>Equipment zu Hause</Text>
            <MultiSelectChips
              options={[
                'barbell',
                'dumbbells',
                'kettlebells',
                'resistance_bands',
                'pull_up_bar',
                'bench',
              ]}
              labels={{
                barbell: 'Langhantel',
                dumbbells: 'Kurzhanteln',
                kettlebells: 'Kettlebells',
                resistance_bands: 'Widerstandsbänder',
                pull_up_bar: 'Klimmzugstange',
                bench: 'Hantelbank',
              }}
              selected={formData.home_equipment}
              onSelectionChange={(selected) =>
                updateField('home_equipment', selected)
              }
            />
          </>
        )}
      </View>

      {/* Section 3: Ziele */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Trainingsziel</Text>

        {[
          { value: 'strength', label: 'Kraft aufbauen', icon: '💪' },
          { value: 'hypertrophy', label: 'Muskeln aufbauen', icon: '🏋️' },
          { value: 'weight_loss', label: 'Gewicht verlieren', icon: '🔥' },
          { value: 'endurance', label: 'Ausdauer', icon: '🏃' },
          { value: 'general_fitness', label: 'Allgemeine Fitness', icon: '✨' },
        ].map((goal) => (
          <GoalCard
            key={goal.value}
            label={goal.label}
            description=""
            icon={goal.icon}
            selected={formData.primary_goal === goal.value}
            onPress={() => updateField('primary_goal', goal.value)}
          />
        ))}
      </View>

      {/* Women-specific training fields */}
      {formData.gender === 'female' && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Spezifische Trainingsziele (Frauen)</Text>
          <Text style={styles.sectionHint}>
            Diese Ziele helfen uns, die besten Trainingspläne für dich zu finden
          </Text>

          <Text style={styles.label}>Mehrfachauswahl möglich:</Text>
          <MultiSelectChips
            options={['kraft', 'hypertrophie', 'bodyforming', 'fettabbau', 'abnehmen', 'general_fitness']}
            labels={{
              kraft: 'Kraft',
              hypertrophie: 'Hypertrophie',
              bodyforming: 'Bodyforming',
              fettabbau: 'Fettabbau',
              abnehmen: 'Abnehmen',
              general_fitness: 'Allgemeine Fitness',
            }}
            selected={formData.training_goals || []}
            onSelectionChange={(values: string[]) => updateField('training_goals', values)}
          />

          <NumberPicker
            label="Cardio pro Woche (Einheiten)"
            value={formData.cardio_per_week ?? 0}
            min={0}
            max={7}
            onChange={(value) => updateField('cardio_per_week', value)}
          />

          <Text style={styles.label}>Trainingsort</Text>
          <View style={styles.buttonGroup}>
            <OptionButton
              label="Gym"
              selected={formData.training_location === 'gym'}
              onPress={() => updateField('training_location', 'gym')}
            />
            <OptionButton
              label="Zuhause"
              selected={formData.training_location === 'home'}
              onPress={() => updateField('training_location', 'home')}
            />
            <OptionButton
              label="Beides"
              selected={formData.training_location === 'both'}
              onPress={() => updateField('training_location', 'both')}
            />
          </View>

          <Text style={styles.label}>Belastungspräferenz</Text>
          <View style={styles.buttonGroup}>
            <OptionButton
              label="Low Impact"
              selected={formData.load_preference === 'low_impact'}
              onPress={() => updateField('load_preference', 'low_impact')}
            />
            <OptionButton
              label="Normal"
              selected={formData.load_preference === 'normal'}
              onPress={() => updateField('load_preference', 'normal')}
            />
            <OptionButton
              label="High Intensity"
              selected={formData.load_preference === 'high_intensity'}
              onPress={() => updateField('load_preference', 'high_intensity')}
            />
          </View>

          <Text style={styles.label}>Split-Präferenz</Text>
          <View style={styles.buttonGroup}>
            <OptionButton
              label="Ganzkörper"
              selected={formData.split_preference === 'full_body'}
              onPress={() => updateField('split_preference', 'full_body')}
            />
            <OptionButton
              label="OK/UK"
              selected={formData.split_preference === 'upper_lower'}
              onPress={() => updateField('split_preference', 'upper_lower')}
            />
            <OptionButton
              label="Push/Pull"
              selected={formData.split_preference === 'push_pull'}
              onPress={() => updateField('split_preference', 'push_pull')}
            />
            <OptionButton
              label="Keine Präferenz"
              selected={formData.split_preference === 'no_preference'}
              onPress={() => updateField('split_preference', 'no_preference')}
            />
          </View>
        </View>
      )}

      {/* Section 4: Lifestyle */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Lifestyle</Text>

        <Slider
          label="Durchschnittliche Schlafstunden"
          value={formData.sleep_hours_avg || 7}
          minimumValue={3}
          maximumValue={12}
          step={0.5}
          formatValue={(val) => `${val.toFixed(1)} Stunden`}
          minimumLabel="3h"
          maximumLabel="12h"
          onValueChange={(value) => updateField('sleep_hours_avg', value)}
        />

        <Slider
          label="Stress-Level"
          value={formData.stress_level || 5}
          minimumValue={1}
          maximumValue={10}
          step={1}
          formatValue={(val) => `${val} / 10`}
          minimumLabel="Niedrig"
          maximumLabel="Hoch"
          onValueChange={(value) => updateField('stress_level', value)}
        />
      </View>

      {/* Section 5: Ernährungsziele */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Ernährungsziele</Text>
        <Text style={styles.sectionHint}>
          Diese Daten werden für die Berechnung deiner Kalorienziele verwendet
        </Text>

        <Text style={styles.label}>Aktivitätslevel (PAL-Faktor)</Text>
        <Text style={styles.sectionHint}>
          Wie aktiv bist du im Alltag und beim Training?
        </Text>
        <View style={styles.buttonGroup}>
          <OptionButton
            label="Sedentär (1.2)"
            selected={formData.pal_factor === 1.2}
            onPress={() => updateField('pal_factor', 1.2)}
          />
          <OptionButton
            label="Leicht aktiv (1.375)"
            selected={formData.pal_factor === 1.375}
            onPress={() => updateField('pal_factor', 1.375)}
          />
        </View>
        <View style={styles.buttonGroup}>
          <OptionButton
            label="Moderat aktiv (1.55)"
            selected={formData.pal_factor === 1.55}
            onPress={() => updateField('pal_factor', 1.55)}
          />
          <OptionButton
            label="Sehr aktiv (1.725)"
            selected={formData.pal_factor === 1.725}
            onPress={() => updateField('pal_factor', 1.725)}
          />
        </View>
        <View style={styles.buttonGroup}>
          <OptionButton
            label="Extrem aktiv (1.9)"
            selected={formData.pal_factor === 1.9}
            onPress={() => updateField('pal_factor', 1.9)}
          />
        </View>

        <NumericInput
          label="Zielgewicht (kg) - Optional"
          value={formData.target_weight_kg}
          onValueChange={(value) => updateField('target_weight_kg', value)}
          keyboardType="decimal-pad"
          placeholder="z.B. 70"
        />

        <Text style={styles.label}>Zieldatum - Optional</Text>
        <TouchableOpacity
          style={styles.dateInput}
          onPress={() => {
            // TODO: Implement date picker
            Alert.alert('Info', 'Datumswahl wird in Kürze verfügbar sein');
          }}
        >
          <Text style={formData.target_date ? styles.dateText : styles.datePlaceholder}>
            {formData.target_date
              ? new Date(formData.target_date).toLocaleDateString('de-DE')
              : 'Zieldatum auswählen'}
          </Text>
          <Ionicons name="calendar-outline" size={20} color="#8E8E93" />
        </TouchableOpacity>
        {formData.target_date && (
          <TouchableOpacity
            onPress={() => updateField('target_date', null)}
            style={styles.clearDateButton}
          >
            <Text style={styles.clearDateText}>Datum löschen</Text>
          </TouchableOpacity>
        )}

        <NumericInput
          label="Körperfettanteil (%) - Optional"
          value={formData.body_fat_percentage}
          onValueChange={(value) => updateField('body_fat_percentage', value)}
          keyboardType="decimal-pad"
          placeholder="z.B. 15"
        />
      </View>

      {/* Section 6: Gesundheitsdaten (Supplements) */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Gesundheitsdaten (Supplements)</Text>
        <Text style={styles.sectionHint}>
          Diese Daten helfen bei der Supplement-Empfehlung
        </Text>

        {/* GI Issues */}
        <Text style={styles.label}>Magen-Darm-Beschwerden</Text>
        <MultiSelectChips
          options={['bloating', 'irritable_bowel', 'diarrhea', 'constipation']}
          labels={{
            bloating: 'Blähungen',
            irritable_bowel: 'Reizdarm',
            diarrhea: 'Durchfall',
            constipation: 'Verstopfung',
          }}
          selected={formData.gi_issues}
          onSelectionChange={(values: string[]) => updateField('gi_issues', values)}
        />

        {/* Hydration/Sweating */}
        <View style={styles.toggleRow}>
          <Text style={styles.label}>Starkes Schwitzen</Text>
          <Switch
            value={formData.heavy_sweating}
            onValueChange={(value) => updateField('heavy_sweating', value)}
          />
        </View>

        <View style={styles.toggleRow}>
          <Text style={styles.label}>Hohe Salzaufnahme</Text>
          <Switch
            value={formData.high_salt_intake}
            onValueChange={(value) => updateField('high_salt_intake', value)}
          />
        </View>

        {/* Joint Issues */}
        <Text style={styles.label}>Gelenkbeschwerden</Text>
        <MultiSelectChips
          options={['knee', 'tendons', 'shoulder', 'back']}
          labels={{
            knee: 'Knie',
            tendons: 'Sehnen',
            shoulder: 'Schulter',
            back: 'Rücken',
          }}
          selected={formData.joint_issues}
          onSelectionChange={(values: string[]) => updateField('joint_issues', values)}
        />

        {/* Lab Values */}
        <Text style={styles.label}>Laborwerte (Optional)</Text>
        <Text style={styles.sectionHint}>
          Falls vorhanden, trage hier deine letzten Blutwerte ein
        </Text>

        <NumericInput
          label="Hämoglobin (g/dL)"
          value={formData.lab_values?.hemoglobin ?? null}
          onValueChange={(value) => updateField('lab_values', { ...formData.lab_values, hemoglobin: value })}
          keyboardType="decimal-pad"
          placeholder="z.B. 14.5"
        />

        <NumericInput
          label="MCV (fL)"
          value={formData.lab_values?.mcv ?? null}
          onValueChange={(value) => updateField('lab_values', { ...formData.lab_values, mcv: value })}
          keyboardType="decimal-pad"
          placeholder="z.B. 90"
        />

        <NumericInput
          label="Vitamin D (ng/mL)"
          value={formData.lab_values?.vitamin_d ?? null}
          onValueChange={(value) => updateField('lab_values', { ...formData.lab_values, vitamin_d: value })}
          keyboardType="decimal-pad"
          placeholder="z.B. 40"
        />

        <NumericInput
          label="CRP (mg/L)"
          value={formData.lab_values?.crp ?? null}
          onValueChange={(value) => updateField('lab_values', { ...formData.lab_values, crp: value })}
          keyboardType="decimal-pad"
          placeholder="z.B. 0.5"
        />

        <NumericInput
          label="ALT/GPT (U/L)"
          value={formData.lab_values?.alt ?? null}
          onValueChange={(value) => updateField('lab_values', { ...formData.lab_values, alt: value })}
          keyboardType="decimal-pad"
          placeholder="z.B. 25"
        />

        <NumericInput
          label="GGT (U/L)"
          value={formData.lab_values?.ggt ?? null}
          onValueChange={(value) => updateField('lab_values', { ...formData.lab_values, ggt: value })}
          keyboardType="decimal-pad"
          placeholder="z.B. 30"
        />

        <NumericInput
          label="Estradiol (pg/mL)"
          value={formData.lab_values?.estradiol ?? null}
          onValueChange={(value) => updateField('lab_values', { ...formData.lab_values, estradiol: value })}
          keyboardType="decimal-pad"
          placeholder="z.B. 50"
        />

        <NumericInput
          label="Testosteron gesamt (ng/mL)"
          value={formData.lab_values?.testosterone ?? null}
          onValueChange={(value) => updateField('lab_values', { ...formData.lab_values, testosterone: value })}
          keyboardType="decimal-pad"
          placeholder="z.B. 5.0"
        />
      </View>

      {/* Section 7: Unverträglichkeiten */}
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
                  {['mild', 'moderate', 'severe', 'life_threatening'].map(
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

/**
 * Helper: Convert severity code to German label
 */
const getSeverityLabel = (severity: string): string => {
  const labels: Record<string, string> = {
    mild: 'Leicht',
    moderate: 'Moderat',
    severe: 'Schwer',
    life_threatening: 'Lebensbedrohlich',
  };
  return labels[severity] || severity;
};

// Styles
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  contentContainer: {
    padding: 24,
    paddingBottom: 48,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#8E8E93',
  },
  header: {
    marginBottom: 32,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#000000',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#8E8E93',
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 16,
  },
  sectionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 8,
  },
  sectionHint: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#000000',
    marginBottom: 8,
    marginTop: 16,
  },
  buttonGroup: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginVertical: 16,
  },
  intoleranceItem: {
    marginBottom: 16,
  },
  intoleranceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#F2F2F7',
    borderRadius: 8,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: '#007AFF',
    borderRadius: 4,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmark: {
    color: '#007AFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  intoleranceInfo: {
    flex: 1,
  },
  intoleranceName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000000',
  },
  intoleranceDescription: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 2,
  },
  severityPicker: {
    marginTop: 8,
    marginLeft: 36,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  severityLabel: {
    fontSize: 14,
    color: '#8E8E93',
  },
  severityOption: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderWidth: 1,
    borderColor: '#C6C6C8',
    borderRadius: 4,
  },
  severityOptionSelected: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  severityText: {
    fontSize: 12,
    color: '#000000',
  },
  severityTextSelected: {
    color: '#FFFFFF',
  },
  errorContainer: {
    backgroundColor: '#FFEBEE',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  errorText: {
    color: '#FF3B30',
    fontSize: 14,
    textAlign: 'center',
  },
  successContainer: {
    backgroundColor: '#E8F5E9',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  successText: {
    color: '#34C759',
    fontSize: 14,
    textAlign: 'center',
    fontWeight: '600',
  },
  buttonContainer: {
    gap: 12,
    marginTop: 24,
  },
  saveButton: {
    backgroundColor: '#007AFF',
  },
  cancelButton: {
    backgroundColor: 'transparent',
  },
  imageSection: {
    marginBottom: 16,
  },
  imageContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  profileImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#F2F2F7',
  },
  placeholderImage: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#F2F2F7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 8,
  },
  uploadingText: {
    fontSize: 14,
    color: '#8E8E93',
    marginTop: 8,
  },
  removeButton: {
    marginTop: 12,
    alignSelf: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  removeButtonText: {
    fontSize: 14,
    color: '#FF3B30',
    fontWeight: '500',
  },
  dateInput: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  dateText: {
    fontSize: 16,
    color: '#000000',
  },
  datePlaceholder: {
    fontSize: 16,
    color: '#8E8E93',
  },
  clearDateButton: {
    marginTop: -8,
    marginBottom: 16,
    alignSelf: 'flex-start',
  },
  clearDateText: {
    fontSize: 14,
    color: '#FF3B30',
    fontWeight: '500',
  },
});
