import AsyncStorage from '@react-native-async-storage/async-storage';
import {getApps} from '@react-native-firebase/app';
import {
  deleteToken,
  getInitialNotification,
  getMessaging,
  getToken,
  onMessage,
  onNotificationOpenedApp,
  onTokenRefresh,
  setBackgroundMessageHandler,
  type RemoteMessage,
} from '@react-native-firebase/messaging';
import {PermissionsAndroid, Platform} from 'react-native';

import * as api from '@/api';
import {APP_VERSION} from '@/lib/app-info';

/**
 * Push notifications through Firebase Cloud Messaging.
 *
 * Everything here degrades to "not available" when the build has no Firebase
 * config (android/app/google-services.json), so the app runs the same without
 * it and the Notifications screen can say why nothing arrives.
 */

export type PushPermission = 'granted' | 'undetermined' | 'denied' | 'blocked';

/** A notification the reader can act on. */
export type RecommendationPush = {
  itemId: string;
  deliveryId: string | null;
  title: string;
  body: string;
};

const ASKED_KEY = 'mbari.push.asked.v1';
const TOKEN_KEY = 'mbari.push.token.v1';

/** Whether this build carries a Firebase config. */
export function pushAvailable(): boolean {
  try {
    return getApps().length > 0;
  } catch {
    return false;
  }
}

/** Reads a push we sent; anything else (or malformed) is ignored. */
export function parseRecommendation(message: RemoteMessage | null | undefined): RecommendationPush | null {
  const data = message?.data;
  const itemId = typeof data?.itemId === 'string' ? data.itemId : null;
  if (!message || data?.type !== 'recommendation' || !itemId) {
    return null;
  }
  return {
    itemId,
    deliveryId: typeof data.deliveryId === 'string' ? data.deliveryId : null,
    title: message.notification?.title ?? '',
    body: message.notification?.body ?? '',
  };
}

/** Before Android 13 notifications need no runtime permission. */
const needsRuntimePermission = () => Platform.OS === 'android' && Number(Platform.Version) >= 33;

export async function readPermission(): Promise<PushPermission> {
  if (!needsRuntimePermission()) {
    return 'granted';
  }
  if (await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS)) {
    return 'granted';
  }
  const asked = await AsyncStorage.getItem(ASKED_KEY).catch(() => null);
  return asked === 'blocked' ? 'blocked' : asked ? 'denied' : 'undetermined';
}

/**
 * Asks Android for permission. After a second refusal Android stops showing
 * the dialog; that is reported as "blocked", so the app can point to settings.
 */
export async function requestPermission(): Promise<PushPermission> {
  if (!needsRuntimePermission()) {
    return 'granted';
  }
  const result = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS);
  const permission: PushPermission =
    result === PermissionsAndroid.RESULTS.GRANTED ? 'granted' : result === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN ? 'blocked' : 'denied';
  await AsyncStorage.setItem(ASKED_KEY, permission === 'granted' ? 'asked' : permission).catch(() => {});
  return permission;
}

/**
 * Registers this install's token with the backend, and keeps it registered as
 * FCM rotates it. Returns a stop function.
 */
export async function registerForPush(): Promise<() => void> {
  if (!pushAvailable()) {
    return () => {};
  }
  const messaging = getMessaging();
  const register = async (token: string) => {
    await api.registerDevice(token, APP_VERSION);
    await AsyncStorage.setItem(TOKEN_KEY, token).catch(() => {});
  };
  await register(await getToken(messaging));
  return onTokenRefresh(messaging, token => {
    register(token).catch(() => {});
  });
}

/** On sign-out: this install stops receiving the signed-out reader's notifications. */
export async function unregisterFromPush(): Promise<void> {
  const token = await AsyncStorage.getItem(TOKEN_KEY).catch(() => null);
  if (token) {
    await api.unregisterDevice(token).catch(() => {});
    await AsyncStorage.removeItem(TOKEN_KEY).catch(() => {});
  }
  if (pushAvailable()) {
    // A fresh token next time, so a new account never inherits the old one.
    await deleteToken(getMessaging()).catch(() => {});
  }
}

/**
 * Taps on our notifications (from the background, or the one that launched
 * the app) and pushes that arrive while the app is open. Returns a stop function.
 */
export function listenForPush(handlers: {
  onOpen: (push: RecommendationPush) => void;
  onForeground: (push: RecommendationPush) => void;
}): () => void {
  if (!pushAvailable()) {
    return () => {};
  }
  const messaging = getMessaging();
  getInitialNotification(messaging)
    .then(message => {
      const push = parseRecommendation(message);
      if (push) {
        handlers.onOpen(push);
      }
    })
    .catch(() => {});
  const stopOpened = onNotificationOpenedApp(messaging, message => {
    const push = parseRecommendation(message);
    if (push) {
      handlers.onOpen(push);
    }
  });
  const stopForeground = onMessage(messaging, message => {
    const push = parseRecommendation(message);
    if (push) {
      handlers.onForeground(push);
    }
  });
  return () => {
    stopOpened();
    stopForeground();
  };
}

/**
 * Registered from index.js, before the app mounts. Notification messages are
 * shown by Android itself; this only keeps FCM from warning that no headless
 * handler exists when one arrives with the app closed.
 */
export function registerBackgroundHandler(): void {
  if (pushAvailable()) {
    setBackgroundMessageHandler(getMessaging(), async () => {});
  }
}
