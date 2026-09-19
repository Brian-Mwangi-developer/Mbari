import * as React from 'react';

import * as api from '@/api';
import type {Feed} from '@/api';

type SourcesContextValue = {
  sources: Feed[];
  loading: boolean;
  error: string | null;
  add: (url: string) => Promise<void>;
  toggleMute: (feed: Feed) => Promise<void>;
  remove: (feed: Feed) => Promise<void>;
  reload: () => Promise<void>;
};

const SourcesContext = React.createContext<SourcesContextValue | null>(null);

/**
 * The subscription list, shared by Today (which gates first-run on it) and
 * Sources (which edits it), so both stay in step after an add or a mute.
 */
export function SourcesProvider({children}: {children: React.ReactNode}) {
  const [sources, setSources] = React.useState<Feed[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const reload = React.useCallback(async () => {
    setLoading(true);
    try {
      setSources(await api.getSources());
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load your sources.');
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    reload().catch(() => {});
  }, [reload]);

  const value = React.useMemo<SourcesContextValue>(
    () => ({
      sources,
      loading,
      error,
      add: async url => {
        const created = await api.addSource(url);
        setSources(prev =>
          prev.some(f => f.id === created.id) ? prev : [...prev, created],
        );
      },
      toggleMute: async feed => {
        const muted = !feed.muted;
        // Optimistic: the row flips immediately, and reverts if the call fails.
        setSources(prev => prev.map(f => (f.id === feed.id ? {...f, muted} : f)));
        try {
          await api.setSourceMuted(feed.id, muted);
        } catch {
          setSources(prev =>
            prev.map(f => (f.id === feed.id ? {...f, muted: feed.muted} : f)),
          );
        }
      },
      remove: async feed => {
        const previous = sources;
        setSources(prev => prev.filter(f => f.id !== feed.id));
        try {
          await api.removeSource(feed.id);
        } catch {
          setSources(previous);
        }
      },
      reload,
    }),
    [sources, loading, error, reload],
  );

  return (
    <SourcesContext.Provider value={value}>{children}</SourcesContext.Provider>
  );
}

export function useSources(): SourcesContextValue {
  const ctx = React.useContext(SourcesContext);
  if (!ctx) {
    throw new Error('useSources must be used inside <SourcesProvider>');
  }
  return ctx;
}
