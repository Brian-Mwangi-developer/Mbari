import * as React from 'react';
import {ActivityIndicator, Pressable, TextInput, View} from 'react-native';

import * as api from '@/api';
import type {ReaderInterests} from '@/api';
import {TopicChip} from '@/components/interests/TopicChip';
import {DetailScreen, Section} from '@/components/layout';
import {Text} from '@/components/ui/text';
import {useAppearance} from '@/lib/appearance';
import {CloseIcon, NoticedIcon} from '@/lib/icons';
import {useNavigation} from '@/lib/navigation';
import {THEME} from '@/lib/theme';

const SUGGESTIONS_SHOWN = 16;

/**
 * What the reader told Mbari, what it noticed from their reading, and
 * what they have been into lately. Everything here is editable: a noticed
 * interest the reader removes stops steering their deck.
 */
export function InterestsScreen() {
  const {closeDetail} = useNavigation();
  const {resolved} = useAppearance();
  const [data, setData] = React.useState<ReaderInterests | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [draft, setDraft] = React.useState('');

  React.useEffect(() => {
    api.getInterests().then(setData, (e: unknown) => setError(e instanceof Error ? e.message : 'Could not load interests.'));
  }, []);

  const save = async (stated: string[]) => {
    const previous = data;
    if (data) {
      setData({...data, stated});
    }
    try {
      setData(await api.setInterests(stated));
    } catch {
      setData(previous);
    }
  };

  const hide = async (slug: string) => {
    const previous = data;
    if (data) {
      setData({...data, noticed: data.noticed.filter(topic => topic.slug !== slug)});
    }
    try {
      setData(await api.setInterestHidden(slug, true));
    } catch {
      setData(previous);
    }
  };

  const stated = data?.stated ?? [];
  const add = (phrase: string) => {
    const clean = phrase.trim().toLowerCase();
    if (clean && !stated.includes(clean)) {
      save([...stated, clean]).catch(() => {});
    }
    setDraft('');
  };

  return (
    <DetailScreen title="Interests" onBack={closeDetail}>
      {!data ? (
        <View className="items-center py-16">
          {error ? <Text className="text-muted-foreground">{error}</Text> : <ActivityIndicator />}
        </View>
      ) : (
        <>
          <Section title="You told us">
            <View className="flex-row flex-wrap gap-2">
              {stated.length === 0 ? (
                <Text className="text-[16px] leading-[24px] text-muted-foreground">
                  Nothing yet. Add a few, or let your reading speak for itself.
                </Text>
              ) : (
                stated.map(phrase => (
                  <TopicChip
                    key={phrase}
                    label={capitalise(phrase)}
                    selected
                    mode="remove"
                    onPress={() => save(stated.filter(s => s !== phrase)).catch(() => {})}
                  />
                ))
              )}
            </View>

            <View className="mt-5 flex-row items-center gap-3 rounded-2xl border border-border bg-card pl-4 pr-2">
              <TextInput
                value={draft}
                onChangeText={setDraft}
                onSubmitEditing={() => add(draft)}
                placeholder="Add an interest, e.g. climate tech"
                placeholderTextColor={THEME[resolved].mutedForeground}
                returnKeyType="done"
                maxLength={60}
                className="min-h-[52px] flex-1 text-[16px] text-foreground"
              />
              <Pressable
                accessibilityRole="button"
                disabled={!draft.trim()}
                onPress={() => add(draft)}
                className={draft.trim() ? 'rounded-full bg-primary px-4 py-2.5 active:opacity-85' : 'rounded-full px-4 py-2.5 opacity-40'}>
                <Text className={draft.trim() ? 'font-semibold text-primary-foreground' : 'font-semibold'}>Add</Text>
              </Pressable>
            </View>

            <View className="mt-5 flex-row flex-wrap gap-2">
              {data.suggestions
                .filter(topic => !stated.includes(topic.label.toLowerCase()))
                .slice(0, SUGGESTIONS_SHOWN)
                .map(topic => (
                  <TopicChip key={topic.slug} label={topic.label} selected={false} onPress={() => add(topic.label)} />
                ))}
            </View>
          </Section>

          <Section title="We noticed">
            {data.noticed.length === 0 ? (
              <Text className="text-[16px] leading-[24px] text-muted-foreground">
                As you read, like and save, the topics you keep coming back to show up here. It takes a few
                articles over more than one day, so one late night does not decide your feed.
              </Text>
            ) : (
              <View className="overflow-hidden rounded-2xl border border-border bg-card">
                {data.noticed.map((topic, index) => (
                  <View
                    key={topic.slug}
                    className={index > 0 ? 'min-h-[64px] flex-row items-center gap-4 border-t border-border px-4' : 'min-h-[64px] flex-row items-center gap-4 px-4'}>
                    <NoticedIcon size={20} className="text-primary" />
                    <View className="flex-1 py-3">
                      <Text className="text-[17px] font-medium">{topic.label}</Text>
                      <Text className="mt-0.5 text-[13px] text-muted-foreground">
                        {topic.trend === 'rising' ? 'Rising lately' : 'Part of your reading'}
                      </Text>
                    </View>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={`Remove ${topic.label}`}
                      hitSlop={8}
                      onPress={() => hide(topic.slug).catch(() => {})}
                      className="h-10 w-10 items-center justify-center rounded-full active:bg-secondary/60">
                      <CloseIcon size={18} className="text-muted-foreground" />
                    </Pressable>
                  </View>
                ))}
              </View>
            )}
          </Section>

          {data.lately.length > 0 ? (
            <Section title="Lately">
              <Text className="mb-4 text-[16px] leading-[24px] text-muted-foreground">
                What you have been into over the last day or two. It tilts today's deck without rewriting your
                taste.
              </Text>
              <View className="flex-row flex-wrap gap-2">
                {data.lately.map(topic => (
                  <View key={topic.slug} className="rounded-full bg-secondary px-4 py-2.5">
                    <Text className="text-[15px] font-medium text-foreground/80">{topic.label}</Text>
                  </View>
                ))}
              </View>
            </Section>
          ) : null}
        </>
      )}
    </DetailScreen>
  );
}

function capitalise(phrase: string): string {
  return phrase.charAt(0).toUpperCase() + phrase.slice(1);
}
