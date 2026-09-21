import {apiFetch, setToken} from './client';
import type {
  Account,
  DeliverySettings,
  DeliveryWindow,
  TestNotificationResult,
  ClientEvent,
  ReaderInterests,
  SavedItem,
  SignalBody,
  SignalResult,
  TodayDeck,
  GmailFilterMode,
  InboxAddress,
  UnreadExpiryDays,
  LibraryItem,
  LibraryPage,
  PassedOverItem,
  PendingSource,
  Article,
  ArchiveItem,
  Feed,
  DemoInfo,
  AlertPage,
  AlertEvidence,
  WireAlert,
  Role,
  Organization,
  VoiceMessage,
} from './types';

/** Every backend call the app makes, in one place. */

// ── Auth ──────────────────────────────────────────────────────────────────────

type AuthResponse = {token?: string; user?: {id: string}};

async function authenticate(path: string, body: unknown): Promise<void> {
  const result = await apiFetch<AuthResponse>(path, {
    method: 'POST',
    body,
    anonymous: true,
  });
  if (!result?.token) {
    throw new Error('The server did not return a session token.');
  }
  await setToken(result.token);
}

export const signUp = (email: string, password: string, name: string) =>
  authenticate('/api/auth/sign-up/email', {email, password, name});

export const signIn = (email: string, password: string) =>
  authenticate('/api/auth/sign-in/email', {email, password});


export const signInWithGoogle = (idToken: string, nonce: string) =>
  authenticate('/api/auth/sign-in/social', {
    provider: 'google',
    idToken: {token: idToken, nonce},
  });

export async function signOut(): Promise<void> {
  try {
    await apiFetch('/api/auth/sign-out', {method: 'POST'});
  } catch {
    // Even if the server call fails, drop the local token so the device is
    // signed out from the user's point of view.
  }
  await setToken(null);
}

// ── Profile ───────────────────────────────────────────────────────────────────

/** What GET /api/v1/me returns. */
type MeResponse = {
  id: string;
  name: string;
  email: string;
  image: string | null;
  role: Role;
  onboardingDone: boolean;
  organization: Organization | null;
  counties: string[];
  topics: string[];
};

/**
 * The signed-in account. The backend has no timezone or library settings; the
 * fields the older screens still read get fixed values here.
 */
export async function getAccount(): Promise<Account> {
  const me = await apiFetch<MeResponse>('/api/v1/me');
  return {
    ...me,
    timezone: 'Africa/Nairobi',
    interests: me.topics,
    unreadExpiryDays: 14,
  };
}

/** The demo logins the sign-in screen offers. Public; `enabled: false` hides them. */
export const getDemo = () => apiFetch<DemoInfo>('/api/v1/demo', {anonymous: true});

export const updateProfile = (patch: {
  timezone?: string;
  interests?: string[];
  onboardingDone?: boolean;
  unreadExpiryDays?: UnreadExpiryDays;
}) => apiFetch<{timezone: string; interests: string[]; unreadExpiryDays: UnreadExpiryDays}>('/api/v1/me', {
  method: 'PATCH',
  body: patch,
});

// ── Alerts ────────────────────────────────────────────────────────────────────

/** Newest first. National alerts come with every county. */
export const getAlerts = (county: string, limit = 30) =>
  apiFetch<AlertPage>(`/api/v1/alerts?county=${encodeURIComponent(county)}&limit=${limit}`);

/** The source, fingerprint and page text behind an alert. */
export const getAlertEvidence = (id: string) =>
  apiFetch<AlertEvidence>(`/api/v1/alerts/${encodeURIComponent(id)}/evidence`);

/**
 * "Send to community": the alert waits for an NGO approver. Nothing goes out
 * yet. A translated voice message goes with it for the approver to hear.
 */
export const requestSend = (id: string, voiceMessageId?: string) =>
  apiFetch<WireAlert>(`/api/v1/alerts/${encodeURIComponent(id)}/request-send`, {
    method: 'POST',
    body: voiceMessageId ? {voiceMessageId} : {},
  });

// ── Voice ─────────────────────────────────────────────────────────────────────

/**
 * "Translate to Gĩkũyũ": uploads the recording. The server works through it
 * in the background; poll getVoice until it is ready or failed.
 */
export function translateRecording(recording: {uri: string; durationMs: number}, alertId?: string): Promise<VoiceMessage> {
  const form = new FormData();
  // React Native reads the file from the uri when it sends the form.
  form.append('audio', {uri: recording.uri, name: 'voice.m4a', type: 'audio/mp4'} as unknown as Blob);
  form.append('durationMs', String(Math.round(recording.durationMs)));
  form.append('language', 'kik');
  if (alertId) {
    form.append('alertId', alertId);
  }
  return apiFetch<VoiceMessage>('/api/v1/voice', {method: 'POST', body: form});
}

export const getVoice = (id: string) => apiFetch<VoiceMessage>(`/api/v1/voice/${encodeURIComponent(id)}`);

export const retryVoice = (id: string) =>
  apiFetch<VoiceMessage>(`/api/v1/voice/${encodeURIComponent(id)}/retry`, {method: 'POST'});

// ── Content ───────────────────────────────────────────────────────────────────

/**
 * The rolling queue. Pass the card on screen: the server re-ranks what is
 * behind it with the latest signals and leaves that card and the next alone.
 */
export const getToday = (currentId?: string | null) =>
  apiFetch<TodayDeck>(`/api/v1/today${currentId ? `?current=${encodeURIComponent(currentId)}` : ''}`);

export const getArchive = () => apiFetch<ArchiveItem[]>('/api/v1/archive');

export const getArticle = (id: string) =>
  apiFetch<Article>(`/api/v1/articles/${encodeURIComponent(id)}`);

/** One reader signal. Prefer `signal()` from lib/signals, which queues and retries. */
export const sendSignal = (id: string, body: SignalBody) =>
  apiFetch<SignalResult>(`/api/v1/articles/${encodeURIComponent(id)}/signal`, {
    method: 'POST',
    body,
  });

/** A batch of telemetry. Answered 202 once queued on the server. */
export const sendEvents = (events: ClientEvent[]) =>
  apiFetch<{accepted: number}>('/api/v1/events', {method: 'POST', body: {events}});

// ── Interests ─────────────────────────────────────────────────────────────────

export const getInterests = () => apiFetch<ReaderInterests>('/api/v1/me/interests');

export const setInterests = (interests: string[]) =>
  apiFetch<ReaderInterests>('/api/v1/me/interests', {method: 'PUT', body: {interests}});

export const setInterestHidden = (slug: string, hidden: boolean) =>
  apiFetch<ReaderInterests>(
    `/api/v1/me/interests/${encodeURIComponent(slug)}/${hidden ? 'hide' : 'show'}`,
    {method: 'POST'},
  );

// ── Notifications ─────────────────────────────────────────────────────────────

export const getDelivery = () => apiFetch<DeliverySettings>('/api/v1/me/delivery');

export const updateDelivery = (patch: {notificationsEnabled?: boolean; perDay?: number}) =>
  apiFetch<DeliverySettings>('/api/v1/me/delivery', {method: 'PATCH', body: patch});

/** Replaces every window; ones missing from the list are removed. */
export const saveDeliveryWindows = (windows: DeliveryWindow[]) =>
  apiFetch<DeliverySettings>('/api/v1/me/delivery/windows', {method: 'PUT', body: {windows}});

export const sendTestNotification = () =>
  apiFetch<TestNotificationResult>('/api/v1/me/delivery/test', {method: 'POST'});

export const registerDevice = (token: string, appVersion: string) =>
  apiFetch<{registered: boolean}>('/api/v1/devices', {method: 'POST', body: {token, platform: 'android', appVersion}});

export const unregisterDevice = (token: string) =>
  apiFetch<{registered: boolean}>(`/api/v1/devices/${encodeURIComponent(token)}`, {method: 'DELETE'});

export const notificationOpened = (deliveryId: string) =>
  apiFetch<{opened: boolean}>(`/api/v1/notifications/${encodeURIComponent(deliveryId)}/opened`, {method: 'POST'});

// ── Library ───────────────────────────────────────────────────────────────────

/** Everything pulled for this user, newest first, a page at a time. */
export const getLibrary = (cursor?: string | null) =>
  apiFetch<LibraryPage>(
    `/api/v1/library${cursor ? `?cursor=${encodeURIComponent(cursor)}` : ''}`,
  );

/** Picks the user skipped or never opened. */
export const getPassedOver = () =>
  apiFetch<PassedOverItem[]>('/api/v1/library/passed');

/** Saved for later, most recent save first. */
export const getSaved = () => apiFetch<SavedItem[]>('/api/v1/library/saved');

/** Search the user's own library. The server needs at least two characters. */
export const searchLibrary = (query: string) =>
  apiFetch<LibraryItem[]>(
    `/api/v1/library/search?q=${encodeURIComponent(query)}`,
  );

// ── Sources ───────────────────────────────────────────────────────────────────

export const getSources = () => apiFetch<Feed[]>('/api/v1/sources');

export const addSource = (url: string) =>
  apiFetch<Feed>('/api/v1/sources', {method: 'POST', body: {url}});

export const setSourceMuted = (id: string, muted: boolean) =>
  apiFetch<{id: string; muted: boolean}>(`/api/v1/sources/${encodeURIComponent(id)}`, {
    method: 'PATCH',
    body: {muted},
  });

export const removeSource = (id: string) =>
  apiFetch<{id: string}>(`/api/v1/sources/${encodeURIComponent(id)}`, {
    method: 'DELETE',
  });


export const getAddress = () => apiFetch<InboxAddress>('/api/v1/me/address');

/**
 * Record that the user recognised the forwarding request, and receive
 * Google's confirmation link to open. The backend never opens it itself.
 */
export const confirmForwarding = (id: string) =>
  apiFetch<{confirmUrl: string}>(
    `/api/v1/me/forwarding/${encodeURIComponent(id)}/confirm`,
    {method: 'POST'},
  );

/** A 15-minute link to the Gmail filter file, to share to a computer. */
export const createGmailFilterLink = (mode: GmailFilterMode = 'newsletters') =>
  apiFetch<{url: string; expiresAt: string}>('/api/v1/me/gmail-filter/link', {
    method: 'POST',
    body: {mode},
  });

// ── Source review ─────────────────────────────────────────────────────────────

export const getPendingSources = () =>
  apiFetch<PendingSource[]>('/api/v1/sources/pending');

export const keepSource = (id: string) =>
  apiFetch<{id: string; status: string}>(
    `/api/v1/sources/${encodeURIComponent(id)}/keep`,
    {method: 'POST'},
  );

export const ignoreSource = (id: string) =>
  apiFetch<{id: string; status: string}>(
    `/api/v1/sources/${encodeURIComponent(id)}/ignore`,
    {method: 'POST'},
  );

export {ApiError, getToken, setToken} from './client';
export * from './types';
