import * as React from 'react';
import {Pressable} from 'react-native';

import {Text} from '@/components/ui/text';
import type {ArchiveItem} from '@/api';
import {formatDayMonth} from '@/lib/date';
import {cn} from '@/lib/utils';

type Props = {
  item: ArchiveItem;
  onPress: (item: ArchiveItem) => void;
};

export function ArchiveRow({item, onPress}: Props) {
  return (
    <Pressable
      onPress={() => onPress(item)}
      className="border-b border-border px-6 py-7 active:bg-secondary/60">
      <Text className="text-[13px] font-semibold uppercase tracking-[2px] text-muted-foreground">
        {formatDayMonth(item.date)} · {item.source}
      </Text>
      <Text
        className={cn(
          'mt-3 font-serif text-[24px] leading-[33px]',
          item.read ? 'text-muted-foreground' : 'text-foreground',
        )}>
        {item.title}
      </Text>
    </Pressable>
  );
}
