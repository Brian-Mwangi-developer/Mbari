import * as React from 'react';

import * as api from '@/api';
import type {Account} from '@/api';
import {GOOGLE_WEB_CLIENT_ID} from '@/api/config';
import {forgetGoogleAccount, getGoogleIdToken} from '@/lib/google-sign-in';
import {clearShelf} from '@/lib/offline-store';
import {unregisterFromPush} from '@/lib/push';
import {migrateLegacyKeys} from '@/lib/storage-migration';

type SessionStatus = 'loading' | 'signedOut' | 'signedIn';

type SessionContextValue = {
  status: SessionStatus;
  account: Account | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name: string) => Promise<void>;
  /** Google's account sheet, then a session. Throws GoogleSignInError or ApiError. */
  signInWithGoogle: () => Promise<void>;
  signOut: () => Promise<void>;
  /** Re-read the profile, e.g. after onboarding writes to it. */
  refresh: () => Promise<void>;
};

const SessionContext = React.createContext<SessionContextValue | null>(null);

/**
 * Who is signed in. On mount it tries the stored bearer token; a 401 means the
 * token is stale, so it is dropped and the app shows sign-in.
 */
export function SessionProvider({children}: {children: React.ReactNode}) {
  const [status, setStatus] = React.useState<SessionStatus>('loading');
  const [account, setAccount] = React.useState<Account | null>(null);

  const load = React.useCallback(async () => {
    await migrateLegacyKeys();
    const token = await api.getToken();
    if (!token) {
      setAccount(null);
      setStatus('signedOut');
      return;
    }
    try {
      const me = await api.getAccount();
      setAccount(me);
      setStatus('signedIn');
    } catch (error) {
      if (error instanceof api.ApiError && error.status === 401) {
        await api.setToken(null);
        setAccount(null);
        setStatus('signedOut');
        return;
      }
      // Network trouble is not the same as being signed out — keep the token
      // and let the user retry rather than making them log in again.
      setStatus(account ? 'signedIn' : 'signedOut');
    }
  }, [account]);

  React.useEffect(() => {
    load().catch(() => setStatus('signedOut'));
    // Intentionally once on mount; `load` is re-created as account changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const value = React.useMemo<SessionContextValue>(
    () => ({
      status,
      account,
      signIn: async (email, password) => {
        await api.signIn(email, password);
        setAccount(await api.getAccount());
        setStatus('signedIn');
      },
      signUp: async (email, password, name) => {
        await api.signUp(email, password, name);
        setAccount(await api.getAccount());
        setStatus('signedIn');
      },
      signInWithGoogle: async () => {
        const {idToken, nonce} = await getGoogleIdToken(GOOGLE_WEB_CLIENT_ID);
        await api.signInWithGoogle(idToken, nonce);
        setAccount(await api.getAccount());
        setStatus('signedIn');
      },
      signOut: async () => {
        if (account) {
          await clearShelf(account.id);
        }
        // While still signed in, so the server lets this install go.
        await unregisterFromPush();
        await api.signOut();
        // So the next Google sign-in offers the account choice again.
        await forgetGoogleAccount();
        setAccount(null);
        setStatus('signedOut');
      },
      refresh: async () => {
        try {
          setAccount(await api.getAccount());
        } catch {
          // Leave the current account in place on a transient failure.
        }
      },
    }),
    [status, account],
  );

  return (
    <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
  );
}

export function useSession(): SessionContextValue {
  const ctx = React.useContext(SessionContext);
  if (!ctx) {
    throw new Error('useSession must be used inside <SessionProvider>');
  }
  return ctx;
}
