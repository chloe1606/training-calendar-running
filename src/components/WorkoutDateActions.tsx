import { useState } from 'react';
import { usePlanner } from '../store';
import { rescheduleWorkout } from '../workout-actions';
import type { Workout } from '../model';

export function WorkoutDateActions({ workout, close }: { workout: Workout; close: () => void }) {
  const [date, setDate] = useState(workout.date);
  const [error, setError] = useState('');
  const change = usePlanner(state => state.change);
  function apply(copy: boolean) {
    try {
      change(plan => rescheduleWorkout(plan, workout.id, date, copy ? crypto.randomUUID() : undefined));
      close();
    } catch (error) {
      console.error('Unable to move or copy workout', error);
      setError(error instanceof Error ? error.message : 'Unable to move or copy workout.');
    }
  }
  return <section className="workout-editor" aria-label="Move or copy workout">
    <label>Destination date<input type="date" min="2020-01-01" max="2100-12-31" required value={date} onChange={event => setDate(event.target.value)} /></label>
    <p className="field-help">Uses the saved workout, not unsaved edits above. A copy starts incomplete with no fuelling log; moving keeps completion status and fuelling.</p>
    {error && <p role="alert" className="form-error">{error}</p>}
    <div className="editor-actions"><button type="button" onClick={() => apply(false)}>Move to date</button><button type="button" onClick={() => apply(true)}>Copy to date</button></div>
  </section>;
}
