import { dayOffset, phaseForWeek, PLAN_START, weekKey, type Plan, type Weekday, type Workout } from './model';
import routines from './strength-routines.json';

export const STRENGTH_ROUTINES = routines.routines;
export const STRENGTH_GUIDANCE = routines.guidance;
export const MOBILITY_NOTES = routines.mobility;

export function strengthNotes(index: number, week: string, raceDate: string): string {
  const weekIndex = Math.floor((Date.parse(weekKey(week)) - Date.parse(PLAN_START)) / 604800000);
  const rotation = ((weekIndex % 5) + 5) % 5;
  const group = index % 2 === 0 ? 'heavy' : 'light';
  const routine = STRENGTH_ROUTINES.filter(item => item.group === group)[rotation];
  const taper = phaseForWeek(week, raceDate) === 'Taper';
  const exercises = taper ? routine.exercises.map(text => text.replace(/2 sets/g, '1 set').replace(/2 x 8/g, '1 x 8')) : routine.exercises;
  return [routine.title, `Five-week rotation: ${rotation + 1}/5. ${group === 'heavy' ? 'Tuesday main resistance session.' : 'Friday light/mobility only.'}`, STRENGTH_GUIDANCE, ...exercises,
    ...(taper ? ['Taper: 1 easy set with familiar exercises only; no progression. This overrides the normal two-set prescription. No strength after 6 April; use 15 min gentle mobility, not loaded strength. Skip if sore or tired.'] : []),
  ].join('\n\n');
}
export function scheduleStrength(plan: Plan, days: [Weekday, Weekday], moveExisting: boolean): Workout[] {
  const workouts = plan.workouts.map(w => ({ ...w }));
  const cutoff = dayOffset(plan.settings.raceDate, -12);
  const weeks = [...new Set(workouts.map(w => weekKey(w.date)))].filter(week => week <= weekKey(plan.settings.raceDate)).sort();
  for (const week of weeks) {
    const existing = workouts.filter(w => w.type === 'crossTraining' && w.activity === 'strength' && weekKey(w.date) === week);
    const used = new Set<number>();
    for (const w of existing) {
      const match = days.findIndex((day, i) => !used.has(i) && w.date === dayOffset(week, day));
      if (match >= 0) used.add(match);
      else if (moveExisting && !w.completed && used.size < 2) {
        const index = used.has(0) ? 1 : 0;
        if (dayOffset(week, days[index]) > cutoff) continue;
        w.date = dayOffset(week, days[index]); used.add(index);
      }
    }
    const missing = Math.max(0, 2 - existing.length);
    for (let count = 0; count < missing; count++) {
      const index = used.has(0) ? 1 : 0;
      used.add(index);
      if (dayOffset(week, days[index]) > cutoff) continue;
      let id = `strength-${week}-${index}`;
      while (workouts.some(w => w.id === id)) id += '-new';
      workouts.push({
        id, date: dayOffset(week, days[index]), type: 'crossTraining', activity: 'strength', distanceMiles: 0,
        paceMinPerMile: { ...plan.settings.paceZones.easy }, completed: false,
        notes: strengthNotes(index, week, plan.settings.raceDate),
      });
    }
  }
  return workouts;
}
