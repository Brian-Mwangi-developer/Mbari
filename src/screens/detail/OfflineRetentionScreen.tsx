import * as React from 'react';

import {DetailScreen, Section} from '@/components/layout';
import {OptionRow} from '@/components/settings/OptionRow';
import {SettingsGroup} from '@/components/settings/SettingsGroup';
import {Text} from '@/components/ui/text';
import {useNavigation} from '@/lib/navigation';
import {useOffline} from '@/lib/offline';
import type {OfflineRetention} from '@/lib/offline-store';

export const RETENTION_OPTIONS: {value: OfflineRetention; label: string; description: string}[] = [
  {value: 7, label: '7 days', description: 'Keeps the phone light'},
  {value: 30, label: '30 days', description: 'A month of reading'},
  {value: null, label: 'Forever', description: 'Until you remove them'},
];

/** How long articles saved for offline reading stay on this phone. */
export function OfflineRetentionScreen() {
  const {closeDetail} = useNavigation();
  const {retention, setRetention} = useOffline();

  return (
    <DetailScreen title="Offline articles" onBack={closeDetail}>
      <Section title="Keep saved articles for">
        <SettingsGroup>
          {RETENTION_OPTIONS.map(option => (
            <OptionRow
              key={String(option.value)}
              label={option.label}
              description={option.description}
              selected={retention === option.value}
              onPress={() => setRetention(option.value)}
            />
          ))}
        </SettingsGroup>
      </Section>
      <Text className="text-[15px] leading-[22px] text-muted-foreground">
        Counted from when you saved each article. This only affects copies on
        this phone; your library and history are unchanged.
      </Text>
    </DetailScreen>
  );
}
