import * as React from 'react';
import {
  AccessibilityInfo,
  ActivityIndicator,
  BackHandler,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StatusBar,
  StyleSheet,
  View,
  useWindowDimensions,
} from 'react-native';
import {Gesture, GestureDetector} from 'react-native-gesture-handler';
import Animated, {
  Easing,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import {SafeAreaView} from 'react-native-safe-area-context';

import {ApiError} from '@/api';
import {GoogleButton} from '@/components/auth/GoogleButton';
import {AnimatedMark, Mark} from '@/components/brand/Mark';
import {Wordmark} from '@/components/brand/Wordmark';
import {Icon} from '@/components/icons/Icon';
import {Button} from '@/components/ui/button';
import {Input} from '@/components/ui/input';
import {Text} from '@/components/ui/text';
import {useAppearance} from '@/lib/appearance';
import {GoogleSignInError} from '@/lib/google-sign-in';
import {useLaunch} from '@/lib/launch';
import {useSession} from '@/lib/session';
import {cn} from '@/lib/utils';

type Mode = 'signIn' | 'signUp';

/**
 * What Mbarĩ does, in three lines. The mark builds itself up alongside, but
 * nothing here explains the mark: people need to know what the app is for.
 */
const STORY = [
  {
    part: 'Watch',
    title: 'We watch the sites for you.',
    body: 'Mbarĩ keeps an eye on county and government websites, and tells you as soon as something changes.',
  },
  {
    part: 'In your language',
    title: 'Said the way your family says it.',
    body: 'Each notice becomes a short summary with its source, and a voice message in Gĩkũyũ.',
  },
  {
    part: 'You decide',
    title: 'Nothing goes out until you approve.',
    body: 'Then Mbarĩ phones the people you choose, and they can answer back by voice.',
  },
] as const;

const LAST = STORY.length - 1;
/** How long each part of the story holds before the next, when it plays itself. */
const HOLD_MS = [2_000, 3_000];


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
        <View className="items-center pt-5">
          <Wordmark size={20} />
        </View>

        <Story />

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
 * The landing's centre: the mark builds itself up while three short lines say
 * what the app does. It plays once on its own; a tap on the steps or a
 * swipe takes over. With a screen reader on it waits to be stepped through.
 */
function Story() {
  const {launching, setHero} = useLaunch();
  const reduceMotion = useReducedMotion();
  const {width: screenWidth} = useWindowDimensions();
  const heroWidth = Math.round(Math.min(120, Math.max(84, screenWidth * 0.27)));

  const [step, setStep] = React.useState(0);
  const [shown, setShown] = React.useState(0);
  const [autoplay, setAutoplay] = React.useState(true);
  const heroRef = React.useRef<React.ComponentRef<typeof View>>(null);

  // Arriving from the launch screen the stem is already standing, tilde lifted away.
  const grow = useSharedValue(launching ? 1 : 0);
  const voice = useSharedValue(0);
  // Arriving from the launch screen the mark is already in place; otherwise it rises in.
  const rise = useSharedValue(launching ? 1 : 0);
  const caption = useSharedValue(launching ? 0 : 1);

  React.useEffect(() => {
    AccessibilityInfo.isScreenReaderEnabled()
      .then(on => on && setAutoplay(false))
      .catch(() => {});
  }, []);

  React.useEffect(() => () => setHero(null), [setHero]);

  const measureHero = () => {
    heroRef.current?.measureInWindow((x, y, width, height) => {
      if (width > 0) {
        setHero({x, y, width, height});
      }
    });
  };

  // Once the launch screen has handed over (or straight away after signing out).
  React.useEffect(() => {
    if (launching) {
      return;
    }
    rise.value = withTiming(1, {duration: reduceMotion ? 0 : 520, easing: Easing.out(Easing.cubic)});
    grow.value = withTiming(1, {duration: reduceMotion ? 0 : 520, easing: Easing.out(Easing.cubic)});
    caption.value = withTiming(1, {duration: reduceMotion ? 0 : 420});
  }, [launching, reduceMotion, rise, grow, caption]);

  // The mark follows the story: the tilde arrives on the second line.
  React.useEffect(() => {
    if (launching) {
      return;
    }
    voice.value =
      step >= 1 && !reduceMotion
        ? withSpring(1, {damping: 11, stiffness: 110, mass: 0.9})
        : withTiming(step >= 1 ? 1 : 0, {duration: reduceMotion ? 0 : 200});
  }, [step, launching, reduceMotion, voice]);

  // The words cross-fade a beat behind the mark.
  React.useEffect(() => {
    if (step === shown) {
      return;
    }
    caption.value = withTiming(0, {duration: reduceMotion ? 0 : 140});
    const timer = setTimeout(() => {
      setShown(step);
      caption.value = withTiming(1, {duration: reduceMotion ? 0 : 360});
    }, reduceMotion ? 0 : 160);
    return () => clearTimeout(timer);
  }, [step, shown, reduceMotion, caption]);

  React.useEffect(() => {
    if (launching || !autoplay || step >= LAST) {
      return;
    }
    const timer = setTimeout(() => setStep(current => Math.min(LAST, current + 1)), HOLD_MS[step]);
    return () => clearTimeout(timer);
  }, [launching, autoplay, step]);

  const choose = React.useCallback((next: number) => {
    setAutoplay(false);
    setStep(Math.max(0, Math.min(LAST, next)));
  }, []);

  const swipe = React.useMemo(
    () =>
      Gesture.Pan()
        .runOnJS(true)
        .activeOffsetX([-18, 18])
        .failOffsetY([-24, 24])
        .onEnd(event => {
          if (event.translationX < -40) {
            choose(step + 1);
          } else if (event.translationX > 40) {
            choose(step - 1);
          }
        }),
    [choose, step],
  );

  const markStyle = useAnimatedStyle(() => ({
    opacity: rise.value,
    transform: [{translateY: (1 - rise.value) * 18}],
  }));
  const captionStyle = useAnimatedStyle(() => ({
    opacity: caption.value,
    transform: [{translateY: (1 - caption.value) * 6}],
  }));

  const line = STORY[shown];

  return (
    <GestureDetector gesture={swipe}>
      <View className="flex-1 items-center justify-center px-8">
        {/* Hidden while the launch screen's copy of the mark flies onto this spot. */}
        <Animated.View style={[markStyle, launching && styles.hidden]}>
          <View ref={heroRef} onLayout={measureHero} collapsable={false}>
            <AnimatedMark width={heroWidth} grow={grow} voice={voice} />
          </View>
        </Animated.View>

        <Animated.View style={captionStyle} className="mt-12 min-h-[150px] w-full max-w-[340px] items-center">
          <Text className="text-[12px] font-semibold uppercase tracking-[1.8px] text-primary">{line.part}</Text>
          <Text className="mt-2.5 text-center font-serif text-[29px] leading-[35px]">{line.title}</Text>
          <Text className="mt-3 text-center text-[16px] leading-[24px] text-muted-foreground">{line.body}</Text>
        </Animated.View>

        <View className="mt-3 flex-row items-center gap-2.5" accessibilityRole="tablist">
          {STORY.map((part, index) => (
            <Pressable
              key={part.part}
              accessibilityRole="tab"
              accessibilityState={{selected: index === step}}
              accessibilityLabel={`${index + 1} of ${STORY.length}: ${part.part}`}
              hitSlop={12}
              onPress={() => choose(index)}>
              <View className={cn('h-1.5 rounded-full', index === step ? 'w-6 bg-primary' : 'w-1.5 bg-foreground/20')} />
            </Pressable>
          ))}
        </View>
      </View>
    </GestureDetector>
  );
}

const styles = StyleSheet.create({hidden: {opacity: 0}});
