/**
 * @format
 */

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';

import {TabBar} from '@/components/layout/TabBar';
import {AppearanceProvider} from '@/lib/appearance';
import {CommunityProvider} from '@/lib/community';
import {NavigationProvider, TABS, useNavigation} from '@/lib/navigation';

let current: ReturnType<typeof useNavigation>;
function Probe() {
  current = useNavigation();
  return null;
}

const render = async () => {
  let renderer!: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(() => {
    renderer = ReactTestRenderer.create(
      <AppearanceProvider>
        <CommunityProvider>
          <NavigationProvider>
            <Probe />
            <TabBar />
          </NavigationProvider>
        </CommunityProvider>
      </AppearanceProvider>,
    );
  });
  return renderer;
};

test('the bar has the four tabs, Home first', () => {
  expect(TABS).toEqual(['Home', 'Community', 'Inbox', 'Settings']);
});

test('starts on Home and switches tabs when one is pressed', async () => {
  const renderer = await render();
  expect(current.tab).toBe('Home');

  const tabs = renderer.root.findAll(node => node.props.accessibilityRole === 'tab' && typeof node.props.onPress === 'function');
  expect(tabs).toHaveLength(4);
  expect(tabs.filter(t => t.props.accessibilityState?.selected)).toHaveLength(1);

  await ReactTestRenderer.act(() => {
    tabs[2].props.onPress();
  });
  expect(current.tab).toBe('Inbox');
});
