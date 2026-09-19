import * as React from 'react';
import {Pressable, View} from 'react-native';
import {Inbox, Settings, Sun, Users, type LucideIcon} from 'lucide-react-native';

import {TildeMarker} from '@/components/brand/Tilde';
import {Text} from '@/components/ui/text';
import {MESSAGES} from '@/data/static';
import {useCommunity} from '@/lib/community';
import {TABS, type Tab, useNavigation} from '@/lib/navigation';
import {useTheme} from '@/lib/theme';
import {cn} from '@/lib/utils';

const ICONS: Record<Tab, LucideIcon> = {
  Home: Sun,
  Community: Users,
  Inbox: Inbox,
  Settings: Settings,
};

/** The bottom bar: Lucide icons, the active tab in the accent with the small tilde under it. */
export function TabBar() {
  const {tab: active, setTab} = useNavigation();
  const {county} = useCommunity();
  const theme = useTheme();
  const unread = MESSAGES.filter(m => m.county === county && m.unread).length;

  return (
    <View accessibilityRole="tablist" className="flex-row border-t border-border bg-background px-2 pb-2 pt-2.5">
      {TABS.map(tab => {
        const Icon = ICONS[tab];
        const isActive = tab === active;
        const badge = tab === 'Inbox' && unread > 0 ? unread : 0;
        return (
          <Pressable
            key={tab}
            accessibilityRole="tab"
            accessibilityLabel={badge ? `${tab}, ${badge} new` : tab}
            accessibilityState={{selected: isActive}}
            onPress={() => setTab(tab)}
            className="flex-1 items-center gap-1 pb-3.5 pt-1 active:opacity-70">
            <View>
              <Icon size={24} strokeWidth={isActive ? 2.2 : 2} color={isActive ? theme.primary : theme.mutedForeground} />
              {badge ? (
                <View className="absolute -right-2.5 -top-1.5 h-[17px] min-w-[17px] items-center justify-center rounded-full bg-primary px-1">
                  <Text className="text-[10px] font-bold text-primary-foreground">{badge}</Text>
                </View>
              ) : null}
            </View>
            <Text className={cn('text-[12px] font-medium', isActive ? 'text-primary' : 'text-muted-foreground')}>{tab}</Text>
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
