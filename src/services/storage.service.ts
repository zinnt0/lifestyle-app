import { supabase } from '../lib/supabase';
import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';

/**
 * Request permission to access media library
 */
export const requestMediaLibraryPermission = async (): Promise<boolean> => {
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  return status === 'granted';
};

/**
 * Pick an image from the device's media library
 */
export const pickImage = async (): Promise<ImagePicker.ImagePickerAsset | null> => {
  try {
    const hasPermission = await requestMediaLibraryPermission();

    if (!hasPermission) {
      throw new Error('Zugriff auf Mediathek wurde verweigert');
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (result.canceled) {
      return null;
    }

    return result.assets[0];
  } catch (error) {
    console.error('Error picking image:', error);
    throw error;
  }
};

/**
 * Get content type from file extension
 */
const getContentType = (uri: string): string => {
  const fileExt = uri.split('.').pop()?.toLowerCase() || 'jpg';
  const contentTypeMap: Record<string, string> = {
    'jpg': 'image/jpeg',
    'jpeg': 'image/jpeg',
    'png': 'image/png',
    'gif': 'image/gif',
    'webp': 'image/webp',
  };
  return contentTypeMap[fileExt] || 'image/jpeg';
};

/**
 * Upload an image to Supabase Storage
 *
 * @param uri - Local URI of the image
 * @param userId - User ID for organizing uploads
 * @returns Public URL of the uploaded image
 */
export const uploadProfileImage = async (
  uri: string,
  userId: string
): Promise<{ url: string | null; error: string | null }> => {
  try {
    // Validate URI
    if (!uri || !userId) {
      return {
        url: null,
        error: 'Ungültige Parameter für Upload',
      };
    }

    // Read file as base64 using Expo FileSystem (works reliably in React Native)
    const base64 = await FileSystem.readAsStringAsync(uri, {
      encoding: FileSystem.EncodingType.Base64,
    });

    // Convert base64 to ArrayBuffer (Supabase supports ArrayBuffer directly)
    const binaryString = atob(base64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    // Validate size (max 5MB)
    const maxSize = 5 * 1024 * 1024; // 5MB
    if (bytes.length > maxSize) {
      return {
        url: null,
        error: 'Bild ist zu groß (max. 5MB)',
      };
    }

    // Validate is not empty
    if (bytes.length === 0) {
      return {
        url: null,
        error: 'Bild konnte nicht geladen werden (leere Datei)',
      };
    }

    // Generate unique filename with user folder structure
    const fileExt = uri.split('.').pop()?.toLowerCase() || 'jpg';
    const fileName = `${userId}/avatar-${Date.now()}.${fileExt}`;
    const contentType = getContentType(uri);

    console.log('Uploading image:', { fileName, size: bytes.length, type: contentType });

    // Upload to Supabase Storage (avatars bucket) - Use ArrayBuffer directly
    const { error: uploadError } = await supabase.storage
      .from('avatars')
      .upload(fileName, bytes.buffer, {
        contentType,
        upsert: false,
        cacheControl: '3600',
      });

    if (uploadError) {
      console.error('Supabase upload error:', uploadError);

      // Provide more specific error messages
      if (uploadError.message.includes('policy')) {
        return {
          url: null,
          error: 'Keine Berechtigung zum Hochladen. Bitte stelle sicher, dass die Storage-Policies korrekt konfiguriert sind.',
        };
      }

      if (uploadError.message.includes('size')) {
        return {
          url: null,
          error: 'Bild ist zu groß',
        };
      }

      return {
        url: null,
        error: uploadError.message || 'Fehler beim Hochladen des Bildes',
      };
    }

    // Get public URL
    const { data } = supabase.storage
      .from('avatars')
      .getPublicUrl(fileName);

    if (!data.publicUrl) {
      return {
        url: null,
        error: 'Öffentliche URL konnte nicht generiert werden',
      };
    }

    console.log('Generated public URL:', data.publicUrl);

    // Verify the URL is accessible by trying a signed URL as fallback
    // This helps with debugging
    const { data: signedData } = await supabase.storage
      .from('avatars')
      .createSignedUrl(fileName, 60 * 60 * 24 * 7); // 7 days

    if (signedData?.signedUrl) {
      console.log('Signed URL (for debugging):', signedData.signedUrl);
    }

    return {
      url: data.publicUrl,
      error: null,
    };
  } catch (error: any) {
    console.error('Upload error:', error);
    return {
      url: null,
      error: error.message || 'Ein Fehler ist aufgetreten',
    };
  }
};

/**
 * Delete old profile image from storage
 *
 * @param imageUrl - Full URL of the image to delete
 */
export const deleteProfileImage = async (imageUrl: string): Promise<void> => {
  try {
    // Extract file path from URL
    const url = new URL(imageUrl);
    // Match either 'avatars/' or 'profile-images/' for backward compatibility
    // This now supports both:
    // - Old format: /storage/v1/object/public/profile-images/filename.jpg
    // - New format: /storage/v1/object/public/avatars/user-id/avatar-123.jpg
    const pathMatch = url.pathname.match(/\/(avatars|profile-images)\/(.+)/);

    if (!pathMatch) {
      console.warn('Could not extract path from URL:', imageUrl);
      return;
    }

    const bucket = pathMatch[1]; // 'avatars' or 'profile-images'
    const filePath = pathMatch[2]; // path including folders, e.g., 'user-id/avatar-123.jpg'

    const { error } = await supabase.storage
      .from(bucket)
      .remove([filePath]);

    if (error) {
      console.error('Error deleting image from storage:', error);
    }
  } catch (error) {
    console.error('Error deleting image:', error);
    // Don't throw - deleting old image is not critical
  }
};
