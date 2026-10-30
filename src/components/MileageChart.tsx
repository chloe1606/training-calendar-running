import { Area, ComposedChart, Line, CartesianGrid, ReferenceArea, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { format, parseISO } from 'date-fns';
import { ArrowDownRight, ArrowUpRight, TrendingUp } from 'lucide-react';
import { phaseForWeek, type Plan } from '../model';
import { weeklyMileage } from '../insights';
import { formatDistance } from '../distance';

export function MileageChart({ plan, selectedWeek, onSelect }: { plan: Plan; selectedWeek: string; onSelect: (date: string) => void }) {
  const data = weeklyMileage(plan).map(row => ({ ...row, label: format(parseISO(row.week), 'd MMM') }));
  const selected = data.find(d => d.week === selectedWeek);
  const taper = data.find(d => phaseForWeek(d.week, plan.settings.raceDate) === 'Taper');
  return <section className="mileage-panel" id="mileage">
    <div className="chart-heading"><div><h2><TrendingUp size={18} />The bigger picture</h2><p className="section-subtitle">Planned versus marked-complete running distance.</p></div><div className="chart-keys"><span className="chart-key"><i />Planned {plan.settings.units}</span><span className="chart-key completed-key"><i />Completed {plan.settings.units}</span></div></div>
    <div className="chart-wrapper" role="img" aria-label="Weekly planned and completed mileage. Use the week selector below for exact distances and planned week-on-week changes.">
      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={data} margin={{ top: 16, right: 12, left: -24, bottom: 0 }} onClick={state => { if (state?.activeLabel) onSelect(String(state.activeLabel)); }}>
          <defs><linearGradient id="mileage-fill" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="var(--accent)" stopOpacity={0.3} /><stop offset="100%" stopColor="var(--accent)" stopOpacity={0.01} /></linearGradient></defs>
          <CartesianGrid strokeDasharray="3 5" vertical={false} stroke="var(--line)" />
          <XAxis dataKey="week" tickFormatter={v => format(parseISO(v), 'd MMM')} interval={4} axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'var(--muted)' }} dy={8} />
          <YAxis tickFormatter={formatDistance} axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'var(--muted)' }} />
          <Tooltip content={({ active, payload }) => {
            const row = payload?.[0]?.payload as typeof data[number] | undefined;
            return active && row ? <div className="chart-tooltip"><strong>Week of {row.label}</strong><span>Planned: {formatDistance(row.value)} {plan.settings.units}</span><span>Completed: {formatDistance(row.completed)} {plan.settings.units} · {row.status}</span><small>{row.change === null ? 'No previous nonzero week' : `${row.change > 0 ? '+' : ''}${row.change}% planned vs previous week`}</small></div> : null;
          }} />
          {taper && <ReferenceArea x1={taper.week} x2={data[data.length - 1].week} fill="var(--accent)" fillOpacity={0.12} />}
          <ReferenceLine x={selectedWeek} stroke="var(--accent)" strokeDasharray="4 4" />
          <Area type="monotone" dataKey="value" stroke="var(--accent)" strokeWidth={2.5} fill="url(#mileage-fill)" activeDot={{ r: 5, stroke: 'var(--surface)', strokeWidth: 3 }} />
          <Line type="linear" dataKey="chartCompleted" stroke="var(--completed-mileage)" strokeWidth={2.5} strokeDasharray="5 3" dot={false} connectNulls={false} />
        </ComposedChart>
      </ResponsiveContainer>
    </div>
    <div className="chart-footer"><span>{selected ? <><strong>{formatDistance(selected.value)} {plan.settings.units}</strong> planned · <strong>{formatDistance(selected.completed)} {plan.settings.units}</strong> completed · {selected.status}</> : 'Select a week to explore the plan'}</span>
      {selected && selected.change !== null && <span className={`week-change ${selected.change > 10 ? 'increase-warning' : ''}`}>{selected.change < 0 ? <ArrowDownRight size={14} /> : <ArrowUpRight size={14} />}{Math.abs(selected.change)}% vs last week</span>}
      <label className="sr-only" htmlFor="chart-week">Inspect weekly mileage</label><select id="chart-week" aria-label="Inspect weekly mileage and progression" value={selectedWeek} onChange={e => onSelect(e.target.value)}>
        {!selected && <option value={selectedWeek}>Outside plan</option>}
        {data.map(d => <option key={d.week} value={d.week}>{d.label}: {formatDistance(d.value)} planned / {formatDistance(d.completed)} completed {plan.settings.units}{d.change === null ? '' : ` (${d.change > 0 ? '+' : ''}${d.change}% planned)`}</option>)}
      </select>
    </div>
  </section>;
}
