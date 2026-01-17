/**
 * Create Food Screen
 *
 * Allows users to create custom food items that are stored locally only.
 * Similar layout to FoodDetailScreen but with editable fields.
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { RouteProp } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { NutritionStackParamList } from '../../navigation/NutritionStackNavigator';
import {
  COLORS,
  SPACING,
  BORDER_RADIUS,
  SHADOWS,
} from '../../components/ui/theme';
import { Ionicons } from '@expo/vector-icons';
import { customFoodCache, CustomFoodCache } from '../../services/cache/CustomFoodCache';

type NavigationProp = NativeStackNavigationProp<NutritionStackParamList, 'CreateFood'>;
type CreateFoodRouteProp = RouteProp<NutritionStackParamList, 'CreateFood'>;

export function CreateFoodScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<CreateFoodRouteProp>();
  const { mealType } = route.params || {};

  // Form state
  const [name, setName] = useState('');
  const [brand, setBrand] = useState('');
  const [calories, setCalories] = useState('');
  const [protein, setProtein] = useState('');
  const [carbs, setCarbs] = useState('');
  const [fat, setFat] = useState('');
  const [sugar, setSugar] = useState('');
  const [fiber, setFiber] = useState('');
  const [servingSize, setServingSize] = useState('100');

  const [saving, setSaving] = useState(false);

  // Validation
  const isValid = name.trim().length > 0 && calories.trim().length > 0 && parseFloat(calories) >= 0;

  const handleSave = async () => {
    if (!isValid) {
      Alert.alert('Fehler', 'Bitte gib mindestens einen Namen und die Kalorien an.');
      return;
    }

    try {
      setSaving(true);

      const customFood = await customFoodCache.createCustomFood({
        name: name.trim(),
        brand: brand.trim() || undefined,
        calories: parseFloat(calories) || 0,
        protein: protein ? parseFloat(protein) : undefined,
        carbs: carbs ? parseFloat(carbs) : undefined,
        fat: fat ? parseFloat(fat) : undefined,
        sugar: sugar ? parseFloat(sugar) : undefined,
        fiber: fiber ? parseFloat(fiber) : undefined,
        serving_size: parseFloat(servingSize) || 100,
        serving_unit: 'g',
      });

      // Convert to FoodItem and navigate to FoodDetail
      const foodItem = CustomFoodCache.toFoodItem(customFood);

      Alert.alert(
        'Erfolgreich',
        `"${customFood.name}" wurde erstellt!`,
        [
          {
            text: 'Zum Tagebuch hinzufugen',
            onPress: () => {
              navigation.replace('FoodDetail', { food: foodItem, mealType });
            },
          },
          {
            text: 'Fertig',
            onPress: () => navigation.goBack(),
            style: 'cancel',
          },
        ]
      );
    } catch (error) {
      console.error('Error creating custom food:', error);
      Alert.alert('Fehler', 'Das Lebensmittel konnte nicht erstellt werden.');
    } finally {
      setSaving(false);
    }
  };

  const renderInputField = (
    label: string,
    value: string,
    onChangeText: (text: string) => void,
    options: {
      placeholder?: string;
      keyboardType?: 'default' | 'numeric';
      unit?: string;
      required?: boolean;
    } = {}
  ) => {
    const { placeholder = '', keyboardType = 'default', unit, required } = options;

    return (
      <View style={styles.inputRow}>
        <View style={styles.inputLabelContainer}>
          <Text style={styles.inputLabel}>{label}</Text>
          {required && <Text style={styles.requiredIndicator}>*</Text>}
        </View>
        <View style={styles.inputWrapper}>
          <TextInput
            style={[styles.input, unit && styles.inputWithUnit]}
            value={value}
            onChangeText={onChangeText}
            placeholder={placeholder}
            placeholderTextColor={COLORS.textTertiary}
            keyboardType={keyboardType}
          />
          {unit && <Text style={styles.inputUnit}>{unit}</Text>}
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header Info */}
          <View style={styles.infoCard}>
            <Ionicons name="information-circle-outline" size={24} color={COLORS.primary} />
            <Text style={styles.infoText}>
              Erstelle ein eigenes Lebensmittel. Dieses wird nur lokal auf deinem Gerat gespeichert.
            </Text>
          </View>

          {/* Basic Info Section */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Grundinformationen</Text>

            {renderInputField('Name', name, setName, {
              placeholder: 'z.B. Omas Apfelkuchen',
              required: true,
            })}

            {renderInputField('Marke (optional)', brand, setBrand, {
              placeholder: 'z.B. Selbstgemacht',
            })}

            {renderInputField('Portionsgrose', servingSize, setServingSize, {
              placeholder: '100',
              keyboardType: 'numeric',
              unit: 'g',
            })}
          </View>

          {/* Nutrition Section */}
          <View style={styles.sectionCard}>
            <Text style={styles.sectionTitle}>Nahrwerte (pro 100g)</Text>

            <View style={[styles.inputRow, styles.highlightedRow]}>
              <View style={styles.inputLabelContainer}>
                <Text style={[styles.inputLabel, styles.calorieLabel]}>Kalorien</Text>
                <Text style={styles.requiredIndicator}>*</Text>
              </View>
              <View style={styles.inputWrapper}>
                <TextInput
                  style={[styles.input, styles.inputWithUnit, styles.calorieInput]}
                  value={calories}
                  onChangeText={setCalories}
                  placeholder="0"
                  placeholderTextColor={COLORS.textTertiary}
                  keyboardType="numeric"
                />
                <Text style={[styles.inputUnit, styles.calorieUnit]}>kcal</Text>
              </View>
            </View>

            {renderInputField('Eiweiss', protein, setProtein, {
              placeholder: '0',
              keyboardType: 'numeric',
              unit: 'g',
            })}

            {renderInputField('Kohlenhydrate', carbs, setCarbs, {
              placeholder: '0',
              keyboardType: 'numeric',
              unit: 'g',
            })}

            {renderInputField('davon Zucker', sugar, setSugar, {
              placeholder: '0',
              keyboardType: 'numeric',
              unit: 'g',
            })}

            {renderInputField('Fett', fat, setFat, {
              placeholder: '0',
              keyboardType: 'numeric',
              unit: 'g',
            })}

            {renderInputField('Ballaststoffe', fiber, setFiber, {
              placeholder: '0',
              keyboardType: 'numeric',
              unit: 'g',
            })}
          </View>

          {/* Required Fields Note */}
          <Text style={styles.requiredNote}>
            * Pflichtfelder
          </Text>
        </ScrollView>

        {/* Save Button */}
        <View style={styles.footer}>
          <TouchableOpacity
            style={[
              styles.saveButton,
              !isValid && styles.saveButtonDisabled,
              saving && styles.saveButtonDisabled,
            ]}
            onPress={handleSave}
            disabled={!isValid || saving}
          >
            {saving ? (
              <ActivityIndicator size="small" color={COLORS.white} />
            ) : (
              <Ionicons name="checkmark-circle" size={24} color={COLORS.white} />
            )}
            <Text style={styles.saveButtonText}>
              {saving ? 'Wird gespeichert...' : 'Lebensmittel erstellen'}
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },
  keyboardView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: SPACING.lg,
    paddingBottom: 100,
  },

  // Info Card
  infoCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.primaryLight || '#E3F2FD',
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    gap: SPACING.md,
    alignItems: 'flex-start',
  },
  infoText: {
    flex: 1,
    fontSize: 14,
    color: COLORS.text,
    lineHeight: 20,
  },

  // Section Card
  sectionCard: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    ...SHADOWS.sm,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.lg,
  },

  // Input Fields
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: SPACING.md,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  highlightedRow: {
    backgroundColor: COLORS.surfaceSecondary,
    marginHorizontal: -SPACING.lg,
    paddingHorizontal: SPACING.lg,
    borderBottomWidth: 0,
    borderRadius: BORDER_RADIUS.sm,
    marginBottom: SPACING.sm,
  },
  inputLabelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  inputLabel: {
    fontSize: 16,
    color: COLORS.text,
  },
  calorieLabel: {
    fontWeight: '600',
  },
  requiredIndicator: {
    color: COLORS.error,
    fontSize: 16,
    marginLeft: 4,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    justifyContent: 'flex-end',
  },
  input: {
    fontSize: 16,
    fontWeight: '500',
    color: COLORS.text,
    textAlign: 'right',
    minWidth: 80,
    padding: SPACING.sm,
    backgroundColor: COLORS.surfaceSecondary,
    borderRadius: BORDER_RADIUS.sm,
  },
  inputWithUnit: {
    marginRight: SPACING.xs,
  },
  calorieInput: {
    fontWeight: '700',
    fontSize: 18,
  },
  inputUnit: {
    fontSize: 14,
    color: COLORS.textSecondary,
    minWidth: 30,
  },
  calorieUnit: {
    fontWeight: '600',
    color: COLORS.success,
  },

  // Required Note
  requiredNote: {
    fontSize: 12,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginTop: SPACING.sm,
  },

  // Footer
  footer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: SPACING.lg,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
    backgroundColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.md,
    paddingVertical: SPACING.lg,
    ...SHADOWS.sm,
  },
  saveButtonDisabled: {
    backgroundColor: COLORS.textTertiary,
    opacity: 0.6,
  },
  saveButtonText: {
    color: COLORS.white,
    fontSize: 18,
    fontWeight: '600',
  },
});
