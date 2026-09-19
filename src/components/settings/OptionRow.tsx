import * as React from 'react';
import {Pressable, View} from 'react-native';

import {Text} from '@/components/ui/text';
import {CheckIcon} from '@/lib/icons';

type Props = {
  label: string;
  description?: string;
  selected: boolean;
  onPress: () => void;
};

/** Radio row for a detail page that picks one value from a list. */
export function OptionRow({label, description, selected, onPress}: Props) {
  return (
    <Pressable
      accessibilityRole="radio"
      accessibilityState={{selected}}
      onPress={onPress}
      className="min-h-[64px] flex-row items-center gap-4 px-5 py-4 active:bg-secondary/60">
      <View className="flex-1">
        <Text className="text-[17px]">{label}</Text>
        {description ? (
          <Text className="mt-0.5 text-[15px] text-muted-foreground">
            {description}
          </Text>
        ) : null}
      </View>
      {selected ? <CheckIcon size={22} className="text-primary" /> : null}
    </Pressable>
  );
}
