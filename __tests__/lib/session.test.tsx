/**
 * @format
 */

import React from 'react';
import ReactTestRenderer from 'react-test-renderer';

import {getToken, setToken} from '@/api';
import {API_BASE_URL, BACKEND_ENABLED, NATIVE_APP_ORIGIN} from '@/api/config';
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

const ME = {
  id: 'u1',
  name: 'Kamau Njoroge',
  email: 'relay@demo.mbari.app',
  image: null,
  role: 'member',
  onboardingDone: true,
  organization: {id: 'o1', name: 'Kiambu Farmers Network', slug: 'kfn', county: 'Kiambu'},
  counties: ['Kiambu'],
  topics: ['Farming'],
};

function reply(status: number, body: unknown) {
  return Promise.resolve({ok: status >= 200 && status < 300, status, text: () => Promise.resolve(JSON.stringify(body))});
}

/** A stand-in mbari-backend: better-auth under /api/auth, the API under /api/v1. */
function backend({password = 'MbariDemo2026'} = {}) {
  (global.fetch as jest.Mock).mockImplementation((url: string, init: {method?: string; body?: string}) => {
    const path = url.slice(API_BASE_URL.length);
    if (path === '/api/auth/sign-in/email') {
      const body = JSON.parse(init.body ?? '{}');
      return body.password === password
        ? reply(200, {token: 'tok-123', user: {id: 'u1'}})
        : reply(401, {message: 'Invalid email or password', code: 'INVALID_EMAIL_OR_PASSWORD'});
    }
    if (path === '/api/auth/sign-up/email') {
      return reply(200, {token: 'tok-new', user: {id: 'u2'}});
    }
    if (path === '/api/auth/sign-out') {
      return reply(200, {success: true});
    }
    if (path === '/api/v1/me') {
      return reply(200, {success: true, data: ME});
    }
    return reply(404, {success: false, message: `no route ${path}`});
  });
}

type Call = [string, {method?: string; headers: Record<string, string>; body?: string}];
const calls = () => (global.fetch as jest.Mock).mock.calls as Call[];

beforeEach(async () => {
  (global.fetch as jest.Mock).mockReset();
  await setToken(null);
});

test('the app talks to the backend', () => {
  expect(BACKEND_ENABLED).toBe(true);
});

test('starts signed out, with no network call, when there is no stored token', async () => {
  backend();
  await mount();
  expect(session.status).toBe('signedOut');
  expect(global.fetch).not.toHaveBeenCalled();
});

test('email sign-in stores the bearer token and loads the account', async () => {
  backend();
  await mount();
  await ReactTestRenderer.act(async () => {
    await session.signIn('relay@demo.mbari.app', 'MbariDemo2026');
  });

  expect(session.status).toBe('signedIn');
  expect(session.account).toMatchObject({
    name: 'Kamau Njoroge',
    role: 'member',
    organization: {name: 'Kiambu Farmers Network'},
    counties: ['Kiambu'],
    interests: ['Farming'],
  });
  expect(await getToken()).toBe('tok-123');

  const [signIn, me] = calls();
  expect(signIn[0]).toBe(`${API_BASE_URL}/api/auth/sign-in/email`);
  // better-auth's CSRF check needs an Origin it trusts.
  expect(signIn[1].headers.Origin).toBe(NATIVE_APP_ORIGIN);
  expect(signIn[1].headers.Authorization).toBeUndefined();
  expect(me[0]).toBe(`${API_BASE_URL}/api/v1/me`);
  expect(me[1].headers.Authorization).toBe('Bearer tok-123');
});

test('a wrong password throws the server message and stays signed out', async () => {
  backend();
  await mount();
  let error: unknown;
  await ReactTestRenderer.act(async () => {
    await session.signIn('relay@demo.mbari.app', 'wrong').catch(e => {
      error = e;
    });
  });
  expect((error as Error).message).toBe('Invalid email or password');
  expect(session.status).toBe('signedOut');
  expect(await getToken()).toBeNull();
});

test('sign-up sends the name and signs in', async () => {
  backend();
  await mount();
  await ReactTestRenderer.act(async () => {
    await session.signUp('new@example.com', 'password123', 'Wanjiru');
  });
  expect(session.status).toBe('signedIn');
  expect(JSON.parse(calls()[0][1].body ?? '{}')).toEqual({
    email: 'new@example.com',
    password: 'password123',
    name: 'Wanjiru',
  });
});

test('signing out tells the server, drops the token and returns to the landing', async () => {
  backend();
  await mount();
  await ReactTestRenderer.act(async () => {
    await session.signIn('relay@demo.mbari.app', 'MbariDemo2026');
  });
  await ReactTestRenderer.act(async () => {
    await session.signOut();
  });
  expect(session.status).toBe('signedOut');
  expect(await getToken()).toBeNull();
  expect(calls().some(([url]) => url.endsWith('/api/auth/sign-out'))).toBe(true);
});
