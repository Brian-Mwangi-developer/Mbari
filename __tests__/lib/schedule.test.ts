/** @format */
import {describeDays, describeNext, toClock, toMinutes, zoneName} from '@/lib/schedule';

describe('schedule text', () => {
  it('names common day sets the way people say them', () => {
    expect(describeDays([1, 2, 3, 4, 5, 6, 7])).toBe('Every day');
    expect(describeDays([5, 4, 3, 2, 1])).toBe('Weekdays');
    expect(describeDays([6, 7])).toBe('Weekends');
    expect(describeDays([1, 3, 5])).toBe('Mon, Wed, Fri');
  });

  it('describes the next notification in the reader zone, not the phone clock', () => {
    const now = new Date('2026-09-16T18:00:00Z'); // 21:00 in Nairobi
    expect(describeNext('2026-09-16T18:30:00Z', 'Africa/Nairobi', now)).toBe('Today at 21:30');
    expect(describeNext('2026-09-17T04:42:00Z', 'Africa/Nairobi', now)).toBe('Tomorrow at 07:42');
    expect(describeNext('2026-09-19T04:42:00Z', 'Africa/Nairobi', now)).toBe('Sat at 07:42');
    // The same instant is still "today" in New York (14:00 local now).
    expect(describeNext('2026-09-17T01:00:00Z', 'America/New_York', now)).toBe('Today at 21:00');
    expect(describeNext(null, 'UTC', now)).toBeNull();
  });

  it('converts clock times and names zones', () => {
    expect(toMinutes('07:30')).toBe(450);
    expect(toClock(1440)).toBe('24:00');
    expect(toClock(-5)).toBe('00:00');
    expect(zoneName('America/Argentina/Buenos_Aires')).toBe('Buenos Aires');
  });
});
