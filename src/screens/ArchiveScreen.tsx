import * as React from 'react';
import {ActivityIndicator, FlatList, View} from 'react-native';

import * as api from '@/api';
import type {ArchiveItem} from '@/api';
import {ArchiveRow} from '@/components/archive/ArchiveRow';
import {Screen} from '@/components/layout';
import {Text} from '@/components/ui/text';
import {useReader} from '@/lib/reader';
import {useAsync} from '@/lib/use-async';

export function ArchiveScreen() {
  const reader = useReader();
  const {data, loading, error} = useAsync(api.getArchive);

  const handlePress = React.useCallback(
    (item: ArchiveItem) => reader.open(item.id),
    [reader],
  );

  if (loading) {
    return (
      <Screen title="Archive">
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator />
        </View>
      </Screen>
    );
  }

  return (
    <Screen title="Archive">
      <FlatList
        data={data ?? []}
        keyExtractor={item => item.id}
        renderItem={({item}) => <ArchiveRow item={item} onPress={handlePress} />}
        contentContainerClassName="pb-6"
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View className="items-center px-6 pt-16">
            <Text className="text-center text-muted-foreground">
              {error ?? 'Your past picks will collect here.'}
            </Text>
          </View>
        }
      />
    </Screen>
  );
}
