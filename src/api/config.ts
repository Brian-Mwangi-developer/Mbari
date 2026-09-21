/**
 * The backend this build talks to: mbari-backend on the laptop, by its Wi-Fi
 * address, so debug builds, the emulator and an exported release APK all
 * reach it. The phone must be on the same Wi-Fi as the laptop.
 *
 * The address changes when the laptop joins another network. Find the new one
 * with `ipconfig getifaddr en0` and rebuild. Plain http is allowed in release
 * builds for this reason (android/app/build.gradle); switch to the https API
 * once it is deployed.
 */
export const API_BASE_URL = 'http://192.168.0.103:4000';

export const API_TIMEOUT_MS = 20000;


export const GOOGLE_WEB_CLIENT_ID = '131242635298-7b5i9rsqubq49kbtomhb8uki45817nbk.apps.googleusercontent.com';

/**
 * Origin this client presents to the backend.
 *
 * A native app has no browser origin, but better-auth runs its CSRF check the
 * moment a client sends any Sec-Fetch-* header and then rejects a missing
 * Origin. React Native does not send those headers today, but a debugging
 * proxy does — so we always send an explicit origin rather than depending on
 * that. The backend lists this exact value in `trustedOrigins`
 * (see mbari-backend/src/lib/auth.ts).
 */
export const NATIVE_APP_ORIGIN = 'mbari://app';

/**
 * Whether the app talks to the backend. Off, sign-in skips the network and
 * goes straight in with a local account (useful for UI work without a server).
 */
export const BACKEND_ENABLED = true;
