import * as React from 'react';
import {ActivityIndicator, View} from 'react-native';

import * as api from '@/api';
import {DetailScreen} from '@/components/layout';
import {LibraryRow} from '@/components/library/LibraryRow';
import {ReaderHost} from '@/components/reader/ReaderHost';
import {Text} from '@/components/ui/text';
import {formatDayMonth} from '@/lib/date';
import {useNavigation} from '@/lib/navigation';
import {useReader} from '@/lib/reader';
import {onSignal} from '@/lib/signals';
import {useAsync} from '@/lib/use-async';

/** Articles saved for later from the deck or the reader. */
export function SavedScreen() {
  const {closeDetail} = useNavigation();
  const reader = useReader();
  const {data, loading, error} = useAsync(api.getSaved);
  const [unsaved, setUnsaved] = React.useState<string[]>([]);

  // Unsaving from the reader takes it off this list straight away.
  React.useEffect(
    () =>
      onSignal(({itemId, type}) => {
        if (type === 'unsave') {
          setUnsaved(prev => [...prev, itemId]);
        } else if (type === 'save') {
          setUnsaved(prev => prev.filter(id => id !== itemId));
        }
      }),
    [],
  );

  const items = (data ?? []).filter(item => !unsaved.includes(item.id));

  return (
    <DetailScreen title="Saved" onBack={closeDetail} overlay={<ReaderHost />}>
      <Text className="text-[16px] leading-[24px] text-muted-foreground">
        Kept for later. Saving also tells Mbari more of this is welcome.
      </Text>

      <View>
        {loading ? (
          <View className="items-center py-16">
            <ActivityIndicator />
          </View>
        ) : items.length === 0 ? (
          <Text className="py-16 text-center text-[16px] leading-[24px] text-muted-foreground">
            {error ?? 'Nothing saved yet. Tap the bookmark on a card to keep it here.'}
          </Text>
        ) : (
          items.map((item, index) => (
            <LibraryRow
              key={item.id}
              source={item.source}
              title={item.title}
              excerpt={item.excerpt}
              meta={`${item.savedAt ? `Saved ${formatDayMonth(item.savedAt.slice(0, 10))} · ` : ''}${item.readMinutes} min`}
              read={item.state === 'finished'}
              last={index === items.length - 1}
              onPress={() => reader.open(item.id)}
            />
          ))
        )}
      </View>
    </DetailScreen>
  );
}
