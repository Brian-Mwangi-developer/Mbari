import * as React from 'react';
import {ActivityIndicator, ScrollView, View} from 'react-native';

import * as api from '@/api';
import type {Feed, PendingSource} from '@/api';
import {Screen, Section} from '@/components/layout';
import {AddFeedButton} from '@/components/sources/AddFeedButton';
import {AddFeedSheet} from '@/components/sources/AddFeedSheet';
import {AddressCard} from '@/components/sources/AddressCard';
import {FeedRow} from '@/components/sources/FeedRow';
import {PendingSourceRow} from '@/components/sources/PendingSourceRow';
import {Button} from '@/components/ui/button';
import {Text} from '@/components/ui/text';
import {useNavigation} from '@/lib/navigation';
import {useSources} from '@/lib/sources';
import {useAsync} from '@/lib/use-async';

export function SourcesScreen() {
  const {sources, loading, error, add, toggleMute, reload: reloadSources} = useSources();
  const {openDetail} = useNavigation();
  const [adding, setAdding] = React.useState(false);

  const address = useAsync(api.getAddress);
  const pending = useAsync(api.getPendingSources);
  const [reviewing, setReviewing] = React.useState<string | null>(null);

  const handleToggleMute = React.useCallback(
    (feed: Feed) => {
      // Errors are handled inside the provider, which reverts the optimistic flip.
      toggleMute(feed).catch(() => {});
    },
    [toggleMute],
  );

  const review = async (source: PendingSource, decision: 'keep' | 'ignore') => {
    setReviewing(source.id);
    try {
      if (decision === 'keep') {
        await api.keepSource(source.id);
        await reloadSources();
      } else {
        await api.ignoreSource(source.id);
      }
      pending.reload();
    } catch {
    } finally {
      setReviewing(null);
    }
  };

  const pendingSources = pending.data ?? [];

  return (
    <Screen title="Sources">
      <ScrollView
        className="flex-1"
        contentContainerClassName="gap-9 px-6 pb-12"
        showsVerticalScrollIndicator={false}>
        <Section title="Your address">
          {address.data ? (
            <AddressCard address={address.data.address} />
          ) : (
            <View className="rounded-lg border border-border bg-card px-5 py-8">
              {address.error ? (
                <Text className="text-center text-muted-foreground">{address.error}</Text>
              ) : (
                <ActivityIndicator />
              )}
            </View>
          )}
          <Button
            variant="ghost"
            size="lg"
            className="mt-2 h-12 self-start rounded-xl px-0"
            onPress={() => openDetail('forwarding')}>
            <Text className="text-[16px] font-medium text-primary">
              Forward newsletters from Gmail →
            </Text>
          </Button>
        </Section>

        {pendingSources.length > 0 && (
          <Section title="New sources">
            <View className="overflow-hidden rounded-lg border border-border bg-card">
              {pendingSources.map((source, index) => (
                <PendingSourceRow
                  key={source.id}
                  source={source}
                  last={index === pendingSources.length - 1}
                  busy={reviewing === source.id}
                  onKeep={s => review(s, 'keep')}
                  onIgnore={s => review(s, 'ignore')}
                />
              ))}
            </View>
            <Text className="mt-3 text-[14px] leading-[21px] text-muted-foreground">
              Found in mail sent to your address. Nothing from a sender becomes
              a pick until you keep it.
            </Text>
          </Section>
        )}

        <Section title="Feeds">
          {loading ? (
            <View className="rounded-lg border border-border bg-card px-5 py-8">
              <ActivityIndicator />
            </View>
          ) : sources.length > 0 ? (
            <View className="overflow-hidden rounded-lg border border-border bg-card">
              {sources.map((feed, index) => (
                <FeedRow
                  key={feed.id}
                  feed={feed}
                  last={index === sources.length - 1}
                  onToggleMute={handleToggleMute}
                />
              ))}
            </View>
          ) : (
            <View className="rounded-lg border border-border bg-card px-5 py-8">
              <Text className="text-center text-muted-foreground">
                {error ?? 'Nothing subscribed yet. Add a blog or newsletter below.'}
              </Text>
            </View>
          )}
        </Section>

        <AddFeedButton onPress={() => setAdding(true)} />
      </ScrollView>

      <AddFeedSheet visible={adding} onClose={() => setAdding(false)} onSubmit={add} />
    </Screen>
  );
}
