import { describe, expect, it } from 'vitest';
import { fuellingDetails, fuellingTotals, validFuellingLog, type FuellingLog } from './fuelling';
import { rescheduleWorkout } from './workout-actions';
import { createDefaultPlan } from './seed';

const log: FuellingLog = {
  entries: [
    { minute: 30, product: 'Gel', carbsGrams: 25, fluidsMl: 150 },
    { minute: -15, product: 'Drink', carbsGrams: 20, fluidsMl: 300 },
    { minute: 60, product: 'Water', carbsGrams: 0, fluidsMl: 200 },
  ],
  notes: 'Gel with water worked; stomach comfortable.',
};
describe('long-run fuelling', () => {
  it('totals carbs and fluids and orders descriptions without mutating intake', () => {
    expect(validFuellingLog(log)).toBe(true);
    expect(fuellingTotals(log)).toEqual({ carbsGrams: 45, fluidsMl: 650 });
    const details = fuellingDetails(log);
    expect(details[0]).toContain('45 g carbs, 650 ml fluids');
    expect(details[1]).toContain('15 min before start: Drink');
    expect(details[2]).toContain('30 min from start: Gel');
    expect(details.at(-1)).toContain(log.notes);
    expect(log.entries[0].minute).toBe(30);
    expect(validFuellingLog({ entries: [], notes: 'No intake; felt flat.' })).toBe(true);
    expect(fuellingTotals({ entries: [], notes: '' })).toEqual({ carbsGrams: 0, fluidsMl: 0 });
  });
  it('rejects malformed or out-of-range data, including non-finite quantities', () => {
    for (const patch of [{ minute: -241 }, { minute: 1441 }, { minute: NaN }, { carbsGrams: -1 }, { carbsGrams: Infinity }, { fluidsMl: -1 }, { product: 12 }]) {
      expect(validFuellingLog({ ...log, entries: [{ ...log.entries[0], ...patch }] })).toBe(false);
    }
    for (const value of [null, {}, { entries: 'invalid', notes: '' }, { entries: [null], notes: '' }, { entries: Array(101).fill(log.entries[0]), notes: '' }]) {
      expect(validFuellingLog(value)).toBe(false);
    }
  });
  it('retains actual intake when moving but never copies it onto a new workout', () => {
    const plan = createDefaultPlan();
    const run = plan.workouts.find(workout => workout.type === 'long')!;
    run.fuellingLog = log;
    expect(rescheduleWorkout(plan, run.id, '2026-11-09').workouts.find(workout => workout.id === run.id)?.fuellingLog).toEqual(log);
    expect(rescheduleWorkout(plan, run.id, '2026-11-09', 'new-run').workouts.at(-1)?.fuellingLog).toBeUndefined();
    expect(run.fuellingLog).toEqual(log);
  });
});
