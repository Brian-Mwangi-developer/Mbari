import * as React from 'react';
import {ActivityIndicator, View} from 'react-native';

import * as api from '@/api';
import type {PassedOverItem} from '@/api';
import {DetailScreen} from '@/components/layout';
import {LibraryRow} from '@/components/library/LibraryRow';
import {ReaderHost} from '@/components/reader/ReaderHost';
import {Text} from '@/components/ui/text';
import {formatDayMonth} from '@/lib/date';
import {useNavigation} from '@/lib/navigation';
import {useReader} from '@/lib/reader';
import {useAsync} from '@/lib/use-async';

function describe(item: PassedOverItem): string {
  const day = item.servedAt ? formatDayMonth(item.servedAt.slice(0, 10)) : null;
  const what = item.reason === 'dismissed' ? 'Passed' : 'Not opened';
  return day ? `${what} ${day}` : what;
}

/** Cards the reader swiped left on, or dealt on an earlier day and never opened. */
export function PassedOverScreen() {
  const {closeDetail} = useNavigation();
  const reader = useReader();
  const {data, loading, error} = useAsync(api.getPassedOver);
  const [opened, setOpened] = React.useState<string[]>([]);

  // Opening one takes it off this list on the server; mirror that here.
  const items = (data ?? []).filter(item => !opened.includes(item.id));

  return (
    <DetailScreen title="Passed over" onBack={closeDetail} overlay={<ReaderHost />}>
      <Text className="text-[16px] leading-[24px] text-muted-foreground">
        Cards you passed on, and ones from earlier days you never opened. Opening one takes
        it off this list.
      </Text>

      <View>
        {loading ? (
          <View className="items-center py-16">
            <ActivityIndicator />
          </View>
        ) : items.length === 0 ? (
          <Text className="py-16 text-center text-[16px] leading-[24px] text-muted-foreground">
            {error ?? 'Nothing passed over.'}
          </Text>
        ) : (
          items.map((item, index) => (
            <LibraryRow
              key={item.id}
              source={item.source}
              title={item.title}
              meta={`${describe(item)} · ${item.readMinutes} min`}
              last={index === items.length - 1}
              onPress={() => {
                reader.open(item.id);
                setOpened(prev => [...prev, item.id]);
              }}
            />
          ))
        )}
      </View>
    </DetailScreen>
  );
}
