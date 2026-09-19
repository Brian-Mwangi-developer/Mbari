import * as React from 'react';

import {useAppearance} from '@/lib/appearance';

export const TYPEFACES = [
  {value: 'newsreader', label: 'Newsreader', fontFamily: 'Newsreader'},
  {value: 'jakarta', label: 'Jakarta', fontFamily: 'PlusJakartaSans'},
  {value: 'atkinson', label: 'Atkinson', fontFamily: 'AtkinsonHyperlegible'},
] as const;
export type Typeface = (typeof TYPEFACES)[number]['value'];

/** Body font sizes for each slider step. */
export const FONT_SIZES = [17, 19, 21, 23, 26] as const;

export const LINE_SPACINGS = [
  {value: 'tight', label: 'Tight', ratio: 1.45},
  {value: 'normal', label: 'Normal', ratio: 1.7},
  {value: 'loose', label: 'Loose', ratio: 1.95},
] as const;
export type LineSpacing = (typeof LINE_SPACINGS)[number]['value'];

export const READER_THEMES = {
  charcoal: {
    label: 'Charcoal',
    background: 'hsl(0 0% 7%)',
    surface: 'hsl(0 0% 11%)',
    foreground: 'hsl(40 30% 93%)',
    muted: 'hsl(0 0% 52%)',
    border: 'hsl(0 0% 18%)',
    highlight: 'hsl(38 60% 30%)',
    scheme: 'dark',
  },
  black: {
    label: 'True black',
    background: 'hsl(0 0% 0%)',
    surface: 'hsl(0 0% 8%)',
    foreground: 'hsl(40 30% 93%)',
    muted: 'hsl(0 0% 50%)',
    border: 'hsl(0 0% 16%)',
    highlight: 'hsl(38 60% 28%)',
    scheme: 'dark',
  },
  paper: {
    label: 'Paper',
    background: 'hsl(37 44% 96%)',
    surface: 'hsl(0 0% 100%)',
    foreground: 'hsl(30 10% 10%)',
    muted: 'hsl(30 6% 44%)',
    border: 'hsl(37 20% 86%)',
    highlight: 'hsl(38 85% 78%)',
    scheme: 'light',
  },
} as const;
export type ReaderThemeName = keyof typeof READER_THEMES;
export type ReaderTheme = (typeof READER_THEMES)[ReaderThemeName];

type Settings = {
  typeface: Typeface;
  /** Index into FONT_SIZES. */
  sizeStep: number;
  lineSpacing: LineSpacing;
  /** null follows the app appearance (dark → charcoal, light → paper). */
  theme: ReaderThemeName | null;
};

type ReaderSettingsContextValue = {
  settings: Settings;
  update: <K extends keyof Settings>(key: K, value: Settings[K]) => void;
  /** Resolved values ready to feed into styles. */
  resolved: {
    fontFamily: string;
    fontSize: number;
    lineHeight: number;
    themeName: ReaderThemeName;
    theme: ReaderTheme;
  };
};

const ReaderSettingsContext =
  React.createContext<ReaderSettingsContextValue | null>(null);

/** In-memory for now; persist alongside appearance once storage exists. */
export function ReaderSettingsProvider({children}: {children: React.ReactNode}) {
  const {resolved: scheme} = useAppearance();
  const [settings, setSettings] = React.useState<Settings>({
    typeface: 'newsreader',
    sizeStep: 2,
    lineSpacing: 'normal',
    theme: null,
  });

  const update = React.useCallback(
    <K extends keyof Settings>(key: K, value: Settings[K]) =>
      setSettings(prev => ({...prev, [key]: value})),
    [],
  );

  const value = React.useMemo<ReaderSettingsContextValue>(() => {
    const themeName =
      settings.theme ?? (scheme === 'dark' ? 'charcoal' : 'paper');
    const fontSize = FONT_SIZES[settings.sizeStep];
    const ratio = LINE_SPACINGS.find(l => l.value === settings.lineSpacing)!
      .ratio;
    return {
      settings,
      update,
      resolved: {
        fontFamily: TYPEFACES.find(t => t.value === settings.typeface)!
          .fontFamily,
        fontSize,
        lineHeight: Math.round(fontSize * ratio),
        themeName,
        theme: READER_THEMES[themeName],
      },
    };
  }, [settings, update, scheme]);

  return (
    <ReaderSettingsContext.Provider value={value}>
      {children}
    </ReaderSettingsContext.Provider>
  );
}

export function useReaderSettings(): ReaderSettingsContextValue {
  const ctx = React.useContext(ReaderSettingsContext);
  if (!ctx) {
    throw new Error(
      'useReaderSettings must be used inside <ReaderSettingsProvider>',
    );
  }
  return ctx;
}
