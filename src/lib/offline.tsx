import * as React from 'react';
import {AppState} from 'react-native';

import type {Article} from '@/api';
import {
  DEFAULT_RETENTION,
  pruneShelf,
  readRetention,
  readShelf,
  writeRetention,
  writeShelf,
  type OfflineRetention,
  type OfflineShelf,
  type SavedArticle,
} from '@/lib/offline-store';
import {useSession} from '@/lib/session';

type OfflineContextValue = {
  /** Newest first. */
  saved: SavedArticle[];
  isSaved: (id: string) => boolean;
  get: (id: string) => SavedArticle | null;
  save: (article: Article) => void;
  remove: (id: string) => void;
  /** How long saved articles stay on this phone. */
  retention: OfflineRetention;
  setRetention: (retention: OfflineRetention) => void;
};

const OfflineContext = React.createContext<OfflineContextValue | null>(null);

export function OfflineProvider({children}: {children: React.ReactNode}) {
  const {account} = useSession();
  const userId = account?.id ?? null;
  const [shelf, setShelf] = React.useState<OfflineShelf>({});
  const shelfRef = React.useRef<OfflineShelf>({});
  const [retention, setRetentionState] = React.useState<OfflineRetention>(DEFAULT_RETENTION);
  const retentionRef = React.useRef<OfflineRetention>(DEFAULT_RETENTION);

  const commit = React.useCallback(
    (next: OfflineShelf) => {
      shelfRef.current = next;
      setShelf(next);
      if (userId) {
        writeShelf(userId, next);
      }
    },
    [userId],
  );

  /** Drop articles past the retention; writes only when something expired. */
  const prune = React.useCallback(() => {
    const kept = pruneShelf(shelfRef.current, retentionRef.current);
    if (Object.keys(kept).length !== Object.keys(shelfRef.current).length) {
      commit(kept);
    }
  }, [commit]);

  React.useEffect(() => {
    shelfRef.current = {};
    setShelf({});
    if (!userId) {
      return;
    }
    let active = true;
    Promise.all([readShelf(userId), readRetention()]).then(([loaded, chosen]) => {
      if (active) {
        retentionRef.current = chosen;
        setRetentionState(chosen);
        shelfRef.current = loaded;
        setShelf(loaded);
        prune();
      }
    });
    return () => {
      active = false;
    };
  }, [userId, prune]);

  // An app left open for days still expires articles when it comes back.
  React.useEffect(() => {
    const sub = AppState.addEventListener('change', state => {
      if (state === 'active') {
        prune();
      }
    });
    return () => sub.remove();
  }, [prune]);

  const value = React.useMemo<OfflineContextValue>(
    () => ({
      saved: Object.values(shelf).sort((a, b) => b.savedAt.localeCompare(a.savedAt)),
      isSaved: id => id in shelf,
      get: id => shelfRef.current[id] ?? null,
      save: article =>
        commit({
          ...shelfRef.current,
          [article.id]: {article, savedAt: new Date().toISOString()},
        }),
      remove: id => {
        const next = {...shelfRef.current};
        delete next[id];
        commit(next);
      },
      retention,
      setRetention: next => {
        retentionRef.current = next;
        setRetentionState(next);
        writeRetention(next);
        prune();
      },
    }),
    [shelf, commit, retention, prune],
  );

  return (
    <OfflineContext.Provider value={value}>{children}</OfflineContext.Provider>
  );
}

export function useOffline(): OfflineContextValue {
  const ctx = React.useContext(OfflineContext);
  if (!ctx) {
    throw new Error('useOffline must be used inside <OfflineProvider>');
  }
  return ctx;
}
