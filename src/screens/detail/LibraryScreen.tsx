import * as React from 'react';
import {ActivityIndicator, TextInput, View} from 'react-native';

import * as api from '@/api';
import type {LibraryItem} from '@/api';
import {DetailScreen} from '@/components/layout';
import {LibraryRow} from '@/components/library/LibraryRow';
import {ReaderHost} from '@/components/reader/ReaderHost';
import {Button} from '@/components/ui/button';
import {Text} from '@/components/ui/text';
import {useAppearance} from '@/lib/appearance';
import {formatDayMonth} from '@/lib/date';
import {SearchIcon} from '@/lib/icons';
import {useNavigation} from '@/lib/navigation';
import {useReader} from '@/lib/reader';
import {THEME} from '@/lib/theme';
import {useAsync} from '@/lib/use-async';

const MIN_QUERY = 2;

const isRead = (item: LibraryItem) => item.state === 'opened' || item.state === 'finished';

/** Everything pulled for this user, with search over the same library. */
export function LibraryScreen() {
  const {closeDetail, detailQuery} = useNavigation();
  const {resolved} = useAppearance();
  const reader = useReader();

  const [query, setQuery] = React.useState(detailQuery);
  const [search, setSearch] = React.useState(detailQuery.trim());
  const searching = search.length >= MIN_QUERY;

  const [items, setItems] = React.useState<LibraryItem[]>([]);
  const [cursor, setCursor] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [loadingMore, setLoadingMore] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const results = useAsync(
    () => (searching ? api.searchLibrary(search) : Promise.resolve([] as LibraryItem[])),
    [search],
  );

  const loadPage = React.useCallback(async (from: string | null) => {
    const page = await api.getLibrary(from);
    setItems(prev => (from ? [...prev, ...page.items] : page.items));
    setCursor(page.nextCursor);
  }, []);

  React.useEffect(() => {
    loadPage(null)
      .catch((e: unknown) => setError(e instanceof Error ? e.message : 'Could not load your library.'))
      .finally(() => setLoading(false));
  }, [loadPage]);

  const loadMore = async () => {
    setLoadingMore(true);
    try {
      await loadPage(cursor);
    } catch {
      // The button stays, so the user can simply try again.
    } finally {
      setLoadingMore(false);
    }
  };

  const open = (item: LibraryItem) => {
    reader.open(item.id);
    // Opening marks it read on the server; reflect that without a refetch.
    if (!isRead(item)) {
      setItems(prev => prev.map(i => (i.id === item.id ? {...i, state: 'opened'} : i)));
    }
  };

  const list = searching ? results.data ?? [] : items;
  const listLoading = searching ? results.loading : loading;
  const listError = searching ? results.error : error;

  return (
    <DetailScreen title="Everything pulled" onBack={closeDetail} overlay={<ReaderHost />}>
      <View className="-mb-3 flex-row items-center gap-3 rounded-lg border border-border bg-card px-4">
        <SearchIcon size={20} className="text-muted-foreground" />
        <TextInput
          value={query}
          onChangeText={text => {
            setQuery(text);
            // Clearing the field goes straight back to browsing.
            if (!text.trim()) {
              setSearch('');
            }
          }}
          onSubmitEditing={() => setSearch(query.trim())}
          returnKeyType="search"
          autoCorrect={false}
          placeholder="Search everything"
          placeholderTextColor={THEME[resolved].mutedForeground}
          className="min-h-[52px] flex-1 text-[17px] text-foreground"
        />
      </View>

      <View>
        {searching && !results.loading && !results.error ? (
          <Text className="pb-1 text-[13px] font-semibold uppercase tracking-[2px] text-muted-foreground">
            {list.length === 1 ? '1 result' : `${list.length} results`}
          </Text>
        ) : null}

        {listLoading ? (
          <View className="items-center py-16">
            <ActivityIndicator />
          </View>
        ) : list.length === 0 ? (
          <Text className="py-16 text-center text-[16px] leading-[24px] text-muted-foreground">
            {listError ??
              (searching
                ? `Nothing in your library matches “${search}”.`
                : 'Nothing pulled yet. Articles from your sources collect here as they arrive.')}
          </Text>
        ) : (
          list.map((item, index) => (
            <LibraryRow
              key={item.id}
              source={item.source}
              title={item.title}
              excerpt={item.excerpt}
              meta={`${formatDayMonth(item.publishedAt.slice(0, 10))} · ${item.readMinutes} min`}
              read={isRead(item)}
              last={index === list.length - 1}
              onPress={() => open(item)}
            />
          ))
        )}

        {!searching && cursor ? (
          <Button
            variant="ghost"
            size="lg"
            disabled={loadingMore}
            className="mt-4 h-12 self-center rounded-xl"
            onPress={loadMore}>
            <Text className="text-[16px] font-medium text-primary">
              {loadingMore ? 'Loading…' : 'Show more'}
            </Text>
          </Button>
        ) : null}
      </View>
    </DetailScreen>
  );
}
