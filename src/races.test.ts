import { describe, expect, it } from 'vitest';
import { raceEntries, saveRaces } from './races';
import { createDefaultPlan } from './seed';
import { exportICS } from './files';
import { weekStats } from './model';

describe('additional races', () => {
  const plan = createDefaultPlan();
  const originals = plan.workouts.filter(w => w.type === 'race' && w.date !== plan.settings.raceDate);
  it('creates a race with the entered date, miles and current pace zone', () => {
    const [race] = saveRaces([{ id: 'new-race', date: '2027-02-14', distance: '10' }], [], plan.settings);
    expect(race).toEqual({
      id: 'new-race', date: '2027-02-14', type: 'race', distanceMiles: 10,
      paceMinPerMile: plan.settings.paceZones.marathonPace, completed: false, notes: '',
    });
    expect(weekStats([race])).toEqual({ miles: 10, runDays: 1, hardDays: 1 });
    expect(exportICS({ ...plan, workouts: [race] })).toContain('DTSTART;VALUE=DATE:20270214');
  });
  it('converts entered kilometers to stored miles', () => {
    const [race] = saveRaces([{ id: '10k', date: '2027-02-14', distance: '10' }], [], { ...plan.settings, units: 'km' });
    expect(race.distanceMiles).toBeCloseTo(6.2137119);
  });
  it('preserves precise original distances, paces, notes and completion on unchanged metric entries', () => {
    const settings = { ...plan.settings, units: 'km' as const };
    const existing = [{ ...originals[0], completed: true, notes: 'Race kit and fuel' }];
    expect(saveRaces(raceEntries(existing, 'km'), existing, settings)).toEqual(existing);
  });
  it('edits dates and distances and removes omitted entries without mutating originals', () => {
    const entries = raceEntries(originals, 'mi');
    const saved = saveRaces([{ ...entries[0], date: '2027-03-07', distance: '10' }], originals, plan.settings);
    expect(saved[0]).toEqual({ ...originals[0], date: '2027-03-07', distanceMiles: 10 });
    expect(originals[0].date).toBe('2027-03-14');
    expect(saveRaces([], originals, plan.settings)).toEqual([]);
  });
  it('rejects invalid dates and empty, zero, negative, nonfinite or excessive distances', () => {
    for (const date of ['', '2027-02-30', 'not-a-date', '2019-12-31', '2101-01-01']) {
      expect(() => saveRaces([{ id: 'race', date, distance: '10' }], [], plan.settings)).toThrow('valid date');
    }
    for (const distance of ['', ' ', '0', '-1', 'Infinity', 'NaN', '201']) {
      expect(() => saveRaces([{ id: 'race', date: '2027-02-14', distance }], [], plan.settings)).toThrow('distance');
    }
  });
});
