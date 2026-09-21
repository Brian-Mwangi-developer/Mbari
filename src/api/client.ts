import AsyncStorage from '@react-native-async-storage/async-storage';

import {API_BASE_URL, API_TIMEOUT_MS, NATIVE_APP_ORIGIN} from './config';

/**
 * Thin fetch wrapper for the Mbari API (mbari-backend).
 *
 * The backend authenticates this app with `Authorization: Bearer <token>`
 * (better-auth's bearer plugin) because bare React Native has no cookie jar.
 */

const TOKEN_KEY = 'mbari.session.token';

let cachedToken: string | null = null;

export async function getToken(): Promise<string | null> {
  if (cachedToken !== null) {
    return cachedToken;
  }
  try {
    cachedToken = await AsyncStorage.getItem(TOKEN_KEY);
  } catch {
    // A device with storage unavailable simply behaves as signed out.
    cachedToken = null;
  }
  return cachedToken;
}

export async function setToken(token: string | null): Promise<void> {
  cachedToken = token;
  try {
    if (token) {
      await AsyncStorage.setItem(TOKEN_KEY, token);
    } else {
      await AsyncStorage.removeItem(TOKEN_KEY);
    }
  } catch {
    // Keep the in-memory token so the current session still works.
  }
}

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

type Options = {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  /** Skip the Authorization header (sign-in and sign-up). */
  anonymous?: boolean;
};

export async function apiFetch<T>(path: string, options: Options = {}): Promise<T> {
  const {method = 'GET', body, anonymous = false} = options;

  const headers: Record<string, string> = {
    Accept: 'application/json',
    Origin: NATIVE_APP_ORIGIN,
  };
  // FormData sets its own multipart Content-Type, with the boundary.
  const form = typeof FormData !== 'undefined' && body instanceof FormData;
  if (body !== undefined && !form) {
    headers['Content-Type'] = 'application/json';
  }
  if (!anonymous) {
    const token = await getToken();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
  }

 
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), API_TIMEOUT_MS);

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers,
      signal: controller.signal,
      ...(body !== undefined ? {body: form ? (body as FormData) : JSON.stringify(body)} : {}),
    });
  } catch (error) {
    const aborted = error instanceof Error && error.name === 'AbortError';
    throw new ApiError(
      aborted ? 'The server took too long to respond.' : "Can't reach Mbari.",
      0,
    );
  } finally {
    clearTimeout(timer);
  }

  const text = await response.text();
  const payload = text ? safeParse(text) : null;

  if (!response.ok) {
    const message =
      (payload as {message?: string} | null)?.message ??
      `Request failed (${response.status})`;
    throw new ApiError(message, response.status);
  }

  // Routes wrap results as { success, data }; better-auth returns bare objects.
  const envelope = payload as {data?: unknown} | null;
  return (envelope && 'data' in envelope ? envelope.data : payload) as T;
}

function safeParse(text: string): unknown {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}
