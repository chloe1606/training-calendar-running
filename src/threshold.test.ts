import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import baseline from './default-plan.json';
import { type Plan, weekStats, weekKey } from './model';
import { refineThresholdPlan, thresholdDetails, thresholdSession, thresholdNotes } from './threshold';
import { mainSetMiles, qualityDuration } from './quality';
import { CardContent } from './components/WorkoutCard';
import { exportICS } from './files';

const original = () => structuredClone(baseline) as Plan;
describe('precise provisional threshold sessions', () => {
  it('refines all 11 existing interval sessions without altering dates, mileage or hard-day counts', () => {
    const before = original(), after = refineThresholdPlan(before);
    const changed = after.workouts.filter((workout, index) => workout !== before.workouts[index]);
    expect(changed).toHaveLength(11);
    expect(after.settings).toEqual(before.settings);
    expect(after.workouts.map(workout => [workout.id, workout.date, workout.distanceMiles, workout.completed]))
      .toEqual(before.workouts.map(workout => [workout.id, workout.date, workout.distanceMiles, workout.completed]));
    for (const week of new Set(before.workouts.map(workout => weekKey(workout.date)))) {
      expect(weekStats(after.workouts.filter(workout => weekKey(workout.date) === week)))
        .toEqual(weekStats(before.workouts.filter(workout => weekKey(workout.date) === week)));
    }
    for (const workout of changed) {
      const session = thresholdSession(workout)!;
      expect(session.fits).toBe(true);
      expect(2.5 + session.workMiles + session.recoveryMiles + session.extraMiles).toBeCloseTo(workout.distanceMiles, 10);
      expect(session.recoveryMiles * 9.5).toBeCloseTo((session.reps - 1) * 2.5);
      expect(workout.paceMinPerMile.min).toBe(session.minutes >= 8 ? 7 + 35 / 60 : 7.5);
      expect(workout.paceMinPerMile.max).toBe(workout.paceMinPerMile.min);
      expect(mainSetMiles(workout)).toBe(session.workMiles);
    }
    expect(refineThresholdPlan(after)).toBe(after);
  });
  it('preserves completed, moved, custom and non-3:30 plans', () => {
    for (const modify of [
      (w: Plan['workouts'][number]) => { w.completed = true; },
      (w: Plan['workouts'][number]) => { w.date = '2026-10-28'; },
      (w: Plan['workouts'][number]) => { w.notes += ' My custom instruction.'; },
      (w: Plan['workouts'][number]) => { w.distanceMiles += 1; },
      (w: Plan['workouts'][number]) => { w.paceMinPerMile.min = 7; },
    ]) {
      const plan = original();
      const workout = plan.workouts.find(w => w.id === 'seed-2026-10-27-threshold-')!;
      modify(workout);
      expect(refineThresholdPlan(plan).workouts.find(w => w.id === workout.id)).toEqual(workout);
    }
    const plan = original();
    plan.settings.goalTime = '4:00:00';
    expect(refineThresholdPlan(plan)).toBe(plan);
  });
  it('keeps card essentials concise while retaining full tooltip details and exports', () => {
    const plan = refineThresholdPlan(original());
    const workout = plan.workouts.find(w => w.id === 'seed-2026-11-05-threshold-')!;
    for (const compact of [false, true]) {
      const html = renderToStaticMarkup(createElement(CardContent, { workout, settings: plan.settings, compact }));
      for (const text of ['Threshold session breakdown', 'Warm-up 1.50 mi', '2 × 6 min at 7:30/mi', '2:30 easy jog between reps', 'Cool-down 1.00 mi']) expect(html).toContain(text);
      for (const text of ['Provisional target', 'Extra easy running:', 'estimated', '9:30/mi', 'Work portion:']) expect(html).not.toContain(text);
      const metricHtml = renderToStaticMarkup(createElement(CardContent, { workout, settings: { ...plan.settings, units: 'km' }, compact }));
      expect(metricHtml).toContain('2 × 6 min at 4:40/km');
      expect(metricHtml).toContain('Warm-up 2.41 km');
    }
    const details = thresholdDetails(workout, plan.settings).join('\n');
    for (const text of ['Provisional target', 'Extra easy running:', 'estimated', '9:30/mi', 'between reps only']) expect(details).toContain(text);
    const metric = thresholdDetails(workout, { ...plan.settings, units: 'km' }).join('\n');
    expect(metric).toContain('4:40/km');
    expect(metric).toContain('5:54/km');
    expect(metric).toContain('2.41 km');
    const ics = exportICS({ ...plan, workouts: [workout] }).replace(/\r\n /g, '');
    expect(ics).toContain('2 × 6 min at 7:30/mi');
    expect(ics).toContain('Recoveries:');
  });
  it('recomputes work distance and durations after edits and reports an undersized total', () => {
    const plan = refineThresholdPlan(original());
    const workout = plan.workouts.find(w => thresholdSession(w))!;
    const edited = { ...workout, paceMinPerMile: { min: 7.75, max: 7.75 } };
    const session = thresholdSession(edited)!;
    expect(mainSetMiles(edited)).toBe(10 / 7.75);
    expect(qualityDuration(edited, plan.settings).min).toBeCloseTo(10 + (edited.distanceMiles - session.workMiles) * 9.5);
    expect(qualityDuration(edited, plan.settings).max).toBe(qualityDuration(edited, plan.settings).min);
    const updatedNotes = thresholdNotes(edited, plan.settings);
    expect(updatedNotes).toContain('2 x 5 min at 7:45/mi');
    expect(updatedNotes).not.toContain('7:30/mi');
    const short = { ...edited, distanceMiles: 1 };
    expect(thresholdSession(short)?.fits).toBe(false);
    expect(thresholdDetails(short, plan.settings)[0]).toContain('does not fit');
  });
});
