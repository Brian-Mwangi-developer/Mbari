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
