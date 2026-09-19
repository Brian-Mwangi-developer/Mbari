import AsyncStorage from '@react-native-async-storage/async-storage';
import * as React from 'react';
import {Pressable, View} from 'react-native';

import {Text} from '@/components/ui/text';
import {BellIcon} from '@/lib/icons';
import {useNotifications} from '@/lib/notifications';

const DISMISSED_KEY = 'mbari.push.prompt.dismissed.v1';

/**
 * Asks once, in context, before Android's own dialog: a reader who knows what
 * the notification is for says yes far more often, and a "no" to the system
 * dialog cannot be asked again.
 */
export function NotificationPrompt() {
  const {available, permission, enable} = useNotifications();
  const [dismissed, setDismissed] = React.useState<boolean | null>(null);

  React.useEffect(() => {
    AsyncStorage.getItem(DISMISSED_KEY)
      .then(value => setDismissed(value === '1'))
      .catch(() => setDismissed(false));
  }, []);

  if (!available || permission !== 'undetermined' || dismissed !== false) {
    return null;
  }

  const dismiss = () => {
    setDismissed(true);
    AsyncStorage.setItem(DISMISSED_KEY, '1').catch(() => {});
  };

  return (
    <View className="mx-5 mb-3 flex-row items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3">
      <BellIcon size={20} className="text-primary" />
      <Text className="flex-1 text-[14px] leading-[20px] text-foreground/85">Get the next pick inside your reading windows.</Text>
      <Pressable accessibilityRole="button" onPress={dismiss} hitSlop={6} className="px-2 py-2 active:opacity-60">
        <Text className="text-[14px] font-medium text-muted-foreground">Not now</Text>
      </Pressable>
      <Pressable
        accessibilityRole="button"
        onPress={() => {
          dismiss();
          enable().catch(() => {});
        }}
        className="rounded-full bg-primary px-4 py-2 active:opacity-85">
        <Text className="text-[14px] font-semibold text-primary-foreground">Turn on</Text>
      </Pressable>
    </View>
  );
}
