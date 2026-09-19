import AsyncStorage from '@react-native-async-storage/async-storage';

const LEGACY_PREFIX = 'mbari.';
const PREFIX = 'mbari.';

/**
 * Keys on this phone used the project's working name. Moves them under the
 * product's name once, keeping the session, the offline shelf and any queued
 * signals, so nobody is signed out by the rename. Never throws.
 */
export async function migrateLegacyKeys(): Promise<void> {
  try {
    const legacy = (await AsyncStorage.getAllKeys()).filter(key => key.startsWith(LEGACY_PREFIX));
    if (legacy.length === 0) {
      return;
    }
    const values = await AsyncStorage.getMany(legacy);
    const moved: Record<string, string> = {};
    for (const [key, value] of Object.entries(values)) {
      if (value !== null) {
        moved[PREFIX + key.slice(LEGACY_PREFIX.length)] = value;
      }
    }
    // Anything already written under the new name wins.
    const existing = await AsyncStorage.getMany(Object.keys(moved));
    for (const [key, value] of Object.entries(existing)) {
      if (value !== null) {
        delete moved[key];
      }
    }
    if (Object.keys(moved).length > 0) {
      await AsyncStorage.setMany(moved);
    }
    await AsyncStorage.removeMany(legacy);
  } catch {
    // A failed move costs a sign-in, not a crash.
  }
}
