import * as React from 'react';
import {Pressable, View} from 'react-native';

import {Text} from '@/components/ui/text';
import {CheckIcon, CloseIcon, PlusIcon} from '@/lib/icons';
import {cn} from '@/lib/utils';

type Props = {
  label: string;
  selected: boolean;
  onPress: () => void;
  /** "remove" shows a cross on a selected chip, for lists where tapping takes it away. */
  mode?: 'toggle' | 'remove';
};

/** An interest as a pill. Selected ones take the accent. */
export function TopicChip({label, selected, onPress, mode = 'toggle'}: Props) {
  const Icon = selected ? (mode === 'remove' ? CloseIcon : CheckIcon) : PlusIcon;
  return (
    <Pressable
      accessibilityRole={mode === 'remove' ? 'button' : 'checkbox'}
      accessibilityLabel={mode === 'remove' ? `Remove ${label}` : label}
      accessibilityState={mode === 'remove' ? undefined : {checked: selected}}
      onPress={onPress}
      className={cn(
        'flex-row items-center gap-1.5 rounded-full border px-4 py-2.5 active:opacity-70',
        selected ? 'border-primary bg-primary/10' : 'border-border bg-card',
      )}>
      <View>
        <Icon size={15} strokeWidth={2.25} className={selected ? 'text-primary' : 'text-muted-foreground'} />
      </View>
      <Text className={cn('text-[15px] font-medium', selected ? 'text-foreground' : 'text-foreground/80')}>
        {label}
      </Text>
    </Pressable>
  );
}
