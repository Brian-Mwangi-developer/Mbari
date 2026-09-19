/** @format */
import * as api from '@/api';
import {setToken} from '@/api/client';
import {getGoogleIdToken, GoogleSignInError} from '@/lib/google-sign-in';

describe('Google sign-in', () => {
  it('reports not_configured where the native module is unavailable', async () => {
    // Jest has no Android Credential Manager, like any platform without the module.
    await expect(getGoogleIdToken('web-client-id')).rejects.toMatchObject({
      name: 'GoogleSignInError',
      code: 'not_configured',
    });
  });

  it('is a typed error the sign-in screen can branch on', async () => {
    const error = await getGoogleIdToken('').catch((e: unknown) => e);
    expect(error).toBeInstanceOf(GoogleSignInError);
  });

  it('exchanges the ID token and nonce for a stored session', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      status: 200,
      text: () => Promise.resolve(JSON.stringify({redirect: false, token: 'session-token', user: {id: 'u1'}})),
    });
    await setToken(null);

    await api.signInWithGoogle('google-id-token', 'nonce-1');

    const [url, init] = (global.fetch as jest.Mock).mock.calls.at(-1);
    expect(String(url)).toMatch(/\/api\/auth\/sign-in\/social$/);
    expect(JSON.parse(init.body)).toEqual({
      provider: 'google',
      idToken: {token: 'google-id-token', nonce: 'nonce-1'},
    });
    // Anonymous: no stale bearer token is sent with a sign-in.
    expect(init.headers.Authorization).toBeUndefined();
    expect(await api.getToken()).toBe('session-token');
  });
});
