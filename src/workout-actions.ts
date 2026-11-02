import { isValid, parseISO } from 'date-fns';
import { dateKey, type Plan } from './model';

export function rescheduleWorkout(plan: Plan, id: string, date: string, copyId?: string): Plan {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !isValid(parseISO(date)) || dateKey(parseISO(date)) !== date || date < '2020-01-01' || date > '2100-12-31') {
    throw new Error('Choose a valid date from 2020 to 2100.');
  }
  const workout = plan.workouts.find(item => item.id === id);
  if (!workout) throw new Error('This workout no longer exists.');
  if (copyId !== undefined) {
    if (!copyId || plan.workouts.some(item => item.id === copyId)) throw new Error('The copied workout needs a unique ID.');
    if (plan.workouts.length >= 10000) throw new Error('The plan has reached the 10,000-workout limit.');
    const { fuellingLog: _fuellingLog, ...copy } = structuredClone(workout);
    return { ...plan, workouts: [...plan.workouts, { ...copy, id: copyId, date, completed: false }] };
  }
  return { ...plan, workouts: plan.workouts.map(item => item.id === id ? { ...item, date } : item) };
}
