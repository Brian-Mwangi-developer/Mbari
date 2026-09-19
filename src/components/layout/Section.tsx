import * as React from 'react';
import {View} from 'react-native';

import {Text} from '@/components/ui/text';

type Props = {
  title: string;
  children: React.ReactNode;
};

/** Uppercase eyebrow label above a block of settings or content. */
export function Section({title, children}: Props) {
  return (
    <View>
      <Text className="text-[13px] font-semibold uppercase tracking-[2px] text-muted-foreground">
        {title}
      </Text>
      <View className="mt-4">{children}</View>
    </View>
  );
}
