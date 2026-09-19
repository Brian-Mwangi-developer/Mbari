import * as React from 'react';

import * as api from '@/api';
import type {DeliverySettings, DeliveryWindow, SavedDeliveryWindow, TestNotificationResult} from '@/api';
import {useSession} from '@/lib/session';

type DeliveryContextValue = {
  settings: DeliverySettings | null;
  loading: boolean;
  error: string | null;
  reload: () => void;
  /** Windows that can fire — shown on the Settings row. */
  activeWindows: number;
  setWindowEnabled: (id: string, enabled: boolean) => Promise<void>;
  /** Adds a window without an id, or replaces the one with a matching id. */
  saveWindow: (window: DeliveryWindow) => Promise<void>;
  removeWindow: (id: string) => Promise<void>;
  setNotificationsEnabled: (enabled: boolean) => Promise<void>;
  setPerDay: (perDay: number) => Promise<void>;
  sendTest: () => Promise<TestNotificationResult>;
};

const DeliveryContext = React.createContext<DeliveryContextValue | null>(null);

const toInput = ({id, label, start, end, days, enabled}: SavedDeliveryWindow | DeliveryWindow): DeliveryWindow => ({
  ...(id ? {id} : {}),
  label,
  start,
  end,
  days,
  enabled,
});

/**
 * When Mbari may push a recommendation: the reader's windows, in their own
 * timezone, stored on the server that schedules them. Changes show at once and
 * roll back if the server refuses them.
 */
export function DeliveryProvider({children}: {children: React.ReactNode}) {
  const {account} = useSession();
  const [settings, setSettings] = React.useState<DeliverySettings | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const settingsRef = React.useRef(settings);
  settingsRef.current = settings;

  const reload = React.useCallback(() => {
    setLoading(true);
    api.getDelivery().then(
      next => {
        setSettings(next);
        setError(null);
        setLoading(false);
      },
      (e: unknown) => {
        setError(e instanceof Error ? e.message : 'Could not load your timing.');
        setLoading(false);
      },
    );
  }, []);

  // The account's timezone changes when the phone moves zones; refetch so the
  // next-notification times reflect it.
  React.useEffect(() => {
    if (account) {
      reload();
    }
  }, [account, account?.timezone, reload]);

  /** Applies a change on screen at once, then keeps the server's answer, or undoes it. */
  const optimistic = React.useCallback(
    async (preview: (current: DeliverySettings) => DeliverySettings, commit: () => Promise<DeliverySettings>) => {
      const before = settingsRef.current;
      if (before) {
        setSettings(preview(before));
      }
      try {
        setSettings(await commit());
        setError(null);
      } catch (e) {
        setSettings(before);
        throw e;
      }
    },
    [],
  );

  const value = React.useMemo<DeliveryContextValue>(() => {
    const windows = settings?.windows ?? [];
    const replace = (next: SavedDeliveryWindow[]) =>
      optimistic(
        current => ({...current, windows: next}),
        () => api.saveDeliveryWindows(next.map(toInput)),
      );

    return {
      settings,
      loading,
      error,
      reload,
      activeWindows: settings?.notificationsEnabled ? windows.filter(w => w.enabled).length : 0,
      setWindowEnabled: (id, enabled) => replace(windows.map(w => (w.id === id ? {...w, enabled} : w))),
      saveWindow: window => {
        const exists = window.id && windows.some(w => w.id === window.id);
        const next: SavedDeliveryWindow[] = exists
          ? windows.map(w => (w.id === window.id ? {...w, ...window, id: w.id} : w))
          : [...windows, {...window, id: `new-${Date.now()}`, nextAt: null}];
        // Temporary ids never reach the server; it assigns real ones.
        return optimistic(
          current => ({...current, windows: next}),
          () => api.saveDeliveryWindows(next.map(w => toInput(w.id.startsWith('new-') ? {...w, id: undefined} : w))),
        );
      },
      removeWindow: id => replace(windows.filter(w => w.id !== id)),
      setNotificationsEnabled: enabled =>
        optimistic(
          current => ({...current, notificationsEnabled: enabled}),
          () => api.updateDelivery({notificationsEnabled: enabled}),
        ),
      setPerDay: perDay =>
        optimistic(
          current => ({...current, perDay}),
          () => api.updateDelivery({perDay}),
        ),
      sendTest: () => api.sendTestNotification(),
    };
  }, [settings, loading, error, reload, optimistic]);

  return <DeliveryContext.Provider value={value}>{children}</DeliveryContext.Provider>;
}

export function useDelivery(): DeliveryContextValue {
  const ctx = React.useContext(DeliveryContext);
  if (!ctx) {
    throw new Error('useDelivery must be used inside <DeliveryProvider>');
  }
  return ctx;
}
