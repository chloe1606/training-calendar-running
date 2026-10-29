import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { type Settings, type Weekday, type HRZone, type TrainingZones, DEFAULT_TRAINING_ZONES, RUN_TYPES, DEFAULT_DAYS, SCHEDULE_TYPES, WEEKDAYS, LABELS, formatPace, parsePace } from '../model';
import { HR_USES, hrRangeLabel, paceZoneRangeLabel, validTrainingZones } from '../zones';
import { applyDefaultDays, scheduleLabel } from '../schedule';
import { raceEntries, saveRaces } from '../races';
import { usePlanner } from '../store';
import { Modal } from './Modal';
import { scheduleStrength, STRENGTH_GUIDANCE, STRENGTH_ROUTINES } from '../strength';

function previewBoundaries(values: string[]): TrainingZones['paceBoundaries'] | null {
  const parsed = values.map(parsePace);
  if (parsed.some((pace, i) => pace === null || (i > 0 && pace >= (parsed[i - 1] ?? 0)))) return null;
  const numbers = parsed.filter((pace): pace is number => pace !== null);
  return [numbers[0], numbers[1], numbers[2], numbers[3], numbers[4]];
}
export function SettingsPanel({ close }: { close: () => void }) {
  const { plan, change } = usePlanner();
  const [settings, setSettings] = useState<Settings>(() => ({
    ...structuredClone(plan.settings), defaultDays: { ...(plan.settings.defaultDays ?? DEFAULT_DAYS) },
    trainingZones: structuredClone(plan.settings.trainingZones ?? DEFAULT_TRAINING_ZONES),
  }));
  const [zonePaces, setZonePaces] = useState(() => (plan.settings.trainingZones ?? DEFAULT_TRAINING_ZONES).paceBoundaries.map(pace => formatPace(pace)));
  const [applyDays, setApplyDays] = useState(false);
  const [applyStrength, setApplyStrength] = useState(false);
  const [error, setError] = useState('');
  const [goalRaceId] = useState(() => plan.workouts.find(w => w.type === 'race' && w.date === plan.settings.raceDate)?.id);
  const [originalRaces] = useState(() => plan.workouts.filter(w => w.type === 'race' && w.id !== goalRaceId));
  const [races, setRaces] = useState(() => raceEntries(originalRaces, plan.settings.units));
  const pacePreview = previewBoundaries(zonePaces);
  return <Modal title="Make the plan yours" onClose={close} wide>
    <form className="settings-form" onSubmit={e => {
      e.preventDefault();
      if (settings.strengthDays[0] === settings.strengthDays[1]) { setError('Choose two different strength days.'); return; }
      const parsed = zonePaces.map(parsePace);
      if (parsed.some(pace => pace === null)) { setError('Pace zone boundaries must use m:ss.'); return; }
      const boundaries = parsed.filter((pace): pace is number => pace !== null).map((pace, i) =>
        zonePaces[i] === formatPace(plan.settings.trainingZones.paceBoundaries[i]) ? plan.settings.trainingZones.paceBoundaries[i] : pace);
      const trainingZones: TrainingZones = {
        ...settings.trainingZones,
        paceBoundaries: [boundaries[0], boundaries[1], boundaries[2], boundaries[3], boundaries[4]],
      };
      if (!validTrainingZones(trainingZones)) { setError('HR boundaries must increase (60–220 bpm). Pace boundaries must get faster from Z1 to Z6 (0:06–120:00/mi).'); return; }
      if (!/^\d{1,2}:[0-5]\d:[0-5]\d$/.test(settings.goalTime) || !settings.goalTime.split(':').some(v => Number(v) > 0)) { setError('Use a goal time in h:mm:ss format.'); return; }
      const next = { ...settings, trainingZones, maxEasyHR: trainingZones.hrBoundaries[1] - 1 };
      const raceChanged = next.raceDate !== plan.settings.raceDate;
      let savedRaces: ReturnType<typeof saveRaces>;
      try { savedRaces = saveRaces(races, originalRaces, next); }
      catch (error) {
        if (!(error instanceof Error)) throw error;
        setError(error.message);
        return;
      }
      const originalRaceIds = new Set(originalRaces.map(w => w.id));
      next.defaultDays.strength = next.strengthDays[0];
      change(p => {
        const updatedPlan = {
        ...p, settings: next,
        workouts: [...(applyDays ? applyDefaultDays(p.workouts, next.defaultDays) : p.workouts).filter(w => !originalRaceIds.has(w.id)).map(w => {
          let updated = w;
          if (['easy', 'long'].includes(w.type) && w.hrCapBpm === plan.settings.maxEasyHR) {
            updated = { ...updated, hrCapBpm: next.maxEasyHR };
          }
          if (raceChanged && w.id === goalRaceId) updated = { ...updated, date: next.raceDate };
          return updated;
        }), ...savedRaces],
        };
        return applyStrength ? { ...updatedPlan, workouts: scheduleStrength(updatedPlan, next.strengthDays, true) } : updatedPlan;
      });
      close();
    }}>
      <p className="modal-intro">The destination is fixed. How you get there is personal.</p>
      <h3>Race goal</h3>
      <div className="field-pair"><label>Race date<input type="date" min="2020-01-01" max="2100-12-31" required value={settings.raceDate} onChange={e => setSettings({ ...settings, raceDate: e.target.value })} /></label>
        <label>Goal time<input required placeholder="3:30:00" value={settings.goalTime} onChange={e => setSettings({ ...settings, goalTime: e.target.value })} /></label></div>
      <p className="field-help">Changing the date moves the marathon card. The rest of the skeleton stays in place for you to adjust.</p>
      <div className="races-heading"><h3>Additional races</h3><button type="button" className="secondary-button" onClick={() => setRaces([...races, { id: crypto.randomUUID(), date: '', distance: '' }])}><Plus size={14} />Add race</button></div>
      <p className="field-help">Add races or edit the dress rehearsal. They appear as race workouts without replacing other sessions or changing your marathon goal. New races use your marathon-pace zone until edited.</p>
      <div className="race-entries">
        {races.map((race, index) => <fieldset className="race-entry" key={race.id}>
          <legend>Race {index + 1}</legend>
          <div className="field-pair">
            <label>Race date<input aria-label={`Race ${index + 1} date`} type="date" min="2020-01-01" max="2100-12-31" required value={race.date} onChange={e => setRaces(races.map(r => r.id === race.id ? { ...r, date: e.target.value } : r))} /></label>
            <label>Distance ({settings.units})<input aria-label={`Race ${index + 1} distance (${settings.units})`} type="number" step="any" min="0.001" required placeholder={settings.units === 'km' ? '21.1' : '13.1'} value={race.distance} onChange={e => setRaces(races.map(r => r.id === race.id ? { ...r, distance: e.target.value } : r))} /></label>
          </div>
          <button type="button" className="remove-race" aria-label={`Remove race ${index + 1}`} onClick={() => setRaces(races.filter(r => r.id !== race.id))}><Trash2 size={13} />Remove race</button>
        </fieldset>)}
      </div>
      {!races.length && <p className="field-help">No additional races yet. Add one to get it on your calendar.</p>}
      <p className="field-help">Race changes are applied when you save settings. Cancel leaves your calendar unchanged.</p>
      <h3>Default activity days</h3>
      <p className="field-help">Choose the suggested weekday for each activity. “Any day” keeps the selected date, which works well for easy runs on multiple days.</p>
      <div className="default-days-grid">
        {SCHEDULE_TYPES.filter(type => type !== 'strength').map(type => <label key={type}>{scheduleLabel(type)}
          <select aria-label={`${scheduleLabel(type)} default day`} value={settings.defaultDays[type] ?? ''} onChange={event => setSettings({
            ...settings, defaultDays: { ...settings.defaultDays, [type]: event.target.value === '' ? null : Number(event.target.value) as Weekday },
          })}>
            <option value="">Any day</option>
            {WEEKDAYS.map((day, index) => <option key={day} value={index}>{day}</option>)}
          </select>
        </label>)}
      </div>
      <label className="checkbox-label"><input type="checkbox" checked={applyDays} onChange={e => setApplyDays(e.target.checked)} />Apply to existing workouts</label>
      <p className="field-help">Moves all incomplete matching sessions to their default day within the same Monday–Sunday week. Completed sessions and races stay put. Multiple workouts can share a day; warnings still apply. Without this option, only suggestions for new workouts change.</p>
      <h3>Strength twice a week</h3>
      <div className="field-pair">{([0, 1] as const).map(index => <label key={index}>Session {index === 0 ? 'A' : 'B'} day<select aria-label={`Strength session ${index === 0 ? 'A' : 'B'} day`} value={settings.strengthDays[index]} onChange={event => {
        const days: Settings['strengthDays'] = [...settings.strengthDays];
        days[index] = Number(event.target.value) as Weekday;
        setSettings({ ...settings, strengthDays: days });
      }}>{WEEKDAYS.map((day, i) => <option key={day} value={i}>{day}</option>)}</select></label>)}</div>
      <label className="checkbox-label"><input type="checkbox" checked={applyStrength} onChange={event => setApplyStrength(event.target.checked)} />Apply strength days to existing workouts</label>
      <p className="field-help">Tuesday is the main session; Friday is light core, hips and mobility only. Applying moves incomplete strength sessions within each week and fills missing slots up to 12 days before the marathon (6 April for this plan). No new strength is scheduled after that cutoff. Completed sessions, custom notes and other activities are kept. Extra strength sessions are not deleted. New individual strength workouts suggest session A’s day.</p>
      <details className="strength-guide"><summary>Dumbbell and kettlebell workout ideas</summary>
        <p className="field-help">Ten sessions rotate over five weeks from 26 October: Heavy 1–5 for the main Tuesday slot and Light 1–5 for Friday, then repeat. Heavy means controlled resistance with your available weights, never maximal effort. Each card's info icon shows that week's prescription, sets and rest. Taper sessions use one set.</p>
        <p className="field-help">{STRENGTH_GUIDANCE}</p>
        {STRENGTH_ROUTINES.map(routine => <div key={routine.title}><h3>{routine.title}</h3><ul>{routine.exercises.map(exercise => <li key={exercise}>{exercise}</li>)}</ul></div>)}
        <p className="field-help">Friday is light only, with no heavy leg work. During the taper, use one easy set and no new exercises. After 6 April, use 15 minutes of gentle mobility instead of strength. Skip if sore or tired.</p>
      </details>
      <h3>Heart rate zones</h3>
      <p className="field-help">Edit the lower boundary of Z2–Z5. Adjacent ranges update together, with no gaps. Z1 is open below and Z5 is open above.</p>
      <div className="training-zone-table">
        <div className="training-zone-row zone-table-header"><span>Zone</span><span>Heart rate</span><span>Typical use</span></div>
        {([1, 2, 3, 4, 5] as const).map((zone, i) => <div className="training-zone-row" key={zone}>
          <strong>Z{zone}</strong><div><span>{hrRangeLabel(zone, settings.trainingZones.hrBoundaries)}</span>
            {zone > 1 && <label>Starts at (bpm)<input aria-label={`HR Z${zone} lower boundary`} type="number" step="1" min="60" max="220" required value={settings.trainingZones.hrBoundaries[i - 1]} onChange={event => {
              const next = { ...settings.trainingZones, hrBoundaries: [...settings.trainingZones.hrBoundaries] as TrainingZones['hrBoundaries'] };
              next.hrBoundaries[i - 1] = Number(event.target.value);
              setSettings({ ...settings, trainingZones: next });
            }} /></label>}
          </div><span>{HR_USES[i]}</span>
        </div>)}
      </div>
      <h3>Run pace zones <span>Grade-adjusted</span></h3>
      <p className="field-help">Your six Strava-style zones. Edit shared boundaries in min/mi; min/km is converted automatically. On hills, raw pace can be slower than grade-adjusted pace. This planner does not calculate elevation adjustments.</p>
      <div className="training-zone-table">
        <div className="training-zone-row zone-table-header"><span>Zone</span><span>Pace /mi</span><span>Pace /km</span></div>
        {pacePreview ? [1, 2, 3, 4, 5, 6].map(zone => <div className="training-zone-row" key={zone}><strong>Z{zone}</strong><span>{paceZoneRangeLabel(zone, pacePreview, 'mi')}</span><span>{paceZoneRangeLabel(zone, pacePreview, 'km')}</span></div>) : <p className="form-error">Enter valid boundaries in order from slowest to fastest to preview the pace zones.</p>}
      </div>
      <div className="default-days-grid">{zonePaces.map((pace, i) => <label key={i}>Z{i + 1} / Z{i + 2} boundary (/mi)<input required aria-label={`Pace Z${i + 1} Z${i + 2} boundary`} value={pace} onChange={e => setZonePaces(zonePaces.map((value, index) => index === i ? e.target.value : value))} /></label>)}</div>
      <h3>Default HR target by run type</h3>
      <div className="default-days-grid">{RUN_TYPES.map(type => <label key={type}>{LABELS[type]}<select aria-label={`${LABELS[type]} target HR zone`} value={settings.trainingZones.hrTargets[type]} onChange={e => setSettings({
        ...settings, trainingZones: { ...settings.trainingZones, hrTargets: { ...settings.trainingZones.hrTargets, [type]: Number(e.target.value) as HRZone } },
      })}>{([1, 2, 3, 4, 5] as const).map(z => <option key={z} value={z}>Z{z} · {hrRangeLabel(z, settings.trainingZones.hrBoundaries)}</option>)}</select></label>)}</div>
      <p className="field-help">Saving updates zone labels and HR targets for every existing run automatically, without changing its pace. A run can span multiple pace zones. Individual HR-zone overrides and custom caps remain; edit a card to change them. Race HR defaults to controlled Z3, not an all-out effort.</p>
      <p className="field-help">Default easy HR cap: {settings.trainingZones.hrBoundaries[1] - 1} bpm (top of Z2). Existing default caps follow Z2; custom caps stay unchanged.</p>
      {error && <p className="form-error" role="alert">{error}</p>}
      <div className="modal-actions"><button type="button" className="secondary-button" onClick={close}>Cancel</button><button type="submit" className="primary-button">Save settings</button></div>
    </form>
  </Modal>;
}
