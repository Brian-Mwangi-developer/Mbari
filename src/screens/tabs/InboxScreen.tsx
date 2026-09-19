import * as React from 'react';
import {ScrollView, View} from 'react-native';
import {Languages, Mic} from 'lucide-react-native';

import {AudioPlayer} from '@/components/mbari/AudioPlayer';
import {Avatar, Card, ChoicePills, LocationPill, MetaLine, PillButton, TabHeader} from '@/components/mbari/parts';
import {Text} from '@/components/ui/text';
import {MESSAGES, type Message} from '@/data/static';
import {useCommunity} from '@/lib/community';

const FILTERS = ['All', 'Reports', 'Answers'] as const;
type Filter = (typeof FILTERS)[number];

/** Inbox: what your community said back, by voice, translated. */
export function InboxScreen() {
  const {county} = useCommunity();
  const [filter, setFilter] = React.useState<Filter>('All');
  const mine = MESSAGES.filter(m => m.county === county);
  const shown = mine.filter(m => filter === 'All' || (filter === 'Reports' ? m.kind === 'report' : m.kind === 'answer'));
  const unread = mine.filter(m => m.unread).length;

  return (
    <ScrollView className="flex-1" contentContainerClassName="pb-8" showsVerticalScrollIndicator={false}>
      <TabHeader kicker={unread ? `${unread} new` : 'All read'} title="Inbox" right={<LocationPill />} />
      <View className="gap-3 px-4">
        <ChoicePills options={FILTERS} value={filter} onChange={setFilter} />
        {shown.length ? (
          shown.map(message => <MessageCard key={message.id} message={message} />)
        ) : (
          <Card className="px-6 py-8">
            <Text className="text-center font-serif text-[21px] font-medium">Nothing here yet</Text>
            <Text className="mt-2 text-center text-[15px] leading-[22px] text-muted-foreground">
              When people answer a call or leave a report, you will hear it here.
            </Text>
          </Card>
        )}
      </View>
    </ScrollView>
  );
}

function MessageCard({message}: {message: Message}) {
  return (
    <Card className="px-4 py-4">
      <View className="flex-row items-center gap-3">
        <Avatar initials={message.initials} />
        <View className="flex-1">
          <Text className="text-[15px] font-semibold">{message.from}</Text>
          <Text className="text-[12.5px] text-muted-foreground">
            {message.place} · {message.ago}
          </Text>
        </View>
        {message.urgent ? (
          <View className="rounded-full border-[1.5px] border-primary px-2.5 py-1">
            <Text className="text-[10.5px] font-bold uppercase tracking-[1.3px] text-primary">Urgent</Text>
          </View>
        ) : null}
      </View>
      <View className="mt-3.5">
        <AudioPlayer duration={message.duration} small />
      </View>
      <Text className="mt-3 font-serif text-[18px] leading-[25px]">“{message.text}”</Text>
      <MetaLine icon={Languages} className="mt-2.5">
        From {message.language} · AI translation
      </MetaLine>
      {message.unread ? <PillButton label="Reply by voice" icon={Mic} variant="line" size="sm" className="mt-3.5 self-start" /> : null}
    </Card>
  );
}
