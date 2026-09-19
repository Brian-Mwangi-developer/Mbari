/**
 * Minimal Reanimated stand-in for Jest. Reanimated 4's own mock re-imports
 * its native initialiser, which throws without the native module, so this
 * covers just the surface the app uses with plain RN components and no-op
 * animations.
 */
const React = require('react');
const RN = require('react-native');

const identity = value => value;
const sharedValue = initial => ({value: initial});

const Animated = {
  View: RN.View,
  Text: RN.Text,
  ScrollView: RN.ScrollView,
  createAnimatedComponent: Component => Component,
};

module.exports = {
  __esModule: true,
  default: Animated,
  Easing: {in: identity, out: identity, inOut: identity, cubic: identity, quad: identity},
  FadeIn: {duration: () => ({})},
  FadeInUp: {duration: () => ({})},
  FadeOutUp: {duration: () => ({})},
  FadeOut: {duration: () => ({})},
  Extrapolation: {CLAMP: 'clamp', EXTEND: 'extend', IDENTITY: 'identity'},
  interpolate: value => value,
  scrollTo: () => {},
  useAnimatedRef: () => React.useRef(null),
  useAnimatedScrollHandler: () => () => {},
  useAnimatedProps: () => ({}),
  useAnimatedStyle: () => ({}),
  useReducedMotion: () => false,
  useDerivedValue: fn => sharedValue(fn()),
  useSharedValue: sharedValue,
  withSpring: identity,
  withTiming: identity,
  setUpTests: () => {},
};
