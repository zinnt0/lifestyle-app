/**
 * Emoji Helper Functions
 *
 * Utility functions that return appropriate emojis based on numeric values.
 * Commonly used for visualizing health metrics, mood, and wellness indicators.
 */

/**
 * Returns an emoji representing sleep quality
 * @param quality - Sleep quality rating (0-10)
 * @returns Emoji string representing the quality level
 */
export const getQualityEmoji = (quality: number): string => {
  if (quality >= 9) return "😴";
  if (quality >= 7) return "😌";
  if (quality >= 5) return "😐";
  if (quality >= 3) return "😕";
  return "😫";
};

/**
 * Returns an emoji representing stress level
 * @param stress - Stress level rating (0-10, where 10 is highest stress)
 * @returns Emoji string representing the stress level
 */
export const getStressEmoji = (stress: number): string => {
  if (stress <= 2) return "😌";
  if (stress <= 4) return "🙂";
  if (stress <= 6) return "😐";
  if (stress <= 8) return "😟";
  return "😰";
};

/**
 * Returns an emoji representing mood
 * @param mood - Mood rating (0-10)
 * @returns Emoji string representing the mood level
 */
export const getMoodEmoji = (mood: number): string => {
  if (mood >= 9) return "😁";
  if (mood >= 7) return "😊";
  if (mood >= 5) return "😐";
  if (mood >= 3) return "😟";
  return "😢";
};

/**
 * Returns an emoji representing energy level
 * @param energy - Energy level rating (0-10)
 * @returns Emoji string representing the energy level
 */
export const getEnergyEmoji = (energy: number): string => {
  if (energy >= 8) return "⚡";
  if (energy >= 6) return "💪";
  if (energy >= 4) return "😐";
  return "😴";
};
