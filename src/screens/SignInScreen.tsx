import * as React from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  TextInput,
  View,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {Eye, EyeOff, Info, KeyRound} from 'lucide-react-native';

import * as api from '@/api';
import type {DemoAccount} from '@/api';
import {Mark} from '@/components/brand/Mark';
import {Text} from '@/components/ui/text';
import {useAppearance} from '@/lib/appearance';
import {useSession} from '@/lib/session';
import {THEME} from '@/lib/theme';
import {cn} from '@/lib/utils';

type Mode = 'signIn' | 'signUp';

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/** What to tell the person when the server says no. */
function message(error: unknown): string {
  if (error instanceof api.ApiError) {
    if (error.status === 429) {
      return 'Too many attempts. Wait a few minutes and try again.';
    }
    // Status 0 carries "Can't reach Mbari." or the timeout text.
    return error.message;
  }
  return error instanceof Error ? error.message : 'Something went wrong.';
}

function Field({label, ...props}: React.ComponentProps<typeof TextInput> & {label: string}) {
  const {resolved} = useAppearance();
  return (
    <View className="gap-1.5">
      <Text className="text-[14px] font-medium">{label}</Text>
      <TextInput
        placeholderTextColor={THEME[resolved].mutedForeground}
        className="h-12 rounded-xl border border-border bg-background px-4 text-[16px] text-foreground"
        {...props}
      />
    </View>
  );
}

/** The landing: what Mbarĩ does, then email and password. */
export function SignInScreen() {
  const session = useSession();
  const {resolved} = useAppearance();
  const colors = THEME[resolved];

  const [mode, setMode] = React.useState<Mode>('signIn');
  const [name, setName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [shown, setShown] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);
  const [demo, setDemo] = React.useState<DemoAccount | null>(null);

  React.useEffect(() => {
    api
      .getDemo()
      .then(info => setDemo(info.enabled ? info.accounts.find(a => a.app === 'mobile') ?? null : null))
      .catch(() => setDemo(null));
  }, []);

  const signingUp = mode === 'signUp';

  const submit = async (creds?: {email: string; password: string}) => {
    if (busy) {
      return;
    }
    const e = (creds?.email ?? email).trim().toLowerCase();
    const p = creds?.password ?? password;
    const creating = !creds && signingUp;

    if (creating && name.trim().length < 2) {
      setError('Enter your name.');
      return;
    }
    if (!EMAIL.test(e)) {
      setError('Enter a valid email address.');
      return;
    }
    if (p.length < (creating ? 8 : 1)) {
      setError(creating ? 'Use at least 8 characters for your password.' : 'Enter your password.');
      return;
    }

    setBusy(true);
    setError(null);
    try {
      if (creating) {
        await session.signUp(e, p, name.trim());
      } else {
        await session.signIn(e, p);
      }
    } catch (err) {
      setError(message(err));
    } finally {
      setBusy(false);
    }
  };

  const useDemo = () => {
    if (!demo) {
      return;
    }
    setMode('signIn');
    setEmail(demo.email);
    setPassword(demo.password);
    submit({email: demo.email, password: demo.password});
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      {/* Signed out, AppShell isn't mounted to set this. */}
      <StatusBar barStyle={resolved === 'dark' ? 'light-content' : 'dark-content'} />

      <KeyboardAvoidingView className="flex-1" behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerClassName="grow justify-center px-7 py-8">
          <Mark width={48} />
          <Text className="mt-8 font-serif text-[30px] font-medium leading-[36px] tracking-tight">
            News your family can trust, in your own language.
          </Text>
          <Text className="mt-3 text-[16px] leading-[24px] text-muted-foreground">
            Mbarĩ watches county and government sites for you. You choose what matters, and pass it on by voice.
          </Text>

          {demo ? (
            <View className="mt-7 rounded-2xl border border-dashed border-border bg-secondary/60 p-4">
              <View className="flex-row items-center gap-2">
                <KeyRound size={16} color={colors.mutedForeground} strokeWidth={2.25} />
                <Text className="text-[15px] font-semibold">Judging? Use the demo account</Text>
              </View>
              <Text className="mt-1 text-[13px] text-muted-foreground">{demo.label}. No sign-up needed.</Text>
              <View className="mt-3 gap-1">
                <Text selectable className="text-[14px]">
                  <Text className="text-[14px] text-muted-foreground">Email </Text>
                  {demo.email}
                </Text>
                <Text selectable className="text-[14px]">
                  <Text className="text-[14px] text-muted-foreground">Password </Text>
                  {demo.password}
                </Text>
              </View>
              <Pressable
                accessibilityRole="button"
                disabled={busy}
                onPress={useDemo}
                className={cn(
                  'mt-3.5 h-11 items-center justify-center rounded-full border-[1.5px] border-foreground active:opacity-70',
                  busy && 'opacity-60',
                )}>
                <Text className="text-[15px] font-semibold">Sign in as the demo relay member</Text>
              </Pressable>
            </View>
          ) : null}

          <View className="mt-7 gap-4">
            {signingUp ? (
              <Field
                label="Your name"
                value={name}
                onChangeText={setName}
                placeholder="Kamau Njoroge"
                autoComplete="name"
                textContentType="name"
                returnKeyType="next"
              />
            ) : null}
            <Field
              label="Email"
              value={email}
              onChangeText={setEmail}
              placeholder="you@example.com"
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="email"
              keyboardType="email-address"
              textContentType="username"
              returnKeyType="next"
            />
            <View className="gap-1.5">
              <Text className="text-[14px] font-medium">Password</Text>
              <View className="justify-center">
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!shown}
                  autoCapitalize="none"
                  autoCorrect={false}
                  autoComplete={signingUp ? 'new-password' : 'current-password'}
                  textContentType={signingUp ? 'newPassword' : 'password'}
                  returnKeyType="go"
                  onSubmitEditing={() => submit()}
                  placeholder={signingUp ? 'At least 8 characters' : undefined}
                  placeholderTextColor={colors.mutedForeground}
                  className="h-12 rounded-xl border border-border bg-background pl-4 pr-12 text-[16px] text-foreground"
                />
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={shown ? 'Hide password' : 'Show password'}
                  onPress={() => setShown(v => !v)}
                  hitSlop={8}
                  className="absolute right-3">
                  {shown ? (
                    <EyeOff size={20} color={colors.mutedForeground} />
                  ) : (
                    <Eye size={20} color={colors.mutedForeground} />
                  )}
                </Pressable>
              </View>
            </View>

            {error ? (
              <Text accessibilityLiveRegion="polite" className="text-[15px] text-destructive">
                {error}
              </Text>
            ) : null}

            <Pressable
              accessibilityRole="button"
              accessibilityState={{busy, disabled: busy}}
              disabled={busy}
              onPress={() => submit()}
              className={cn(
                'mt-1 h-14 items-center justify-center rounded-full bg-foreground active:opacity-85',
                busy && 'opacity-70',
              )}>
              {busy ? (
                <ActivityIndicator color={colors.background} />
              ) : (
                <Text className="text-[17px] font-semibold text-background">
                  {signingUp ? 'Create account' : 'Sign in'}
                </Text>
              )}
            </Pressable>

            <Pressable
              accessibilityRole="button"
              disabled={busy}
              onPress={() => {
                setMode(signingUp ? 'signIn' : 'signUp');
                setError(null);
              }}
              className="items-center py-2">
              <Text className="text-[15px] text-muted-foreground">
                {signingUp ? 'Already have an account? ' : 'New to Mbarĩ? '}
                <Text className="text-[15px] font-semibold underline">
                  {signingUp ? 'Sign in' : 'Create an account'}
                </Text>
              </Text>
            </Pressable>
          </View>

          <View className="mt-4 flex-row items-start gap-2 px-1">
            <Info size={16} color={colors.mutedForeground} strokeWidth={2} />
            <Text className="flex-1 text-[13px] leading-[18px] text-muted-foreground">
              Nothing is ever sent to anyone without a person approving it.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
