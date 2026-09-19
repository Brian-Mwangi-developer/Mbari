/**
 * @format
 */

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';

import {BACKEND_ENABLED} from '@/api/config';
import {SessionProvider, useSession} from '@/lib/session';

let session: ReturnType<typeof useSession>;
function Probe() {
  session = useSession();
  return null;
}

const mount = async () => {
  await ReactTestRenderer.act(() => {
    ReactTestRenderer.create(
      <SessionProvider>
        <Probe />
      </SessionProvider>,
    );
  });
};

beforeEach(() => {
  (global.fetch as jest.Mock).mockClear();
});

// While there is no backend, every way of signing in goes straight to the home
// tabs without touching the network.
test('the backend switch is off until the server exists', () => {
  expect(BACKEND_ENABLED).toBe(false);
});

test('starts signed out, with no network call', async () => {
  await mount();
  expect(session.status).toBe('signedOut');
  expect(global.fetch).not.toHaveBeenCalled();
});

test.each([
  ['Google', () => session.signInWithGoogle()],
  ['email', () => session.signIn('wanjiru@example.com', 'password123')],
  ['sign-up', () => session.signUp('wanjiru@example.com', 'password123', 'Wanjiru')],
])('%s goes straight in, skips onboarding and calls no API', async (_name, run) => {
  await mount();
  await ReactTestRenderer.act(async () => {
    await run();
  });
  expect(session.status).toBe('signedIn');
  expect(session.account?.onboardingDone).toBe(true);
  expect(global.fetch).not.toHaveBeenCalled();
});

test('signing out returns to the landing', async () => {
  await mount();
  await ReactTestRenderer.act(async () => {
    await session.signInWithGoogle();
  });
  await ReactTestRenderer.act(async () => {
    await session.signOut();
  });
  expect(session.status).toBe('signedOut');
});
