import * as React from 'react';
import {Pressable} from 'react-native';

import {Text} from '@/components/ui/text';
import {PlusIcon} from '@/lib/icons';

type Props = {
  label: string;
  onPress: () => void;
};

/** Dashed, full-width "add another one of these" affordance. */
export function AddButton({label, onPress}: Props) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={label}
      onPress={onPress}
      className="min-h-[60px] flex-row items-center justify-center gap-2.5 rounded-lg border border-dashed border-border active:opacity-70">
      <PlusIcon size={20} className="text-muted-foreground" />
      <Text className="text-[17px] text-muted-foreground">{label}</Text>
    </Pressable>
  );
}
