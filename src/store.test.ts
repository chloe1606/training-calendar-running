import { beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { createDefaultPlan } from './seed';
import baseline from './default-plan.json';
import { thresholdSession } from './threshold';
import { addCompletedStrength, completedStrengthWorkout, generateStrengthWorkout } from './random-strength';
import { exportICS } from './files';

let store: typeof import('./store');
const storage = new Map<string, string>();
beforeAll(async () => {
  vi.stubGlobal('localStorage', {
    getItem: (key: string) => storage.get(key) ?? null,
    setItem: (key: string, value: string) => storage.set(key, value),
  });
  store = await import('./store');
});
beforeEach(() => {
  storage.clear();
  store.usePlanner.setState({ plan: createDefaultPlan(), past: [], future: [], error: null });
});
describe('import validation', () => {
  it('refines baseline thresholds on import and persists an idempotent round trip', () => {
    const plan = store.validatePlan(structuredClone(baseline));
    expect(plan.workouts.filter(workout => thresholdSession(workout))).toHaveLength(11);
    store.usePlanner.getState().change(() => store.validatePlan(JSON.parse(JSON.stringify(plan))));
    expect(store.usePlanner.getState().error).toBeNull();
    const saved = [...storage.values()].map(text => JSON.parse(text)).find(value => value.workouts);
    expect(saved).toEqual(plan);
    expect(store.validatePlan(saved)).toEqual(plan);
  });
  it('upgrades quality variety once, round-trips edits and rejects invalid styles', () => {
    const legacy = createDefaultPlan();
    delete legacy.qualityVarietyVersion;
    legacy.workouts = legacy.workouts.map(w => w.qualityStyle ? {
      ...w, qualityStyle: undefined, notes: 'Total distance includes easy warm-up and cool-down. Quality portion only at the listed pace.',
    } : w);
    const migrated = store.validatePlan(legacy);
    expect(migrated.workouts.filter(w => w.qualityStyle)).toHaveLength(3);
    expect(store.validatePlan(JSON.parse(JSON.stringify(migrated)))).toEqual(migrated);
    const run = migrated.workouts.find(w => w.qualityStyle)!;
    run.qualityStyle = undefined;
    expect(store.validatePlan(migrated)).toEqual(migrated);
    const invalid = JSON.parse(JSON.stringify(migrated));
    invalid.workouts[0].qualityStyle = 'hills';
    expect(() => store.validatePlan(invalid)).toThrow('Invalid quality session style');
    const invalidStyle = JSON.parse(JSON.stringify(migrated));
    invalidStyle.workouts.find((w: { type: string }) => w.type === 'threshold').qualityStyle = 'sprints';
    expect(() => store.validatePlan(invalidStyle)).toThrow('Invalid quality session style');
    expect(() => store.validatePlan({ ...migrated, qualityVarietyVersion: 2 })).toThrow('Invalid quality variety version');
  });
  it('upgrades marathon finishes once and validates finish distances and paces', () => {
    const legacy = createDefaultPlan();
    delete legacy.marathonFinishesVersion;
    legacy.workouts = legacy.workouts.map(w => ({ ...w, marathonFinish: undefined }));
    const migrated = store.validatePlan(legacy);
    expect(migrated.workouts.filter(w => w.marathonFinish)).toHaveLength(2);
    expect(store.validatePlan(migrated)).toEqual(migrated);
    const run = migrated.workouts.find(w => w.marathonFinish)!;
    run.marathonFinish!.distanceMiles = run.distanceMiles + 1;
    expect(() => store.validatePlan(migrated)).toThrow('Invalid marathon-pace finish');
  });
  it('adds two strength sessions to older plans once and validates the two selected days', () => {
    const legacy = JSON.parse(JSON.stringify(createDefaultPlan()));
    delete legacy.settings.strengthDays;
    legacy.workouts = legacy.workouts.filter((w: { activity?: string }) => w.activity !== 'strength');
    const migrated = store.validatePlan(legacy);
    expect(migrated.settings.strengthDays).toEqual([1, 4]);
    expect(migrated.workouts.filter(w => w.activity === 'strength')).toHaveLength(47);
    expect(store.validatePlan(migrated)).toEqual(migrated);
    for (const days of [[1, 1], [1], [1, 7], ['Tuesday', 4]]) {
      expect(() => store.validatePlan({ ...migrated, settings: { ...migrated.settings, strengthDays: days } })).toThrow('strength weekdays');
    }
  });
  it('migrates old zone settings and validates zone tables and individual HR overrides', () => {
    const legacy = JSON.parse(JSON.stringify(createDefaultPlan()));
    delete legacy.settings.trainingZones;
    expect(store.validatePlan(legacy).settings.trainingZones).toEqual(createDefaultPlan().settings.trainingZones);
    const invalid = createDefaultPlan();
    invalid.settings.trainingZones.hrBoundaries[1] = 100;
    expect(() => store.validatePlan(invalid)).toThrow('training zones');
    const badOverride = JSON.parse(JSON.stringify(createDefaultPlan()));
    badOverride.workouts[0].hrZone = 6;
    expect(() => store.validatePlan(badOverride)).toThrow('Invalid workout');
  });
  it('upgrades old backups without weekday preferences and rejects malformed preferences', () => {
    const legacy = JSON.parse(JSON.stringify(createDefaultPlan()));
    delete legacy.settings.defaultDays;
    const upgraded = store.validatePlan(legacy);
    expect(upgraded.settings.defaultDays).toEqual(createDefaultPlan().settings.defaultDays);
    for (const day of [-1, 7, 1.5, 'Monday', undefined]) {
      const invalid = JSON.parse(JSON.stringify(createDefaultPlan()));
      invalid.settings.defaultDays.swim = day;
      expect(() => store.validatePlan(invalid)).toThrow('default day');
    }
    const settings = { ...upgraded.settings, defaultDays: { ...upgraded.settings.defaultDays, swim: 6 as const } };
    expect(store.validatePlan({ ...upgraded, settings }).settings.defaultDays.swim).toBe(6);
  });
  it('round-trips the default JSON plan', () => {
    const plan = createDefaultPlan();
    expect(store.validatePlan(JSON.parse(JSON.stringify(plan)))).toEqual(plan);
  });
  it('rejects invalid dates, pace ranges, settings and duplicate IDs', () => {
    for (const mutate of [
      (p: ReturnType<typeof createDefaultPlan>) => { p.workouts[0].date = '2027-02-30'; },
      (p: ReturnType<typeof createDefaultPlan>) => { p.workouts[0].paceMinPerMile = { min: 10, max: 9 }; },
      (p: ReturnType<typeof createDefaultPlan>) => { p.workouts[0].distanceMiles = -1; },
      (p: ReturnType<typeof createDefaultPlan>) => { p.workouts[1].id = p.workouts[0].id; },
      (p: ReturnType<typeof createDefaultPlan>) => { p.settings.goalTime = 'fast'; },
      (p: ReturnType<typeof createDefaultPlan>) => { p.settings.maxEasyHR = 500; },
    ]) {
      const plan = createDefaultPlan();
      mutate(plan);
      expect(() => store.validatePlan(plan)).toThrow();
    }
    expect(() => store.validatePlan({})).toThrow();
  });
});
describe('history and persistence', () => {
  it('persists generated completion dates and notes, with undo, redo, JSON and ICS support', () => {
    const original = store.usePlanner.getState().plan;
    const generated = generateStrengthWorkout('heavy', () => 0);
    const logged = completedStrengthWorkout(generated, '2026-10-29', '2026-10-30', 'strength-log-persistence');
    store.usePlanner.getState().change(plan => addCompletedStrength(plan, logged));
    const saved = JSON.parse(storage.get('marathon-planner-v1')!);
    expect(store.validatePlan(saved).workouts.find(workout => workout.id === logged.id)).toEqual(logged);
    expect(saved.workouts.slice(0, -1)).toEqual(original.workouts);
    const ics = exportICS({ ...saved, workouts: [logged] }).replace(/\r\n /g, '');
    expect(ics).toContain('DTSTART;VALUE=DATE:20261029');
    expect(ics).toContain('Completed');
    expect(ics).toContain('Supported split squat: 2 sets x 8 reps per side');
    store.usePlanner.getState().undo();
    expect(store.usePlanner.getState().plan).toEqual(original);
    expect(JSON.parse(storage.get('marathon-planner-v1')!).workouts.some((workout: { id: string }) => workout.id === logged.id)).toBe(false);
    store.usePlanner.getState().redo();
    expect(store.usePlanner.getState().plan.workouts.find(workout => workout.id === logged.id)).toEqual(logged);
    expect(() => store.usePlanner.getState().change(plan => addCompletedStrength(plan, logged))).toThrow('already been saved');
  });
  it('undoes and redoes changes including whole-plan replacement', () => {
    const original = store.usePlanner.getState().plan;
    store.usePlanner.getState().change(p => ({ ...p, workouts: p.workouts.map((w, i) => i === 0 ? { ...w, completed: true } : w) }));
    expect(store.usePlanner.getState().plan.workouts[0].completed).toBe(true);
    store.usePlanner.getState().undo();
    expect(store.usePlanner.getState().plan).toEqual(original);
    store.usePlanner.getState().redo();
    expect(store.usePlanner.getState().plan.workouts[0].completed).toBe(true);
    store.usePlanner.getState().change(() => createDefaultPlan());
    store.usePlanner.getState().undo();
    expect(store.usePlanner.getState().plan.workouts[0].completed).toBe(true);
    expect(JSON.parse(storage.get('marathon-planner-v1')!).workouts[0].completed).toBe(true);
  });
  it('clears redo on a new edit, without mutating earlier snapshots', () => {
    store.usePlanner.getState().change(p => { p.settings.units = 'km'; return p; });
    store.usePlanner.getState().undo();
    store.usePlanner.getState().change(p => { p.settings.darkMode = true; return p; });
    const { plan, past, future } = store.usePlanner.getState();
    expect(plan.settings.units).toBe('mi');
    expect(past[0].settings.darkMode).toBe(false);
    expect(future).toHaveLength(0);
  });
  it('surfaces storage failures while preserving the in-memory edit', () => {
    const setItem = vi.spyOn(localStorage, 'setItem').mockImplementationOnce(() => { throw new Error('Storage full'); });
    const log = vi.spyOn(console, 'error').mockImplementation(() => {});
    store.usePlanner.getState().change(p => { p.settings.units = 'km'; return p; });
    expect(store.usePlanner.getState().plan.settings.units).toBe('km');
    expect(store.usePlanner.getState().error).toContain('could not be saved');
    setItem.mockRestore(); log.mockRestore();
  });
});
