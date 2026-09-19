import * as React from 'react';
import {ActivityIndicator, StatusBar, StyleSheet, View} from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import {Mark} from '@/components/brand/Mark';
import {Wordmark} from '@/components/brand/Wordmark';
import {BRAND_COLORS, MARK, SPLASH_SCALE} from '@/components/brand/geometry';
import NativeLaunchScreen from '@/native/NativeLaunchScreen';
import {useAppearance} from '@/lib/appearance';
import {useLaunch} from '@/lib/launch';
import {useSession} from '@/lib/session';

/** Long enough for the name to be read, not so long it feels like waiting. */
const MIN_VISIBLE_MS = 1_100;
/** A slow network gets a quiet sign of life under the name. */
const SLOW_MS = 2_500;
const REVEAL_MS = 420;
const FADE_MS = 280;

/** Height of the wordmark's capital M, and its gap below the mark, in dp. */
const WORD_SIZE = 30;
const WORD_GAP = 28;

/**
 * The first thing JavaScript draws: the mark exactly where the native splash
 * has it, which it then releases. The mark rises a little as "Mbarĩ" fades in
 * beneath it, so the pair ends up centred together; then everything fades into
 * the app. Nothing leaves the screen.
 */
export function LaunchScreen() {
  const {status} = useSession();
  const {launching, finish} = useLaunch();
  const {resolved} = useAppearance();
  const reduceMotion = useReducedMotion();
  const colors = BRAND_COLORS[resolved];

  const [minElapsed, setMinElapsed] = React.useState(false);
  const [slow, setSlow] = React.useState(false);
  const [leaving, setLeaving] = React.useState(false);

  const reveal = useSharedValue(reduceMotion ? 1 : 0);
  const ground = useSharedValue(1);

  const markWidth = MARK.width * SPLASH_SCALE;
  const markHeight = MARK.height * SPLASH_SCALE;
  // How far the mark rises so mark + name sit centred as one block.
  const rise = (WORD_GAP + WORD_SIZE) / 2;

  React.useEffect(() => {
    const timers = [
      setTimeout(() => setMinElapsed(true), MIN_VISIBLE_MS),
      setTimeout(() => setSlow(true), SLOW_MS),
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  const onLayout = () => {
    // Two frames: our mark is on screen before the native splash lets go.
    requestAnimationFrame(() =>
      requestAnimationFrame(() => {
        NativeLaunchScreen?.hide();
        reveal.value = withTiming(1, {duration: reduceMotion ? 0 : REVEAL_MS, easing: Easing.out(Easing.cubic)});
      }),
    );
  };

  React.useEffect(() => {
    if (minElapsed && status !== 'loading') {
      setLeaving(true);
    }
  }, [minElapsed, status]);

  // Its own effect, so flipping `leaving` can't cancel the timer that removes
  // the overlay (an invisible overlay would swallow every tap).
  React.useEffect(() => {
    if (!leaving) {
      return;
    }
    ground.value = withTiming(0, {duration: FADE_MS});
    const timer = setTimeout(finish, FADE_MS + 40);
    return () => clearTimeout(timer);
  }, [leaving, ground, finish]);

  const groundStyle = useAnimatedStyle(() => ({opacity: ground.value}));
  const markStyle = useAnimatedStyle(() => ({transform: [{translateY: -rise * reveal.value}]}));
  const wordStyle = useAnimatedStyle(() => ({
    opacity: reveal.value,
    transform: [{translateY: -rise * reveal.value + 8 * (1 - reveal.value)}],
  }));

  if (!launching) {
    return null;
  }

  return (
    <Animated.View
      style={[StyleSheet.absoluteFill, {backgroundColor: colors.ground}, groundStyle]}
      onLayout={onLayout}
      pointerEvents={leaving ? 'none' : 'auto'}
      accessibilityLabel="Opening Mbarĩ">
      <StatusBar barStyle={resolved === 'dark' ? 'light-content' : 'dark-content'} />
      {/* Centred by layout, so the first frame matches the native splash exactly. */}
      <View style={styles.centre} pointerEvents="none">
        <Animated.View style={[{width: markWidth, height: markHeight}, markStyle]}>
          <Mark width={markWidth} />
        </Animated.View>
        <Animated.View style={[styles.word, {top: `50%`, marginTop: markHeight / 2 + WORD_GAP}, wordStyle]}>
          <Wordmark size={WORD_SIZE} />
        </Animated.View>
        {slow && !leaving ? <ActivityIndicator style={styles.spinner} color={colors.ink} /> : null}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  centre: {position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, alignItems: 'center', justifyContent: 'center'},
  word: {position: 'absolute', alignItems: 'center'},
  spinner: {position: 'absolute', top: '50%', marginTop: 190},
});
