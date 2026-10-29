import { describe, expect, it } from 'vitest';
import { createDefaultPlan } from './seed';
import { scheduleStrength, strengthNotes, STRENGTH_ROUTINES } from './strength';
import { dayOffset, PLAN_START, weekKey, weekStats } from './model';

describe('twice weekly strength', () => {
  it('seeds main Tuesday and light Friday sessions until 6 April without changing mileage', () => {
    const plan = createDefaultPlan();
    const sessions = plan.workouts.filter(w => w.activity === 'strength');
    expect(sessions).toHaveLength(47);
    for (const week of new Set(sessions.map(w => weekKey(w.date)))) {
      expect(sessions.filter(w => weekKey(w.date) === week)).toHaveLength(week === '2027-04-05' ? 1 : 2);
    }
    expect(sessions[0].date).toBe('2026-10-27');
    expect(sessions[1].date).toBe('2026-10-30');
    expect(weekStats(sessions).miles).toBe(0);
    expect(sessions[0].notes).toContain('Single-leg calf raises: 2 sets x 12 reps');
    expect(sessions[1].notes).toContain('No heavy leg work');
    expect(sessions.every(w => w.date <= '2027-04-06')).toBe(true);
    expect(scheduleStrength(plan, [1, 4], true)).toEqual(plan.workouts);
  });
  it('moves incomplete sessions only, preserves notes and never duplicates completed sessions', () => {
    const plan = createDefaultPlan();
    const first = plan.workouts.find(w => w.activity === 'strength')!;
    first.completed = true;
    first.notes = 'My custom routine';
    const moved = scheduleStrength(plan, [0, 3], true);
    expect(moved.find(w => w.id === first.id)).toEqual(first);
    expect(moved.filter(w => w.activity === 'strength')).toHaveLength(47);
    expect(moved.find(w => w.id === 'seed-2026-10-30-crossTraining-strength')?.date).toBe('2026-10-26');
    expect(first.date).toBe('2026-10-27');
  });
  it('fills missing slots and adds lighter taper and race-week guidance', () => {
    const plan = createDefaultPlan();
    plan.workouts = plan.workouts.filter(w => w.activity !== 'strength');
    const workouts = scheduleStrength(plan, [1, 4], true);
    expect(workouts.filter(w => w.activity === 'strength')).toHaveLength(47);
    expect(strengthNotes(0, '2027-03-29', plan.settings.raceDate)).toContain('1 easy set');
    expect(strengthNotes(1, '2027-04-12', plan.settings.raceDate)).toContain('not loaded strength');
  });
  it('gives exact rests and reduces actual prescriptions during taper', () => {
    const main = strengthNotes(0, '2027-02-01', '2027-04-18');
    expect(main).toContain('75 s between sets');
    expect(main).toContain('90 s between sets');
    const light = strengthNotes(1, '2027-02-01', '2027-04-18');
    expect(light).toContain('30 s between sets');
    expect(light).toContain('No heavy leg work');
    const taper = strengthNotes(0, '2027-03-29', '2027-04-18');
    expect(taper).toContain('single-leg calf raises: 1 set x 12 reps');
    expect(taper).not.toContain('2 sets');
  });
  it('rotates five distinct main and five distinct light sessions and repeats after five weeks', () => {
    expect(STRENGTH_ROUTINES).toHaveLength(10);
    for (const index of [0, 1]) {
      const titles = Array.from({ length: 5 }, (_, i) =>
        strengthNotes(index, dayOffset(PLAN_START, i * 7), '2027-04-18').split('\n')[0]);
      expect(new Set(titles).size).toBe(5);
      expect(strengthNotes(index, dayOffset(PLAN_START, 35), '2027-04-18').split('\n')[0]).toBe(titles[0]);
      expect(titles.every(title => title.startsWith(index === 0 ? 'Heavy ' : 'Light '))).toBe(true);
    }
    const plan = createDefaultPlan();
    for (const session of plan.workouts.filter(w => w.activity === 'strength')) {
      const index = new Date(`${session.date}T12:00:00`).getDay() === 5 ? 1 : 0;
      expect(session.notes).toBe(strengthNotes(index, weekKey(session.date), plan.settings.raceDate));
      expect(session.notes).toContain('between sets');
    }
    expect(new Set(plan.workouts.filter(w => w.activity === 'strength').map(w => w.notes.split('\n')[0])).size).toBe(10);
  });
});
