import { TriangleAlert, ArrowUpRight, CheckCircle2, Info } from 'lucide-react';
import { type Warning } from '../rules';

export function RuleWarnings({ warnings, onNavigate }: { warnings: Warning[]; onNavigate: (date: string) => void }) {
  return <section className="warnings-panel">
    <div className="section-title"><h2><span className="warning-icon"><TriangleAlert size={16} /></span>Plan check</h2><span className="count-badge">{warnings.length}</span></div>
    <p className="section-subtitle">A little guidance. Always your call.</p>
    {warnings.length ? <div className="warning-list">{warnings.map(w => <button key={w.id} className="warning-item" onClick={() => onNavigate(w.dates[0])}>
      <span className="warning-item-top"><strong>{w.title}</strong><ArrowUpRight size={14} /></span>
      <span>{w.message}</span>
    </button>)}</div> : <div className="all-clear"><CheckCircle2 size={26} /><strong>Looking balanced</strong><p>No planning warnings for this week. Keep listening to your body.</p></div>}
    <div className="warning-disclaimer"><Info size={14} /><span>Helpful guardrails, not medical advice. Cut-back/recovery weeks are exempt from the 40% long-run share rule. Approved peak exception: 21 March, 20 miles in a 46-mile week (43.48%). Light badminton before quality or long runs is allowed; none from 12 April.</span></div>
  </section>;
}
