import * as React from 'react';

import {ALERTS, type Alert, type County} from '@/data/static';

type CommunityContextValue = {
  county: County;
  setCounty: (county: County) => void;
  alerts: Alert[];
  /** Marks an alert as sent to the community. Local only until there is a backend. */
  markSent: (id: string) => void;
};

const CommunityContext = React.createContext<CommunityContextValue | null>(null);

/** The county being looked at, and the alerts for the whole app, in memory. */
export function CommunityProvider({children}: {children: React.ReactNode}) {
  const [county, setCounty] = React.useState<County>('Kiambu');
  const [alerts, setAlerts] = React.useState<Alert[]>(ALERTS);

  const value = React.useMemo<CommunityContextValue>(
    () => ({
      county,
      setCounty,
      alerts,
      markSent: id => setAlerts(prev => prev.map(a => (a.id === id ? {...a, status: 'sent'} : a))),
    }),
    [county, alerts],
  );

  return <CommunityContext.Provider value={value}>{children}</CommunityContext.Provider>;
}

export function useCommunity(): CommunityContextValue {
  const ctx = React.useContext(CommunityContext);
  if (!ctx) {
    throw new Error('useCommunity must be used inside <CommunityProvider>');
  }
  return ctx;
}
