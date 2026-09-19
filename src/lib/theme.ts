// Mirrors the CSS variables in global.css for places that need raw colour
// values (StatusBar, navigation themes, native props) rather than classNames.
export const THEME = {
  light: {
    background: 'hsl(37 44% 96%)',
    foreground: 'hsl(30 10% 8%)',
    card: 'hsl(0 0% 100%)',
    border: 'hsl(37 20% 87%)',
    primary: 'hsl(36 78% 52%)',
    mutedForeground: 'hsl(30 6% 42%)',
  },
  dark: {
    background: 'hsl(0 0% 4%)',
    foreground: 'hsl(40 30% 95%)',
    card: 'hsl(0 0% 8%)',
    border: 'hsl(0 0% 14%)',
    primary: 'hsl(38 85% 59%)',
    mutedForeground: 'hsl(0 0% 55%)',
  },
} as const;

export type ThemeName = keyof typeof THEME;
