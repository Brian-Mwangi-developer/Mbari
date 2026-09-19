import AsyncStorage from '@react-native-async-storage/async-storage';

import {migrateLegacyKeys} from '@/lib/storage-migration';

beforeEach(() => {
  (require('@react-native-async-storage/async-storage') as {__reset: () => void}).__reset();
  jest.clearAllMocks();
});

test('moves every mbari.* key under mbari.* and removes the old ones', async () => {
  await AsyncStorage.setItem('mbari.session.token', 'tok');
  await AsyncStorage.setItem('mbari.offline.v1.user-1', '{"items":[]}');
  await AsyncStorage.setItem('other.key', 'kept');

  await migrateLegacyKeys();

  expect(await AsyncStorage.getItem('mbari.session.token')).toBe('tok');
  expect(await AsyncStorage.getItem('mbari.offline.v1.user-1')).toBe('{"items":[]}');
  expect(await AsyncStorage.getItem('mbari.session.token')).toBeNull();
  expect(await AsyncStorage.getItem('other.key')).toBe('kept');
});

test('keeps a value already written under the new name', async () => {
  await AsyncStorage.setItem('mbari.session.token', 'old');
  await AsyncStorage.setItem('mbari.session.token', 'new');

  await migrateLegacyKeys();

  expect(await AsyncStorage.getItem('mbari.session.token')).toBe('new');
  expect(await AsyncStorage.getItem('mbari.session.token')).toBeNull();
});

test('does nothing when there is nothing to move', async () => {
  await migrateLegacyKeys();
  expect(AsyncStorage.setMany).not.toHaveBeenCalled();
});
