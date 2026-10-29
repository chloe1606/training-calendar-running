import { eachDayOfInterval, endOfMonth, endOfWeek, startOfMonth, startOfWeek, parseISO, isSameMonth } from 'date-fns';
import { dateKey } from '../model';
import { DayColumn, type DayColumnProps } from './DayColumn';

interface MonthProps extends Omit<DayColumnProps, 'date' | 'workouts' | 'warnings'> {
  month: string;
  workouts: DayColumnProps['workouts'];
  warningDates: Map<string, number>;
}
export function MonthOverview({ month, workouts, warningDates, ...props }: MonthProps) {
  const selected = parseISO(month);
  const days = eachDayOfInterval({
    start: startOfWeek(startOfMonth(selected), { weekStartsOn: 1 }),
    end: endOfWeek(endOfMonth(selected), { weekStartsOn: 1 }),
  });
  return <div className="board-scroll"><div className="month-board">
    {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map(d => <div key={d} className="month-weekday">{d}</div>)}
    {days.map(day => {
      const date = dateKey(day);
      return <DayColumn key={date} {...props} date={date} compact outsideMonth={!isSameMonth(day, selected)}
        workouts={workouts.filter(w => w.date === date)} warnings={warningDates.get(date) ?? 0} />;
    })}
  </div></div>;
}
