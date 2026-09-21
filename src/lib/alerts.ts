import type {WireAlert} from '@/api';
import type {Alert} from '@/data/static';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** "19 Sep 2026", by hand so it doesn't depend on the device's ICU data. */
export function formatFetched(iso: string): string {
  const d = new Date(iso);
  return `${d.getDate()} ${MONTHS[d.getMonth()]} ${d.getFullYear()}`;
}

/** "just now", "12 min ago", "2 h ago", then "18 Sep". */
export function formatAgo(iso: string, now = Date.now()): string {
  const d = new Date(iso);
  const minutes = Math.floor((now - d.getTime()) / 60_000);
  if (minutes < 1) {
    return 'just now';
  }
  if (minutes < 60) {
    return `${minutes} min ago`;
  }
  if (minutes < 24 * 60) {
    return `${Math.floor(minutes / 60)} h ago`;
  }
  return `${d.getDate()} ${MONTHS[d.getMonth()]}`;
}

/**
 * A server alert in the shape the screens render. Dismissed alerts are not
 * shown. A national alert is placed under the county being viewed.
 */
export function toAlert(wire: WireAlert, county: string, now = Date.now()): Alert | null {
  if (wire.status === 'dismissed') {
    return null;
  }
  return {
    id: wire.id,
    county: wire.county ?? county,
    national: wire.county === null,
    topic: wire.topic,
    title: wire.title,
    summary: wire.summary,
    action: wire.action ?? 'Open the source link for full details.',
    source: wire.provenance.domain,
    sourceUrl: wire.provenance.url,
    fetchedAt: formatFetched(wire.provenance.fetchedAt),
    ago: formatAgo(wire.createdAt, now),
    status: wire.status,
    aiGenerated: wire.aiGenerated,
  };
}

/** "21 Sep 2026, 14:57" in the phone's own time zone. */
export function formatFetchedTime(iso: string): string {
  const d = new Date(iso);
  const hh = String(d.getHours()).padStart(2, '0');
  const mm = String(d.getMinutes()).padStart(2, '0');
  return `${formatFetched(iso)}, ${hh}:${mm}`;
}

/** "a9f31977…3662": enough of a sha256 to compare by eye. */
export function shortHash(hash: string): string {
  return hash.length > 16 ? `${hash.slice(0, 8)}…${hash.slice(-4)}` : hash;
}
