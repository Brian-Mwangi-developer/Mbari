import * as React from 'react';
import {View, type StyleProp, type ViewStyle} from 'react-native';
import Svg, {Path, Rect} from 'react-native-svg';

import {BRAND_COLORS, MARK, TILDE_PATH} from '@/components/brand/geometry';
import {useAppearance} from '@/lib/appearance';

type Props = {
  /** Width in dp; the height follows the mark's proportions. */
  width: number;
  style?: StyleProp<ViewStyle>;
  /** One colour: the tilde takes the ink too, e.g. on a clay ground. */
  mono?: boolean;
};

/** The finished mark: the Kikuyu letter ĩ, a stem crowned by a clay tilde. */
export function Mark({width, style, mono = false}: Props) {
  const {resolved} = useAppearance();
  const colors = BRAND_COLORS[resolved];
  const height = (width * MARK.height) / MARK.width;
  return (
    <View style={[{width, height}, style]} accessible accessibilityRole="image" accessibilityLabel="Mbarĩ">
      <Svg width={width} height={height} viewBox={`0 0 ${MARK.width} ${MARK.height}`}>
        <Rect x={MARK.stem.x} y={MARK.stem.y} width={MARK.stem.width} height={MARK.stem.height} fill={colors.ink} />
        <Path d={TILDE_PATH} fill={mono ? colors.ink : colors.clay} />
      </Svg>
    </View>
  );
}
