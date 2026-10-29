import { describe, expect, it } from 'vitest';
import { DEFAULT_DAYS, SCHEDULE_TYPES, weekKey, weekStats } from './model';
import { applyDefaultDays, defaultWorkoutDate, scheduleLabel } from './schedule';
import { createDefaultPlan } from './seed';

describe('default activity weekdays', () => {
  it('suggests the right weekday within the selected Monday-Sunday week', () => {
    expect(defaultWorkoutDate('2026-11-01', 'crossTraining', 'swim')).toBe('2026-10-26');
    expect(defaultWorkoutDate('2026-10-26', 'crossTraining', 'strength')).toBe('2026-10-27');
    expect(defaultWorkoutDate('2026-10-26', 'threshold', undefined)).toBe('2026-10-29');
    expect(defaultWorkoutDate('2026-10-26', 'long', undefined)).toBe('2026-11-01');
  });
  it('keeps any-day activities, races and unspecified cross-training on the chosen date', () => {
    for (const type of ['easy', 'strides', 'rest', 'race', 'crossTraining'] as const) {
      expect(defaultWorkoutDate('2026-10-28', type, undefined)).toBe('2026-10-28');
    }
  });
  it('applies custom weekdays including Monday zero without modifying originals or mileage', () => {
    const { workouts } = createDefaultPlan();
    const days = { ...DEFAULT_DAYS, swim: 2 as const, strength: 0 as const, threshold: 1 as const };
    const moved = applyDefaultDays(workouts, days);
    expect(moved.find(w => w.id === 'seed-2026-10-26-crossTraining-swim')?.date).toBe('2026-10-28');
    expect(moved.find(w => w.id === 'seed-2026-11-06-crossTraining-strength')?.date).toBe('2026-11-06');
    expect(moved.find(w => w.id === 'seed-2026-11-05-threshold-')?.date).toBe('2026-11-03');
    expect(workouts[0].date).toBe('2026-10-26');
    workouts.forEach((w, index) => expect(weekKey(moved[index].date)).toBe(weekKey(w.date)));
    expect(weekStats(moved).miles).toBe(weekStats(workouts).miles);
  });
  it('never moves completed sessions or races and preserves custom workout details', () => {
    const { workouts } = createDefaultPlan();
    workouts[0].completed = true;
    const moved = applyDefaultDays(workouts, { ...DEFAULT_DAYS, swim: 4, long: 0 });
    expect(moved[0]).toEqual(workouts[0]);
    expect(moved.filter(w => w.type === 'race')).toEqual(workouts.filter(w => w.type === 'race'));
    const long = workouts.find(w => w.type === 'long')!;
    expect(moved.find(w => w.id === long.id)).toEqual({ ...long, date: '2026-10-26' });
  });
  it('provides a display label for every configurable activity', () => {
    SCHEDULE_TYPES.forEach(type => expect(scheduleLabel(type).length).toBeGreaterThan(0));
    expect(scheduleLabel('threshold')).toBe('Threshold');
    expect(scheduleLabel('swim')).toBe('Swim');
  });
});
