import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react';
import {
  DndContext, DragOverlay, KeyboardSensor, MouseSensor, TouchSensor, useSensor, useSensors,
  useDroppable, pointerWithin, rectIntersection, closestCenter, type CollisionDetection,
  type DragEndEvent, type KeyboardCoordinateGetter,
} from '@dnd-kit/core';
import { arrayMove } from '@dnd-kit/sortable';
import { addMonths, differenceInCalendarDays, format, parseISO, startOfMonth } from 'date-fns';
import {
  AlertCircle, ArrowUpRight, CalendarDays, ChartNoAxesCombined, Check, ChevronLeft, ChevronRight,
  CircleHelp, Download, Flag, Footprints, Leaf, Menu, Moon, Plus, Redo2,
  RotateCcw, Settings2, ShieldCheck, Sun, Target, Undo2, Upload, X, MoveRight, Dumbbell,
} from 'lucide-react';
import { usePlanner, validatePlan } from './store';
import {
  allWeeks, dateKey, dayOffset, formatPace, inUnits, phaseForWeek, weekKey, weekStats,
  workoutLabel, type Workout, type Settings, type WorkoutType, type Activity, LABELS,
} from './model';
import { createDefaultPlan, planWeekNumber } from './seed';
import { getWarnings, warningsForWeek } from './rules';
import { download, exportICS } from './files';
import { WeekBoard } from './components/WeekBoard';
import { MonthOverview } from './components/MonthOverview';
import { CardContent } from './components/WorkoutCard';
import { RuleWarnings } from './components/RuleWarnings';
import { StrengthPage } from './components/StrengthPage';
import { SettingsPanel } from './components/SettingsPanel';
import { AddWorkout } from './components/AddWorkout';
import { Modal } from './components/Modal';
import { formatDistance } from './distance';
import { addCompletedStrength } from './random-strength';

const InsightsPage = lazy(() => import('./components/InsightsPage').then(module => ({ default: module.InsightsPage })));
type Page = 'calendar' | 'strength' | 'insights';
const pageFromHash = (): Page => window.location.hash === '#strength' ? 'strength' : ['#insights', '#mileage'].includes(window.location.hash) ? 'insights' : 'calendar';
const collisionDetection: CollisionDetection = args => {
  if (!args.pointerCoordinates) {
    return closestCenter({
      ...args,
      droppableContainers: args.droppableContainers.filter(container =>
        String(container.id).startsWith('day:') || container.id === 'previous-week' || container.id === 'next-week'),
    });
  }
  const pointer = pointerWithin(args);
  if (pointer.length) return pointer;
  const rectangles = rectIntersection(args);
  return rectangles.length ? rectangles : closestCenter(args);
};
const calendarCoordinates = (keyboardDate: { current: string | null }): KeyboardCoordinateGetter => (event, { context, currentCoordinates }) => {
  const offsets: Record<string, number> = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -7, ArrowDown: 7 };
  const offset = offsets[event.code];
  if (!offset) return;
  event.preventDefault();
  const currentDate = keyboardDate.current ?? context.over?.data.current?.date ?? context.active?.data.current?.date;
  if (typeof currentDate !== 'string' || !context.collisionRect) return;
  const targetDate = dayOffset(currentDate, offset);
  let target = context.droppableContainers.get(`day:${targetDate}`);
  if (!target) {
    target = context.droppableContainers.get(offset < 0 ? 'previous-week' : 'next-week');
  }
  const rect = target && context.droppableRects.get(target.id);
  if (rect) {
    keyboardDate.current = targetDate;
    return {
      x: currentCoordinates.x + rect.left + rect.width / 2 - context.collisionRect.left - context.collisionRect.width / 2,
      y: currentCoordinates.y + rect.top + rect.height / 2 - context.collisionRect.top - context.collisionRect.height / 2,
    };
  }
};
function WeekDropTarget({ direction, active, selectedWeek, navigate, period }: {
  direction: -1 | 1; active: Workout | null; selectedWeek: string; navigate: () => void; period: 'week' | 'month';
}) {
  const target = active ? dayOffset(active.date, direction * 7) : dayOffset(selectedWeek, direction * 7);
  const { setNodeRef, isOver } = useDroppable({ id: direction === -1 ? 'previous-week' : 'next-week', data: { date: target }, disabled: !active });
  return <button ref={setNodeRef} className={`week-nav-button ${isOver ? 'drop-over' : ''}`} onClick={navigate} aria-label={`${active ? 'Drop on' : 'Go to'} ${direction === -1 ? 'previous' : 'next'} ${active ? 'week' : period}`} title={active ? 'Drop to move this workout one week' : undefined}>
    {direction === -1 ? <ChevronLeft size={17} /> : <ChevronRight size={17} />}
  </button>;
}
function GoalBanner({ settings }: { settings: Settings }) {
  const days = differenceInCalendarDays(parseISO(settings.raceDate), new Date());
  const remainingDays = Math.max(0, days);
  const weeksToGo = Math.floor(remainingDays / 7);
  const extraDays = remainingDays % 7;
  const parts = settings.goalTime.split(':').map(Number);
  const goalMinutes = parts[0] * 60 + parts[1] + parts[2] / 60;
  return <section className="goal-banner">
    <div className="goal-copy"><span className="eyebrow"><span className="live-dot" />THE ROAD TO 26.2</span><h2>Big goals.<br />One week at a time.</h2><p>Show up. Find your rhythm. Trust the process.</p></div>
    <svg className="route-art" viewBox="0 0 360 150" fill="none" aria-hidden="true"><path d="M5 132C80 144 42 23 120 47S161 133 209 82 245 14 332 30" stroke="currentColor" strokeWidth="2" strokeDasharray="5 6" /><circle cx="120" cy="47" r="7" fill="var(--hero)" stroke="currentColor" strokeWidth="2" /><circle cx="209" cy="82" r="7" fill="var(--hero)" stroke="currentColor" strokeWidth="2" /><circle cx="332" cy="30" r="13" fill="currentColor" /><path d="m326 30 4 4 8-8" stroke="var(--hero)" strokeWidth="2" /><text x="102" y="25">BASE</text><text x="190" y="112">BUILD</text><text x="302" y="65">RACE DAY</text></svg>
    <div className="goal-details"><div className="race-countdown"><span>{remainingDays}</span><div>days to go<small>{weeksToGo} {weeksToGo === 1 ? 'week' : 'weeks'}{extraDays > 0 ? ` + ${extraDays} ${extraDays === 1 ? 'day' : 'days'}` : ''} to go</small><small>{format(parseISO(settings.raceDate), 'EEEE d MMM yyyy')}</small></div><Flag size={24} /></div>
      <div className="goal-metrics"><span><small>GOAL TIME</small><strong>{settings.goalTime}</strong></span><i /><span><small>TARGET PACE</small><strong>{formatPace(goalMinutes / inUnits(26.2, settings.units))}<em> /{settings.units}</em></strong></span></div></div>
  </section>;
}

export default function App() {
  const { plan, change, past, future, undo, redo, error, retrySave } = usePlanner();
  const [week, setWeek] = useState(() => weekKey(new Date()));
  const [month, setMonth] = useState(() => dateKey(startOfMonth(new Date())));
  const [view, setView] = useState<'week' | 'month' | 'agenda'>(() => window.matchMedia('(max-width: 760px)').matches ? 'agenda' : 'week');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [modal, setModal] = useState<'settings' | 'export' | 'reset' | 'help' | 'import' | 'add' | null>(null);
  const [pendingImport, setPendingImport] = useState<ReturnType<typeof validatePlan> | null>(null);
  const [notice, setNotice] = useState('');
  const [mobileNav, setMobileNav] = useState(false);
  const [page, setPage] = useState<Page>(pageFromHash);
  useEffect(() => {
    const onHashChange = () => {
      if (['', '#calendar', '#strength', '#insights', '#mileage'].includes(window.location.hash)) setPage(pageFromHash());
    };
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);
  const inputRef = useRef<HTMLInputElement>(null);
  const keyboardDate = useRef<string | null>(null);
  const keyboardCoordinates = useMemo(() => calendarCoordinates(keyboardDate), []);
  const sensors = useSensors(useSensor(MouseSensor, { activationConstraint: { distance: 6 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 220, tolerance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: keyboardCoordinates }));
  const active = plan.workouts.find(w => w.id === activeId) ?? null;
  const warnings = useMemo(() => getWarnings(plan.workouts), [plan.workouts]);
  const selectedWarnings = warningsForWeek(warnings, week);
  const warningDates = new Map<string, number>();
  warnings.forEach(w => w.dates.forEach(date => warningDates.set(date, (warningDates.get(date) ?? 0) + 1)));
  const weeklyWorkouts = plan.workouts.filter(w => weekKey(w.date) === week);
  const stats = weekStats(weeklyWorkouts);
  const completedMiles = weekStats(weeklyWorkouts.filter(workout => workout.completed)).miles;
  const weeks = useMemo(() => allWeeks(plan), [plan]);
  const phase = phaseForWeek(week, plan.settings.raceDate);
  const completedRuns = weeklyWorkouts.filter(w => w.completed).length;
  const previousStats = weekStats(plan.workouts.filter(w => weekKey(w.date) === dayOffset(week, -7)));
  const mileageChange = previousStats.miles > 0 ? Math.round((stats.miles / previousStats.miles - 1) * 100) : null;
  useEffect(() => { document.documentElement.classList.toggle('dark', plan.settings.darkMode); }, [plan.settings.darkMode]);
  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(''), 6000);
    return () => clearTimeout(timer);
  }, [notice]);
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLElement && (e.target.matches('input, textarea, select') || e.target.isContentEditable) || document.querySelector('dialog[open]')) return;
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'z') { e.preventDefault(); if (e.shiftKey) redo(); else undo(); }
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'y') { e.preventDefault(); redo(); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [undo, redo]);
  const navigate = (date: string) => { setEditingId(null); setWeek(weekKey(date)); setMonth(dateKey(startOfMonth(parseISO(date)))); };
  const addWorkout = (date: string, type: WorkoutType = 'easy', activity?: Activity) => {
    const id = crypto.randomUUID();
    const zone = Object.entries(plan.settings.paceZones).find(([key]) => key === type)?.[1] ?? plan.settings.paceZones.easy;
    change(p => ({ ...p, workouts: [...p.workouts, {
      id, date, type, activity, distanceMiles: ['crossTraining', 'rest'].includes(type) ? 0 : 5, paceMinPerMile: { ...zone },
      hrCapBpm: ['easy', 'long'].includes(type) ? p.settings.maxEasyHR : undefined, notes: '', completed: false,
    }] }));
    navigate(date);
    setModal(null);
    setEditingId(id);
  };
  function dragEnd({ active: dragged, over }: DragEndEvent) {
    setActiveId(null);
    if (!over) return;
    const date = keyboardDate.current ?? over.data.current?.date;
    if (typeof date !== 'string') return;
    const item = plan.workouts.find(w => w.id === dragged.id);
    if (!item || (item.date === date && dragged.id === over.id)) return;
    change(p => {
      const oldIndex = p.workouts.findIndex(w => w.id === dragged.id);
      const newIndex = p.workouts.findIndex(w => w.id === over.id);
      const moved = newIndex >= 0 ? arrayMove(p.workouts, oldIndex, newIndex) : p.workouts;
      return { ...p, workouts: moved.map(w => w.id === dragged.id ? { ...w, date } : w) };
    });
    if (over.id === 'previous-week' || over.id === 'next-week') navigate(date);
    setNotice(`${workoutLabel(item)} moved to ${format(parseISO(date), 'EEEE d MMMM')}.`);
  }
  const toggleUnits = (units: Settings['units']) => change(p => ({ ...p, settings: { ...p.settings, units } }));
  return <div className="app-shell">
    <a className="skip-link" href="#main">Skip to {page === 'strength' ? 'strength workouts' : page === 'insights' ? 'plan insights' : 'calendar'}</a>
    <aside className={`sidebar ${mobileNav ? 'mobile-open' : ''}`}>
      <a href="#calendar" className="brand" aria-label="Marathon Planner home" onClick={() => { setPage('calendar'); setMobileNav(false); }}><span className="brand-mark"><Footprints size={22} strokeWidth={2.1} /></span><span>marathon<span className="brand-secondary">planner<span className="brand-period">.</span></span></span></a>
      <button className="mobile-close icon-button" onClick={() => setMobileNav(false)} aria-label="Close navigation"><X size={20} /></button>
      <div className="sidebar-label">YOUR WORKSPACE</div>
      <nav aria-label="Main navigation">
        <a href="#calendar" className={`nav-item ${page === 'calendar' ? 'active' : ''}`} aria-current={page === 'calendar' ? 'page' : undefined} onClick={() => { setPage('calendar'); setMobileNav(false); }}><CalendarDays size={18} />Training calendar{page === 'calendar' && <span className="nav-active-dot" />}</a>
        <a href="#insights" className={`nav-item ${page === 'insights' ? 'active' : ''}`} aria-current={page === 'insights' ? 'page' : undefined} onClick={() => { setPage('insights'); setMobileNav(false); }}><ChartNoAxesCombined size={18} />Plan insights{page === 'insights' && <span className="nav-active-dot" />}</a>
        <a href="#strength" className={`nav-item ${page === 'strength' ? 'active' : ''}`} aria-current={page === 'strength' ? 'page' : undefined} onClick={() => { setPage('strength'); setMobileNav(false); }}><Dumbbell size={18} />Strength workouts{page === 'strength' && <span className="nav-active-dot" />}</a>
        <button className="nav-item" onClick={() => { setModal('settings'); setMobileNav(false); }}><Settings2 size={18} />Settings</button>
      </nav>
      <div className="sidebar-plan"><span className="sidebar-label">THE CURRENT CHAPTER</span><span className="chapter-icon"><Leaf size={19} /></span><strong>Building the foundation</strong><p>Easy miles today.<br />A stronger runner tomorrow.</p><div className="chapter-progress"><span /></div><div className="chapter-caption"><span>Base phase</span><span>Until 13 Dec</span></div></div>
      <div className="sidebar-bottom"><div className="local-note"><ShieldCheck size={17} /><span>Your plan, just yours.<small>Saved on this device. No account needed.</small></span></div>
        <button className="nav-item" onClick={() => setModal('help')}><CircleHelp size={17} />A little help<ArrowUpRight size={14} /></button>
        <div className="sidebar-footer"><span className="avatar">C</span><span>My training space<small>Make it your own</small></span><span className="online-dot" /></div>
      </div>
    </aside>
    {mobileNav && <button className="nav-backdrop" onClick={() => setMobileNav(false)} aria-label="Close mobile navigation" />}
    <main id="main">
      <header className="topbar"><div><button className="mobile-menu icon-button" onClick={() => setMobileNav(true)} aria-label="Open navigation"><Menu size={21} /></button><span className="breadcrumb">My workspace <ChevronRight size={12} /><strong>{page === 'strength' ? 'Strength workouts' : page === 'insights' ? 'Plan insights' : 'Training calendar'}</strong></span></div>
        <div className="topbar-actions"><span className="saved-label"><span className={error ? 'error-dot' : 'online-dot'} />{error ? 'Not saved' : 'Saved on this device'}</span><button className="icon-button theme-toggle" aria-label={`Switch to ${plan.settings.darkMode ? 'light' : 'dark'} mode`} onClick={() => change(p => ({ ...p, settings: { ...p.settings, darkMode: !p.settings.darkMode } }))}>{plan.settings.darkMode ? <Sun size={18} /> : <Moon size={18} />}</button><span className="avatar small-avatar">C</span></div>
      </header>
      <div className="main-content">
        {error && <div className="error-banner" role="alert">{error}<button onClick={retrySave}>Retry saving</button></div>}
        <div hidden={page !== 'strength'} id="strength"><StrengthPage workouts={weeklyWorkouts} allWorkouts={plan.workouts} weeks={weeks} selectedWeek={week} onWeekChange={navigate}
          onSaveWorkout={workout => {
            change(current => addCompletedStrength(current, workout));
            return usePlanner.getState().error;
          }} /></div>
        {page === 'insights' && <Suspense fallback={<p role="status">Loading plan insights…</p>}><InsightsPage plan={plan} selectedWeek={week} onSelect={navigate} onUnitsChange={toggleUnits} onCalendar={date => { navigate(date); setPage('calendar'); window.location.hash = 'calendar'; }} /></Suspense>}
        {page === 'calendar' && <div>
        <div className="page-heading"><div><span className="eyebrow muted-eyebrow">CONSISTENCY OVER PERFECTION</span><h1>Your training, in stride<span>.</span></h1><p>A plan with purpose. The flexibility to make it yours.</p></div>
          <div className="heading-actions"><button className="secondary-button" onClick={() => setModal('export')}><Download size={16} />Export plan</button><button className="primary-button" onClick={() => setModal('add')}><Plus size={17} />Add workout</button></div>
        </div>
        <GoalBanner settings={plan.settings} />
        <div className="stats-row">
          <section className="stat-card"><span className="stat-icon olive"><Footprints size={20} /></span><div><span className="stat-label">Planned this week</span><div className="stat-value">{formatDistance(inUnits(stats.miles, plan.settings.units))}<small>{plan.settings.units}</small></div></div><span className="stat-detail">{formatDistance(inUnits(completedMiles, plan.settings.units))} {plan.settings.units} completed{mileageChange !== null && ` · ${mileageChange > 0 ? '+' : ''}${mileageChange}% planned vs last week`}</span></section>
          <section className="stat-card"><span className="stat-icon blue"><CalendarDays size={20} /></span><div><span className="stat-label">Run days</span><div className="stat-value">{stats.runDays}<small>/ 7 days</small></div></div><span className="stat-detail">{completedRuns} of {weeklyWorkouts.length} sessions done</span></section>
          <section className="stat-card"><span className="stat-icon peach"><Target size={20} /></span><div><span className="stat-label">Hard days</span><div className="stat-value">{stats.hardDays}<small>/ 2 suggested</small></div></div><span className={`stat-detail ${stats.hardDays > 2 ? 'text-amber' : ''}`}>{stats.hardDays > 2 ? 'Make room for recovery' : 'Balance is the goal'}</span></section>
        </div>
        <DndContext sensors={sensors} collisionDetection={collisionDetection} onDragStart={e => { keyboardDate.current = e.activatorEvent instanceof KeyboardEvent ? String(e.active.data.current?.date) : null; setActiveId(String(e.active.id)); setEditingId(null); }} onDragEnd={dragEnd} onDragCancel={() => { setActiveId(null); setNotice('Move cancelled.'); }}
          accessibility={{
            screenReaderInstructions: { draggable: 'Press Space or Enter to pick up a workout. Use Left and Right to move days, Up and Down to move weeks. Press Space to drop or Escape to cancel. Previous and next week arrows are also drop targets.' },
            announcements: {
              onDragStart: ({ active: a }) => `Picked up ${workoutLabel(plan.workouts.find(w => w.id === a.id)!)}. Use arrow keys to select a day.`,
              onDragOver: ({ over }) => over ? `Over ${keyboardDate.current ?? over.data.current?.date}. Press Space to drop. Warnings never block a move.` : 'Outside calendar.',
              onDragEnd: ({ over }) => over ? `Workout dropped on ${keyboardDate.current ?? over.data.current?.date}.` : 'Workout was not moved.',
              onDragCancel: () => 'Move cancelled.',
            },
          }}>
          <section className="calendar-panel" id="calendar">
            <header className="calendar-top"><div><h2>Training calendar</h2><span className="calendar-hint">A little structure. A lot of possibility.</span></div>
              <div className="calendar-top-actions"><div className="unit-toggle" aria-label="Distance units">{(['mi', 'km'] as const).map(unit => <button key={unit} aria-pressed={plan.settings.units === unit} className={plan.settings.units === unit ? 'selected' : ''} onClick={() => toggleUnits(unit)}>{unit}</button>)}</div>
                <div className="view-toggle" aria-label="Calendar view">{(['week', 'agenda', 'month'] as const).map(v => <button key={v} className={view === v ? 'selected' : ''} aria-pressed={view === v} onClick={() => { setView(v); setEditingId(null); }}>{v === 'week' ? 'Week' : v === 'agenda' ? 'Agenda' : 'Month'}</button>)}</div>
              </div></header>
            <div className="calendar-toolbar"><div className="week-heading"><h3>{view !== 'month' ? `${format(parseISO(week), 'd MMM')} – ${format(parseISO(dayOffset(week, 6)), 'd MMM yyyy')}` : format(parseISO(month), 'MMMM yyyy')}</h3><span className={`phase-pill phase-${phase.toLowerCase()}`}><Leaf size={12} />{phase}</span><span className="week-number">{phase === 'Base' ? 'Foundation' : `Plan week ${planWeekNumber(week)}`}</span></div>
              <div className="calendar-navigation"><button className="today-button" onClick={() => navigate(dateKey(new Date()))}>Today</button>
                <WeekDropTarget direction={-1} active={active} selectedWeek={week} period={view === 'month' ? 'month' : 'week'} navigate={() => navigate(view !== 'month' ? dayOffset(week, -7) : dateKey(addMonths(parseISO(month), -1)))} />
                <WeekDropTarget direction={1} active={active} selectedWeek={week} period={view === 'month' ? 'month' : 'week'} navigate={() => navigate(view !== 'month' ? dayOffset(week, 7) : dateKey(addMonths(parseISO(month), 1)))} />
                <label className="jump-week"><CalendarDays size={15} /><select aria-label="Jump to week" value={week} onChange={e => navigate(e.target.value)}>{!weeks.includes(week) && <option value={week}>{format(parseISO(week), 'd MMM yyyy')}</option>}{weeks.map(w => <option key={w} value={w}>{format(parseISO(w), 'd MMM yyyy')}</option>)}</select></label>
              </div></div>
            {active && <div className="drag-tip">Moving {workoutLabel(active).toLowerCase()} <MoveRight size={14} /> Drop on any day, or on a navigation arrow to move one week.</div>}
            {view !== 'month' ? <WeekBoard agenda={view === 'agenda'} week={week} workouts={plan.workouts} settings={plan.settings} warningDates={warningDates} editingId={editingId} setEditingId={setEditingId} onAdd={addWorkout} />
              : <MonthOverview month={month} workouts={plan.workouts} settings={plan.settings} warningDates={warningDates} editingId={editingId} setEditingId={setEditingId} onAdd={addWorkout} />}
            <footer className="calendar-footer"><div className="legend">{(['easy', 'long', 'threshold', 'marathonPace', 'parkrun', 'crossTraining', 'rest', 'race'] as const).map(t => <span key={t}><i className={`type-dot type-${t}`} />{LABELS[t]}</span>)}</div><span className="drag-caption">Drag to rearrange. Click to make it yours.</span></footer>
          </section>
          <DragOverlay dropAnimation={null}>{active && <div className={`workout-card drag-overlay type-${active.type}`}><CardContent workout={active} settings={plan.settings} /></div>}</DragOverlay>
        </DndContext>
        <div className="calendar-checks"><a href="#insights" className="secondary-button" onClick={() => setPage('insights')}><ChartNoAxesCombined size={16} />Explore planned vs completed mileage</a><RuleWarnings warnings={selectedWarnings} onNavigate={navigate} /></div>
        <footer className="page-footer"><span><Leaf size={14} />Progress isn't always a straight line. Keep going.</span><div><button disabled={!past.length} onClick={undo} title="Undo (Cmd/Ctrl+Z)" aria-label="Undo last change"><Undo2 size={15} />Undo</button><button disabled={!future.length} onClick={redo} title="Redo (Cmd/Ctrl+Shift+Z)" aria-label="Redo last change"><Redo2 size={15} />Redo</button><i /><button onClick={() => setModal('reset')}><RotateCcw size={14} />Reset to default plan</button></div></footer>
        </div>}
      </div>
    </main>
    <input ref={inputRef} className="sr-only" type="file" accept=".json,application/json" aria-label="Import plan JSON" onChange={async event => {
      const file = event.target.files?.[0]; event.target.value = '';
      if (!file) return;
      try {
        if (file.size > 10_000_000) throw new Error('Choose a JSON file smaller than 10 MB.');
        const imported = validatePlan(JSON.parse(await file.text()));
        setPendingImport(imported); setModal('import');
      } catch (e) { console.error('Plan import failed', e); setModal(null); setNotice(`Import failed: ${e instanceof Error ? e.message : 'Unreadable JSON file.'}`); }
    }} />
    {notice && <div className="toast" role={notice.startsWith('Import failed') ? 'alert' : 'status'}>{notice.startsWith('Import failed') ? <AlertCircle size={16} /> : <Check size={16} />}<span>{notice}</span><button onClick={() => setNotice('')} aria-label="Dismiss notification"><X size={15} /></button></div>}
    {modal === 'settings' && <SettingsPanel close={() => setModal(null)} />}
    {modal === 'add' && <AddWorkout selectedDate={week} settings={plan.settings} close={() => setModal(null)} onAdd={addWorkout} />}
    {modal === 'export' && <Modal title="Take your plan with you" onClose={() => setModal(null)}><p className="modal-intro">A backup for peace of mind, or a calendar that goes wherever you do.</p><div className="export-options">
      <button onClick={() => { download(JSON.stringify(plan, null, 2), 'marathon-plan.json', 'application/json'); setModal(null); setNotice('JSON backup exported.'); }}><Download size={22} /><span><strong>Export JSON</strong><small>Complete plan and settings. Import it anytime.</small></span><ArrowUpRight size={17} /></button>
      <button onClick={() => { download(exportICS(plan), 'marathon-plan.ics', 'text/calendar;charset=utf-8'); setModal(null); setNotice('Calendar exported as an .ics file.'); }}><CalendarDays size={22} /><span><strong>Export calendar (.ics)</strong><small>All-day events for Apple, Google or Outlook.</small></span><ArrowUpRight size={17} /></button>
      <button onClick={() => inputRef.current?.click()}><Upload size={22} /><span><strong>Import JSON backup</strong><small>Replace your plan. You can undo the import.</small></span><ArrowUpRight size={17} /></button>
    </div></Modal>}
    {modal === 'reset' && <Modal title="A fresh starting line?" onClose={() => setModal(null)}><p className="modal-intro">This restores the original training plan and settings. Your edits will be replaced, but you can undo the reset.</p><div className="modal-actions"><button className="secondary-button" onClick={() => setModal(null)}>Keep my plan</button><button className="primary-button" onClick={() => { change(() => createDefaultPlan()); navigate('2026-10-26'); setModal(null); setNotice('Default plan restored. Undo is available.'); }}>Reset plan</button></div></Modal>}
    {modal === 'import' && pendingImport && <Modal title="Bring in your saved plan?" onClose={() => { setModal(null); setPendingImport(null); }}><p className="modal-intro">Import {pendingImport.workouts.length} workouts and their settings? This replaces your current plan. You can undo this change.</p><div className="modal-actions"><button className="secondary-button" onClick={() => setModal(null)}>Cancel</button><button className="primary-button" onClick={() => { change(() => pendingImport); navigate(pendingImport.workouts[0]?.date ?? pendingImport.settings.raceDate); setModal(null); setPendingImport(null); setNotice('Plan imported and saved.'); }}>Import plan</button></div></Modal>}
    {modal === 'help' && <Modal title="Find your stride" onClose={() => setModal(null)}><div className="help-content"><h3>Make the calendar work for you</h3><p>Click a workout to edit its distance, pace, type, HR cap or notes. Use the circle to mark it done.</p><h3>Move a session</h3><p>Drag the grip on a card to any day. Drop on the previous or next arrow to move it to the same weekday in another week. Month view makes longer moves easy.</p><h3>Keyboard & touch</h3><p>Focus a card's grip and press Space. Left/right changes day; up/down changes week. Space drops and Escape cancels. On touch, hold the grip briefly, then drag.</p><h3>Guardrails, not rules</h3><p>Warnings update after each change and never block a move. Parkrun is always counted as hard, even when relaxed. Badminton is assumed to be in the evening.</p><h3>Your plan stays here</h3><p>Changes save to this browser. Export JSON for backups; export ICS for your calendar. Undo/redo keeps the last 100 edits in this session. Cmd/Ctrl+Z undoes; Shift+Cmd/Ctrl+Z redoes.</p><p className="field-help">The default plan is a starting point, not individual coaching or medical advice. Adjust the training to your experience, recovery and health.</p></div></Modal>}
  </div>;
}
