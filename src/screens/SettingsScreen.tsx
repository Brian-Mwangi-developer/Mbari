import * as React from 'react';
import {ScrollView, View} from 'react-native';

import {Screen, Section} from '@/components/layout';
import {AccountCard} from '@/components/settings/AccountCard';
import {SettingsGroup} from '@/components/settings/SettingsGroup';
import {SettingsRow} from '@/components/settings/SettingsRow';
import {ToggleRow} from '@/components/settings/ToggleRow';
import * as api from '@/api';
import {Button} from '@/components/ui/button';
import {Text} from '@/components/ui/text';
import {useSession} from '@/lib/session';
import {APP_VERSION} from '@/lib/app-info';
import {useAppearance} from '@/lib/appearance';
import {useDelivery} from '@/lib/delivery';
import {
  BellIcon,
  BookIcon,
  ClockIcon,
  DownloadIcon,
  NoticedIcon,
  OfflineIcon,
  TrashIcon,
  TypeIcon,
} from '@/lib/icons';
import {useNavigation} from '@/lib/navigation';
import {useNotifications} from '@/lib/notifications';
import {useOffline} from '@/lib/offline';
import {RETENTION_OPTIONS} from '@/screens/detail/OfflineRetentionScreen';
import {TYPEFACES, useReaderSettings} from '@/lib/reader-settings';

const APPEARANCE_LABELS = {system: 'System', light: 'Light', dark: 'Dark'};

export function SettingsScreen() {
  const {openDetail} = useNavigation();
  const {account, signOut, refresh} = useSession();
  const {retention} = useOffline();
  // Optimistic: the switch moves at once and returns if the save fails.
  const [shortExpiry, setShortExpiry] = React.useState<boolean | null>(null);
  const clearsAfter14 = shortExpiry ?? account?.unreadExpiryDays === 14;

  const toggleShortExpiry = async (next: boolean) => {
    setShortExpiry(next);
    try {
      await api.updateProfile({unreadExpiryDays: next ? 14 : 30});
      await refresh();
    } catch {
      setShortExpiry(!next);
    }
  };

  const retentionLabel = RETENTION_OPTIONS.find(o => o.value === retention)?.label ?? '30 days';
  const {appearance} = useAppearance();
  const {settings} = useReaderSettings();
  const {activeWindows, settings: delivery} = useDelivery();
  const push = useNotifications();
  const notificationsValue = !push.available
    ? 'Not set up'
    : push.permission !== 'granted'
      ? 'Not allowed'
      : delivery && !delivery.notificationsEnabled
        ? 'Paused'
        : 'On';

  const typeface = TYPEFACES.find(t => t.value === settings.typeface)!.label;

  return (
    <Screen title="Settings">
      <ScrollView
        className="flex-1"
        contentContainerClassName="gap-9 px-6 pb-10"
        showsVerticalScrollIndicator={false}>
        <AccountCard name={account?.name ?? ''} email={account?.email ?? ''} />

        <Section title="Reading">
          <SettingsGroup>
            <SettingsRow
              icon={NoticedIcon}
              label="Interests"
              value={account?.interests.length ? `${account.interests.length} chosen` : 'Learning'}
              onPress={() => openDetail('interests')}
            />
            <SettingsRow
              icon={TypeIcon}
              label="Appearance"
              value={APPEARANCE_LABELS[appearance]}
              onPress={() => openDetail('appearance')}
            />
            <SettingsRow
              icon={BookIcon}
              label="Reading typeface"
              value={typeface}
              onPress={() => openDetail('typeface')}
            />
          </SettingsGroup>
        </Section>

        <Section title="Library">
          <SettingsGroup>
            <ToggleRow
              label="Clear unread after 14 days"
              detail={
                clearsAfter14
                  ? 'Unread articles leave after 14 days'
                  : 'Unread articles leave after 30 days'
              }
              value={clearsAfter14}
              onValueChange={value => {
                toggleShortExpiry(value).catch(() => {});
              }}
            />
            <SettingsRow
              icon={OfflineIcon}
              label="Offline articles"
              value={retention === null ? 'Keep forever' : `Keep ${retentionLabel}`}
              onPress={() => openDetail('offlineRetention')}
            />
          </SettingsGroup>
        </Section>

        <Section title="Delivery">
          <SettingsGroup>
            <SettingsRow
              icon={ClockIcon}
              label="Timing"
              value={`${activeWindows} ${
                activeWindows === 1 ? 'window' : 'windows'
              }`}
              onPress={() => openDetail('timing')}
            />
            <SettingsRow
              icon={BellIcon}
              label="Notifications"
              value={notificationsValue}
              onPress={() => openDetail('notifications')}
            />
          </SettingsGroup>
        </Section>

        <Section title="Data">
          <SettingsGroup>
            {/* TODO: both need the backend. */}
            <SettingsRow icon={DownloadIcon} label="Export highlights" />
            <SettingsRow icon={TrashIcon} label="Delete account" muted />
          </SettingsGroup>
        </Section>

        <View className="items-center pt-2">
          <Text className="text-[15px] text-muted-foreground">
            Mbari {APP_VERSION}
          </Text>
        </View>
        <Button
          variant="ghost"
          size="lg"
          className="h-14 rounded-xl"
          onPress={() => {
            signOut().catch(() => {});
          }}>
          <Text className="text-lg font-medium text-destructive">Sign out</Text>
        </Button>
      </ScrollView>
    </Screen>
  );
}
