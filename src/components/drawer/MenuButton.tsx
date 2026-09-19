import * as React from 'react';
import {Pressable} from 'react-native';

import {MenuIcon} from '@/lib/icons';

export function MenuButton({onPress}: {onPress: () => void}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Open menu"
      onPress={onPress}
      hitSlop={8}
      className="h-11 w-11 items-center justify-center rounded-full border border-border bg-card active:opacity-70">
      <MenuIcon size={22} className="text-foreground" />
    </Pressable>
  );
}
