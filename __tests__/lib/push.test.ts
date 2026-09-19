/** @format */
import {PermissionsAndroid, Platform} from 'react-native';

import {setToken} from '@/api/client';
import {parseRecommendation, pushAvailable, readPermission, registerForPush, requestPermission, unregisterFromPush} from '@/lib/push';

const storage = require('@react-native-async-storage/async-storage');
const firebaseApp = require('@react-native-firebase/app');
const messaging = require('@react-native-firebase/messaging');

const ok = (data: unknown) =>
  (global.fetch as jest.Mock).mockResolvedValueOnce({ok: true, status: 200, text: () => Promise.resolve(JSON.stringify({success: true, data}))});

beforeEach(async () => {
  jest.clearAllMocks();
  storage.__reset();
  await setToken('tok');
  firebaseApp.getApps.mockReturnValue([]);
  // The Jest preset reports iOS; this app ships on Android only.
  Object.defineProperty(Platform, 'OS', {value: 'android', configurable: true});
  Object.defineProperty(Platform, 'Version', {value: 34, configurable: true});
});

describe('reading pushes', () => {
  it('accepts only our recommendation messages', () => {
    const push = parseRecommendation({
      data: {type: 'recommendation', itemId: 'item_1', deliveryId: 'del_1'},
      notification: {title: 'The Aggregator’s Dilemma', body: 'Stratechery · 14 min read'},
    } as never);
    expect(push).toEqual({itemId: 'item_1', deliveryId: 'del_1', title: 'The Aggregator’s Dilemma', body: 'Stratechery · 14 min read'});
    expect(parseRecommendation({data: {type: 'marketing'}} as never)).toBeNull();
    expect(parseRecommendation({data: {type: 'recommendation'}} as never)).toBeNull();
    expect(parseRecommendation(null)).toBeNull();
  });
});

describe('without a Firebase config', () => {
  it('reports push as unavailable and registers nothing', async () => {
    expect(pushAvailable()).toBe(false);
    await registerForPush();
    expect(messaging.getToken).not.toHaveBeenCalled();
  });
});

describe('permission', () => {
  it('needs no runtime permission before Android 13', async () => {
    Object.defineProperty(Platform, 'Version', {value: 32, configurable: true});
    expect(await readPermission()).toBe('granted');
  });

  it('tells a first ask from a refusal Android will not show again', async () => {
    jest.spyOn(PermissionsAndroid, 'check').mockResolvedValue(false);
    expect(await readPermission()).toBe('undetermined');

    jest.spyOn(PermissionsAndroid, 'request').mockResolvedValueOnce(PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN);
    expect(await requestPermission()).toBe('blocked');
    expect(await readPermission()).toBe('blocked');
  });
});

describe('with a Firebase config', () => {
  beforeEach(() => firebaseApp.getApps.mockReturnValue([{name: '[DEFAULT]'}]));

  it('registers the token, and lets it go on sign-out', async () => {
    ok({registered: true});
    await registerForPush();
    const [url, init] = (global.fetch as jest.Mock).mock.calls[0];
    expect(String(url)).toMatch(/\/api\/v1\/devices$/);
    expect(JSON.parse(init.body)).toMatchObject({token: 'test-fcm-token', platform: 'android'});

    ok({registered: false});
    await unregisterFromPush();
    expect(String((global.fetch as jest.Mock).mock.calls[1][0])).toMatch(/\/api\/v1\/devices\/test-fcm-token$/);
    expect(messaging.deleteToken).toHaveBeenCalled();
  });
});
