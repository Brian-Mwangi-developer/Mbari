import * as React from 'react';
import {
  BackHandler,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import {GestureDetector, usePanGesture} from 'react-native-gesture-handler';
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import {scheduleOnRN} from 'react-native-worklets';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

import {Chip} from '@/components/reader/Chip';
import {StepSlider} from '@/components/reader/StepSlider';
import {
  FONT_SIZES,
  LINE_SPACINGS,
  READER_THEMES,
  type ReaderThemeName,
  TYPEFACES,
  useReaderSettings,
} from '@/lib/reader-settings';

const SHEET_HEIGHT = 580;
const DISMISS_DISTANCE = 120;
const DISMISS_VELOCITY = 900;
const SPRING = {damping: 28, stiffness: 260, overshootClamping: true};
const THEME_NAMES = Object.keys(READER_THEMES) as ReaderThemeName[];

type Props = {
  onClose: () => void;
};

function Label({children}: {children: string}) {
  const {resolved} = useReaderSettings();
  return (
    <Text style={[styles.label, {color: resolved.theme.muted}]}>{children}</Text>
  );
}

export function ReaderSettingsSheet({onClose}: Props) {
  const insets = useSafeAreaInsets();
  const {settings, update, resolved} = useReaderSettings();
  const {theme} = resolved;
  const translateY = useSharedValue(SHEET_HEIGHT);
  const startY = useSharedValue(0);

  React.useEffect(() => {
    translateY.value = withSpring(0, SPRING);
  }, [translateY]);

  const dismiss = React.useCallback(() => {
    translateY.value = withTiming(
      SHEET_HEIGHT,
      {duration: 220, easing: Easing.in(Easing.cubic)},
      finished => {
        if (finished) {
          scheduleOnRN(onClose);
        }
      },
    );
  }, [translateY, onClose]);

  React.useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      dismiss();
      return true;
    });
    return () => sub.remove();
  }, [dismiss]);

  const pan = usePanGesture({
    activeOffsetY: [-8, 8],
    onBegin: () => {
      startY.value = translateY.value;
    },
    onUpdate: e => {
      translateY.value = Math.max(0, startY.value + e.translationY);
    },
    onDeactivate: e => {
      if (
        translateY.value > DISMISS_DISTANCE ||
        e.velocityY > DISMISS_VELOCITY
      ) {
        scheduleOnRN(dismiss);
      } else {
        translateY.value = withSpring(0, SPRING);
      }
    },
  });

  const sheetStyle = useAnimatedStyle(() => ({
    transform: [{translateY: translateY.value}],
  }));

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: interpolate(translateY.value, [0, SHEET_HEIGHT], [1, 0]),
  }));

  return (
    <View style={StyleSheet.absoluteFill}>
      <Animated.View style={[styles.backdrop, backdropStyle]}>
        <Pressable style={styles.fill} onPress={dismiss} />
      </Animated.View>

      <GestureDetector gesture={pan}>
        <Animated.View
          style={[
            styles.sheet,
            {paddingBottom: insets.bottom + 12, backgroundColor: theme.surface},
            sheetStyle,
          ]}>
          <View style={styles.handleRow}>
            <View style={[styles.handle, {backgroundColor: theme.border}]} />
          </View>

          <View style={styles.sections}>
            <View>
              <Label>Typeface</Label>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.chipRow}>
                {TYPEFACES.map(t => (
                  <Chip
                    key={t.value}
                    label={t.label}
                    selected={settings.typeface === t.value}
                    onPress={() => update('typeface', t.value)}
                  />
                ))}
              </ScrollView>
            </View>

            <View>
              <Label>Size</Label>
              <StepSlider
                steps={FONT_SIZES.length}
                value={settings.sizeStep}
                onChange={step => update('sizeStep', step)}
              />
            </View>

            <View>
              <Label>Line spacing</Label>
              <View style={styles.chipRow}>
                {LINE_SPACINGS.map(l => (
                  <View key={l.value} style={styles.fill}>
                    <Chip
                      label={l.label}
                      selected={settings.lineSpacing === l.value}
                      onPress={() => update('lineSpacing', l.value)}
                    />
                  </View>
                ))}
              </View>
            </View>

            <View>
              <Label>Theme</Label>
              <View style={styles.chipRow}>
                {THEME_NAMES.map(name => (
                  <View key={name} style={styles.fill}>
                    <Chip
                      label={READER_THEMES[name].label}
                      selected={resolved.themeName === name}
                      onPress={() => update('theme', name)}
                    />
                  </View>
                ))}
              </View>
            </View>
          </View>
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

const styles = StyleSheet.create({
  fill: {flex: 1},
  backdrop: {position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, backgroundColor: 'rgba(0,0,0,0.55)'},
  sheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: SHEET_HEIGHT,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
  },
  handleRow: {alignItems: 'center', paddingTop: 12, paddingBottom: 6},
  handle: {width: 40, height: 4, borderRadius: 2},
  sections: {paddingHorizontal: 24, paddingTop: 22, gap: 30},
  chipRow: {flexDirection: 'row', gap: 10},
  label: {
    fontFamily: 'PlusJakartaSans',
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 2,
    textTransform: 'uppercase',
    marginBottom: 14,
  },
});
