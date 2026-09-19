/** @format */
import type {Article} from '@/api';
import {
  clearShelf,
  offlineKey,
  pruneShelf,
  readRetention,
  readShelf,
  writeRetention,
  writeShelf,
} from '@/lib/offline-store';

const storage = require('@react-native-async-storage/async-storage');

const article = (id: string): Article => ({
  id,
  source: 'The Mwango Weekly',
  author: null,
  title: `Title ${id}`,
  readMinutes: 5,
  url: 'https://example.com',
  body: [[{text: 'Body'}]],
});

beforeEach(() => storage.__reset());

describe('offline shelf', () => {
  it('keeps each account on its own shelf', async () => {
    await writeShelf('user_1', {a: {article: article('a'), savedAt: '2026-09-14T10:00:00Z'}});

    expect(Object.keys(await readShelf('user_1'))).toEqual(['a']);
    expect(await readShelf('user_2')).toEqual({});
    expect(offlineKey('user_1')).not.toBe(offlineKey('user_2'));
  });

  it("clears only the signed-out account's shelf", async () => {
    await writeShelf('user_1', {a: {article: article('a'), savedAt: '2026-09-14T10:00:00Z'}});
    await writeShelf('user_2', {b: {article: article('b'), savedAt: '2026-09-14T10:00:00Z'}});

    await clearShelf('user_1');

    expect(await readShelf('user_1')).toEqual({});
    expect(Object.keys(await readShelf('user_2'))).toEqual(['b']);
  });

  it('treats unreadable storage as an empty shelf', async () => {
    await storage.default.setItem(offlineKey('user_1'), '{not json');
    expect(await readShelf('user_1')).toEqual({});
  });
});

describe('offline retention', () => {
  const NOW = new Date('2026-09-15T12:00:00Z');
  const shelf = {
    fresh: {article: article('fresh'), savedAt: '2026-09-13T12:00:00Z'},
    week: {article: article('week'), savedAt: '2026-09-07T12:00:00Z'},
    month: {article: article('month'), savedAt: '2026-08-10T12:00:00Z'},
  };

  it('removes articles saved longer ago than the retention', () => {
    expect(Object.keys(pruneShelf(shelf, 7, NOW))).toEqual(['fresh']);
    expect(Object.keys(pruneShelf(shelf, 30, NOW))).toEqual(['fresh', 'week']);
  });

  it('keeps everything when set to forever', () => {
    expect(pruneShelf(shelf, null, NOW)).toBe(shelf);
  });

  it("keeps an article whose save date can't be read rather than deleting it", () => {
    const odd = {x: {article: article('x'), savedAt: 'not a date'}};
    expect(Object.keys(pruneShelf(odd, 7, NOW))).toEqual(['x']);
  });

  it('defaults to 30 days and remembers a choice, including forever', async () => {
    expect(await readRetention()).toBe(30);
    await writeRetention(7);
    expect(await readRetention()).toBe(7);
    await writeRetention(null);
    expect(await readRetention()).toBeNull();
  });

  it('falls back to 30 days for a stored value it does not offer', async () => {
    await storage.default.setItem('mbari.offline.retention.v1', '90');
    expect(await readRetention()).toBe(30);
  });
});
