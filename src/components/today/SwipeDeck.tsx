import * as React from 'react';
import {StyleSheet, View, useWindowDimensions} from 'react-native';
import {Gesture, GestureDetector} from 'react-native-gesture-handler';
import Animated, {
  Easing,
  Extrapolation,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import {scheduleOnRN} from 'react-native-worklets';

import type {DeckCard} from '@/api';
import {DeckCardFace} from '@/components/today/DeckCardFace';
import {Text} from '@/components/ui/text';

const SPRING = {damping: 26, stiffness: 260, mass: 0.9};
/** Share of the screen width a drag must cover to count. */
const THRESHOLD = 0.28;
const FLING_VELOCITY = 850;
const LEAVE_MS = 230;

/** Lets buttons outside the card (the arrows) play the same exit as a swipe. */
export type SwipeDeckControls = {
  next: () => void;
};

type Props = {
  current: DeckCard;
  next: DeckCard | null;
  /** Where the top card sits in this session's deck, from 0. */
  index: number;
  total: number;
  readIds: string[];
  /** How the top card arrived: from under the last one, or back from the left. */
  arrival: 'promote' | 'back' | 'none';
  controls?: React.RefObject<SwipeDeckControls | null>;
  onPass: () => void;
  onNext: () => void;
  onRead: (card: DeckCard) => void;
  onLike: (card: DeckCard) => void;
  onSave: (card: DeckCard) => void;
  onPlay: (card: DeckCard) => void;
};

/**
 * The Today deck as a stack. Swipe left to pass, swipe right for the next card.
 * The card underneath rises to full size as the top one leaves, so it is
 * already in place when it takes over.
 */
export function SwipeDeck(props: Props) {
  const {next, total} = props;
  const {width} = useWindowDimensions();
  /** 0: the card underneath rests smaller; 1: it has risen to full size. */
  const lift = useSharedValue(0);

  const behindStyle = useAnimatedStyle(() => ({
    opacity: interpolate(lift.value, [0, 1], [0.72, 1]),
    transform: [{translateY: interpolate(lift.value, [0, 1], [14, 0])}, {scale: interpolate(lift.value, [0, 1], [0.94, 1])}],
  }));

  return (
    <View className="flex-1">
      {next ? (
        <Animated.View key={`${next.id}:${next.position}`} pointerEvents="none" style={[StyleSheet.absoluteFill, behindStyle]}>
          <DeckCardFace card={next} index={props.index + 1} total={total} read={props.readIds.includes(next.id)} inert />
        </Animated.View>
      ) : null}

      <TopCard key={`${props.current.id}:${props.current.position}`} {...props} lift={lift} width={width} />
    </View>
  );
}

function TopCard({
  current,
  index,
  total,
  readIds,
  arrival,
  controls,
  onPass,
  onNext,
  onRead,
  onLike,
  onSave,
  onPlay,
  lift,
  width,
}: Props & {lift: SharedValue<number>; width: number}) {
  const x = useSharedValue(0);
  const enter = useSharedValue(arrival === 'back' ? 0 : 1);

  React.useEffect(() => {
    if (arrival === 'back') {
      enter.value = withSpring(1, SPRING);
    }
    // The card now underneath settles back to its resting size.
    lift.value = withTiming(0, {duration: 220});
  }, [arrival, enter, lift]);

  const leave = React.useCallback(
    (direction: 'left' | 'right') => {
      lift.value = withTiming(1, {duration: LEAVE_MS});
      x.value = withTiming(
        (direction === 'left' ? -1 : 1) * width * 1.25,
        {duration: LEAVE_MS, easing: Easing.in(Easing.quad)},
        finished => {
          if (finished) {
            scheduleOnRN(direction === 'left' ? onPass : onNext);
          }
        },
      );
    },
    [x, lift, width, onPass, onNext],
  );

  React.useImperativeHandle(controls, () => ({next: () => leave('right')}), [leave]);

  const pan = React.useMemo(
    () =>
      Gesture.Pan()
        .activeOffsetX([-14, 14])
        .failOffsetY([-24, 24])
        .onUpdate(e => {
          x.value = e.translationX;
          lift.value = Math.min(1, Math.abs(e.translationX) / (width * 0.6));
        })
        .onEnd(e => {
          const far = Math.abs(e.translationX) > width * THRESHOLD;
          const fast = Math.abs(e.velocityX) > FLING_VELOCITY && Math.sign(e.velocityX) === Math.sign(e.translationX);
          if (far || fast) {
            scheduleOnRN(leave, e.translationX < 0 ? 'left' : 'right');
          } else {
            x.value = withSpring(0, SPRING);
            lift.value = withSpring(0, SPRING);
          }
        }),
    [x, lift, width, leave],
  );

  const cardStyle = useAnimatedStyle(() => ({
    transform: [
      {translateX: x.value + interpolate(enter.value, [0, 1], [-width * 1.1, 0])},
      {rotate: `${interpolate(x.value, [-width, 0, width], [-9, 0, 9], Extrapolation.CLAMP)}deg`},
    ],
  }));

  const passStyle = useAnimatedStyle(() => ({
    opacity: interpolate(x.value, [-width * THRESHOLD, -24], [1, 0], Extrapolation.CLAMP),
  }));
  const nextStyle = useAnimatedStyle(() => ({
    opacity: interpolate(x.value, [24, width * THRESHOLD], [0, 1], Extrapolation.CLAMP),
  }));

  return (
    <GestureDetector gesture={pan}>
      <Animated.View
        style={[StyleSheet.absoluteFill, cardStyle]}
        accessibilityActions={[
          {name: 'pass', label: 'Pass'},
          {name: 'next', label: 'Next card'},
          {name: 'activate', label: 'Read'},
        ]}
        onAccessibilityAction={event => {
          if (event.nativeEvent.actionName === 'pass') {
            leave('left');
          } else if (event.nativeEvent.actionName === 'next') {
            leave('right');
          } else {
            onRead(current);
          }
        }}>
        <DeckCardFace
          card={current}
          index={index}
          total={total}
          read={readIds.includes(current.id)}
          onRead={() => onRead(current)}
          onLike={() => onLike(current)}
          onSave={() => onSave(current)}
          onPlay={() => onPlay(current)}
        />

        <Animated.View pointerEvents="none" style={[styles.stamp, styles.stampRight, passStyle]}>
          <View className="rounded-full border-2 border-muted-foreground bg-card px-4 py-1.5">
            <Text className="text-[13px] font-bold uppercase tracking-[2.5px] text-muted-foreground">Pass</Text>
          </View>
        </Animated.View>
        <Animated.View pointerEvents="none" style={[styles.stamp, styles.stampLeft, nextStyle]}>
          <View className="rounded-full border-2 border-primary bg-card px-4 py-1.5">
            <Text className="text-[13px] font-bold uppercase tracking-[2.5px] text-primary">Next</Text>
          </View>
        </Animated.View>
      </Animated.View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({
  stamp: {position: 'absolute', top: 64},
  stampRight: {right: 24, transform: [{rotate: '8deg'}]},
  stampLeft: {left: 24, transform: [{rotate: '-8deg'}]},
});
