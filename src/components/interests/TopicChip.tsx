import * as React from 'react';
import {Pressable} from 'react-native';

import {Check, Plus, X} from 'lucide-react-native';
import {Text} from '@/components/ui/text';
import {useTheme} from '@/lib/theme';
import {cn} from '@/lib/utils';

type Props = {
  label: string;
  selected: boolean;
  onPress: () => void;
  /** "remove" shows a cross on a selected chip, for lists where tapping takes it away. */
  mode?: 'toggle' | 'remove';
};

/**
 * A topic as a small flat block: an outline when off, solid ink when on. No
 * tinted fills; the state is the fill and the icon.
 */
export function TopicChip({label, selected, onPress, mode = 'toggle'}: Props) {
  const colors = useTheme();
  const Glyph = selected ? (mode === 'remove' ? X : Check) : Plus;
  return (
    <Pressable
      accessibilityRole={mode === 'remove' ? 'button' : 'checkbox'}
      accessibilityLabel={mode === 'remove' ? `Remove ${label}` : label}
      accessibilityState={mode === 'remove' ? undefined : {checked: selected}}
      onPress={onPress}
      className={cn(
        'flex-row items-center gap-2 rounded-full border px-4 py-3 active:opacity-70',
        selected ? 'border-foreground bg-foreground' : 'border-foreground/30 bg-transparent',
      )}>
      <Glyph size={16} strokeWidth={2.4} color={selected ? colors.background : colors.mutedForeground} />
      <Text className={cn('text-[15px] font-semibold', selected ? 'text-background' : 'text-foreground')}>{label}</Text>
    </Pressable>
  );
}
