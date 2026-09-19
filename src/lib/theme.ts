// Mirrors the CSS variables in global.css for places that need raw colour
// values (StatusBar, navigation themes, native props, SVG) rather than classNames.
// Two colours and paper: Highland ink, Murram clay, Millet. See the brand sheet.
export const THEME = {
  light: {
    background: '#F4EDDF',
    foreground: '#10281F',
    card: '#FBF7EE',
    well: '#EBE2D0',
    border: '#DDD3BF',
    /** The deeper "Action" tone: buttons and links. */
    primary: '#B23B1B',
    /** The graphic red: the tilde, the audio bar, the urgent rule. */
    clay: '#D9502B',
    mutedForeground: '#56655C',
  },
  dark: {
    background: '#0B1A14',
    foreground: '#F4EDDF',
    card: '#12271E',
    well: '#183429',
    border: '#23392F',
    primary: '#F0764F',
    clay: '#D9502B',
    mutedForeground: '#9DB0A5',
  },
} as const;

export type ThemeName = keyof typeof THEME;
