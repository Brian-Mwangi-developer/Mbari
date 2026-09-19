import * as React from 'react';
import {View, type StyleProp, type ViewStyle} from 'react-native';
import Animated, {useAnimatedProps, type SharedValue} from 'react-native-reanimated';
import Svg, {Circle, Path, Rect} from 'react-native-svg';

import {BRAND_COLORS, MARK, RIBBON_PATH, STEM_PATH} from '@/components/brand/geometry';
import {useAppearance} from '@/lib/appearance';

const AnimatedRect = Animated.createAnimatedComponent(Rect);
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

/** How far above its corner the dot starts, in mark units. */
const DROP_FROM = 170;

type Props = {
  /** Width in dp; the height follows the mark's proportions. */
  width: number;
  style?: StyleProp<ViewStyle>;
  /** Solid ink for the dot too, e.g. on an amber ground. */
  mono?: boolean;
};

/** The finished mark, drawn as one ribbon and a dot. */
export function Mark({width, style, mono = false}: Props) {
  const {resolved} = useAppearance();
  const colors = BRAND_COLORS[resolved];
  const height = (width * MARK.height) / MARK.width;
  return (
    <View style={[{width, height}, style]} accessible accessibilityRole="image" accessibilityLabel="Mbari">
      <Svg width={width} height={height} viewBox={`0 0 ${MARK.width} ${MARK.height}`}>
        <Path d={RIBBON_PATH} fill={colors.ink} />
        <Circle cx={MARK.dot.cx} cy={MARK.dot.cy} r={MARK.dot.r} fill={mono ? colors.ink : colors.amber} />
      </Svg>
    </View>
  );
}

type AnimatedProps = Props & {
  /** 0: a bookmark alone; 1: its foot folded out into the L. */
  fold: SharedValue<number>;
  /** 0: no pick yet; 1: the amber dot has landed in the corner. */
  drop: SharedValue<number>;
};

/**
 * The mark in parts, so it can be built up: the bookmark, the fold that makes
 * the L, and the pick landing in its corner.
 */
export function AnimatedMark({width, style, fold, drop}: AnimatedProps) {
  const {resolved} = useAppearance();
  const colors = BRAND_COLORS[resolved];
  const height = (width * MARK.height) / MARK.width;
  const unit = width / MARK.width;

  const footProps = useAnimatedProps(() => ({
    // Starts one unit inside the stem so the join never shows a seam.
    width: Math.max(0, (MARK.width - MARK.T + 1) * fold.value),
  }));
  const dotProps = useAnimatedProps(() => ({
    cy: MARK.dot.cy - DROP_FROM * (1 - drop.value),
    opacity: Math.min(1, Math.max(0, drop.value * 1.6)),
  }));

  return (
    <View style={[{width, height}, style]} accessible accessibilityRole="image" accessibilityLabel="Mbari">
      {/* Taller than the mark by the dot's fall, so it can drop in from above. */}
      <Svg
        width={width}
        height={(MARK.height + DROP_FROM) * unit}
        viewBox={`0 ${-DROP_FROM} ${MARK.width} ${MARK.height + DROP_FROM}`}
        style={{marginTop: -DROP_FROM * unit}}>
        <Path d={STEM_PATH} fill={colors.ink} />
        <AnimatedRect x={MARK.T - 1} y={MARK.height - MARK.T} height={MARK.T} fill={colors.ink} animatedProps={footProps} />
        <AnimatedCircle cx={MARK.dot.cx} r={MARK.dot.r} fill={colors.amber} animatedProps={dotProps} />
      </Svg>
    </View>
  );
}
