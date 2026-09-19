import * as React from 'react';
import {
  AppState,
  BackHandler,
  Pressable,
  StatusBar,
  StyleSheet,
  Text,
  View,
  useWindowDimensions,
} from 'react-native';
import {Gesture, GestureDetector} from 'react-native-gesture-handler';
import Animated, {
  Easing,
  Extrapolation,
  interpolate,
  scrollTo,
  useAnimatedRef,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import {scheduleOnRN} from 'react-native-worklets';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

import {ReaderSettingsSheet} from '@/components/reader/ReaderSettingsSheet';
import type {Article} from '@/api';
import {BackIcon, CheckIcon, LikeIcon, OfflineIcon, SaveIcon} from '@/lib/icons';
import {useOffline} from '@/lib/offline';
import type {ReadingMetrics} from '@/lib/reader';
import {signal} from '@/lib/signals';
import {useReaderSettings} from '@/lib/reader-settings';
import {THEME} from '@/lib/theme';

const DISMISS_DISTANCE = 140;
const DISMISS_VELOCITY = 1000;
const SPRING = {damping: 30, stiffness: 240, overshootClamping: true};

type Props = {
  article: Article;
  onClose: (metrics: ReadingMetrics) => void;
};

/**
 * Full-screen reader that slides up over the app. Pulling down while the
 * content is scrolled to the top drags the sheet; past a threshold it
 * dismisses, otherwise it springs back.
 */
export function ArticleReader({article, onClose}: Props) {
  const {height} = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const {resolved} = useReaderSettings();
  const {theme} = resolved;
  const accent = THEME[theme.scheme].primary;

  const [settingsOpen, setSettingsOpen] = React.useState(false);
  const offline = useOffline();
  const saved = offline.isSaved(article.id);

  const translateY = useSharedValue(height);
  const scrollY = useSharedValue(0);
  const progress = useSharedValue(0);
  // Furthest point reached, which is what "read to the end" means; scrolling
  // back up to reread a paragraph should not lower it.
  const maxProgress = useSharedValue(0);

  // Foreground reading time: a phone left on the table with the app in the
  // background is not reading.
  const reading = React.useRef({accumulated: 0, since: Date.now()});
  React.useEffect(() => {
    const sub = AppState.addEventListener('change', state => {
      const r = reading.current;
      if (state === 'active') {
        r.since = Date.now();
      } else if (r.since) {
        r.accumulated += Date.now() - r.since;
        r.since = 0;
      }
    });
    return () => sub.remove();
  }, []);

  const [liked, setLiked] = React.useState(Boolean(article.liked));
  const [kept, setKept] = React.useState(Boolean(article.saved));
  const toggleLike = () => {
    signal(article.id, {type: liked ? 'unlike' : 'like'}).catch(() => {});
    setLiked(!liked);
  };
  const toggleKeep = () => {
    signal(article.id, {type: kept ? 'unsave' : 'save'}).catch(() => {});
    setKept(!kept);
  };

  const finish = React.useCallback(() => {
    const r = reading.current;
    onClose({
      progress: maxProgress.value,
      readMs: r.accumulated + (r.since ? Date.now() - r.since : 0),
    });
  }, [onClose, maxProgress]);
  const scrollRef = useAnimatedRef<Animated.ScrollView>();
  // translationY at the moment the content reached the top, so the part of
  // the drag that scrolled the content doesn't count toward the pull-down.
  const dragOrigin = useSharedValue(0);

  React.useEffect(() => {
    translateY.value = withSpring(0, SPRING);
  }, [translateY]);

  const dismiss = React.useCallback(() => {
    translateY.value = withTiming(
      height,
      {duration: 260, easing: Easing.in(Easing.cubic)},
      finished => {
        if (finished) {
          scheduleOnRN(finish);
        }
      },
    );
  }, [translateY, height, finish]);

  React.useEffect(() => {
    if (settingsOpen) {
      return;
    }
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      dismiss();
      return true;
    });
    return () => sub.remove();
  }, [dismiss, settingsOpen]);

  const onScroll = useAnimatedScrollHandler({
    onScroll: e => {
      scrollY.value = e.contentOffset.y;
      const range = e.contentSize.height - e.layoutMeasurement.height;
      progress.value =
        range > 0 ? Math.min(1, Math.max(0, scrollY.value / range)) : 1;
      if (progress.value > maxProgress.value) {
        maxProgress.value = progress.value;
      }
    },
  });

  // The pan runs alongside the ScrollView's native gesture. Downward
  // movement while the content is at the top drags the sheet; while the
  // sheet is displaced the scroll offset is pinned so the motions don't stack.
  const scroll = React.useMemo(() => Gesture.Native(), []);
  const pan = React.useMemo(
    () =>
      Gesture.Pan()
        .simultaneousWithExternalGesture(scroll)
        .activeOffsetY([-12, 12])
        .onBegin(() => {
          dragOrigin.value = 0;
        })
        .onUpdate(e => {
          if (translateY.value === 0 && scrollY.value > 0) {
            dragOrigin.value = e.translationY;
            return;
          }
          translateY.value = Math.max(0, e.translationY - dragOrigin.value);
          if (translateY.value > 0) {
            scrollTo(scrollRef, 0, 0, false);
          }
        })
        .onEnd(e => {
          if (translateY.value === 0) {
            return;
          }
          if (
            translateY.value > DISMISS_DISTANCE ||
            e.velocityY > DISMISS_VELOCITY
          ) {
            scheduleOnRN(dismiss);
          } else {
            translateY.value = withSpring(0, SPRING);
          }
        }),
    [scroll, dragOrigin, translateY, scrollY, scrollRef, dismiss],
  );

  const sheetStyle = useAnimatedStyle(() => {
    const radius = interpolate(
      translateY.value,
      [0, 80],
      [0, 28],
      Extrapolation.CLAMP,
    );
    return {
      transform: [{translateY: translateY.value}],
      borderTopLeftRadius: radius,
      borderTopRightRadius: radius,
    };
  });

  const backdropStyle = useAnimatedStyle(() => ({
    opacity: interpolate(translateY.value, [0, height], [0.6, 0]),
  }));

  const progressStyle = useAnimatedStyle(() => ({
    width: `${progress.value * 100}%`,
  }));

  const bodyStyle = {
    fontFamily: resolved.fontFamily,
    fontSize: resolved.fontSize,
    lineHeight: resolved.lineHeight,
    color: theme.foreground,
  };

  return (
    <View style={StyleSheet.absoluteFill}>
      <StatusBar
        barStyle={theme.scheme === 'dark' ? 'light-content' : 'dark-content'}
      />
      <Animated.View
        pointerEvents="none"
        style={[styles.backdrop, backdropStyle]}
      />

      <GestureDetector gesture={pan}>
        <Animated.View
          style={[
            styles.sheet,
            {backgroundColor: theme.background},
            sheetStyle,
          ]}>
          <View style={{height: insets.top}} />
          <View style={[styles.progressTrack, {backgroundColor: theme.border}]}>
            <Animated.View
              style={[
                styles.progressBar,
                {backgroundColor: accent},
                progressStyle,
              ]}
            />
          </View>

          <GestureDetector gesture={scroll}>
            <Animated.ScrollView
              ref={scrollRef}
              onScroll={onScroll}
              scrollEventThrottle={16}
              overScrollMode="never"
              showsVerticalScrollIndicator={false}
              contentContainerStyle={[
                styles.content,
                {paddingBottom: insets.bottom + 120},
              ]}>
              <Text style={[styles.source, {color: theme.muted}]}>
                {article.source}
              </Text>
              <Text style={[styles.title, {color: theme.foreground}]}>
                {article.title}
              </Text>
              <Text style={[styles.byline, {color: theme.muted}]}>
                {article.author} · {article.readMinutes} min
              </Text>

              <View style={[styles.body, {gap: resolved.lineHeight}]}>
                {article.body.map((paragraph, i) => (
                  <Text key={i} style={bodyStyle}>
                    {paragraph.map((segment, j) =>
                      segment.highlight ? (
                        <Text
                          key={j}
                          style={{backgroundColor: theme.highlight}}>
                          {segment.text}
                        </Text>
                      ) : (
                        <Text key={j}>{segment.text}</Text>
                      ),
                    )}
                  </Text>
                ))}
              </View>

              {/* The natural moment to say whether it was worth it. */}
              <View style={[styles.endRow, {borderColor: theme.border}]}>
                <Text style={[styles.endPrompt, {color: theme.muted}]}>
                  Worth your time?
                </Text>
                <View style={styles.endActions}>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={kept ? 'Saved. Remove from saved' : 'Save for later'}
                    accessibilityState={{selected: kept}}
                    onPress={toggleKeep}
                    hitSlop={8}
                    style={[styles.endButton, {borderColor: kept ? accent : theme.border}]}>
                    <SaveIcon size={20} color={kept ? accent : theme.muted} fill={kept ? accent : 'transparent'} />
                    <Text style={[styles.endLabel, {color: kept ? accent : theme.foreground}]}>
                      {kept ? 'Saved' : 'Save'}
                    </Text>
                  </Pressable>
                  <Pressable
                    accessibilityRole="button"
                    accessibilityLabel={liked ? 'Liked. Remove like' : 'Like'}
                    accessibilityState={{selected: liked}}
                    onPress={toggleLike}
                    hitSlop={8}
                    style={[styles.endButton, {borderColor: liked ? accent : theme.border}]}>
                    <LikeIcon size={20} color={liked ? accent : theme.muted} fill={liked ? accent : 'transparent'} />
                    <Text style={[styles.endLabel, {color: liked ? accent : theme.foreground}]}>
                      {liked ? 'Liked' : 'Like'}
                    </Text>
                  </Pressable>
                </View>
              </View>
            </Animated.ScrollView>
          </GestureDetector>

          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Back"
            onPress={dismiss}
            hitSlop={12}
            className="absolute left-6 h-10 w-10 items-center justify-center rounded-full active:opacity-60"
            style={{top: insets.top + 22, backgroundColor: theme.surface}}>
            <BackIcon size={22} color={theme.muted} />
          </Pressable>

          <View
            className="absolute right-6 flex-row items-center gap-2"
            style={{top: insets.top + 22}}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={saved ? 'Saved on this device. Remove' : 'Save to this device'}
              accessibilityState={{selected: saved}}
              onPress={() => (saved ? offline.remove(article.id) : offline.save(article))}
              hitSlop={12}
              className="h-10 w-10 items-center justify-center rounded-full active:opacity-60"
              style={{backgroundColor: theme.surface}}>
              {saved ? (
                <CheckIcon size={20} color={accent} />
              ) : (
                <OfflineIcon size={20} color={theme.muted} />
              )}
            </Pressable>
            <Pressable
              accessibilityLabel="Reading settings"
              onPress={() => setSettingsOpen(true)}
              hitSlop={12}
              className="rounded-full px-3.5 py-2 active:opacity-60"
              style={{backgroundColor: theme.surface}}>
              <Text style={[styles.aa, {color: theme.muted}]}>Aa</Text>
            </Pressable>
          </View>
        </Animated.View>
      </GestureDetector>

      {settingsOpen && (
        <ReaderSettingsSheet onClose={() => setSettingsOpen(false)} />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    backgroundColor: 'black',
  },
  sheet: {flex: 1, overflow: 'hidden'},
  progressTrack: {height: 3},
  progressBar: {height: 3},
  content: {paddingHorizontal: 24, paddingTop: 96},
  source: {
    fontFamily: 'PlusJakartaSans',
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 2,
    textTransform: 'uppercase',
  },
  title: {
    marginTop: 16,
    fontFamily: 'Newsreader',
    fontSize: 40,
    fontWeight: '600',
    lineHeight: 46,
    letterSpacing: -0.5,
  },
  byline: {marginTop: 18, fontFamily: 'PlusJakartaSans', fontSize: 17},
  body: {marginTop: 48},
  aa: {fontFamily: 'Newsreader', fontSize: 17, fontWeight: '600'},
  endRow: {
    marginTop: 56,
    paddingTop: 28,
    borderTopWidth: StyleSheet.hairlineWidth,
    gap: 16,
  },
  endPrompt: {fontFamily: 'Newsreader', fontSize: 20, fontStyle: 'italic'},
  endActions: {flexDirection: 'row', gap: 12},
  endButton: {
    flex: 1,
    height: 52,
    borderRadius: 26,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  endLabel: {fontFamily: 'PlusJakartaSans', fontSize: 16, fontWeight: '600'},
});
