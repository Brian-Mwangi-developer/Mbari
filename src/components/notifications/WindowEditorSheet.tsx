import * as React from 'react';
import {Modal, Pressable, TextInput, View} from 'react-native';

import type {DeliveryWindow} from '@/api';
import {Text} from '@/components/ui/text';
import {useAppearance} from '@/lib/appearance';
import {DAY_INITIALS, describeDays, toClock, toMinutes} from '@/lib/schedule';
import {THEME} from '@/lib/theme';
import {cn} from '@/lib/utils';

const STEP = 15;
const MIN_LENGTH = 15;
const DAY_NAMES = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

type Props = {
  /** Null to add a new window. */
  window: DeliveryWindow | null;
  visible: boolean;
  timeZoneLabel: string;
  onClose: () => void;
  onSave: (window: DeliveryWindow) => Promise<void>;
  onDelete?: () => Promise<void>;
};

const blank: DeliveryWindow = {label: '', start: '18:00', end: '19:00', days: [1, 2, 3, 4, 5, 6, 7], enabled: true};

/** Add or change a delivery window: its name, local start and end, and days. */
export function WindowEditorSheet({window, visible, timeZoneLabel, onClose, onSave, onDelete}: Props) {
  const {resolved} = useAppearance();
  const [draft, setDraft] = React.useState<DeliveryWindow>(window ?? blank);
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (visible) {
      setDraft(window ?? blank);
      setError(null);
      setBusy(false);
    }
  }, [visible, window]);

  const start = toMinutes(draft.start);
  const end = toMinutes(draft.end);
  const setStart = (minutes: number) => {
    const next = Math.max(0, Math.min(1440 - MIN_LENGTH, minutes));
    setDraft(d => ({...d, start: toClock(next), end: toClock(Math.max(toMinutes(d.end), next + MIN_LENGTH))}));
  };
  const setEnd = (minutes: number) => {
    setDraft(d => ({...d, end: toClock(Math.max(toMinutes(d.start) + MIN_LENGTH, Math.min(1440, minutes)))}));
  };
  const toggleDay = (day: number) =>
    setDraft(d => ({...d, days: d.days.includes(day) ? d.days.filter(x => x !== day) : [...d.days, day].sort()}));

  const canSave = draft.label.trim().length > 0 && draft.days.length > 0 && !busy;

  const run = async (action: () => Promise<void>) => {
    setBusy(true);
    setError(null);
    try {
      await action();
      onClose();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'That did not save.');
      setBusy(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable className="flex-1 justify-end bg-black/40" onPress={onClose}>
        <Pressable className="rounded-t-[28px] border-t border-border bg-background px-6 pb-10 pt-7" onPress={e => e.stopPropagation()}>
          <Text className="font-serif text-[26px] leading-[32px]">{window ? 'Edit window' : 'Add a window'}</Text>
          <Text className="mt-2 text-[15px] leading-[22px] text-muted-foreground">
            A time you usually have for reading. Mbari picks one moment inside it. Times are in {timeZoneLabel}.
          </Text>

          <TextInput
            value={draft.label}
            onChangeText={label => setDraft(d => ({...d, label}))}
            placeholder="Name it, e.g. Train home"
            placeholderTextColor={THEME[resolved].mutedForeground}
            maxLength={40}
            className="mt-6 h-14 rounded-2xl border border-border bg-card px-4 text-[17px] text-foreground"
          />

          <View className="mt-5 flex-row gap-3">
            <TimeStepper label="From" value={draft.start} onDown={() => setStart(start - STEP)} onUp={() => setStart(start + STEP)} />
            <TimeStepper label="Until" value={draft.end} onDown={() => setEnd(end - STEP)} onUp={() => setEnd(end + STEP)} />
          </View>

          <View className="mt-5 flex-row justify-between">
            {DAY_INITIALS.map((initial, index) => {
              const day = index + 1;
              const on = draft.days.includes(day);
              return (
                <Pressable
                  key={DAY_NAMES[index]}
                  accessibilityRole="checkbox"
                  accessibilityLabel={DAY_NAMES[index]}
                  accessibilityState={{checked: on}}
                  onPress={() => toggleDay(day)}
                  className={cn(
                    'h-11 w-11 items-center justify-center rounded-full border active:opacity-70',
                    on ? 'border-primary bg-primary' : 'border-border bg-card',
                  )}>
                  <Text className={cn('text-[15px] font-semibold', on ? 'text-primary-foreground' : 'text-muted-foreground')}>{initial}</Text>
                </Pressable>
              );
            })}
          </View>
          <Text className="mt-2 text-[13px] text-muted-foreground">{describeDays(draft.days)}</Text>

          {error ? <Text className="mt-4 text-[15px] text-destructive">{error}</Text> : null}

          <Pressable
            accessibilityRole="button"
            disabled={!canSave}
            onPress={() => run(() => onSave({...draft, label: draft.label.trim()}))}
            className={cn('mt-6 h-14 items-center justify-center rounded-full bg-primary active:opacity-85', !canSave && 'opacity-40')}>
            <Text className="text-[17px] font-semibold text-primary-foreground">{busy ? 'Saving…' : 'Save'}</Text>
          </Pressable>
          {window && onDelete ? (
            <Pressable accessibilityRole="button" disabled={busy} onPress={() => run(onDelete)} className="mt-2 h-12 items-center justify-center active:opacity-60">
              <Text className="text-[16px] font-medium text-destructive">Remove this window</Text>
            </Pressable>
          ) : null}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

function TimeStepper({label, value, onDown, onUp}: {label: string; value: string; onDown: () => void; onUp: () => void}) {
  return (
    <View className="flex-1 rounded-2xl border border-border bg-card px-3 py-3">
      <Text className="text-center text-[12px] font-semibold uppercase tracking-[1.5px] text-muted-foreground">{label}</Text>
      <View className="mt-2 flex-row items-center justify-between">
        <StepButton label={`${label} 15 minutes earlier`} glyph="−" onPress={onDown} />
        <Text className="text-[24px] font-semibold" style={{fontVariant: ['tabular-nums']}}>
          {value}
        </Text>
        <StepButton label={`${label} 15 minutes later`} glyph="+" onPress={onUp} />
      </View>
    </View>
  );
}

function StepButton({label, glyph, onPress}: {label: string; glyph: string; onPress: () => void}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      hitSlop={6}
      className="h-10 w-10 items-center justify-center rounded-full bg-secondary active:opacity-70">
      <Text className="text-[22px] font-medium">{glyph}</Text>
    </Pressable>
  );
}
