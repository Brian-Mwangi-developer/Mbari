import * as React from 'react';
import {ActivityIndicator, Pressable, Switch, View} from 'react-native';

import type {SavedDeliveryWindow} from '@/api';
import {AddButton} from '@/components/AddButton';
import {DetailScreen, Section} from '@/components/layout';
import {WindowEditorSheet} from '@/components/notifications/WindowEditorSheet';
import {SegmentedControl} from '@/components/SegmentedControl';
import {SettingsGroup} from '@/components/settings/SettingsGroup';
import {ToggleRow} from '@/components/settings/ToggleRow';
import {Text} from '@/components/ui/text';
import {useAppearance} from '@/lib/appearance';
import {useDelivery} from '@/lib/delivery';
import {useNavigation} from '@/lib/navigation';
import {describeDays, describeNext, describeRange, zoneName} from '@/lib/schedule';
import {THEME} from '@/lib/theme';
import {cn} from '@/lib/utils';

const MAX_WINDOWS = 6;
const PER_DAY = [
  {value: '1', label: 'Once a day'},
  {value: '2', label: 'Twice'},
  {value: '3', label: 'Three times'},
] as const;

/** When Mbari may send a recommendation, in the reader's own timezone. */
export function TimingScreen() {
  const {closeDetail, openDetail} = useNavigation();
  const delivery = useDelivery();
  const {settings} = delivery;
  const [editing, setEditing] = React.useState<SavedDeliveryWindow | 'new' | null>(null);
  const [problem, setProblem] = React.useState<string | null>(null);

  const attempt = (action: Promise<void>) =>
    action.then(
      () => setProblem(null),
      (e: unknown) => setProblem(e instanceof Error ? e.message : 'That did not save.'),
    );

  if (!settings) {
    return (
      <DetailScreen title="Timing" onBack={closeDetail}>
        <View className="items-center py-16">
          {delivery.error ? <Text className="text-center text-muted-foreground">{delivery.error}</Text> : <ActivityIndicator />}
        </View>
      </DetailScreen>
    );
  }

  const zone = zoneName(settings.timezone);
  const next = describeNext(settings.nextNotificationAt, settings.timezone);
  const editingWindow = editing && editing !== 'new' ? editing : null;

  return (
    <DetailScreen title="Timing" onBack={closeDetail}>
      <View className="rounded-2xl border border-border bg-card px-5 py-4">
        <Text className="text-[12px] font-semibold uppercase tracking-[1.5px] text-muted-foreground">Next recommendation</Text>
        <Text className="mt-1.5 font-serif text-[24px] leading-[30px]">
          {!settings.notificationsEnabled ? 'Notifications are off' : next ?? 'No window is on'}
        </Text>
        <Text className="mt-1 text-[14px] text-muted-foreground">Times are in {settings.timezone}, from your phone.</Text>
        {!settings.push.configured || settings.push.devices === 0 ? (
          <Pressable accessibilityRole="button" onPress={() => openDetail('notifications')} className="mt-3 self-start active:opacity-60">
            <Text className="text-[14px] font-semibold text-primary">
              {settings.push.configured ? 'This phone is not receiving notifications yet →' : 'Notifications are not set up on the server yet →'}
            </Text>
          </Pressable>
        ) : null}
      </View>

      <Section title="When you have time">
        {settings.windows.length === 0 ? (
          <Text className="mb-4 text-[16px] leading-[24px] text-muted-foreground">No windows yet. Add the times you usually read.</Text>
        ) : (
          <SettingsGroup>
            {settings.windows.map(window => (
              <WindowRow
                key={window.id}
                window={window}
                timeZone={settings.timezone}
                onPress={() => setEditing(window)}
                onToggle={enabled => attempt(delivery.setWindowEnabled(window.id, enabled))}
              />
            ))}
          </SettingsGroup>
        )}
        {settings.windows.length < MAX_WINDOWS ? (
          <View className="mt-4">
            <AddButton label="Add a window" onPress={() => setEditing('new')} />
          </View>
        ) : null}
      </Section>

      <Section title="How often">
        <SegmentedControl
          options={PER_DAY}
          value={String(settings.perDay) as (typeof PER_DAY)[number]['value']}
          onChange={value => attempt(delivery.setPerDay(Number(value)))}
        />
        <Text className="mt-3 text-[15px] leading-[22px] text-muted-foreground">
          {settings.perDay === 1
            ? 'At most one notification a day, in the first window that comes round.'
            : `Up to ${settings.perDay} a day, never more than one per window.`}{' '}
          Nothing is sent while you are already reading.
        </Text>
      </Section>

      <Section title="Avoid">
        <SettingsGroup>
          {/* TODO: calendar permission + connection. */}
          <ToggleRow label="Meetings in my calendar" detail="Not connected" value={false} onValueChange={() => {}} disabled />
        </SettingsGroup>
      </Section>

      {problem ? <Text className="text-[15px] text-destructive">{problem}</Text> : null}

      <WindowEditorSheet
        visible={editing !== null}
        window={editingWindow}
        timeZoneLabel={zone}
        onClose={() => setEditing(null)}
        onSave={window => delivery.saveWindow(editingWindow ? {...window, id: editingWindow.id} : window)}
        onDelete={editingWindow ? () => delivery.removeWindow(editingWindow.id) : undefined}
      />
    </DetailScreen>
  );
}

function WindowRow({
  window,
  timeZone,
  onPress,
  onToggle,
}: {
  window: SavedDeliveryWindow;
  timeZone: string;
  onPress: () => void;
  onToggle: (enabled: boolean) => void;
}) {
  const {resolved} = useAppearance();
  const colors = THEME[resolved];
  const next = window.enabled ? describeNext(window.nextAt, timeZone) : null;
  return (
    <View className="min-h-[76px] flex-row items-center gap-4 pr-5">
      <Pressable accessibilityRole="button" accessibilityLabel={`Edit ${window.label}`} onPress={onPress} className="flex-1 py-4 pl-5 active:opacity-60">
        <Text className={cn('text-[17px]', !window.enabled && 'text-muted-foreground')}>{window.label}</Text>
        <Text className="mt-0.5 text-[15px] text-muted-foreground" style={{fontVariant: ['tabular-nums']}}>
          {describeRange(window.start, window.end)} · {describeDays(window.days)}
        </Text>
        {next ? <Text className="mt-0.5 text-[13px] text-primary">{next}</Text> : null}
      </Pressable>
      <Switch
        accessibilityLabel={window.label}
        value={window.enabled}
        onValueChange={onToggle}
        trackColor={{true: colors.primary, false: colors.border}}
        thumbColor={colors.background}
      />
    </View>
  );
}
