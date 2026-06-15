// Thin wrapper over expo-haptics. Centralised so call sites read as intent
// ("haptics.tap()") and so a missing native module (e.g. web) degrades to a
// no-op instead of throwing.
import * as Haptics from 'expo-haptics';

function safe(fn: () => void): void {
  try {
    fn();
  } catch {
    // Haptics are non-essential; never let them break an interaction.
  }
}

export const haptics = {
  // Light tap — selection changes, tab switches, toggles.
  tap: () => safe(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)),
  // Medium — committing an action (send, save a listing).
  press: () => safe(() => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium)),
  // Success notification — listing posted, marked sold.
  success: () => safe(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)),
  // Warning / error notification.
  warn: () => safe(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning)),
};
