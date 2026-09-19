import * as React from 'react';

import {DetailScreen, Section} from '@/components/layout';
import {OptionRow} from '@/components/settings/OptionRow';
import {SettingsGroup} from '@/components/settings/SettingsGroup';
import {Text} from '@/components/ui/text';
import {useNavigation} from '@/lib/navigation';
import {TYPEFACES, useReaderSettings} from '@/lib/reader-settings';

export function TypefaceScreen() {
  const {closeDetail} = useNavigation();
  const {settings, update} = useReaderSettings();

  return (
    <DetailScreen title="Reading typeface" onBack={closeDetail}>
      <Section title="Typeface">
        <SettingsGroup>
          {TYPEFACES.map(typeface => (
            <OptionRow
              key={typeface.value}
              label={typeface.label}
              selected={settings.typeface === typeface.value}
              onPress={() => update('typeface', typeface.value)}
            />
          ))}
        </SettingsGroup>
      </Section>

      <Text className="text-[16px] leading-[24px] text-muted-foreground">
        Used for article text. You can also change it while reading, from the Aa
        button.
      </Text>
    </DetailScreen>
  );
}
