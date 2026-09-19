/**
 * The Mbari mark: a bookmark ribbon, V-notched at the top, folded into an
 * L, holding one amber dot (the day's pick). Every measure is a ratio of the
 * stroke T. Keep in step with scripts/generate-brand-assets.py, which draws
 * the same shape for the launcher icon and the native splash.
 */
export const MARK = {
  /** Stroke. */
  T: 92,
  /** Depth of the bookmark notch (0.43T). */
  notch: 40,
  width: 272,
  height: 304,
  /** The amber dot, a quarter T clear of both arms. */
  dot: {cx: 176, cy: 128, r: 62},
  /** The ribbon's mass sits left and low; this nudge centres it optically. */
  nudge: {x: 5.8, y: -3.5},
} as const;

export const RIBBON_PATH = `M0,0 L${MARK.T / 2},${MARK.notch} L${MARK.T},0 L${MARK.T},${MARK.height - MARK.T} L${MARK.width},${MARK.height - MARK.T} L${MARK.width},${MARK.height} L0,${MARK.height} Z`;

/** The ribbon without its foot: a bookmark on its own. */
export const STEM_PATH = `M0,0 L${MARK.T / 2},${MARK.notch} L${MARK.T},0 L${MARK.T},${MARK.height} L0,${MARK.height} Z`;

/**
 * The native splash draws the mark at this scale, centred in the window
 * (res/drawable/splash_mark.xml). The JS launch screen matches it exactly.
 */
export const SPLASH_SCALE = 0.465;

export const BRAND_COLORS = {
  light: {ink: '#1B1712', amber: '#E0962C', ground: '#F9F6F0'},
  dark: {ink: '#F3EEE6', amber: '#E0962C', ground: '#0A0A0A'},
} as const;
