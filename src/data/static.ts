/**
 * Placeholder content for the screens until the backend exists. Shapes are
 * close to what the API will return, so wiring it up is a swap, not a rewrite.
 */

export const COUNTIES = ['Kiambu', 'Murang’a', 'Nyeri', 'Nairobi', 'Nakuru', 'Kirinyaga'] as const;
export type County = (typeof COUNTIES)[number];

export type AlertStatus = 'new' | 'waiting' | 'sent';

export type Alert = {
  id: string;
  /** A county name; national alerts carry the county they are shown under. */
  county: string;
  topic: string;
  title: string;
  /** Plain-language summary, written with AI from the source. */
  summary: string;
  /** What the listener should actually do. */
  action: string;
  source: string;
  fetchedAt: string;
  /** Short relative time for the list. */
  ago: string;
  status: AlertStatus;
  /** Placeholder content shipped with the app, not from the server. */
  sample?: boolean;
  /** From a national publisher (ministry, Controller of Budget): shown under every county. */
  national?: boolean;
  /** The title and summary were written by a model. */
  aiGenerated?: boolean;
  /** The page the alert came from. */
  sourceUrl?: string;
};

/** Sample alerts, kept so the app has content before the watchers find anything. */
export const ALERTS: Alert[] = [
  {
    id: 'a1',
    county: 'Kiambu',
    topic: 'Budget',
    title: 'Kiambu County opens public participation on the 2026/27 budget',
    summary: 'Residents can give their views at ward meetings from 23 to 30 September. Bring your ID.',
    action: 'Go to your ward meeting between 23 and 30 September. Bring your ID.',
    source: 'kiambu.go.ke',
    fetchedAt: '19 Sep 2026',
    ago: '2 h ago',
    status: 'new',
  },
  {
    id: 'a2',
    county: 'Kiambu',
    topic: 'Farming',
    title: 'Dairy subsidy: applications open',
    summary: 'Registered dairy farmers can apply for subsidised feed until 10 October.',
    action: 'Apply at the ward agriculture office before 10 October with your co-op number.',
    source: 'kilimo.go.ke',
    fetchedAt: '18 Sep 2026',
    ago: '18 Sep',
    status: 'waiting',
  },
  {
    id: 'a3',
    county: 'Kiambu',
    topic: 'Jobs',
    title: '40 county jobs advertised',
    summary: 'Kiambu County is hiring health workers and ward administrators.',
    action: 'Apply online at kiambu.go.ke/careers before 30 September.',
    source: 'kiambu.go.ke',
    fetchedAt: '17 Sep 2026',
    ago: '17 Sep',
    status: 'sent',
  },
  {
    id: 'a4',
    county: 'Nyeri',
    topic: 'Bursaries',
    title: 'Nyeri ward bursary forms now available',
    summary: 'Secondary and college students can collect bursary forms at ward offices.',
    action: 'Collect a form at your ward office and return it by 15 October.',
    source: 'nyeri.go.ke',
    fetchedAt: '19 Sep 2026',
    ago: '5 h ago',
    status: 'new',
  },
];

export type Group = {id: string; county: County; name: string; people: number; language: string; initials: string};

export const GROUPS: Group[] = [
  {id: 'g1', county: 'Kiambu', name: 'Kiambu Farmers Network', people: 214, language: 'Gĩkũyũ', initials: 'KF'},
  {id: 'g2', county: 'Kiambu', name: 'Limuru Dairy Co-op', people: 161, language: 'Gĩkũyũ', initials: 'LD'},
  {id: 'g3', county: 'Kiambu', name: 'Lari Youth', people: 96, language: 'Gĩkũyũ', initials: 'LY'},
  {id: 'g4', county: 'Nyeri', name: 'Othaya Parents Group', people: 132, language: 'Gĩkũyũ', initials: 'OP'},
];

export type MessageKind = 'report' | 'answer';

export type Message = {
  id: string;
  county: County;
  from: string;
  initials: string;
  place: string;
  ago: string;
  kind: MessageKind;
  urgent: boolean;
  /** English translation of what was said. */
  text: string;
  language: string;
  duration: string;
  unread: boolean;
};

export const MESSAGES: Message[] = [
  {
    id: 'm1',
    county: 'Kiambu',
    from: 'Joseph K.',
    initials: 'JK',
    place: 'Lari',
    ago: '4 min ago',
    kind: 'report',
    urgent: true,
    text: 'The chief’s meeting was moved. Who will tell the people at Lari?',
    language: 'Gĩkũyũ',
    duration: '0:18',
    unread: true,
  },
  {
    id: 'm2',
    county: 'Kiambu',
    from: 'Grace W.',
    initials: 'GW',
    place: 'Limuru',
    ago: 'yesterday',
    kind: 'report',
    urgent: false,
    text: 'The milk price at the cooperative dropped again this week.',
    language: 'Gĩkũyũ',
    duration: '0:24',
    unread: true,
  },
  {
    id: 'm3',
    county: 'Kiambu',
    from: 'Peter N.',
    initials: 'PN',
    place: 'Githunguri',
    ago: '2 days ago',
    kind: 'answer',
    urgent: false,
    text: 'Yes, I will attend the budget meeting on Tuesday.',
    language: 'Gĩkũyũ',
    duration: '0:07',
    unread: false,
  },
];

export const LANGUAGES = ['Gĩkũyũ', 'Somali', 'Ateso'] as const;

export const APPROVER = {name: 'Wanjiru M.', initials: 'WM'};
