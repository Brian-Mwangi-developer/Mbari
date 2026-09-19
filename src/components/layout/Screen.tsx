import * as React from 'react';
import {View} from 'react-native';

import {ScreenHeader} from '@/components/layout/ScreenHeader';

type Props = {
  title: string;
  /** Left of the title, e.g. the drawer's menu button. */
  leading?: React.ReactNode;
  /** Right-aligned header content, e.g. a date. */
  trailing?: React.ReactNode;
  children: React.ReactNode;
};

/** Header + body; the body fills the space above the tab bar. */
export function Screen({title, leading, trailing, children}: Props) {
  return (
    <View className="flex-1">
      <ScreenHeader title={title} leading={leading} trailing={trailing} />
      {children}
    </View>
  );
}
