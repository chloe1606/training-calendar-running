import { describe, expect, it } from 'vitest';
import { addQualityVariety, ORIGINAL_QUALITY_NOTES, progressionStages, qualityDetails, qualityDuration, QUALITY_SESSIONS } from './quality';
import { createDefaultPlan } from './seed';
import { isHard, weekStats, workoutLabel } from './model';
import { getWarnings } from './rules';
import { exportICS } from './files';

describe('quality session variety', () => {
  it('replaces precisely four threshold slots without changing mileage or other workouts', () => {
    const plan = createDefaultPlan();
    expect(plan.workouts.filter(w => w.qualityStyle)).toHaveLength(4);
    for (const session of QUALITY_SESSIONS) {
      const run = plan.workouts.find(w => w.date === session.date && w.type === 'threshold')!;
      expect(run.qualityStyle).toBe(session.style);
      expect(isHard(run)).toBe(true);
      expect(workoutLabel(run)).toBe(session.style === 'hills' ? 'Hill repeats' : 'Progression run');
    }
    const legacy = { ...plan, qualityVarietyVersion: undefined, workouts: plan.workouts.map(w =>
      w.qualityStyle ? { ...w, qualityStyle: undefined, notes: ORIGINAL_QUALITY_NOTES } : w) };
    const migrated = addQualityVariety(legacy);
    expect(migrated.workouts.filter(w => w.qualityStyle).map(w => w.qualityStyle)).toEqual(plan.workouts.filter(w => w.qualityStyle).map(w => w.qualityStyle));
    expect(weekStats(migrated.workouts)).toEqual(weekStats(legacy.workouts));
    expect(addQualityVariety(migrated)).toBe(migrated);
    expect(migrated.workouts.filter(w => !w.qualityStyle)).toEqual(legacy.workouts.filter(w => !QUALITY_SESSIONS.some(s => s.date === w.date && w.type === 'threshold')));
  });
  it('preserves completed, moved, deleted, custom-note workouts and subsequent style removals', () => {
    const plan = createDefaultPlan();
    const legacy = { ...plan, qualityVarietyVersion: undefined, workouts: plan.workouts.map(w =>
      w.qualityStyle ? { ...w, qualityStyle: undefined, notes: ORIGINAL_QUALITY_NOTES } : w) };
    legacy.workouts = legacy.workouts.filter(w => w.id !== 'seed-2027-01-28-threshold-').map(w =>
      w.id === 'seed-2026-12-17-threshold-' ? { ...w, completed: true }
        : w.id === 'seed-2026-12-31-threshold-' ? { ...w, date: '2027-01-01' }
          : w.id === 'seed-2027-01-14-threshold-' ? { ...w, notes: 'My custom session' } : w);
    expect(addQualityVariety(legacy).workouts).toEqual(legacy.workouts);
    const cleared = { ...plan, workouts: plan.workouts.map(w => ({ ...w, qualityStyle: undefined })) };
    expect(addQualityVariety(cleared)).toBe(cleared);
  });
  it('sums progression portions, converts units, exports details and keeps quality warnings', () => {
    const plan = createDefaultPlan();
    const run = plan.workouts.find(w => w.qualityStyle === 'progression')!;
    const stages = progressionStages(run, plan.settings);
    expect(stages.reduce((sum, s) => sum + s.distanceMiles, 0)).toBeCloseTo(run.distanceMiles, 10);
    expect(stages.map(s => s.hr)).toEqual([2, 2, 3, 4, 2]);
    expect(qualityDuration(run, plan.settings).min).toBeCloseTo(stages.reduce((sum, s) => sum + s.distanceMiles * s.pace.min, 0));
    expect(qualityDetails(run, { ...plan.settings, units: 'km' }).join('\n')).toContain('/km');
    const ics = exportICS({ ...plan, workouts: [run] }).replace(/\r\n /g, '');
    expect(ics).toContain('SUMMARY:Progression run');
    expect(ics).toContain('Easy cool-down:');
    const badminton = { ...run, id: 'badminton', date: '2027-01-13', type: 'crossTraining' as const, activity: 'badminton' as const, qualityStyle: undefined };
    expect(getWarnings([badminton, run]).some(w => w.rule === 'badminton')).toBe(false);
    const hills = plan.workouts.find(w => w.qualityStyle === 'hills')!;
    expect(qualityDetails(hills, plan.settings).join('\n')).toContain('not an uphill speed target');
    expect(qualityDuration(hills, plan.settings).max).toBe(hills.distanceMiles * plan.settings.paceZones.easy.max);
  });
});
