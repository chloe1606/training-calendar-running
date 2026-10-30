import { format, parseISO } from 'date-fns';
import { dayOffset, isHard, isRun, weekKey, weekStats, type Workout } from './model';

export type Rule = 'hard-days' | 'consecutive-hard' | 'before-long' | 'badminton' | 'mileage-jump' | 'long-share' | 'rest-day';
export interface Warning { id: string; rule: Rule; title: string; message: string; dates: string[]; week: string }
const CUTBACK_WEEKS = new Set(['2026-11-09', '2026-11-30', '2026-12-28', '2027-01-18', '2027-02-22']);
export function getWarnings(workouts: Workout[]): Warning[] {
  const warnings: Warning[] = [];
  const weeks = new Map<string, Workout[]>();
  const days = new Map<string, Workout[]>();
  workouts.forEach(w => {
    const week = weekKey(w.date);
    weeks.set(week, [...(weeks.get(week) ?? []), w]);
    days.set(w.date, [...(days.get(w.date) ?? []), w]);
  });
  const label = (date: string) => format(parseISO(date), 'EEE d MMM');
  const add = (rule: Rule, key: string, title: string, message: string, dates: string[], week: string) =>
    warnings.push({ id: `${rule}-${key}`, rule, title, message, dates, week });
  let baseline: number | undefined;
  let previousWeek: string | undefined;
  for (const week of [...weeks.keys()].sort()) {
    const items = weeks.get(week)!;
    const stats = weekStats(items);
    const raceWeek = items.some(w => w.type === 'race');
    const hardDates = [...new Set(items.filter(isHard).map(w => w.date))].sort();
    if (hardDates.length > 2 && !raceWeek) add('hard-days', week, 'A little too much intensity', `${hardDates.length} hard days this week. Aim for no more than 2 to make room for recovery.`, hardDates, week);
    if (previousWeek && dayOffset(previousWeek, 7) !== week) baseline = 0;
    if (baseline !== undefined) {
      if (stats.miles > baseline * 1.1 + 0.00001) {
        const increase = baseline > 0 ? `${Math.round((stats.miles / baseline - 1) * 100)}%` : 'from zero';
        add('mileage-jump', week, 'Mileage is climbing quickly', `Weekly mileage increases ${increase} against the last non-cut-back week. Consider keeping increases at or below 10%. Recovery, race and taper weeks do not lower that reference.`, [week], week);
      }
    }
    if (!CUTBACK_WEEKS.has(week) && !raceWeek && (week < '2027-03-29' || week > '2027-04-12')) baseline = stats.miles;
    previousWeek = week;
    items.filter(w => w.type === 'long').forEach(w => {
      const approvedPeak = w.date === '2027-03-21' && w.distanceMiles === 20 && Math.abs(stats.miles - 45) < 0.00001;
      if (!CUTBACK_WEEKS.has(week) && !approvedPeak && w.distanceMiles > stats.miles * 0.4 + 0.00001) add('long-share', w.id, 'Long run is a big share', `Your long run is ${Math.round(w.distanceMiles / stats.miles * 100)}% of weekly mileage; aim for 40% or less.`, [w.date], week);
    });
  }
  days.forEach((items, date) => {
    const tomorrow = dayOffset(date, 1);
    const next = days.get(tomorrow) ?? [];
    if (items.some(isHard) && next.some(isHard)) add('consecutive-hard', date, 'Back-to-back hard days', `${label(date)} and ${label(tomorrow)} both have hard sessions. An easy day between them helps you absorb the work.`, [date, tomorrow], weekKey(date));
    if (items.some(isHard) && next.some(w => w.type === 'long')) add('before-long', date, 'Protect your long run', `A hard session on ${label(date)} comes just before your long run. Keep the parkrun relaxed or move the quality session.`, [date, tomorrow], weekKey(tomorrow));
    if (date >= '2027-04-12' && items.some(w => w.type === 'crossTraining' && w.activity === 'badminton')) {
      add('badminton', date, 'No badminton from 12 April', `Remove badminton on ${label(date)}. Use an easy swim or gentle mobility during race week instead.`, [date], weekKey(date));
    }
    if (items.some(w => w.type === 'rest') && items.some(w => w.type !== 'rest')) add('rest-day', date, 'A workout on your rest day', `${label(date)} is marked for rest but also has a workout. Move the workout or remove the rest marker.`, [date], weekKey(date));
  });
  return warnings;
}

export function warningsForWeek(warnings: Warning[], week: string) {
  return warnings.filter(w => w.week === week || w.dates.some(d => weekKey(d) === week));
}
export const plannedRunMiles = (workouts: Workout[]) => workouts.filter(isRun).reduce((sum, w) => sum + w.distanceMiles, 0);
