import * as React from 'react';
import {Pressable, View} from 'react-native';

import {Text} from '@/components/ui/text';
import {ArchiveIcon, RssIcon, SettingsIcon, SunIcon} from '@/lib/icons';
import {TABS, type Tab, useNavigation} from '@/lib/navigation';
import {useSources} from '@/lib/sources';
import {cn} from '@/lib/utils';

const ICONS: Record<Tab, typeof SunIcon> = {
  Today: SunIcon,
  Archive: ArchiveIcon,
  Sources: RssIcon,
  Settings: SettingsIcon,
};

/** Tabs that only make sense once the user has connected sources. */
const NEEDS_SOURCES: ReadonlySet<Tab> = new Set(['Archive', 'Sources']);

export function TabBar() {
  const {tab: active, setTab} = useNavigation();
  const {sources, loading} = useSources();
  // Locked only once the list has loaded empty, so the tabs don't flicker
  // disabled on every launch.
  const hasSources = loading || sources.length > 0;

  return (
    <View className="flex-row border-t border-border bg-background pb-2 pt-3">
      {TABS.map(tab => {
        const Icon = ICONS[tab];
        const isActive = tab === active;
        const locked = NEEDS_SOURCES.has(tab) && !hasSources;
        const tone = isActive ? 'text-primary' : 'text-muted-foreground';
        return (
          <Pressable
            key={tab}
            accessibilityRole="tab"
            accessibilityState={{selected: isActive, disabled: locked}}
            disabled={locked}
            onPress={() => setTab(tab)}
            className={cn(
              'flex-1 items-center gap-1.5 py-2 active:opacity-70',
              locked && 'opacity-40',
            )}>
            <Icon size={24} strokeWidth={isActive ? 2 : 1.75} className={tone} />
            <Text className={cn('text-[13px] font-medium', tone)}>{tab}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}
