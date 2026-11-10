import { describe, expect, it } from 'vitest';
import { createDefaultPlan } from './seed';
import { weeklyMileage } from './insights';
import { inUnits, weekKey } from './model';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { InsightsPage } from './components/InsightsPage';
import { MileageStatus } from './components/MileageStatus';

describe('planned and completed mileage', () => {
  it('only awards mileage achievement for nonzero targets reached without display rounding', () => {
    const plan = createDefaultPlan();
    const firstWeek = weeklyMileage(plan)[0].week;
    for (const workout of plan.workouts) {
      if (weekKey(workout.date) === firstWeek) workout.completed = true;
    }
    expect(weeklyMileage(plan)[0].achieved).toBe(true);
    plan.settings.units = 'km';
    expect(weeklyMileage(plan)[0].achieved).toBe(true);
    const run = plan.workouts.find(workout => weekKey(workout.date) === firstWeek && workout.type === 'easy')!;
    const remaining = 0.001;
    plan.workouts.push({ ...run, id: 'remaining-mileage', distanceMiles: remaining, completed: false });
    expect(weeklyMileage(plan)[0].achieved).toBe(false);
    expect(weeklyMileage({ ...plan, workouts: [] })[0].achieved).toBe(false);
  });
  it('renders accessible status icons and an achievement tick', () => {
    for (const status of ['Past week', 'Upcoming', 'In progress']) {
      const html = renderToStaticMarkup(createElement(MileageStatus, { status, achieved: false }));
      expect(html).toContain(`aria-label="${status}"`);
      expect(html).toContain('<svg');
      expect(html).not.toContain(`>${status}<`);
    }
    const html = renderToStaticMarkup(createElement(MileageStatus, { status: 'Past week', achieved: true }));
    expect(html).toContain('aria-label="Planned mileage achieved"');
    expect(html).toContain('lucide-circle-check');
  });
  it('reads the race goal directly from saved Settings on Plan insights', () => {
    const plan = createDefaultPlan();
    plan.settings.raceDate = '2027-05-02';
    plan.settings.goalTime = '3:45:00';
    const html = renderToStaticMarkup(createElement(InsightsPage, {
      plan, selectedWeek: '2026-11-09', onSelect: () => undefined, onCalendar: () => undefined, onUnitsChange: () => undefined,
    }));
    expect(html).toContain('Sunday 2 May 2027');
    expect(html).toContain('Goal time: 3:45:00');
    expect(html).not.toContain('Goal time: 3:30:00');
  });
  it('identifies race weeks and updates them when a race is rescheduled', () => {
    const plan = createDefaultPlan();
    const rows = weeklyMileage(plan);
    expect(rows.filter(row => row.races.length).map(row => row.week)).toEqual(['2027-03-08', '2027-04-12']);
    const half = plan.workouts.find(workout => workout.type === 'race' && workout.date === '2027-03-14')!;
    expect(rows.find(row => row.week === '2027-03-08')?.races[0].distance).toBe(13.1);
    half.date = '2027-03-07';
    const moved = weeklyMileage(plan);
    expect(moved.find(row => row.week === '2027-03-08')?.races).toEqual([]);
    expect(moved.find(row => row.week === '2027-03-01')?.races[0].date).toBe('2027-03-07');
  });
  it('lists long-run distances in selected units, excluding races and retaining multiple sessions', () => {
    const plan = createDefaultPlan();
    expect(weeklyMileage(plan)[0].longRuns).toEqual([10]);
    expect(weeklyMileage(plan).find(row => row.week === '2027-03-08')?.longRuns).toEqual([]);
    const long = plan.workouts.find(workout => workout.type === 'long')!;
    plan.workouts.push({ ...long, id: 'extra-long', distanceMiles: 8 });
    expect(weeklyMileage(plan)[0].longRuns).toEqual([10, 8]);
    plan.settings.units = 'km';
    expect(weeklyMileage(plan)[0].longRuns).toEqual([inUnits(10, 'km'), inUnits(8, 'km')]);
  });
  it('counts completed running only, preserving the planned total', () => {
    const plan = createDefaultPlan();
    const run = plan.workouts.find(workout => workout.type === 'easy')!;
    const cross = plan.workouts.find(workout => workout.type === 'crossTraining')!;
    run.completed = true;
    cross.completed = true;
    cross.distanceMiles = 50;
    const rows = weeklyMileage(plan, '2026-10-30');
    const row = rows.find(item => item.week === weekKey(run.date))!;
    expect(row.plannedMiles).toBe(25);
    expect(row.completedMiles).toBe(run.distanceMiles);
    expect(row.status).toBe('In progress');
    expect(row.chartCompleted).toBe(run.distanceMiles);
    run.completed = false;
    expect(weeklyMileage(plan)[0].completedMiles).toBe(0);
  });
  it('distinguishes past, current and upcoming weeks without marking future weeks missed', () => {
    const plan = createDefaultPlan();
    const rows = weeklyMileage(plan, '2026-11-02');
    expect(rows[0].status).toBe('Past week');
    expect(rows[0].chartCompleted).toBe(0);
    expect(rows[1].status).toBe('In progress');
    expect(rows[2].status).toBe('Upcoming');
    expect(rows[2].chartCompleted).toBeNull();
    const future = plan.workouts.find(workout => workout.type === 'easy' && workout.date >= '2026-11-09')!;
    future.completed = true;
    expect(weeklyMileage(plan, '2026-11-02').find(row => row.week === weekKey(future.date))?.chartCompleted).toBe(future.distanceMiles);
  });
  it('converts both series consistently and retains planned progression', () => {
    const plan = createDefaultPlan();
    const run = plan.workouts.find(workout => workout.type === 'easy')!;
    run.completed = true;
    plan.settings.units = 'km';
    const rows = weeklyMileage(plan, '2026-10-30');
    expect(rows[0].value).toBe(inUnits(25, 'km'));
    expect(rows[0].completed).toBe(inUnits(run.distanceMiles, 'km'));
    expect(rows[0].change).toBeNull();
    expect(rows[1].change).toBe(10);
    expect(weeklyMileage({ ...plan, workouts: [] })[0].change).toBeNull();
    expect(weeklyMileage({ ...plan, workouts: [] })[1].change).toBeNull();
  });
});
