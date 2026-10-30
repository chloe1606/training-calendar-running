import { useEffect, useId, useReducer, useRef, useState, type Dispatch } from 'react';
import { Dumbbell, Pause, Play, RotateCcw, Timer, PersonStanding, Armchair, BrickWall, Hand } from 'lucide-react';
import routines from '../strength-routines.json';
import { MOVE_GUIDES, MOVE_PROGRESSIONS, bodyAreas, moveDifficulty, guidesForNotes, equipmentTags, workoutFlowSteps, strengthSummary, strengthDurationLabel, type EquipmentKind, type MoveGuide, type ExercisePose } from '../strength-guide';
import { initialRestTimer, restTimerLabel, restTimerReducer, restStepDurations, validRestSeconds, type RestTimerState, type RestTimerAction } from '../rest-timer';
import { initialStopwatch, stopwatchLabel, stopwatchReducer } from '../stopwatch';
import { type Workout } from '../model';
import { generateStrengthWorkout, type GeneratedStrength, type StrengthIntensity } from '../random-strength';

function EquipmentIcon({ kind }: { kind: EquipmentKind }) {
  if (kind === 'dumbbell') return <Dumbbell size={14} aria-hidden="true" />;
  if (kind === 'bodyweight') return <PersonStanding size={14} aria-hidden="true" />;
  if (kind === 'chair') return <Armchair size={14} aria-hidden="true" />;
  if (kind === 'wall') return <BrickWall size={14} aria-hidden="true" />;
  if (kind === 'support') return <Hand size={14} aria-hidden="true" />;
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {kind === 'band' ? <><ellipse cx="12" cy="12" rx="9" ry="5" transform="rotate(-35 12 12)" /><ellipse cx="12" cy="12" rx="6" ry="2.5" transform="rotate(-35 12 12)" /></>
      : kind === 'step' ? <><path d="M3 11h18v5H3zM5 16v4m14-4v4M7 7h10" /></>
        : <><path d="M8 9V7a4 4 0 0 1 8 0v2M9 9V7a3 3 0 0 1 6 0v2" /><path d="M7 10h10l3 9a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z" /></>}
  </svg>;
}
export function EquipmentLabels({ move }: { move: MoveGuide }) {
  return <span className="equipment-tags">{equipmentTags(move).map(tag => <span className="equipment-tag" key={tag.kind}><EquipmentIcon kind={tag.kind} />{tag.label}</span>)}</span>;
}

function Pose({ pose, label }: { pose: ExercisePose; label: string }) {
  return <div className="exercise-pose">
    <svg viewBox="0 0 200 130" role="img" aria-label={label}>
      <path d="M12 120H188" className="diagram-floor" />
      {pose.equipment && <path d={pose.equipment} className="diagram-equipment" />}
      <g fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
        <circle cx={pose.head[0]} cy={pose.head[1]} r="10" />
        <path d={pose.body} /><path d={pose.arms} /><path d={pose.legs} />
      </g>
    </svg>
    <span>{label.slice(label.indexOf(':') + 2)}</span>
  </div>;
}
export function ExerciseDiagram({ move }: { move: MoveGuide }) {
  const progression = MOVE_PROGRESSIONS[move.id];
  return <figure className="exercise-diagram">
    <div><Pose pose={move.poses[0]} label={`${move.name}: ${move.labels[0]}`} /><Pose pose={move.poses[1]} label={`${move.name}: ${move.labels[1]}`} /></div>
    <figcaption>{move.equipment && <p><strong>Equipment:</strong> {move.equipment}</p>}
      <p>{move.cue}</p>
      {move.prescription && <p><strong>Reference starting dose:</strong> {move.prescription} Follow your scheduled workout if it differs.</p>}
      {progression && <details className="move-progression">
        <summary>Optional progression: {progression.title}</summary>
        <p>Only progress when the current version feels controlled, pain-free and leaves 2-3 reps in reserve. Replace the original variation; do not add another exercise or extra sets. Keep light/recovery and taper sessions easy.</p>
        {progression.pose && <Pose pose={progression.pose} label={`${move.name}: ${progression.title}`} />}
        <p>{progression.instructions}</p>
      </details>}
    </figcaption>
  </figure>;
}

export function WorkoutFlow({ notes, onMovement, onRest }: { notes: string; onMovement: (id: string) => void; onRest?: (seconds: number) => void }) {
  const steps = workoutFlowSteps(notes);
  const [completed, setCompleted] = useState<number[]>([]);
  const next = steps.findIndex((_, index) => !completed.includes(index));
  return <section className="workout-flow" aria-label="Step-by-step workout">
    <p className="flow-progress" role="status">{completed.length} of {steps.length} steps complete{next < 0 ? ' - Workout complete!' : ` - Next: step ${next + 1}`}</p>
    <p className="field-help">Check off steps when finished. Starting a rest replaces any current countdown; check it off when ready. Progress clears when you change workouts or reload.</p>
    <ol>{steps.map((step, index) => <li className={completed.includes(index) ? 'flow-complete' : index === next ? 'flow-next' : undefined} key={`${index}:${step.text}`}>
      <span className="flow-number" aria-hidden="true">{index + 1}</span>
      <div className="flow-step" aria-current={index === next ? 'step' : undefined}>
        <label className="flow-check"><input type="checkbox" checked={completed.includes(index)} aria-label={`Step ${index + 1} complete`} onChange={event => setCompleted(previous => event.target.checked ? [...previous, index] : previous.filter(item => item !== index))} /><span>{step.moves.length > 0 && !/^(Warm-up|Cool-down|Mobility):/i.test(step.text) ? step.text.replace(/^((?:Set \d+ of \d+ - )?)[^:]+:\s*/, '$1') : step.text}</span></label>
        {(step.moves.length > 0 || (onRest && restStepDurations(step.text).length > 0)) && <div className="flow-links">{step.moves.map(move => <button key={move.id} type="button" onClick={() => onMovement(move.id)} aria-label={`Step ${index + 1}: view ${move.name}`}>
          {move.name}<span aria-hidden="true"> ↓</span>
        </button>)}{onRest && restStepDurations(step.text).map(seconds => <button key={`rest:${seconds}`} type="button" aria-label={`Step ${index + 1}: start ${seconds}s rest`} onClick={() => onRest(seconds)}><Play size={12} aria-hidden="true" />Start {seconds}s rest</button>)}</div>}
      </div>
    </li>)}</ol>
  </section>;
}

function Stopwatch() {
  const [state, dispatch] = useReducer(stopwatchReducer, initialStopwatch);
  const running = state.startedAt !== null;
  useEffect(() => {
    if (!running) return;
    const timer = window.setInterval(() => dispatch({ type: 'tick', now: performance.now() }), 200);
    return () => window.clearInterval(timer);
  }, [running]);
  return <section className="rest-timer" aria-label="Workout stopwatch">
    <h3><Timer size={16} aria-hidden="true" />Stopwatch</h3>
    <p className="field-help">Counts up while you browse. Reloading resets it.</p>
    <div className="timer-display" role="timer" aria-label="Stopwatch elapsed time" aria-live="off">{stopwatchLabel(state.elapsedMs)}</div>
    <div className="timer-status" role="status">{running ? 'Running' : state.elapsedMs > 0 ? 'Paused' : 'Ready'}</div>
    <div className="timer-actions">
      <button className="primary-button" onClick={() => dispatch({ type: running ? 'pause' : 'start', now: performance.now() })}>
        {running ? <Pause size={14} /> : <Play size={14} />}{running ? 'Pause' : state.elapsedMs > 0 ? 'Resume' : 'Start'}
      </button>
      <button className="secondary-button" onClick={() => dispatch({ type: 'reset' })}><RotateCcw size={14} />Reset</button>
    </div>
  </section>;
}

function RestTimer({ state, dispatch }: { state: RestTimerState; dispatch: Dispatch<RestTimerAction> }) {
  const [custom, setCustom] = useState('60');
  const [error, setError] = useState('');
  const inputId = useId();
  useEffect(() => { setCustom(String(state.durationSeconds)); setError(''); }, [state.durationSeconds]);
  useEffect(() => {
    if (state.endsAt === null) return;
    const timer = window.setInterval(() => dispatch({ type: 'tick', now: Date.now() }), 200);
    return () => window.clearInterval(timer);
  }, [state.endsAt]);
  function duration(seconds: number) {
    dispatch({ type: 'duration', seconds });
    setCustom(String(seconds));
    setError('');
  }
  return <section className={`rest-timer ${state.finished ? 'timer-finished' : ''}`} aria-label="Rest countdown">
    <h3><Timer size={16} />Rest timer</h3>
    <p className="field-help">Runs while you browse the app. Keep this page open; reloading resets it. Visual alert only.</p>
    <div className="timer-display" role="timer" aria-label="Rest time remaining" aria-live="off">{restTimerLabel(state.remainingMs)}</div>
    <div className="timer-status" role="status">{state.finished ? 'Rest complete. Begin when ready.' : state.endsAt !== null ? 'Resting' : state.remainingMs < state.durationSeconds * 1000 ? 'Paused' : 'Ready'}</div>
    <div className="timer-presets">{[30, 45, 60, 75, 90].map(seconds => <button key={seconds} type="button" aria-pressed={state.durationSeconds === seconds} onClick={() => duration(seconds)}>{seconds}s</button>)}</div>
    <form className="timer-custom" onSubmit={event => {
      event.preventDefault();
      const seconds = Number(custom);
      if (!validRestSeconds(seconds)) { setError('Enter whole seconds from 1 to 3600.'); return; }
      duration(seconds);
    }} noValidate>
      <label htmlFor={inputId}>Custom seconds</label>
      <div><input id={inputId} type="number" min="1" max="3600" step="1" value={custom} aria-invalid={Boolean(error)} aria-describedby={error ? `${inputId}-error` : undefined} onChange={event => setCustom(event.target.value)} /><button type="submit" className="secondary-button">Set</button></div>
      {error && <p id={`${inputId}-error`} role="alert">{error}</p>}
    </form>
    <div className="timer-actions">
      <button className="primary-button" onClick={() => dispatch({ type: state.endsAt === null ? 'start' : 'pause', now: Date.now() })}>
        {state.endsAt === null ? <Play size={14} /> : <Pause size={14} />}{state.endsAt !== null ? 'Pause' : state.finished ? 'Restart' : state.remainingMs < state.durationSeconds * 1000 ? 'Resume' : 'Start'}
      </button>
      <button className="secondary-button" onClick={() => dispatch({ type: 'reset' })}><RotateCcw size={14} />Reset</button>
    </div>
  </section>;
}

export function StrengthPage({ workouts, weeks, selectedWeek, onWeekChange }: {
  workouts: Workout[]; weeks: string[]; selectedWeek: string; onWeekChange: (week: string) => void;
}) {
  const scheduled = workouts.filter(w => w.activity === 'strength');
  const [selection, setSelection] = useState('week');
  const [search, setSearch] = useState('');
  const [intensity, setIntensity] = useState<StrengthIntensity>('light');
  const [generated, setGenerated] = useState<GeneratedStrength | null>(null);
  const [restState, restDispatch] = useReducer(restTimerReducer, initialRestTimer);
  const generatedHeading = useRef<HTMLHeadingElement>(null);
  const movementRefs = useRef(new Map<string, HTMLDetailsElement>());
  function showMovement(id: string) {
    const element = movementRefs.current.get(id);
    if (!element) return;
    element.open = true;
    element.querySelector('summary')?.focus({ preventScroll: true });
    element.scrollIntoView({ behavior: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth', block: 'center' });
  }
  useEffect(() => {
    if (selection.startsWith('workout:') && !scheduled.some(w => `workout:${w.id}` === selection)) setSelection('week');
  }, [selection, scheduled]);
  const selectedWorkout = scheduled.find(w => `workout:${w.id}` === selection);
  const routineIndex = Number(selection.replace('routine:', ''));
  const routine = selection.startsWith('routine:') ? routines.routines[routineIndex] : undefined;
  const weekWorkout = selection === 'week' ? scheduled[0] : undefined;
  const workout = selectedWorkout ?? weekWorkout;
  const notes = selection === 'generated' && generated ? generated.notes : workout?.notes ?? (routine ? routine.exercises.join('\n\n') : selection === 'week' ? routines.routines[0].exercises.join('\n\n') : '');
  const title = selection === 'generated' && generated ? generated.title : workout ? `${workout.date}: ${workout.notes.split('\n')[0]}` : routine?.title ?? routines.routines[0].title;
  useEffect(() => {
    if (selection === 'generated' && generated) generatedHeading.current?.focus({ preventScroll: true });
  }, [selection, generated]);
  const library = selection === 'library';
  const moves = library ? MOVE_GUIDES.filter(move => `${move.name} ${move.equipment ?? ''} ${equipmentTags(move).map(tag => tag.label).join(' ')} ${bodyAreas(move).join(' ')} ${moveDifficulty(move)} ${move.cue}`.toLowerCase().includes(search.trim().toLowerCase())) : guidesForNotes(notes);
  return <section className="strength-page" aria-label="Strength workout guide">
    <header className="page-heading"><div><span className="eyebrow muted-eyebrow">STRONGER, ONE REP AT A TIME</span><h1><Dumbbell size={26} />Strength studio<span>.</span></h1><p>Your ten-session rotation, illustrated. Move with control.</p></div>
      <label className="strength-week">Training week<select aria-label="Strength workout week" value={selectedWeek} onChange={event => onWeekChange(event.target.value)}>
        {!weeks.includes(selectedWeek) && <option value={selectedWeek}>{selectedWeek}</option>}
        {weeks.map(week => <option key={week} value={week}>Week of {week}</option>)}
      </select></label>
    </header>
    <div className="strength-layout"><div className="strength-panel">
    <label className="strength-picker">Workout or movement library
      <select value={selection} onChange={event => setSelection(event.target.value)}>
        <option value="week">This week{scheduled.length ? '' : ' (browse Heavy 1)'}</option>
        {generated && <option value="generated">{generated.title}</option>}
        {scheduled.map(w => <option key={w.id} value={`workout:${w.id}`}>{w.date}: {w.notes.split('\n')[0]} · {strengthDurationLabel(w.notes)}</option>)}
        <optgroup label="Five heavy / five light routines">{routines.routines.map((item, index) => <option key={item.title} value={`routine:${index}`}>{item.title} · {strengthDurationLabel(item.exercises.join('\n\n'))}</option>)}</optgroup>
        <option value="library">All moves ({MOVE_GUIDES.length})</option>
      </select>
    </label>
    {library && <label className="strength-picker strength-search">Find a move
      <input type="search" value={search} onChange={event => setSearch(event.target.value)} placeholder="e.g. core, glutes, band" />
      <span role="status">{moves.length} of {MOVE_GUIDES.length} moves</span>
    </label>}
    <div className="strength-guide-content" key={`${selection}:${workouts.map(w => w.id).join(',')}`}>
      {!library && <>
        <h3 ref={generatedHeading} tabIndex={-1}>{title}</h3>
        {selection === 'generated' && <p role="status">New reference workout generated. Not added to your calendar. Use instead of a suitable strength session, not as extra training; keep recovery and taper days light.</p>}
        <p className="strength-duration"><Timer size={15} aria-hidden="true" />{strengthDurationLabel(notes)}</p>
        {selection === 'week' && scheduled.length === 0 && <p>No strength workout scheduled this week. This is a reference routine, not an instruction to add training.</p>}
        <WorkoutFlow key={`${selection}:${selectedWeek}:${notes}`} notes={notes} onMovement={showMovement} onRest={seconds => restDispatch({ type: 'restart', seconds, now: Date.now() })} />
      </>}
      {!library && <details className="workout-summary" key={`summary:${selection}:${notes}`}>
        <summary>Summary notes</summary>
        {strengthSummary(notes).length ? <ul>{strengthSummary(notes).map((text, index) => <li key={index}>{text}</li>)}</ul> : <p>No exercise sets or reps specified for this workout.</p>}
      </details>}
      {library && <p className="field-help">A menu of alternatives, not a {MOVE_GUIDES.length}-exercise workout. Introduce one unfamiliar move at a time, use bodyweight or the lightest band/weight first, and leave 2-3 reps in reserve. Inspect bands for damage; no door anchors are needed for these moves. Use a low, non-slip step and stable support.</p>}
      <div className="move-library">{moves.map((move, index) => <details className="move-guide" key={move.id} open={index === 0} ref={element => { if (element) movementRefs.current.set(move.id, element); else movementRefs.current.delete(move.id); }}>
        <summary tabIndex={0}>{move.name}<span className={`move-difficulty difficulty-${moveDifficulty(move).toLowerCase()}`} aria-label={`Difficulty: ${moveDifficulty(move)}`}>{moveDifficulty(move)}</span><EquipmentLabels move={move} /><span className="body-area-tags" aria-label="Body areas">{bodyAreas(move).map(area => <span className="body-area-tag" key={area}>{area}</span>)}</span></summary><ExerciseDiagram move={move} />
      </details>)}</div>
      {!moves.length && <p>{library ? 'No moves match your search. Try another name or equipment type.' : 'No matching illustrations for this custom workout. Choose All moves to browse the full library.'}</p>}
    </div>
    </div><aside className="strength-tools" aria-label="Workout tools"><Stopwatch /><RestTimer state={restState} dispatch={restDispatch} />
      <section className="random-workout" aria-label="Random workout generator">
        <h3><Dumbbell size={16} aria-hidden="true" />Mix up your workout</h3>
        <label className="strength-picker">Workout intensity<select value={intensity} onChange={event => setIntensity(event.target.value === 'heavy' ? 'heavy' : 'light')}>
          <option value="light">Light: core and mobility</option><option value="heavy">Heavy: main strength session</option>
        </select></label>
        <p>Creates a balanced combination with sets, reps and rest. Heavy includes legs, calves, upper body and core; light stays bodyweight and gentle.</p>
        <button className="primary-button" onClick={() => { setGenerated(generateStrengthWorkout(intensity)); setSelection('generated'); }}>Generate workout</button>
        <p>Preview only. Does not change your calendar. Reloading clears generated workouts.</p>
      </section>
    </aside></div>
  </section>;
}
