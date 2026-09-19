import * as React from 'react';

import * as api from '@/api';
import type {Article} from '@/api';
import {useOffline} from '@/lib/offline';
import {signal} from '@/lib/signals';

/** What a reading session measured, reported when the reader closes. */
export type ReadingMetrics = {
  /** Furthest point reached, 0..1. */
  progress: number;
  /** Time spent with the reader in the foreground, in ms. */
  readMs: number;
};

type ReaderContextValue = {
  article: Article | null;
  loading: boolean;
  error: string | null;
  open: (id: string) => void;
  close: (metrics?: ReadingMetrics) => void;
};

const ReaderContext = React.createContext<ReaderContextValue | null>(null);

/** Which article (if any) the full-screen reader is showing. */
export function ReaderProvider({children}: {children: React.ReactNode}) {
  const [article, setArticle] = React.useState<Article | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [openId, setOpenId] = React.useState<string | null>(null);
  const offline = useOffline();
  const getSaved = React.useRef(offline.get);
  getSaved.current = offline.get;

  React.useEffect(() => {
    if (!openId) {
      return;
    }

    // Opening is its own signal; fetching the body is not, so a saved copy
    // opened offline still counts once the queue can send it.
    signal(openId, {type: 'open'}).catch(() => {});

    // A copy saved on this phone opens at once, connection or not.
    const saved = getSaved.current(openId);
    if (saved) {
      setArticle(saved.article);
      setLoading(false);
      setError(null);
      return;
    }

    let active = true;
    setLoading(true);
    setError(null);

    api.getArticle(openId).then(
      loaded => {
        if (active) {
          setArticle(loaded);
          setLoading(false);
        }
      },
      (e: unknown) => {
        if (active) {
          setError(e instanceof Error ? e.message : 'Could not open that article.');
          setLoading(false);
        }
      },
    );

    return () => {
      active = false;
    };
  }, [openId]);

  const value = React.useMemo<ReaderContextValue>(
    () => ({
      article,
      loading,
      error,
      open: setOpenId,
      close: metrics => {
        // The server decides whether this counts as finished, from how far the
        // reader got and how long they actually spent reading.
        if (openId) {
          signal(openId, {
            type: 'close',
            progress: metrics?.progress ?? 0,
            readMs: Math.round(metrics?.readMs ?? 0),
          }).catch(() => {});
        }
        setOpenId(null);
        setArticle(null);
        setError(null);
      },
    }),
    [article, loading, error, openId],
  );

  return (
    <ReaderContext.Provider value={value}>{children}</ReaderContext.Provider>
  );
}

export function useReader(): ReaderContextValue {
  const ctx = React.useContext(ReaderContext);
  if (!ctx) {
    throw new Error('useReader must be used inside <ReaderProvider>');
  }
  return ctx;
}
