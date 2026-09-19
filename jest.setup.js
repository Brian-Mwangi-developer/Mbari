/* eslint-env jest */
import 'react-native-gesture-handler/jestSetup.js';

// Worklets is a native library; use the mock it ships for Jest.
jest.mock('react-native-worklets', () =>
  require('react-native-worklets/lib/module/mock'),
);

// AsyncStorage is mocked from __mocks__/@react-native-async-storage/.

// No test should reach the network. Individual tests override this as needed.
global.fetch = jest.fn(() =>
  Promise.resolve({
    ok: true,
    status: 200,
    text: () => Promise.resolve(JSON.stringify({success: true, data: null})),
  }),
);
