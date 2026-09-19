import * as React from 'react';
import {ActivityIndicator, Pressable, StyleSheet, Text, View} from 'react-native';
import Svg, {Path} from 'react-native-svg';

import {useAppearance} from '@/lib/appearance';

/**
 * "Continue with Google", per Google's sign-in branding guidelines: the
 * standard four-colour G, never recoloured or resized relative to the text,
 * on Google's light or dark button colours.
 * https://developers.google.com/identity/branding-guidelines
 */
const COLORS = {
  light: {fill: '#FFFFFF', stroke: '#747775', text: '#1F1F1F'},
  dark: {fill: '#131314', stroke: '#8E918F', text: '#E3E3E3'},
} as const;

export function GoogleLogo({size = 20}: {size?: number}) {
  return (
    <Svg width={size} height={size} viewBox="0 0 48 48">
      <Path
        fill="#EA4335"
        d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
      />
      <Path
        fill="#4285F4"
        d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
      />
      <Path
        fill="#FBBC05"
        d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
      />
      <Path
        fill="#34A853"
        d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
      />
    </Svg>
  );
}

type Props = {
  onPress: () => void;
  busy?: boolean;
  disabled?: boolean;
};

export function GoogleButton({onPress, busy = false, disabled = false}: Props) {
  const {resolved} = useAppearance();
  const colors = COLORS[resolved];
  // NativeWind's Pressable drops function-valued `style`, so track pressed here.
  const [pressed, setPressed] = React.useState(false);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel="Continue with Google"
      accessibilityState={{busy, disabled: disabled || busy}}
      disabled={disabled || busy}
      onPress={onPress}
      onPressIn={() => setPressed(true)}
      onPressOut={() => setPressed(false)}
      style={[
        styles.button,
        {backgroundColor: colors.fill, borderColor: colors.stroke},
        (pressed || disabled) && styles.dimmed,
      ]}>
      {busy ? (
        <ActivityIndicator color={colors.text} />
      ) : (
        <View style={styles.content}>
          <GoogleLogo />
          <Text style={[styles.label, {color: colors.text}]}>Continue with Google</Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    height: 56,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  content: {flexDirection: 'row', alignItems: 'center', gap: 10},
  // Google Sans is not available to apps; Android's system sans at medium weight is the closest.
  label: {fontFamily: 'sans-serif-medium', fontSize: 17, letterSpacing: 0.1},
  dimmed: {opacity: 0.7},
});
