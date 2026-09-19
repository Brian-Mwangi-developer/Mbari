import * as React from 'react';
import Svg, {Path} from 'react-native-svg';

import {THEME} from '@/lib/theme';
import {useAppearance} from '@/lib/appearance';

/** One period of a sine, as a path: the tilde's shape, used as a marker. */
export function wave(width: number, amp: number, steps = 30, periods = 1): string {
  const pts: string[] = [];
  for (let i = 0; i <= steps; i++) {
    const x = (width * i) / steps;
    const y = -amp * Math.sin((2 * Math.PI * periods * i) / steps);
    pts.push(`${i === 0 ? 'M' : 'L'}${x.toFixed(2)} ${y.toFixed(2)}`);
  }
  return pts.join(' ');
}

const PATH = wave(24, 2.6);

/**
 * The small clay tilde that marks where you are: under the current tab, filter
 * or language. It is the app's only ornament.
 */
export function TildeMarker({width = 26}: {width?: number}) {
  const {resolved} = useAppearance();
  return (
    <Svg width={width} height={(width * 10) / 30} viewBox="-3 -5 30 10">
      <Path d={PATH} fill="none" stroke={THEME[resolved].clay} strokeWidth={3} strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}
