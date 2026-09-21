import * as React from 'react';
import {BackHandler, Linking, Pressable, ScrollView, StatusBar, useWindowDimensions, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {Check, Mic, Pause, Play, RotateCcw, Square, X} from 'lucide-react-native';

import {Kicker} from '@/components/mbari/parts';
import {VoiceRing} from '@/components/mbari/VoiceRing';
import {Text} from '@/components/ui/text';
import {useAppearance} from '@/lib/appearance';
import {useCommunity} from '@/lib/community';
import {useNavigation} from '@/lib/navigation';
import {
  cancelRecording,
  formatClock,
  playbackPosition,
  playRecording,
  readLevel,
  recorderAvailable,
  requestMic,
  startRecording,
  stopPlayback,
  stopRecording,
  type Recording,
} from '@/lib/recorder';
import {useTheme} from '@/lib/theme';
import {cn} from '@/lib/utils';

/** Long enough to read an update and what to do; short enough to hold attention on a call. */
const MAX_MS = 3 * 60_000;
const TICK_MS = 50;

type Phase = 'idle' | 'starting' | 'recording' | 'recorded' | 'playing';

/**
 * Send to community, step one: record the update in your own voice, in the
 * language your community speaks. Listen back, record again if needed, then
 * take it to the approval step.
 */
export function RecordScreen({alertId}: {alertId: string}) {
  const {alerts, recordings, saveRecording} = useCommunity();
  const {closeRecord, openSend} = useNavigation();
  const {resolved} = useAppearance();
  const theme = useTheme();
  const {width} = useWindowDimensions();
  const alert = alerts.find(a => a.id === alertId);

  const [take, setTake] = React.useState<Recording | null>(recordings[alertId] ?? null);
  const [phase, setPhase] = React.useState<Phase>(take ? 'recorded' : 'idle');
  const [level, setLevel] = React.useState(0);
  const [elapsed, setElapsed] = React.useState(0);
  const [message, setMessage] = React.useState<{text: string; settings?: boolean} | null>(
    recorderAvailable() ? null : {text: 'Recording needs the latest build of the app. Rebuild and install it, then try again.'},
  );
  const startedAt = React.useRef(0);
  const phaseRef = React.useRef(phase);
  phaseRef.current = phase;

  // Leaving the screen never leaves the microphone on or audio playing.
  React.useEffect(
    () => () => {
      if (phaseRef.current === 'recording') {
        cancelRecording();
      }
      stopPlayback();
    },
    [],
  );

  const finish = React.useCallback(async () => {
    try {
      const recording = await stopRecording();
      setTake(recording);
      setElapsed(recording.durationMs);
      setPhase('recorded');
    } catch (e) {
      const code = (e as {code?: string}).code;
      setMessage({text: code === 'too_short' ? 'That was too short. Hold on a moment longer.' : 'Could not save the recording. Try again.'});
      setPhase(take ? 'recorded' : 'idle');
    } finally {
      setLevel(0);
    }
  }, [take]);

  // While recording: the clock, the ring, and the time limit.
  React.useEffect(() => {
    if (phase !== 'recording') {
      return;
    }
    const timer = setInterval(() => {
      const ms = Date.now() - startedAt.current;
      setElapsed(ms);
      setLevel(readLevel());
      if (ms >= MAX_MS) {
        finish();
      }
    }, TICK_MS);
    return () => clearInterval(timer);
  }, [phase, finish]);

  // While playing: the clock follows the audio, and the ring breathes with it.
  React.useEffect(() => {
    if (phase !== 'playing') {
      return;
    }
    const timer = setInterval(() => {
      const ms = playbackPosition();
      setElapsed(ms);
      setLevel(0.35 + 0.3 * Math.abs(Math.sin(ms / 170)));
    }, TICK_MS);
    return () => clearInterval(timer);
  }, [phase]);

  const record = async () => {
    setMessage(null);
    const permission = await requestMic();
    if (permission !== 'granted') {
      setMessage(
        permission === 'blocked'
          ? {text: 'Microphone access is off for Mbarĩ. Turn it on in Settings to record.', settings: true}
          : {text: 'Mbarĩ needs the microphone to record your message.'},
      );
      return;
    }
    stopPlayback();
    setPhase('starting');
    try {
      await startRecording();
      startedAt.current = Date.now();
      setElapsed(0);
      setPhase('recording');
    } catch (e) {
      setMessage({text: e instanceof Error ? e.message : 'Could not start the microphone.'});
      setPhase(take ? 'recorded' : 'idle');
    }
  };

  const togglePlay = async () => {
    if (!take) {
      return;
    }
    if (phase === 'playing') {
      stopPlayback();
      return;
    }
    setPhase('playing');
    try {
      await playRecording(take.uri);
    } catch {
      setMessage({text: 'Could not play the recording.'});
    }
    setPhase('recorded');
    setElapsed(take.durationMs);
    setLevel(0);
  };

  const close = React.useCallback(() => {
    if (phaseRef.current === 'recording') {
      cancelRecording();
    }
    stopPlayback();
    closeRecord();
  }, [closeRecord]);

  React.useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      close();
      return true;
    });
    return () => sub.remove();
  }, [close]);

  if (!alert) {
    return null;
  }

  const useTake = () => {
    if (!take) {
      return;
    }
    stopPlayback();
    saveRecording(alert.id, take);
    closeRecord();
    openSend(alert.id);
  };

  const ring = Math.min(width - 48, 320);
  const live = phase === 'recording' || phase === 'playing';
  const status = {
    idle: 'Tap the microphone, then read the update aloud in the language your community speaks.',
    starting: 'Starting the microphone…',
    recording: 'Recording. Tap stop when you finish.',
    recorded: 'Listen back. Record again if you need to, or use it.',
    playing: 'Playing your message.',
  }[phase];

  return (
    <SafeAreaView className="flex-1 bg-background">
      <StatusBar barStyle={resolved === 'dark' ? 'light-content' : 'dark-content'} />

      <View className="flex-row items-center justify-between px-4 pt-2">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Close"
          onPress={close}
          className="h-11 w-11 items-center justify-center rounded-full bg-secondary active:opacity-70">
          <X size={20} color={theme.foreground} strokeWidth={2.2} />
        </Pressable>
        <Kicker>Voice message</Kicker>
        <View className="h-11 w-11" />
      </View>

      <ScrollView className="flex-1" contentContainerClassName="grow px-5 pb-4" showsVerticalScrollIndicator={false}>
        <Text className="mt-4 text-center font-serif text-[22px] font-medium leading-[28px] tracking-tight" numberOfLines={3}>
          {alert.title}
        </Text>

        <View className="mt-4 rounded-[18px] bg-secondary px-4 py-3.5">
          <Kicker>What to say</Kicker>
          <Text className="mt-1.5 text-[15px] leading-[22px]">{alert.summary}</Text>
          {alert.action ? <Text className="mt-2 text-[15px] leading-[22px] text-foreground/80">{alert.action}</Text> : null}
        </View>

        <View className="flex-1 items-center justify-center py-6">
          <VoiceRing level={level} active={live} size={ring}>
            <Text
              accessibilityLabel={`${phase === 'playing' ? 'Played' : 'Recorded'} ${formatClock(elapsed)}`}
              className={cn('font-serif text-[34px] font-medium', live ? 'text-foreground' : 'text-muted-foreground')}>
              {formatClock(elapsed)}
            </Text>
            {phase === 'recording' ? (
              <View className="mt-1 flex-row items-center gap-1.5">
                <View className="h-2 w-2 rounded-full bg-primary" />
                <Text className="text-[12px] font-semibold uppercase tracking-[1.4px] text-primary">Recording</Text>
              </View>
            ) : take ? (
              <Text className="mt-1 text-[12px] text-muted-foreground">of {formatClock(take.durationMs)}</Text>
            ) : null}
          </VoiceRing>
        </View>

        <Text accessibilityLiveRegion="polite" className="text-center text-[15px] leading-[22px] text-muted-foreground">
          {status}
        </Text>
        {message ? (
          <View className="mt-3 items-center">
            <Text className="text-center text-[14px] leading-[20px] text-destructive">{message.text}</Text>
            {message.settings ? (
              <Pressable accessibilityRole="button" onPress={() => Linking.openSettings()} className="mt-1 py-1 active:opacity-60">
                <Text className="text-[14px] font-semibold underline">Open Settings</Text>
              </Pressable>
            ) : null}
          </View>
        ) : null}
      </ScrollView>

      <View className="flex-row items-center justify-center gap-7 px-6 pb-6 pt-2">
        {phase === 'recorded' || phase === 'playing' ? (
          <>
            <SideButton icon={RotateCcw} label="Record again" onPress={record} disabled={phase === 'playing'} />
            <BigButton
              icon={phase === 'playing' ? Pause : Play}
              label={phase === 'playing' ? 'Stop playing' : 'Play'}
              onPress={togglePlay}
              variant="ink"
            />
            <SideButton icon={Check} label="Use this" onPress={useTake} accent />
          </>
        ) : phase === 'recording' ? (
          <BigButton icon={Square} label="Stop recording" onPress={finish} />
        ) : (
          <BigButton
            icon={Mic}
            label="Start recording"
            onPress={record}
            disabled={phase === 'starting' || !recorderAvailable()}
          />
        )}
      </View>
    </SafeAreaView>
  );
}

type IconType = typeof Mic;

function BigButton({
  icon: Icon,
  label,
  onPress,
  disabled,
  variant = 'accent',
}: {
  icon: IconType;
  label: string;
  onPress: () => void;
  disabled?: boolean;
  variant?: 'accent' | 'ink';
}) {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{disabled}}
      disabled={disabled}
      onPress={onPress}
      className={cn(
        'h-[76px] w-[76px] items-center justify-center rounded-full active:opacity-80',
        variant === 'accent' ? 'bg-primary' : 'bg-foreground',
        disabled && 'opacity-40',
      )}>
      <Icon size={30} color={variant === 'accent' ? theme.primaryForeground : theme.background} strokeWidth={2.2} fill={Icon === Square ? theme.primaryForeground : 'none'} />
    </Pressable>
  );
}

function SideButton({
  icon: Icon,
  label,
  onPress,
  disabled,
  accent,
}: {
  icon: IconType;
  label: string;
  onPress: () => void;
  disabled?: boolean;
  accent?: boolean;
}) {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      disabled={disabled}
      onPress={onPress}
      className={cn('items-center gap-1.5 active:opacity-70', disabled && 'opacity-40')}>
      <View
        className={cn(
          'h-14 w-14 items-center justify-center rounded-full',
          accent ? 'bg-primary' : 'border border-border bg-card',
        )}>
        <Icon size={22} color={accent ? theme.primaryForeground : theme.foreground} strokeWidth={2.3} />
      </View>
      <Text className="text-[12.5px] font-semibold">{label}</Text>
    </Pressable>
  );
}
