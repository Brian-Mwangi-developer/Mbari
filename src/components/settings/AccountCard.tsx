import * as React from 'react';
import {Pressable, View} from 'react-native';

import {Text} from '@/components/ui/text';
import {ChevronRightIcon} from '@/lib/icons';

type Props = {
  name: string;
  email: string;
  onPress?: () => void;
};

export function AccountCard({name, email, onPress}: Props) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`Account, ${name}, ${email}`}
      onPress={onPress}
      className="min-h-[88px] flex-row items-center gap-4 rounded-lg border border-border bg-card px-5 py-4 active:bg-secondary/60">
      <View className="h-[52px] w-[52px] items-center justify-center rounded-full border border-border">
        <Text className="text-[21px] font-semibold text-muted-foreground">
          {name.charAt(0).toUpperCase()}
        </Text>
      </View>
      <View className="flex-1">
        <Text className="text-[19px] font-semibold">{name}</Text>
        <Text className="mt-0.5 text-[15px] text-muted-foreground">
          {email}
        </Text>
      </View>
      <ChevronRightIcon size={20} className="text-muted-foreground" />
    </Pressable>
  );
}
