import * as React from 'react';
import {AppState} from 'react-native';

import * as api from '@/api';
import type {DeckCard} from '@/api';
import {
  currentCard,
  deckReducer,
  initialDeck,
  nextCard,
  previousCard,
  remaining,
  type DeckState,
} from '@/lib/deck-state';
import {useSession} from '@/lib/session';
import {onSignal, signal, startSignals, stopSignals, track} from '@/lib/signals';

type DeckContextValue = {
  state: DeckState;
  current: DeckCard | null;
  next: DeckCard | null;
  previous: DeckCard | null;
  loading: boolean;
  error: string | null;
  reload: () => void;
  /** Left swipe: not interested. */
  pass: () => void;
  /** Right swipe or the next arrow: move on without a verdict. */
  skip: () => void;
  back: () => void;
  toggleLike: (card: DeckCard) => void;
  toggleSave: (card: DeckCard) => void;
  playTapped: (card: DeckCard) => void;
};

const DeckContext = React.createContext<DeckContextValue | null>(null);

/** A card glanced at for less than this is not worth a view event. */
const MIN_VIEW_MS = 300;
/** Coming back to the app after this long reloads the queue. */
const STALE_AFTER_MS = 30 * 60_000;
/** Quiet time after a signal before what is ahead is re-ranked. */
const RERANK_AFTER_MS = 2_500;
/** Ask for more while this many cards are still left, so the reader never waits. */
const REFILL_WHEN_LEFT = 3;

/**
 * Today's deck for the whole app session. Lives above the tabs, so leaving
 * Today and coming back keeps your place and your history.
 */
export function DeckProvider({children}: {children: React.ReactNode}) {
  const {account} = useSession();
  const [state, dispatch] = React.useReducer(deckReducer, initialDeck);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const stateRef = React.useRef(state);
  stateRef.current = state;
  const loadingRef = React.useRef(false);
  const loadedAt = React.useRef(0);
  /** Deck size and position at the last refill, so an empty answer is not asked again. */
  const refilledAt = React.useRef<string | null>(null);

  // How long the top card has been on screen, paused while the app is in the background.
  const view = React.useRef<{id: string | null; since: number; accumulated: number}>({id: null, since: Date.now(), accumulated: 0});
  const dwellOf = React.useCallback((id: string) => {
    const v = view.current;
    return v.id === id ? v.accumulated + (v.since ? Date.now() - v.since : 0) : 0;
  }, []);

  const load = React.useCallback(async () => {
    if (loadingRef.current) {
      return;
    }
    loadingRef.current = true;
    setLoading(true);
    try {
      const deck = await api.getToday(currentCard(stateRef.current)?.id ?? null);
      dispatch({type: 'loaded', deck});
      loadedAt.current = Date.now();
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Could not load recommendations.');
    } finally {
      loadingRef.current = false;
      setLoading(false);
    }
  }, []);

  // After a signal, re-rank what is ahead with what it taught. Debounced, so a
  // run of swipes is one quiet request; the card on screen never changes.
  const rerankTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const scheduleRerank = React.useCallback(() => {
    if (rerankTimer.current) {
      clearTimeout(rerankTimer.current);
    }
    rerankTimer.current = setTimeout(() => {
      rerankTimer.current = null;
      refilledAt.current = null;
      load().catch(() => {});
    }, RERANK_AFTER_MS);
  }, [load]);
  React.useEffect(
    () => () => {
      if (rerankTimer.current) {
        clearTimeout(rerankTimer.current);
      }
    },
    [],
  );

  React.useEffect(() => {
    if (!account) {
      stopSignals();
      dispatch({type: 'reset'});
      return;
    }
    startSignals(account.id).catch(() => {});
    load().catch(() => {});
  }, [account, load]);

  // Top up before the reader reaches the last card.
  React.useEffect(() => {
    if (!state.loaded || loading || remaining(state) > REFILL_WHEN_LEFT) {
      return;
    }
    const marker = `${state.cards.length}:${state.index}`;
    if (refilledAt.current === marker) {
      return;
    }
    refilledAt.current = marker;
    load().catch(() => {});
  }, [state, loading, load]);

  // One view event per card shown, with its time on screen.
  const topId = currentCard(state)?.id ?? null;
  React.useEffect(() => {
    const previousView = view.current;
    if (previousView.id && previousView.id !== topId) {
      const dwellMs = dwellOf(previousView.id);
      const card = stateRef.current.cards.find(c => c.id === previousView.id);
      if (dwellMs >= MIN_VIEW_MS && card) {
        track({type: 'card_view', itemId: card.id, position: card.position, dwellMs});
      }
    }
    view.current = {id: topId, since: Date.now(), accumulated: 0};
  }, [topId, dwellOf]);

  React.useEffect(() => {
    const done = state.loaded && state.index >= state.cards.length && state.exhausted;
    if (done) {
      track({type: 'deck_exhausted'});
    }
  }, [state.loaded, state.index, state.cards.length, state.exhausted]);

  React.useEffect(() => {
    const sub = AppState.addEventListener('change', next => {
      const v = view.current;
      if (next === 'active') {
        v.since = Date.now();
        if (Date.now() - loadedAt.current > STALE_AFTER_MS) {
          load().catch(() => {});
        }
      } else if (v.since) {
        v.accumulated += Date.now() - v.since;
        v.since = 0;
      }
    });
    return () => sub.remove();
  }, [load]);

  // A like or save made in the reader shows on the card.
  React.useEffect(
    () =>
      onSignal(({itemId, type}) => {
        if (type === 'like' || type === 'unlike') {
          dispatch({type: 'setFlag', id: itemId, flag: 'liked', value: type === 'like'});
        } else if (type === 'save' || type === 'unsave') {
          dispatch({type: 'setFlag', id: itemId, flag: 'saved', value: type === 'save'});
        } else if (type === 'close') {
          dispatch({type: 'read', id: itemId});
        }
      }),
    [],
  );

  const value = React.useMemo<DeckContextValue>(() => {
    const top = currentCard(state);
    return {
      state,
      current: top,
      next: nextCard(state),
      previous: previousCard(state),
      loading,
      error,
      reload: () => {
        refilledAt.current = null;
        load().catch(() => {});
      },
      pass: () => {
        if (!top) {
          return;
        }
        signal(top.id, {type: 'pass', dwellMs: dwellOf(top.id), position: top.position}).catch(() => {});
        dispatch({type: 'pass'});
        scheduleRerank();
      },
      skip: () => {
        if (!top) {
          return;
        }
        signal(top.id, {type: 'skip', dwellMs: dwellOf(top.id), position: top.position}).catch(() => {});
        dispatch({type: 'skip'});
        scheduleRerank();
      },
      back: () => {
        const earlier = previousCard(state);
        if (!earlier) {
          return;
        }
        if (state.passed.includes(earlier.id) || state.skipped.includes(earlier.id)) {
          signal(earlier.id, {type: 'return', position: earlier.position}).catch(() => {});
        }
        dispatch({type: 'back'});
      },
      toggleLike: card => {
        signal(card.id, {type: card.liked ? 'unlike' : 'like', dwellMs: dwellOf(card.id), position: card.position}).catch(() => {});
        scheduleRerank();
      },
      toggleSave: card => {
        signal(card.id, {type: card.saved ? 'unsave' : 'save', position: card.position}).catch(() => {});
        scheduleRerank();
      },
      playTapped: card => track({type: 'play_tapped', itemId: card.id, position: card.position}),
    };
  }, [state, loading, error, load, dwellOf, scheduleRerank]);

  return <DeckContext.Provider value={value}>{children}</DeckContext.Provider>;
}

export function useDeck(): DeckContextValue {
  const ctx = React.useContext(DeckContext);
  if (!ctx) {
    throw new Error('useDeck must be used inside <DeckProvider>');
  }
  return ctx;
}
