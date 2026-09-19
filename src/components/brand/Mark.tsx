import * as React from 'react';
import {StyleSheet, View, type StyleProp, type ViewStyle} from 'react-native';
import Animated, {useAnimatedStyle, type SharedValue} from 'react-native-reanimated';
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

type AnimatedProps = Omit<Props, 'mono'> & {
  /** 0: no stem yet; 1: the stem stands at full height. */
  grow: SharedValue<number>;
  /** 0: the tilde is still above and unseen; 1: it has settled over the stem. */
  voice: SharedValue<number>;
};

/**
 * The mark in two parts so it can be built up: the stem standing, then the
 * tilde, the language, arriving over it. Each part is its own layer so it can
 * move without redrawing the SVG.
 */
export function AnimatedMark({width, style, grow, voice}: AnimatedProps) {
  const {resolved} = useAppearance();
  const colors = BRAND_COLORS[resolved];
  const unit = width / MARK.width;
  const height = MARK.height * unit;

  const stemStyle = useAnimatedStyle(() => ({
    transform: [{scaleY: Math.max(0.001, grow.value)}],
    transformOrigin: '50% 100%',
  }));
  const tildeStyle = useAnimatedStyle(() => ({
    opacity: Math.min(1, Math.max(0, voice.value * 1.6)),
    transform: [{translateY: -MARK.lift * unit * (1 - voice.value)}],
  }));

  return (
    <View style={[{width, height}, style]} accessible accessibilityRole="image" accessibilityLabel="Mbarĩ">
      <Animated.View style={[styles.layer, {width, height}, stemStyle]}>
        <Svg width={width} height={height} viewBox={`0 0 ${MARK.width} ${MARK.height}`}>
          <Rect x={MARK.stem.x} y={MARK.stem.y} width={MARK.stem.width} height={MARK.stem.height} fill={colors.ink} />
        </Svg>
      </Animated.View>
      <Animated.View style={[styles.layer, {width, height}, tildeStyle]}>
        <Svg width={width} height={height} viewBox={`0 0 ${MARK.width} ${MARK.height}`}>
          <Path d={TILDE_PATH} fill={colors.clay} />
        </Svg>
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({layer: {position: 'absolute', left: 0, top: 0}});
