import * as React from 'react';
import {StyleSheet, View} from 'react-native';
import Svg, {Circle, Line} from 'react-native-svg';

import {useTheme} from '@/lib/theme';

const BARS = 72;
const FRAME_MS = 40;

// Each bar moves at its own pace, so a single loudness reads as a living ring
// rather than a pulsing circle.
const SPEED = Array.from({length: BARS}, (_, i) => 1.6 + ((i * 37) % 23) / 9);
const PHASE = Array.from({length: BARS}, (_, i) => ((i * 53) % 71) / 11);

type Props = {
  /** Loudness 0..1 right now. */
  level: number;
  /** Recording or playing: bars follow `level`. Otherwise they breathe quietly. */
  active: boolean;
  size: number;
  children?: React.ReactNode;
};

/**
 * A ring of bars around the centre that rise with the voice, in the app's
 * clay and sand. Drawn with SVG and eased every frame so it never jitters.
 */
export function VoiceRing({level, active, size, children}: Props) {
  const theme = useTheme();
  const values = React.useRef<number[]>(Array(BARS).fill(0.05));
  const time = React.useRef(0);
  const input = React.useRef({level, active});
  input.current = {level, active};
  const [, setFrame] = React.useState(0);

  React.useEffect(() => {
    const timer = setInterval(() => {
      time.current += FRAME_MS / 1000;
      const t = time.current;
      const {level: now, active: on} = input.current;
      const v = values.current;
      for (let i = 0; i < BARS; i++) {
        const wobble = 0.5 + 0.5 * Math.sin(t * SPEED[i] + PHASE[i]);
        const target = on ? 0.06 + now * (0.3 + 0.7 * wobble) : 0.05 + 0.035 * Math.sin(t * 1.3 + i * 0.35);
        // Rise fast, fall slowly, like a level meter.
        v[i] += (target - v[i]) * (target > v[i] ? 0.55 : 0.12);
      }
      setFrame(f => (f + 1) % 1_000_000);
    }, FRAME_MS);
    return () => clearInterval(timer);
  }, []);

  const c = size / 2;
  const inner = size * 0.27;
  const reach = size * 0.2;
  const stroke = ((2 * Math.PI * inner) / BARS) * 0.58;

  return (
    <View style={{width: size, height: size}} className="items-center justify-center">
      <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
        {/* Faint guide rings: the room the voice has to fill. */}
        <Circle cx={c} cy={c} r={inner + reach + 8} stroke={theme.border} strokeWidth={1} strokeDasharray="2 7" fill="none" />
        <Circle cx={c} cy={c} r={inner - 6} fill={theme.card} stroke={theme.border} strokeWidth={1} />
        {values.current.map((v, i) => {
          const angle = (i / BARS) * Math.PI * 2 - Math.PI / 2;
          const cos = Math.cos(angle);
          const sin = Math.sin(angle);
          const length = 4 + v * reach;
          return (
            <Line
              key={i}
              x1={c + cos * inner}
              y1={c + sin * inner}
              x2={c + cos * (inner + length)}
              y2={c + sin * (inner + length)}
              stroke={theme.primary}
              strokeOpacity={0.28 + Math.min(1, v * 1.4) * 0.72}
              strokeWidth={stroke}
              strokeLinecap="round"
            />
          );
        })}
      </Svg>
      {children}
    </View>
  );
}
