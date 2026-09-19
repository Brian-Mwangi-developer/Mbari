import * as React from 'react';
import {View, type StyleProp, type ViewStyle} from 'react-native';
import Svg, {Circle, Path} from 'react-native-svg';

import {BRAND_COLORS} from '@/components/brand/geometry';
import {WORDMARK} from '@/components/brand/wordmark-data';
import {useAppearance} from '@/lib/appearance';

type Props = {
  /** Height of the tall letters (the l), in dp. The p's descender hangs below. */
  size: number;
  style?: StyleProp<ViewStyle>;
};

/**
 * "mbari", drawn from Plus Jakarta Sans Bold outlines rather than set as
 * text, with the i's dot in the mark's amber.
 */
export function Wordmark({size, style}: Props) {
  const {resolved} = useAppearance();
  const colors = BRAND_COLORS[resolved];
  const scale = size / WORDMARK.ascender;
  const width = WORDMARK.advance * scale;
  const height = (WORDMARK.ascender + WORDMARK.descender) * scale;
  return (
    <View style={[{width, height}, style]} accessible accessibilityRole="header" accessibilityLabel="Mbari">
      <Svg width={width} height={height} viewBox={`0 ${-WORDMARK.ascender} ${WORDMARK.advance} ${WORDMARK.ascender + WORDMARK.descender}`}>
        <Path d={WORDMARK.d} fill={colors.ink} />
        <Circle cx={WORDMARK.dot.cx} cy={WORDMARK.dot.cy} r={WORDMARK.dot.r} fill={colors.amber} />
      </Svg>
    </View>
  );
}
