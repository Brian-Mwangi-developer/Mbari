import * as React from 'react';
import {Pressable, View} from 'react-native';

import {Text} from '@/components/ui/text';
import {cn} from '@/lib/utils';

type Option<T extends string> = {value: T; label: string};

type Props<T extends string> = {
  options: readonly Option<T>[];
  value: T;
  onChange: (value: T) => void;
};

export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
}: Props<T>) {
  return (
    <View className="flex-row rounded-lg bg-secondary p-1">
      {options.map(option => {
        const selected = option.value === value;
        return (
          <Pressable
            key={option.value}
            accessibilityRole="radio"
            accessibilityState={{selected}}
            onPress={() => onChange(option.value)}
            className={cn(
              'flex-1 items-center rounded-md py-3',
              selected && 'bg-card',
            )}>
            <Text
              className={cn(
                'text-[15px] font-medium',
                selected ? 'text-foreground' : 'text-muted-foreground',
              )}>
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
