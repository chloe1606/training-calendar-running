import { Area, AreaChart, CartesianGrid, ReferenceArea, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { format, parseISO } from 'date-fns';
import { ArrowDownRight, ArrowUpRight, TrendingUp } from 'lucide-react';
import { allWeeks, inUnits, weekKey, weekStats, phaseForWeek, type Plan } from '../model';

export function MileageChart({ plan, selectedWeek, onSelect }: { plan: Plan; selectedWeek: string; onSelect: (date: string) => void }) {
  const data = allWeeks(plan).map((week, i) => {
    const miles = weekStats(plan.workouts.filter(w => weekKey(w.date) === week)).miles;
    return { week, label: format(parseISO(week), 'd MMM'), value: Number(inUnits(miles, plan.settings.units).toFixed(1)), miles, index: i + 1 };
  }).map((row, i, rows) => ({ ...row, change: i > 0 && rows[i - 1].miles > 0 ? Math.round((row.miles / rows[i - 1].miles - 1) * 100) : null }));
  const selected = data.find(d => d.week === selectedWeek);
  const taper = data.find(d => phaseForWeek(d.week, plan.settings.raceDate) === 'Taper');
  return <section className="mileage-panel" id="mileage">
    <div className="chart-heading"><div><h2><TrendingUp size={18} />The bigger picture</h2><p className="section-subtitle">A steady build, with room to recover.</p></div><span className="chart-key"><i />Planned {plan.settings.units}</span></div>
    <div className="chart-wrapper" role="img" aria-label="Weekly planned mileage. Use the week selector below for exact mileage and week-on-week changes.">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 16, right: 12, left: -24, bottom: 0 }} onClick={state => { if (state?.activeLabel) onSelect(String(state.activeLabel)); }}>
          <defs><linearGradient id="mileage-fill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="var(--accent)" stopOpacity={0.3} /><stop offset="100%" stopColor="var(--accent)" stopOpacity={0.01} /></linearGradient></defs>
          <CartesianGrid strokeDasharray="3 5" vertical={false} stroke="var(--line)" />
          <XAxis dataKey="week" tickFormatter={v => format(parseISO(v), 'd MMM')} interval={4} axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'var(--muted)' }} dy={8} />
          <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'var(--muted)' }} />
          <Tooltip content={({ active, payload }) => {
            const row = payload?.[0]?.payload as typeof data[number] | undefined;
            return active && row ? <div className="chart-tooltip"><strong>Week of {row.label}</strong><span>{row.value} {plan.settings.units}</span><small>{row.change === null ? 'First week' : `${row.change > 0 ? '+' : ''}${row.change}% vs previous week`}</small></div> : null;
          }} />
          {taper && <ReferenceArea x1={taper.week} x2={data[data.length - 1].week} fill="var(--accent)" fillOpacity={0.12} />}
          <ReferenceLine x={selectedWeek} stroke="var(--accent)" strokeDasharray="4 4" />
          <Area type="monotone" dataKey="value" stroke="var(--accent)" strokeWidth={2.5} fill="url(#mileage-fill)" activeDot={{ r: 5, stroke: 'var(--surface)', strokeWidth: 3 }} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
    <div className="chart-footer"><span>{selected ? <><strong>{selected.value} {plan.settings.units}</strong> this week</> : 'Select a week to explore the plan'}</span>
      {selected && selected.change !== null && <span className={`week-change ${selected.change > 10 ? 'increase-warning' : ''}`}>{selected.change < 0 ? <ArrowDownRight size={14} /> : <ArrowUpRight size={14} />}{Math.abs(selected.change)}% vs last week</span>}
      <label className="sr-only" htmlFor="chart-week">Inspect weekly mileage</label><select id="chart-week" aria-label="Inspect weekly mileage and progression" value={selectedWeek} onChange={e => onSelect(e.target.value)}>
        {!selected && <option value={selectedWeek}>Outside plan</option>}
        {data.map(d => <option key={d.week} value={d.week}>{d.label}: {d.value} {plan.settings.units}{d.change === null ? '' : ` (${d.change > 0 ? '+' : ''}${d.change}%)`}</option>)}
      </select>
    </div>
  </section>;
}
