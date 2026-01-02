import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useOnboarding } from '../../contexts/OnboardingContext';
import { isUsernameAvailable } from '../../services/profile.service';
import { pickImage } from '../../services/storage.service';
import { ProgressBar } from '../../components/ui/ProgressBar';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';

/**
 * Onboarding Screen 0: Username & Profilbild
 * Collects username (required) and optional profile image from media library
 */
export const OnboardingScreen0: React.FC = () => {
  const { data, updateData, nextStep, progress, error } = useOnboarding();

  const [usernameError, setUsernameError] = useState<string | null>(null);
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [localImageUri, setLocalImageUri] = useState<string | null>(null);
  const [pickingImage, setPickingImage] = useState(false);

  /**
   * Check if username is available when user stops typing
   */
  useEffect(() => {
    if (!data.username || data.username.length < 3) {
      setUsernameError(null);
      return;
    }

    // Debounce username check
    const timeoutId = setTimeout(async () => {
      setCheckingUsername(true);
      setUsernameError(null);

      const { isAvailable, error } = await isUsernameAvailable(data.username!);

      if (error) {
        setUsernameError(error.message);
      } else if (!isAvailable) {
        setUsernameError('Dieser Username ist bereits vergeben');
      }

      setCheckingUsername(false);
    }, 500);

    return () => clearTimeout(timeoutId);
  }, [data.username]);

  /**
   * Handle image selection from media library
   */
  const handlePickImage = async () => {
    try {
      setPickingImage(true);
      const asset = await pickImage();

      if (asset) {
        // Store local URI temporarily - will be uploaded during profile creation
        setLocalImageUri(asset.uri);
        updateData({ profile_image_url: asset.uri });
      }
    } catch (error: any) {
      Alert.alert('Fehler', error.message || 'Fehler beim Auswählen des Bildes');
    } finally {
      setPickingImage(false);
    }
  };

  const handleNext = () => {
    if (usernameError) {
      Alert.alert('Fehler', usernameError);
      return;
    }
    nextStep();
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Progress Bar */}
        <ProgressBar progress={progress} />

        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.stepIndicator}>Schritt 1 von 7</Text>
          <Text style={styles.title}>Willkommen! 👋</Text>
          <Text style={styles.subtitle}>
            Erstelle dein Profil und leg los
          </Text>
        </View>

        {/* Form Fields */}
        <View style={styles.form}>
          {/* Profile Image Section */}
          <View style={styles.imageSection}>
            <Text style={styles.label}>Profilbild (optional)</Text>
            <TouchableOpacity
              style={styles.imageContainer}
              onPress={handlePickImage}
              disabled={pickingImage}
            >
              {pickingImage ? (
                <View style={styles.placeholderImage}>
                  <ActivityIndicator size="large" color="#007AFF" />
                </View>
              ) : data.profile_image_url ? (
                <Image
                  source={{ uri: data.profile_image_url }}
                  style={styles.profileImage}
                />
              ) : (
                <View style={styles.placeholderImage}>
                  <Ionicons name="camera" size={32} color="#8E8E93" />
                  <Text style={styles.placeholderText}>Bild auswählen</Text>
                </View>
              )}
            </TouchableOpacity>
            {data.profile_image_url && (
              <TouchableOpacity
                style={styles.removeButton}
                onPress={() => {
                  updateData({ profile_image_url: null });
                  setLocalImageUri(null);
                }}
              >
                <Text style={styles.removeButtonText}>Bild entfernen</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Username Input */}
          <Input
            label="Username *"
            value={data.username || ''}
            onChangeText={(text) => {
              // Nur alphanumerische Zeichen und Unterstriche erlauben
              const sanitized = text.replace(/[^a-zA-Z0-9_]/g, '');
              updateData({ username: sanitized || null });
            }}
            placeholder="z.B. max_mustermann"
            autoCapitalize="none"
            autoCorrect={false}
          />

          {/* Username Feedback */}
          {checkingUsername && (
            <View style={styles.feedbackContainer}>
              <Text style={styles.feedbackText}>Prüfe Verfügbarkeit...</Text>
            </View>
          )}

          {usernameError && !checkingUsername && (
            <View style={[styles.feedbackContainer, styles.errorContainer]}>
              <Ionicons name="alert-circle" size={16} color="#FF3B30" />
              <Text style={styles.errorText}>{usernameError}</Text>
            </View>
          )}

          {data.username &&
            data.username.length >= 3 &&
            !usernameError &&
            !checkingUsername && (
              <View style={[styles.feedbackContainer, styles.successContainer]}>
                <Ionicons name="checkmark-circle" size={16} color="#34C759" />
                <Text style={styles.successText}>Username verfügbar!</Text>
              </View>
            )}

          <Text style={styles.hint}>
            Der Username muss eindeutig sein und kann später nicht geändert werden.
          </Text>
        </View>

        {/* Error Message */}
        {error && (
          <View style={styles.errorBox}>
            <Text style={styles.errorBoxText}>{error}</Text>
          </View>
        )}

        {/* Next Button */}
        <Button
          title="Weiter"
          onPress={handleNext}
          disabled={!data.username || data.username.length < 3 || checkingUsername || !!usernameError}
          size="large"
          style={styles.nextButton}
        />
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 24,
    paddingBottom: 48,
  },
  header: {
    marginBottom: 32,
  },
  stepIndicator: {
    fontSize: 14,
    color: '#8E8E93',
    marginBottom: 8,
    fontWeight: '500',
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
    lineHeight: 24,
  },
  form: {
    gap: 20,
  },
  imageSection: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#000000',
    marginBottom: 12,
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
  feedbackContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
  },
  feedbackText: {
    fontSize: 14,
    color: '#8E8E93',
  },
  errorContainer: {
    backgroundColor: '#FFEBEE',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  errorText: {
    fontSize: 14,
    color: '#FF3B30',
  },
  successContainer: {
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  successText: {
    fontSize: 14,
    color: '#34C759',
  },
  hint: {
    fontSize: 12,
    color: '#8E8E93',
    fontStyle: 'italic',
    marginTop: -8,
  },
  errorBox: {
    backgroundColor: '#FFEBEE',
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  errorBoxText: {
    color: '#FF3B30',
    fontSize: 14,
    textAlign: 'center',
  },
  nextButton: {
    marginTop: 32,
  },
  placeholderText: {
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
});
