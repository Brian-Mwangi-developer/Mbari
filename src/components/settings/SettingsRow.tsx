import * as React from 'react';
import {Pressable, View} from 'react-native';

import {Text} from '@/components/ui/text';
import {ChevronRightIcon} from '@/lib/icons';
import {cn} from '@/lib/utils';

type IconProps = {size?: number; className?: string};

type Props = {
  icon?: React.ComponentType<IconProps>;
  label: string;
  /** Current setting, shown right-aligned before the chevron. */
  value?: string;
  onPress?: () => void;
  /** Dims the row — used for destructive or not-yet-wired entries. */
  muted?: boolean;
};

export function SettingsRow({icon: Icon, label, value, onPress, muted}: Props) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={value ? `${label}, ${value}` : label}
      onPress={onPress}
      className="min-h-[64px] flex-row items-center gap-3.5 px-5 py-4 active:bg-secondary/60">
      {Icon ? (
        <Icon size={22} className="text-muted-foreground" />
      ) : (
        <View className="w-[22px]" />
      )}
      <Text
        className={cn(
          'flex-1 text-[17px]',
          muted ? 'text-muted-foreground' : 'text-foreground',
        )}>
        {label}
      </Text>
      {value ? (
        <Text className="text-[15px] text-muted-foreground">{value}</Text>
      ) : null}
      <ChevronRightIcon size={20} className="text-muted-foreground" />
    </Pressable>
  );
}
