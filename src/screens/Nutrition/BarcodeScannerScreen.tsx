/**
 * Barcode Scanner Screen
 *
 * Scans food product barcodes using the device camera.
 * Works with both Expo Go and Development Builds.
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Vibration,
  Dimensions,
  Platform,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import type { NutritionStackParamList } from '../../navigation/NutritionStackNavigator';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, BORDER_RADIUS } from '../../components/ui/theme';
import { foodService } from '../../services/FoodService';
import * as Haptics from 'expo-haptics';

// Dynamischer Import für expo-camera (funktioniert nur in Dev Builds)
let CameraView: any;
let useCameraPermissions: any;

try {
  const camera = require('expo-camera');
  CameraView = camera.CameraView;
  useCameraPermissions = camera.useCameraPermissions;
} catch (e) {
  // Expo Go - Camera nicht verfügbar
  console.log('expo-camera not available, using fallback mode');
}

type NavigationProp = NativeStackNavigationProp<
  NutritionStackParamList,
  'BarcodeScanner'
>;

type BarcodeScannerRouteProp = RouteProp<NutritionStackParamList, 'BarcodeScanner'>;

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const SCAN_AREA_SIZE = SCREEN_WIDTH * 0.7;

const IS_EXPO_GO = !CameraView; // Erkennt ob in Expo Go

export function BarcodeScannerScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<BarcodeScannerRouteProp>();
  const { mealType } = route.params || {};

  // Fallback Mode (Expo Go) - Manuelle Barcode-Eingabe
  const [manualBarcode, setManualBarcode] = useState('');
  const [loading, setLoading] = useState(false);

  // Camera Mode (Development Build)
  const [permission, requestPermission] = useCameraPermissions ? useCameraPermissions() : [null, () => {}];
  const [scanned, setScanned] = useState(false);
  const [flashEnabled, setFlashEnabled] = useState(false);

  // Request camera permission on mount if available
  useEffect(() => {
    if (!IS_EXPO_GO && permission && !permission.granted && permission.canAskAgain) {
      requestPermission();
    }
  }, [permission, requestPermission]);

  // Handle barcode lookup (common function)
  const lookupBarcode = async (barcode: string) => {
    if (!barcode || barcode.trim().length === 0) {
      Alert.alert('Fehler', 'Bitte gib einen gültigen Barcode ein.');
      return;
    }

    setLoading(true);

    // Haptic feedback
    try {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    } catch (error) {
      Vibration.vibrate(100);
    }

    console.log(`Looking up barcode: ${barcode}`);

    try {
      const food = await foodService.getFoodByBarcode(barcode.trim());

      if (food) {
        console.log(`Found food: ${food.name}`);
        navigation.replace('FoodDetail', { food, mealType });
      } else {
        Alert.alert(
          'Produkt nicht gefunden',
          `Der Barcode "${barcode}" wurde nicht in der Datenbank gefunden. Möchtest du manuell suchen?`,
          [
            {
              text: 'Abbrechen',
              style: 'cancel',
              onPress: () => {
                setScanned(false);
                setLoading(false);
                setManualBarcode('');
              },
            },
            {
              text: 'Suchen',
              onPress: () => {
                navigation.replace('FoodSearch', { mealType });
              },
            },
          ]
        );
      }
    } catch (error) {
      console.error('Error looking up barcode:', error);

      Alert.alert(
        'Fehler',
        'Es gab ein Problem beim Laden des Produkts. Bitte versuche es erneut.',
        [
          {
            text: 'OK',
            onPress: () => {
              setScanned(false);
              setLoading(false);
              setManualBarcode('');
            },
          },
        ]
      );
    }
  };

  // Handle camera barcode scan
  const handleBarCodeScanned = async ({ data }: any) => {
    if (scanned || loading) return;
    setScanned(true);
    await lookupBarcode(data);
  };

  // Handle manual barcode submission
  const handleManualSubmit = async () => {
    await lookupBarcode(manualBarcode);
  };

  // Toggle flashlight
  const toggleFlash = () => {
    setFlashEnabled((prev) => !prev);
  };

  // EXPO GO MODE - Manual Barcode Entry
  if (IS_EXPO_GO) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="close" size={28} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Barcode eingeben</Text>
          <View style={{ width: 28 }} />
        </View>

        <View style={styles.manualContent}>
          <Ionicons name="barcode-outline" size={100} color={COLORS.primary} />

          <Text style={styles.manualTitle}>Barcode-Scanner</Text>
          <Text style={styles.manualSubtitle}>
            Kamera-Scanner ist nur im Development Build verfügbar
          </Text>

          <View style={styles.manualInputContainer}>
            <Text style={styles.inputLabel}>Barcode manuell eingeben:</Text>
            <TextInput
              style={styles.manualInput}
              placeholder="z.B. 5449000000996"
              placeholderTextColor={COLORS.textSecondary}
              value={manualBarcode}
              onChangeText={setManualBarcode}
              keyboardType="number-pad"
              autoFocus
              returnKeyType="search"
              onSubmitEditing={handleManualSubmit}
            />

            <TouchableOpacity
              style={[
                styles.searchButton,
                !manualBarcode.trim() && styles.searchButtonDisabled,
              ]}
              onPress={handleManualSubmit}
              disabled={!manualBarcode.trim() || loading}
            >
              {loading ? (
                <ActivityIndicator color={COLORS.white} />
              ) : (
                <>
                  <Ionicons name="search" size={20} color={COLORS.white} />
                  <Text style={styles.searchButtonText}>Suchen</Text>
                </>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.infoBox}>
            <Ionicons name="information-circle-outline" size={20} color={COLORS.primary} />
            <Text style={styles.infoText}>
              Der Barcode befindet sich meist unter dem Strichcode auf der Verpackung
            </Text>
          </View>

          <TouchableOpacity
            style={styles.alternativeButton}
            onPress={() => navigation.replace('FoodSearch', { mealType })}
          >
            <Text style={styles.alternativeButtonText}>
              Oder manuell suchen
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // CAMERA MODE - Development Build

  // Permission not determined yet
  if (!permission) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContent}>
          <ActivityIndicator size="large" color={COLORS.primary} />
          <Text style={styles.loadingText}>Kamera wird vorbereitet...</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Permission denied
  if (!permission.granted) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.centerContent}>
          <Ionicons name="camera-outline" size={80} color={COLORS.textSecondary} />
          <Text style={styles.errorTitle}>Kamera-Zugriff erforderlich</Text>
          <Text style={styles.errorMessage}>
            Bitte erlaube den Zugriff auf die Kamera in den Einstellungen, um Barcodes scannen zu können.
          </Text>
          <TouchableOpacity
            style={styles.button}
            onPress={() => {
              if (permission.canAskAgain) {
                requestPermission();
              } else {
                navigation.goBack();
              }
            }}
          >
            <Text style={styles.buttonText}>
              {permission.canAskAgain ? 'Berechtigung erteilen' : 'Zurück'}
            </Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.container}>
      {/* Camera View */}
      <CameraView
        style={StyleSheet.absoluteFillObject}
        facing="back"
        enableTorch={flashEnabled}
        barcodeScannerSettings={{
          barcodeTypes: [
            'ean13',
            'ean8',
            'upc_a',
            'upc_e',
            'code128',
            'code39',
          ],
        }}
        onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
      />

      {/* Overlay */}
      <SafeAreaView style={styles.overlay} edges={['top', 'bottom']}>
        {/* Top Bar */}
        <View style={styles.topBar}>
          <TouchableOpacity
            style={styles.topButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="close" size={28} color={COLORS.white} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.topButton} onPress={toggleFlash}>
            <Ionicons
              name={flashEnabled ? 'flash' : 'flash-off'}
              size={28}
              color={COLORS.white}
            />
          </TouchableOpacity>
        </View>

        {/* Scan Area */}
        <View style={styles.scanAreaContainer}>
          <View style={styles.scanArea}>
            {/* Corner Brackets */}
            <View style={[styles.corner, styles.cornerTopLeft]} />
            <View style={[styles.corner, styles.cornerTopRight]} />
            <View style={[styles.corner, styles.cornerBottomLeft]} />
            <View style={[styles.corner, styles.cornerBottomRight]} />

            {/* Scanning Line Animation */}
            {!scanned && !loading && (
              <View style={styles.scanLine} />
            )}
          </View>

          {/* Instructions */}
          <Text style={styles.instructionText}>
            Halte den Barcode innerhalb des Rahmens
          </Text>
        </View>

        {/* Loading Indicator */}
        {loading && (
          <View style={styles.loadingOverlay}>
            <View style={styles.loadingCard}>
              <ActivityIndicator size="large" color={COLORS.primary} />
              <Text style={styles.loadingCardText}>Produkt wird geladen...</Text>
            </View>
          </View>
        )}

        {/* Bottom Info */}
        <View style={styles.bottomBar}>
          <View style={styles.infoCard}>
            <Ionicons name="information-circle-outline" size={20} color={COLORS.primary} />
            <Text style={styles.infoText}>
              Funktioniert mit EAN-13, UPC-A und anderen gängigen Barcodes
            </Text>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.background,
  },

  // Header (Manual Mode)
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  closeButton: {
    padding: SPACING.sm,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: COLORS.text,
  },

  // Manual Mode
  manualContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.xl,
  },
  manualTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
    marginTop: SPACING.xl,
    marginBottom: SPACING.sm,
  },
  manualSubtitle: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.xxl,
  },
  manualInputContainer: {
    width: '100%',
    maxWidth: 400,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: COLORS.text,
    marginBottom: SPACING.sm,
  },
  manualInput: {
    backgroundColor: COLORS.white,
    borderWidth: 2,
    borderColor: COLORS.primary,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.lg,
    fontSize: 18,
    color: COLORS.text,
    textAlign: 'center',
    marginBottom: SPACING.lg,
  },
  searchButton: {
    flexDirection: 'row',
    backgroundColor: COLORS.primary,
    paddingVertical: SPACING.lg,
    paddingHorizontal: SPACING.xl,
    borderRadius: BORDER_RADIUS.md,
    alignItems: 'center',
    justifyContent: 'center',
    gap: SPACING.sm,
  },
  searchButtonDisabled: {
    backgroundColor: COLORS.textSecondary,
    opacity: 0.5,
  },
  searchButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },
  infoBox: {
    flexDirection: 'row',
    backgroundColor: '#F0F7FF',
    padding: SPACING.lg,
    borderRadius: BORDER_RADIUS.md,
    gap: SPACING.sm,
    marginTop: SPACING.xxl,
    alignItems: 'flex-start',
  },
  alternativeButton: {
    marginTop: SPACING.xl,
    padding: SPACING.md,
  },
  alternativeButtonText: {
    color: COLORS.primary,
    fontSize: 16,
    fontWeight: '500',
    textDecorationLine: 'underline',
  },

  // Camera Mode
  centerContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.xl,
  },
  loadingText: {
    marginTop: SPACING.md,
    fontSize: 16,
    color: COLORS.textSecondary,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
    marginTop: SPACING.xl,
    marginBottom: SPACING.sm,
    textAlign: 'center',
  },
  errorMessage: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
    marginBottom: SPACING.xl,
    paddingHorizontal: SPACING.xl,
    lineHeight: 24,
  },
  button: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
  },
  buttonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },

  // Overlay
  overlay: {
    flex: 1,
    backgroundColor: 'transparent',
  },

  // Top Bar
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: SPACING.lg,
  },
  topButton: {
    width: 48,
    height: 48,
    borderRadius: BORDER_RADIUS.full,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Scan Area
  scanAreaContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanArea: {
    width: SCAN_AREA_SIZE,
    height: SCAN_AREA_SIZE * 0.6,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderColor: COLORS.white,
  },
  cornerTopLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderTopLeftRadius: BORDER_RADIUS.md,
  },
  cornerTopRight: {
    top: 0,
    right: 0,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderTopRightRadius: BORDER_RADIUS.md,
  },
  cornerBottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderBottomLeftRadius: BORDER_RADIUS.md,
  },
  cornerBottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderBottomRightRadius: BORDER_RADIUS.md,
  },
  scanLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: COLORS.primary,
    top: '50%',
    shadowColor: COLORS.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
  },
  instructionText: {
    marginTop: SPACING.xl,
    fontSize: 16,
    color: COLORS.white,
    textAlign: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
  },

  // Loading Overlay
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingCard: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.xxl,
    alignItems: 'center',
    minWidth: 200,
  },
  loadingCardText: {
    marginTop: SPACING.md,
    fontSize: 16,
    color: COLORS.text,
    fontWeight: '500',
  },

  // Bottom Bar
  bottomBar: {
    padding: SPACING.lg,
  },
  infoCard: {
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    gap: SPACING.sm,
    alignItems: 'center',
  },
  infoText: {
    flex: 1,
    fontSize: 13,
    color: COLORS.text,
    lineHeight: 18,
  },
});
