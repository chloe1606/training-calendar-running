import { isValid, parseISO } from 'date-fns';
import { dateKey, type Plan, type Workout } from './model';
import { bodyAreas, MOVE_GUIDES, moveCategory, type MoveCategory } from './strength-guide';

export type WorkoutCategory = 'mobility' | 'pilates' | 'strength';
export const DEFAULT_EXERCISE_COUNTS: Record<WorkoutCategory, number> = { mobility: 4, pilates: 4, strength: 4 };
export interface GeneratedWorkout {
  category: WorkoutCategory;
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

const existingDoses = new Map([
  ...LIGHT_SLOTS.flat(),
  ...HEAVY_SLOTS.flat(),
  { id: 'squat', dose: '2 sets x 8 reps; rest 75 s between sets.' },
  { id: 'staggered', dose: '2 sets x 8 reps per side; rest 30 s between sides and 75 s between sets.' },
  ...HEAVY_ADDITIONS.flatMap(group => group.map(libraryCandidate)),
].map(item => [item.id, item.dose] as const));

const CATEGORY_MOVES: Record<WorkoutCategory, MoveCategory[]> = {
  mobility: ['Mobility', 'Balance & control'],
  pilates: ['Pilates'],
  strength: ['Strength'],
};

function defaultDose(category: WorkoutCategory): string {
  if (category === 'mobility') return '1 set x 6 gentle reps per side; rest 20 s.';
  if (category === 'pilates') return '1 set x 8 controlled reps per side; rest 30 s.';
  return '2 sets x 8 controlled reps; rest 60 s between sets.';
}

export function strengthPoolGroups(category: WorkoutCategory): StrengthPoolGroup[] {
  const grouped = new Map<string, Candidate[]>();
  for (const move of MOVE_GUIDES) {
    const moveType = moveCategory(move);
    if (!CATEGORY_MOVES[category].includes(moveType)) continue;
    const label = category === 'mobility' ? moveType : category === 'pilates' ? 'Pilates' : bodyAreas(move)[0];
    const candidates = grouped.get(label) ?? [];
    candidates.push({ id: move.id, dose: existingDoses.get(move.id) ?? (move.prescription ? libraryCandidate(move.id).dose : defaultDose(category)) });
    grouped.set(label, candidates);
  }
  return [...grouped].map(([label, candidates]) => ({ label, candidates }));
}

export function generateStrengthWorkout(category: WorkoutCategory, random: () => number = Math.random, selectedIds?: readonly string[], exerciseCount = DEFAULT_EXERCISE_COUNTS[category]): GeneratedWorkout {
  if (!Number.isInteger(exerciseCount) || exerciseCount < 3 || exerciseCount > 6) throw new Error('Choose 3–6 main exercises.');
  const candidates = strengthPoolGroups(category).flatMap(group => group.candidates);
  const pool = selectedIds ?? candidates.map(item => item.id);
  if (pool.some(id => !candidates.some(item => item.id === id))) throw new Error(`The pool includes an exercise that is not suitable for ${category}.`);
  const available = candidates.filter(item => pool.includes(item.id));
  if (!available.length) throw new Error('Choose at least one exercise in the pool.');
  const count = Math.min(exerciseCount, available.length);
  const chosen: Candidate[] = [];
  const representedAreas = new Set<string>();
  const representedCategories = new Set<MoveCategory>();
  while (chosen.length < count) {
    const sample = random();
    if (!Number.isFinite(sample) || sample < 0 || sample >= 1) throw new Error('Random sample must be between 0 (inclusive) and 1 (exclusive).');
    const scored = available.map(item => {
      const move = MOVE_GUIDES.find(candidate => candidate.id === item.id);
      if (!move) throw new Error(`Unknown generated movement: ${item.id}`);
      const areas = bodyAreas(move);
      const category = moveCategory(move);
      const newAreas = areas.filter(area => !representedAreas.has(area)).length;
      const newCategory = representedCategories.has(category) ? 0 : 1;
      return { item, areas, category, score: newAreas * 2 + newCategory };
    });
    const bestScore = Math.max(...scored.map(candidate => candidate.score));
    const best = scored.filter(candidate => candidate.score === bestScore);
    const selected = best[Math.floor(sample * best.length)];
    chosen.push(selected.item);
    selected.areas.forEach(area => representedAreas.add(area));
    representedCategories.add(selected.category);
    available.splice(available.indexOf(selected.item), 1);
  }
  const title = `Generated ${category}: custom ${category} workout`;
  const notes = [
    category === 'strength'
      ? 'Warm-up: 5 min easy walking. Alternatives: replace part of the walking with 6-8 comfortable bodyweight squats or sit-to-stands, 6-8 small mini-band lateral walk steps each way, or 6 small mini-band diagonal walk steps forward and back. Use a light band above the knees. Choose one option within the same 5 min, not all of them; keep the effort easy and avoid fatigue.'
      : 'Warm-up: 2 min of easy, comfortable movement.',
    ...chosen.map(item => {
      const move = MOVE_GUIDES.find(move => move.id === item.id);
      if (!move) throw new Error(`Unknown generated movement: ${item.id}`);
      return `${move.name}: ${item.dose}`;
    }),
    category === 'strength'
      ? `Rest 60-90 s when changing exercises.\n\nCool-down: 2 min easy walking.\n\n${count === DEFAULT_EXERCISE_COUNTS.strength ? 'About 25-45 min total, depending on selected doses.' : `Duration varies with these ${count} main exercises, prescribed sets and rest; use the stopwatch to log actual time.`} Use the equipment and technique cues for each selected move. Leave 2-3 reps in reserve. Start with one set if unfamiliar; avoid new demanding eccentric work near key runs or races.`
      : `Cool-down: 2 min of relaxed breathing and comfortable movement.\n\n${count === DEFAULT_EXERCISE_COUNTS[category] ? 'About 12-20 min total, depending on selected doses.' : `Duration varies with these ${count} exercises and prescribed doses; use the stopwatch to log actual time.`} Move gently and finish feeling comfortable.`,
  ].join('\n\n');
  return { category, title, notes, movementIds: chosen.map(item => item.id) };
}

export function swapGeneratedExercise(workout: GeneratedWorkout, movementId: string, selectedIds: readonly string[], random: () => number = Math.random): GeneratedWorkout {
  const index = workout.movementIds.indexOf(movementId);
  if (index < 0) throw new Error('This exercise is not part of the generated workout.');
  const candidates = strengthPoolGroups(workout.category).flatMap(group => group.candidates)
    .filter(item => selectedIds.includes(item.id) && !workout.movementIds.includes(item.id));
  if (!candidates.length) throw new Error('No alternative exercises are available. Select more exercises in this workout type’s pool.');
  const sample = random();
  if (!Number.isFinite(sample) || sample < 0 || sample >= 1) throw new Error('Random sample must be between 0 (inclusive) and 1 (exclusive).');
  const replacement = candidates[Math.floor(sample * candidates.length)];
  const original = MOVE_GUIDES.find(move => move.id === movementId)!;
  const move = MOVE_GUIDES.find(move => move.id === replacement.id)!;
  const movementIds = [...workout.movementIds];
  movementIds[index] = replacement.id;
  const notes = workout.notes.split('\n').map(line => line.startsWith(`${original.name}:`) ? `${move.name}: ${replacement.dose}` : line).join('\n');
  return { ...workout, notes, movementIds };
}

export function completedStrengthWorkout(generated: GeneratedWorkout, date: string, today: string, id: string): Workout {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !isValid(parseISO(date)) || dateKey(parseISO(date)) !== date
    || date < '2020-01-01' || date > '2100-12-31' || date > today) {
    throw new Error('Choose a valid completion date from 2020 up to today.');
  }
  if (!id || !generated.movementIds.length || !generated.notes.trim()) throw new Error('Generate a workout before saving.');
  return {
    id, date, type: 'crossTraining', activity: generated.category, distanceMiles: 0,
    paceMinPerMile: { min: 9, max: 9.75 }, completed: true,
    notes: `${generated.title}\n\n${generated.notes}`,
  };
}

export function addCompletedStrength(plan: Plan, workout: Workout): Plan {
  if (plan.workouts.some(item => item.id === workout.id)) throw new Error('This generated workout has already been saved. Generate another workout to log a different session.');
  if (plan.workouts.some(item => item.date === workout.date && item.activity === workout.activity && item.notes === workout.notes)) return plan;
  if (plan.workouts.length >= 10000) throw new Error('The plan has reached the 10,000-workout limit. Export a backup and remove old entries before saving more.');
  return { ...plan, workouts: [...plan.workouts, workout] };
}
