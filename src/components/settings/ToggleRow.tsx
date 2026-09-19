import * as React from 'react';
import {Switch, View} from 'react-native';

import {Text} from '@/components/ui/text';
import {useAppearance} from '@/lib/appearance';
import {THEME} from '@/lib/theme';
import {cn} from '@/lib/utils';

type Props = {
  label: string;
  /** Second line: a time range, a connection status, etc. */
  detail?: string;
  value: boolean;
  onValueChange: (value: boolean) => void;
  disabled?: boolean;
};

export function ToggleRow({
  label,
  detail,
  value,
  onValueChange,
  disabled,
}: Props) {
  const {resolved} = useAppearance();
  const colors = THEME[resolved];

  return (
    <View className="min-h-[72px] flex-row items-center gap-4 px-5 py-4">
      <View className="flex-1">
        <Text
          className={cn(
            'text-[17px]',
            disabled ? 'text-muted-foreground' : 'text-foreground',
          )}>
          {label}
        </Text>
        {detail ? (
          <Text className="mt-0.5 text-[15px] text-muted-foreground">
            {detail}
          </Text>
        ) : null}
      </View>
      <Switch
        accessibilityLabel={label}
        value={value}
        onValueChange={onValueChange}
        disabled={disabled}
        trackColor={{true: colors.primary, false: colors.border}}
        thumbColor={colors.background}
      />
    </View>
  );
}
