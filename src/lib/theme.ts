import {useAppearance} from '@/lib/appearance';

// Mirrors the CSS variables in global.css for places that need raw colour
// values (icons, SVG, StatusBar) rather than classNames.
export const THEME = {
  light: {
    background: '#F9F5EF',
    foreground: '#1B1712',
    card: '#FFFFFF',
    surface: '#F1EBE2',
    border: '#E2DACE',
    /** Buttons, links, the active tab. */
    primary: '#8C2F2B',
    primaryForeground: '#FFF8F2',
    /** The tilde. */
    clay: '#8C2F2B',
    mutedForeground: '#6E655A',
  },
  dark: {
    background: '#0F1311',
    foreground: '#F3EEE6',
    card: '#171C19',
    surface: '#1F2521',
    border: '#272D29',
    primary: '#E07A6B',
    primaryForeground: '#0F1311',
    clay: '#C9483D',
    mutedForeground: '#A69C8F',
  },
} as const;

export type ThemeName = keyof typeof THEME;

/** The raw colours for the scheme in effect. */
export function useTheme() {
  return THEME[useAppearance().resolved];
}
