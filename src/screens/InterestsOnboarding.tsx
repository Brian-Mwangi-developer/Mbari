import * as React from 'react';
import {ActivityIndicator, Pressable, ScrollView, StatusBar, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';

import * as api from '@/api';
import type {InterestTopic} from '@/api';
import {TildeMarker} from '@/components/brand/Tilde';
import {TopicChip} from '@/components/interests/TopicChip';
import {Text} from '@/components/ui/text';
import {useAppearance} from '@/lib/appearance';
import {useSession} from '@/lib/session';

/**
 * Until the backend suggests its own, these are what a community usually
 * needs to hear about: the things county and national sites publish.
 */
const STARTER_TOPICS: InterestTopic[] = [
  'Farming',
  'County budget',
  'Public participation',
  'Jobs',
  'Bursaries',
  'Health',
  'Water',
  'Roads',
  'Education',
  'Land',
  'Elections',
].map(label => ({slug: label.toLowerCase().replace(/\s+/g, '-'), label}));

/**
 * One question after first sign-in. Skippable: with nothing picked, Mbarĩ
 * starts from the sources you connect and learns what your community reads.
 */
export function InterestsOnboarding() {
  const {refresh} = useSession();
  const {resolved} = useAppearance();
  const [topics, setTopics] = React.useState<InterestTopic[] | null>(null);
  const [picked, setPicked] = React.useState<string[]>([]);
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    api.getInterests().then(
      data => setTopics(data.suggestions.length > 0 ? data.suggestions : STARTER_TOPICS),
      () => setTopics(STARTER_TOPICS),
    );
  }, []);

  const finish = async (interests: string[]) => {
    setSaving(true);
    try {
      if (interests.length > 0) {
        await api.setInterests(interests);
      }
      await api.updateProfile({onboardingDone: true});
    } catch {
      // Never trap someone on this screen; they can set interests in Settings.
    } finally {
      await refresh();
      setSaving(false);
    }
  };

  const toggle = (label: string) =>
    setPicked(prev => (prev.includes(label) ? prev.filter(p => p !== label) : [...prev, label]));

  return (
    <SafeAreaView className="flex-1 bg-background">
      <StatusBar barStyle={resolved === 'dark' ? 'light-content' : 'dark-content'} />
      <ScrollView className="flex-1" contentContainerClassName="px-6 pb-8 pt-12" showsVerticalScrollIndicator={false}>
        <TildeMarker width={44} />
        <Text className="mt-7 font-serif text-[40px] font-medium leading-[46px] tracking-tight">
          What should Mbarĩ watch for your community?
        </Text>
        <Text className="mt-4 font-serif text-[19px] leading-[29px] text-foreground/70">
          Pick a few topics. Mbarĩ watches county and government sites for them, and tells you when something
          changes. You decide what gets passed on.
        </Text>

        <View className="mt-9 flex-row flex-wrap gap-2">
          {topics === null ? (
            <ActivityIndicator />
          ) : (
            topics.map(topic => (
              <TopicChip key={topic.slug} label={topic.label} selected={picked.includes(topic.label)} onPress={() => toggle(topic.label)} />
            ))
          )}
        </View>
      </ScrollView>

      <View className="gap-2 border-t border-border px-6 pb-4 pt-4">
        <Pressable
          accessibilityRole="button"
          disabled={saving}
          onPress={() => finish(picked).catch(() => {})}
          className="h-14 items-center justify-center rounded-lg bg-primary active:opacity-85">
          <Text className="text-[17px] font-semibold text-primary-foreground">
            {saving ? 'Saving…' : picked.length > 0 ? `Continue with ${picked.length}` : 'Continue'}
          </Text>
        </Pressable>
        <Pressable
          accessibilityRole="button"
          disabled={saving}
          onPress={() => finish([]).catch(() => {})}
          className="h-12 items-center justify-center active:opacity-60">
          <Text className="text-[16px] font-medium text-muted-foreground">Skip for now</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
