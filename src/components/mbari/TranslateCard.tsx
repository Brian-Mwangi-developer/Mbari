import * as React from 'react';
import {ActivityIndicator, Pressable, View} from 'react-native';
import {Check, Languages, Pause, Play, RotateCcw, Sparkles} from 'lucide-react-native';

import {API_BASE_URL} from '@/api/config';
import type {VoiceMessage, VoiceStatus} from '@/api/types';
import {Card, Kicker, PillButton} from '@/components/mbari/parts';
import {Text} from '@/components/ui/text';
import {useCommunity} from '@/lib/community';
import {formatClock, playRecording, stopPlayback} from '@/lib/recorder';
import {useTheme} from '@/lib/theme';
import {cn} from '@/lib/utils';

const STEPS: {status: VoiceStatus; label: string}[] = [
  {status: 'transcribing', label: 'Hearing your words'},
  {status: 'polishing', label: 'Tidying the English'},
  {status: 'translating', label: 'Translating to Gĩkũyũ'},
  {status: 'speaking', label: 'Making the Gĩkũyũ voice'},
];

/** Where a status sits in STEPS; queued is before the first. */
function stepIndex(status: VoiceStatus): number {
  if (status === 'ready') {
    return STEPS.length;
  }
  return Math.max(0, STEPS.findIndex(s => s.status === status));
}

/**
 * "Translate to Gĩkũyũ": the sender's recording becomes English words
 * (Whisper), then Gĩkũyũ words (NLLB-200), then a Gĩkũyũ voice (MMS). Each
 * step is shown, and the result is marked as machine-made, so the sender
 * checks it before asking for approval.
 */
export function TranslateCard({alertId}: {alertId: string}) {
  const {voices, translate} = useCommunity();
  const theme = useTheme();
  const voice = voices[alertId];
  const [starting, setStarting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const start = async () => {
    setStarting(true);
    setError(null);
    try {
      await translate(alertId);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not start the translation.');
    } finally {
      setStarting(false);
    }
  };

  if (voice?.status === 'ready') {
    return <Translated voice={voice} />;
  }

  const working = voice && voice.status !== 'failed';
  return (
    <Card className="px-4 py-4">
      <View className="flex-row items-center gap-2">
        <Languages size={17} color={theme.primary} strokeWidth={2.2} />
        <Text className="text-[15px] font-semibold">Gĩkũyũ voice message</Text>
      </View>

      {working ? (
        <>
          <View className="mt-3.5 gap-2.5">
            {STEPS.map((step, i) => (
              <Step key={step.status} label={step.label} state={i < stepIndex(voice.status) ? 'done' : i === stepIndex(voice.status) ? 'now' : 'next'} />
            ))}
          </View>
          <Text className="mt-3.5 text-[13px] leading-[19px] text-muted-foreground">
            This takes under a minute. The first one after the server starts can take a few minutes while it loads.
          </Text>
        </>
      ) : (
        <>
          <Text className="mt-2 text-[14px] leading-[21px] text-muted-foreground">
            Mbarĩ turns your recording into English words, then Gĩkũyũ words, then a Gĩkũyũ voice. A machine does each step, so
            you listen before anything is sent.
          </Text>
          {voice?.status === 'failed' || error ? (
            <Text className="mt-3 text-[14px] leading-[20px] text-destructive">{error ?? voice?.error ?? 'The translation failed.'}</Text>
          ) : null}
          <PillButton
            label={voice?.status === 'failed' ? 'Try again' : 'Translate to Gĩkũyũ'}
            icon={voice?.status === 'failed' ? RotateCcw : Languages}
            variant={voice?.status === 'failed' ? 'line' : 'accent'}
            block
            busy={starting}
            onPress={start}
            className="mt-4"
          />
        </>
      )}
    </Card>
  );
}

function Step({label, state}: {label: string; state: 'done' | 'now' | 'next'}) {
  const theme = useTheme();
  return (
    <View className="flex-row items-center gap-2.5">
      <View
        className={cn(
          'h-6 w-6 items-center justify-center rounded-full',
          state === 'done' ? 'bg-primary' : state === 'now' ? 'bg-secondary' : 'border border-border',
        )}>
        {state === 'done' ? (
          <Check size={13} color={theme.primaryForeground} strokeWidth={3} />
        ) : state === 'now' ? (
          <ActivityIndicator size="small" color={theme.primary} />
        ) : null}
      </View>
      <Text className={cn('text-[14.5px]', state === 'next' ? 'text-muted-foreground' : 'font-medium')}>{label}</Text>
    </View>
  );
}

/** The finished translation: the voice to play, and the words behind it, marked as machine-made. */
function Translated({voice}: {voice: VoiceMessage}) {
  const theme = useTheme();
  const [playing, setPlaying] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => () => stopPlayback(), []);

  const toggle = async () => {
    if (playing) {
      stopPlayback();
      return;
    }
    if (!voice.audio) {
      return;
    }
    setError(null);
    setPlaying(true);
    try {
      await playRecording(`${API_BASE_URL}${voice.audio.url}`);
    } catch {
      setError('Could not play the Gĩkũyũ voice. Check the connection and try again.');
    } finally {
      setPlaying(false);
    }
  };

  return (
    <Card className="px-4 py-4">
      <View className="flex-row items-center gap-1.5 self-start rounded-full bg-secondary px-2.5 py-1">
        <Sparkles size={13} color={theme.primary} strokeWidth={2.3} />
        <Text className="text-[12.5px] font-semibold">Made by AI · listen to all of it before you send</Text>
      </View>

      <View className="mt-3.5 flex-row items-center gap-3">
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={playing ? 'Stop playing' : 'Play the Gĩkũyũ voice message'}
          onPress={toggle}
          className="h-12 w-12 items-center justify-center rounded-full bg-primary active:opacity-80">
          {playing ? (
            <Pause size={19} color={theme.primaryForeground} strokeWidth={2.4} />
          ) : (
            <Play size={19} color={theme.primaryForeground} strokeWidth={2.4} />
          )}
        </Pressable>
        <View className="flex-1">
          <Text className="text-[15px] font-semibold">
            {voice.targetLanguageName} voice{voice.audio?.durationMs ? ` · ${formatClock(voice.audio.durationMs)}` : ''}
          </Text>
          <Text className="text-[13px] text-muted-foreground">Spoken by a computer voice</Text>
        </View>
      </View>
      {error ? <Text className="mt-2 text-[13px] text-destructive">{error}</Text> : null}

      <View className="mt-4 gap-3.5 border-t border-border pt-3.5">
        <View>
          <Kicker>In {voice.targetLanguageName}</Kicker>
          <Text selectable className="mt-1.5 text-[15px] leading-[22px]">
            {voice.translation}
          </Text>
        </View>
        <View>
          <Kicker>What we heard, in English</Kicker>
          <Text selectable className="mt-1.5 text-[14.5px] leading-[21px] text-foreground/80">
            {voice.english}
          </Text>
          {voice.madeBy.english ? (
            <Text className="mt-1 text-[12.5px] text-muted-foreground">Punctuated by AI from what you said</Text>
          ) : null}
        </View>
      </View>
    </Card>
  );
}
