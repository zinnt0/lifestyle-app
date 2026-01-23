/**
 * Local Storage Service for User Supplement Stack
 *
 * Handles persistent storage of user's supplement stack and daily tracking
 */

import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  UserStackSupplement,
  DailySupplementTracking,
  SupplementStackCache,
  SupplementTrackingCache,
  TargetArea,
  SubstanceClass,
} from './types';

const STACK_CACHE_KEY = '@supplement_stack_cache';
const TRACKING_CACHE_KEY = '@supplement_tracking_cache';
const CACHE_VERSION = 1;

// ============================================================================
// SUPPLEMENT STACK OPERATIONS
// ============================================================================

/**
 * Get the user's supplement stack from local storage
 */
export async function getUserStack(userId: string): Promise<UserStackSupplement[]> {
  try {
    const cached = await AsyncStorage.getItem(STACK_CACHE_KEY);
    if (!cached) return [];

    const cache: SupplementStackCache = JSON.parse(cached);

    // Verify cache belongs to this user
    if (cache.userId !== userId) return [];

    return cache.supplements || [];
  } catch (error) {
    console.error('Error loading supplement stack:', error);
    return [];
  }
}

/**
 * Save the user's supplement stack to local storage
 */
export async function saveUserStack(
  userId: string,
  supplements: UserStackSupplement[]
): Promise<void> {
  try {
    const cache: SupplementStackCache = {
      userId,
      supplements,
      lastUpdated: new Date().toISOString(),
      version: CACHE_VERSION,
    };

    await AsyncStorage.setItem(STACK_CACHE_KEY, JSON.stringify(cache));
  } catch (error) {
    console.error('Error saving supplement stack:', error);
    throw error;
  }
}

/**
 * Add a supplement to the user's stack
 */
export async function addSupplementToStack(
  userId: string,
  supplementId: string,
  supplementName: string,
  targetAreas: TargetArea[],
  substanceClass: SubstanceClass,
  addedFrom: 'recommendation' | 'manual',
  matchScore?: number
): Promise<UserStackSupplement> {
  const supplements = await getUserStack(userId);

  // Check if already in stack
  const existing = supplements.find(s => s.supplementId === supplementId);
  if (existing) {
    return existing;
  }

  const newSupplement: UserStackSupplement = {
    id: `${userId}_${supplementId}_${Date.now()}`,
    supplementId,
    supplementName,
    targetAreas,
    substanceClass,
    addedAt: new Date().toISOString(),
    addedFrom,
    matchScore,
  };

  supplements.push(newSupplement);
  await saveUserStack(userId, supplements);

  return newSupplement;
}

/**
 * Remove a supplement from the user's stack
 */
export async function removeSupplementFromStack(
  userId: string,
  supplementId: string
): Promise<void> {
  const supplements = await getUserStack(userId);
  const filtered = supplements.filter(s => s.supplementId !== supplementId);
  await saveUserStack(userId, filtered);
}

/**
 * Clear the user's supplement stack
 */
export async function clearUserStack(userId: string): Promise<void> {
  await saveUserStack(userId, []);
}

// ============================================================================
// DAILY TRACKING OPERATIONS
// ============================================================================

/**
 * Get daily tracking records for a specific date
 */
export async function getDailyTracking(
  userId: string,
  date: string
): Promise<DailySupplementTracking[]> {
  try {
    const cached = await AsyncStorage.getItem(TRACKING_CACHE_KEY);
    if (!cached) return [];

    const cache: SupplementTrackingCache = JSON.parse(cached);

    if (cache.userId !== userId) return [];

    return cache.trackingRecords[date] || [];
  } catch (error) {
    console.error('Error loading daily tracking:', error);
    return [];
  }
}

/**
 * Get all tracking records
 */
export async function getAllTracking(
  userId: string
): Promise<Record<string, DailySupplementTracking[]>> {
  try {
    const cached = await AsyncStorage.getItem(TRACKING_CACHE_KEY);
    if (!cached) return {};

    const cache: SupplementTrackingCache = JSON.parse(cached);

    if (cache.userId !== userId) return {};

    return cache.trackingRecords || {};
  } catch (error) {
    console.error('Error loading all tracking:', error);
    return {};
  }
}

/**
 * Save daily tracking records
 */
async function saveTrackingRecords(
  userId: string,
  trackingRecords: Record<string, DailySupplementTracking[]>
): Promise<void> {
  try {
    const cache: SupplementTrackingCache = {
      userId,
      trackingRecords,
      lastUpdated: new Date().toISOString(),
      version: CACHE_VERSION,
    };

    await AsyncStorage.setItem(TRACKING_CACHE_KEY, JSON.stringify(cache));
  } catch (error) {
    console.error('Error saving tracking records:', error);
    throw error;
  }
}

/**
 * Toggle supplement intake for a specific date
 */
export async function toggleSupplementIntake(
  userId: string,
  date: string,
  supplementId: string,
  taken: boolean
): Promise<void> {
  const allRecords = await getAllTracking(userId);
  const dateRecords = allRecords[date] || [];

  // Find existing record
  const existingIndex = dateRecords.findIndex(r => r.supplementId === supplementId);

  if (existingIndex >= 0) {
    // Update existing record
    dateRecords[existingIndex] = {
      ...dateRecords[existingIndex],
      taken,
      takenAt: taken ? new Date().toISOString() : undefined,
    };
  } else {
    // Create new record
    const newRecord: DailySupplementTracking = {
      id: `${userId}_${date}_${supplementId}`,
      userId,
      date,
      supplementId,
      taken,
      takenAt: taken ? new Date().toISOString() : undefined,
    };
    dateRecords.push(newRecord);
  }

  allRecords[date] = dateRecords;
  await saveTrackingRecords(userId, allRecords);
}

/**
 * Check if a supplement was taken on a specific date
 */
export async function wasSupplementTaken(
  userId: string,
  date: string,
  supplementId: string
): Promise<boolean> {
  const dateRecords = await getDailyTracking(userId, date);
  const record = dateRecords.find(r => r.supplementId === supplementId);
  return record?.taken || false;
}

/**
 * Initialize tracking records for a date based on current stack
 */
export async function initializeDailyTracking(
  userId: string,
  date: string
): Promise<void> {
  const existingRecords = await getDailyTracking(userId, date);

  // Only initialize if no records exist for this date
  if (existingRecords.length > 0) return;

  const supplements = await getUserStack(userId);
  const allRecords = await getAllTracking(userId);

  const newRecords: DailySupplementTracking[] = supplements.map(supplement => ({
    id: `${userId}_${date}_${supplement.supplementId}`,
    userId,
    date,
    supplementId: supplement.supplementId,
    taken: false,
  }));

  allRecords[date] = newRecords;
  await saveTrackingRecords(userId, allRecords);
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get today's date in YYYY-MM-DD format
 */
export function getTodayDateString(): string {
  const today = new Date();
  return today.toISOString().split('T')[0];
}

/**
 * Format date for display (e.g., "Sonntag, den 11. Jan.")
 */
export function formatDateDisplay(dateString: string): string {
  const date = new Date(dateString);
  const weekdays = ['Sonntag', 'Montag', 'Dienstag', 'Mittwoch', 'Donnerstag', 'Freitag', 'Samstag'];
  const months = ['Jan.', 'Feb.', 'März', 'Apr.', 'Mai', 'Juni', 'Juli', 'Aug.', 'Sep.', 'Okt.', 'Nov.', 'Dez.'];

  const weekday = weekdays[date.getDay()];
  const day = date.getDate();
  const month = months[date.getMonth()];

  return `${weekday}, den ${day}. ${month}`;
}

/**
 * Get target area display name
 */
export function getTargetAreaDisplayName(targetArea: TargetArea): string {
  const displayNames: Record<TargetArea, string> = {
    'Leistung_Kraft': 'Kraft',
    'Leistung_Ausdauer': 'Ausdauer',
    'Muskelaufbau_Protein': 'Muskelaufbau',
    'Regeneration_Entzuendung': 'Regeneration',
    'Schlaf_Stress': 'Schlaf & Stress',
    'Fokus_Kognition': 'Fokus',
    'Gesundheit_Immunsystem': 'Immunsystem',
    'Verdauung_Darm': 'Verdauung',
    'Gelenke_Bindegewebe_Haut': 'Gelenke & Haut',
    'Hormon_Zyklus': 'Hormone',
    'Basis_Mikros': 'Vitamine & Mineralien',
    'Hydration_Elektrolyte': 'Hydration',
  };

  return displayNames[targetArea] || targetArea;
}

// ============================================================================
// WEEKLY TRACKING OPERATIONS
// ============================================================================

export interface WeekDay {
  date: string;
  label: string;
  isToday: boolean;
}

/**
 * Get the current week's dates (Monday to Sunday)
 */
export function getCurrentWeekDates(): WeekDay[] {
  const today = new Date();
  const currentDay = today.getDay(); // 0 = Sunday, 1 = Monday, etc.

  // Calculate Monday of current week
  const monday = new Date(today);
  const daysFromMonday = currentDay === 0 ? 6 : currentDay - 1;
  monday.setDate(today.getDate() - daysFromMonday);

  const weekDayLabels = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];
  const todayString = getTodayDateString();

  const weekDates: WeekDay[] = [];

  for (let i = 0; i < 7; i++) {
    const date = new Date(monday);
    date.setDate(monday.getDate() + i);
    const dateString = date.toISOString().split('T')[0];

    weekDates.push({
      date: dateString,
      label: weekDayLabels[i],
      isToday: dateString === todayString,
    });
  }

  return weekDates;
}

/**
 * Check if all supplements were taken on a specific date
 */
export async function wasAllSupplementsTakenOnDate(
  userId: string,
  date: string
): Promise<boolean> {
  const supplements = await getUserStack(userId);

  // If no supplements in stack, return false
  if (supplements.length === 0) return false;

  const dateRecords = await getDailyTracking(userId, date);

  // Check if all supplements in the current stack were taken on that date
  for (const supplement of supplements) {
    const record = dateRecords.find(r => r.supplementId === supplement.supplementId);
    if (!record || !record.taken) {
      return false;
    }
  }

  return true;
}

/**
 * Get weekly completion status for all days
 */
export async function getWeeklyCompletionStatus(
  userId: string
): Promise<Record<string, boolean>> {
  const weekDates = getCurrentWeekDates();
  const completionStatus: Record<string, boolean> = {};

  for (const day of weekDates) {
    completionStatus[day.date] = await wasAllSupplementsTakenOnDate(userId, day.date);
  }

  return completionStatus;
}
