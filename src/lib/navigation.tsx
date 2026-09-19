import * as React from 'react';

export const TABS = ['Home', 'Community', 'Inbox', 'Settings'] as const;
export type Tab = (typeof TABS)[number];

/** Full-screen pages pushed over a tab; they hide the tab bar. */
export const DETAILS = [
  'timing',
  'appearance',
  'typeface',
  'forwarding',
  'library',
  'passedOver',
  'offline',
  'offlineRetention',
  'saved',
  'interests',
  'notifications',
] as const;
export type Detail = (typeof DETAILS)[number];

type DetailOptions = {
  /** For 'library': start with this search, e.g. from the drawer's field. */
  query?: string;
};

type NavigationContextValue = {
  tab: Tab;
  setTab: (tab: Tab) => void;
  detail: Detail | null;
  /** The search the current detail was opened with, if any. */
  detailQuery: string;
  openDetail: (detail: Detail, options?: DetailOptions) => void;
  closeDetail: () => void;
  /** The alert being prepared for sending, shown over the tabs. */
  sendingId: string | null;
  openSend: (alertId: string) => void;
  closeSend: () => void;
};

const NavigationContext = React.createContext<NavigationContextValue | null>(
  null,
);

/**
 * Minimal tab state. Swap for React Navigation when stacks (article detail,
 * auth) are needed; screens only depend on this hook so the change is local.
 */
export function NavigationProvider({children}: {children: React.ReactNode}) {
  const [tab, setTabState] = React.useState<Tab>('Home');
  const [detail, setDetail] = React.useState<Detail | null>(null);
  const [detailQuery, setDetailQuery] = React.useState('');
  const [sendingId, setSendingId] = React.useState<string | null>(null);

  const value = React.useMemo<NavigationContextValue>(
    () => ({
      tab,
      // Switching tabs always lands on the tab's root.
      setTab: next => {
        setDetail(null);
        setSendingId(null);
        setTabState(next);
      },
      detail,
      detailQuery,
      openDetail: (next, options) => {
        setDetailQuery(options?.query ?? '');
        setDetail(next);
      },
      closeDetail: () => {
        setDetailQuery('');
        setDetail(null);
      },
      sendingId,
      openSend: setSendingId,
      closeSend: () => setSendingId(null),
    }),
    [tab, detail, detailQuery, sendingId],
  );

  return (
    <NavigationContext.Provider value={value}>
      {children}
    </NavigationContext.Provider>
  );
}

export function useNavigation(): NavigationContextValue {
  const ctx = React.useContext(NavigationContext);
  if (!ctx) {
    throw new Error('useNavigation must be used inside <NavigationProvider>');
  }
  return ctx;
}
