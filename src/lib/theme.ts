// Mirrors the CSS variables in global.css for places that need raw colour
// values (StatusBar, native props, SVG) rather than classNames.
// Green appears only as the dark-mode ground; the only accent is clay red.
export const THEME = {
  light: {
    background: '#F9F6F0',
    foreground: '#161412',
    card: '#FFFFFF',
    well: '#EEE9E2',
    border: '#E4DFD7',
    /** Buttons, links and the active tab. */
    primary: '#B23B1B',
    /** The graphic red: the tilde marker. */
    clay: '#D9502B',
    mutedForeground: '#726B65',
  },
  dark: {
    background: '#0B1A14',
    foreground: '#F6F3EE',
    card: '#10231B',
    well: '#1A2B24',
    border: '#212F29',
    primary: '#F0764F',
    clay: '#D9502B',
    mutedForeground: '#A39E97',
  },
} as const;

export type ThemeName = keyof typeof THEME;
