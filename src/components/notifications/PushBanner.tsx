import * as React from 'react';
import {Pressable, View} from 'react-native';
import Animated, {FadeInUp, FadeOutUp} from 'react-native-reanimated';
import {useSafeAreaInsets} from 'react-native-safe-area-context';

import {Text} from '@/components/ui/text';
import {CloseIcon} from '@/lib/icons';
import {useNotifications} from '@/lib/notifications';

/** A recommendation that arrived while the app was open, shown instead of a system notification. */
export function PushBanner() {
  const {banner, dismissBanner, openPush} = useNotifications();
  const insets = useSafeAreaInsets();
  if (!banner) {
    return null;
  }
  return (
    <Animated.View
      entering={FadeInUp.duration(220)}
      exiting={FadeOutUp.duration(180)}
      className="absolute left-4 right-4 z-50"
      style={{top: insets.top + 8}}>
      <View className="flex-row items-center gap-3 rounded-2xl border border-border bg-card py-3 pl-4 pr-2 shadow-lg shadow-black/20">
        <Pressable accessibilityRole="button" accessibilityLabel={`Read ${banner.title}`} onPress={() => openPush(banner)} className="flex-1 active:opacity-70">
          <Text className="text-[12px] font-semibold uppercase tracking-[1.5px] text-primary">Worth your time</Text>
          <Text numberOfLines={2} className="mt-1 font-serif text-[18px] leading-[24px]">
            {banner.title}
          </Text>
          {banner.body ? (
            <Text numberOfLines={1} className="mt-0.5 text-[13px] text-muted-foreground">
              {banner.body}
            </Text>
          ) : null}
        </Pressable>
        <Pressable accessibilityRole="button" accessibilityLabel="Dismiss" onPress={dismissBanner} hitSlop={8} className="h-10 w-10 items-center justify-center rounded-full active:bg-secondary">
          <CloseIcon size={18} className="text-muted-foreground" />
        </Pressable>
      </View>
    </Animated.View>
  );
}
