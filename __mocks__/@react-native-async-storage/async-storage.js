/**
 * In-memory AsyncStorage for tests. The real package is a native module and
 * ships ESM that Jest's transform does not cover. Mocks in `__mocks__` for
 * node_modules are picked up automatically — no jest.mock() call needed.
 */
let store = {};

module.exports = {
  __esModule: true,
  default: {
    getItem: jest.fn(key => Promise.resolve(key in store ? store[key] : null)),
    setItem: jest.fn((key, value) => {
      store[key] = value;
      return Promise.resolve();
    }),
    removeItem: jest.fn(key => {
      delete store[key];
      return Promise.resolve();
    }),
    getAllKeys: jest.fn(() => Promise.resolve(Object.keys(store))),
    getMany: jest.fn(keys =>
      Promise.resolve(Object.fromEntries(keys.map(key => [key, key in store ? store[key] : null]))),
    ),
    setMany: jest.fn(entries => {
      Object.assign(store, entries);
      return Promise.resolve();
    }),
    removeMany: jest.fn(keys => {
      keys.forEach(key => delete store[key]);
      return Promise.resolve();
    }),
    clear: jest.fn(() => {
      store = {};
      return Promise.resolve();
    }),
  },
  /** Test helper: wipe the in-memory store between cases. */
  __reset: () => {
    store = {};
  },
};
