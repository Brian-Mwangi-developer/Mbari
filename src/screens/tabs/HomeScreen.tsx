import * as React from 'react';
import {Pressable, RefreshControl, ScrollView, View} from 'react-native';
import {ChevronRight, CircleCheck, Clock, CloudOff, Link, Send, Sparkles, Volume2} from 'lucide-react-native';

import {TildeMarker} from '@/components/brand/Tilde';
import {Card, Kicker, ListCard, LocationPill, MetaLine, PillButton, RoundButton, TabHeader} from '@/components/mbari/parts';
import {Text} from '@/components/ui/text';
import type {Alert} from '@/data/static';
import {useCommunity} from '@/lib/community';
import {useNavigation} from '@/lib/navigation';
import {useTheme} from '@/lib/theme';
import {cn} from '@/lib/utils';

function today(): string {
  return new Date().toLocaleDateString('en-GB', {weekday: 'long', day: 'numeric', month: 'long'});
}

/** Home: the newest update for your county, then what came before. */
export function HomeScreen() {
  const {county, alerts, error, refresh} = useCommunity();
  const {openSend, openAlert} = useNavigation();
  const theme = useTheme();
  const [refreshing, setRefreshing] = React.useState(false);
  // Live alerts come first in `alerts`, so a real update leads over a sample.
  const mine = alerts.filter(a => a.county === county);
  const lead = mine.find(a => a.status === 'new');
  const earlier = mine.filter(a => a !== lead);

  const onRefresh = async () => {
    setRefreshing(true);
    await refresh();
    setRefreshing(false);
  };

  return (
    <ScrollView
      className="flex-1"
      contentContainerClassName="pb-8"
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} colors={[theme.primary]} />}>
      <TabHeader kicker={today()} title="Home" right={<LocationPill />} />
      <View className="gap-3 px-4">
        {error ? (
          <View className="flex-row items-center gap-2 px-1">
            <CloudOff size={15} color={theme.mutedForeground} strokeWidth={2.2} />
            <Text className="flex-1 text-[13px] text-muted-foreground">Live updates unavailable: {error} Pull down to retry.</Text>
          </View>
        ) : null}
        {lead ? (
          <LeadCard alert={lead} onOpen={() => openAlert(lead.id)} onSend={() => openSend(lead.id)} />
        ) : (
          <AllCaughtUp county={county} />
        )}
        {earlier.length > 0 ? (
          <>
            <Kicker className="ml-1 mt-4">Earlier updates</Kicker>
            <ListCard>
              {earlier.map(alert => (
                <EarlierRow key={alert.id} alert={alert} onPress={() => openAlert(alert.id)} />
              ))}
            </ListCard>
          </>
        ) : null}
      </View>
    </ScrollView>
  );
}

function LeadCard({alert, onOpen, onSend}: {alert: Alert; onOpen: () => void; onSend: () => void}) {
  const theme = useTheme();
  return (
    <Card className="overflow-hidden">
      <Pressable
        accessibilityRole="button"
        accessibilityHint="Opens what was found, with the source page"
        onPress={onOpen}
        className="px-5 pb-1 pt-5 active:opacity-80">
        <View className="flex-row items-center justify-between">
          <View className="flex-row items-center gap-2">
            <Kicker>{alert.topic}</Kicker>
            {alert.sample ? <SampleBadge /> : null}
          </View>
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
        {alert.aiGenerated ? (
          <MetaLine icon={Sparkles} className="mt-1.5">
            Summary written with AI from the source
          </MetaLine>
        ) : null}
        <View className="mt-3 flex-row items-center gap-1 self-start py-1">
          <Text className="text-[14px] font-semibold text-primary">Read what we found</Text>
          <ChevronRight size={16} color={theme.primary} strokeWidth={2.4} />
        </View>
      </Pressable>
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
        {alert.sample ? <SampleBadge className="mb-1 self-start" /> : null}
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

/** Marks placeholder content shipped with the app, so nobody mistakes it for a real notice. */
function SampleBadge({className}: {className?: string}) {
  return (
    <View className={cn('rounded-full border border-border px-2 py-0.5', className)}>
      <Text className="text-[10px] font-semibold uppercase tracking-[1px] text-muted-foreground">Sample</Text>
    </View>
  );
}
