import { DEFAULT_DAYS, LABELS, dayOffset, weekKey, type Activity, type DefaultDays, type ScheduleType, type Workout, type WorkoutType } from './model';

export function scheduleLabel(type: ScheduleType): string {
  return type in LABELS ? LABELS[type as WorkoutType] : type.charAt(0).toUpperCase() + type.slice(1);
}
export function defaultWorkoutDate(date: string, type: WorkoutType, activity: Activity | undefined, days: DefaultDays = DEFAULT_DAYS): string {
  if (type === 'race') return date;
  const key = type === 'crossTraining' ? activity : type;
  const day = key ? days[key] : null;
  return day === null || day === undefined ? date : dayOffset(weekKey(date), day);
}
export function applyDefaultDays(workouts: Workout[], days: DefaultDays): Workout[] {
  return workouts.map(w => w.completed || w.type === 'race' || w.activity === 'strength' ? w : {
    ...w, date: defaultWorkoutDate(w.date, w.type, w.activity, days),
  });
}
