/** @format */
import {setToken} from '@/api/client';
import {flush, onSignal, pendingCount, signal, startSignals, stopSignals, track} from '@/lib/signals';

const storage = require('@react-native-async-storage/async-storage');

const ok = (data: unknown = {state: 'served', liked: true, saved: false, duplicate: false}) =>
  (global.fetch as jest.Mock).mockResolvedValueOnce({
    ok: true,
    status: 200,
    text: () => Promise.resolve(JSON.stringify({success: true, data})),
  });
const offline = () => (global.fetch as jest.Mock).mockRejectedValueOnce(new TypeError('Network request failed'));
const bodyOf = (call: number) => JSON.parse((global.fetch as jest.Mock).mock.calls[call][1].body);

beforeEach(async () => {
  jest.useFakeTimers();
  jest.clearAllMocks();
  storage.__reset();
  stopSignals();
  await setToken('tok');
  (global.fetch as jest.Mock).mockReset();
});

afterEach(() => {
  stopSignals();
  jest.useRealTimers();
});

describe('signals', () => {
  it('sends straight away with a client id, and tells listeners', async () => {
    await startSignals('user_1');
    const heard: string[] = [];
    const off = onSignal(s => heard.push(`${s.type}:${s.itemId}`));

    ok();
    const result = await signal('item_1', {type: 'like'});

    expect(result?.liked).toBe(true);
    expect(String((global.fetch as jest.Mock).mock.calls[0][0])).toMatch(/\/api\/v1\/articles\/item_1\/signal$/);
    expect(bodyOf(0).clientEventId).toEqual(expect.any(String));
    expect(heard).toEqual(['like:item_1']);
    off();
  });

  it('keeps a signal made offline and sends it later with the same id', async () => {
    await startSignals('user_1');
    offline();
    expect(await signal('item_1', {type: 'pass', dwellMs: 4000})).toBeNull();
    expect(pendingCount()).toBe(1);
    const firstId = bodyOf(0).clientEventId;

    ok();
    await flush();
    expect(pendingCount()).toBe(0);
    expect(bodyOf(1).clientEventId).toBe(firstId);
  });

  it('survives an app restart', async () => {
    await startSignals('user_1');
    offline();
    await signal('item_1', {type: 'save'});
    stopSignals();

    ok();
    await startSignals('user_1');
    await flush();
    expect(bodyOf(1)).toMatchObject({type: 'save'});
  });

  it('drops a signal the server rejects instead of retrying forever', async () => {
    await startSignals('user_1');
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 404,
      text: () => Promise.resolve(JSON.stringify({success: false, message: 'Article not found'})),
    });
    await signal('gone', {type: 'like'});
    expect(pendingCount()).toBe(0);
  });

  it('batches telemetry', async () => {
    await startSignals('user_1');
    track({type: 'card_view', itemId: 'a', dwellMs: 3000});
    track({type: 'play_tapped', itemId: 'a'});
    ok({accepted: 2});
    await flush();
    expect(String((global.fetch as jest.Mock).mock.calls[0][0])).toMatch(/\/api\/v1\/events$/);
    expect(bodyOf(0).events.map((e: {type: string}) => e.type)).toEqual(['card_view', 'play_tapped']);
  });
});
