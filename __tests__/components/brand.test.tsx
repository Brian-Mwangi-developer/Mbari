/**
 * @format
 */

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';

import {MARK, TILDE_PATH} from '@/components/brand/geometry';
import {Mark} from '@/components/brand/Mark';
import {Wordmark} from '@/components/brand/Wordmark';
import {AppearanceProvider} from '@/lib/appearance';

test('the mark is a stem 2.8 stem-widths tall under a tilde', () => {
  expect(MARK.stem.height / MARK.T).toBeCloseTo(2.8, 5);
  expect(MARK.stem.width).toBe(MARK.T);
  expect(TILDE_PATH.startsWith('M')).toBe(true);
  // The stem stands on the bottom edge of the mark's box.
  expect(MARK.stem.y + MARK.stem.height).toBeCloseTo(MARK.height, 1);
});

test('the mark and the wordmark render and are named Mbarĩ', async () => {
  let renderer!: ReactTestRenderer.ReactTestRenderer;
  await ReactTestRenderer.act(() => {
    renderer = ReactTestRenderer.create(
      <AppearanceProvider>
        <Mark width={80} />
        <Wordmark size={20} />
      </AppearanceProvider>,
    );
  });
  const named = renderer.root.findAll(node => node.props.accessibilityLabel === 'Mbarĩ');
  expect(named.length).toBeGreaterThanOrEqual(2);
});
