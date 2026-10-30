import baseline from './default-plan.json';
import { formatPace, inUnits, paceInUnits, type Plan, type Settings, type Workout } from './model';
import { formatDistance } from './distance';

const MARKER = 'Provisional threshold target for a 3:30 marathon';
const JOG_PACE = 9.5;

export function thresholdSession(workout: Workout) {
  if (workout.type !== 'threshold' || workout.qualityStyle || !workout.notes.includes(MARKER)) return null;
  const match = workout.notes.match(/Main set: (\d+) [x×] (\d+) min at\b/);
  if (!match) return null;
  const reps = Number(match[1]), minutes = Number(match[2]);
  const pace = (workout.paceMinPerMile.min + workout.paceMinPerMile.max) / 2;
  const workMiles = reps * minutes / pace;
  const recoveryMiles = (reps - 1) * 2.5 / JOG_PACE;
  const extraMiles = workout.distanceMiles - 2.5 - workMiles - recoveryMiles;
  return { reps, minutes, workMiles, recoveryMiles, extraMiles, easyPace: JOG_PACE, fits: extraMiles >= -1e-8 };
}

export function thresholdDetails(workout: Workout, settings: Settings): string[] {
  const session = thresholdSession(workout);
  if (!session) return [];
  if (!session.fits) return ['Session does not fit the total distance. Increase the total or edit the prescribed reps before running.'];
  const distance = (miles: number) => `${formatDistance(inUnits(miles, settings.units))} ${settings.units}`;
  const pace = (minutes: number) => `${formatPace(paceInUnits(minutes, settings.units))}/${settings.units}`;
  const workPace = `${pace(workout.paceMinPerMile.min)}${workout.paceMinPerMile.max !== workout.paceMinPerMile.min ? ` to ${pace(workout.paceMinPerMile.max)}` : ''}`;
  return [
    `Warm-up: ${distance(1.5)} easy at ${pace(JOG_PACE)} or slower.`,
    `Main set: ${session.reps} × ${session.minutes} min at ${workPace} (${distance(session.workMiles)} estimated).`,
    `Recoveries: ${session.reps - 1} × 2:30 easy jog at ${pace(JOG_PACE)} or slower, between reps only (${distance(session.recoveryMiles)} estimated).`,
    ...(session.extraMiles > 1e-8 ? [`Extra easy running: ${distance(session.extraMiles)} at ${pace(JOG_PACE)} or slower.`] : []),
    `Cool-down: ${distance(1)} easy at ${pace(JOG_PACE)} or slower.`,
    'Provisional target, not a measured threshold. Controlled comfortably-hard effort; slow down or run easy if strained. Distances use target paces; shorten the set if needed to fit the total.',
  ];
}

export function thresholdSummary(workout: Workout, settings: Settings): string[] {
  const session = thresholdSession(workout);
  if (!session) return [];
  if (!session.fits) return thresholdDetails(workout, settings);
  const distance = (miles: number) => `${formatDistance(inUnits(miles, settings.units))} ${settings.units}`;
  const fast = formatPace(paceInUnits(workout.paceMinPerMile.min, settings.units));
  const slow = formatPace(paceInUnits(workout.paceMinPerMile.max, settings.units));
  return [
    `${session.reps} × ${session.minutes} min at ${fast}${fast === slow ? '' : `–${slow}`}/${settings.units}`,
    '2:30 easy jog between reps',
    `Warm-up ${distance(1.5)} · Cool-down ${distance(1)} easy`,
  ];
}

export function thresholdNotes(workout: Workout, settings: Settings): string {
  const session = thresholdSession(workout);
  if (!session?.fits) throw new Error(`Threshold session does not fit its allocated distance: ${workout.date}`);
  return [
    `${MARKER}; not a measured threshold or a guarantee of race fitness.`,
    ...thresholdDetails(workout, { ...settings, units: 'mi' }).slice(0, -1).map(text => text.replace('×', 'x')),
    `Main-set quality miles: ${session.workMiles}.`,
    'Easy portions and recoveries are effort-led: 9:30/mi is a reference, not a minimum speed. No recovery after the last rep. Slow down or switch to easy running if effort is strained, conditions are difficult or recovery is poor. Keep a few words possible; do not chase pace or HR.',
    ...(new Date(`${workout.date}T12:00:00`).getDay() === 2 ? ['Thursday remains the other quality day. Strength follows running; reduce or skip it if fatigued.'] : []),
  ].join('\n');
}

export function refineThresholdPlan(plan: Plan): Plan {
  if (plan.settings.goalTime !== '3:30:00') return plan;
  let changed = false;
  const workouts = plan.workouts.map(workout => {
    const original = baseline.workouts.find(item => item.id === workout.id);
    if (!original || workout.type !== 'threshold' || workout.qualityStyle || workout.completed
      || workout.date !== original.date || workout.distanceMiles !== original.distanceMiles
      || workout.notes !== original.notes
      || workout.paceMinPerMile.min !== original.paceMinPerMile.min
      || workout.paceMinPerMile.max !== original.paceMinPerMile.max) return workout;
    const match = workout.notes.match(/Main set: (\d+) x (\d+) min at threshold/);
    if (!match) return workout;
    const minutes = Number(match[2]);
    const target = minutes >= 8 ? 7 + 35 / 60 : 7.5;
    const updated: Workout = {
      ...workout, paceMinPerMile: { min: target, max: target },
      notes: `${MARKER}. Main set: ${match[1]} x ${match[2]} min at threshold.`,
    };
    updated.notes = thresholdNotes(updated, plan.settings);
    changed = true;
    return updated;
  });
  return changed ? { ...plan, workouts } : plan;
}
