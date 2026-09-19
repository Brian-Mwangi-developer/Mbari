module.exports = {
  preset: '@react-native/jest-preset',
  moduleNameMapper: {
    '\\.css$': '<rootDir>/__mocks__/styleMock.js',
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  // lucide-react-native ships .mjs, which the preset's transform doesn't match.
  transform: {
    '^.+\\.(js|jsx|ts|tsx|mjs)$': 'babel-jest',
  },
  setupFiles: ['<rootDir>/jest.setup.js'],
  transformIgnorePatterns: [
    'node_modules/(?!(@react-native|react-native|react-native-css-interop|nativewind|@rn-primitives|react-native-reanimated|react-native-worklets|react-native-safe-area-context|react-native-svg|lucide-react-native|react-native-gesture-handler)/)',
  ],
};
