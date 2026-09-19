import * as React from 'react';
import {Pressable, StyleSheet, Text} from 'react-native';

import {useReaderSettings} from '@/lib/reader-settings';
import {THEME} from '@/lib/theme';

type Props = {
  label: string;
  selected: boolean;
  onPress: () => void;
};

/** Pill option used by the reader settings sheet; colours follow the reader theme. */
export function Chip({label, selected, onPress}: Props) {
  const {resolved} = useReaderSettings();
  const accent = THEME[resolved.theme.scheme].primary;

  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{selected}}
      onPress={onPress}
      className="items-center rounded-full border-[1.5px] px-4 py-3.5 active:opacity-70"
      style={{borderColor: selected ? accent : resolved.theme.border}}>
      <Text
        style={[
          styles.label,
          {color: selected ? accent : resolved.theme.foreground},
        ]}>
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  label: {fontFamily: 'PlusJakartaSans', fontSize: 15, fontWeight: '500'},
});
