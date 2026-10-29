import { useState } from 'react';
import { ACTIVITIES, DEFAULT_DAYS, LABELS, TYPES, WEEKDAYS, type Activity, type Settings, type Workout, type WorkoutType } from '../model';
import { defaultWorkoutDate } from '../schedule';
import { Modal } from './Modal';

export function AddWorkout({ selectedDate, settings, close, onAdd }: {
  selectedDate: string; settings: Settings; close: () => void;
  onAdd: (date: string, type: WorkoutType, activity?: Activity) => void;
}) {
  const [type, setType] = useState<Workout['type']>('easy');
  const [activity, setActivity] = useState<Activity>('swim');
  const days = settings.defaultDays ?? DEFAULT_DAYS;
  const [date, setDate] = useState(() => defaultWorkoutDate(selectedDate, 'easy', undefined, days));
  const key = type === 'crossTraining' ? activity : type === 'race' ? null : type;
  const defaultDay = key ? days[key] : null;
  return <Modal title="Add a workout" onClose={close}>
    <form className="add-workout-form" onSubmit={event => { event.preventDefault(); onAdd(date, type, type === 'crossTraining' ? activity : undefined); }}>
      <label>Workout type<select value={type} onChange={event => {
        const next = event.target.value as WorkoutType;
        setType(next);
        setDate(defaultWorkoutDate(date || selectedDate, next, activity, days));
      }}>{TYPES.map(t => <option key={t} value={t}>{LABELS[t]}</option>)}</select></label>
      {type === 'crossTraining' && <label>Activity<select value={activity} onChange={event => {
        const next = event.target.value as Activity;
        setActivity(next);
        setDate(defaultWorkoutDate(date || selectedDate, type, next, days));
      }}>{ACTIVITIES.map(a => <option key={a} value={a}>{a.charAt(0).toUpperCase() + a.slice(1)}</option>)}</select></label>}
      <label>Workout date<input type="date" min="2020-01-01" max="2100-12-31" required value={date} onChange={e => setDate(e.target.value)} /></label>
      <p className="field-help">{defaultDay === null || defaultDay === undefined ? 'No default weekday for this activity. Choose any date.' : `Suggested day: ${WEEKDAYS[defaultDay]}. You can choose a different date.`} Adding directly from a calendar day always keeps that day.</p>
      <div className="modal-actions"><button type="button" className="secondary-button" onClick={close}>Cancel</button><button type="submit" className="primary-button">Add workout</button></div>
    </form>
  </Modal>;
}
