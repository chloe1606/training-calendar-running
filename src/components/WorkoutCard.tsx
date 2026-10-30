import { useEffect, useId, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { Check, GripVertical, Timer, Heart, Trash2, Footprints, Waves, Dumbbell, Coffee, Flag, Zap, Info } from 'lucide-react';
import {
  ACTIVITIES, TYPES, LABELS, workoutLabel, inUnits, fromUnits, paceInUnits,
  formatPace, parsePace, workoutDuration, formatDuration, isRun,
  type Workout, type Settings, type HRZone,
} from '../model';
import { hrRangeLabel, paceZoneLabel, runTargets } from '../zones';
import { usePlanner } from '../store';
import { formatDistance } from '../distance';
import { thresholdSummary, thresholdSession, thresholdNotes } from '../threshold';
import { mainSetMiles, qualityDetails, qualityDuration, qualityNotes } from '../quality';
import { strengthSummary } from '../strength-guide';

export function WorkoutIcon({ workout, size = 16 }: { workout: Workout; size?: number }) {
  const Icon = workout.type === 'crossTraining' ? workout.activity === 'swim' ? Waves : Dumbbell
    : workout.type === 'rest' ? Coffee : workout.type === 'race' ? Flag
      : ['threshold', 'marathonPace', 'strides'].includes(workout.type) ? Zap : Footprints;
  return <Icon size={size} strokeWidth={1.7} aria-hidden="true" />;
}

function LongRunPaceSplit({ workout: w, settings }: { workout: Workout; settings: Settings }) {
  if (!w.marathonFinish) return null;
  const pace = (range: Workout['paceMinPerMile']) => {
    const fast = formatPace(paceInUnits(range.min, settings.units));
    const slow = formatPace(paceInUnits(range.max, settings.units));
    return `${fast}${fast === slow ? '' : `–${slow}`}/${settings.units}`;
  };
  const distance = (miles: number) => `${formatDistance(inUnits(miles, settings.units))} ${settings.units}`;
  return <span className="long-run-split">
    <span>First {distance(w.distanceMiles - w.marathonFinish.distanceMiles)} easy: <strong>{pace(w.paceMinPerMile)}</strong></span>
    <span>Last {distance(w.marathonFinish.distanceMiles)} at MP: <strong>{pace(w.marathonFinish.paceMinPerMile)}</strong></span>
  </span>;
}

export function CardContent({ workout: w, settings, compact = false }: { workout: Workout; settings: Settings; compact?: boolean }) {
  const duration = w.qualityStyle || mainSetMiles(w) !== null ? qualityDuration(w, settings) : workoutDuration(w);
  const targets = runTargets(w, settings);
  const threshold = thresholdSession(w);
  return <>
    <span className="workout-name"><WorkoutIcon workout={w} /><span>{workoutLabel(w)}</span></span>
    {isRun(w) ? <>
      <span className="workout-distance">{formatDistance(inUnits(w.distanceMiles, settings.units))}<small>{settings.units}</small></span>
      <LongRunPaceSplit workout={w} settings={settings} />
      <>
        {!w.marathonFinish && !threshold && <span className="workout-pace">{w.qualityStyle === 'hills' ? 'Flat-equivalent reference: ' : w.qualityStyle === 'progression' ? 'Threshold portion: ' : (mainSetMiles(w) ?? 0) > 0 ? 'Work portion: ' : ''}{formatPace(paceInUnits(w.paceMinPerMile.min, settings.units))}{w.paceMinPerMile.max !== w.paceMinPerMile.min && `–${formatPace(paceInUnits(w.paceMinPerMile.max, settings.units))}`} /{settings.units}</span>}
        {targets && <span className="zone-badges"><span>Pace {targets.paceZone}</span><span>HR Z{targets.hrZone}</span></span>}
        {targets && <span className="workout-meta"><Heart size={12} />{targets.hrRange}</span>}
        {w.qualityStyle && <span className="workout-meta">Quality session · hard day</span>}
        {w.marathonFinish && <span className="workout-meta">MP finish · hard day</span>}
      </>
      {threshold && <span className="threshold-breakdown" aria-label="Threshold session breakdown">{thresholdSummary(w, settings).map((text, index) => <span key={index}>{text}</span>)}</span>}
      {!compact && <>
        <span className="workout-meta"><Timer size={12} />{w.qualityStyle === 'hills' ? 'Rough moving-time estimate: ' : ''}{formatDuration(duration.min)}{Math.round(duration.max) !== Math.round(duration.min) && `–${formatDuration(duration.max)}`}</span>
        {w.hrCapBpm && <span className="workout-meta" title="Additional heart-rate ceiling. Follow the lower limit if the target zone is lower.">{w.marathonFinish ? 'Easy cap' : 'Cap'}: under {w.hrCapBpm} bpm</span>}
      </>}
    </> : !compact && <span className="cross-note">{w.type === 'rest' ? 'Recover & recharge' : w.activity === 'swim' ? 'Active recovery' : w.activity === 'badminton' ? 'Light evening session' : 'Strength & mobility'}</span>}
  </>;
}

function SessionExplanation({ workout: w, settings }: { workout: Workout; settings: Settings }) {
  const [open, setOpen] = useState(false);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const trigger = useRef<HTMLButtonElement>(null);
  const tooltip = useRef<HTMLDivElement>(null);
  const id = useId();
  const qualityMiles = mainSetMiles(w);
  const strengthLines = w.activity === 'strength' ? strengthSummary(w.notes) : [];
  useLayoutEffect(() => {
    if (!open || !trigger.current || !tooltip.current) return;
    const rect = trigger.current.getBoundingClientRect();
    const box = tooltip.current.getBoundingClientRect();
    setPosition({
      left: Math.max(8, Math.min(rect.left, window.innerWidth - box.width - 8)),
      top: rect.bottom + box.height + 8 <= window.innerHeight ? rect.bottom : Math.max(8, rect.top - box.height),
    });
  }, [open]);
  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    const escape = (event: KeyboardEvent) => { if (event.key === 'Escape') close(); };
    const outside = (event: PointerEvent) => {
      if (event.target instanceof Node && !trigger.current?.contains(event.target) && !tooltip.current?.contains(event.target)) close();
    };
    const scroll = (event: Event) => {
      if (!(event.target instanceof Node) || !tooltip.current?.contains(event.target)) close();
    };
    document.addEventListener('keydown', escape);
    document.addEventListener('pointerdown', outside);
    window.addEventListener('resize', close);
    window.addEventListener('scroll', scroll, true);
    return () => {
      document.removeEventListener('keydown', escape);
      document.removeEventListener('pointerdown', outside);
      window.removeEventListener('resize', close);
      window.removeEventListener('scroll', scroll, true);
    };
  }, [open]);
  return <>
    <button ref={trigger} type="button" className="session-info" aria-label={`Session details: ${workoutLabel(w)} on ${w.date}`}
      aria-describedby={open ? id : undefined} aria-expanded={open}
      onMouseEnter={() => setOpen(true)} onMouseLeave={event => {
        if (!(event.relatedTarget instanceof Node) || !tooltip.current?.contains(event.relatedTarget)) setOpen(false);
      }}
      onFocus={() => setOpen(true)} onBlur={() => setOpen(false)} onClick={() => setOpen(true)}>
      <Info size={14} aria-hidden="true" />
    </button>
    {open && createPortal(<div ref={tooltip} id={id} role="tooltip" className="session-tooltip" style={position}
      onMouseLeave={event => {
        if (!(event.relatedTarget instanceof Node) || !trigger.current?.contains(event.relatedTarget)) setOpen(false);
      }}>
      <strong>{workoutLabel(w)}</strong>
      {qualityDetails(w, settings).map(detail => <p key={detail}>{detail}</p>)}
      {qualityMiles !== null && <p>Main-set quality: {formatDistance(inUnits(qualityMiles, settings.units))} {settings.units}.</p>}
      {w.marathonFinish && <>
        <p><strong>Long run with marathon-pace finish</strong></p>
        <LongRunPaceSplit workout={w} settings={settings} />
        <p>Easy HR Z{runTargets(w, settings)?.hrZone}: {runTargets(w, settings)?.hrRange}{w.hrCapBpm ? `; easy cap under ${w.hrCapBpm} bpm` : ''}.</p>
        <p>Finish pace zone: {paceZoneLabel({ ...w, paceMinPerMile: w.marathonFinish.paceMinPerMile }, settings.trainingZones)}.</p>
        <p>Finish HR Z{settings.trainingZones.hrTargets.marathonPace}: {hrRangeLabel(settings.trainingZones.hrTargets.marathonPace, settings.trainingZones.hrBoundaries)}.</p>
      </>}
      {strengthLines.length > 0 ? <>
        <p><strong>Summary notes</strong></p>
        <ul>{strengthLines.map((line, index) => <li key={index}>{line}</li>)}</ul>
      </> : w.notes && <p className="session-notes">{w.notes}</p>}
    </div>, document.body)}
  </>;
}

function WorkoutEditor({ workout: w, settings, close }: { workout: Workout; settings: Settings; close: () => void }) {
  const change = usePlanner(s => s.change);
  const [type, setType] = useState(w.type);
  const [activity, setActivity] = useState(w.activity ?? 'swim');
  const [distance, setDistance] = useState(formatDistance(inUnits(w.distanceMiles, settings.units)));
  const [min, setMin] = useState(formatPace(paceInUnits(w.paceMinPerMile.min, settings.units)));
  const [max, setMax] = useState(formatPace(paceInUnits(w.paceMinPerMile.max, settings.units)));
  const [notes, setNotes] = useState(w.notes);
  const [hr, setHr] = useState(w.hrCapBpm?.toString() ?? '');
  const [hrZone, setHrZone] = useState<HRZone | ''>(w.hrZone ?? '');
  const [qualityStyle, setQualityStyle] = useState(w.qualityStyle ?? '');
  const [finishDistance, setFinishDistance] = useState(w.marathonFinish ? formatDistance(inUnits(w.marathonFinish.distanceMiles, settings.units)) : '');
  const [finishPace, setFinishPace] = useState(formatPace(paceInUnits(w.marathonFinish?.paceMinPerMile.min ?? settings.paceZones.marathonPace.min, settings.units)));
  const [error, setError] = useState('');
  return <form className="workout-editor" onSubmit={event => {
    event.preventDefault();
    const low = parsePace(min), high = parsePace(max);
    const miles = distance === formatDistance(inUnits(w.distanceMiles, settings.units))
      ? w.distanceMiles : fromUnits(Number(distance), settings.units);
    const factor = settings.units === 'km' ? 1.609344 : 1;
    if (low === null || high === null || high < low || low * factor < 0.1 || high * factor > 120 || miles < 0 || miles > 200 || !Number.isFinite(miles)) {
      setError('Use a valid distance and ordered paces (m:ss).'); return;
    }
    const paceMinPerMile = {
      min: min === formatPace(paceInUnits(w.paceMinPerMile.min, settings.units)) ? w.paceMinPerMile.min : low * factor,
      max: max === formatPace(paceInUnits(w.paceMinPerMile.max, settings.units)) ? w.paceMinPerMile.max : high * factor,
    };
    const proposed: Workout = { ...w, type, notes, distanceMiles: miles, paceMinPerMile,
      qualityStyle: qualityStyle === 'hills' || qualityStyle === 'progression' ? qualityStyle : undefined };
    const proposedSession = thresholdSession(proposed);
    if (proposedSession && !proposedSession.fits) {
      setError('Total distance is too short for the threshold reps, recoveries, warm-up and cool-down. Increase distance or reduce the reps in notes.'); return;
    }
    if (hr && (!Number.isInteger(Number(hr)) || Number(hr) < 60 || Number(hr) > 220)) {
      setError('Heart-rate cap must be 60–220 bpm.'); return;
    }
    let marathonFinish: Workout['marathonFinish'];
    if (type === 'long' && finishDistance.trim()) {
      const finishMiles = w.marathonFinish && finishDistance === formatDistance(inUnits(w.marathonFinish.distanceMiles, settings.units))
        ? w.marathonFinish.distanceMiles : fromUnits(Number(finishDistance), settings.units);
      const pace = parsePace(finishPace);
      if (!Number.isFinite(finishMiles) || finishMiles <= 0 || finishMiles > miles || pace === null || pace * factor < 0.1 || pace * factor > 120) {
        setError('Finish distance must be positive and no greater than the total. Use a valid finish pace (m:ss).'); return;
      }
      marathonFinish = { distanceMiles: finishMiles, paceMinPerMile: w.marathonFinish && finishPace === formatPace(paceInUnits(w.marathonFinish.paceMinPerMile.min, settings.units)) ? { ...w.marathonFinish.paceMinPerMile } : { min: pace * factor, max: pace * factor } };
    }
    change(p => ({ ...p, workouts: p.workouts.map(item => item.id === w.id ? {
      ...item, type, marathonFinish, qualityStyle: type === 'threshold' && (qualityStyle === 'hills' || qualityStyle === 'progression') ? qualityStyle : undefined,
      distanceMiles: ['crossTraining', 'rest'].includes(type) ? 0 : miles,
      paceMinPerMile,
      hrCapBpm: hr ? Number(hr) : undefined, hrZone: hrZone || undefined,
      notes: proposedSession?.fits && notes === w.notes ? thresholdNotes(proposed, settings) : notes,
      activity: type === 'crossTraining' ? activity : undefined,
    } : item) }));
    close();
  }}>
    <label>Workout type<select value={type} onChange={e => {
      const next = e.target.value as Workout['type'];
      setType(next);
      const zone = Object.entries(settings.paceZones).find(([key]) => key === next)?.[1];
      if (zone) {
        setMin(formatPace(paceInUnits(zone.min, settings.units)));
        setMax(formatPace(paceInUnits(zone.max, settings.units)));
      }
      setHr(next === 'easy' || next === 'long' ? String(settings.maxEasyHR) : '');
    }}>{TYPES.map(t => <option key={t} value={t}>{LABELS[t]}</option>)}</select></label>
    {type === 'threshold' && <label>Quality session style<select value={qualityStyle} onChange={e => {
      const style = e.target.value === 'hills' || e.target.value === 'progression' ? e.target.value : undefined;
      setQualityStyle(style ?? '');
      if ((thresholdSession(w) && notes === w.notes) || [qualityNotes(undefined), qualityNotes('hills'), qualityNotes('hills', 8), qualityNotes('progression')].includes(notes)) setNotes(qualityNotes(style));
    }}>
      <option value="">Threshold</option><option value="hills">Hill repeats</option><option value="progression">Progression run</option>
    </select></label>}
    {type === 'crossTraining' && <label>Activity<select value={activity} onChange={e => setActivity(e.target.value as typeof activity)}>{ACTIVITIES.map(a => <option key={a}>{a}</option>)}</select></label>}
    {!['crossTraining', 'rest'].includes(type) && <>
      <label>Distance ({settings.units})<input autoFocus type="number" step="any" min="0" required value={distance} onChange={e => setDistance(e.target.value)} /></label>
      <div className="field-pair"><label>Fast pace<input aria-label={`Fast pace per ${settings.units}`} required value={min} onChange={e => setMin(e.target.value)} /></label><label>Slow pace<input aria-label={`Slow pace per ${settings.units}`} required value={max} onChange={e => setMax(e.target.value)} /></label></div>
      <label>HR cap (optional)<input type="number" min="60" max="220" value={hr} onChange={e => setHr(e.target.value)} /></label>
      <label>Target HR zone<select value={hrZone} onChange={e => setHrZone(e.target.value ? Number(e.target.value) as HRZone : '')}><option value="">Use workout-type default</option>{[1, 2, 3, 4, 5].map(z => <option key={z} value={z}>Z{z}</option>)}</select></label>
      {type === 'long' && <><label>MP finish distance ({settings.units}, optional)<input type="number" step="any" min="0.001" value={finishDistance} onChange={e => setFinishDistance(e.target.value)} /></label>
        {finishDistance && <label>Finish pace (/{settings.units})<input required value={finishPace} onChange={e => setFinishPace(e.target.value)} /></label>}
        <p className="field-help">Clear finish distance for an all-easy long run. Easy pace and HR above apply before the finish.</p></>}
    </>}
    {type === 'crossTraining' && activity === 'strength'
      ? <p className="field-help">Choose and log completed exercises in <a href="#strength">Strength studio</a>.</p>
      : <label>Notes<textarea rows={3} value={notes} onChange={e => setNotes(e.target.value)} /></label>}
    {error && <p className="form-error" role="alert">{error}</p>}
    <div className="editor-actions"><button className="small-primary" type="submit">Save</button><button type="button" onClick={close}>Cancel</button>
      <button type="button" className="delete-button" aria-label="Delete workout" onClick={() => { change(p => ({ ...p, workouts: p.workouts.filter(item => item.id !== w.id) })); close(); }}><Trash2 size={15} /></button>
    </div>
  </form>;
}

export function WorkoutCard({ workout, settings, compact, editingId, setEditingId }: {
  workout: Workout; settings: Settings; compact?: boolean;
  editingId: string | null; setEditingId: (id: string | null) => void;
}) {
  const change = usePlanner(s => s.change);
  const editing = editingId === workout.id;
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: workout.id, data: { date: workout.date }, disabled: editing,
  });
  return <article ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition }}
    className={`workout-card type-${workout.type} ${compact ? 'compact-card' : ''} ${workout.completed ? 'is-completed' : ''} ${isDragging ? 'is-dragging' : ''} ${editing ? 'is-editing' : ''}`}>
    <div className="card-controls">
      <button className={`completion-button ${workout.completed ? 'checked' : ''}`} aria-label={`${workout.completed ? 'Mark incomplete' : 'Complete'}: ${workoutLabel(workout)} on ${workout.date}`} aria-pressed={workout.completed}
        onClick={() => change(p => ({ ...p, workouts: p.workouts.map(w => w.id === workout.id ? { ...w, completed: !w.completed } : w) }))}>{workout.completed && <Check size={11} />}</button>
      {(workout.activity === 'strength' ? workout.completed && workout.notes.trim() : workout.notes || workout.qualityStyle || workout.marathonFinish) && <SessionExplanation workout={workout} settings={settings} />}
      <button className="drag-handle" {...attributes} {...listeners} aria-label={`Drag ${workoutLabel(workout)} on ${workout.date}`}><GripVertical size={14} /></button>
    </div>
    <button className="card-main" onClick={() => setEditingId(editing ? null : workout.id)} aria-expanded={editing} aria-label={`Edit ${workoutLabel(workout)} on ${workout.date}`}>
      <CardContent workout={workout} settings={settings} compact={compact} />
    </button>
    {editing && <WorkoutEditor key={`${workout.id}-${settings.units}`} workout={workout} settings={settings} close={() => setEditingId(null)} />}
  </article>;
}
