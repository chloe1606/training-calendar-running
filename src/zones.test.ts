import { describe, expect, it } from 'vitest';
import { DEFAULT_TRAINING_ZONES, RUN_TYPES, isRun } from './model';
import { createDefaultPlan } from './seed';
import { hrRangeLabel, paceZoneFor, paceZoneRangeLabel, runTargets, validTrainingZones } from './zones';

describe('HR and pace training zones', () => {
  const zones = DEFAULT_TRAINING_ZONES;
  it('uses the supplied inclusive HR ranges and open end zones', () => {
    expect(([1, 2, 3, 4, 5] as const).map(z => hrRangeLabel(z, zones.hrBoundaries))).toEqual([
      'Under 118 bpm', '118–146 bpm', '147–160 bpm', '161–175 bpm', '176+ bpm',
    ]);
  });
  it('uses all six supplied pace ranges in both units', () => {
    expect([1, 2, 3, 4, 5, 6].map(z => paceZoneRangeLabel(z, zones.paceBoundaries, 'mi'))).toEqual([
      'Slower than 8:59', '8:59–7:44', '7:44–6:56', '6:56–6:30', '6:30–6:06', 'Faster than 6:06',
    ]);
    expect([1, 2, 3, 4, 5, 6].map(z => paceZoneRangeLabel(z, zones.paceBoundaries, 'km'))).toEqual([
      'Slower than 5:35', '5:35–4:48', '4:48–4:18', '4:18–4:02', '4:02–3:47', 'Faster than 3:47',
    ]);
  });
  it('classifies shared pace boundaries consistently without gaps', () => {
    zones.paceBoundaries.forEach((pace, i) => {
      expect(paceZoneFor(pace + 0.001, zones.paceBoundaries)).toBe(i + 1);
      expect(paceZoneFor(pace, zones.paceBoundaries)).toBe(i + 2);
      expect(paceZoneFor(pace - 0.001, zones.paceBoundaries)).toBe(i + 2);
    });
  });
  it('assigns every seeded run both target zones without changing workouts', () => {
    const plan = createDefaultPlan();
    const before = structuredClone(plan);
    for (const w of plan.workouts) {
      const target = runTargets(w, plan.settings);
      if (isRun(w)) {
        expect(target?.paceZone).toMatch(/^Z[1-6](–Z[1-6])?$/);
        expect(target?.hrRange).toContain('bpm');
      } else expect(target).toBeNull();
    }
    expect(plan).toEqual(before);
    const easy = plan.workouts.find(w => w.type === 'easy')!;
    expect(runTargets(easy, plan.settings)).toEqual({ paceZone: 'Z1', hrZone: 2, hrRange: '118–146 bpm' });
    for (const type of RUN_TYPES) {
      expect(runTargets({ ...easy, type }, plan.settings)?.hrZone).toBe(zones.hrTargets[type]);
    }
  });
  it('reflects edits immediately while preserving custom paces and per-run HR overrides', () => {
    const plan = createDefaultPlan();
    const run = plan.workouts.find(w => w.type === 'easy')!;
    plan.settings.trainingZones.hrBoundaries[1] = 150;
    plan.settings.trainingZones.paceBoundaries[0] = 10;
    expect(runTargets(run, plan.settings)).toEqual({ paceZone: 'Z2', hrZone: 2, hrRange: '118–149 bpm' });
    expect(runTargets({ ...run, hrZone: 1 }, plan.settings)?.hrRange).toBe('Under 118 bpm');
    expect(run.paceMinPerMile).toEqual({ min: 9, max: 9.75 });
  });
  it('rejects gaps, unordered or invalid boundaries and invalid targets', () => {
    expect(validTrainingZones(zones)).toBe(true);
    for (const invalid of [
      null, {}, { ...zones, hrBoundaries: [118, 118, 161, 176] },
      { ...zones, hrBoundaries: [118, 147.5, 161, 176] },
      { ...zones, paceBoundaries: [9, 8, 8, 7, 6] },
      { ...zones, paceBoundaries: [9, 8, 7, 6, NaN] },
      { ...zones, hrTargets: { ...zones.hrTargets, race: 6 } },
    ]) expect(validTrainingZones(invalid)).toBe(false);
  });
});
