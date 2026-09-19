import * as React from 'react';

import {DetailScreen, Section} from '@/components/layout';
import {OptionRow} from '@/components/settings/OptionRow';
import {SettingsGroup} from '@/components/settings/SettingsGroup';
import {type Appearance, useAppearance} from '@/lib/appearance';
import {useNavigation} from '@/lib/navigation';

const OPTIONS: {value: Appearance; label: string; description: string}[] = [
  {value: 'system', label: 'System', description: 'Follow your phone setting'},
  {value: 'light', label: 'Light', description: 'Warm paper'},
  {value: 'dark', label: 'Dark', description: 'Near black'},
];

export function AppearanceScreen() {
  const {closeDetail} = useNavigation();
  const {appearance, setAppearance} = useAppearance();

  return (
    <DetailScreen title="Appearance" onBack={closeDetail}>
      <Section title="Theme">
        <SettingsGroup>
          {OPTIONS.map(option => (
            <OptionRow
              key={option.value}
              label={option.label}
              description={option.description}
              selected={appearance === option.value}
              onPress={() => setAppearance(option.value)}
            />
          ))}
        </SettingsGroup>
      </Section>
    </DetailScreen>
  );
}
