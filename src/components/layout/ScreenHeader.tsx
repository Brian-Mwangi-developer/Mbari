import * as React from 'react';
import {View} from 'react-native';

import {Text} from '@/components/ui/text';

type Props = {
  title: string;
  /** Left of the title, e.g. the drawer's menu button. */
  leading?: React.ReactNode;
  trailing?: React.ReactNode;
};

export function ScreenHeader({title, leading, trailing}: Props) {
  return (
    <View className="flex-row items-center px-6 pb-6 pt-8">
      {leading ? <View className="mr-3">{leading}</View> : null}
      <Text className="flex-1 text-[22px] font-bold tracking-tight">
        {title}
      </Text>
      {trailing}
    </View>
  );
}
