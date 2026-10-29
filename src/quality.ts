import { durationMinutes, formatPace, inUnits, paceInUnits, type Plan, type Settings, type Workout } from './model';
import { hrRangeLabel } from './zones';

export const QUALITY_SESSIONS = [
  { date: '2026-12-17', style: 'hills', reps: 6 },
  { date: '2026-12-31', style: 'hills', reps: 8 },
  { date: '2027-01-14', style: 'progression' },
  { date: '2027-01-28', style: 'progression' },
] as const;
export const ORIGINAL_QUALITY_NOTES = 'Total distance includes easy warm-up and cool-down. Quality portion only at the listed pace.';
export function mainSetMiles(w: Workout): number | null {
  const match = w.notes.match(/Main-set quality miles: (\d+(?:\.\d+)?)/);
  return match ? Number(match[1]) : null;
}

export function qualityNotes(style: Workout['qualityStyle'], reps = 6): string {
  if (style === 'hills') return `${reps} × 45 seconds uphill at controlled strong effort on a gentle slope, not a sprint. Jog or walk back down until recovered. Warm up easily for 10–15 minutes; cool down easily for at least 10 minutes. All running and recoveries fit within the total distance; use any remaining miles as easy running. Shorten the set if needed to leave room for warm-up and cool-down. Stop if form deteriorates.`;
  if (style === 'progression') return 'Continuous progression: first 40% easy, next 30% at controlled marathon effort, next 20% at threshold effort, final 10% easy cool-down. Build gradually rather than surging; do not sprint the finish. If tired, keep it easy instead.';
  return ORIGINAL_QUALITY_NOTES;
}

export function addQualityVariety(plan: Plan): Plan {
  if (plan.qualityVarietyVersion === 1) return plan;
  return { ...plan, qualityVarietyVersion: 1, workouts: plan.workouts.map(w => {
    const session = QUALITY_SESSIONS.find(s => w.id === `seed-${s.date}-threshold-` && w.date === s.date);
    if (!session || w.type !== 'threshold' || w.completed || w.qualityStyle || w.notes !== ORIGINAL_QUALITY_NOTES) return w;
    return { ...w, qualityStyle: session.style, notes: qualityNotes(session.style, session.style === 'hills' ? session.reps : undefined) };
  }) };
}

export function progressionStages(w: Workout, settings: Settings) {
  const stageMiles = (label: string) => {
    const match = w.notes.match(new RegExp(`${label}: (\\d+(?:\\.\\d+)?) mi`));
    return match ? Number(match[1]) : null;
  };
  const warm = stageMiles('Warm-up'), easy = stageMiles('Easy progression'), mp = stageMiles('MP progression');
  const threshold = stageMiles('Threshold progression'), cool = stageMiles('Cool-down');
  if (warm !== null && easy !== null && mp !== null && threshold !== null && cool !== null) {
    return [
      { label: 'Easy warm-up', distanceMiles: warm, pace: settings.paceZones.easy, hr: settings.trainingZones.hrTargets.easy },
      { label: 'Easy progression', distanceMiles: easy, pace: settings.paceZones.easy, hr: settings.trainingZones.hrTargets.easy },
      { label: 'Steady / MP', distanceMiles: mp, pace: settings.paceZones.marathonPace, hr: settings.trainingZones.hrTargets.marathonPace },
      { label: 'Threshold', distanceMiles: threshold, pace: w.paceMinPerMile, hr: w.hrZone ?? settings.trainingZones.hrTargets.threshold },
      { label: 'Easy cool-down', distanceMiles: cool, pace: settings.paceZones.easy, hr: settings.trainingZones.hrTargets.easy },
    ];
  }
  return [
    { label: 'Easy start', fraction: 0.4, pace: settings.paceZones.easy, hr: settings.trainingZones.hrTargets.easy },
    { label: 'Steady / MP', fraction: 0.3, pace: settings.paceZones.marathonPace, hr: settings.trainingZones.hrTargets.marathonPace },
    { label: 'Threshold', fraction: 0.2, pace: w.paceMinPerMile, hr: w.hrZone ?? settings.trainingZones.hrTargets.threshold },
    { label: 'Easy cool-down', fraction: 0.1, pace: settings.paceZones.easy, hr: settings.trainingZones.hrTargets.easy },
  ].map(stage => ({ ...stage, distanceMiles: w.distanceMiles * stage.fraction }));
}

export function qualityDetails(w: Workout, settings: Settings): string[] {
  const pace = (min: number, max: number) => `${formatPace(paceInUnits(min, settings.units))}–${formatPace(paceInUnits(max, settings.units))}/${settings.units}`;
  if (!w.qualityStyle) {
    const main = mainSetMiles(w);
    if (main === null || !['threshold', 'marathonPace'].includes(w.type)) return [];
    return [
      `Easy warm-up, recoveries and cool-down: ${Number(inUnits(w.distanceMiles - main, settings.units).toFixed(2))} ${settings.units} at ${pace(settings.paceZones.easy.min, settings.paceZones.easy.max)}, HR Z${settings.trainingZones.hrTargets.easy}: ${hrRangeLabel(settings.trainingZones.hrTargets.easy, settings.trainingZones.hrBoundaries)}.`,
    ];
  }
  if (w.type !== 'threshold') return [];
  if (w.qualityStyle === 'hills') return [
    'Uphill: controlled strong effort, not a sprint. Flat-equivalent pace above is a reference, not an uphill speed target; allow raw pace to slow. HR lags on short reps: use effort and form.',
    `Warm-up, downhill recoveries and cool-down: easy, ${pace(settings.paceZones.easy.min, settings.paceZones.easy.max)}, HR Z${settings.trainingZones.hrTargets.easy}: ${hrRangeLabel(settings.trainingZones.hrTargets.easy, settings.trainingZones.hrBoundaries)}.`,
  ];
  return progressionStages(w, settings).map(s =>
    `${s.label}: ${Number(inUnits(s.distanceMiles, settings.units).toFixed(2))} ${settings.units} at ${pace(s.pace.min, s.pace.max)}, HR Z${s.hr}: ${hrRangeLabel(s.hr, settings.trainingZones.hrBoundaries)}`);
}

export function qualityDuration(w: Workout, settings: Settings) {
  if (w.qualityStyle === 'progression') return progressionStages(w, settings).reduce((sum, stage) => {
    const duration = durationMinutes(stage.distanceMiles, stage.pace);
    return { min: sum.min + duration.min, max: sum.max + duration.max };
  }, { min: 0, max: 0 });
  const main = mainSetMiles(w);
  if (!w.qualityStyle && main !== null && ['threshold', 'marathonPace'].includes(w.type)) {
    const work = durationMinutes(main, w.paceMinPerMile);
    const easy = durationMinutes(w.distanceMiles - main, settings.paceZones.easy);
    return { min: work.min + easy.min, max: work.max + easy.max };
  }
  return durationMinutes(w.distanceMiles, {
    min: Math.min(w.paceMinPerMile.min, settings.paceZones.easy.min),
    max: Math.max(w.paceMinPerMile.max, settings.paceZones.easy.max),
  });
}
