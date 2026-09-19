/**
 * How delivery windows read on screen. Times are the reader's local times, in
 * the timezone the server schedules them in.
 */

const DAY_SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
export const DAY_INITIALS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

/** "Every day", "Weekdays", "Weekends", or "Mon, Wed, Fri". */
export function describeDays(days: number[]): string {
  const set = [...new Set(days)].filter(d => d >= 1 && d <= 7).sort((a, b) => a - b);
  if (set.length === 7) {
    return 'Every day';
  }
  if (set.length === 5 && set.every((d, i) => d === i + 1)) {
    return 'Weekdays';
  }
  if (set.length === 2 && set[0] === 6 && set[1] === 7) {
    return 'Weekends';
  }
  if (set.length === 0) {
    return 'No days';
  }
  return set.map(d => DAY_SHORT[d - 1]).join(', ');
}

/** "07:30" ↔ 450. */
export function toMinutes(clock: string): number {
  const [h, m] = clock.split(':').map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
}

export function toClock(minutes: number): string {
  const clamped = Math.max(0, Math.min(1440, minutes));
  return `${String(Math.floor(clamped / 60)).padStart(2, '0')}:${String(clamped % 60).padStart(2, '0')}`;
}

/** "07:30 – 08:30", with midnight written as 24:00 so the order reads right. */
export function describeRange(start: string, end: string): string {
  return `${start} – ${end}`;
}

/**
 * When the next notification is due, in the reader's timezone: "Today at
 * 20:50", "Tomorrow at 07:42", or "Thu at 07:42".
 */
export function describeNext(iso: string | null, timeZone: string, now: Date = new Date()): string | null {
  if (!iso) {
    return null;
  }
  const at = new Date(iso);
  const day = (date: Date) =>
    new Intl.DateTimeFormat('en-CA', {timeZone, year: 'numeric', month: '2-digit', day: '2-digit'}).format(date);
  const time = new Intl.DateTimeFormat('en-GB', {timeZone, hour: '2-digit', minute: '2-digit', hourCycle: 'h23'}).format(at);
  const tomorrow = new Date(now.getTime() + 86_400_000);
  if (day(at) === day(now)) {
    return `Today at ${time}`;
  }
  if (day(at) === day(tomorrow)) {
    return `Tomorrow at ${time}`;
  }
  const weekday = new Intl.DateTimeFormat('en-GB', {timeZone, weekday: 'short'}).format(at);
  return `${weekday} at ${time}`;
}

/** The phone's own timezone, e.g. "Africa/Nairobi". */
export function deviceTimeZone(): string | null {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || null;
  } catch {
    return null;
  }
}

/** "Africa/Nairobi" → "Nairobi"; "America/Argentina/Buenos_Aires" → "Buenos Aires". */
export function zoneName(timeZone: string): string {
  return (timeZone.split('/').pop() ?? timeZone).replace(/_/g, ' ');
}
