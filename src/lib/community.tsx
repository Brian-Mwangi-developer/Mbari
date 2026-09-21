import * as React from 'react';
import {AppState} from 'react-native';

import * as api from '@/api';
import {ALERTS, type Alert, type County} from '@/data/static';
import {toAlert} from '@/lib/alerts';
import type {Recording} from '@/lib/recorder';
import type {VoiceMessage} from '@/api/types';

/** While the app is open, new alerts show up within this long. */
const POLL_MS = 60_000;
/** How often a translation in progress is checked. */
const VOICE_POLL_MS = 2_000;

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
  /** "Translate to Gĩkũyũ" results, by alert id. Recording again clears one. */
  voices: Record<string, VoiceMessage>;
  /** Uploads the alert's recording and follows the translation until it is done. */
  translate: (id: string) => Promise<void>;
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
  const [voices, setVoices] = React.useState<Record<string, VoiceMessage>>({});
  const recordingsRef = React.useRef(recordings);
  recordingsRef.current = recordings;
  const voicesRef = React.useRef(voices);
  voicesRef.current = voices;

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
    const voice = voicesRef.current[id];
    const wire = await api.requestSend(id, voice?.status === 'ready' ? voice.id : undefined);
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
    // A new take needs a new translation.
    setVoices(prev => {
      const next = {...prev};
      delete next[id];
      return next;
    });
  }, []);

  // Follow translations in progress until each is ready or failed.
  const pending = Object.values(voices).some(v => v.status !== 'ready' && v.status !== 'failed');
  React.useEffect(() => {
    if (!pending) {
      return;
    }
    const timer = setInterval(async () => {
      for (const [alertId, voice] of Object.entries(voicesRef.current)) {
        if (voice.status === 'ready' || voice.status === 'failed') {
          continue;
        }
        try {
          const latest = await api.getVoice(voice.id);
          // Ignore the answer if the take was replaced meanwhile.
          setVoices(prev => (prev[alertId]?.id === latest.id ? {...prev, [alertId]: latest} : prev));
        } catch {
          // A missed poll is retried on the next tick.
        }
      }
    }, VOICE_POLL_MS);
    return () => clearInterval(timer);
  }, [pending]);

  const translate = React.useCallback(async (id: string) => {
    const recording = recordingsRef.current[id];
    if (!recording) {
      throw new Error('Record your message first.');
    }
    const previous = voicesRef.current[id];
    const voice =
      previous?.status === 'failed'
        ? await api.retryVoice(previous.id)
        : await api.translateRecording(recording, SAMPLES.some(a => a.id === id) ? undefined : id);
    setVoices(prev => ({...prev, [id]: voice}));
  }, []);

  const value = React.useMemo<CommunityContextValue>(
    () => ({county, setCounty, alerts: [...live, ...samples], loading, error, refresh, send, recordings, saveRecording, voices, translate}),
    [county, live, samples, loading, error, refresh, send, recordings, saveRecording, voices, translate],
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
