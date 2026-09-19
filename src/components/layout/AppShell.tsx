import * as React from 'react';
import {StatusBar} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';

import {TabBar} from '@/components/layout/TabBar';
import {useAppearance} from '@/lib/appearance';

/**
 * Chrome shared by every top-level screen: themed background, status bar
 * and the bottom tab bar. Screens render as `children`.
 */
export function AppShell({children}: {children: React.ReactNode}) {
  const {resolved} = useAppearance();

  return (
    <SafeAreaView className="flex-1 bg-background">
      <StatusBar
        barStyle={resolved === 'dark' ? 'light-content' : 'dark-content'}
      />
      {children}
      <TabBar />
    </SafeAreaView>
  );
}
