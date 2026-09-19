import * as React from 'react';
import {
  ActivityIndicator,
  BackHandler,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StatusBar,
  StyleSheet,
  View,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';

import {ApiError} from '@/api';
import {GoogleButton} from '@/components/auth/GoogleButton';
import {Mark} from '@/components/brand/Mark';
import {Icon} from '@/components/icons/Icon';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Text} from '@/components/ui/text';
import {useAppearance} from '@/lib/appearance';
import {GoogleSignInError} from '@/lib/google-sign-in';
import {useLaunch} from '@/lib/launch';
import {useSession} from '@/lib/session';

type Mode = 'signIn' | 'signUp';

/** What to tell the user when Google sign-in doesn't complete; null says nothing. */
function googleErrorMessage(error: unknown): string | null {
  if (error instanceof GoogleSignInError) {
    switch (error.code) {
      case 'cancelled':
        return null;
      case 'no_credential':
        return 'No Google account on this phone. Add one in Settings, or continue with email.';
      case 'not_configured':
        return "Google sign-in isn't set up for this build yet.";
      default:
        return "Google sign-in didn't work. Try again, or continue with email.";
    }
  }
  // Better Auth won't attach Google to an existing email account whose address
  // was never verified.
  if (error instanceof ApiError && error.message === 'account not linked') {
    return 'This email already has an account. Continue with email to sign in.';
  }
  return error instanceof Error ? error.message : 'Something went wrong.';
}

export function SignInScreen() {
  const session = useSession();
  const {resolved} = useAppearance();
  const [withEmail, setWithEmail] = React.useState(false);
  const [mode, setMode] = React.useState<Mode>('signUp');
  const [name, setName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [error, setError] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState<'email' | 'google' | null>(null);

  // Android back from the email form returns to the sign-in choices rather
  // than leaving the app.
  React.useEffect(() => {
    if (!withEmail) {
      return;
    }
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      setWithEmail(false);
      setError(null);
      return true;
    });
    return () => sub.remove();
  }, [withEmail]);

  const isSignUp = mode === 'signUp';
  const canSubmit =
    email.trim().length > 3 && password.length >= 8 && (!isSignUp || name.trim().length > 0);

  const submit = async () => {
    if (!canSubmit || busy) {
      return;
    }
    setBusy('email');
    setError(null);
    try {
      if (isSignUp) {
        await session.signUp(email.trim(), password, name.trim());
      } else {
        await session.signIn(email.trim(), password);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong.');
    } finally {
      setBusy(null);
    }
  };

  const continueWithGoogle = async () => {
    if (busy) {
      return;
    }
    setBusy('google');
    setError(null);
    try {
      await session.signInWithGoogle();
    } catch (e) {
      setError(googleErrorMessage(e));
    } finally {
      setBusy(null);
    }
  };

  const statusBar = <StatusBar barStyle={resolved === 'dark' ? 'light-content' : 'dark-content'} />;

  if (!withEmail) {
    return (
      <SafeAreaView className="flex-1 bg-background">
        {/* Signed out, AppShell isn't mounted to set this. */}
        {statusBar}
        <View className="flex-1 px-6 pt-10">
          <HeroMark />
          <Text className="mt-8 text-[34px] font-bold leading-[38px] tracking-tight">
            News your family can trust, in your own language.
          </Text>
          <Text className="mt-4 text-[17px] leading-[26px] text-muted-foreground">
            Mbarĩ watches county and government sites for you. You choose what matters, and pass it on by voice.
          </Text>
        </View>

        <View className="gap-3 px-6 pb-4">
          <GoogleButton onPress={continueWithGoogle} busy={busy === 'google'} disabled={busy !== null} />
          <Button
            variant="outline"
            size="lg"
            className="h-14 rounded-lg border-foreground"
            disabled={busy !== null}
            onPress={() => {
              setWithEmail(true);
              setError(null);
            }}>
            <Icon name="mail" size={20} />
            <Text className="text-[17px] font-medium">Continue with Email</Text>
          </Button>
          {error ? <Text className="text-center text-[15px] text-destructive">{error}</Text> : null}
          <View className="flex-row items-start gap-2 px-1 pt-1">
            <Icon name="info" size={16} color="#56655C" />
            <Text className="flex-1 text-[13px] leading-[18px] text-muted-foreground">
              Nothing is ever sent to anyone without a person approving it.
            </Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <KeyboardAvoidingView
      className="flex-1 bg-background"
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      {statusBar}
      <SafeAreaView className="flex-1">
        <ScrollView
          contentContainerClassName="flex-grow justify-center px-6 pb-16"
          keyboardShouldPersistTaps="handled">
          <Mark width={40} />
          <Text className="mt-8 font-serif text-[40px] font-bold leading-[46px] tracking-tight">
            {isSignUp ? 'Create your account' : 'Welcome back'}
          </Text>
          <Text className="mt-3 font-serif text-[20px] leading-[30px] text-foreground/75">
            {isSignUp ? 'Then choose what your community should hear about.' : 'Sign in to see what is new for your community.'}
          </Text>

          <View className="mt-10 gap-3">
            {isSignUp && (
              <Input
                placeholder="Name"
                value={name}
                onChangeText={setName}
                autoCapitalize="words"
                autoComplete="name"
                className="h-14 rounded-lg border-foreground/40 text-[17px]"
              />
            )}
            <Input
              placeholder="Email"
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="email-address"
              autoComplete="email"
              className="h-14 rounded-lg border-foreground/40 text-[17px]"
            />
            <Input
              placeholder="Password"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoCapitalize="none"
              className="h-14 rounded-lg border-foreground/40 text-[17px]"
            />
            {isSignUp && password.length > 0 && password.length < 8 && (
              <Text className="text-[14px] text-muted-foreground">At least 8 characters.</Text>
            )}
          </View>

          {error && <Text className="mt-4 text-[15px] text-destructive">{error}</Text>}

          <View className="mt-8 gap-1">
            <Button size="lg" className="h-14 rounded-lg" disabled={!canSubmit || busy !== null} onPress={submit}>
              {busy === 'email' ? (
                <ActivityIndicator />
              ) : (
                <Text className="text-xl font-semibold">{isSignUp ? 'Create account' : 'Sign in'}</Text>
              )}
            </Button>
            <Button
              variant="ghost"
              size="lg"
              className="h-14 rounded-lg"
              onPress={() => {
                setMode(isSignUp ? 'signIn' : 'signUp');
                setError(null);
              }}>
              <Text className="text-lg font-medium text-foreground/80">
                {isSignUp ? 'I already have an account' : 'Create an account instead'}
              </Text>
            </Button>
            <Button
              variant="ghost"
              size="lg"
              className="h-12 rounded-lg"
              onPress={() => {
                setWithEmail(false);
                setError(null);
              }}>
              <Text className="text-[16px] font-medium text-muted-foreground">Other ways to continue</Text>
            </Button>
          </View>
        </ScrollView>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

/**
 * The mark at the top of the landing. While the launch screen is up it stays
 * hidden and reports where it sits, so the launch screen's copy can fly onto
 * exactly this spot.
 */
function HeroMark() {
  const {launching, setHero} = useLaunch();
  const ref = React.useRef<React.ComponentRef<typeof View>>(null);

  React.useEffect(() => () => setHero(null), [setHero]);

  const measure = () => {
    ref.current?.measureInWindow((x, y, width, height) => {
      if (width > 0) {
        setHero({x, y, width, height});
      }
    });
  };

  return (
    <View ref={ref} onLayout={measure} collapsable={false} style={launching ? styles.hidden : undefined}>
      <Mark width={76} />
    </View>
  );
}

const styles = StyleSheet.create({hidden: {opacity: 0}});
