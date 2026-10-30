import { describe, expect, it } from 'vitest';
import { createDefaultPlan } from './seed';
import { getWarnings } from './rules';
import { dayOffset, isHard, isRun, weekKey } from './model';
import { mainSetMiles, qualityDuration } from './quality';

describe('validated v2 app default', () => {
  it('has a gradual build without unapproved warnings and retains schema versions', () => {
    const plan = createDefaultPlan();
    expect(getWarnings(plan.workouts)).toEqual([]);
    expect(plan.marathonFinishesVersion).toBe(1);
    expect(plan.qualityVarietyVersion).toBe(1);
    expect(plan.settings.trainingZones.paceBoundaries).toEqual([8.9833, 7.7333, 6.9333, 6.5, 6.1]);
    expect(plan.settings.paceZones.threshold).toEqual({ min: 7.1667, max: 7.4167 });
    expect(plan.settings.paceZones.marathonPace).toEqual({ min: 7 + 50 / 60, max: 8 + 10 / 60 });
    expect(plan.workouts.filter(w => w.type === 'marathonPace' || w.type === 'race' && w.date === '2027-04-18')
      .every(w => w.paceMinPerMile.min === 7 + 50 / 60 && w.paceMinPerMile.max === 8 + 10 / 60)).toBe(true);
    expect(plan.settings.defaultDays.badminton).toBe(2);
    expect(plan.settings.defaultDays.swim).toBe(0);
    expect(plan.workouts.every(w => !w.completed && w.id === `seed-${w.date}-${w.type}-${w.activity ?? ''}`)).toBe(true);
    expect(new Set(plan.workouts.map(w => w.date)).size).toBe(175);
  });
  it('protects the half, conditional 20-miler and both MP-finish weeks', () => {
    const plan = createDefaultPlan();
    const half = plan.workouts.find(w => w.date === '2027-03-14' && w.type === 'race')!;
    expect(half.distanceMiles).toBe(13.1);
    expect(half.paceMinPerMile).toEqual({ min: 7 + 20 / 60, max: 7.5 });
    expect(half.notes).toContain('target 7:20-7:30/mi');
    expect(half.notes).toContain('prioritise recovery');
    expect(plan.settings.goalTime).toBe('3:30:00');
    for (const date of ['2027-03-11', '2027-03-18']) {
      const run = plan.workouts.find(w => w.date === date && isRun(w))!;
      expect(run.type).toBe('easy');
      expect(mainSetMiles(run)).toBe(0);
      expect(isHard(run)).toBe(false);
    }
    const peak = plan.workouts.find(w => w.date === '2027-03-21' && w.type === 'long')!;
    expect(peak.distanceMiles).toBe(20);
    expect(peak.marathonFinish).toBeUndefined();
    expect(peak.notes).toContain('shorten to 16-18');
    expect(plan.workouts.find(w => w.date === '2027-03-25' && isRun(w))?.type).toBe('marathonPace');
    expect(plan.workouts.filter(w => w.type === 'long' && w.marathonFinish).map(w => w.marathonFinish?.distanceMiles)).toEqual([4, 6]);
    expect(plan.workouts.filter(w => w.date >= '2027-03-29' && new Date(`${w.date}T12:00:00`).getDay() === 6 && isRun(w)).every(w => !isHard(w))).toBe(true);
  });
  it('schedules exactly two hard days in normal weeks and protects lighter weeks', () => {
    const plan = createDefaultPlan();
    const lighter = new Set(['2026-11-09', '2026-11-30', '2026-12-28', '2027-01-18', '2027-02-22',
      '2027-03-08', '2027-03-15', '2027-03-29', '2027-04-05', '2027-04-12']);
    const finishes = new Set(['2027-01-25', '2027-02-08']);
    for (let i = 0; i < 25; i++) {
      const monday = dayOffset('2026-10-26', i * 7);
      const items = plan.workouts.filter(w => weekKey(w.date) === monday);
      const hardDays = [...new Set(items.filter(isHard).map(w => w.date))].sort();
      if (!lighter.has(monday)) {
        expect(hardDays).toEqual((finishes.has(monday) ? [3, 6] : [1, 3]).map(n => dayOffset(monday, n)));
      } else if (i !== 24) {
        expect(hardDays.length).toBeLessThanOrEqual(1);
      }
      for (const w of items.filter(isHard)) {
        expect(plan.workouts.some(x => x.date === dayOffset(w.date, 1) && isHard(x))).toBe(false);
        if (w.date === dayOffset(monday, 1)) {
          expect(mainSetMiles(w)).toBeGreaterThan(0);
          expect(w.notes).toContain('Cool-down: 1 mi easy');
          expect(w.hrCapBpm).toBeUndefined();
        }
      }
    }
    for (const date of ['2027-01-26', '2027-02-09']) {
      expect(plan.workouts.find(w => w.date === date && isRun(w))?.type).toBe('easy');
    }
  });
  it('keeps recovery days, race-week details and alternating Pilates', () => {
    const plan = createDefaultPlan();
    for (const w of plan.workouts.filter(w => w.type === 'long')) {
      expect(plan.workouts.some(x => x.date === dayOffset(w.date, -1) && isHard(x))).toBe(false);
    }
    expect(plan.workouts.filter(w => w.activity === 'badminton').every(w => w.date < '2027-04-12')).toBe(true);
    expect(plan.workouts.filter(w => w.activity === 'strength').every(w => w.date <= '2027-04-06')).toBe(true);
    const raceWeek = plan.workouts.filter(w => weekKey(w.date) === '2027-04-12');
    expect(raceWeek.filter(isRun).map(w => w.distanceMiles)).toEqual([5, 4, 5, 2, 26.2]);
    expect(raceWeek.some(w => w.date === '2027-04-14' && w.activity === 'swim')).toBe(true);
    expect(raceWeek.some(w => w.date === '2027-04-16' && w.type === 'rest')).toBe(true);
    expect(plan.workouts.filter(w => w.activity === 'pilates' && w.date <= '2027-04-06')).toHaveLength(12);
  });
  it('returns independent defaults without sharing settings or workout objects', () => {
    const first = createDefaultPlan();
    first.workouts[0].notes = 'changed';
    first.settings.trainingZones.paceBoundaries[0] = 15;
    expect(createDefaultPlan().workouts[0].notes).not.toBe('changed');
    expect(createDefaultPlan().settings.trainingZones.paceBoundaries[0]).toBe(8.9833);
  });
  it('estimates Thursday duration using easy portions, not five miles all at MP', () => {
    const plan = createDefaultPlan();
    const run = plan.workouts.find(w => w.date === '2027-04-15' && isRun(w))!;
    expect(mainSetMiles(run)).toBe(2);
    expect(qualityDuration(run, plan.settings).min).toBeCloseTo(27 + 2 * (7 + 50 / 60));
    expect(qualityDuration(run, plan.settings).max).toBeCloseTo(29.25 + 2 * (8 + 10 / 60));
  });
});
