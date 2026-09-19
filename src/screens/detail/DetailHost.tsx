import * as React from 'react';

import {useNavigation} from '@/lib/navigation';
import {AppearanceScreen} from '@/screens/detail/AppearanceScreen';
import {ForwardingSetupScreen} from '@/screens/detail/ForwardingSetupScreen';
import {LibraryScreen} from '@/screens/detail/LibraryScreen';
import {OfflineRetentionScreen} from '@/screens/detail/OfflineRetentionScreen';
import {OfflineScreen} from '@/screens/detail/OfflineScreen';
import {InterestsScreen} from '@/screens/detail/InterestsScreen';
import {NotificationsScreen} from '@/screens/detail/NotificationsScreen';
import {PassedOverScreen} from '@/screens/detail/PassedOverScreen';
import {SavedScreen} from '@/screens/detail/SavedScreen';
import {TimingScreen} from '@/screens/detail/TimingScreen';
import {TypefaceScreen} from '@/screens/detail/TypefaceScreen';

/** Renders the pushed detail page, if any, above the tab shell. */
export function DetailHost() {
  const {detail} = useNavigation();

  switch (detail) {
    case 'timing':
      return <TimingScreen />;
    case 'appearance':
      return <AppearanceScreen />;
    case 'typeface':
      return <TypefaceScreen />;
    case 'forwarding':
      return <ForwardingSetupScreen />;
    case 'library':
      return <LibraryScreen />;
    case 'passedOver':
      return <PassedOverScreen />;
    case 'offline':
      return <OfflineScreen />;
    case 'offlineRetention':
      return <OfflineRetentionScreen />;
    case 'saved':
      return <SavedScreen />;
    case 'interests':
      return <InterestsScreen />;
    case 'notifications':
      return <NotificationsScreen />;
    default:
      return null;
  }
}
