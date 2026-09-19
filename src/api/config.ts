/**
 * The backend this build talks to: production, behind Caddy on the Frankfurt
 * instance, with a Let's Encrypt certificate.
 *
 * To point a build at a laptop instead, use 'http://10.0.2.2:4000' on the
 * Android emulator, or an ngrok URL for a physical device.
 */
export const API_BASE_URL = 'https://api.mbari.com';

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
