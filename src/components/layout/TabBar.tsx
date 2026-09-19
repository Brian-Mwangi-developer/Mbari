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

/** The bottom bar: the active tab takes the accent, with a small tilde under it. */
export function TabBar() {
  const {tab: active, setTab} = useNavigation();
  const {resolved} = useAppearance();
  const colors = THEME[resolved];

  return (
    <View accessibilityRole="tablist" className="flex-row border-t border-border bg-background pb-2 pt-3">
      {TABS.map(tab => {
        const isActive = tab === active;
        return (
          <Pressable
            key={tab}
            accessibilityRole="tab"
            accessibilityState={{selected: isActive}}
            onPress={() => setTab(tab)}
            className="flex-1 items-center gap-1.5 pb-3 pt-2 active:opacity-70">
            <Icon
              name={ICONS[tab]}
              size={24}
              strokeWidth={isActive ? 2.2 : 1.9}
              color={isActive ? colors.primary : colors.mutedForeground}
            />
            <Text className={cn('text-[13px] font-medium', isActive ? 'text-primary' : 'text-muted-foreground')}>{tab}</Text>
            {isActive ? (
              <View className="absolute bottom-0">
                <TildeMarker width={22} />
              </View>
            ) : null}
          </Pressable>
        );
      })}
    </View>
  );
}
