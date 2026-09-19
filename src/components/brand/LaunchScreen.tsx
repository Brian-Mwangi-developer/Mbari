import * as React from 'react';
import {ActivityIndicator, StatusBar, StyleSheet, View, type LayoutChangeEvent} from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import {AnimatedMark} from '@/components/brand/Mark';
import {BRAND_COLORS, MARK, SPLASH_SCALE} from '@/components/brand/geometry';
import NativeLaunchScreen from '@/native/NativeLaunchScreen';
import {useAppearance} from '@/lib/appearance';
import {useLaunch} from '@/lib/launch';
import {useSession} from '@/lib/session';

/** Long enough to read as a moment, not a flicker. */
const MIN_VISIBLE_MS = 450;
/** How long to wait for the landing screen to say where its mark is. */
const HERO_WAIT_MS = 800;
/** A slow network gets a quiet sign of life under the mark. */
const SLOW_MS = 2_500;

const FLY_MS = 540;
const FADE_MS = 260;

type Exit = 'fade' | 'handoff';

/**
 * The first thing JavaScript draws: the same mark, in the same place and
 * colours, as the native splash, which it then releases. Once the session is
 * known it either fades into the app, or, for someone signed out, unfolds
 * the mark back into a bookmark and flies it to the landing screen, which
 * builds it up again.
 */
export function LaunchScreen() {
  const {status} = useSession();
  const {launching, hero, finish} = useLaunch();
  const {resolved} = useAppearance();
  const reduceMotion = useReducedMotion();
  const colors = BRAND_COLORS[resolved];

  const [frame, setFrame] = React.useState<{width: number; height: number} | null>(null);
  const [minElapsed, setMinElapsed] = React.useState(false);
  const [heroTimedOut, setHeroTimedOut] = React.useState(false);
  const [slow, setSlow] = React.useState(false);
  const [exit, setExit] = React.useState<Exit | null>(null);

  const ground = useSharedValue(1);
  const markOpacity = useSharedValue(1);
  const fly = useSharedValue(0);
  const fold = useSharedValue(1);
  const drop = useSharedValue(1);

  React.useEffect(() => {
    const timers = [
      setTimeout(() => setMinElapsed(true), MIN_VISIBLE_MS),
      setTimeout(() => setSlow(true), SLOW_MS),
    ];
    return () => timers.forEach(clearTimeout);
  }, []);

  React.useEffect(() => {
    if (status !== 'signedOut' || hero) {
      return;
    }
    const timer = setTimeout(() => setHeroTimedOut(true), HERO_WAIT_MS);
    return () => clearTimeout(timer);
  }, [status, hero]);

  const onLayout = (event: LayoutChangeEvent) => {
    const {width, height} = event.nativeEvent.layout;
    setFrame({width, height});
    // Two frames: the mark is on screen before the native splash lets go.
    requestAnimationFrame(() => requestAnimationFrame(() => NativeLaunchScreen?.hide()));
  };

  React.useEffect(() => {
    if (exit || !minElapsed || status === 'loading') {
      return;
    }
    if (status === 'signedOut' && hero && frame && !reduceMotion) {
      setExit('handoff');
    } else if (status === 'signedIn' || heroTimedOut || reduceMotion || (hero && frame)) {
      setExit('fade');
    }
  }, [exit, minElapsed, status, hero, frame, heroTimedOut, reduceMotion]);

  React.useEffect(() => {
    if (!exit) {
      return;
    }
    const timers: ReturnType<typeof setTimeout>[] = [];
    if (exit === 'fade') {
      ground.value = withTiming(0, {duration: FADE_MS + 60});
      markOpacity.value = withTiming(0, {duration: FADE_MS});
      timers.push(setTimeout(finish, FADE_MS + 80));
    } else {
      const easing = Easing.inOut(Easing.cubic);
      fold.value = withTiming(0, {duration: FLY_MS * 0.7, easing});
      drop.value = withTiming(0, {duration: FLY_MS * 0.45, easing});
      fly.value = withTiming(1, {duration: FLY_MS, easing});
      timers.push(setTimeout(() => (ground.value = withTiming(0, {duration: FADE_MS})), FLY_MS));
      timers.push(setTimeout(finish, FLY_MS + FADE_MS));
    }
    return () => timers.forEach(clearTimeout);
  }, [exit, finish, fly, fold, drop, ground, markOpacity]);

  const markWidth = MARK.width * SPLASH_SCALE;
  const markHeight = MARK.height * SPLASH_SCALE;
  const nudgeX = MARK.nudge.x * SPLASH_SCALE;
  const nudgeY = MARK.nudge.y * SPLASH_SCALE;
  // Where the mark's centre sits in the window: its middle, nudged like the native drawable.
  const centreX = frame ? frame.width / 2 + nudgeX : 0;
  const centreY = frame ? frame.height / 2 + nudgeY : 0;
  const target = hero
    ? {
        dx: hero.x + hero.width / 2 - centreX,
        dy: hero.y + hero.height / 2 - centreY,
        scale: hero.width / markWidth,
      }
    : {dx: 0, dy: 0, scale: 1};

  const groundStyle = useAnimatedStyle(() => ({opacity: ground.value}));
  const markStyle = useAnimatedStyle(() => ({
    opacity: markOpacity.value,
    transform: [
      {translateX: nudgeX + target.dx * fly.value},
      {translateY: nudgeY + target.dy * fly.value},
      {scale: 1 + (target.scale - 1) * fly.value},
    ],
  }));

  if (!launching) {
    return null;
  }

  return (
    <View style={StyleSheet.absoluteFill} onLayout={onLayout} pointerEvents="auto" accessibilityLabel="Opening Mbari">
      <StatusBar barStyle={resolved === 'dark' ? 'light-content' : 'dark-content'} />
      <Animated.View style={[StyleSheet.absoluteFill, {backgroundColor: colors.ground}, groundStyle]} />
      {/* Centred by layout, so it is drawn in the very first frame, exactly where the native splash has it. */}
      <View style={styles.centre} pointerEvents="none">
        <Animated.View style={[{width: markWidth, height: markHeight}, markStyle]}>
          <AnimatedMark width={markWidth} fold={fold} drop={drop} />
        </Animated.View>
        {slow && !exit ? <ActivityIndicator style={styles.spinner} color={colors.ink} /> : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  centre: {position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, alignItems: 'center', justifyContent: 'center'},
  // Below the mark without moving it off centre.
  spinner: {position: 'absolute', top: '50%', marginTop: 120},
});
