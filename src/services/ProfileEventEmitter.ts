/**
 * Profile Event Emitter
 *
 * Event-based system for profile updates
 * Allows components to listen for profile changes and auto-refresh cache
 */

import { UserProfile } from './cache/LocalProfileCache';

type ProfileEventType = 'updated' | 'deleted' | 'image_updated';

type ProfileEventListener = (data: ProfileEventData) => void;

interface ProfileEventData {
  userId: string;
  profile?: Partial<UserProfile>;
  imageUrl?: string;
  timestamp: string;
}

const LOG_PREFIX = '[ProfileEvents]';

export class ProfileEventEmitter {
  private listeners: Map<ProfileEventType, Set<ProfileEventListener>> = new Map();

  /**
   * Subscribe to profile events
   */
  on(event: ProfileEventType, listener: ProfileEventListener): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }

    this.listeners.get(event)!.add(listener);
    console.log(`${LOG_PREFIX} Listener added for event: ${event}`);

    // Return unsubscribe function
    return () => this.off(event, listener);
  }

  /**
   * Unsubscribe from profile events
   */
  off(event: ProfileEventType, listener: ProfileEventListener): void {
    const eventListeners = this.listeners.get(event);
    if (eventListeners) {
      eventListeners.delete(listener);
      console.log(`${LOG_PREFIX} Listener removed for event: ${event}`);
    }
  }

  /**
   * Emit profile event
   */
  emit(event: ProfileEventType, data: ProfileEventData): void {
    console.log(`${LOG_PREFIX} Emitting event: ${event}`, data);

    const eventListeners = this.listeners.get(event);
    if (!eventListeners || eventListeners.size === 0) {
      console.log(`${LOG_PREFIX} No listeners for event: ${event}`);
      return;
    }

    eventListeners.forEach((listener) => {
      try {
        listener(data);
      } catch (error) {
        console.error(`${LOG_PREFIX} Error in listener for ${event}:`, error);
      }
    });
  }

  /**
   * Emit profile updated event
   */
  emitProfileUpdated(userId: string, profile: Partial<UserProfile>): void {
    this.emit('updated', {
      userId,
      profile,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Emit profile image updated event
   */
  emitImageUpdated(userId: string, imageUrl: string): void {
    this.emit('image_updated', {
      userId,
      imageUrl,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Emit profile deleted event
   */
  emitProfileDeleted(userId: string): void {
    this.emit('deleted', {
      userId,
      timestamp: new Date().toISOString(),
    });
  }

  /**
   * Remove all listeners
   */
  removeAllListeners(): void {
    this.listeners.clear();
    console.log(`${LOG_PREFIX} All listeners removed`);
  }

  /**
   * Get listener count for an event
   */
  listenerCount(event: ProfileEventType): number {
    return this.listeners.get(event)?.size || 0;
  }
}

/**
 * Singleton instance for the app
 */
export const profileEvents = new ProfileEventEmitter();

/**
 * Example usage:
 *
 * ```typescript
 * import { profileEvents } from './ProfileEventEmitter';
 *
 * // Subscribe to profile updates
 * const unsubscribe = profileEvents.on('updated', ({ userId, profile }) => {
 *   console.log('Profile updated:', userId, profile);
 *   // Refresh UI or cache
 * });
 *
 * // Emit profile update (after saving to Supabase)
 * profileEvents.emitProfileUpdated(userId, {
 *   weight: 75.5,
 *   profile_image_url: 'https://...',
 * });
 *
 * // Emit image update specifically
 * profileEvents.emitImageUpdated(userId, imageUrl);
 *
 * // Unsubscribe when component unmounts
 * unsubscribe();
 * ```
 */
