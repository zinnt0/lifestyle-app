/**
 * Nutrition Label Scanner Screen
 *
 * Provides a camera view with a focus frame for scanning nutrition labels.
 * Uses ML Kit for text recognition (Development Build only).
 */

import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Dimensions,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RouteProp } from '@react-navigation/native';
import type { NutritionStackParamList } from '../../navigation/NutritionStackNavigator';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SPACING, BORDER_RADIUS } from '../../components/ui/theme';
import * as Haptics from 'expo-haptics';
import {
  isOCRAvailable,
  recognizeNutritionLabel,
} from '../../services/NutritionOCRService';

// Dynamic import for expo-camera
let CameraView: any;
let useCameraPermissions: any;

try {
  const camera = require('expo-camera');
  CameraView = camera.CameraView;
  useCameraPermissions = camera.useCameraPermissions;
} catch (e) {
  console.log('expo-camera not available');
}

type NavigationProp = NativeStackNavigationProp<NutritionStackParamList, 'NutritionLabelScanner'>;
type ScannerRouteProp = RouteProp<NutritionStackParamList, 'NutritionLabelScanner'>;

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
// Scan area optimized for nutrition label format (wider than tall)
const SCAN_AREA_WIDTH = SCREEN_WIDTH * 0.85;
const SCAN_AREA_HEIGHT = SCREEN_WIDTH * 0.65;

const IS_CAMERA_AVAILABLE = !!CameraView;

export function NutritionLabelScannerScreen() {
  const navigation = useNavigation<NavigationProp>();
  const route = useRoute<ScannerRouteProp>();
  const { mealType } = route.params || {};

  const cameraRef = useRef<any>(null);
  const [permission, requestPermission] = useCameraPermissions ? useCameraPermissions() : [null, () => {}];
  const [flashEnabled, setFlashEnabled] = useState(false);
  const [capturing, setCapturing] = useState(false);
  const [processing, setProcessing] = useState(false);

  // Request camera permission on mount
  useEffect(() => {
    if (IS_CAMERA_AVAILABLE && permission && !permission.granted && permission.canAskAgain) {
      requestPermission();
    }
  }, [permission, requestPermission]);

  const handleCapture = async () => {
    if (!cameraRef.current || capturing || processing) return;

    setCapturing(true);
    console.log('[Scanner] Starting capture...');

    try {
      // Haptic feedback
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      // Take photo with high quality
      console.log('[Scanner] Taking picture...');
      const photo = await cameraRef.current.takePictureAsync({
        quality: 1, // Max quality
        skipProcessing: false, // Allow processing for better quality
        exif: false, // Don't include EXIF data (faster)
      });

      console.log('[Scanner] Photo captured:', {
        hasUri: !!photo?.uri,
        uri: photo?.uri,
        width: photo?.width,
        height: photo?.height,
      });

      if (!photo?.uri) {
        throw new Error('Foto konnte nicht aufgenommen werden - keine URI erhalten');
      }

      setCapturing(false);
      setProcessing(true);

      // Process with OCR
      console.log('[Scanner] Starting OCR processing...');
      const extractedValues = await recognizeNutritionLabel(photo.uri);
      console.log('[Scanner] OCR processing complete:', extractedValues);

      // Success haptic
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);

      // Return results to CreateFoodScreen via navigation params
      navigation.navigate('CreateFood', {
        mealType,
        scannedValues: extractedValues,
      });

    } catch (error: any) {
      console.error('[Scanner] Capture/OCR error:', error);
      console.error('[Scanner] Error details:', {
        message: error?.message,
        stack: error?.stack,
        name: error?.name,
      });

      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);

      // Still return to CreateFoodScreen but with error info
      navigation.navigate('CreateFood', {
        mealType,
        scannedValues: {
          confidence: 'low',
          rawText: `Fehler: ${error.message || 'Unbekannter Fehler bei der Erkennung'}\n\nBitte versuche es erneut oder gib die Werte manuell ein.`,
        },
      });
    } finally {
      setCapturing(false);
      setProcessing(false);
    }
  };

  // Not available in Expo Go
  if (!IS_CAMERA_AVAILABLE || !isOCRAvailable()) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity style={styles.closeButton} onPress={() => navigation.goBack()}>
            <Ionicons name="close" size={28} color={COLORS.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Nährwert-Scanner</Text>
          <View style={{ width: 28 }} />
        </View>

        <View style={styles.unavailableContent}>
          <Ionicons name="camera-outline" size={80} color={COLORS.textSecondary} />
          <Text style={styles.unavailableTitle}>Nicht verfügbar</Text>
          <Text style={styles.unavailableText}>
            Der Nährwert-Scanner ist nur im Development Build verfügbar.{'\n\n'}
            Bitte gib die Nährwerte manuell ein.
          </Text>
          <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
            <Text style={styles.backButtonText}>Zurück zur manuellen Eingabe</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

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
          <Text style={styles.unavailableTitle}>Kamera-Zugriff erforderlich</Text>
          <Text style={styles.unavailableText}>
            Bitte erlaube den Zugriff auf die Kamera, um Nährwertangaben scannen zu können.
          </Text>
          <TouchableOpacity
            style={styles.permissionButton}
            onPress={() => {
              if (permission.canAskAgain) {
                requestPermission();
              } else {
                navigation.goBack();
              }
            }}
          >
            <Text style={styles.permissionButtonText}>
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
        ref={cameraRef}
        style={StyleSheet.absoluteFillObject}
        facing="back"
        enableTorch={flashEnabled}
      />

      {/* Overlay */}
      <SafeAreaView style={styles.overlay} edges={['top', 'bottom']}>
        {/* Top Bar */}
        <View style={styles.topBar}>
          <TouchableOpacity style={styles.topButton} onPress={() => navigation.goBack()}>
            <Ionicons name="close" size={28} color={COLORS.white} />
          </TouchableOpacity>
          <Text style={styles.topTitle}>Nährwertangaben scannen</Text>
          <TouchableOpacity style={styles.topButton} onPress={() => setFlashEnabled(!flashEnabled)}>
            <Ionicons
              name={flashEnabled ? 'flash' : 'flash-off'}
              size={28}
              color={COLORS.white}
            />
          </TouchableOpacity>
        </View>

        {/* Scan Area with Focus Frame */}
        <View style={styles.scanAreaContainer}>
          {/* Darkened areas outside the focus frame */}
          <View style={styles.scanArea}>
            {/* Corner Brackets */}
            <View style={[styles.corner, styles.cornerTopLeft]} />
            <View style={[styles.corner, styles.cornerTopRight]} />
            <View style={[styles.corner, styles.cornerBottomLeft]} />
            <View style={[styles.corner, styles.cornerBottomRight]} />
          </View>

          {/* Instructions */}
          <Text style={styles.instructionText}>
            Positioniere die Nährwerttabelle im Rahmen
          </Text>

          {/* Hint */}
          <View style={styles.hintBox}>
            <Ionicons name="bulb-outline" size={16} color={COLORS.warning} />
            <Text style={styles.hintText}>
              Tipp: Halte das Etikett gerade und achte auf gute Beleuchtung
            </Text>
          </View>
        </View>

        {/* Processing Overlay */}
        {processing && (
          <View style={styles.processingOverlay}>
            <View style={styles.processingCard}>
              <ActivityIndicator size="large" color={COLORS.primary} />
              <Text style={styles.processingText}>Nährwerte werden erkannt...</Text>
            </View>
          </View>
        )}

        {/* Capture Button */}
        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={[styles.captureButton, (capturing || processing) && styles.captureButtonDisabled]}
            onPress={handleCapture}
            disabled={capturing || processing}
          >
            {capturing ? (
              <ActivityIndicator size="large" color={COLORS.white} />
            ) : (
              <View style={styles.captureButtonInner}>
                <Ionicons name="scan" size={32} color={COLORS.white} />
              </View>
            )}
          </TouchableOpacity>
          <Text style={styles.captureHint}>Tippen zum Scannen</Text>
        </View>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.black || '#000',
  },

  // Header (Fallback Mode)
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

  // Unavailable State
  unavailableContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: SPACING.xl,
  },
  unavailableTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: COLORS.text,
    marginTop: SPACING.xl,
    marginBottom: SPACING.md,
    textAlign: 'center',
  },
  unavailableText: {
    fontSize: 16,
    color: COLORS.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: SPACING.xl,
  },
  backButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
  },
  backButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },

  // Center Content
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
  permissionButton: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
    marginTop: SPACING.lg,
  },
  permissionButtonText: {
    color: COLORS.white,
    fontSize: 16,
    fontWeight: '600',
  },

  // Camera Overlay
  overlay: {
    flex: 1,
    backgroundColor: 'transparent',
  },

  // Top Bar
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
  topTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: COLORS.white,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.md,
  },

  // Scan Area
  scanAreaContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanArea: {
    width: SCAN_AREA_WIDTH,
    height: SCAN_AREA_HEIGHT,
    position: 'relative',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.3)',
    borderRadius: BORDER_RADIUS.md,
  },
  corner: {
    position: 'absolute',
    width: 30,
    height: 30,
    borderColor: COLORS.primary,
  },
  cornerTopLeft: {
    top: -2,
    left: -2,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderTopLeftRadius: BORDER_RADIUS.md,
  },
  cornerTopRight: {
    top: -2,
    right: -2,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderTopRightRadius: BORDER_RADIUS.md,
  },
  cornerBottomLeft: {
    bottom: -2,
    left: -2,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderBottomLeftRadius: BORDER_RADIUS.md,
  },
  cornerBottomRight: {
    bottom: -2,
    right: -2,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderBottomRightRadius: BORDER_RADIUS.md,
  },
  instructionText: {
    marginTop: SPACING.xl,
    fontSize: 16,
    color: COLORS.white,
    textAlign: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: SPACING.lg,
    paddingVertical: SPACING.md,
    borderRadius: BORDER_RADIUS.md,
  },
  hintBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: SPACING.sm,
    marginTop: SPACING.md,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.sm,
    borderRadius: BORDER_RADIUS.sm,
  },
  hintText: {
    fontSize: 13,
    color: COLORS.white,
  },

  // Processing Overlay
  processingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  processingCard: {
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.xxl,
    alignItems: 'center',
    minWidth: 200,
  },
  processingText: {
    marginTop: SPACING.md,
    fontSize: 16,
    color: COLORS.text,
    fontWeight: '500',
  },

  // Bottom Bar
  bottomBar: {
    alignItems: 'center',
    paddingBottom: SPACING.xl,
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.primary,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 4,
    borderColor: COLORS.white,
  },
  captureButtonDisabled: {
    backgroundColor: COLORS.textTertiary,
  },
  captureButtonInner: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  captureHint: {
    marginTop: SPACING.sm,
    fontSize: 14,
    color: COLORS.white,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: SPACING.md,
    paddingVertical: SPACING.xs,
    borderRadius: BORDER_RADIUS.sm,
  },
});
