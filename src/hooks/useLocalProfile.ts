/**
 * useLocalProfile Hook
 *
 * React hook for accessing cached user profile with automatic sync
 * Provides offline-first functionality with Supabase fallback
 * Auto-updates when profile changes via event system
 */

import { useState, useEffect, useCallback } from 'react';
import { profileSyncService } from '../services/ProfileSyncService';
import { profileEvents } from '../services/ProfileEventEmitter';
import { UserProfile } from '../services/cache/LocalProfileCache';

export interface UseLocalProfileReturn {
  profile: UserProfile | null;
  loading: boolean;
  error: string | null;

  // Methods
  refreshProfile: () => Promise<void>;
  updateProfile: (updates: Partial<Omit<UserProfile, 'id' | 'created_at' | 'cached_at'>>) => Promise<void>;
  updateProfileImage: (imageUrl: string) => Promise<void>;

  // Metadata
  isCached: boolean;
  lastCachedAt: string | null;
  lastUpdatedAt: string | null;
}

/**
 * Hook for accessing user profile with automatic caching
 *
 * Features:
 * - Loads from local cache first (instant)
 * - Auto-fetches from Supabase if not cached
 * - Auto-updates when profile changes
 * - Provides update methods
 *
 * @param userId - User ID to load profile for
 * @param autoRefresh - Auto-refresh on mount (default: true)
 */
export function useLocalProfile(
  userId: string | null | undefined,
  autoRefresh: boolean = true
): UseLocalProfileReturn {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCached, setIsCached] = useState(false);
  const [lastCachedAt, setLastCachedAt] = useState<string | null>(null);
  const [lastUpdatedAt, setLastUpdatedAt] = useState<string | null>(null);

  /**
   * Load profile from cache or Supabase
   */
  const loadProfile = useCallback(async () => {
    if (!userId) {
      setError('No user ID provided');
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Get profile (auto-caches if not cached)
      const profileData = await profileSyncService.getProfile(userId);

      if (profileData) {
        setProfile(profileData);
        setIsCached(true);
        setLastCachedAt(profileData.cached_at);
        setLastUpdatedAt(profileData.updated_at);
      } else {
        setProfile(null);
        setIsCached(false);
        setError('Profile not found');
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to load profile';
      setError(errorMsg);
      console.error('[useLocalProfile] Error:', err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  /**
   * Refresh profile from Supabase
   */
  const refreshProfile = useCallback(async () => {
    if (!userId) return;

    try {
      setLoading(true);
      setError(null);

      const profileData = await profileSyncService.refreshProfile(userId);

      if (profileData) {
        setProfile(profileData);
        setLastCachedAt(profileData.cached_at);
        setLastUpdatedAt(profileData.updated_at);
      }
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to refresh profile';
      setError(errorMsg);
      console.error('[useLocalProfile] Refresh error:', err);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  /**
   * Update profile
   */
  const updateProfile = useCallback(
    async (updates: Partial<Omit<UserProfile, 'id' | 'created_at' | 'cached_at'>>) => {
      if (!userId) {
        throw new Error('No user ID provided');
      }

      try {
        setLoading(true);
        setError(null);

        const updatedProfile = await profileSyncService.updateProfile(userId, updates);

        if (updatedProfile) {
          setProfile(updatedProfile);
          setLastCachedAt(updatedProfile.cached_at);
          setLastUpdatedAt(updatedProfile.updated_at);
        }
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to update profile';
        setError(errorMsg);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [userId]
  );

  /**
   * Update profile image
   */
  const updateProfileImage = useCallback(
    async (imageUrl: string) => {
      if (!userId) {
        throw new Error('No user ID provided');
      }

      try {
        setLoading(true);
        setError(null);

        await profileSyncService.updateProfileImage(userId, imageUrl);

        // Update local state
        if (profile) {
          setProfile({
            ...profile,
            profile_image_url: imageUrl,
            updated_at: new Date().toISOString(),
          });
        }
      } catch (err) {
        const errorMsg = err instanceof Error ? err.message : 'Failed to update image';
        setError(errorMsg);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [userId, profile]
  );

  // Initial load
  useEffect(() => {
    if (userId && autoRefresh) {
      loadProfile();
    }
  }, [userId, autoRefresh, loadProfile]);

  // Listen for profile update events
  useEffect(() => {
    if (!userId) return;

    const unsubscribeUpdate = profileEvents.on('updated', ({ userId: eventUserId, profile: updates }) => {
      if (eventUserId === userId) {
        console.log('[useLocalProfile] Profile updated via event');

        // Update local state
        if (updates && profile) {
          setProfile({
            ...profile,
            ...updates,
            updated_at: new Date().toISOString(),
          });
          setLastUpdatedAt(new Date().toISOString());
        } else {
          // Full update - reload
          loadProfile();
        }
      }
    });

    const unsubscribeImage = profileEvents.on('image_updated', ({ userId: eventUserId, imageUrl }) => {
      if (eventUserId === userId && profile) {
        console.log('[useLocalProfile] Profile image updated via event');

        setProfile({
          ...profile,
          profile_image_url: imageUrl,
          updated_at: new Date().toISOString(),
        });
        setLastUpdatedAt(new Date().toISOString());
      }
    });

    const unsubscribeDelete = profileEvents.on('deleted', ({ userId: eventUserId }) => {
      if (eventUserId === userId) {
        console.log('[useLocalProfile] Profile deleted via event');
        setProfile(null);
        setIsCached(false);
      }
    });

    return () => {
      unsubscribeUpdate();
      unsubscribeImage();
      unsubscribeDelete();
    };
  }, [userId, profile, loadProfile]);

  return {
    profile,
    loading,
    error,
    refreshProfile,
    updateProfile,
    updateProfileImage,
    isCached,
    lastCachedAt,
    lastUpdatedAt,
  };
}

/**
 * Hook for profile image only (optimized for avatar components)
 */
export function useProfileImage(userId: string | null | undefined): {
  imageUrl: string | null;
  loading: boolean;
  updateImage: (url: string) => Promise<void>;
} {
  const { profile, loading, updateProfileImage } = useLocalProfile(userId, true);

  return {
    imageUrl: profile?.profile_image_url || null,
    loading,
    updateImage: updateProfileImage,
  };
}

/**
 * Example usage:
 *
 * ```typescript
 * // Full profile
 * function ProfileScreen() {
 *   const userId = 'user-123';
 *   const {
 *     profile,
 *     loading,
 *     error,
 *     updateProfile,
 *     refreshProfile
 *   } = useLocalProfile(userId);
 *
 *   if (loading) return <ActivityIndicator />;
 *   if (error) return <Text>Error: {error}</Text>;
 *   if (!profile) return <Text>No profile</Text>;
 *
 *   const handleUpdateWeight = async () => {
 *     await updateProfile({ weight: 75.5 });
 *   };
 *
 *   return (
 *     <View>
 *       <Text>Username: {profile.username}</Text>
 *       <Text>Weight: {profile.weight} kg</Text>
 *       <Button onPress={handleUpdateWeight}>Update Weight</Button>
 *       <Button onPress={refreshProfile}>Refresh</Button>
 *     </View>
 *   );
 * }
 *
 * // Profile image only
 * function Avatar() {
 *   const userId = 'user-123';
 *   const { imageUrl, loading } = useProfileImage(userId);
 *
 *   if (loading) return <ActivityIndicator size="small" />;
 *
 *   return (
 *     <Image
 *       source={{ uri: imageUrl || 'https://placeholder.com/avatar' }}
 *       style={{ width: 50, height: 50, borderRadius: 25 }}
 *     />
 *   );
 * }
 * ```
 */
