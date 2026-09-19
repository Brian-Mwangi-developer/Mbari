import * as React from 'react';
import {ActivityIndicator, Pressable, View} from 'react-native';

import {Text} from '@/components/ui/text';
import {UndoIcon} from '@/lib/icons';
import type {DeckState} from '@/lib/deck-state';

type Props = {
  state: DeckState;
  loading: boolean;
  error: string | null;
  canGoBack: boolean;
  onBack: () => void;
  onRefresh: () => void;
  onReviewSenders: () => void;
};

const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;

/**
 * What Today shows past the last card. A spinner only while a request is
 * actually running; otherwise the honest reason there is nothing to show.
 */
export function DeckEnd({state, loading, error, canGoBack, onBack, onRefresh, onReviewSenders}: Props) {
  if (loading) {
    return (
      <View className="flex-1 items-center justify-center gap-4 rounded-[28px] border border-dashed border-border">
        <ActivityIndicator />
        <Text className="font-serif text-[20px] text-muted-foreground">Finding the next one…</Text>
      </View>
    );
  }

  const stats = state.stats;
  const notes: string[] = [];
  if (stats && stats.unread > 0) {
    notes.push(`${plural(stats.unread, 'unread article')} could not be ranked just now. Check again in a moment.`);
  }
  if (stats && stats.comingBack > 0) {
    notes.push(`${plural(stats.comingBack, 'card')} you moved past come back in about half an hour.`);
  }
  if (stats && stats.waitingSenders > 0) {
    notes.push(`${plural(stats.waitingSenders, 'issue')} from newsletter senders you have not kept yet are waiting in Sources.`);
  }
  const tally = stats ? [`${stats.read} read`, `${stats.passed} passed`, `${stats.library} pulled`].join(' · ') : null;

  return (
    <View className="flex-1 justify-center rounded-[28px] border border-border bg-card px-8">
      <View className="h-[2px] w-12 rounded-full bg-primary" />
      <Text className="mt-7 font-serif text-[34px] font-medium leading-[40px] tracking-tight">
        {error ? 'Recommendations did not load.' : "You're all caught up."}
      </Text>
      <Text className="mt-4 font-serif text-[18px] leading-[28px] text-foreground/70">
        {error
          ? `${error} Your place is kept; try again when you are back online.`
          : 'Nothing else is worth recommending from your library right now. New cards appear as your sources publish.'}
      </Text>

      {!error && notes.length > 0 ? (
        <View className="mt-6 gap-2">
          {notes.map(note => (
            <Text key={note} className="text-[15px] leading-[22px] text-foreground/80">
              {note}
            </Text>
          ))}
        </View>
      ) : null}
      {!error && tally ? <Text className="mt-6 text-[13px] font-medium text-muted-foreground">{tally}</Text> : null}

      <View className="mt-9 gap-3">
        <Pressable
          accessibilityRole="button"
          onPress={onRefresh}
          className="h-[52px] items-center justify-center rounded-full bg-primary active:opacity-85">
          <Text className="text-[16px] font-semibold text-primary-foreground">{error ? 'Try again' : 'Check again'}</Text>
        </Pressable>
        {!error && stats && stats.waitingSenders > 0 ? (
          <Pressable
            accessibilityRole="button"
            onPress={onReviewSenders}
            className="h-[52px] items-center justify-center rounded-full border border-border active:opacity-70">
            <Text className="text-[16px] font-semibold">Review new senders</Text>
          </Pressable>
        ) : null}
        {canGoBack ? (
          <Pressable
            accessibilityRole="button"
            onPress={onBack}
            className="h-[52px] flex-row items-center justify-center gap-2 rounded-full border border-border active:opacity-70">
            <UndoIcon size={18} className="text-foreground" />
            <Text className="text-[16px] font-semibold">Back to earlier cards</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}
