import { useState } from 'react';
import type { Workout } from '../model';
import { fuellingTotals, validFuellingLog, type FuellingEntry, type FuellingLog } from '../fuelling';
import { usePlanner } from '../store';

export function FuellingLogEditor({ workout }: { workout: Workout }) {
  const [log, setLog] = useState<FuellingLog>(() => structuredClone(workout.fuellingLog ?? { entries: [], notes: '' }));
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const change = usePlanner(state => state.change);
  const total = fuellingTotals(log);
  function update(next: FuellingLog) {
    setLog(next);
    setMessage('');
    setError('');
  }
  function edit(index: number, patch: Partial<FuellingEntry>) {
    update({ ...log, entries: log.entries.map((entry, i) => i === index ? { ...entry, ...patch } : entry) });
  }
  return <details className="fuelling-log">
    <summary>Long-run fuelling log{workout.fuellingLog ? ` (${workout.fuellingLog.entries.length} entries)` : ''}</summary>
    <form className="workout-editor" onSubmit={event => {
      event.preventDefault();
      setError('');
      setMessage('');
      if (!validFuellingLog(log)) {
        setError('Use valid numbers: time -240 to 1440 min, carbs 0–1000 g, fluids 0–10000 ml. Up to 100 entries are supported.');
        return;
      }
      try {
        change(plan => {
          if (!plan.workouts.some(item => item.id === workout.id)) throw new Error('This workout no longer exists.');
          return { ...plan, workouts: plan.workouts.map(item => item.id === workout.id ? {
            ...item, fuellingLog: log.entries.length || log.notes.trim() ? structuredClone(log) : undefined,
          } : item) };
        });
        const saveError = usePlanner.getState().error;
        if (saveError) { setError(saveError); return; }
        setMessage('Fuelling log saved. Workout completion is unchanged.');
      } catch (error) {
        console.error('Unable to save fuelling log', error);
        setError(error instanceof Error ? error.message : 'Unable to save fuelling log.');
      }
    }}>
      <p className="field-help">Record what you actually used. Timing is minutes from the start; use negative minutes for pre-run food or drink. These are your observations, not fuelling targets.</p>
      {log.entries.map((entry, index) => <fieldset key={index} className="fuelling-entry">
        <legend>Entry {index + 1}</legend>
        <label>Time from start (min)<input type="number" step="any" min="-240" max="1440" required
          value={Number.isFinite(entry.minute) ? entry.minute : ''} onChange={event => edit(index, { minute: event.target.valueAsNumber })} /></label>
        <label>Product / food<input maxLength={200} value={entry.product} placeholder="Gel, drink, water, snack..."
          onChange={event => edit(index, { product: event.target.value })} /></label>
        <div className="field-pair">
          <label>Carbs (g)<input type="number" min="0" max="1000" step="any" required value={Number.isFinite(entry.carbsGrams) ? entry.carbsGrams : ''}
            onChange={event => edit(index, { carbsGrams: event.target.valueAsNumber })} /></label>
          <label>Fluids (ml)<input type="number" min="0" max="10000" step="any" required value={Number.isFinite(entry.fluidsMl) ? entry.fluidsMl : ''}
            onChange={event => edit(index, { fluidsMl: event.target.valueAsNumber })} /></label>
        </div>
        <button type="button" className="secondary-button" aria-label={`Remove fuelling entry ${index + 1}`}
          onClick={() => update({ ...log, entries: log.entries.filter((_, i) => i !== index) })}>Remove entry</button>
      </fieldset>)}
      <button type="button" className="secondary-button" disabled={log.entries.length >= 100} onClick={() => update({
        ...log, entries: [...log.entries, { minute: 0, product: '', carbsGrams: 0, fluidsMl: 0 }],
      })}>Add fuelling entry</button>
      <p className="field-help" aria-live="polite">Totals: {Number.isFinite(total.carbsGrams) ? Number(total.carbsGrams.toFixed(2)) : '—'} g carbs · {Number.isFinite(total.fluidsMl) ? Number(total.fluidsMl.toFixed(2)) : '—'} ml fluids</p>
      <label>What worked / stomach & recovery notes<textarea rows={3} maxLength={10000} value={log.notes}
        onChange={event => update({ ...log, notes: event.target.value })} placeholder="Energy, taste, stomach comfort, timing to repeat or change..." /></label>
      {error && <p className="form-error" role="alert">{error}</p>}
      {message && <p role="status">{message}</p>}
      <button type="submit" className="small-primary">Save fuelling log</button>
    </form>
  </details>;
}
