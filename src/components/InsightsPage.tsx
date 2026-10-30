import { format, parseISO } from 'date-fns';
import { ChartNoAxesCombined } from 'lucide-react';
import { inUnits, weekKey, weekStats, type Plan } from '../model';
import { weeklyMileage } from '../insights';
import { formatDistance } from '../distance';
import { MileageChart } from './MileageChart';
import { RuleWarnings } from './RuleWarnings';
import { getWarnings, warningsForWeek } from '../rules';

export function InsightsPage({ plan, selectedWeek, onSelect, onCalendar, onUnitsChange }: {
  plan: Plan; selectedWeek: string; onSelect: (date: string) => void; onCalendar: (date: string) => void;
  onUnitsChange: (units: Plan['settings']['units']) => void;
}) {
  const rows = weeklyMileage(plan);
  const workouts = plan.workouts.filter(workout => weekKey(workout.date) === selectedWeek);
  const planned = weekStats(workouts).miles;
  const completed = weekStats(workouts.filter(workout => workout.completed)).miles;
  const distance = (miles: number) => formatDistance(inUnits(miles, plan.settings.units));
  return <section className="insights-page" aria-label="Plan insights">
    <header className="page-heading"><div><span className="eyebrow muted-eyebrow">YOUR PLAN, IN PERSPECTIVE</span><h1><ChartNoAxesCombined size={26} />Plan insights<span>.</span></h1><p>Compare the plan with the running you have marked complete.</p></div>
      <div className="heading-actions"><div className="unit-toggle" role="group" aria-label="Insights distance units">{(['mi', 'km'] as const).map(unit => <button key={unit} type="button" aria-pressed={plan.settings.units === unit} className={plan.settings.units === unit ? 'selected' : ''} onClick={() => onUnitsChange(unit)}>{unit}</button>)}</div>
        <button className="secondary-button" onClick={() => onCalendar(selectedWeek)}>View selected week in calendar</button></div>
    </header>
    <div className="stats-row">
      <section className="stat-card"><div><span className="stat-label">Selected week · planned</span><div className="stat-value">{distance(planned)}<small>{plan.settings.units}</small></div></div></section>
      <section className="stat-card"><div><span className="stat-label">Selected week · completed</span><div className="stat-value">{distance(completed)}<small>{plan.settings.units}</small></div></div></section>
      <section className="stat-card"><div><span className="stat-label">Mileage completed</span><div className="stat-value">{planned > 0 ? `${Math.round(completed / planned * 100)}%` : '—'}</div></div></section>
    </div>
    <p className="insights-help">Completed mileage uses the distance on running workouts marked complete, not separately recorded actual mileage. Cross-training is excluded. Upcoming weeks are not missed training; there is no need to make up uncompleted miles.</p>
    <div className="below-board">
      <MileageChart plan={plan} selectedWeek={selectedWeek} onSelect={onSelect} />
      <RuleWarnings warnings={warningsForWeek(getWarnings(plan.workouts), selectedWeek)} onNavigate={onCalendar} />
    </div>
    <section className="mileage-panel insights-table">
      <h2>Weekly mileage comparison</h2>
      <p className="section-subtitle">Long run shows planned long-run sessions, including any faster finish. Races are counted in weekly mileage, not in this column.</p>
      <div className="board-scroll"><table>
        <caption className="sr-only">Planned and completed running distance in {plan.settings.units}. Select a week to inspect its chart and warnings.</caption>
        <thead><tr><th scope="col">Week of</th><th scope="col">Planned ({plan.settings.units})</th><th scope="col">Completed ({plan.settings.units})</th><th scope="col">Long run ({plan.settings.units})</th><th scope="col">Status</th></tr></thead>
        <tbody>{rows.map(row => <tr key={row.week} className={row.races.length ? 'race-week-row' : undefined} aria-current={row.week === selectedWeek ? 'true' : undefined}>
          <th scope="row"><button onClick={() => onSelect(row.week)} aria-label={`Inspect week of ${row.week}`}>{format(parseISO(row.week), 'd MMM yyyy')}</button></th>
          <td>{formatDistance(row.value)}</td><td>{formatDistance(row.completed)}</td><td>{row.longRuns.length ? row.longRuns.map(formatDistance).join(', ') : '—'}</td><td>{row.status}{row.races.map(race => <span className="race-week-label" key={race.id}>Race · {format(parseISO(race.date), 'd MMM')} · {formatDistance(race.distance)} {plan.settings.units}</span>)}</td>
        </tr>)}</tbody>
      </table></div>
    </section>
  </section>;
}
