import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { format, parseISO, isToday } from 'date-fns';
import { Plus, TriangleAlert } from 'lucide-react';
import { type Workout, type Settings, inUnits, weekStats } from '../model';
import { WorkoutCard } from './WorkoutCard';
import { formatDistance } from '../distance';

export interface DayColumnProps {
  date: string; workouts: Workout[]; settings: Settings; warnings: number;
  editingId: string | null; setEditingId: (id: string | null) => void;
  onAdd: (date: string) => void; compact?: boolean; outsideMonth?: boolean; agenda?: boolean;
}
export function DayColumn({ date, workouts, settings, warnings, editingId, setEditingId, onAdd, compact, outsideMonth, agenda }: DayColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id: `day:${date}`, data: { date } });
  const today = isToday(parseISO(date));
  const miles = weekStats(workouts).miles;
  return <section ref={setNodeRef} aria-label={format(parseISO(date), 'EEEE, MMMM d')}
    className={`day-column ${isOver ? 'drop-over' : ''} ${today ? 'today-column' : ''} ${compact ? 'month-day' : ''} ${outsideMonth ? 'outside-month' : ''}`}>
    <header className="day-header">
      {!compact && <span className="day-name">{format(parseISO(date), agenda ? 'EEEE' : 'EEE')}</span>}
      <span className={`day-number ${today ? 'today-number' : ''}`}>{format(parseISO(date), 'd')}</span>
      {agenda && <span className="day-name">{format(parseISO(date), 'MMM yyyy')}</span>}
      {today && !compact && <span className="today-label">TODAY</span>}
      {warnings > 0 && <span className="day-warning" aria-label={`${warnings} warnings`} title={`${warnings} planning warnings`}><TriangleAlert size={12} /></span>}
    </header>
    <SortableContext items={workouts.map(w => w.id)} strategy={verticalListSortingStrategy}>
      <div className="day-workouts">
        {workouts.map(w => <WorkoutCard key={w.id} workout={w} settings={settings} compact={compact} editingId={editingId} setEditingId={setEditingId} />)}
      </div>
    </SortableContext>
    <button className="add-workout" onClick={() => onAdd(date)} aria-label={`Add workout on ${date}`}><Plus size={14} />{!compact && <span>Add workout</span>}</button>
    {!compact && <footer className="day-total">{miles > 0 ? `${formatDistance(inUnits(miles, settings.units))} ${settings.units}` : 'Recovery day'}</footer>}
  </section>;
}
