import '../global.css';

import * as React from 'react';
import {StyleSheet, View} from 'react-native';
import {GestureHandlerRootView} from 'react-native-gesture-handler';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {PortalHost} from '@rn-primitives/portal';

import {LaunchScreen} from '@/components/brand/LaunchScreen';
import {AppShell} from '@/components/layout';
import {AppearanceProvider} from '@/lib/appearance';
import {LaunchProvider} from '@/lib/launch';
import {NavigationProvider, useNavigation} from '@/lib/navigation';
import {SessionProvider, useSession} from '@/lib/session';
import {InterestsOnboarding} from '@/screens/InterestsOnboarding';
import {SignInScreen} from '@/screens/SignInScreen';
import {AlertsScreen} from '@/screens/tabs/AlertsScreen';
import {CommunityScreen} from '@/screens/tabs/CommunityScreen';
import {MeScreen} from '@/screens/tabs/MeScreen';
import {RepliesScreen} from '@/screens/tabs/RepliesScreen';

function App() {
  return (
    <GestureHandlerRootView style={styles.root}>
      <SafeAreaProvider>
        <AppearanceProvider>
          <SessionProvider>
            <LaunchProvider>
              <NavigationProvider>
                <Root />
                <PortalHost />
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

/** Signed out: sign in. Signed in but new: onboarding. Otherwise the four tabs. */
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
    <AppShell>
      <ActiveScreen />
    </AppShell>
  );
}

function ActiveScreen() {
  const {tab} = useNavigation();
  switch (tab) {
    case 'Alerts':
      return <AlertsScreen />;
    case 'Community':
      return <CommunityScreen />;
    case 'Replies':
      return <RepliesScreen />;
    case 'Me':
      return <MeScreen />;
  }
}

const styles = StyleSheet.create({root: {flex: 1}});

export default App;
