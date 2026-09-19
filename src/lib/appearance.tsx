import * as React from 'react';
import {useColorScheme as useNativeWindColorScheme} from 'nativewind';

export type Appearance = 'system' | 'light' | 'dark';

type AppearanceContextValue = {
  appearance: Appearance;
  setAppearance: (value: Appearance) => void;
  /** The scheme actually in effect after resolving "system". */
  resolved: 'light' | 'dark';
};

const AppearanceContext = React.createContext<AppearanceContextValue | null>(
  null,
);

/**
 * Wraps NativeWind's colour-scheme control so screens can offer
 * System / Light / Dark. The choice lives in memory for now; persist it
 * (MMKV/AsyncStorage) once we have a storage layer.
 */
export function AppearanceProvider({children}: {children: React.ReactNode}) {
  const {colorScheme, setColorScheme} = useNativeWindColorScheme();
  const [appearance, setAppearanceState] = React.useState<Appearance>('system');

  const setAppearance = React.useCallback(
    (value: Appearance) => {
      setAppearanceState(value);
      setColorScheme(value);
    },
    [setColorScheme],
  );

  const value = React.useMemo<AppearanceContextValue>(
    () => ({
      appearance,
      setAppearance,
      resolved: colorScheme === 'dark' ? 'dark' : 'light',
    }),
    [appearance, setAppearance, colorScheme],
  );

  return (
    <AppearanceContext.Provider value={value}>
      {children}
    </AppearanceContext.Provider>
  );
}

export function useAppearance(): AppearanceContextValue {
  const ctx = React.useContext(AppearanceContext);
  if (!ctx) {
    throw new Error('useAppearance must be used inside <AppearanceProvider>');
  }
  return ctx;
}
