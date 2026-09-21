import type {WireAlert} from '@/api';
import {formatAgo, toAlert} from '@/lib/alerts';

const NOW = Date.parse('2026-09-21T12:00:00Z');

const wire = (over: Partial<WireAlert> = {}): WireAlert => ({
  id: 'a1',
  county: 'Kiambu',
  topic: 'Jobs',
  title: 'Job vacancies for medical specialists',
  summary: 'Kiambu County is hiring medical specialists.',
  action: null,
  status: 'new',
  aiGenerated: true,
  createdAt: '2026-09-21T10:00:00Z',
  provenance: {
    sourceId: 's1',
    sourceName: 'Kiambu County Jobs',
    url: 'https://kiambu.go.ke/career-jobs/',
    domain: 'kiambu.go.ke',
    fetchedAt: '2026-09-21T09:55:00Z',
    contentHash: 'abc',
    summarizer: 'firecrawl-json',
  },
  ...over,
});

test('maps a server alert to what the Home screen renders, with its provenance', () => {
  expect(toAlert(wire(), 'Kiambu', NOW)).toMatchObject({
    id: 'a1',
    county: 'Kiambu',
    national: false,
    source: 'kiambu.go.ke',
    sourceUrl: 'https://kiambu.go.ke/career-jobs/',
    fetchedAt: '21 Sep 2026',
    ago: '2 h ago',
    status: 'new',
    aiGenerated: true,
    action: 'Open the source link for full details.',
  });
});

test('a national alert shows under the county being viewed', () => {
  expect(toAlert(wire({county: null}), 'Nyeri', NOW)).toMatchObject({county: 'Nyeri', national: true});
});

test('dismissed alerts are not shown', () => {
  expect(toAlert(wire({status: 'dismissed'}), 'Kiambu', NOW)).toBeNull();
});

test('relative times', () => {
  expect(formatAgo('2026-09-21T11:59:40Z', NOW)).toBe('just now');
  expect(formatAgo('2026-09-21T11:48:00Z', NOW)).toBe('12 min ago');
  expect(formatAgo('2026-09-18T08:00:00Z', NOW)).toBe('18 Sep');
});
