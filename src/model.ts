import { addDays, differenceInCalendarDays, format, parseISO, startOfWeek } from 'date-fns';

export const TYPES = ['easy', 'long', 'threshold', 'marathonPace', 'strides', 'parkrun', 'crossTraining', 'rest', 'race'] as const;
export type WorkoutType = typeof TYPES[number];
export const RUN_TYPES = ['easy', 'long', 'threshold', 'marathonPace', 'strides', 'parkrun', 'race'] as const;
export type RunType = typeof RUN_TYPES[number];
export type HRZone = 1 | 2 | 3 | 4 | 5;
export interface TrainingZones {
  hrBoundaries: [number, number, number, number];
  paceBoundaries: [number, number, number, number, number];
  hrTargets: Record<RunType, HRZone>;
}
export const DEFAULT_TRAINING_ZONES: TrainingZones = {
  hrBoundaries: [118, 147, 161, 176],
  paceBoundaries: [8.9833, 7.7333, 6.9333, 6.5, 6.1],
  hrTargets: { easy: 2, long: 2, threshold: 4, marathonPace: 3, strides: 5, parkrun: 3, race: 3 },
};
export const ACTIVITIES = ['swim', 'ride', 'pilates', 'strength', 'badminton'] as const;
export type Activity = typeof ACTIVITIES[number];
export const SCHEDULE_TYPES = ['easy', 'long', 'threshold', 'marathonPace', 'strides', 'parkrun', 'rest', ...ACTIVITIES] as const;
export type ScheduleType = typeof SCHEDULE_TYPES[number];
export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;
export type DefaultDays = Record<ScheduleType, Weekday | null>;
export const WEEKDAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'] as const;
export const DEFAULT_DAYS: DefaultDays = {
  easy: null, long: 6, threshold: 3, marathonPace: 3, strides: null, parkrun: 5, rest: null,
  swim: 0, ride: null, pilates: 4, strength: 1, badminton: 2,
};
export interface PaceRange { min: number; max: number }
export interface Workout {
  id: string;
  date: string;
  type: WorkoutType;
  distanceMiles: number;
  paceMinPerMile: PaceRange;
  marathonFinish?: { distanceMiles: number; paceMinPerMile: PaceRange };
  qualityStyle?: 'hills' | 'progression';
  hrCapBpm?: number;
  hrZone?: HRZone;
  activity?: Activity;
  notes: string;
  completed: boolean;
}
export type ZoneKey = 'easy' | 'long' | 'marathonPace' | 'threshold' | 'parkrun';
export interface Settings {
  strengthDays: [Weekday, Weekday];
  trainingZones: TrainingZones;
  defaultDays: DefaultDays;
  paceZones: Record<ZoneKey, PaceRange>;
  raceDate: string;
  goalTime: string;
  units: 'mi' | 'km';
  maxEasyHR: number;
  darkMode: boolean;
}
export interface Plan { workouts: Workout[]; settings: Settings; marathonFinishesVersion?: 1; qualityVarietyVersion?: 1 }
export const LABELS: Record<WorkoutType, string> = {
  easy: 'Easy run', long: 'Long run', threshold: 'Threshold',
  marathonPace: 'Marathon pace', strides: 'Strides', parkrun: 'Parkrun',
  crossTraining: 'Cross training', rest: 'Rest day', race: 'Race day',
};
export const PLAN_START = '2026-10-26';
export const BUILD_START = '2026-12-14';
export const TAPER_START = '2027-03-29';
export const DEFAULT_RACE = '2027-04-18';
export const dateKey = (date: Date) => format(date, 'yyyy-MM-dd');
export const weekKey = (date: string | Date) => dateKey(startOfWeek(typeof date === 'string' ? parseISO(date) : date, { weekStartsOn: 1 }));
export const dayOffset = (date: string, days: number) => dateKey(addDays(parseISO(date), days));
export const isRun = (w: Workout) => w.type !== 'crossTraining' && w.type !== 'rest';
export const isHard = (w: Workout) => ['threshold', 'marathonPace', 'race'].includes(w.type)
  || (w.type === 'parkrun' && w.paceMinPerMile.min < 9)
  || (w.type === 'long' && !!w.marathonFinish);
export const workoutLabel = (w: Workout) => w.type === 'crossTraining' && w.activity
  ? w.activity.charAt(0).toUpperCase() + w.activity.slice(1)
  : w.type === 'threshold' && w.qualityStyle ? w.qualityStyle === 'hills' ? 'Hill repeats' : 'Progression run' : LABELS[w.type];
export const round = (n: number) => Math.round(n * 10) / 10;
export const inUnits = (miles: number, units: Settings['units']) => miles * (units === 'km' ? 1.609344 : 1);
export const fromUnits = (value: number, units: Settings['units']) => value / (units === 'km' ? 1.609344 : 1);
export const paceInUnits = (pace: number, units: Settings['units']) => pace / (units === 'km' ? 1.609344 : 1);
export function formatPace(minutes: number): string {
  const seconds = Math.round(minutes * 60);
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
}
export function parsePace(value: string): number | null {
  const match = /^(\d{1,2}):([0-5]\d)$/.exec(value.trim());
  if (!match) return null;
  const pace = Number(match[1]) + Number(match[2]) / 60;
  return pace > 0 ? pace : null;
}
export function durationMinutes(distance: number, pace: PaceRange): PaceRange {
  return { min: distance * pace.min, max: distance * pace.max };
}
export function workoutDuration(w: Workout): PaceRange {
  const finish = w.marathonFinish;
  if (!finish) return durationMinutes(w.distanceMiles, w.paceMinPerMile);
  const easy = durationMinutes(w.distanceMiles - finish.distanceMiles, w.paceMinPerMile);
  const fast = durationMinutes(finish.distanceMiles, finish.paceMinPerMile);
  return { min: easy.min + fast.min, max: easy.max + fast.max };
}
export function formatDuration(minutes: number): string {
  const total = Math.round(minutes);
  return total >= 60 ? `${Math.floor(total / 60)}h ${String(total % 60).padStart(2, '0')}m` : `${total}m`;
}
export function phaseForWeek(week: string, raceDate = DEFAULT_RACE): 'Base' | 'Build' | 'Peak' | 'Taper' {
  if (week < BUILD_START) return 'Base';
  const taper = dayOffset(weekKey(raceDate), -14);
  if (week >= taper) return 'Taper';
  if (week >= dayOffset(BUILD_START, 6 * 7)) return 'Peak';
  return 'Build';
}
export function weekStats(workouts: Workout[]) {
  return {
    miles: Math.round(workouts.filter(isRun).reduce((sum, w) => sum + w.distanceMiles, 0) * 1e9) / 1e9,
    runDays: new Set(workouts.filter(w => isRun(w) && w.distanceMiles > 0).map(w => w.date)).size,
    hardDays: new Set(workouts.filter(isHard).map(w => w.date)).size,
  };
}
export function allWeeks(plan: Plan): string[] {
  const dates = [PLAN_START, plan.settings.raceDate, ...plan.workouts.map(w => w.date)].sort();
  const first = weekKey(dates[0]);
  const last = weekKey(dates[dates.length - 1]);
  return Array.from({ length: Math.floor(differenceInCalendarDays(parseISO(last), parseISO(first)) / 7) + 1 }, (_, i) => dayOffset(first, i * 7));
}
