/** @format */
import AsyncStorage from '@react-native-async-storage/async-storage';

import {ApiError, apiFetch, setToken} from '@/api/client';

const mockFetch = (body: unknown, status = 200) => {
  (global.fetch as jest.Mock).mockResolvedValueOnce({
    ok: status >= 200 && status < 300,
    status,
    text: () => Promise.resolve(JSON.stringify(body)),
  });
};

const lastCall = () => (global.fetch as jest.Mock).mock.calls.at(-1);

beforeEach(async () => {
  jest.clearAllMocks();
  await setToken(null);
});

describe('apiFetch', () => {
  it('unwraps the { success, data } envelope the API routes use', async () => {
    mockFetch({success: true, data: {id: 'abc'}});
    await expect(apiFetch('/api/v1/me')).resolves.toEqual({id: 'abc'});
  });

  it('returns the raw body for better-auth responses, which are unwrapped', async () => {
    mockFetch({token: 'tok_1', user: {id: 'u1'}});
    await expect(apiFetch('/api/auth/sign-in/email')).resolves.toEqual({
      token: 'tok_1',
      user: {id: 'u1'},
    });
  });

  it('attaches the bearer token once one is stored', async () => {
    await setToken('tok_abc');
    mockFetch({success: true, data: null});
    await apiFetch('/api/v1/me');

    const [, init] = lastCall();
    expect(init.headers.Authorization).toBe('Bearer tok_abc');
  });

  it('omits the token on anonymous calls', async () => {
    await setToken('tok_abc');
    mockFetch({token: 'x'});
    await apiFetch('/api/auth/sign-in/email', {anonymous: true, method: 'POST', body: {}});

    const [, init] = lastCall();
    expect(init.headers.Authorization).toBeUndefined();
  });

  it("surfaces the server's message on an error response", async () => {
    mockFetch({success: false, message: 'Unauthorized'}, 401);
    await expect(apiFetch('/api/v1/me')).rejects.toMatchObject({
      status: 401,
      message: 'Unauthorized',
    });
  });

  it('reports an unreachable server rather than throwing a raw network error', async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(new TypeError('Network request failed'));

    const error = await apiFetch('/api/v1/me').catch((e: unknown) => e);

    expect(error).toBeInstanceOf(ApiError);
    expect((error as ApiError).message).toMatch(/reach/i);
    // status 0 distinguishes "no response" from a real HTTP failure.
    expect((error as ApiError).status).toBe(0);
  });
});

describe('token storage', () => {
  it('persists the token so a restart stays signed in', async () => {
    await setToken('tok_persist');
    expect(AsyncStorage.setItem).toHaveBeenCalledWith('mbari.session.token', 'tok_persist');
  });

  it('clears the token on sign out', async () => {
    await setToken('tok_persist');
    await setToken(null);
    expect(AsyncStorage.removeItem).toHaveBeenCalledWith('mbari.session.token');
  });
});
