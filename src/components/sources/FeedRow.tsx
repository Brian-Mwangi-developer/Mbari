import * as React from 'react';
import {Pressable, View} from 'react-native';

import {Text} from '@/components/ui/text';
import type {Feed} from '@/api';
import {MutedIcon, UnmutedIcon} from '@/lib/icons';
import {cn} from '@/lib/utils';

type Props = {
  feed: Feed;
  /** Dividers sit between rows, so the last one goes without. */
  last: boolean;
  onToggleMute: (feed: Feed) => void;
};

export function FeedRow({feed, last, onToggleMute}: Props) {
  const Icon = feed.muted ? MutedIcon : UnmutedIcon;

  return (
    <View
      className={cn(
        'min-h-[64px] flex-row items-center pl-5 pr-2',
        !last && 'border-b border-border',
      )}>
      <Text
        className={cn(
          'flex-1 py-4 text-[19px]',
          feed.muted ? 'text-muted-foreground' : 'text-foreground',
        )}>
        {feed.name}
      </Text>

      <Pressable
        accessibilityRole="switch"
        accessibilityState={{checked: !feed.muted}}
        accessibilityLabel={
          feed.muted ? `Unmute ${feed.name}` : `Mute ${feed.name}`
        }
        onPress={() => onToggleMute(feed)}
        hitSlop={8}
        className="h-12 w-12 items-center justify-center rounded-full active:opacity-60">
        <Icon
          size={22}
          className={feed.muted ? 'text-foreground' : 'text-muted-foreground'}
        />
      </Pressable>
    </View>
  );
}
