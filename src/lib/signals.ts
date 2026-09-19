import AsyncStorage from '@react-native-async-storage/async-storage';

import * as api from '@/api';
import type {ClientEvent, SignalBody, SignalResult} from '@/api';

/**
 * Reader signals (like, save, pass, reading progress) and telemetry (card
 * views), sent without ever making the reader wait.
 *
 * Each one gets a client id before it leaves the phone, so a retry after a
 * dropped connection is recognised by the server and counted once. Anything
 * that could not be sent is kept on the device and retried with backoff —
 * including across restarts.
 */

type PendingSignal = {kind: 'signal'; itemId: string; body: SignalBody & {clientEventId: string}; attempts: number};
type PendingEvent = {kind: 'event'; event: ClientEvent; attempts: number};
type Pending = PendingSignal | PendingEvent;

export type LocalSignal = {itemId: string; type: SignalBody['type']};

const KEY_PREFIX = 'mbari.signals.v1.';
const MAX_PENDING = 500;
const EVENT_BATCH = 100;
const FLUSH_EVENTS_MS = 20_000;

let userId: string | null = null;
let queue: Pending[] = [];
let flushing = false;
let retryTimer: ReturnType<typeof setTimeout> | null = null;
let eventTimer: ReturnType<typeof setInterval> | null = null;
const listeners = new Set<(signal: LocalSignal) => void>();

export function newClientEventId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
}

const storageKey = (id: string) => `${KEY_PREFIX}${id}`;

async function persist(): Promise<void> {
  if (!userId) {
    return;
  }
  try {
    await AsyncStorage.setItem(storageKey(userId), JSON.stringify(queue));
  } catch {
    // Kept in memory; the next successful write catches up.
  }
}

/** Server-side problems and no connection are worth retrying; a 4xx is not. */
function retryable(error: unknown): boolean {
  return error instanceof api.ApiError && (error.status === 0 || error.status === 429 || error.status >= 500);
}

function scheduleRetry(attempts: number): void {
  if (retryTimer) {
    return;
  }
  const delay = Math.min(60_000, 2_000 * 2 ** Math.min(attempts, 5));
  retryTimer = setTimeout(() => {
    retryTimer = null;
    flush().catch(() => {});
  }, delay);
}

function trim(): void {
  if (queue.length <= MAX_PENDING) {
    return;
  }
  // Telemetry goes first; a like is worth more than a card view.
  const overflow = queue.length - MAX_PENDING;
  let dropped = 0;
  queue = queue.filter(entry => (entry.kind === 'event' && dropped < overflow ? (dropped++, false) : true));
  queue = queue.slice(-MAX_PENDING);
}

export async function flush(): Promise<void> {
  if (flushing || !userId || queue.length === 0) {
    return;
  }
  flushing = true;
  try {
    // Signals in order, one at a time: "like" then "unlike" must arrive in that order.
    while (queue.some(entry => entry.kind === 'signal')) {
      const entry = queue.find((e): e is PendingSignal => e.kind === 'signal')!;
      try {
        await api.sendSignal(entry.itemId, entry.body);
        queue = queue.filter(e => e !== entry);
      } catch (error) {
        if (!retryable(error)) {
          queue = queue.filter(e => e !== entry);
          continue;
        }
        entry.attempts++;
        scheduleRetry(entry.attempts);
        return;
      }
    }

    while (queue.some(entry => entry.kind === 'event')) {
      const batch = queue.filter((e): e is PendingEvent => e.kind === 'event').slice(0, EVENT_BATCH);
      try {
        await api.sendEvents(batch.map(entry => entry.event));
        queue = queue.filter(e => !batch.includes(e as PendingEvent));
      } catch (error) {
        if (!retryable(error)) {
          queue = queue.filter(e => !batch.includes(e as PendingEvent));
          continue;
        }
        batch.forEach(entry => entry.attempts++);
        scheduleRetry(batch[0]!.attempts);
        return;
      }
    }
  } finally {
    flushing = false;
    await persist();
  }
}

/**
 * Sends a reader signal now, or as soon as it can be. Resolves with the
 * server's answer when it arrives straight away, and with null when it had to
 * be queued; either way the reader's action already counts on screen.
 */
export async function signal(itemId: string, body: SignalBody): Promise<SignalResult | null> {
  const withId = {...body, clientEventId: body.clientEventId ?? newClientEventId()};
  listeners.forEach(listener => listener({itemId, type: body.type}));

  if (userId && queue.every(entry => entry.kind !== 'signal')) {
    try {
      return await api.sendSignal(itemId, withId);
    } catch (error) {
      if (!retryable(error)) {
        return null;
      }
    }
  }
  queue.push({kind: 'signal', itemId, body: withId, attempts: 0});
  trim();
  await persist();
  scheduleRetry(0);
  return null;
}

/** Records a telemetry event; sent in batches. */
export function track(event: Omit<ClientEvent, 'clientEventId' | 'occurredAt'>): void {
  if (!userId) {
    return;
  }
  queue.push({
    kind: 'event',
    event: {...event, clientEventId: newClientEventId(), occurredAt: new Date().toISOString()},
    attempts: 0,
  });
  trim();
  if (queue.filter(entry => entry.kind === 'event').length >= EVENT_BATCH) {
    flush().catch(() => {});
  }
}

/** Hears every signal as it is made, so a like in the reader shows on the card too. */
export function onSignal(listener: (signal: LocalSignal) => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

/** Starts the queue for a signed-in account, picking up anything left from last time. */
export async function startSignals(account: string): Promise<void> {
  if (userId === account) {
    return;
  }
  stopSignals();
  userId = account;
  try {
    const raw = await AsyncStorage.getItem(storageKey(account));
    const parsed: unknown = raw ? JSON.parse(raw) : [];
    // Merge: a signal made while storage was being read must not be dropped.
    queue = [...(Array.isArray(parsed) ? (parsed as Pending[]) : []), ...queue];
  } catch {
    // Keep whatever was queued in memory.
  }
  eventTimer = setInterval(() => {
    flush().catch(() => {});
  }, FLUSH_EVENTS_MS);
  flush().catch(() => {});
}

/** On sign-out: this account's pending signals stay on the device for its next sign-in. */
export function stopSignals(): void {
  if (retryTimer) {
    clearTimeout(retryTimer);
  }
  if (eventTimer) {
    clearInterval(eventTimer);
  }
  retryTimer = null;
  eventTimer = null;
  userId = null;
  queue = [];
}

/** For tests. */
export function pendingCount(): number {
  return queue.length;
}
