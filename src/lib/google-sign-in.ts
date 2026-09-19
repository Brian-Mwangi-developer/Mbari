import NativeGoogleSignIn from '@/native/NativeGoogleSignIn';

export type GoogleSignInErrorCode =
  | 'cancelled'
  | 'no_credential'
  | 'not_configured'
  | 'failed';

export class GoogleSignInError extends Error {
  code: GoogleSignInErrorCode;

  constructor(code: GoogleSignInErrorCode, message: string) {
    super(message);
    this.name = 'GoogleSignInError';
    this.code = code;
  }
}

const KNOWN_CODES: readonly GoogleSignInErrorCode[] = [
  'cancelled',
  'no_credential',
  'not_configured',
  'failed',
];

export async function getGoogleIdToken(
  webClientId: string,
): Promise<{idToken: string; nonce: string}> {
  if (!NativeGoogleSignIn) {
    throw new GoogleSignInError('not_configured', 'Google sign-in is not available on this device.');
  }
  if (!webClientId) {
    throw new GoogleSignInError('not_configured', 'Google sign-in is not set up for this build yet.');
  }
  try {
    return await NativeGoogleSignIn.signIn(webClientId);
  } catch (error) {
    const code = (error as {code?: string} | null)?.code;
    throw new GoogleSignInError(
      KNOWN_CODES.includes(code as GoogleSignInErrorCode) ? (code as GoogleSignInErrorCode) : 'failed',
      error instanceof Error ? error.message : 'Google sign-in failed.',
    );
  }
}

/** Forget the chosen Google account. Never throws. */
export async function forgetGoogleAccount(): Promise<void> {
  try {
    await NativeGoogleSignIn?.signOut();
  } catch {
    // Signing out of the app must not depend on this.
  }
}
