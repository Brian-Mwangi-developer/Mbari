import * as React from 'react';
import {Pressable} from 'react-native';

import {Text} from '@/components/ui/text';
import {cn} from '@/lib/utils';

type IconProps = {size?: number; className?: string};

type Props = {
  icon: React.ComponentType<IconProps>;
  label: string;
  onPress?: () => void;
  /** Not built yet: shown, but inert and marked "Soon". */
  soon?: boolean;
};

export function DrawerRow({icon: Icon, label, onPress, soon = false}: Props) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={soon ? `${label}, coming soon` : label}
      accessibilityState={{disabled: soon}}
      disabled={soon}
      onPress={onPress}
      className="min-h-[56px] flex-row items-center gap-4 rounded-lg px-2 active:bg-secondary/60">
      <Icon size={22} className="text-muted-foreground" />
      <Text className={cn('flex-1 text-[19px]', soon && 'text-muted-foreground')}>
        {label}
      </Text>
      {soon && (
        <Text className="text-[12px] font-semibold uppercase tracking-[1.5px] text-muted-foreground">
          Soon
        </Text>
      )}
    </Pressable>
  );
}
