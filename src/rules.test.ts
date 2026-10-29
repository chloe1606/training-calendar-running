import { describe, expect, it } from 'vitest';
import { getWarnings, warningsForWeek, type Rule } from './rules';
import { type Workout } from './model';

let id = 0;
const workout = (date: string, type: Workout['type'] = 'easy', distanceMiles = 5, activity?: Workout['activity']): Workout =>
  ({ id: String(++id), date, type, distanceMiles, activity, paceMinPerMile: type === 'parkrun' ? { min: 8.5, max: 9 } : { min: 9, max: 9.75 }, notes: '', completed: false });
const has = (rule: Rule, workouts: Workout[]) => getWarnings(workouts).some(w => w.rule === rule);
describe('live warning rules', () => {
  it('warns above two hard DAYS, not two hard sessions', () => {
    const two = [workout('2026-11-03', 'threshold'), workout('2026-11-05', 'marathonPace')];
    expect(has('hard-days', two)).toBe(false);
    expect(has('hard-days', [...two, workout('2026-11-05', 'race')])).toBe(false);
    expect(has('hard-days', [...two, workout('2026-11-07', 'parkrun')])).toBe(true);
  });
  it('detects consecutive hard days across week boundaries', () => {
    const items = [workout('2026-11-01', 'race'), workout('2026-11-02', 'threshold')];
    expect(has('consecutive-hard', items)).toBe(true);
    expect(warningsForWeek(getWarnings(items), '2026-11-02').some(w => w.rule === 'consecutive-hard')).toBe(true);
    expect(has('consecutive-hard', [items[0], workout('2026-11-03', 'threshold')])).toBe(false);
  });
  it('detects a hard day before a long run, not an easy day', () => {
    const long = workout('2026-11-08', 'long', 10);
    expect(has('before-long', [workout('2026-11-07', 'parkrun'), long])).toBe(true);
    expect(has('before-long', [workout('2026-11-07'), long])).toBe(false);
  });
  it('allows evening badminton before quality or long, but none from 12 April', () => {
    const badminton = workout('2026-11-04', 'crossTraining', 0, 'badminton');
    for (const type of ['threshold', 'marathonPace', 'long'] as const) {
      expect(has('badminton', [badminton, workout('2026-11-05', type)])).toBe(false);
    }
    expect(has('badminton', [badminton, workout('2026-11-05')])).toBe(false);
    expect(has('badminton', [workout('2026-11-04', 'crossTraining', 0, 'swim'), workout('2026-11-05', 'long')])).toBe(false);
    expect(has('badminton', [workout('2027-04-14', 'crossTraining', 0, 'badminton')])).toBe(true);
  });
  it('allows easy parkruns, cut-back rebounds and the exact approved peak exception', () => {
    const easyParkrun = { ...workout('2026-11-07', 'parkrun'), paceMinPerMile: { min: 9, max: 9.75 } };
    expect(has('before-long', [easyParkrun, workout('2026-11-08', 'long', 10)])).toBe(false);
    const rebound = [workout('2026-11-02', 'easy', 27.5), workout('2026-11-09', 'easy', 25), workout('2026-11-16', 'easy', 30)];
    expect(has('mileage-jump', rebound)).toBe(false);
    expect(has('long-share', [workout('2027-03-21', 'long', 20), workout('2027-03-16', 'easy', 26)])).toBe(false);
    expect(has('long-share', [workout('2027-03-21', 'long', 20), workout('2027-03-16', 'easy', 25.9)])).toBe(true);
    expect(has('long-share', [workout('2027-02-28', 'long', 16), workout('2027-02-23', 'easy', 22)])).toBe(false);
  });
  it('warns only when mileage rises MORE than 10%', () => {
    const prev = workout('2026-11-01', 'easy', 10);
    expect(has('mileage-jump', [prev, workout('2026-11-02', 'easy', 11)])).toBe(false);
    expect(has('mileage-jump', [prev, workout('2026-11-02', 'easy', 11.1)])).toBe(true);
    expect(has('mileage-jump', [prev, workout('2026-11-02', 'easy', 11.01)])).toBe(true);
    expect(has('mileage-jump', [workout('2026-11-02')])).toBe(false);
    expect(has('mileage-jump', [workout('2026-11-01', 'rest', 0), workout('2026-11-02')])).toBe(true);
    expect(has('mileage-jump', [prev, workout('2026-11-09')])).toBe(true);
  });
  it('warns only when a long run is MORE than 40% of running mileage', () => {
    const long = workout('2026-11-08', 'long', 10);
    expect(has('long-share', [long, workout('2026-11-03', 'easy', 15)])).toBe(false);
    expect(has('long-share', [long, workout('2026-11-03', 'easy', 14.9)])).toBe(true);
    expect(has('long-share', [long, workout('2026-11-03', 'easy', 14.99)])).toBe(true);
    expect(has('long-share', [workout('2026-11-08', 'long', 0)])).toBe(false);
  });
  it('flags workouts on rest dates, clears when the conflict moves away', () => {
    const rest = workout('2026-11-06', 'rest', 0);
    expect(has('rest-day', [rest, workout('2026-11-06')])).toBe(true);
    expect(has('rest-day', [rest, workout('2026-11-06', 'crossTraining', 0, 'swim')])).toBe(true);
    expect(has('rest-day', [rest, workout('2026-11-07')])).toBe(false);
  });
});
