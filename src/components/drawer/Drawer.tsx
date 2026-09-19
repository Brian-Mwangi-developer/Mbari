import * as React from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import Animated, {
  Easing,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';
import {scheduleOnRN} from 'react-native-worklets';
import {SafeAreaView} from 'react-native-safe-area-context';

import {Wordmark} from '@/components/brand/Wordmark';
import {DrawerRow} from '@/components/drawer/DrawerRow';
import {Text} from '@/components/ui/text';
import * as api from '@/api';
import {useSession} from '@/lib/session';
import {useAsync} from '@/lib/use-async';
import {useAppearance} from '@/lib/appearance';
import {type Detail, useNavigation} from '@/lib/navigation';
import {useReader} from '@/lib/reader';
import {
  DeviceIcon,
  HeadphonesIcon,
  HighlighterIcon,
  LayersIcon,
  PassedOverIcon,
  SaveIcon,
  SearchIcon,
} from '@/lib/icons';
import {THEME} from '@/lib/theme';

/** Fraction of the screen the panel covers. */
const WIDTH_RATIO = 0.78;
const DURATION = 240;

type Props = {
  onClose: () => void;
};

function SectionLabel({children}: {children: string}) {
  return (
    <Text className="px-2 text-[13px] font-semibold uppercase tracking-[2px] text-muted-foreground">
      {children}
    </Text>
  );
}

export function Drawer({onClose}: Props) {
  const {width} = useWindowDimensions();
  const {account} = useSession();
  // The drawer's "Recent" list is just the tail of the archive.
  const {data: archive} = useAsync(api.getArchive);
  const recent = (archive ?? []).slice(0, 3);
  const displayName = account?.name ?? 'You';
  const {resolved} = useAppearance();
  const {openDetail} = useNavigation();
  const reader = useReader();
  const [query, setQuery] = React.useState('');
  const panelWidth = Math.round(width * WIDTH_RATIO);
  const progress = useSharedValue(0);

  React.useEffect(() => {
    progress.value = withTiming(1, {
      duration: DURATION,
      easing: Easing.out(Easing.cubic),
    });
  }, [progress]);

  const dismiss = React.useCallback(
    (then?: () => void) => {
      const done = () => {
        onClose();
        then?.();
      };
      progress.value = withTiming(
        0,
        {duration: DURATION, easing: Easing.in(Easing.cubic)},
        finished => {
          if (finished) {
            scheduleOnRN(done);
          }
        },
      );
    },
    [progress, onClose],
  );

  const go = (detail: Detail) => () => dismiss(() => openDetail(detail));

  const submitSearch = () => {
    const trimmed = query.trim();
    if (trimmed.length >= 2) {
      dismiss(() => openDetail('library', {query: trimmed}));
    }
  };

  const panelStyle = useAnimatedStyle(() => ({
    transform: [
      {translateX: interpolate(progress.value, [0, 1], [-panelWidth, 0])},
    ],
  }));

  const scrimStyle = useAnimatedStyle(() => ({opacity: progress.value}));

  return (
    <Modal visible transparent animationType="none" onRequestClose={() => dismiss()}>
      <View className="flex-1 flex-row">
        <Animated.View style={panelStyle} className="bg-background">
          <SafeAreaView className="flex-1" style={{width: panelWidth}}>
            <ScrollView
              className="flex-1"
              contentContainerClassName="gap-8 px-4 pb-6 pt-6"
              showsVerticalScrollIndicator={false}>
              <View className="px-2 pt-2">
                <Wordmark size={24} />
              </View>

              <View className="flex-row items-center gap-3 rounded-lg border border-border bg-card px-4">
                <SearchIcon size={20} className="text-muted-foreground" />
                <TextInput
                  value={query}
                  onChangeText={setQuery}
                  onSubmitEditing={submitSearch}
                  returnKeyType="search"
                  autoCorrect={false}
                  placeholder="Search everything"
                  placeholderTextColor={THEME[resolved].mutedForeground}
                  className="min-h-[52px] flex-1 text-[17px] text-foreground"
                />
              </View>

              <View className="gap-1">
                <SectionLabel>Library</SectionLabel>
                <DrawerRow
                  icon={LayersIcon}
                  label="Everything pulled"
                  onPress={go('library')}
                />
                <DrawerRow
                  icon={SaveIcon}
                  label="Saved"
                  onPress={go('saved')}
                />
                <DrawerRow
                  icon={PassedOverIcon}
                  label="Passed over"
                  onPress={go('passedOver')}
                />
                <DrawerRow
                  icon={DeviceIcon}
                  label="On this device"
                  onPress={go('offline')}
                />
                <DrawerRow icon={HeadphonesIcon} label="Audio" soon />
                <DrawerRow icon={HighlighterIcon} label="Highlights" soon />
              </View>

              <View className="gap-1">
                <SectionLabel>Recent</SectionLabel>
                {recent.map(item => (
                  <Pressable
                    key={item.id}
                    accessibilityRole="button"
                    accessibilityLabel={`${item.title}, from ${item.source}`}
                    onPress={() => dismiss(() => reader.open(item.id))}
                    className="gap-1.5 rounded-lg px-2 py-3 active:bg-secondary/60">
                    <Text className="text-[12px] font-semibold uppercase tracking-[2px] text-muted-foreground">
                      {item.source}
                    </Text>
                    <Text numberOfLines={1} className="text-[17px]">
                      {item.title}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </ScrollView>

            <Pressable
              accessibilityRole="button"
              accessibilityLabel={`Account, ${displayName}`}
              onPress={() => dismiss()}
              className="min-h-[76px] flex-row items-center gap-3.5 border-t border-border px-5 active:bg-secondary/60">
              <View className="h-11 w-11 items-center justify-center rounded-full border border-border">
                <Text className="text-[17px] font-semibold text-muted-foreground">
                  {displayName.charAt(0).toUpperCase()}
                </Text>
              </View>
              <View className="flex-1">
                <Text className="text-[17px] font-semibold">
                  {displayName}
                </Text>
                <Text
                  numberOfLines={1}
                  className="text-[13px] text-muted-foreground">
                  {account?.email ?? ''}
                </Text>
              </View>
            </Pressable>
          </SafeAreaView>
        </Animated.View>

        <Animated.View className="flex-1" style={scrimStyle}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Close menu"
            onPress={() => dismiss()}
            className="flex-1 bg-black/60"
          />
        </Animated.View>
      </View>
    </Modal>
  );
}
