import AsyncStorage from '@react-native-async-storage/async-storage';

import type {Article} from '@/api';



const KEY_PREFIX = 'mbari.offline.v1.';
const RETENTION_KEY = 'mbari.offline.retention.v1';

/** Days a saved article stays on the phone; null keeps it until removed. */
export type OfflineRetention = 7 | 30 | null;
export const DEFAULT_RETENTION: OfflineRetention = 30;
const RETENTIONS: readonly OfflineRetention[] = [7, 30, null];

export type SavedArticle = {
  article: Article;
  /** ISO timestamp. */
  savedAt: string;
};

export type OfflineShelf = Record<string, SavedArticle>;

export const offlineKey = (userId: string) => `${KEY_PREFIX}${userId}`;

export async function readShelf(userId: string): Promise<OfflineShelf> {
  try {
    const raw = await AsyncStorage.getItem(offlineKey(userId));
    const parsed: unknown = raw ? JSON.parse(raw) : null;
    return parsed && typeof parsed === 'object' ? (parsed as OfflineShelf) : {};
  } catch {
    return {};
  }
}

export async function writeShelf(userId: string, shelf: OfflineShelf): Promise<void> {
  try {
    await AsyncStorage.setItem(offlineKey(userId), JSON.stringify(shelf));
  } catch {
  }
}

export async function clearShelf(userId: string): Promise<void> {
  try {
    await AsyncStorage.removeItem(offlineKey(userId));
  } catch {
  }
}

/** The phone's retention choice. Device-wide, like the other reading settings. */
export async function readRetention(): Promise<OfflineRetention> {
  try {
    const raw = await AsyncStorage.getItem(RETENTION_KEY);
    if (raw === null) {
      return DEFAULT_RETENTION;
    }
    const parsed: unknown = JSON.parse(raw);
    return RETENTIONS.includes(parsed as OfflineRetention) ? (parsed as OfflineRetention) : DEFAULT_RETENTION;
  } catch {
    return DEFAULT_RETENTION;
  }
}

export async function writeRetention(retention: OfflineRetention): Promise<void> {
  try {
    await AsyncStorage.setItem(RETENTION_KEY, JSON.stringify(retention));
  } catch {
  }
}

/** The shelf without articles saved longer ago than `retention` allows. */
export function pruneShelf(
  shelf: OfflineShelf,
  retention: OfflineRetention,
  now: Date = new Date(),
): OfflineShelf {
  if (retention === null) {
    return shelf;
  }
  const cutoff = now.getTime() - retention * 86_400_000;
  return Object.fromEntries(
    Object.entries(shelf).filter(([, saved]) => {
      const at = Date.parse(saved.savedAt);
      // An unreadable date is kept rather than silently deleted.
      return Number.isNaN(at) || at >= cutoff;
    }),
  );
}
