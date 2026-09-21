import * as React from 'react';
import {BackHandler, Pressable, ScrollView, StatusBar, StyleSheet, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {ChevronLeft, CircleCheck, Clock, Info, Link, Mic, Pause, Play} from 'lucide-react-native';

import {AudioPlayer} from '@/components/mbari/AudioPlayer';
import {TranslateCard} from '@/components/mbari/TranslateCard';
import {Avatar, Card, ChoicePills, Kicker, MetaLine, Panel, PillButton} from '@/components/mbari/parts';
import {Text} from '@/components/ui/text';
import {APPROVER, GROUPS, LANGUAGES} from '@/data/static';
import {useAppearance} from '@/lib/appearance';
import {useCommunity} from '@/lib/community';
import {useNavigation} from '@/lib/navigation';
import {formatClock, playRecording, stopPlayback, type Recording} from '@/lib/recorder';
import {useTheme} from '@/lib/theme';

type Language = (typeof LANGUAGES)[number];

/**
 * Send to community: check the update, listen to the voice version, and
 * approve it. Nothing goes out without this step.
 */
export function SendScreen({alertId}: {alertId: string}) {
  const {alerts, send, county, recordings, voices} = useCommunity();
  const {closeSend, openRecord} = useNavigation();
  const {resolved} = useAppearance();
  const theme = useTheme();
  const [language, setLanguage] = React.useState<Language>('Gĩkũyũ');
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
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
  // A live alert needs a named approver on the dashboard; this only asks for it.
  const waiting = !alert.sample && alert.status === 'waiting';
  const voice = voices[alert.id];
  // Wait for a translation in progress, so the approver gets the voice too.
  const translating = Boolean(voice && voice.status !== 'ready' && voice.status !== 'failed');

  const onSend = async () => {
    setBusy(true);
    setError(null);
    try {
      await send(alert.id);
      if (alert.sample) {
        closeSend();
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not send. Try again.');
    } finally {
      setBusy(false);
    }
  };

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

        {recordings[alert.id] ? (
          <>
            <Kicker className="mb-2.5 mt-6">Your recording</Kicker>
            <YourRecording
              recording={recordings[alert.id]}
              onRecordAgain={() => {
                stopPlayback();
                closeSend();
                openRecord(alert.id);
              }}
            />
          </>
        ) : null}

        <Kicker className="mb-2.5 mt-6">Voice message</Kicker>
        {recordings[alert.id] ? (
          <TranslateCard alertId={alert.id} />
        ) : alert.sample ? (
          <>
            <ChoicePills options={LANGUAGES} value={language} onChange={setLanguage} />
            <Card className="mt-3 px-4 py-3.5">
              <AudioPlayer key={language} duration="1:05" />
            </Card>
          </>
        ) : (
          <Card className="px-4 py-4">
            <Text className="text-[14px] leading-[21px] text-muted-foreground">
              Record the update in your own voice. Mbarĩ can then turn it into a Gĩkũyũ voice message.
            </Text>
            <PillButton
              label="Record a message"
              icon={Mic}
              variant="line"
              block
              onPress={() => {
                closeSend();
                openRecord(alert.id);
              }}
              className="mt-3.5"
            />
          </Card>
        )}

        <View className="mt-4 flex-row items-start gap-2">
          <Info size={15} color={theme.mutedForeground} style={styles.infoIcon} />
          <Text className="flex-1 text-[13px] leading-[19px] text-muted-foreground">
            Listen to all of it first. Every call starts by saying a computer made the message, so{' '}
            {group?.name ?? 'your community'} always knows.
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
        {error ? <Text className="mb-2 text-center text-[14px] text-destructive">{error}</Text> : null}
        {sent ? (
          <View className="h-14 flex-row items-center justify-center gap-2">
            <CircleCheck size={20} color={theme.foreground} />
            <Text className="text-[16px] font-semibold">Sent to your community</Text>
          </View>
        ) : waiting ? (
          <View className="h-14 flex-row items-center justify-center gap-2">
            <Clock size={20} color={theme.mutedForeground} />
            <Text className="text-[16px] font-semibold text-muted-foreground">Waiting for an approver</Text>
          </View>
        ) : (
          <PillButton
            label={translating ? 'Translating…' : alert.sample ? 'Approve and send' : 'Send for approval'}
            size="lg"
            block
            busy={busy || translating}
            onPress={onSend}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

/** The sender's own take: play it once more before asking for approval, or record again. */
function YourRecording({recording, onRecordAgain}: {recording: Recording; onRecordAgain: () => void}) {
  const theme = useTheme();
  const [playing, setPlaying] = React.useState(false);

  React.useEffect(() => () => stopPlayback(), []);

  const toggle = async () => {
    if (playing) {
      stopPlayback();
      return;
    }
    setPlaying(true);
    try {
      await playRecording(recording.uri);
    } finally {
      setPlaying(false);
    }
  };

  return (
    <Card className="flex-row items-center gap-3 px-4 py-3.5">
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={playing ? 'Stop playing' : 'Play your recording'}
        onPress={toggle}
        className="h-11 w-11 items-center justify-center rounded-full bg-primary active:opacity-80">
        {playing ? (
          <Pause size={18} color={theme.primaryForeground} strokeWidth={2.4} />
        ) : (
          <Play size={18} color={theme.primaryForeground} strokeWidth={2.4} />
        )}
      </Pressable>
      <View className="flex-1">
        <Text className="text-[15px] font-semibold">Your voice · {formatClock(recording.durationMs)}</Text>
        <Text className="text-[13px] text-muted-foreground">Recorded on this phone</Text>
      </View>
      <Pressable accessibilityRole="button" onPress={onRecordAgain} className="flex-row items-center gap-1 py-2 active:opacity-60">
        <Mic size={15} color={theme.foreground} strokeWidth={2.3} />
        <Text className="text-[13.5px] font-semibold">Record again</Text>
      </Pressable>
    </Card>
  );
}

const styles = StyleSheet.create({infoIcon: {marginTop: 2}});
