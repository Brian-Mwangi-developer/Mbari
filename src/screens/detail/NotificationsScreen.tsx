import * as React from 'react';
import {ActivityIndicator, Pressable, View} from 'react-native';

import type {TestNotificationResult} from '@/api';
import {DetailScreen, Section} from '@/components/layout';
import {SettingsGroup} from '@/components/settings/SettingsGroup';
import {SettingsRow} from '@/components/settings/SettingsRow';
import {ToggleRow} from '@/components/settings/ToggleRow';
import {Text} from '@/components/ui/text';
import {useDelivery} from '@/lib/delivery';
import {ClockIcon} from '@/lib/icons';
import {useNavigation} from '@/lib/navigation';
import {useNotifications} from '@/lib/notifications';
import {describeNext} from '@/lib/schedule';
import {cn} from '@/lib/utils';

const REASONS: Record<string, string> = {
  no_device: 'This phone is not registered yet. Allow notifications above, then try again.',
  nothing_to_recommend: 'Nothing is left to recommend right now, so there was nothing to send.',
};

function describeTest(result: TestNotificationResult): {ok: boolean; text: string} {
  switch (result.status) {
    case 'sent':
      return {ok: true, text: `Sent to ${result.devices === 1 ? 'this phone' : `${result.devices} devices`}. It should arrive in a few seconds.`};
    case 'dry_run':
      return {ok: true, text: 'The server chose an article and wrote the notification, but push is not configured there yet, so nothing was sent.'};
    case 'skipped':
      return {ok: false, text: REASONS[result.reason] ?? `Not sent: ${result.reason}.`};
    case 'failed':
      return {ok: false, text: `Sending failed: ${result.reason}`};
  }
}

/** Whether recommendations can reach this phone, and every reason they might not. */
export function NotificationsScreen() {
  const {closeDetail, openDetail} = useNavigation();
  const delivery = useDelivery();
  const push = useNotifications();
  const [testing, setTesting] = React.useState(false);
  const [testResult, setTestResult] = React.useState<{ok: boolean; text: string} | null>(null);
  const {settings} = delivery;

  const test = async () => {
    setTesting(true);
    setTestResult(null);
    try {
      setTestResult(describeTest(await delivery.sendTest()));
      delivery.reload();
    } catch (e) {
      setTestResult({ok: false, text: e instanceof Error ? e.message : 'The test did not go through.'});
    } finally {
      setTesting(false);
    }
  };

  const phone = !push.available
    ? {label: 'Not set up in this build', detail: 'The app was built without its Firebase config (google-services.json).'}
    : push.permission === 'granted'
      ? {label: push.registered ? 'Receiving' : 'Allowed, registering…', detail: 'Android will show recommendations from Mbari.'}
      : push.permission === 'blocked'
        ? {label: 'Blocked in Android settings', detail: 'Turn notifications on for Mbari in system settings.'}
        : {label: 'Not allowed yet', detail: 'Android asks once; after that it is up to system settings.'};

  return (
    <DetailScreen title="Notifications" onBack={closeDetail}>
      <Section title="This phone">
        <View className="rounded-2xl border border-border bg-card px-5 py-4">
          <Text className={cn('font-serif text-[22px] leading-[28px]', push.permission === 'granted' && push.registered && 'text-primary')}>{phone.label}</Text>
          <Text className="mt-1 text-[15px] leading-[22px] text-muted-foreground">{phone.detail}</Text>
          {push.available && push.permission !== 'granted' ? (
            <Pressable accessibilityRole="button" onPress={() => push.enable().catch(() => {})} className="mt-4 h-12 items-center justify-center rounded-full bg-primary active:opacity-85">
              <Text className="text-[16px] font-semibold text-primary-foreground">
                {push.permission === 'blocked' ? 'Open system settings' : 'Allow notifications'}
              </Text>
            </Pressable>
          ) : null}
        </View>
      </Section>

      {!settings ? (
        <View className="items-center py-10">{delivery.error ? <Text className="text-muted-foreground">{delivery.error}</Text> : <ActivityIndicator />}</View>
      ) : (
        <>
          <Section title="Recommendations">
            <SettingsGroup>
              <ToggleRow
                label="Send me recommendations"
                detail={
                  settings.notificationsEnabled
                    ? describeNext(settings.nextNotificationAt, settings.timezone) ?? 'No window is on'
                    : 'Paused. Your windows are kept.'
                }
                value={settings.notificationsEnabled}
                onValueChange={enabled => delivery.setNotificationsEnabled(enabled).catch(() => {})}
              />
              <SettingsRow icon={ClockIcon} label="Timing" value={`${delivery.activeWindows} on`} onPress={() => openDetail('timing')} />
            </SettingsGroup>
            {!settings.push.configured ? (
              <Text className="mt-3 text-[14px] leading-[21px] text-muted-foreground">
                The server has no push credentials yet, so it records what it would send without sending it.
              </Text>
            ) : null}
          </Section>

          <Section title="Check it works">
            <Pressable
              accessibilityRole="button"
              disabled={testing}
              onPress={test}
              className={cn('h-[52px] items-center justify-center rounded-full border border-border active:opacity-70', testing && 'opacity-50')}>
              <Text className="text-[16px] font-semibold">{testing ? 'Sending…' : 'Send a test notification'}</Text>
            </Pressable>
            <Text className="mt-3 text-[14px] leading-[21px] text-muted-foreground">
              Sends the top of your queue now, whatever the time. Once a minute.
            </Text>
            {testResult ? (
              <Text className={cn('mt-3 text-[15px] leading-[22px]', testResult.ok ? 'text-foreground' : 'text-destructive')}>{testResult.text}</Text>
            ) : null}
          </Section>
        </>
      )}
    </DetailScreen>
  );
}
