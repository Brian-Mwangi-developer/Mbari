import * as React from 'react';
import {Pressable, View} from 'react-native';

import {Text} from '@/components/ui/text';
import {cn} from '@/lib/utils';

type Props = {
  source: string;
  title: string;
  /** Short facts after the source, e.g. "13 Sep · 6 min". */
  meta: string;
  excerpt?: string | null;
  /** Already read: drawn quieter, like the Archive. */
  read?: boolean;
  last?: boolean;
  onPress: () => void;
  /** Right-hand action, e.g. remove from this device. */
  trailing?: React.ReactNode;
};

/** One article in a Library list. */
export function LibraryRow({
  source,
  title,
  meta,
  excerpt,
  read = false,
  last = false,
  onPress,
  trailing,
}: Props) {
  return (
    <View className={cn('flex-row items-start gap-3', !last && 'border-b border-border')}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={`${title}, from ${source}`}
        onPress={onPress}
        className="flex-1 py-5 active:opacity-60">
        <Text
          numberOfLines={1}
          className="text-[12px] font-semibold uppercase tracking-[2px] text-muted-foreground">
          {source} · {meta}
        </Text>
        <Text
          numberOfLines={3}
          className={cn(
            'mt-2 font-serif text-[21px] leading-[29px]',
            read ? 'text-muted-foreground' : 'text-foreground',
          )}>
          {title}
        </Text>
        {excerpt ? (
          <Text numberOfLines={2} className="mt-1.5 text-[15px] leading-[22px] text-muted-foreground">
            {excerpt}
          </Text>
        ) : null}
      </Pressable>
      {trailing ? <View className="pt-4">{trailing}</View> : null}
    </View>
  );
}
