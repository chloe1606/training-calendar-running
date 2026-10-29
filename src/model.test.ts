import { describe, expect, it } from 'vitest';
import { durationMinutes, formatDuration, formatPace, parsePace, inUnits, fromUnits, paceInUnits, phaseForWeek, weekStats, weekKey } from './model';
import { createDefaultPlan } from './seed';

describe('pace calculations', () => {
  it('formats and parses minute-second pace', () => {
    expect(formatPace(9.25)).toBe('9:15');
    expect(formatPace(8 + 59.9 / 60)).toBe('9:00');
    expect(parsePace('7:30')).toBe(7.5);
    for (const invalid of ['7:60', '-1:30', 'fast', '0:00', '7:3']) expect(parsePace(invalid)).toBeNull();
  });
  it('converts distance and pace without changing duration', () => {
    expect(inUnits(1, 'km')).toBeCloseTo(1.609344);
    expect(fromUnits(inUnits(10, 'km'), 'km')).toBeCloseTo(10);
    expect(inUnits(10, 'km') * paceInUnits(9.5, 'km')).toBeCloseTo(95);
    expect(paceInUnits(8, 'mi')).toBe(8);
  });
  it('calculates both ends of a duration range', () => {
    expect(durationMinutes(10, { min: 9.25, max: 9.75 })).toEqual({ min: 92.5, max: 97.5 });
    expect(durationMinutes(0, { min: 9, max: 10 })).toEqual({ min: 0, max: 0 });
    expect(formatDuration(92.5)).toBe('1h 33m');
    expect(formatDuration(45)).toBe('45m');
    expect(formatDuration(59.6)).toBe('1h 00m');
  });
});
describe('default plan', () => {
  const plan = createDefaultPlan();
  it('provides 25 full Monday-Sunday weeks and exact mileage targets', () => {
    const weeks = [...new Set(plan.workouts.map(w => weekKey(w.date)))].sort();
    expect(weeks).toHaveLength(25);
    expect(weeks[0]).toBe('2026-10-26');
    expect(weeks[24]).toBe('2027-04-12');
    const expected = [25, 27.5, 25, 30, 32.5, 33, 35, 35, 36, 38, 39, 40, 34, 42, 44, 45, 46, 38, 38.9, 37.1, 46, 42, 36, 30, 42.2];
    expect(weeks.map(week => weekStats(plan.workouts.filter(w => weekKey(w.date) === week)).miles)).toEqual(expected);
    expect(new Set(plan.workouts.map(w => w.id)).size).toBe(plan.workouts.length);
  });
  it('seeds the seven prescribed base long runs', () => {
    const runs = plan.workouts.filter(w => w.type === 'long' && w.date <= '2026-12-13');
    expect(runs.map(w => w.distanceMiles)).toEqual([10, 11, 8, 12, 13, 10, 13]);
    expect(runs.every(w => w.paceMinPerMile.min === 9 && w.paceMinPerMile.max === 9.75 && w.hrCapBpm === 146)).toBe(true);
  });
  it('includes the rehearsal, peak long run, race and taper', () => {
    expect(plan.workouts.find(w => w.date === '2027-03-14' && w.type === 'race')?.distanceMiles).toBe(13.1);
    expect(plan.workouts.find(w => w.date === '2027-03-07' && w.type === 'long')?.distanceMiles).toBe(16);
    expect(plan.workouts.find(w => w.date === '2027-03-21' && w.type === 'long')?.distanceMiles).toBe(20);
    expect(plan.workouts.find(w => w.date === '2027-04-18' && w.type === 'race')?.distanceMiles).toBe(26.2);
    expect(phaseForWeek('2026-12-07')).toBe('Base');
    expect(phaseForWeek('2026-12-14')).toBe('Build');
    expect(phaseForWeek('2027-01-25')).toBe('Peak');
    expect(phaseForWeek('2027-03-29')).toBe('Taper');
  });
});
