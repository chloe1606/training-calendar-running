import { MOVE_GUIDES } from './strength-guide';

export type StrengthIntensity = 'light' | 'heavy';
export interface GeneratedStrength {
  title: string;
  notes: string;
  movementIds: string[];
}
interface Candidate { id: string; dose: string }
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

export function generateStrengthWorkout(intensity: StrengthIntensity, random: () => number = Math.random): GeneratedStrength {
  const slots = intensity === 'heavy' ? HEAVY_SLOTS : LIGHT_SLOTS;
  const chosen = slots.map(slot => {
    const sample = random();
    if (!Number.isFinite(sample) || sample < 0 || sample >= 1) throw new Error('Random sample must be between 0 (inclusive) and 1 (exclusive).');
    return slot[Math.floor(sample * slot.length)];
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
      ? 'Rest 60-90 s when changing exercises.\n\nCool-down: 2 min easy walking.\n\nAbout 35-45 min total. Use bodyweight first or comfortable 1-5 kg dumbbells; heavy means the main resistance session, not maximal lifting. Leave 2-3 reps in reserve. Start with one set if unfamiliar; skip or reduce if tired.'
      : 'Cool-down: 3-5 min gentle calf and hip-flexor stretches, 20 s per side.\n\nAbout 12-15 min total. Bodyweight only, no heavy leg work or effort to fatigue. Finish fresher than you started.',
  ].join('\n\n');
  return { title, notes, movementIds: chosen.map(item => item.id) };
}
