import type {TurboModule} from 'react-native';
import {TurboModuleRegistry} from 'react-native';

/**
 * Sign in with Google through Android's Credential Manager
 * (android/app/src/main/java/com/mbari/app/GoogleSignInModule.kt).
 */
export interface Spec extends TurboModule {
  /**
   * Shows Google's account sheet. Resolves with an ID token whose audience is
   * `webClientId`, plus the nonce baked into it. Rejects with code
   * `cancelled`, `no_credential`, `not_configured` or `failed`.
   */
  signIn(webClientId: string): Promise<{idToken: string; nonce: string}>;
  /** Forget the chosen account, so the next sign-in asks again. */
  signOut(): Promise<void>;
}

// `get`, not `getEnforcing`: null off Android (and in tests) rather than a crash.
export default TurboModuleRegistry.get<Spec>('NativeGoogleSignIn');
