import type {DeckCard, DeckStats, TodayDeck} from '@/api';

/**
 * The reader's rolling queue as they move through it in one app session.
 *
 * The server owns what comes next and re-ranks it as the reader's taste
 * moves. This keeps the session's own history in front of that — cards
 * already moved past, so the previous arrow still works — and never changes
 * the card on screen under the reader.
 */

export type DeckState = {
  loaded: boolean;
  cards: DeckCard[];
  /** The card on top. Equal to cards.length when the reader has gone past the end. */
  index: number;
  /** Cards passed this session, so coming back to one can undo the pass. */
  passed: string[];
  /** Cards moved past with "next" — not a verdict, but coming back still tells the server. */
  skipped: string[];
  read: string[];
  exhausted: TodayDeck['exhausted'];
  stats: DeckStats | null;
};

export type DeckAction =
  | {type: 'loaded'; deck: TodayDeck}
  | {type: 'pass'}
  | {type: 'skip'}
  | {type: 'back'}
  | {type: 'setFlag'; id: string; flag: 'liked' | 'saved'; value: boolean}
  | {type: 'read'; id: string}
  | {type: 'reset'};

export const initialDeck: DeckState = {
  loaded: false,
  cards: [],
  index: 0,
  passed: [],
  skipped: [],
  read: [],
  exhausted: null,
  stats: null,
};

/** A card is one dealing of an article: the same article dealt again later is a new card. */
const cardKey = (card: DeckCard) => `${card.id}:${card.position}`;

export function deckReducer(state: DeckState, action: DeckAction): DeckState {
  switch (action.type) {
    case 'loaded': {
      const {deck} = action;
      const history = state.cards.slice(0, state.index);
      const current = state.cards[state.index];
      const seen = new Set([...history, ...(current ? [current] : [])].map(cardKey));
      const localFlags = new Map(state.cards.map(card => [card.id, {liked: card.liked, saved: card.saved}]));

      // Everything after the card on screen is the server's latest ordering.
      // A card the reader already went past (its signal still on the way) is
      // not shown twice.
      const ahead = deck.cards
        .filter(card => !seen.has(cardKey(card)) && card.id !== current?.id)
        .map(card => ({...card, ...(localFlags.get(card.id) ?? {})}));

      return {
        ...state,
        loaded: true,
        cards: [...history, ...(current ? [current] : []), ...ahead],
        exhausted: deck.exhausted,
        stats: deck.stats,
      };
    }
    case 'pass':
    case 'skip': {
      const card = state.cards[state.index];
      if (!card) {
        return state;
      }
      const list = action.type === 'pass' ? 'passed' : 'skipped';
      return {
        ...state,
        index: state.index + 1,
        [list]: state[list].includes(card.id) ? state[list] : [...state[list], card.id],
      };
    }
    case 'back': {
      if (state.index === 0) {
        return state;
      }
      const index = state.index - 1;
      const card = state.cards[index]!;
      return {
        ...state,
        index,
        passed: state.passed.filter(id => id !== card.id),
        skipped: state.skipped.filter(id => id !== card.id),
      };
    }
    case 'setFlag':
      return {
        ...state,
        cards: state.cards.map(card => (card.id === action.id ? {...card, [action.flag]: action.value} : card)),
      };
    case 'read':
      return state.read.includes(action.id) ? state : {...state, read: [...state.read, action.id]};
    case 'reset':
      return initialDeck;
  }
}

export const currentCard = (state: DeckState): DeckCard | null => state.cards[state.index] ?? null;
export const nextCard = (state: DeckState): DeckCard | null => state.cards[state.index + 1] ?? null;
export const previousCard = (state: DeckState): DeckCard | null => (state.index > 0 ? state.cards[state.index - 1]! : null);
/** Cards left, counting the one on top. */
export const remaining = (state: DeckState): number => Math.max(0, state.cards.length - state.index);
