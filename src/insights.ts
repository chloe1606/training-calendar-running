import { allWeeks, dateKey, dayOffset, inUnits, weekKey, weekStats, type Plan } from './model';

export function weeklyMileage(plan: Plan, today = dateKey(new Date())) {
  return allWeeks(plan).map(week => {
    const workouts = plan.workouts.filter(workout => weekKey(workout.date) === week);
    const plannedMiles = weekStats(workouts).miles;
    const completedMiles = weekStats(workouts.filter(workout => workout.completed)).miles;
    const status = dayOffset(week, 6) < today ? 'Past week' : week > today ? 'Upcoming' : 'In progress';
    const value = inUnits(plannedMiles, plan.settings.units);
    const completed = inUnits(completedMiles, plan.settings.units);
    const longRuns = workouts.filter(workout => workout.type === 'long')
      .sort((a, b) => a.date.localeCompare(b.date))
      .map(workout => inUnits(workout.distanceMiles, plan.settings.units));
    return { week, plannedMiles, completedMiles, value, completed, longRuns, status,
      chartCompleted: status === 'Upcoming' && completedMiles === 0 ? null : completed };
  }).map((row, index, rows) => ({
    ...row,
    change: index > 0 && rows[index - 1].plannedMiles > 0
      ? Math.round((row.plannedMiles / rows[index - 1].plannedMiles - 1) * 100) : null,
  }));
}
