import { describe, expect, it } from 'vitest';
import { exportICS } from './files';
import { createDefaultPlan } from './seed';

describe('calendar export', () => {
  it('exports every workout as an all-day event with exclusive end dates', () => {
    const plan = createDefaultPlan();
    const ics = exportICS(plan, new Date('2026-10-29T09:00:00Z'));
    expect(ics.match(/BEGIN:VEVENT/g)).toHaveLength(plan.workouts.length);
    expect(ics).toContain('DTSTAMP:20261029T090000Z\r\n');
    expect(ics).toContain('DTSTART;VALUE=DATE:20270418\r\nDTEND;VALUE=DATE:20270419');
    expect(ics).toContain('UID:seed-2027-04-18-race-@marathon-planner.local');
    expect(ics.endsWith('END:VCALENDAR\r\n')).toBe(true);
    expect(ics.replace(/\r\n/g, '')).not.toContain('\n');
    const unfolded = ics.replace(/\r\n /g, '');
    expect(unfolded).toContain('Pace Z1\\; HR Z2: 118–146 bpm');
    expect(unfolded).toContain('HR Z4: 161–175 bpm');
  });
  it('escapes descriptions and folds long Unicode lines to 75 UTF-8 bytes', () => {
    const plan = createDefaultPlan();
    plan.workouts = [{ ...plan.workouts[0], notes: 'Long, notes; with\\punctuation\n' + 'é'.repeat(100) }];
    const ics = exportICS(plan);
    const unfolded = ics.replace(/\r\n /g, '');
    expect(unfolded).toContain('Long\\, notes\\; with\\\\punctuation\\n');
    expect(unfolded).toContain('é'.repeat(100));
    for (const line of ics.split('\r\n')) expect(new TextEncoder().encode(line).length).toBeLessThanOrEqual(75);
  });
});
