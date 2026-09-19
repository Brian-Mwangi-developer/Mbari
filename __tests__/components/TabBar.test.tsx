/**
 * @format
 */

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';

import {TabBar} from '@/components/layout/TabBar';
import {AppearanceProvider} from '@/lib/appearance';
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
        <NavigationProvider>
          <Probe />
          <TabBar />
        </NavigationProvider>
      </AppearanceProvider>,
    );
  });
  return renderer;
};

test('the bar has the four tabs, Alerts first', () => {
  expect(TABS).toEqual(['Alerts', 'Community', 'Replies', 'Me']);
});

test('starts on Alerts and switches tabs when one is pressed', async () => {
  const renderer = await render();
  expect(current.tab).toBe('Alerts');

  const tabs = renderer.root.findAll(node => node.props.accessibilityRole === 'tab' && typeof node.props.onPress === 'function');
  expect(tabs).toHaveLength(4);
  expect(tabs.filter(t => t.props.accessibilityState?.selected)).toHaveLength(1);

  await ReactTestRenderer.act(() => {
    tabs[2].props.onPress();
  });
  expect(current.tab).toBe('Replies');
});
