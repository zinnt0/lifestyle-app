/**
 * Profile Sync Service
 *
 * Manages profile synchronization between Supabase and local SQLite cache
 * Automatically updates cache when profile changes
 */

import { supabase } from '@/lib/supabase';
import { localProfileCache, UserProfile } from './cache/LocalProfileCache';
import { profileEvents } from './ProfileEventEmitter';

const LOG_PREFIX = '[ProfileSync]';

export class ProfileSyncService {
  private eventListenersSetup: boolean = false;

  /**
   * Initialize sync service and setup event listeners
   */
  initialize(): void {
    if (this.eventListenersSetup) {
      console.log(`${LOG_PREFIX} Already initialized`);
      return;
    }

    // Listen for profile update events and auto-update cache
    profileEvents.on('updated', async ({ userId, profile }) => {
      try {
        console.log(`${LOG_PREFIX} Auto-updating cache for user ${userId}`);

        if (profile) {
          await localProfileCache.updateProfileFields(userId, profile);
        } else {
          // Full profile update - refetch from Supabase
          await this.syncProfile(userId);
        }
      } catch (error) {
        console.error(`${LOG_PREFIX} Error auto-updating cache:`, error);
      }
    });

    // Listen for image update events
    profileEvents.on('image_updated', async ({ userId, imageUrl }) => {
      try {
        console.log(`${LOG_PREFIX} Auto-updating profile image for user ${userId}`);
        await localProfileCache.updateProfileFields(userId, {
          profile_image_url: imageUrl,
        });
      } catch (error) {
        console.error(`${LOG_PREFIX} Error updating profile image:`, error);
      }
    });

    // Listen for profile deletion events
    profileEvents.on('deleted', async ({ userId }) => {
      try {
        console.log(`${LOG_PREFIX} Auto-deleting cached profile for user ${userId}`);
        await localProfileCache.deleteProfile(userId);
      } catch (error) {
        console.error(`${LOG_PREFIX} Error deleting cached profile:`, error);
      }
    });

    this.eventListenersSetup = true;
    console.log(`${LOG_PREFIX} Event listeners initialized`);
  }

  /**
   * Get profile with automatic fallback to Supabase
   * 1. Check local cache first (instant)
   * 2. If not cached, fetch from Supabase and cache
   */
  async getProfile(userId: string): Promise<UserProfile | null> {
    try {
      // Try local cache first
      const cachedProfile = await localProfileCache.getProfile(userId);

      if (cachedProfile) {
        console.log(`${LOG_PREFIX} Using cached profile for user ${userId}`);
        return cachedProfile;
      }

      // Not cached - fetch from Supabase
      console.log(`${LOG_PREFIX} Cache miss for user ${userId}, fetching from Supabase`);
      return await this.syncProfile(userId);
    } catch (error) {
      console.error(`${LOG_PREFIX} Error getting profile for ${userId}:`, error);
      return null;
    }
  }

  /**
   * Fetch profile from Supabase and cache it
   */
  async syncProfile(userId: string): Promise<UserProfile | null> {
    try {
      console.log(`${LOG_PREFIX} Syncing profile from Supabase for user ${userId}`);

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        throw error;
      }

      if (!data) {
        console.log(`${LOG_PREFIX} No profile found in Supabase for user ${userId}`);
        return null;
      }

      // Convert Supabase data to UserProfile format
      const profile: UserProfile = {
        id: data.id,
        username: data.username || null,
        profile_image_url: data.profile_image_url || null,
        age: data.age || null,
        weight: data.weight || null,
        height: data.height || null,
        gender: data.gender || null,
        body_fat_percentage: data.body_fat_percentage || null,
        fitness_level: data.fitness_level || null,
        training_experience_months: data.training_experience_months || null,
        available_training_days: data.available_training_days || null,
        preferred_training_days: data.preferred_training_days || null,
        primary_goal: data.primary_goal || null,
        sleep_hours_avg: data.sleep_hours_avg || null,
        stress_level: data.stress_level || null,
        pal_factor: data.pal_factor || null,
        has_gym_access: data.has_gym_access ?? null,
        home_equipment: data.home_equipment || null,
        target_weight_kg: data.target_weight_kg || null,
        target_date: data.target_date || null,
        onboarding_completed: data.onboarding_completed || false,
        enable_daily_recovery_tracking: data.enable_daily_recovery_tracking || false,
        // Supplement Onboarding Data
        supplement_onboarding_completed: data.supplement_onboarding_completed || false,
        gi_issues: data.gi_issues || null,
        heavy_sweating: data.heavy_sweating ?? null,
        high_salt_intake: data.high_salt_intake ?? null,
        sun_exposure_hours: data.sun_exposure_hours ?? null,
        joint_issues: data.joint_issues || null,
        lab_values: data.lab_values || null,
        created_at: data.created_at,
        updated_at: data.updated_at,
        cached_at: new Date().toISOString(),
      };

      // Cache it locally
      await localProfileCache.cacheProfile(profile);

      console.log(`${LOG_PREFIX} Profile synced and cached for user ${userId}`);
      return profile;
    } catch (error) {
      console.error(`${LOG_PREFIX} Error syncing profile from Supabase:`, error);
      return null;
    }
  }

  /**
   * Update profile in Supabase and cache
   */
  async updateProfile(
    userId: string,
    updates: Partial<Omit<UserProfile, 'id' | 'created_at' | 'cached_at'>>
  ): Promise<UserProfile | null> {
    try {
      console.log(`${LOG_PREFIX} Updating profile in Supabase for user ${userId}`);

      // Update in Supabase
      const { data, error } = await supabase
        .from('profiles')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId)
        .select()
        .single();

      if (error) {
        throw error;
      }

      if (!data) {
        throw new Error('Update failed - no data returned');
      }

      // Emit update event (will auto-update cache via event listener)
      profileEvents.emitProfileUpdated(userId, updates);

      console.log(`${LOG_PREFIX} Profile updated successfully for user ${userId}`);

      // Return fresh profile
      return await this.getProfile(userId);
    } catch (error) {
      console.error(`${LOG_PREFIX} Error updating profile:`, error);
      throw error;
    }
  }

  /**
   * Update profile image
   */
  async updateProfileImage(userId: string, imageUrl: string): Promise<void> {
    try {
      console.log(`${LOG_PREFIX} Updating profile image for user ${userId}`);

      // Update in Supabase
      const { error } = await supabase
        .from('profiles')
        .update({
          profile_image_url: imageUrl,
          updated_at: new Date().toISOString(),
        })
        .eq('id', userId);

      if (error) {
        throw error;
      }

      // Emit image update event (will auto-update cache)
      profileEvents.emitImageUpdated(userId, imageUrl);

      console.log(`${LOG_PREFIX} Profile image updated successfully`);
    } catch (error) {
      console.error(`${LOG_PREFIX} Error updating profile image:`, error);
      throw error;
    }
  }

  /**
   * Delete profile from Supabase and cache
   */
  async deleteProfile(userId: string): Promise<void> {
    try {
      console.log(`${LOG_PREFIX} Deleting profile for user ${userId}`);

      // Delete from Supabase
      const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', userId);

      if (error) {
        throw error;
      }

      // Emit delete event (will auto-delete from cache)
      profileEvents.emitProfileDeleted(userId);

      console.log(`${LOG_PREFIX} Profile deleted successfully`);
    } catch (error) {
      console.error(`${LOG_PREFIX} Error deleting profile:`, error);
      throw error;
    }
  }

  /**
   * Force refresh profile from Supabase
   * Also emits an 'updated' event to trigger dependent systems (e.g., supplement recommendations)
   */
  async refreshProfile(userId: string): Promise<UserProfile | null> {
    console.log(`${LOG_PREFIX} Force refreshing profile for user ${userId}`);
    const profile = await this.syncProfile(userId);

    // Emit event to trigger recommendation recalculation and other dependent systems
    if (profile) {
      profileEvents.emitProfileUpdated(userId, profile);
    }

    return profile;
  }
}

/**
 * Singleton instance for the app
 */
export const profileSyncService = new ProfileSyncService();

/**
 * Example usage:
 *
 * ```typescript
 * import { profileSyncService } from './ProfileSyncService';
 *
 * // Initialize (once on app start)
 * profileSyncService.initialize();
 *
 * // Get profile (auto-caches if not cached)
 * const profile = await profileSyncService.getProfile(userId);
 *
 * // Update profile (auto-updates cache)
 * await profileSyncService.updateProfile(userId, {
 *   weight: 75.5,
 *   fitness_level: 'intermediate',
 * });
 *
 * // Update profile image (auto-updates cache)
 * await profileSyncService.updateProfileImage(userId, imageUrl);
 *
 * // Force refresh from Supabase
 * await profileSyncService.refreshProfile(userId);
 * ```
 */
