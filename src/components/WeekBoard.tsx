import { dayOffset } from '../model';
import { DayColumn, type DayColumnProps } from './DayColumn';

interface WeekBoardProps extends Omit<DayColumnProps, 'date' | 'workouts' | 'warnings'> {
  week: string;
  workouts: DayColumnProps['workouts'];
  warningDates: Map<string, number>;
}
export function WeekBoard({ week, workouts, warningDates, ...props }: WeekBoardProps) {
  return <div className="board-scroll"><div className="week-board">
    {Array.from({ length: 7 }, (_, i) => {
      const date = dayOffset(week, i);
      return <DayColumn key={date} {...props} date={date} workouts={workouts.filter(w => w.date === date)} warnings={warningDates.get(date) ?? 0} />;
    })}
  </div></div>;
}
