import { type Plan } from './model';

export const MARATHON_FINISHES = [
  { date: '2027-01-31', distance: 16, finish: 4 },
  { date: '2027-02-14', distance: 18, finish: 6 },
];
export function addMarathonFinishes(plan: Plan): Plan {
  if (plan.marathonFinishesVersion === 1) return plan;
  return { ...plan, marathonFinishesVersion: 1, workouts: plan.workouts.map(w => {
    const session = MARATHON_FINISHES.find(s => w.id === `seed-${s.date}-long-` && w.date === s.date && w.distanceMiles === s.distance);
    if (!session || w.type !== 'long' || w.completed || w.marathonFinish) return w;
    return {
      ...w, marathonFinish: { distanceMiles: session.finish, paceMinPerMile: { ...plan.settings.paceZones.marathonPace } },
      notes: `${w.notes}\n\nMarathon-pace finish: first ${session.distance - session.finish} miles easy, last ${session.finish} miles at marathon pace. Practise fuelling. This is a hard day: keep the preceding day easy and reduce other quality work if needed. If fatigued, keep the whole run easy instead.`,
    };
  }) };
}
