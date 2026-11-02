import { describe, expect, it } from 'vitest';
import { createDefaultPlan } from './seed';
import { rescheduleWorkout } from './workout-actions';

describe('moving and copying workouts', () => {
  it('moves without changing identity, notes, distance or completion', () => {
    const plan = createDefaultPlan();
    plan.workouts[0].completed = true;
    const workout = plan.workouts[0];
    const result = rescheduleWorkout(plan, workout.id, '2026-11-09');
    expect(result.workouts[0]).toEqual({ ...workout, date: '2026-11-09' });
    expect(plan.workouts[0].date).toBe(workout.date);
  });
  it('copies as incomplete without altering the original', () => {
    const plan = createDefaultPlan();
    plan.workouts[0].completed = true;
    const result = rescheduleWorkout(plan, plan.workouts[0].id, '2026-11-09', 'copy');
    expect(result.workouts.at(-1)).toEqual({ ...plan.workouts[0], date: '2026-11-09', id: 'copy', completed: false });
    expect(result.workouts.slice(0, -1)).toEqual(plan.workouts);
    for (const date of ['', '2026-02-30', '2019-12-31']) expect(() => rescheduleWorkout(plan, plan.workouts[0].id, date)).toThrow('valid date');
    expect(() => rescheduleWorkout(plan, 'missing', '2026-11-09')).toThrow('no longer exists');
    expect(() => rescheduleWorkout(plan, plan.workouts[0].id, '2026-11-09', plan.workouts[0].id)).toThrow('unique ID');
  });
});
