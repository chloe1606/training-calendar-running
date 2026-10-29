import { describe, expect, it } from 'vitest';
import { createDefaultPlan } from './seed';
import { getWarnings } from './rules';
import { dayOffset, isHard, isRun, weekKey } from './model';
import { mainSetMiles, qualityDuration } from './quality';

describe('validated v2 app default', () => {
  it('shows Sunday-swap warnings rather than suppressing them and retains schema versions', () => {
    const plan = createDefaultPlan();
    expect(getWarnings(plan.workouts).map(w => ({ rule: w.rule, week: w.week }))).toEqual([
      { rule: 'long-share', week: '2027-03-01' },
      { rule: 'mileage-jump', week: '2027-03-15' },
    ]);
    expect(plan.marathonFinishesVersion).toBe(1);
    expect(plan.qualityVarietyVersion).toBe(1);
    expect(plan.settings.trainingZones.paceBoundaries).toEqual([8.9833, 7.7333, 6.9333, 6.5, 6.1]);
    expect(plan.settings.paceZones.threshold).toEqual({ min: 7.1667, max: 7.4167 });
    expect(plan.settings.defaultDays.badminton).toBe(2);
    expect(plan.settings.defaultDays.swim).toBe(0);
    expect(plan.workouts.every(w => !w.completed && w.id === `seed-${w.date}-${w.type}-${w.activity ?? ''}`)).toBe(true);
    expect(new Set(plan.workouts.map(w => w.date)).size).toBe(175);
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
    expect(qualityDuration(run, plan.settings)).toEqual({ min: 43, max: 45.25 });
  });
});
