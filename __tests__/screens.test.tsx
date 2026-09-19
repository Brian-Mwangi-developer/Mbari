/**
 * @format
 */

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';

import {AppearanceProvider} from '@/lib/appearance';
import {CommunityProvider, useCommunity} from '@/lib/community';
import {NavigationProvider, useNavigation} from '@/lib/navigation';
import {SessionProvider} from '@/lib/session';
import {SendScreen} from '@/screens/SendScreen';
import {CommunityScreen} from '@/screens/tabs/CommunityScreen';
import {HomeScreen} from '@/screens/tabs/HomeScreen';
import {InboxScreen} from '@/screens/tabs/InboxScreen';
import {SettingsScreen} from '@/screens/tabs/SettingsScreen';

let community: ReturnType<typeof useCommunity>;
let nav: ReturnType<typeof useNavigation>;
function Probe() {
  community = useCommunity();
  nav = useNavigation();
  return null;
}

const render = async (screen: React.ReactElement) => {
  let r!: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(() => {
    r = ReactTestRenderer.create(
      <AppearanceProvider>
        <SessionProvider>
          <CommunityProvider>
            <NavigationProvider>
              <Probe />
              {screen}
            </NavigationProvider>
          </CommunityProvider>
        </SessionProvider>
      </AppearanceProvider>,
    );
  });
  return r;
};

const texts = (r: ReactTestRenderer.ReactTestRenderer) =>
  r.root.findAll(n => typeof n.props.children === 'string').map(n => n.props.children as string);

test.each([
  ['Home', <HomeScreen />],
  ['Community', <CommunityScreen />],
  ['Inbox', <InboxScreen />],
  ['Settings', <SettingsScreen />],
])('%s renders its title', async (title, screen) => {
  const r = await render(screen);
  expect(texts(r)).toContain(title);
});

test('Home leads with the newest Kiambu update and opens it for sending', async () => {
  const r = await render(<HomeScreen />);
  expect(texts(r)).toContain('Kiambu County opens public participation on the 2026/27 budget');
  const send = r.root.find(n => n.props.accessibilityLabel === 'Send to community' && typeof n.props.onPress === 'function');
  await ReactTestRenderer.act(() => send.props.onPress());
  expect(nav.sendingId).toBe('a1');
});

test('switching county changes what Home shows', async () => {
  const r = await render(<HomeScreen />);
  await ReactTestRenderer.act(() => community.setCounty('Nyeri'));
  expect(texts(r)).toContain('Nyeri ward bursary forms now available');
  expect(texts(r)).not.toContain('Kiambu County opens public participation on the 2026/27 budget');
});

test('approving an update marks it sent', async () => {
  const r = await render(<SendScreen alertId="a1" />);
  const approve = r.root.find(n => n.props.accessibilityLabel === 'Approve and send' && typeof n.props.onPress === 'function');
  await ReactTestRenderer.act(() => approve.props.onPress());
  expect(community.alerts.find(a => a.id === 'a1')?.status).toBe('sent');
});
