/**
 * Wire types. These mirror the backend responses and are deliberately the same
 * shapes the UI components already consumed from `data/mock.ts`, so screens did
 * not have to change when the real data arrived.
 */

/** One card in the Today deck. `id` is the article id the reader opens and signals against. */
export type DeckCard = {
  id: string;
  pickId: string;
  /** Where it sits in the reader's rolling queue. */
  position: number;
  source: string;
  author: string | null;
  title: string;
  why: string;
  excerpt: string | null;
  readMinutes: number;
  url: string;
  publishedAt: string;
  /** Up to two topic labels, e.g. "Tech strategy". */
  topics: string[];
  liked: boolean;
  saved: boolean;
  state: ItemState;
};

/** What the reader's library holds, so an empty queue can say why. */
export type DeckStats = {
  library: number;
  /** Unread from followed sources, not yet dealt. */
  unread: number;
  read: number;
  passed: number;
  /** Moved past with "next"; dealt again after a short cooldown. */
  comingBack: number;
  /** Unread issues from newsletter senders not kept yet. */
  waitingSenders: number;
};

/** The rolling queue of recommendations. */
export type TodayDeck = {
  dayKey: string;
  /** Cards not yet read, passed or moved past, in order. */
  cards: DeckCard[];
  /** "caught_up" when there is nothing left to recommend right now. */
  exhausted: 'caught_up' | null;
  stats: DeckStats;
};

export type SignalType = 'open' | 'close' | 'pass' | 'skip' | 'return' | 'like' | 'unlike' | 'save' | 'unsave';

export type SignalBody = {
  type: SignalType;
  /** Card on screen before this, in ms. */
  dwellMs?: number;
  /** Reader progress on close, 0..1. */
  progress?: number;
  /** Foreground reading time for this open, in ms. */
  readMs?: number;
  position?: number;
  clientEventId?: string;
};

export type SignalResult = {
  state: ItemState;
  liked: boolean;
  saved: boolean;
  duplicate: boolean;
};

export type ClientEvent = {
  type: 'card_view' | 'play_tapped' | 'deck_exhausted' | 'deck_opened';
  itemId?: string;
  position?: number;
  dwellMs?: number;
  clientEventId: string;
  occurredAt: string;
};

export type InterestTopic = {slug: string; label: string};

export type ReaderInterests = {
  stated: string[];
  statedTopics: InterestTopic[];
  noticed: (InterestTopic & {trend: 'rising' | 'steady'; since: string})[];
  lately: InterestTopic[];
  suggestions: InterestTopic[];
};

export type ArchiveItem = {
  id: string;
  /** ISO date the pick was surfaced. */
  date: string;
  source: string;
  title: string;
  /** Whether the user opened it. Unread picks stay bright in the list. */
  read: boolean;
};

/** Where an article got to for this user. */
export type ItemState = 'candidate' | 'served' | 'opened' | 'finished' | 'dismissed';

/** One article in the user's own library — something that actually reached them. */
export type LibraryItem = {
  id: string;
  source: string;
  kind: 'email' | 'rss';
  title: string;
  author: string | null;
  excerpt: string | null;
  readMinutes: number;
  /** ISO timestamps. */
  publishedAt: string;
  pulledAt: string;
  state: ItemState;
  liked: boolean;
  saved: boolean;
};

export type SavedItem = LibraryItem & {savedAt: string | null};

export type LibraryPage = {
  items: LibraryItem[];
  /** Pass back to fetch the next page; null on the last one. */
  nextCursor: string | null;
};

/** A pick the user skipped, or never opened before a newer one replaced it. */
export type PassedOverItem = LibraryItem & {
  reason: 'dismissed' | 'unopened';
  servedAt: string | null;
};

/** A run of text inside a paragraph; `highlight` marks the agent's key line. */
export type Segment = {text: string; highlight?: boolean};

export type Article = {
  id: string;
  source: string;
  author: string | null;
  title: string;
  readMinutes: number;
  url: string;
  liked?: boolean;
  saved?: boolean;
  body: Segment[][];
};

export type Feed = {
  id: string;
  name: string;
  /** How the feed reaches us: a newsletter sender or an RSS URL. */
  kind: 'email' | 'rss';
  /** Muted feeds stay subscribed but are excluded from ranking. */
  muted: boolean;
};

export type Role = 'member' | 'ngo' | 'admin';

export type Organization = {id: string; name: string; slug: string; county: string | null};

export type Account = {
  id: string;
  name: string;
  email: string;
  image: string | null;
  onboardingDone: boolean;
  role: Role;
  organization: Organization | null;
  /** Counties followed; empty follows every county. */
  counties: string[];
  /** Topics followed; empty follows every topic. */
  topics: string[];
  timezone: string;
  interests: string[];
  /** Days an unread article stays in the library after it arrives. */
  unreadExpiryDays: UnreadExpiryDays;
};

export type UnreadExpiryDays = 14 | 30;

/** A mailbox asking to auto-forward into the user's Mbari address. */
export type ForwardingRequest = {
  id: string;
  provider: 'gmail' | string;
  /** The mailbox that asked, e.g. reader@gmail.com. */
  requestedBy: string;
  receivedAt: string;
  /** Null until the user chooses Confirm in the app. */
  confirmedAt: string | null;
};

export type InboxAddress = {
  /** e.g. brian-7f3a@in.mbari.com */
  address: string;
  localPart: string;
  domain: string;
  forwarding: ForwardingRequest | null;
};

/** A sender discovered from inbound mail, waiting to be kept or ignored. */
export type PendingSource = {
  id: string;
  name: string;
  kind: 'email' | 'rss';
  fromAddress: string | null;
  issues: number;
  latestTitle: string | null;
  latestAt: string;
};

export type GmailFilterMode = 'newsletters' | 'approved';

/** A stretch of the reader's day when a recommendation may be pushed, in their timezone. */
export type DeliveryWindow = {
  id?: string;
  label: string;
  /** "07:30" */
  start: string;
  /** "08:30", or "24:00" for midnight. */
  end: string;
  /** 1 = Monday … 7 = Sunday. */
  days: number[];
  enabled: boolean;
};

export type SavedDeliveryWindow = DeliveryWindow & {
  id: string;
  /** ISO time it next fires, when it will. */
  nextAt: string | null;
};

export type DeliverySettings = {
  timezone: string;
  notificationsEnabled: boolean;
  /** At most this many notifications a day, 1–3. */
  perDay: number;
  windows: SavedDeliveryWindow[];
  nextNotificationAt: string | null;
  /** Whether the server can send pushes, and how many of this reader's devices can receive them. */
  push: {configured: boolean; devices: number};
};

export type TestNotificationResult =
  | {status: 'sent' | 'dry_run'; deliveryId: string; itemId: string; devices: number}
  | {status: 'skipped' | 'failed'; deliveryId: string | null; reason: string};

/** A ready-made demo login, from GET /api/v1/demo. */
export type DemoAccount = {
  app: 'web' | 'mobile';
  label: string;
  name: string;
  email: string;
  password: string;
  role: Role;
};

export type DemoInfo = {enabled: boolean; organization?: string; accounts: DemoAccount[]};

/** An alert as GET /api/v1/alerts returns it. */
export type WireAlert = {
  id: string;
  county: string | null;
  topic: string;
  title: string;
  summary: string;
  action: string | null;
  status: 'new' | 'waiting' | 'sent' | 'dismissed';
  aiGenerated: boolean;
  createdAt: string;
  provenance: {
    sourceId: string | null;
    sourceName: string | null;
    url: string;
    domain: string;
    fetchedAt: string;
    contentHash: string;
    summarizer: string;
  };
};

export type AlertPage = {items: WireAlert[]; nextCursor: string | null};

/** What an alert rests on, from GET /api/v1/alerts/:id/evidence. */
export type AlertEvidence = {
  sourceName: string;
  pageTitle: string | null;
  /** The exact page Firecrawl read. */
  url: string;
  fetchedAt: string;
  previousCheckAt: string | null;
  changeStatus: 'new' | 'same' | 'changed' | 'removed';
  /** sha256 of the page as fetched. */
  contentHash: string;
  aiGenerated: boolean;
  summarizer: string;
  /** Text the latest change put on the page. */
  added: string[];
  /** Lines of the page that match the summary, in page order, each with the link it carries. */
  quotes: {text: string; url: string | null}[];
  /** The notice itself (often a PDF) when the page links to it; null when `url` is the closest link. */
  itemUrl: string | null;
};

/** Where a voice message is in "Translate to Gĩkũyũ". */
export type VoiceStatus = 'queued' | 'transcribing' | 'polishing' | 'translating' | 'speaking' | 'ready' | 'failed';

/** A recording and its machine translation, from /api/v1/voice. Audio URLs are signed paths on the API. */
export type VoiceMessage = {
  id: string;
  alertId: string | null;
  status: VoiceStatus;
  error: string | null;
  targetLanguage: string;
  targetLanguageName: string;
  recording: {url: string; durationMs: number};
  /** What Whisper heard, in English. */
  transcript: string | null;
  spokenLanguage: string | null;
  /** The transcript tidied for translation (or as heard). */
  english: string | null;
  translation: string | null;
  audio: {url: string; durationMs: number | null} | null;
  madeBy: {transcript: string | null; english: string | null; translation: string | null; voice: string | null};
  createdAt: string;
  completedAt: string | null;
};
