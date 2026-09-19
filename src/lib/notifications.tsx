import * as React from 'react';
import {AppState, Linking} from 'react-native';

import * as api from '@/api';
import {
  listenForPush,
  pushAvailable,
  readPermission,
  registerForPush,
  requestPermission,
  type PushPermission,
  type RecommendationPush,
} from '@/lib/push';
import {useReader} from '@/lib/reader';
import {deviceTimeZone} from '@/lib/schedule';
import {useSession} from '@/lib/session';

type NotificationsContextValue = {
  /** This build can receive pushes at all (it has a Firebase config). */
  available: boolean;
  permission: PushPermission;
  /** This install's token is registered with the server. */
  registered: boolean;
  /** A push that arrived while the app was open. */
  banner: RecommendationPush | null;
  dismissBanner: () => void;
  openPush: (push: RecommendationPush) => void;
  /** Asks for permission (or opens system settings once Android stops asking) and registers. */
  enable: () => Promise<PushPermission>;
};

const NotificationsContext = React.createContext<NotificationsContextValue | null>(null);

const BANNER_MS = 8_000;

/**
 * Push notifications for the signed-in reader: keeps the server's idea of
 * their timezone in step with the phone, registers this install, opens the
 * article a notification points at, and shows one that arrives in the app.
 */
export function NotificationsProvider({children}: {children: React.ReactNode}) {
  const {account, refresh} = useSession();
  const reader = useReader();
  const available = React.useMemo(pushAvailable, []);
  const [permission, setPermission] = React.useState<PushPermission>('undetermined');
  const [registered, setRegistered] = React.useState(false);
  const [banner, setBanner] = React.useState<RecommendationPush | null>(null);
  const openReader = React.useRef(reader.open);
  openReader.current = reader.open;

  // Delivery windows are local times, so the server has to know which "local".
  // Checked on sign-in and whenever the app comes back, since phones travel.
  const syncTimeZone = React.useCallback(async () => {
    const zone = deviceTimeZone();
    if (account && zone && zone !== account.timezone) {
      await api.updateProfile({timezone: zone}).catch(() => {});
      await refresh();
    }
  }, [account, refresh]);

  const register = React.useCallback(async () => {
    if (!available) {
      return;
    }
    try {
      await registerForPush();
      setRegistered(true);
    } catch {
      setRegistered(false);
    }
  }, [available]);

  React.useEffect(() => {
    if (!account) {
      return;
    }
    syncTimeZone().catch(() => {});
    readPermission()
      .then(current => {
        setPermission(current);
        if (current === 'granted') {
          register().catch(() => {});
        }
      })
      .catch(() => {});
    // Once per account: token refreshes are handled inside registerForPush.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [account?.id]);

  React.useEffect(() => {
    const sub = AppState.addEventListener('change', state => {
      if (state === 'active') {
        syncTimeZone().catch(() => {});
        // The reader may have switched notifications on in system settings.
        readPermission()
          .then(current => {
            setPermission(prev => {
              if (current === 'granted' && prev !== 'granted') {
                register().catch(() => {});
              }
              return current;
            });
          })
          .catch(() => {});
      }
    });
    return () => sub.remove();
  }, [syncTimeZone, register]);

  const openPush = React.useCallback((push: RecommendationPush) => {
    setBanner(null);
    openReader.current(push.itemId);
    if (push.deliveryId) {
      api.notificationOpened(push.deliveryId).catch(() => {});
    }
  }, []);

  React.useEffect(
    () =>
      listenForPush({
        onOpen: openPush,
        onForeground: push => setBanner(push),
      }),
    [openPush],
  );

  React.useEffect(() => {
    if (!banner) {
      return;
    }
    const timer = setTimeout(() => setBanner(null), BANNER_MS);
    return () => clearTimeout(timer);
  }, [banner]);

  const value = React.useMemo<NotificationsContextValue>(
    () => ({
      available,
      permission,
      registered,
      banner,
      dismissBanner: () => setBanner(null),
      openPush,
      enable: async () => {
        if (permission === 'blocked') {
          await Linking.openSettings();
          return permission;
        }
        const next = await requestPermission();
        setPermission(next);
        if (next === 'granted') {
          await register();
        }
        return next;
      },
    }),
    [available, permission, registered, banner, openPush, register],
  );

  return <NotificationsContext.Provider value={value}>{children}</NotificationsContext.Provider>;
}

export function useNotifications(): NotificationsContextValue {
  const ctx = React.useContext(NotificationsContext);
  if (!ctx) {
    throw new Error('useNotifications must be used inside <NotificationsProvider>');
  }
  return ctx;
}
