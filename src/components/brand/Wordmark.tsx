import * as React from 'react';
import {View, type StyleProp, type ViewStyle} from 'react-native';
import Svg, {Path} from 'react-native-svg';

import {BRAND_COLORS} from '@/components/brand/geometry';
import {WORDMARK} from '@/components/brand/wordmark-data';
import {useAppearance} from '@/lib/appearance';

type Props = {
  /** Height of the capital M, in dp. The tilde rises above it. */
  size: number;
  style?: StyleProp<ViewStyle>;
  /** Give the tilde the ink colour, e.g. beside the mark, which already carries the clay one. */
  quiet?: boolean;
};

/**
 * "Mbarĩ", drawn from Plus Jakarta Sans Bold outlines rather than set as
 * text, with the ĩ's tilde in the mark's clay.
 */
export function Wordmark({size, style, quiet = false}: Props) {
  const {resolved} = useAppearance();
  const colors = BRAND_COLORS[resolved];
  const scale = size / WORDMARK.cap;
  const inkWidth = WORDMARK.right - WORDMARK.left;
  const inkHeight = WORDMARK.top + WORDMARK.descender;
  const width = inkWidth * scale;
  const height = inkHeight * scale;
  return (
    <View style={[{width, height}, style]} accessible accessibilityRole="header" accessibilityLabel="Mbarĩ">
      <Svg width={width} height={height} viewBox={`${WORDMARK.left} ${-WORDMARK.top} ${inkWidth} ${inkHeight}`}>
        <Path d={WORDMARK.d} fill={colors.ink} />
        <Path d={WORDMARK.tilde} fill={quiet ? colors.ink : colors.clay} />
      </Svg>
    </View>
  );
}
