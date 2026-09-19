import * as React from 'react';
import {BackHandler, Pressable, ScrollView, StatusBar, StyleSheet, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {ChevronLeft, CircleCheck, Info, Link} from 'lucide-react-native';

import {AudioPlayer} from '@/components/mbari/AudioPlayer';
import {Avatar, Card, ChoicePills, Kicker, MetaLine, Panel, PillButton} from '@/components/mbari/parts';
import {Text} from '@/components/ui/text';
import {APPROVER, GROUPS, LANGUAGES} from '@/data/static';
import {useAppearance} from '@/lib/appearance';
import {useCommunity} from '@/lib/community';
import {useNavigation} from '@/lib/navigation';
import {useTheme} from '@/lib/theme';

type Language = (typeof LANGUAGES)[number];

/**
 * Send to community: check the update, listen to the voice version, and
 * approve it. Nothing goes out without this step.
 */
export function SendScreen({alertId}: {alertId: string}) {
  const {alerts, markSent, county} = useCommunity();
  const {closeSend} = useNavigation();
  const {resolved} = useAppearance();
  const theme = useTheme();
  const [language, setLanguage] = React.useState<Language>('Gĩkũyũ');
  const alert = alerts.find(a => a.id === alertId);
  const group = GROUPS.find(g => g.county === county);

  React.useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      closeSend();
      return true;
    });
    return () => sub.remove();
  }, [closeSend]);

  if (!alert) {
    return null;
  }
  const sent = alert.status === 'sent';

  return (
    <SafeAreaView className="flex-1 bg-background">
      <StatusBar barStyle={resolved === 'dark' ? 'light-content' : 'dark-content'} />
      <ScrollView className="flex-1" contentContainerClassName="px-5 pb-6" showsVerticalScrollIndicator={false}>
        <Pressable accessibilityRole="button" onPress={closeSend} className="-ml-1 flex-row items-center gap-1 self-start py-3 active:opacity-60">
          <ChevronLeft size={22} color={theme.foreground} />
          <Text className="text-[15px] font-semibold">Home</Text>
        </Pressable>

        <Kicker className="mt-2">Send to community</Kicker>
        <Text role="heading" className="mt-2 font-serif text-[28px] font-medium leading-[33px] tracking-tight">
          {alert.title}
        </Text>
        <MetaLine icon={Link} className="mt-3">
          {alert.source} · fetched {alert.fetchedAt}
        </MetaLine>

        <View className="mt-5">
          <Panel label="What to do">{alert.action}</Panel>
        </View>

        <Kicker className="mb-2.5 mt-6">Voice message</Kicker>
        <ChoicePills options={LANGUAGES} value={language} onChange={setLanguage} />
        <Card className="mt-3 px-4 py-3.5">
          <AudioPlayer key={language} duration="1:05" />
        </Card>

        <View className="mt-4 flex-row items-start gap-2">
          <Info size={15} color={theme.mutedForeground} style={styles.infoIcon} />
          <Text className="flex-1 text-[13px] leading-[19px] text-muted-foreground">
            Listen to all of it first. Every call starts: “This message was made with AI by Mbarĩ for{' '}
            {group?.name ?? 'your community'}.”
          </Text>
        </View>

        <View className="mt-5 flex-row items-center gap-3">
          <Avatar initials={APPROVER.initials} />
          <View className="flex-1">
            <Text className="text-[15px] font-semibold">{APPROVER.name} approves</Text>
            <Text className="text-[13px] text-muted-foreground">
              {group ? `${group.people} people · ${group.name}` : 'Choose a group in Community'}
            </Text>
          </View>
        </View>
      </ScrollView>

      <View className="border-t border-border px-5 pb-4 pt-3">
        {sent ? (
          <View className="h-14 flex-row items-center justify-center gap-2">
            <CircleCheck size={20} color={theme.foreground} />
            <Text className="text-[16px] font-semibold">Sent to your community</Text>
          </View>
        ) : (
          <PillButton
            label="Approve and send"
            size="lg"
            block
            onPress={() => {
              markSent(alert.id);
              closeSend();
            }}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({infoIcon: {marginTop: 2}});
