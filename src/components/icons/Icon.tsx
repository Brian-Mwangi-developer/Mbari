import * as React from 'react';
import Svg, {Circle, Path, Rect} from 'react-native-svg';

import {ICON_DATA, type IconName} from '@/components/icons/icon-data';
import {useAppearance} from '@/lib/appearance';
import {THEME, type ThemeName} from '@/lib/theme';

type Props = {
  name: IconName;
  size?: number;
  /** A raw colour; by default the theme's ink. */
  color?: string;
  strokeWidth?: number;
};

/**
 * The Mbarĩ icon set: a 2 px line with round ends, like the tilde, on a 24 px
 * grid. Drawn from icon-data.ts, which is generated from brand/source/icons.py.
 */
export function Icon({name, size = 24, color, strokeWidth = 2}: Props) {
  const {resolved} = useAppearance();
  const ink = color ?? THEME[resolved as ThemeName].foreground;
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={ink}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round">
      {ICON_DATA[name].map((p, index) => {
        switch (p.t) {
          case 'path':
            return <Path key={index} d={p.d} {...('fill' in p && p.fill ? {fill: ink, stroke: 'none'} : {})} />;
          case 'circle':
            return <Circle key={index} cx={p.cx} cy={p.cy} r={p.r} {...('fill' in p && p.fill ? {fill: ink, stroke: 'none'} : {})} />;
          case 'rect':
            return <Rect key={index} x={p.x} y={p.y} width={p.width} height={p.height} rx={p.rx} />;
        }
      })}
    </Svg>
  );
}

export type {IconName};
