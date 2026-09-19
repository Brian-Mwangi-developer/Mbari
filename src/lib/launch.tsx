import * as React from 'react';

export type Rect = {x: number; y: number; width: number; height: number};

type LaunchContextValue = {
  /** The launch screen is still up, or still handing its mark over. */
  launching: boolean;
  /** Where the landing screen will draw the mark, in window coordinates. */
  hero: Rect | null;
  setHero: (rect: Rect | null) => void;
  finish: () => void;
};

const LaunchContext = React.createContext<LaunchContextValue | null>(null);

/**
 * Lets the launch screen fly its mark to the exact spot the landing screen
 * draws one, so opening the app reads as one continuous motion.
 */
export function LaunchProvider({children}: {children: React.ReactNode}) {
  const [launching, setLaunching] = React.useState(true);
  const [hero, setHero] = React.useState<Rect | null>(null);
  const value = React.useMemo<LaunchContextValue>(
    () => ({launching, hero, setHero, finish: () => setLaunching(false)}),
    [launching, hero],
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
