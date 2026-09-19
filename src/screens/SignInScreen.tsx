import * as React from 'react';
import {Pressable, StatusBar, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';

import {ApiError} from '@/api';
import {GoogleButton} from '@/components/auth/GoogleButton';
import {Mark} from '@/components/brand/Mark';
import {Icon} from '@/components/icons/Icon';
import {Text} from '@/components/ui/text';
import {useAppearance} from '@/lib/appearance';
import {GoogleSignInError} from '@/lib/google-sign-in';
import {useSession} from '@/lib/session';
import {THEME} from '@/lib/theme';
import {cn} from '@/lib/utils';

/** What to tell the user when Google sign-in doesn't complete; null says nothing. */
function googleErrorMessage(error: unknown): string | null {
  if (error instanceof GoogleSignInError) {
    switch (error.code) {
      case 'cancelled':
        return null;
      case 'no_credential':
        return 'No Google account on this phone. Add one in Settings, or use your phone number.';
      case 'not_configured':
        return "Google sign-in isn't set up for this build yet.";
      default:
        return "Google sign-in didn't work. Try again, or use your phone number.";
    }
  }
  if (error instanceof ApiError && error.message === 'account not linked') {
    return 'This account is already registered another way.';
  }
  return error instanceof Error ? error.message : 'Something went wrong.';
}

/** The landing: what Mbarĩ does, and two ways in. */
export function SignInScreen() {
  const session = useSession();
  const {resolved} = useAppearance();
  const colors = THEME[resolved];
  const [error, setError] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState<'google' | 'phone' | null>(null);

  const run = async (which: 'google' | 'phone', action: () => Promise<void>) => {
    if (busy) {
      return;
    }
    setBusy(which);
    setError(null);
    try {
      await action();
    } catch (e) {
      setError(which === 'google' ? googleErrorMessage(e) : e instanceof Error ? e.message : 'Something went wrong.');
    } finally {
      setBusy(null);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      {/* Signed out, AppShell isn't mounted to set this. */}
      <StatusBar barStyle={resolved === 'dark' ? 'light-content' : 'dark-content'} />

      <View className="flex-1 justify-center px-7 pb-6">
        <View className="items-center">
          <Mark width={68} />
        </View>
        <Text className="mt-12 text-[34px] font-bold leading-[39px] tracking-tight">
          News your family can trust, in your own language.
        </Text>
        <Text className="mt-5 text-[17px] leading-[26px] text-muted-foreground">
          Mbarĩ watches county and government sites for you. You choose what matters, and pass it on by voice.
        </Text>
      </View>

      <View className="gap-3 px-7 pb-5">
        <GoogleButton
          onPress={() => run('google', session.signInWithGoogle)}
          busy={busy === 'google'}
          disabled={busy !== null}
        />
        <Pressable
          accessibilityRole="button"
          disabled={busy !== null}
          // Phone sign-in arrives with the backend; until then this goes straight in.
          onPress={() => run('phone', () => session.signIn('', ''))}
          className={cn(
            'h-14 flex-row items-center justify-center gap-3 rounded-xl border-[1.5px] border-foreground active:opacity-70',
            busy !== null && 'opacity-70',
          )}>
          <Icon name="phone" size={20} strokeWidth={2.1} />
          <Text className="text-[17px] font-semibold">Use my phone number</Text>
        </Pressable>
        {error ? <Text className="text-center text-[15px] text-destructive">{error}</Text> : null}
        <View className="flex-row items-start gap-2 px-1 pt-2">
          <Icon name="info" size={16} color={colors.mutedForeground} />
          <Text className="flex-1 text-[13px] leading-[18px] text-muted-foreground">
            Nothing is ever sent to anyone without a person approving it.
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}
