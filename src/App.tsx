import '../global.css';

import * as React from 'react';
import {StyleSheet, View} from 'react-native';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {PortalHost} from '@rn-primitives/portal';

import {LaunchScreen} from '@/components/brand/LaunchScreen';
import {AppShell} from '@/components/layout';
import {PushBanner} from '@/components/notifications/PushBanner';
import {ReaderHost} from '@/components/reader/ReaderHost';
import {AppearanceProvider} from '@/lib/appearance';
import {DeckProvider} from '@/lib/deck';
import {DeliveryProvider} from '@/lib/delivery';
import {LaunchProvider} from '@/lib/launch';
import {NavigationProvider, useNavigation} from '@/lib/navigation';
import {NotificationsProvider} from '@/lib/notifications';
import {OfflineProvider} from '@/lib/offline';
import {SessionProvider, useSession} from '@/lib/session';
import {SourcesProvider} from '@/lib/sources';
import {ReaderProvider} from '@/lib/reader';
import {ReaderSettingsProvider} from '@/lib/reader-settings';
import {ArchiveScreen} from '@/screens/ArchiveScreen';
import {InterestsOnboarding} from '@/screens/InterestsOnboarding';
import {DetailHost} from '@/screens/detail/DetailHost';
import {SettingsScreen} from '@/screens/SettingsScreen';
import {SourcesScreen} from '@/screens/SourcesScreen';
import {SignInScreen} from '@/screens/SignInScreen';
import {TodayScreen} from '@/screens/TodayScreen';

function App() {
  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <AppearanceProvider>
          <SessionProvider>
            <LaunchProvider>
              <NavigationProvider>
                <ReaderSettingsProvider>
                  <Root />
                  <PortalHost />
                </ReaderSettingsProvider>
              </NavigationProvider>
              {/* Above everything, until it has handed over. */}
              <LaunchScreen />
            </LaunchProvider>
          </SessionProvider>
        </AppearanceProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

/**
 * Everything below the session gate. Sources, the reader and the offline shelf
 * all belong to the signed-in user, so they are only mounted once someone is.
 */
function Root() {
  const {status, account} = useSession();

  if (status === 'loading') {
    // The launch screen covers this.
    return <View className="flex-1 bg-background" />;
  }

  if (status === 'signedOut') {
    return <SignInScreen />;
  }

  if (account && !account.onboardingDone) {
    return <InterestsOnboarding />;
  }

  return (
    <SourcesProvider>
      <OfflineProvider>
        <DeckProvider>
          <DeliveryProvider>
            <ReaderProvider>
              <NotificationsProvider>
                <AppShell>
                  <ActiveScreen />
                </AppShell>
                <DetailHost />
                <TabReader />
                <PushBanner />
              </NotificationsProvider>
            </ReaderProvider>
          </DeliveryProvider>
        </DeckProvider>
      </OfflineProvider>
    </SourcesProvider>
  );
}

/**
 * The reader over the tabs. A detail page is its own Modal window, so while
 * one is open it hosts the reader itself (see DetailScreen's `overlay`).
 */
function TabReader() {
  const {detail} = useNavigation();
  return detail ? null : <ReaderHost />;
}

function ActiveScreen() {
  const {tab} = useNavigation();
  switch (tab) {
    case 'Today':
      return <TodayScreen />;
    case 'Archive':
      return <ArchiveScreen />;
    case 'Sources':
      return <SourcesScreen />;
    case 'Settings':
      return <SettingsScreen />;
  }
}

const styles = StyleSheet.create({root: {flex: 1}});

export default App;
