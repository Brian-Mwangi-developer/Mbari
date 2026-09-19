# Mbari

The Mbari Android app. The repository keeps the project's working name,
`mbari`; nothing the reader sees uses it.

Bare React Native app (no Expo), **Android only**, styled with
[NativeWind](https://www.nativewind.dev) (Tailwind CSS for RN) and
[react-native-reusables](https://reactnativereusables.com) (shadcn/ui for RN).

## Stack

| Concern         | Choice                                                   |
| --------------- | -------------------------------------------------------- |
| Framework       | React Native 0.87 (New Architecture, Hermes)             |
| Package manager | pnpm (`nodeLinker: hoisted` — RN needs a flat tree)      |
| Styling         | NativeWind 4 + Tailwind CSS 3                            |
| Components      | react-native-reusables (`@rn-primitives/*` + `cva`)      |
| Icons           | `lucide-react-native`                                    |
| Animation       | `react-native-reanimated` 4 + `react-native-worklets`    |

## Getting started

```sh
pnpm install
pnpm start            # Metro
pnpm android          # build + install debug APK on the connected device/emulator
pnpm android:release  # unsigned release APK → android/app/build/outputs/apk/release/
pnpm typecheck
pnpm lint
pnpm test
```

## Talking to the backend

The app is a client of `mbari-backend`. Start that first (`pnpm dev` in
`~/Documents/mbari-backend`), then:

- **Android emulator** — works out of the box. `localhost` inside the emulator
  is the emulator itself, so `src/api/config.ts` points at `10.0.2.2:4000`,
  which is the host machine.
- **Physical device** — edit `API_BASE_URL` in `src/api/config.ts` to your
  machine's LAN address (e.g. `http://192.168.1.20:4000`), put the phone on the
  same Wi-Fi, and reload. Custom env vars need a babel plugin in bare RN, so
  this is deliberately a one-line constant.

Auth is a bearer token from better-auth, kept in AsyncStorage. The client also
sends a fixed `Origin: mbari://app`, which the backend lists in
`trustedOrigins` — without it better-auth's CSRF check rejects the request as
soon as anything in the stack adds a `Sec-Fetch-*` header.

```
src/api/
  config.ts   # base URL + native origin — the file you edit
  client.ts   # fetch wrapper: bearer token, timeout, { success, data } unwrapping
  types.ts    # wire types (also the props the UI components take)
  index.ts    # every backend call the app makes
src/lib/
  session.tsx   # who is signed in; gates the app
  sources.tsx   # subscription list, shared by Today and Sources
  reader.tsx    # loads the full article; reports progress and reading time on close
  deck.tsx      # today's deck for the app session: pass, back, like, save, dwell
  deck-state.ts # the deck's pure reducer (tested)
  signals.ts    # sends signals now, or queues and retries them, with client ids
  use-async.ts  # small fetch-state hook
```

### Today, signals and interests

Today is a rolling queue of cards (`components/today/SwipeDeck.tsx`). Swipe left
to pass, right (or the → arrow) for the next card; ← brings back an earlier one
for as long as the app stays open. The server keeps about ten cards ready and
re-ranks the ones you have not reached after each like, save, pass or next, so
the queue follows what you are reading. Each card has Save on the left, Like on
the right, Listen (voice is coming; taps are recorded as demand) and Read. When
nothing is left, Today says so and why.

Everything the reader does is a signal the backend learns from, so a few rules
keep them honest:

- The time a card was on screen goes with a pass or a like; a flick counts for
  less than a considered pass. Card views are batched to `/api/v1/events`.
- The reader reports the furthest point reached and foreground reading time;
  the server decides whether that counts as finished.
- Signals carry a client id and are queued on the device when offline, so a
  retry never counts twice and nothing is lost to a dropped connection.

First sign-in asks for a few interests (skippable). Settings → Interests shows
what the reader said, what Mbari noticed from their reading, and what they
have been into lately; noticed interests can be removed.

### Notifications

Recommendations arrive as Android notifications inside the windows set in
Settings → Timing, in the phone's timezone (synced to the server on launch).
Tapping one opens that article. One that arrives with the app open shows as a
banner instead.

Push uses Firebase Cloud Messaging (`@react-native-firebase/messaging`) and
needs the Firebase project's config:

1. Firebase console → add an Android app with package `com.mbari.app`.
2. Download `google-services.json` into `android/app/`.
3. Rebuild (`pnpm android`).

Without that file the app builds and runs normally, and Settings →
Notifications says push is not set up in this build. Android 13+ asks for
permission once, after an in-app prompt on Today. Channel: `recommendations`,
created in `MainApplication.kt`.

### Logo, launcher icon and splash

The mark is a bookmark ribbon folded into an L, holding one amber dot (the
day's pick). One script draws every copy of it from the same geometry:

```bash
python3 -m venv .venv-brand && .venv-brand/bin/pip install fonttools uharfbuzz
brew install librsvg
.venv-brand/bin/python scripts/generate-brand-assets.py
```

It writes the adaptive launcher icon (with a themed-icon monochrome layer),
legacy PNG icons, the splash drawable and colours, and
`src/components/brand/wordmark-data.ts` (the "mbari" outlines from Plus
Jakarta Sans Bold). `src/components/brand/geometry.ts` holds the same numbers
for the app.

Opening the app is one motion:

1. **Native splash** (`Theme.Mbari.Starting`, androidx core-splashscreen):
   the mark on the app's background, light or dark. `MainActivity` holds it
   until JavaScript has drawn its own copy (`NativeLaunchScreen.hide()`), or 4 s.
2. **Launch screen** (`components/brand/LaunchScreen.tsx`): the same mark in
   the same place while the session loads. Signed in, it fades into Today.
   Signed out, it folds back into a bookmark and flies to the landing page.
3. **Landing** (`screens/SignInScreen.tsx`): the mark builds itself up (the
   bookmark, the fold into an L, the pick dropping into its corner) while three
   lines say what each part means. It plays once; swiping or tapping the steps
   takes over, and with a screen reader on it waits. Reduced motion skips the
   movement.

Storage keys moved from `mbari.*` to `mbari.*`;
`lib/storage-migration.ts` moves existing ones on first launch, so nobody is
signed out.

## Project layout

```
src/
  App.tsx              # entry (imports global.css, mounts PortalHost)
  components/ui/       # reusables components (owned by you — edit freely)
  lib/utils.ts         # cn() helper (clsx + tailwind-merge)
  lib/theme.ts         # theme colours as plain values (for StatusBar, navigation, …)
global.css             # Tailwind directives + light/dark CSS variables
tailwind.config.js     # theme tokens mapped to the CSS variables
components.json        # reusables/shadcn CLI config
```

`@/` resolves to `src/` (Babel `module-resolver` + `tsconfig` paths + Jest mapper).

## Adding components

```sh
npx @react-native-reusables/cli@latest add dialog select checkbox
```

Files land in `src/components/ui/`. Some components pull extra
`@rn-primitives/*` packages — the CLI installs them with pnpm. The full list is at
<https://reactnativereusables.com/docs/components>.

## Styling notes

- Use `className` on any RN core component. Custom components must forward
  `className` (the reusables ones already do).
- Theme colours are `bg-background`, `text-foreground`, `bg-primary`,
  `text-muted-foreground`, `border-border`, etc. — see `tailwind.config.js`.
- Dark mode follows the system by default. To control it manually use
  `useColorScheme()` from `nativewind` and call `setColorScheme('dark' | 'light' | 'system')`.
- Prettier sorts Tailwind classes via `prettier-plugin-tailwindcss`.

## APK size

The `ios/` folder, CocoaPods files and the iOS CLI platform package are removed.
That trims the repo, but what actually shrinks the APK is in
`android/app/build.gradle`:

- `enableProguardInReleaseBuilds = true` → R8 minifies/shrinks Java/Kotlin.
- `shrinkResources` → drops unused Android resources.

Further levers if you need them:

- **ABI splits** — the default universal APK bundles native libs for
  `armeabi-v7a, arm64-v8a, x86, x86_64` (`reactNativeArchitectures` in
  `android/gradle.properties`). For a phone-only release build, set it to
  `arm64-v8a,armeabi-v7a`, or add a `splits { abi { … } }` block to produce one
  APK per ABI.
- **AAB for Play Store** — `./gradlew bundleRelease`; Play serves each device
  only what it needs.
