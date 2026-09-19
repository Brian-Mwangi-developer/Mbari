import * as React from 'react';
import {Pressable, View} from 'react-native';

import {DetailScreen} from '@/components/layout';
import {LibraryRow} from '@/components/library/LibraryRow';
import {ReaderHost} from '@/components/reader/ReaderHost';
import {Text} from '@/components/ui/text';
import {formatDayMonth} from '@/lib/date';
import {TrashIcon} from '@/lib/icons';
import {useNavigation} from '@/lib/navigation';
import {useOffline} from '@/lib/offline';
import {useReader} from '@/lib/reader';

/** Articles kept on this phone, readable without a connection. */
export function OfflineScreen() {
  const {closeDetail} = useNavigation();
  const reader = useReader();
  const {saved, remove, retention} = useOffline();

  return (
    <DetailScreen title="On this device" onBack={closeDetail} overlay={<ReaderHost />}>
      <Text className="text-[16px] leading-[24px] text-muted-foreground">
        Saved on this phone for reading offline.{' '}
        {retention === null
          ? 'They stay until you remove them.'
          : `Each is removed ${retention} days after you save it.`}{' '}
        Signing out removes them.
      </Text>

      <View>
        {saved.length === 0 ? (
          <Text className="py-16 text-center text-[16px] leading-[24px] text-muted-foreground">
            Nothing saved yet. Use the save button at the top of an article to keep it here.
          </Text>
        ) : (
          saved.map(({article, savedAt}, index) => (
            <LibraryRow
              key={article.id}
              source={article.source}
              title={article.title}
              meta={`Saved ${formatDayMonth(savedAt.slice(0, 10))}`}
              last={index === saved.length - 1}
              onPress={() => reader.open(article.id)}
              trailing={
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={`Remove ${article.title} from this device`}
                  hitSlop={8}
                  onPress={() => remove(article.id)}
                  className="h-11 w-11 items-center justify-center rounded-full active:bg-secondary/60">
                  <TrashIcon size={20} className="text-muted-foreground" />
                </Pressable>
              }
            />
          ))
        )}
      </View>
    </DetailScreen>
  );
}
