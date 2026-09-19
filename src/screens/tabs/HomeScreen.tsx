import * as React from 'react';
import {Pressable, ScrollView, View} from 'react-native';
import {CircleCheck, Clock, Link, Send, Volume2} from 'lucide-react-native';

import {TildeMarker} from '@/components/brand/Tilde';
import {Card, Kicker, ListCard, LocationPill, MetaLine, PillButton, RoundButton, TabHeader} from '@/components/mbari/parts';
import {Text} from '@/components/ui/text';
import type {Alert} from '@/data/static';
import {useCommunity} from '@/lib/community';
import {useNavigation} from '@/lib/navigation';
import {useTheme} from '@/lib/theme';

function today(): string {
  return new Date().toLocaleDateString('en-GB', {weekday: 'long', day: 'numeric', month: 'long'});
}

/** Home: the newest update for your county, then what came before. */
export function HomeScreen() {
  const {county, alerts} = useCommunity();
  const {openSend} = useNavigation();
  const mine = alerts.filter(a => a.county === county);
  const lead = mine.find(a => a.status === 'new');
  const earlier = mine.filter(a => a !== lead);

  return (
    <ScrollView className="flex-1" contentContainerClassName="pb-8" showsVerticalScrollIndicator={false}>
      <TabHeader kicker={today()} title="Home" right={<LocationPill />} />
      <View className="gap-3 px-4">
        {lead ? <LeadCard alert={lead} onSend={() => openSend(lead.id)} /> : <AllCaughtUp county={county} />}
        {earlier.length > 0 ? (
          <>
            <Kicker className="ml-1 mt-4">Earlier updates</Kicker>
            <ListCard>
              {earlier.map(alert => (
                <EarlierRow key={alert.id} alert={alert} onPress={() => openSend(alert.id)} />
              ))}
            </ListCard>
          </>
        ) : null}
      </View>
    </ScrollView>
  );
}

function LeadCard({alert, onSend}: {alert: Alert; onSend: () => void}) {
  return (
    <Card className="overflow-hidden">
      <View className="px-5 pb-1 pt-5">
        <View className="flex-row justify-between">
          <Kicker>{alert.topic}</Kicker>
          <Kicker>{alert.ago}</Kicker>
        </View>
        <Text role="heading" className="mt-2.5 font-serif text-[26px] font-medium leading-[31px] tracking-tight">
          {alert.title}
        </Text>
        <View className="my-4 h-[2px] w-10 rounded-full bg-primary" />
        <Text className="font-serif text-[17px] leading-[25px] text-foreground/80">{alert.summary}</Text>
        <MetaLine icon={Link} className="mt-3.5">
          {alert.source} · fetched {alert.fetchedAt}
        </MetaLine>
      </View>
      <View className="mt-4 flex-row items-center gap-3 border-t border-border px-4 py-3.5">
        <RoundButton icon={Volume2} label="Listen" onPress={onSend} />
        <PillButton label="Send to community" icon={Send} onPress={onSend} className="flex-1" />
      </View>
    </Card>
  );
}

function EarlierRow({alert, onPress}: {alert: Alert; onPress: () => void}) {
  const theme = useTheme();
  const sent = alert.status === 'sent';
  const Icon = sent ? CircleCheck : Clock;
  return (
    <Pressable accessibilityRole="button" onPress={onPress} className="min-h-[72px] flex-row items-center gap-3 py-3.5 active:opacity-70">
      <View className="flex-1">
        <Text className="text-[15px] font-semibold leading-[20px]">{alert.title}</Text>
        <Text className="mt-0.5 text-[12.5px] text-muted-foreground">
          {alert.source} · {alert.ago}
        </Text>
      </View>
      <View className="flex-row items-center gap-1.5">
        <Icon size={15} strokeWidth={2.2} color={sent ? theme.foreground : theme.mutedForeground} />
        <Text className={sent ? 'text-[12.5px] font-semibold' : 'text-[12.5px] font-semibold text-muted-foreground'}>
          {sent ? 'Sent' : alert.status === 'waiting' ? 'Waiting' : 'New'}
        </Text>
      </View>
    </Pressable>
  );
}

function AllCaughtUp({county}: {county: string}) {
  return (
    <Card className="items-center px-6 py-10">
      <TildeMarker width={56} />
      <Text className="mt-4 text-center font-serif text-[22px] font-medium">Nothing new for {county}</Text>
      <Text className="mt-2 text-center text-[15px] leading-[22px] text-muted-foreground">
        We will tell you as soon as a county or government site changes.
      </Text>
    </Card>
  );
}
