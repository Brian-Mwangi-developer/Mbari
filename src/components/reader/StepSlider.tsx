import * as React from 'react';
import {StyleSheet, Text, View, type LayoutChangeEvent} from 'react-native';
import {GestureDetector, usePanGesture} from 'react-native-gesture-handler';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated';
import {scheduleOnRN} from 'react-native-worklets';

import {useReaderSettings} from '@/lib/reader-settings';

const THUMB = 28;
const PAD = 18;
const SPRING = {damping: 20, stiffness: 260};

type Props = {
  steps: number;
  value: number;
  onChange: (step: number) => void;
};

/** Discrete slider with "A" end labels, snapping to `steps` positions. */
export function StepSlider({steps, value, onChange}: Props) {
  const {resolved} = useReaderSettings();
  const {theme} = resolved;
  const trackWidth = useSharedValue(0);
  const x = useSharedValue(0);
  const startX = useSharedValue(0);

  const stepToX = React.useCallback(
    (step: number, width: number) =>
      (step / (steps - 1)) * Math.max(0, width - THUMB),
    [steps],
  );

  const onLayout = (e: LayoutChangeEvent) => {
    const width = e.nativeEvent.layout.width - PAD * 2;
    trackWidth.value = width;
    x.value = stepToX(value, width);
  };

  React.useEffect(() => {
    if (trackWidth.value > 0) {
      x.value = withSpring(stepToX(value, trackWidth.value), SPRING);
    }
  }, [value, stepToX, trackWidth, x]);

  const pan = usePanGesture({
    onBegin: () => {
      startX.value = x.value;
    },
    onUpdate: e => {
      const max = trackWidth.value - THUMB;
      x.value = Math.min(max, Math.max(0, startX.value + e.translationX));
    },
    onDeactivate: () => {
      const max = trackWidth.value - THUMB;
      const step = Math.round((x.value / max) * (steps - 1));
      x.value = withSpring((step / (steps - 1)) * max, SPRING);
      scheduleOnRN(onChange, step);
    },
  });

  const thumbStyle = useAnimatedStyle(() => ({
    transform: [{translateX: x.value}],
  }));

  return (
    <View
      onLayout={onLayout}
      style={[styles.track, {backgroundColor: theme.surface}]}>
      <Text style={[styles.small, {color: theme.muted}]}>A</Text>
      <Text style={[styles.large, {color: theme.muted}]}>A</Text>
      <View style={[styles.rail, {backgroundColor: theme.border}]} />
      <GestureDetector gesture={pan}>
        <Animated.View
          hitSlop={16}
          style={[styles.thumb, {backgroundColor: theme.foreground}, thumbStyle]}
        />
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    height: 72,
    borderRadius: 18,
    justifyContent: 'center',
    paddingHorizontal: PAD,
  },
  small: {
    position: 'absolute',
    left: 30,
    fontFamily: 'PlusJakartaSans',
    fontSize: 15,
  },
  large: {
    position: 'absolute',
    right: 30,
    fontFamily: 'PlusJakartaSans',
    fontSize: 24,
    fontWeight: '600',
  },
  rail: {height: 2, marginHorizontal: THUMB + 8},
  thumb: {
    position: 'absolute',
    left: PAD,
    width: THUMB,
    height: THUMB,
    borderRadius: THUMB / 2,
  },
});
