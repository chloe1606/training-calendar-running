import { isValid, parseISO } from 'date-fns';
import { dateKey, type Plan, type Workout } from './model';
import { MOVE_GUIDES, moveDifficulty } from './strength-guide';

export type StrengthIntensity = 'light' | 'heavy';
export interface GeneratedStrength {
  title: string;
  notes: string;
  movementIds: string[];
}
interface Candidate { id: string; dose: string }
export interface StrengthPoolGroup { label: string; candidates: Candidate[] }
const HEAVY_SLOTS: Candidate[][] = [
  [{ id: 'split', dose: '2 sets x 8 reps per side; rest 30 s between sides, 75 s between sets.' },
    { id: 'step', dose: '2 sets x 8 reps per side; rest 30 s between sides, 75 s between sets.' },
    { id: 'goblet', dose: '2 sets x 10 reps; rest 75 s between sets.' },
    { id: 'reverse-lunge', dose: '2 sets x 6 reps per side; rest 30 s between sides, 75 s between sets.' }],
  [{ id: 'rdl', dose: '2 sets x 10 reps; lower for 3 s, rest 90 s between sets.' },
    { id: 'kickstand', dose: '2 sets x 8 reps per side; rest 30 s between sides, 90 s between sets.' },
    { id: 'bridge', dose: '2 sets x 12 reps, pause 2 s at top; rest 60 s between sets.' }],
  [{ id: 'calf', dose: '2 sets x 10 reps per side, 3 s lowering; rest 30 s between sides, 60 s between sets.' },
    { id: 'bent-calf', dose: '2 sets x 10 reps per side; rest 30 s between sides, 60 s between sets.' },
    { id: 'seated-calf', dose: '2 sets x 12 reps per side; rest 30 s between sides, 60 s between sets.' }],
  [{ id: 'db-row', dose: '2 sets x 10 reps; rest 60 s between sets.' },
    { id: 'floor-press', dose: '2 sets x 10 reps; rest 60 s between sets.' },
    { id: 'wall-push', dose: '2 sets x 10 reps; rest 60 s between sets.' }],
  [{ id: 'deadbug', dose: '2 sets x 6 slow reps per side; rest 30 s between sets.' },
    { id: 'bird', dose: '2 sets x 6 reps per side, hold 3 s; rest 30 s between sets.' },
    { id: 'plank', dose: '2 sets x 15 s per side from knees; rest 15 s between sides, 30 s between sets.' }],
];
const LIGHT_SLOTS: Candidate[][] = [
  [{ id: 'slide', dose: '1 set x 6 slow reps per side; rest 30 s.' },
    { id: 'tilt', dose: '1 set x 8 gentle reps; rest 30 s.' },
    { id: 'reach', dose: '1 set x 6 reps per side; rest 30 s.' }],
  [{ id: 'clam', dose: '1 set x 8 reps per side, bodyweight only; rest 15 s between sides, then 30 s.' },
    { id: 'leg-raise', dose: '1 set x 8 reps per side, small range; rest 15 s between sides, then 30 s.' },
    { id: 'hip-circle', dose: '1 set x 5 circles each direction per side, hold support; rest 30 s.' }],
  [{ id: 'ankle-rock', dose: '1 set x 8 gentle reps per side; rest 20 s.' },
    { id: 'ankle-circle', dose: '1 set x 8 circles each direction per ankle; rest 20 s.' },
    { id: 'short-foot', dose: '1 set x 5 gentle holds per foot, 5 s each; rest 20 s.' }],
  [{ id: 'cat', dose: '1 set x 6 gentle reps; rest 20 s.' },
    { id: 'open-book', dose: '1 set x 6 comfortable reps per side; rest 20 s.' },
    { id: 'seated-hip', dose: '1 set x 6 gentle reps per side, hands for support; rest 20 s.' }],
];

const HEAVY_ADDITIONS = [
  ['lateral-step', 'step-down', 'lateral-lunge', 'kneeling-step-drive',
    'lunge-drive', 'travelling-lunge', 'rear-elevated-split', 'front-elevated-split', 'lateral-step-down',
    'crossover-step', 'single-chair-rise', 'wall-sit', 'single-wall-sit', 'split-hold', 'offset-squat'],
  ['single-rdl', 'single-bridge', 'bridge-march', 'hamstring-walkout', 'band-extension', 'band-abduction', 'band-lateral', 'monster', 'hip-hike',
    'heel-dig-bridge', 'single-heel-bridge', 'slider-curl', 'eccentric-slider', 'single-slider', 'bridge-squeeze', 'hip-adduction', 'hinge-drive'],
  ['calf-hold', 'soleus-hold', 'eccentric-calf', 'band-calf-press', 'wall-soleus'],
  ['overhead-press', 'lateral-raise', 'reverse-fly', 'biceps', 'triceps', 'band-pull', 'band-rotation'],
  ['band-march', 'suitcase', 'farmer', 'side-plank-lift', 'standing-flexion', 'seated-lift-over', 'supine-band-march',
    'plank-clam', 'plank-leg-lift', 'shoulder-tap', 'bear-hover', 'bear-crawl', 'loaded-deadbug',
    'quadruped-row', 'suitcase-march', 'rack-march', 'hip-airplane', 'wall-march-hold'],
];

function libraryCandidate(id: string): Candidate {
  const move = MOVE_GUIDES.find(item => item.id === id);
  const match = move?.prescription?.match(/^(\d+)(?:-\d+)? (?:sets?|carries) of (.+)\.$/);
  if (!move || !match) throw new Error(`Missing generator prescription for ${id}`);
  const sets = Number(match[1]);
  let dose = `${sets} ${sets === 1 ? 'set' : 'sets'} x ${match[2]}.`;
  if (!/between (?:sides|sets)/.test(dose)) {
    dose = dose.replace(/; rest \d+(?:-\d+)? s\.$/, `; rest ${/per side/.test(dose) ? '30 s between sides and ' : ''}75 s between sets.`);
  }
  return { id, dose };
}

export function strengthPoolGroups(intensity: StrengthIntensity): StrengthPoolGroup[] {
  if (intensity === 'light') return [
    { label: 'Gentle core', candidates: [...LIGHT_SLOTS[0],
      { id: 'deadbug', dose: '1 set x 4 gentle bent-knee reps per side; rest 30 s.' },
      { id: 'bird', dose: '1 set x 4 small reaches per side; rest 30 s.' },
      { id: 'tap', dose: '1 set x 4 gentle heel taps per side; rest 30 s.' }] },
    { label: 'Hips and balance', candidates: [...LIGHT_SLOTS[1],
      { id: 'balance', dose: '1 set x 10 s per side with hand support; rest 15 s between sides, then 30 s.' }] },
    { label: 'Feet and ankles', candidates: [...LIGHT_SLOTS[2],
      { id: 'toe-yoga', dose: '1 set x 6 gentle alternations per foot, seated; rest 20 s.' },
      { id: 'tibialis', dose: '1 set x 6 gentle reps close to the wall; rest 20 s.' }] },
    { label: 'Mobility and stretch', candidates: [...LIGHT_SLOTS[3],
      { id: 'hip-stretch', dose: '1 set x 15 s gentle stretch per side; rest 15 s between sides, then 20 s.' },
      { id: 'calf-stretch', dose: '1 set x 15 s gentle stretch per side; rest 15 s between sides, then 20 s.' }] },
  ];
  const extra: Candidate[][] = [
    [{ id: 'squat', dose: '2 sets x 8 reps; rest 75 s between sets.' }],
    [{ id: 'staggered', dose: '2 sets x 8 reps per side; rest 30 s between sides and 75 s between sets.' }],
    [], [], [],
  ];
  return ['Legs and single-leg control', 'Posterior chain and hips', 'Calves and soleus', 'Upper body', 'Core and runner control']
    .map((label, index) => ({ label, candidates: [
      ...HEAVY_SLOTS[index], ...extra[index], ...HEAVY_ADDITIONS[index].map(libraryCandidate),
    ] }));
}

export function strengthPoolCoverage(intensity: StrengthIntensity, selectedIds: readonly string[]): string[] {
  const groups = strengthPoolGroups(intensity);
  const allowed = new Set(groups.flatMap(group => group.candidates.map(item => item.id)));
  if (selectedIds.some(id => !allowed.has(id))) throw new Error('The pool includes an exercise that is not suitable for this intensity.');
  return groups.filter(group => !group.candidates.some(item => selectedIds.includes(item.id))).map(group => group.label);
}

export function generateStrengthWorkout(intensity: StrengthIntensity, random: () => number = Math.random, selectedIds?: readonly string[]): GeneratedStrength {
  const groups = strengthPoolGroups(intensity);
  const pool = selectedIds ?? groups.flatMap(group => group.candidates.map(item => item.id));
  const missing = strengthPoolCoverage(intensity, pool);
  if (missing.length) throw new Error(`Choose at least one exercise for: ${missing.join(', ')}.`);
  const slots = groups.map(group => group.candidates.filter(item => pool.includes(item.id)));
  const isDemanding = (item: Candidate) => moveDifficulty(MOVE_GUIDES.find(move => move.id === item.id)!) === 'Hard';
  if (slots.filter(slot => slot.every(isDemanding)).length > 1) {
    throw new Error('Choose Medium/Easy alternatives in more groups. A generated workout includes at most one Hard exercise.');
  }
  let hardChosen = false;
  const chosen = slots.map((slot, index) => {
    const hardNeededLater = slots.slice(index + 1).some(later => later.every(isDemanding));
    const available = hardChosen || hardNeededLater ? slot.filter(item => !isDemanding(item)) : slot;
    const sample = random();
    if (!Number.isFinite(sample) || sample < 0 || sample >= 1) throw new Error('Random sample must be between 0 (inclusive) and 1 (exclusive).');
    const selected = available[Math.floor(sample * available.length)];
    if (isDemanding(selected)) hardChosen = true;
    return selected;
  });
  const heavy = intensity === 'heavy';
  const title = heavy ? 'Generated heavy: legs, posterior chain, calves, upper body and core' : 'Generated light: core, hips, ankles and mobility';
  const notes = [
    `Warm-up: ${heavy ? '5' : '3'} min easy walking.`,
    ...chosen.map(item => {
      const move = MOVE_GUIDES.find(move => move.id === item.id);
      if (!move) throw new Error(`Unknown generated movement: ${item.id}`);
      return `${move.name}: ${item.dose}`;
    }),
    heavy
      ? 'Rest 60-90 s when changing exercises.\n\nCool-down: 2 min easy walking.\n\nAbout 25-45 min total, depending on selected doses. Use the equipment and technique cues for each selected move. Heavy means the main resistance session, not maximal lifting. Leave 2-3 reps in reserve. Start with one set if unfamiliar; replace a comparable exercise rather than adding volume. Avoid new demanding eccentric work near key runs or races; keep recovery and taper days light.'
      : 'Cool-down: 3-5 min gentle calf and hip-flexor stretches, 20 s per side.\n\nAbout 12-15 min total. Bodyweight only, no heavy leg work or effort to fatigue. Finish fresher than you started.',
  ].join('\n\n');
  return { title, notes, movementIds: chosen.map(item => item.id) };
}

export function completedStrengthWorkout(generated: GeneratedStrength, date: string, today: string, id: string): Workout {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !isValid(parseISO(date)) || dateKey(parseISO(date)) !== date
    || date < '2020-01-01' || date > '2100-12-31' || date > today) {
    throw new Error('Choose a valid completion date from 2020 up to today.');
  }
  if (!id || !generated.movementIds.length || !generated.notes.trim()) throw new Error('Generate a workout before saving.');
  return {
    id, date, type: 'crossTraining', activity: 'strength', distanceMiles: 0,
    paceMinPerMile: { min: 9, max: 9.75 }, completed: true,
    notes: `${generated.title}\n\n${generated.notes}`,
  };
}

export function addCompletedStrength(plan: Plan, workout: Workout): Plan {
  if (plan.workouts.some(item => item.id === workout.id)) throw new Error('This generated workout has already been saved. Generate another workout to log a different session.');
  const placeholder = plan.workouts.find(item => item.type === 'crossTraining' && item.activity === 'strength'
    && !item.completed && !item.notes.trim() && item.date === workout.date);
  if (placeholder) return { ...plan, workouts: plan.workouts.map(item => item.id === placeholder.id ? workout : item) };
  if (plan.workouts.length >= 10000) throw new Error('The plan has reached the 10,000-workout limit. Export a backup and remove old entries before saving more.');
  return { ...plan, workouts: [...plan.workouts, workout] };
}
