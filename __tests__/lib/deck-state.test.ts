/** @format */
import type {DeckCard, TodayDeck} from '@/api';
import {currentCard, deckReducer, initialDeck, previousCard, remaining} from '@/lib/deck-state';

const card = (id: string, position: number, overrides: Partial<DeckCard> = {}): DeckCard => ({
  id,
  pickId: `pick_${id}`,
  position,
  source: 'The Mwango Weekly',
  author: null,
  title: `Title ${id}`,
  why: `Why ${id}`,
  excerpt: null,
  readMinutes: 8,
  url: 'https://example.com',
  publishedAt: '2026-09-15T06:00:00Z',
  topics: [],
  liked: false,
  saved: false,
  state: 'served',
  ...overrides,
});

const stats = {library: 41, unread: 0, read: 8, passed: 3, comingBack: 0, waitingSenders: 0};
const deck = (cards: DeckCard[], overrides: Partial<TodayDeck> = {}): TodayDeck => ({
  dayKey: '2026-09-15',
  cards,
  exhausted: cards.length ? null : 'caught_up',
  stats,
  ...overrides,
});

describe('deck state', () => {
  it('passes forward and comes back to a passed card in the same session', () => {
    let state = deckReducer(initialDeck, {type: 'loaded', deck: deck([card('a', 0), card('b', 1)])});
    state = deckReducer(state, {type: 'pass'});
    expect(currentCard(state)?.id).toBe('b');
    expect(state.passed).toEqual(['a']);

    state = deckReducer(state, {type: 'back'});
    expect(currentCard(state)?.id).toBe('a');
    expect(state.passed).toEqual([]);
    expect(previousCard(state)).toBeNull();
  });

  it('moves on with next without passing, and remembers it for coming back', () => {
    let state = deckReducer(initialDeck, {type: 'loaded', deck: deck([card('a', 0), card('b', 1)])});
    state = deckReducer(state, {type: 'skip'});
    expect(currentCard(state)?.id).toBe('b');
    expect(state.passed).toEqual([]);
    expect(state.skipped).toEqual(['a']);

    state = deckReducer(state, {type: 'back'});
    expect(currentCard(state)?.id).toBe('a');
    expect(state.skipped).toEqual([]);
  });

  it('keeps the session history and takes the server order for everything ahead', () => {
    let state = deckReducer(initialDeck, {type: 'loaded', deck: deck([card('a', 0), card('b', 1), card('c', 2), card('d', 3)])});
    state = deckReducer(state, {type: 'skip'});
    // On "b" now. The server re-ranked what is behind it: d before c, plus a new e.
    state = deckReducer(state, {type: 'loaded', deck: deck([card('b', 1), card('d', 3), card('c', 2), card('e', 4)])});
    expect(state.cards.map(c => c.id)).toEqual(['a', 'b', 'd', 'c', 'e']);
    expect(currentCard(state)?.id).toBe('b');
    expect(remaining(state)).toBe(4);

    state = deckReducer(state, {type: 'back'});
    expect(currentCard(state)?.id).toBe('a');
  });

  it('does not show a card twice while its signal is still on the way', () => {
    let state = deckReducer(initialDeck, {type: 'loaded', deck: deck([card('a', 0), card('b', 1)])});
    state = deckReducer(state, {type: 'pass'});
    state = deckReducer(state, {type: 'loaded', deck: deck([card('a', 0), card('b', 1), card('c', 2)])});
    expect(state.cards.map(c => c.id)).toEqual(['a', 'b', 'c']);
  });

  it('shows an article dealt again later as a new card', () => {
    let state = deckReducer(initialDeck, {type: 'loaded', deck: deck([card('a', 0), card('b', 1)])});
    state = deckReducer(state, {type: 'skip'});
    state = deckReducer(state, {type: 'skip'});
    state = deckReducer(state, {type: 'loaded', deck: deck([card('a', 9)])});
    expect(state.cards.map(c => `${c.id}:${c.position}`)).toEqual(['a:0', 'b:1', 'a:9']);
  });

  it('records why the queue is empty', () => {
    const state = deckReducer(initialDeck, {type: 'loaded', deck: deck([])});
    expect(state.exhausted).toBe('caught_up');
    expect(state.stats?.library).toBe(41);
  });

  it('keeps a like made on the card when fresher copies arrive', () => {
    let state = deckReducer(initialDeck, {type: 'loaded', deck: deck([card('a', 0)])});
    state = deckReducer(state, {type: 'setFlag', id: 'a', flag: 'liked', value: true});
    state = deckReducer(state, {type: 'loaded', deck: deck([card('a', 0, {liked: false})])});
    expect(state.cards[0]!.liked).toBe(true);
  });
});
