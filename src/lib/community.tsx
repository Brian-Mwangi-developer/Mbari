import * as React from 'react';
import {AppState} from 'react-native';

import * as api from '@/api';
import {ALERTS, type Alert, type County} from '@/data/static';
import {toAlert} from '@/lib/alerts';
import type {Recording} from '@/lib/recorder';

/** While the app is open, new alerts show up within this long. */
const POLL_MS = 60_000;

type CommunityContextValue = {
  county: County;
  setCounty: (county: County) => void;
  /** Live alerts from the server first, newest first; then the samples. */
  alerts: Alert[];
  /** True until the first server response for this county. */
  loading: boolean;
  /** Why live alerts could not be loaded, or null. The samples still show. */
  error: string | null;
  refresh: () => Promise<void>;
  /**
   * "Send to community". A live alert goes to the server and waits for an
   * approver; a sample is marked sent on this device only.
   */
  send: (id: string) => Promise<void>;
  /** Voice messages recorded on this phone, by alert id, until they are sent. */
  recordings: Record<string, Recording>;
  saveRecording: (id: string, recording: Recording | null) => void;
};

const CommunityContext = React.createContext<CommunityContextValue | null>(null);

const SAMPLES: Alert[] = ALERTS.map(a => ({...a, sample: true}));

/** The county being looked at, and its alerts. */
export function CommunityProvider({children}: {children: React.ReactNode}) {
  const [county, setCounty] = React.useState<County>('Kiambu');
  const [live, setLive] = React.useState<Alert[]>([]);
  const [samples, setSamples] = React.useState<Alert[]>(SAMPLES);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [recordings, setRecordings] = React.useState<Record<string, Recording>>({});

  // A slow response for the previous county must not overwrite this one.
  const current = React.useRef(county);
  current.current = county;

  const refresh = React.useCallback(async () => {
    const asked = current.current;
    try {
      const page = await api.getAlerts(asked);
      if (current.current !== asked) {
        return;
      }
      const now = Date.now();
      setLive(page.items.map(w => toAlert(w, asked, now)).filter((a): a is Alert => a !== null));
      setError(null);
    } catch (e) {
      if (current.current === asked) {
        setError(e instanceof Error ? e.message : 'Could not load updates.');
      }
    } finally {
      if (current.current === asked) {
        setLoading(false);
      }
    }
  }, []);

  React.useEffect(() => {
    setLoading(true);
    setLive([]);
    refresh();
  }, [county, refresh]);

  React.useEffect(() => {
    let timer: ReturnType<typeof setInterval> | null = setInterval(refresh, POLL_MS);
    const sub = AppState.addEventListener('change', state => {
      if (state === 'active') {
        refresh();
        timer ??= setInterval(refresh, POLL_MS);
      } else if (timer) {
        clearInterval(timer);
        timer = null;
      }
    });
    return () => {
      sub.remove();
      if (timer) {
        clearInterval(timer);
      }
    };
  }, [refresh]);

  const send = React.useCallback(async (id: string) => {
    if (SAMPLES.some(a => a.id === id)) {
      setSamples(prev => prev.map(a => (a.id === id ? {...a, status: 'sent'} : a)));
      return;
    }
    const wire = await api.requestSend(id);
    setLive(prev => prev.map(a => (a.id === id ? {...a, status: wire.status === 'dismissed' ? a.status : wire.status} : a)));
  }, []);

  const saveRecording = React.useCallback((id: string, recording: Recording | null) => {
    setRecordings(prev => {
      const next = {...prev};
      if (recording) {
        next[id] = recording;
      } else {
        delete next[id];
      }
      return next;
    });
  }, []);

  const value = React.useMemo<CommunityContextValue>(
    () => ({county, setCounty, alerts: [...live, ...samples], loading, error, refresh, send, recordings, saveRecording}),
    [county, live, samples, loading, error, refresh, send, recordings, saveRecording],
  );

  return <CommunityContext.Provider value={value}>{children}</CommunityContext.Provider>;
}

export function useCommunity(): CommunityContextValue {
  const ctx = React.useContext(CommunityContext);
  if (!ctx) {
    throw new Error('useCommunity must be used inside <CommunityProvider>');
  }
  return ctx;
}
