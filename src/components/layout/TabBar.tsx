import * as React from 'react';
import {Pressable, View} from 'react-native';

import {TildeMarker} from '@/components/brand/Tilde';
import {Icon, type IconName} from '@/components/icons/Icon';
import {Text} from '@/components/ui/text';
import {useAppearance} from '@/lib/appearance';
import {TABS, type Tab, useNavigation} from '@/lib/navigation';
import {THEME} from '@/lib/theme';
import {cn} from '@/lib/utils';

const ICONS: Record<Tab, IconName> = {
  Alerts: 'alerts',
  Community: 'community',
  Replies: 'replies',
  Me: 'me',
};

/**
 * The bottom bar: an icon and a word per tab, a heavy ink rule above, and the
 * small clay tilde under the tab you are on. It is the app's only ornament.
 */
export function TabBar() {
  const {tab: active, setTab} = useNavigation();
  const {resolved} = useAppearance();
  const colors = THEME[resolved];

  return (
    <View
      accessibilityRole="tablist"
      className="flex-row justify-between border-t-[1.5px] border-foreground bg-background px-5 pb-2 pt-3">
      {TABS.map(tab => {
        const isActive = tab === active;
        return (
          <Pressable
            key={tab}
            accessibilityRole="tab"
            accessibilityState={{selected: isActive}}
            onPress={() => setTab(tab)}
            className="min-w-[64px] items-center gap-1 pb-3.5 active:opacity-70">
            <Icon name={ICONS[tab]} size={24} color={isActive ? colors.foreground : colors.mutedForeground} />
            <Text className={cn('text-[11.5px] font-semibold', isActive ? 'text-foreground' : 'text-muted-foreground')}>
              {tab}
            </Text>
            {isActive ? (
              <View className="absolute bottom-0">
                <TildeMarker />
              </View>
            ) : null}
          </Pressable>
        );
      })}
    </View>
  );
}
