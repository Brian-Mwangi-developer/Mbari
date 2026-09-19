import * as React from 'react';
import {View} from 'react-native';

import type {PendingSource} from '@/api';
import {Button} from '@/components/ui/button';
import {Text} from '@/components/ui/text';
import {cn} from '@/lib/utils';

type Props = {
  source: PendingSource;
  last: boolean;
  busy: boolean;
  onKeep: (source: PendingSource) => void;
  onIgnore: (source: PendingSource) => void;
};

/**
 * A sender Mbari found in forwarded mail. Its issues are already stored, but
 * nothing from it becomes a pick until the user keeps it.
 */
export function PendingSourceRow({source, last, busy, onKeep, onIgnore}: Props) {
  return (
    <View className={cn('px-5 py-4', !last && 'border-b border-border')}>
      <Text className="text-[17px] font-semibold">{source.name}</Text>
      {source.latestTitle && (
        <Text numberOfLines={2} className="mt-1 text-[15px] leading-[22px] text-muted-foreground">
          {source.latestTitle}
        </Text>
      )}
      {source.fromAddress && (
        <Text numberOfLines={1} className="mt-1 font-mono text-[13px] text-muted-foreground">
          {source.fromAddress}
        </Text>
      )}

      <View className="mt-3 flex-row gap-2">
        <Button
          size="sm"
          className="h-10 rounded-full px-5"
          disabled={busy}
          onPress={() => onKeep(source)}>
          <Text className="font-semibold">Keep</Text>
        </Button>
        <Button
          variant="ghost"
          size="sm"
          className="h-10 rounded-full px-5"
          disabled={busy}
          onPress={() => onIgnore(source)}>
          <Text className="text-foreground/80">Ignore</Text>
        </Button>
      </View>
    </View>
  );
}
