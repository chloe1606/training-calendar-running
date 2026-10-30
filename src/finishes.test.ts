import { describe, expect, it } from 'vitest';
import { addMarathonFinishes, MARATHON_FINISHES } from './finishes';
import { createDefaultPlan } from './seed';
import { isHard, workoutDuration, weekStats } from './model';
import { getWarnings } from './rules';
import { exportICS } from './files';

describe('marathon-pace long-run finishes', () => {
  it('keeps exactly the two v2 sessions without changing key events', () => {
    const plan = createDefaultPlan();
    expect(plan.workouts.filter(w => w.marathonFinish)).toHaveLength(2);
    for (const session of MARATHON_FINISHES) {
      const run = plan.workouts.find(w => w.date === session.date && w.type === 'long')!;
      expect(run.distanceMiles).toBe(session.distance);
      expect(run.marathonFinish).toEqual({ distanceMiles: session.finish, paceMinPerMile: { min: 7 + 50 / 60, max: 8 + 10 / 60 } });
      expect(isHard(run)).toBe(true);
    }
    expect(plan.workouts.find(w => w.date === '2027-03-21' && w.type === 'long')?.marathonFinish).toBeUndefined();
    expect(plan.workouts.find(w => w.date === '2027-03-14' && w.type === 'race')?.distanceMiles).toBe(13.1);
    expect(addMarathonFinishes(plan)).toBe(plan);
  });
  it('calculates durations from the easy and fast portions and counts a hard day', () => {
    const plan = createDefaultPlan();
    const run = plan.workouts.find(w => w.date === '2027-02-14' && w.type === 'long')!;
    expect(workoutDuration(run)).toEqual({ min: 12 * 9 + 6 * (7 + 50 / 60), max: 12 * 9.75 + 6 * (8 + 10 / 60) });
    expect(weekStats([run]).hardDays).toBe(1);
    const saturday = { ...run, id: 'sat', date: '2027-02-13', marathonFinish: undefined, type: 'parkrun' as const, paceMinPerMile: { min: 8.5, max: 9 } };
    const rules = getWarnings([saturday, run]).map(w => w.rule);
    expect(rules).toContain('consecutive-hard');
    expect(rules).toContain('before-long');
    const ics = exportICS({ ...plan, workouts: [run] }).replace(/\r\n /g, '');
    expect(ics).toContain('last 6.00 mi at 7:50–8:10/mi');
    expect(ics).toContain('Finish HR: 147–160 bpm');
  });
  it('does not reapply removed finishes or alter completed, moved, deleted or resized workouts', () => {
    const plan = createDefaultPlan();
    const cleared = { ...plan, workouts: plan.workouts.map(w => ({ ...w, marathonFinish: undefined })) };
    expect(addMarathonFinishes(cleared)).toBe(cleared);
    const legacy = { ...cleared, marathonFinishesVersion: undefined };
    legacy.workouts = legacy.workouts.map(w => w.date === '2027-01-31' ? { ...w, completed: true }
      : w.date === '2027-02-14' ? { ...w, distanceMiles: 12 } : w);
    expect(addMarathonFinishes(legacy).workouts.some(w => w.marathonFinish)).toBe(false);
  });
});
