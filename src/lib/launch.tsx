import * as React from 'react';

type LaunchContextValue = {
  /** The launch screen is still up. */
  launching: boolean;
  finish: () => void;
};

const LaunchContext = React.createContext<LaunchContextValue | null>(null);

export function LaunchProvider({children}: {children: React.ReactNode}) {
  const [launching, setLaunching] = React.useState(true);
  const value = React.useMemo<LaunchContextValue>(
    () => ({launching, finish: () => setLaunching(false)}),
    [launching],
  );
  return <LaunchContext.Provider value={value}>{children}</LaunchContext.Provider>;
}

export function useLaunch(): LaunchContextValue {
  const ctx = React.useContext(LaunchContext);
  if (!ctx) {
    throw new Error('useLaunch must be used inside <LaunchProvider>');
  }
  return ctx;
}
