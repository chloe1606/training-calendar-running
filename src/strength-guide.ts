export interface ExercisePose {
  head: [number, number];
  body: string;
  arms: string;
  legs: string;
  equipment?: string;
}
export interface MoveGuide {
  id: string;
  name: string;
  match: RegExp;
  cue: string;
  equipment?: string;
  prescription?: string;
  labels: [string, string];
  poses: [ExercisePose, ExercisePose];
}
export type EquipmentKind = 'bodyweight' | 'band' | 'dumbbell' | 'kettlebell' | 'step' | 'support' | 'chair' | 'wall';
export interface EquipmentTag { kind: EquipmentKind; label: string }
export type MoveDifficulty = 'Easy' | 'Medium' | 'Hard';
const MOVE_DIFFICULTIES: Record<string, MoveDifficulty> = {
  walk: 'Easy', squat: 'Easy', hinge: 'Easy', calf: 'Medium', split: 'Medium', step: 'Medium',
  bridge: 'Easy', rdl: 'Medium', kickstand: 'Medium', staggered: 'Medium', goblet: 'Medium',
  deadbug: 'Medium', bird: 'Medium', clam: 'Easy', 'ankle-rock': 'Easy', cat: 'Easy',
  'hip-stretch': 'Easy', 'calf-stretch': 'Easy', plank: 'Medium', slide: 'Easy',
  'leg-raise': 'Easy', 'open-book': 'Easy', 'seated-hip': 'Easy', 'ankle-circle': 'Easy',
  tap: 'Medium', reach: 'Easy', 'hip-circle': 'Easy', balance: 'Easy', tilt: 'Easy',
  'bent-calf': 'Medium', 'seated-calf': 'Easy', tibialis: 'Easy', 'short-foot': 'Easy',
  'toe-yoga': 'Medium', 'band-lateral': 'Medium', monster: 'Medium', 'band-extension': 'Easy',
  'band-abduction': 'Easy', 'band-march': 'Medium', 'lateral-step': 'Medium', 'step-down': 'Hard',
  'hip-hike': 'Medium', 'reverse-lunge': 'Medium', 'lateral-lunge': 'Medium', 'single-rdl': 'Hard',
  'single-bridge': 'Hard', 'bridge-march': 'Medium', 'hamstring-walkout': 'Hard',
  suitcase: 'Medium', farmer: 'Medium', 'db-row': 'Medium', 'floor-press': 'Medium',
  'overhead-press': 'Medium', 'lateral-raise': 'Easy', 'reverse-fly': 'Medium', biceps: 'Easy',
  triceps: 'Medium', 'band-pull': 'Easy', 'band-rotation': 'Easy', 'wall-push': 'Easy',
};
export function moveDifficulty(move: MoveGuide): MoveDifficulty {
  const difficulty = MOVE_DIFFICULTIES[move.id];
  if (!difficulty) throw new Error(`Missing difficulty rating for ${move.name}`);
  return difficulty;
}
export type BodyArea = 'Core' | 'Legs' | 'Glutes' | 'Hips' | 'Calves' | 'Feet & ankles' | 'Hamstrings' | 'Back' | 'Shoulders' | 'Chest' | 'Arms';
const BODY_AREAS: Record<string, BodyArea[]> = {
  walk: ['Legs', 'Hips'],
  squat: ['Legs', 'Glutes'],
  hinge: ['Hamstrings', 'Glutes'],
  calf: ['Calves', 'Feet & ankles'],
  split: ['Legs', 'Glutes'],
  step: ['Legs', 'Glutes'],
  bridge: ['Glutes', 'Hamstrings'],
  rdl: ['Hamstrings', 'Glutes', 'Back'],
  kickstand: ['Hamstrings', 'Glutes'],
  staggered: ['Glutes', 'Hamstrings'],
  goblet: ['Legs', 'Glutes', 'Core'],
  deadbug: ['Core'],
  bird: ['Core', 'Glutes', 'Back'],
  clam: ['Glutes', 'Hips'],
  'ankle-rock': ['Feet & ankles', 'Calves'],
  cat: ['Back', 'Core'],
  'hip-stretch': ['Hips'],
  'calf-stretch': ['Calves', 'Feet & ankles'],
  plank: ['Core', 'Shoulders', 'Hips'],
  slide: ['Core', 'Hips'],
  'leg-raise': ['Glutes', 'Hips'],
  'open-book': ['Back', 'Shoulders'],
  'seated-hip': ['Hips'],
  'ankle-circle': ['Feet & ankles'],
  tap: ['Core', 'Hips'],
  reach: ['Core', 'Shoulders'],
  'hip-circle': ['Hips', 'Glutes'],
  balance: ['Feet & ankles', 'Hips', 'Core'],
  tilt: ['Core', 'Hips'],
  'bent-calf': ['Calves', 'Feet & ankles'],
  'seated-calf': ['Calves', 'Feet & ankles'],
  tibialis: ['Legs', 'Feet & ankles'],
  'short-foot': ['Feet & ankles'],
  'toe-yoga': ['Feet & ankles'],
  'band-lateral': ['Glutes', 'Hips'],
  monster: ['Glutes', 'Hips', 'Legs'],
  'band-extension': ['Glutes', 'Hips'],
  'band-abduction': ['Glutes', 'Hips'],
  'band-march': ['Hips', 'Core'],
  'lateral-step': ['Legs', 'Glutes', 'Hips'],
  'step-down': ['Legs', 'Glutes'],
  'hip-hike': ['Glutes', 'Hips'],
  'reverse-lunge': ['Legs', 'Glutes'],
  'lateral-lunge': ['Legs', 'Glutes', 'Hips'],
  'single-rdl': ['Hamstrings', 'Glutes', 'Core'],
  'single-bridge': ['Glutes', 'Hamstrings'],
  'bridge-march': ['Glutes', 'Core'],
  'hamstring-walkout': ['Hamstrings', 'Glutes'],
  suitcase: ['Core', 'Shoulders', 'Arms'],
  farmer: ['Core', 'Shoulders', 'Arms'],
  'db-row': ['Back', 'Arms', 'Shoulders'],
  'floor-press': ['Chest', 'Arms', 'Shoulders'],
  'overhead-press': ['Shoulders', 'Arms'],
  'lateral-raise': ['Shoulders'],
  'reverse-fly': ['Back', 'Shoulders'],
  biceps: ['Arms'],
  triceps: ['Arms'],
  'band-pull': ['Back', 'Shoulders'],
  'band-rotation': ['Shoulders'],
  'wall-push': ['Chest', 'Arms', 'Shoulders'],
};
export function bodyAreas(move: MoveGuide): BodyArea[] {
  const areas = BODY_AREAS[move.id];
  if (!areas?.length) throw new Error(`Missing body-area labels for ${move.name}`);
  return areas;
}
export interface MoveProgression {
  title: string;
  instructions: string;
  pose?: ExercisePose;
}
export const MOVE_PROGRESSIONS: Record<string, MoveProgression> = {
  plank: {
    title: 'Side plank from feet',
    instructions: 'Once knee-supported holds feel steady and pain-free, straighten the legs and stagger the feet for a wider base. Lift hips into line with shoulders and ankles, with elbow under shoulder. Start with one 5-10 s hold per side instead of the knee version, then build towards the prescribed hold. Return to knees if hips sag or you cannot breathe comfortably.',
    pose: { head: [42, 48], body: 'M53 59L103 80', arms: 'M57 61L64 110L40 115M57 61L76 42L84 19', legs: 'M103 80L137 97L176 116M103 80L134 101L159 116' },
  },
  bridge: { title: 'Staggered stance, then single-leg bridge', instructions: 'First offset the feet while keeping both planted. Once the pelvis stays level, try a single-leg bridge with no added weight. Replace the standard bridge with 1 set of 6 controlled reps per side; return to two feet if the hamstrings cramp or the back arches.' },
  calf: { title: 'Add a light dumbbell or a longer pause', instructions: 'Keep hand support and slow lowering. Add a 1 s pause at the top first, or hold a 1 kg dumbbell in the free hand. Change only one variable and keep the prescribed reps; use heavier weights only when all reps remain smooth.' },
  split: { title: 'Add light dumbbells', instructions: 'Keep the same comfortable depth and stable knee alignment. Start with one 1 kg dumbbell in the free hand while retaining support. Keep the existing sets and reps; do not remove support and increase weight at the same time.' },
  step: { title: 'Slower step-down, then light weights', instructions: 'Use the same low, stable step. Lower for 3 s without dropping or pushing off the trailing foot. Once controlled, optionally hold light dumbbells while keeping the prescribed reps. Do not increase step height and load together.' },
  kickstand: { title: 'Supported single-leg deadlift', instructions: 'Use bodyweight first and keep a hand on stable support. Lift the rear toes off the floor and hinge through a small range, hips square. Replace the kickstand version with 1 set of 6 reps per side; restore the kickstand if balance limits control.' },
  deadbug: { title: 'Longer opposite-arm-and-leg reach', instructions: 'Gradually straighten the moving leg farther from the body while reaching the opposite arm overhead. Keep the lower back and pelvis quiet. Use the same reps, shorten the reach if the back arches, and do not add weights.' },
  bird: { title: 'Longer controlled hold', instructions: 'Keep hips level while reaching opposite arm and leg. Extend each hold from 2-3 s to 5 s while keeping the prescribed reps. Do not raise the limbs higher or add a band at the same time.' },
  clam: { title: 'Light mini-band clamshell', instructions: 'Place a light loop band above the knees. Keep feet together and pelvis stacked; open only as far as you can without rolling back. Start with 1 set of 8 reps per side instead of the unbanded version.' },
  'wall-push': { title: 'Feet farther from the wall', instructions: 'Move the feet a small step farther back while keeping hands on a solid wall and body straight. Start with 1 set of 6-8 reps. Return closer if shoulders shrug or the back sags; do not use an unsecured chair or lightweight step as a push-up surface.' },
  'band-lateral': { title: 'Slightly stronger loop band', instructions: 'Keep the loop above the knees and use the same small steps. Increase resistance by one small level only when pelvis and knees remain controlled. Keep the same step count rather than adding distance too; inspect the band before use.' },
  'db-row': { title: 'Pause at the top, then increase load', instructions: 'Add a 1 s pause with elbows near the hips, without shrugging. Alternatively increase dumbbells by the smallest available increment within 1-5 kg. Keep the existing reps and a neutral back; do not change tempo and weight together.' },
};

const LEGACY_EQUIPMENT: Record<string, EquipmentTag[]> = {
  calf: [{ kind: 'bodyweight', label: 'Bodyweight' }, { kind: 'support', label: 'Support' }],
  split: [{ kind: 'support', label: 'Support' }, { kind: 'dumbbell', label: 'Dumbbells optional' }],
  step: [{ kind: 'step', label: 'Step' }, { kind: 'support', label: 'Support as needed' }, { kind: 'dumbbell', label: 'Dumbbells optional' }],
  bridge: [{ kind: 'bodyweight', label: 'Bodyweight' }, { kind: 'dumbbell', label: 'Dumbbell optional' }],
  rdl: [{ kind: 'dumbbell', label: 'Dumbbells' }, { kind: 'kettlebell', label: 'Or kettlebell' }],
  kickstand: [{ kind: 'dumbbell', label: 'Dumbbells' }, { kind: 'support', label: 'Support as needed' }],
  goblet: [{ kind: 'chair', label: 'Chair' }, { kind: 'dumbbell', label: 'Dumbbell' }, { kind: 'kettlebell', label: 'Or kettlebell' }],
  'ankle-rock': [{ kind: 'bodyweight', label: 'Bodyweight' }, { kind: 'support', label: 'Support as needed' }],
  'hip-circle': [{ kind: 'bodyweight', label: 'Bodyweight' }, { kind: 'support', label: 'Support' }],
  balance: [{ kind: 'bodyweight', label: 'Bodyweight' }, { kind: 'support', label: 'Support' }],
  'calf-stretch': [{ kind: 'wall', label: 'Wall / support' }],
};
export function equipmentTags(move: MoveGuide): EquipmentTag[] {
  if (LEGACY_EQUIPMENT[move.id]) return LEGACY_EQUIPMENT[move.id];
  const text = move.equipment ?? 'Bodyweight';
  const tags: EquipmentTag[] = [];
  if (/bodyweight/i.test(text)) tags.push({ kind: 'bodyweight', label: 'Bodyweight' });
  if (/band/i.test(text)) tags.push({ kind: 'band', label: 'Resistance band' });
  if (/dumbbell/i.test(text)) tags.push({ kind: 'dumbbell', label: /optional/i.test(text) ? 'Dumbbells optional' : 'Dumbbells' });
  if (/step/i.test(text)) tags.push({ kind: 'step', label: 'Step' });
  if (/support/i.test(text)) tags.push({ kind: 'support', label: 'Support' });
  if (/chair/i.test(text)) tags.push({ kind: 'chair', label: /preferred/i.test(text) ? 'Chair optional' : 'Chair' });
  if (/wall/i.test(text)) tags.push({ kind: 'wall', label: 'Wall' });
  return tags;
}

const stand: ExercisePose = { head: [80, 20], body: 'M80 31L80 70', arms: 'M80 40L65 58L65 72M80 40L95 58L95 72', legs: 'M80 70L70 93L65 116M80 70L90 93L95 116' };
const support = 'M120 45H150M135 45V118';
const calf: ExercisePose = { ...stand, arms: 'M80 40L104 50L135 45', legs: 'M80 70L76 93L83 105M80 70L96 82L95 96', equipment: support };
const squat: ExercisePose = { head: [85, 40], body: 'M85 51L65 78', arms: 'M80 57L102 65L113 50', legs: 'M65 78L103 84L96 116M65 78L68 95L65 116' };
const hinge: ExercisePose = { head: [122, 48], body: 'M111 53L70 67', arms: 'M103 57L108 83L110 103M99 58L95 83L94 103', legs: 'M70 67L77 92L70 116M70 67L88 91L90 116' };
const split: ExercisePose = { head: [85, 35], body: 'M85 46L83 76', arms: 'M85 53L105 53L135 45', legs: 'M83 76L109 90L109 116M83 76L59 94L63 112L47 116', equipment: support };
const step: ExercisePose = { ...stand, legs: 'M80 70L104 77L112 91M80 70L72 94L65 116', equipment: 'M100 118V94H145V118' };
const back: ExercisePose = { head: [36, 98], body: 'M48 101L102 104', arms: 'M53 103L78 114L105 115', legs: 'M102 104L125 76L147 116M102 104L118 86L135 116' };
const bridge: ExercisePose = { ...back, body: 'M48 101L100 77', arms: 'M53 103L78 114L105 115', legs: 'M100 77L128 77L147 116M100 77L116 86L135 116' };
const table: ExercisePose = { head: [139, 55], body: 'M128 62L77 62', arms: 'M124 62L123 87L123 116', legs: 'M77 62L70 99L99 116L111 116' };
const bird: ExercisePose = { ...table, arms: 'M124 62L123 87L123 116M124 62L150 56L179 56', legs: 'M77 62L70 99L99 116M77 62L48 62L18 60' };
const deadbug: ExercisePose = { ...back, arms: 'M53 101L61 75L68 50', legs: 'M102 104L104 72L139 72M102 104L93 78L125 78' };
const side: ExercisePose = { head: [38, 91], body: 'M50 95L101 98', arms: 'M53 96L69 109L45 112', legs: 'M101 98L128 108L153 108M101 98L128 98L153 108' };
const sit: ExercisePose = { head: [85, 40], body: 'M85 51L86 88', arms: 'M85 61L67 87L54 105', legs: 'M86 88L112 107L148 111M86 88L64 111L30 111' };
const plank: ExercisePose = { head: [42, 60], body: 'M53 68L100 82', arms: 'M57 69L64 110L40 115M57 69L76 49L84 26', legs: 'M100 82L134 108L163 111M100 82L125 104L149 115' };
const weights = 'M59 74H72M89 74H102';
const bandKnees = 'M65 90Q82 82 100 90Q82 98 65 90Z';
const tallStep: ExercisePose = { ...stand, legs: 'M80 70L80 85L80 95M80 70L103 90L109 115', equipment: 'M60 118V96H92V118' };
const row: ExercisePose = { ...hinge, arms: 'M103 57L83 75L103 80M99 58L78 75L94 80', equipment: 'M97 81H109M88 81H100' };

export const MOVE_GUIDES: MoveGuide[] = [
  { id: 'walk', name: 'Walking / marching', match: /walking|marching|walk[,.;]/i, cue: 'Stay relaxed and upright. Use comfortable steps and an easy arm swing.', labels: ['Step', 'Alternate sides'], poses: [stand, { ...stand, arms: 'M80 40L60 57L52 46M80 40L101 50L109 70', legs: 'M80 70L102 74L104 96M80 70L73 93L65 116' }] },
  { id: 'squat', name: 'Bodyweight squat / sit-to-stand', match: /bodyweight squats|sit-to-stands/i, cue: 'Sit back and down within a comfortable range; knees track with toes. Use a stable chair if needed.', labels: ['Tall', 'Sit back, then stand'], poses: [stand, squat] },
  { id: 'hinge', name: 'Unloaded hip hinge', match: /unloaded.*hing|hip hinges/i, cue: 'Soften knees and push hips back, keeping your back comfortably neutral. Stand by bringing hips forward.', labels: ['Tall', 'Hips back'], poses: [stand, hinge] },
  { id: 'calf', name: 'Supported single-leg calf raise', match: /single-leg calf raises/i, cue: 'Hold a stable support. Lift one foot, rise through the standing forefoot, then lower slowly without rolling the ankle.', labels: ['Single-leg support', 'Rise, then lower'], poses: [{ ...calf, legs: 'M80 70L76 94L76 116M80 70L96 82L95 96' }, { ...calf, head: [80, 12], body: 'M80 23L80 62', legs: 'M80 62L76 87L83 108L90 116M80 62L96 74L95 88' }] },
  { id: 'split', name: 'Supported split squat', match: /split squats/i, cue: 'Use a split stance and light hand support. Lower straight down with control; push through the front foot to stand.', labels: ['Split stance', 'Lower with support'], poses: [{ ...stand, legs: 'M80 70L104 91L109 116M80 70L59 91L47 116', equipment: support }, split] },
  { id: 'step', name: 'Low step-up', match: /step-ups/i, cue: 'Use a low, stable step. Drive through the whole front foot, stand tall and step down slowly; use support for balance.', labels: ['Foot on low step', 'Stand on step'], poses: [step, { ...stand, head: [113, 12], body: 'M113 23L113 60', arms: 'M113 32L95 49L95 65', legs: 'M113 60L113 78L113 93M113 60L93 73L89 91', equipment: step.equipment }] },
  { id: 'bridge', name: 'Glute bridge', match: /glute bridges/i, cue: 'Lie on your back with knees bent and feet planted. Lift hips by squeezing glutes; avoid arching your lower back.', labels: ['Hips down', 'Lift and pause'], poses: [back, bridge] },
  { id: 'rdl', name: 'Romanian deadlift', match: /(?<!kickstand )Romanian deadlifts/i, cue: 'Keep light weights close, soften knees and hinge from the hips. Stop before your back rounds; stand without leaning back.', labels: ['Weights close', 'Hinge, then stand'], poses: [{ ...stand, equipment: 'M60 73H72M90 73H102' }, { ...hinge, equipment: 'M88 104H100M104 104H116' }] },
  { id: 'kickstand', name: 'Kickstand Romanian deadlift', match: /kickstand Romanian deadlifts/i, cue: 'Most weight stays on the front leg; rear toes act as a kickstand. Hinge with hips level and use hand support if needed.', labels: ['Rear toes for balance', 'Hinge over front leg'], poses: [{ ...stand, legs: 'M80 70L77 94L73 116M80 70L103 94L119 116' }, { ...hinge, legs: 'M70 67L77 92L70 116M70 67L104 90L122 116' }] },
  { id: 'staggered', name: 'Staggered-stance bridge', match: /staggered-stance bridges/i, cue: 'Keep both feet down, one slightly farther away. Lift hips level; the nearer foot does more work. Swap sides.', labels: ['Offset feet', 'Lift hips level'], poses: [{ ...back, legs: 'M102 104L125 76L147 116M102 104L145 88L174 116' }, { ...bridge, legs: 'M100 77L128 77L147 116M100 77L145 88L174 116' }] },
  { id: 'goblet', name: 'Goblet squat to chair', match: /goblet squat/i, cue: 'Hold a light weight close to your chest. Touch a stable chair gently, without dropping onto it; stand with control.', labels: ['Weight at chest', 'Touch chair gently'], poses: [{ ...stand, arms: 'M80 40L64 57L80 49M80 40L96 57L80 49', equipment: 'M73 48H87M45 87H70V118' }, { ...squat, equipment: 'M103 48H117M42 84H68V118' }] },
  { id: 'deadbug', name: 'Dead bug', match: /dead bug:/i, cue: 'Start on your back with arms up, hips and knees bent. Slowly extend opposite arm and leg without arching; return and alternate.', labels: ['Arms up, knees bent', 'Opposite arm and leg'], poses: [deadbug, { ...deadbug, arms: 'M53 101L61 75L68 50M53 101L28 107L10 106', legs: 'M102 104L104 72L139 72M102 104L139 105L177 111' }] },
  { id: 'bird', name: 'Bird dog', match: /bird dog/i, cue: 'From hands and knees, reach opposite arm and leg long. Keep hips level, breathe and avoid twisting or lifting too high.', labels: ['Hands and knees', 'Opposite reach'], poses: [table, bird] },
  { id: 'clam', name: 'Side-lying clamshell', match: /clamshells/i, cue: 'Lie on your side with bent knees and feet together. Open the top knee without rolling your pelvis back; lower slowly.', labels: ['Knees together', 'Open top knee'], poses: [side, { ...side, legs: 'M101 98L128 108L153 108M101 98L124 74L153 108' }] },
  { id: 'ankle-rock', name: 'Ankle rock', match: /ankle rocks/i, cue: 'With the heel planted, gently move the knee towards and over the toes in a comfortable range. Use support; do not force it.', labels: ['Heel planted', 'Knee gently forward'], poses: [split, { ...split, legs: 'M83 76L120 91L109 116M83 76L59 94L47 116' }] },
  { id: 'cat', name: 'Cat-cow', match: /cat-cow/i, cue: 'On hands and knees, gently round and release your spine with your breathing. Use a small comfortable range; do not force your neck.', labels: ['Gently round', 'Gently release'], poses: [{ ...table, body: 'M128 62Q103 30 77 62' }, { ...table, body: 'M128 62Q103 84 77 62' }] },
  { id: 'hip-stretch', name: 'Hip-flexor stretch', match: /hip-flexor|hip.flexor stretches/i, cue: 'Half-kneel with support or padding. Gently tuck the pelvis and shift forward slightly; keep the trunk tall and avoid arching.', labels: ['Half-kneel', 'Small forward shift'], poses: [split, { ...split, head: [93, 35], body: 'M93 46L91 76', legs: 'M91 76L114 90L109 116M91 76L59 101L47 116' }] },
  { id: 'calf-stretch', name: 'Calf stretch', match: /calf.*stretches|calf\/hip-flexor/i, cue: 'Use a wall or support. Step one foot back, toes forward and heel down; gently lean forward until a comfortable calf stretch.', labels: ['Step back', 'Back heel down'], poses: [{ ...stand, equipment: support }, { ...stand, head: [102, 23], body: 'M99 34L79 73', arms: 'M96 43L113 48L135 45', legs: 'M79 73L102 94L107 116M79 73L57 95L37 116', equipment: support }] },
  { id: 'plank', name: 'Side plank from knees', match: /side plank/i, cue: 'Lie on your side, elbow under shoulder and knees bent. Lift hips into line with shoulders and knees; breathe and lower if form slips.', labels: ['Set elbow under shoulder', 'Lift hips; knees down'], poses: [side, plank] },
  { id: 'slide', name: 'Heel slide', match: /heel slides/i, cue: 'Lie on your back with knees bent. Slowly slide one heel away without moving your pelvis or arching; bring it back and alternate.', labels: ['Knees bent', 'Slide one heel away'], poses: [back, { ...back, legs: 'M102 104L125 76L147 116M102 104L138 111L178 116' }] },
  { id: 'leg-raise', name: 'Side-lying leg raise', match: /side-lying leg raises/i, cue: 'Lie on your side with hips stacked. Keep the top leg long and lift a little without rolling back or hiking the hip.', labels: ['Hips stacked', 'Small top-leg lift'], poses: [{ ...side, legs: 'M101 98L132 108L171 113M101 98L132 105L171 110' }, { ...side, legs: 'M101 98L132 108L171 113M101 98L132 80L166 65' }] },
  { id: 'open-book', name: 'Open-book upper-back rotation', match: /open-book|upper-back rotations/i, cue: 'Lie on your side with knees comfortably bent and arms forward. Open the top arm and rotate gently through the upper back; do not force the shoulder to the floor.', labels: ['Arms together', 'Open top arm gently'], poses: [{ ...side, arms: 'M53 96L78 77L103 69' }, { ...side, arms: 'M53 96L78 77L103 69M53 96L39 66L20 50' }] },
  { id: 'seated-hip', name: 'Seated hip rotation', match: /seated hip rotations|gentle hip rotations/i, cue: 'Sit with knees bent and hands supporting you. Let knees move gently from side to side within a comfortable range; never force them down.', labels: ['Supported sitting', 'Rotate knees gently'], poses: [sit, { ...sit, legs: 'M86 88L118 95L148 111M86 88L82 112L44 114' }] },
  { id: 'ankle-circle', name: 'Ankle circle', match: /ankle circles/i, cue: 'Sit or hold a support and lift one foot. Draw slow circles from the ankle in both directions, without twisting the whole leg.', labels: ['Lift one foot', 'Circle both directions'], poses: [{ ...stand, legs: 'M80 70L70 93L65 116M80 70L101 84L111 98' }, { ...stand, legs: 'M80 70L70 93L65 116M80 70L101 84L119 90', equipment: 'M128 79a17 17 0 1 1-3 27M125 106l3-9m-3 9l-9-3' }] },
  { id: 'tap', name: 'Dead-bug heel tap', match: /dead-bug heel taps/i, cue: 'Lie on your back, knees over hips. Lower one heel to tap the floor while keeping your trunk still; return and alternate. Reduce range if your back arches.', labels: ['Knees over hips', 'Tap one heel'], poses: [deadbug, { ...deadbug, legs: 'M102 104L104 72L139 72M102 104L121 91L135 116' }] },
  { id: 'reach', name: 'Quadruped arm reach', match: /quadruped arm reaches/i, cue: 'From hands and knees, reach one arm forward while keeping your back and pelvis still. Return and swap arms.', labels: ['Hands and knees', 'Reach one arm'], poses: [table, { ...table, arms: bird.arms }] },
  { id: 'hip-circle', name: 'Standing supported hip circle', match: /standing hip circles/i, cue: 'Hold a stable support. Lift one knee and make a small, slow circle at the hip without twisting your trunk. Reverse direction.', labels: ['Hold support', 'Small knee circle'], poses: [{ ...stand, equipment: support }, { ...stand, arms: 'M80 40L104 50L135 45', legs: 'M80 70L70 93L65 116M80 70L108 72L113 95', equipment: support }] },
  { id: 'balance', name: 'Standing supported balance', match: /standing supported balance/i, cue: 'Stand tall near a stable support. Lift one foot slightly; keep pelvis level and use your hand whenever needed.', labels: ['Two feet, support ready', 'Balance on one leg'], poses: [{ ...stand, equipment: support }, { ...calf, legs: 'M80 70L76 94L76 116M80 70L96 82L95 96' }] },
  { id: 'tilt', name: 'Supine pelvic tilt', match: /supine pelvic tilts/i, cue: 'Lie on your back with knees bent. Exhale and gently rock the pelvis to soften the lower-back arch; release. This is a small movement, not a bridge.', labels: ['Relaxed neutral back', 'Small gentle tilt'], poses: [{ ...back, body: 'M48 101Q76 92 102 104' }, { ...back, body: 'M48 101L102 104' }] },
  { id: 'bent-calf', name: 'Bent-knee calf raise', match: /bent-knee calf raise/i, equipment: 'Bodyweight, stable support', prescription: '1-2 sets of 10-12 slow reps per side; rest 45-60 s.', cue: 'Hold support and keep a small knee bend throughout. Rise through the forefoot without bouncing; lower slowly. Start with both feet if needed.', labels: ['Knee softly bent', 'Lift heel, knee stays bent'], poses: [{ ...calf, legs: 'M80 70L88 91L76 116M80 70L96 82L95 96' }, { ...calf, legs: 'M80 70L88 88L83 107L90 116M80 70L96 82L95 96' }] },
  { id: 'seated-calf', name: 'Seated weighted calf raise', match: /seated weighted calf raise/i, equipment: 'Stable chair, 1-5 kg dumbbell', prescription: '1-2 sets of 12-15 reps per side; rest 45-60 s.', cue: 'Sit with knee over ankle. Secure a light dumbbell on the thigh above the knee with your hand, not on the kneecap. Lift and lower the heel smoothly.', labels: ['Foot flat', 'Heel raised'], poses: [{ ...sit, legs: 'M86 88L125 88L125 116', equipment: 'M55 90H88V118M115 82H135' }, { ...sit, legs: 'M86 88L125 88L131 109L140 116', equipment: 'M55 90H88V118M115 82H135' }] },
  { id: 'tibialis', name: 'Wall-supported toe raise', match: /wall-supported toe raise/i, equipment: 'Wall', prescription: '1-2 sets of 12-15 reps; rest 45 s.', cue: 'Lean your back against a wall with feet slightly forward and heels down. Lift toes towards shins, then lower slowly; use a small range initially.', labels: ['Heels planted', 'Toes towards shins'], poses: [{ ...stand, equipment: 'M60 5V118', legs: 'M80 70L93 94L105 116L120 116' }, { ...stand, equipment: 'M60 5V118', legs: 'M80 70L93 94L105 116L116 104' }] },
  { id: 'short-foot', name: 'Short-foot arch activation', match: /short-foot arch activation/i, equipment: 'Bodyweight, chair if preferred', prescription: '1-2 sets of 5 holds per foot, 5 s each; rest 20 s.', cue: 'Keep heel, big-toe base and little-toe base on the floor. Gently draw the ball of the foot towards the heel to lift the arch without curling toes.', labels: ['Foot relaxed', 'Gently lift arch'], poses: [{ head: [30, 20], body: 'M30 31V70', arms: '', legs: 'M30 70L50 106Q90 116 145 112L170 116H50' }, { head: [30, 20], body: 'M30 31V70', arms: '', legs: 'M30 70L50 106Q95 90 140 112L170 116H50' }] },
  { id: 'toe-yoga', name: 'Toe yoga', match: /toe yoga/i, equipment: 'Bodyweight', prescription: '1 set of 6-8 slow alternations per foot; rest as needed.', cue: 'Seated or supported, keep the heel down. Gently lift the big toe with small toes down, then reverse. Use fingers to help; do not grip or force.', labels: ['Lift big toe', 'Lift small toes'], poses: [{ ...sit, equipment: 'M145 113L162 100M146 117H177' }, { ...sit, equipment: 'M145 113H177M148 117L169 102' }] },
  { id: 'band-lateral', name: 'Mini-band lateral walk', match: /mini-band lateral walk/i, equipment: 'Loop resistance band above knees', prescription: '1-2 sets of 6-10 small steps each way; rest 45 s.', cue: 'Use a light loop above the knees and a shallow squat. Step sideways without knees collapsing inward; keep feet facing forward and do not drag the trailing foot.', labels: ['Shallow squat', 'Small sideways step'], poses: [{ ...squat, equipment: bandKnees }, { ...squat, legs: 'M65 78L115 84L135 116M65 78L55 95L45 116', equipment: 'M53 92Q85 79 120 87Q85 104 53 92Z' }] },
  { id: 'monster', name: 'Mini-band diagonal walk', match: /mini-band diagonal walk/i, equipment: 'Loop resistance band above knees', prescription: '1-2 sets of 6 small steps forward and back; rest 45 s.', cue: 'With light band tension and softly bent knees, take small diagonal steps. Keep trunk quiet and tension gentle; step back carefully in a clear space.', labels: ['Soft knees', 'Small diagonal step'], poses: [{ ...stand, equipment: bandKnees }, { ...stand, legs: 'M80 70L60 90L45 116M80 70L111 87L130 105', equipment: 'M57 90Q85 80 114 87Q85 102 57 90Z' }] },
  { id: 'band-extension', name: 'Standing band hip extension', match: /standing band hip extension/i, equipment: 'Light loop band above ankles, stable support', prescription: '1-2 sets of 8-10 reps per side; rest 30-45 s.', cue: 'Hold support and move one straight leg a little backwards against the loop. Keep ribs over pelvis and avoid arching your back; use a very light band.', labels: ['Stand supported', 'Small backward reach'], poses: [{ ...calf, legs: stand.legs, equipment: `${support}M65 107H96` }, { ...calf, legs: 'M80 70L76 94L76 116M80 70L55 91L32 108', equipment: `${support}M32 105L76 110` }] },
  { id: 'band-abduction', name: 'Standing band hip abduction', match: /standing band hip abduction/i, equipment: 'Light loop band above ankles, stable support', prescription: '1-2 sets of 8-10 reps per side; rest 30-45 s.', cue: 'Hold a stable support. Move one leg a short distance sideways with toes forward and pelvis level; avoid leaning to gain range.', labels: ['Feet under hips', 'Small sideways lift'], poses: [{ ...calf, legs: stand.legs, equipment: `${support}M65 107H96` }, { ...calf, legs: 'M80 70L76 94L76 116M80 70L108 85L125 104', equipment: `${support}M76 110L125 100` }] },
  { id: 'band-march', name: 'Seated band hip-flexor march', match: /seated band hip-flexor march/i, equipment: 'Stable chair, light loop band around feet', prescription: '1-2 sets of 6-8 reps per side; rest 30-45 s.', cue: 'Sit tall with a light loop around both midfeet and shoes on. Keep one foot planted while lifting the other knee slightly; avoid leaning back and stop if the loop slips.', labels: ['Both feet down', 'Lift one knee'], poses: [{ ...sit, legs: 'M86 88L125 88L125 116M86 88L107 96L107 116', equipment: 'M104 113H130M55 90H88V118' }, { ...sit, legs: 'M86 88L125 75L128 100M86 88L107 96L107 116', equipment: 'M107 113L128 97M55 90H88V118' }] },
  { id: 'lateral-step', name: 'Lateral step-up', match: /lateral step-up/i, equipment: 'Low stable step, support; optional 1-5 kg dumbbells', prescription: '1-2 sets of 6-8 reps per side; rest 60-75 s.', cue: 'Stand beside a low step with the nearer foot on it. Push through that foot to rise, keeping pelvis level and knee in line with toes. Lower slowly.', labels: ['Beside low step', 'Rise onto step'], poses: [step, { ...tallStep, legs: 'M80 70L80 85L80 95M80 70L102 78L111 95' }] },
  { id: 'step-down', name: 'Controlled forward step-down', match: /controlled forward step-down/i, equipment: 'Low stable step and support', prescription: '1-2 sets of 6 reps per side, 3 s lowering; rest 60 s.', cue: 'Stand on a low step holding support. Bend the standing knee to tap the other heel gently on the floor; keep pelvis level and avoid dropping. Start with a very low height.', labels: ['Stand on step', 'Lower to heel tap'], poses: [tallStep, { ...tallStep, head: [86, 33], body: 'M86 44L80 77', legs: 'M80 77L91 87L80 95M80 77L109 94L126 118' }] },
  { id: 'hip-hike', name: 'Supported hip hike', match: /supported hip hike/i, equipment: 'Low stable step and support', prescription: '1-2 sets of 8 slow reps per side; rest 45 s.', cue: 'Stand on one leg on a low step, holding support. With standing knee softly straight, gently lower then lift the free side of the pelvis; avoid leaning or swinging.', labels: ['Free hip slightly lowered', 'Bring pelvis level'], poses: [{ ...tallStep, legs: 'M80 70L80 85L80 95M80 70L102 97L109 116', equipment: `${tallStep.equipment}M135 45V118` }, { ...tallStep, legs: 'M80 70L80 85L80 95M80 70L102 84L109 103', equipment: `${tallStep.equipment}M135 45V118` }] },
  { id: 'reverse-lunge', name: 'Supported reverse lunge', match: /supported reverse lunge/i, equipment: 'Stable support; optional 1-5 kg dumbbell', prescription: '1-2 sets of 6-8 reps per side; rest 60-75 s.', cue: 'Hold support, step one foot back and lower comfortably. Keep the front foot planted and push through it to return; take a small range before adding weight.', labels: ['Stand supported', 'Step back and lower'], poses: [{ ...calf, legs: stand.legs }, split] },
  { id: 'lateral-lunge', name: 'Shallow lateral lunge', match: /shallow lateral lunge/i, equipment: 'Bodyweight; optional light dumbbell', prescription: '1-2 sets of 6 reps per side; rest 60 s.', cue: 'Take a comfortable step sideways and sit the hips back over that foot. Keep heel down and knee tracking with toes; stay shallow and push back to centre.', labels: ['Stand tall', 'Sit back to one side'], poses: [stand, { ...squat, legs: 'M65 78L61 94L45 116M65 78L112 96L150 116' }] },
  { id: 'single-rdl', name: 'Supported single-leg deadlift', match: /supported single-leg deadlift/i, equipment: 'Stable support; optional 1-5 kg dumbbell', prescription: '1-2 sets of 6-8 reps per side; rest 60-75 s.', cue: 'Hold support and soften the standing knee. Hinge forward as the free leg reaches back, keeping hips square; use a small range and bodyweight first.', labels: ['Balance with support', 'Hinge with hips square'], poses: [calf, { ...hinge, arms: 'M103 57L119 48L140 45M99 58L95 83L94 103', legs: 'M70 67L77 92L70 116M70 67L40 53L15 48', equipment: 'M140 45V118' }] },
  { id: 'single-bridge', name: 'Single-leg bridge', match: /single-leg bridge/i, equipment: 'Bodyweight', prescription: '1-2 sets of 6-8 reps per side; rest 45-60 s.', cue: 'From a bridge setup, lift one foot and raise hips only as far as they stay level. Keep the planted heel down; return to two-leg bridges if hamstrings cramp or form slips.', labels: ['One foot lifted', 'Lift hips level'], poses: [{ ...back, legs: 'M102 104L125 76L147 116M102 104L108 71L132 60' }, { ...bridge, legs: 'M100 77L128 77L147 116M100 77L108 53L132 43' }] },
  { id: 'bridge-march', name: 'Bridge march', match: /bridge march/i, equipment: 'Bodyweight', prescription: '1-2 sets of 5-6 lifts per side; rest 45-60 s.', cue: 'Hold a low two-leg bridge. Briefly lift one foot just off the floor, then replace it and alternate without the pelvis rocking; lower hips if needed.', labels: ['Low bridge', 'Brief alternating foot lift'], poses: [bridge, { ...bridge, legs: 'M100 77L128 77L147 116M100 77L117 78L135 104' }] },
  { id: 'hamstring-walkout', name: 'Short hamstring bridge walkout', match: /short hamstring bridge walkout/i, equipment: 'Bodyweight, non-slip floor', prescription: '1 set of 4 short out-and-back sequences; rest 60 s.', cue: 'From a low bridge, take two tiny heel steps away and back with toes lifted. Keep hips controlled; stop for cramping and use ordinary bridges if too demanding.', labels: ['Low bridge', 'Tiny heel steps out'], poses: [bridge, { ...bridge, body: 'M48 101L100 90', legs: 'M100 90L142 100L169 116M100 90L130 104L154 116' }] },
  { id: 'suitcase', name: 'Suitcase carry', match: /suitcase carry/i, equipment: 'One 1-5 kg dumbbell', prescription: '1-2 carries of 20-30 s per side; rest 45 s.', cue: 'Hold a light weight at one side and walk slowly in a clear space. Keep shoulders and pelvis level without leaning; change hands. No breath-holding.', labels: ['Weight at one side', 'Walk tall'], poses: [{ ...stand, equipment: 'M59 74H72' }, { ...stand, legs: 'M80 70L68 93L52 116M80 70L96 92L108 116', equipment: 'M59 74H72' }] },
  { id: 'farmer', name: 'Farmer carry', match: /farmer carry/i, equipment: 'Two 1-5 kg dumbbells', prescription: '1-2 carries of 20-30 s; rest 45-60 s.', cue: 'Carry a comfortable weight in each hand with arms relaxed by your sides. Walk tall with short controlled steps in clear space, breathing normally.', labels: ['Weights by sides', 'Short controlled steps'], poses: [{ ...stand, equipment: weights }, { ...stand, legs: 'M80 70L68 93L52 116M80 70L96 92L108 116', equipment: weights }] },
  { id: 'db-row', name: 'Dumbbell bent-over row', match: /dumbbell bent-over row/i, equipment: 'Two 1-5 kg dumbbells', prescription: '1-2 sets of 8-12 reps; rest 60 s.', cue: 'Hinge with soft knees and a comfortably neutral back. Draw elbows towards hips with weights close, then lower slowly; do not jerk or shrug.', labels: ['Hinge, arms hanging', 'Elbows towards hips'], poses: [{ ...hinge, equipment: 'M88 104H100M104 104H116' }, row] },
  { id: 'floor-press', name: 'Dumbbell floor press', match: /dumbbell floor press/i, equipment: 'Two 1-5 kg dumbbells, floor mat', prescription: '1-2 sets of 8-12 reps; rest 60 s.', cue: 'Lie on the floor, knees bent, elbows about 30-45 degrees from your sides. Press light weights above the chest, then lower until upper arms gently touch down. Keep wrists stacked.', labels: ['Upper arms on floor', 'Press above chest'], poses: [{ ...back, arms: 'M53 101L75 113L75 86M53 101L45 114L45 86', equipment: 'M68 84H82M38 84H52' }, { ...back, arms: 'M53 101L61 75L68 50M53 101L75 75L82 50', equipment: 'M61 48H75M75 48H89' }] },
  { id: 'overhead-press', name: 'Light dumbbell overhead press', match: /light dumbbell overhead press/i, equipment: 'Two light 1-5 kg dumbbells', prescription: '1-2 sets of 6-10 reps; rest 60 s.', cue: 'Start with very light weights at shoulder height. Press overhead only through a comfortable, pain-free range without arching the back or flaring ribs; lower under control.', labels: ['Weights at shoulders', 'Press without leaning'], poses: [{ ...stand, arms: 'M80 40L55 52L55 30M80 40L105 52L105 30', equipment: 'M49 28H61M99 28H111' }, { ...stand, arms: 'M80 40L58 29L58 6M80 40L102 29L102 6', equipment: 'M52 5H64M96 5H108' }] },
  { id: 'lateral-raise', name: 'Light dumbbell lateral raise', match: /light dumbbell lateral raise/i, equipment: 'Two light dumbbells, start at 1 kg', prescription: '1-2 sets of 8-12 reps; rest 45-60 s.', cue: 'With soft elbows, raise arms slightly forward of your sides no higher than shoulder height. Keep shoulders relaxed; use small loads and no swinging.', labels: ['Arms by sides', 'Lift to comfortable height'], poses: [{ ...stand, equipment: weights }, { ...stand, arms: 'M80 40L52 45L25 50M80 40L108 45L135 50', equipment: 'M19 52H31M129 52H141' }] },
  { id: 'reverse-fly', name: 'Light dumbbell reverse fly', match: /light dumbbell reverse fly/i, equipment: 'Two light dumbbells, start at 1 kg', prescription: '1-2 sets of 8-10 reps; rest 60 s.', cue: 'Hinge gently with a neutral back. Open softly bent arms outwards in a small range, drawing shoulder blades together without shrugging. Avoid momentum.', labels: ['Arms hanging', 'Open arms gently'], poses: [hinge, { ...hinge, arms: 'M103 57L123 68L151 75M99 58L73 76L45 85', equipment: 'M145 77H157M39 87H51' }] },
  { id: 'biceps', name: 'Dumbbell biceps curl', match: /dumbbell biceps curl/i, equipment: 'Two 1-5 kg dumbbells', prescription: '1-2 sets of 8-12 reps; rest 45-60 s.', cue: 'Stand tall with elbows near your sides. Curl light weights without rocking the trunk, then lower slowly. Keep wrists comfortably straight.', labels: ['Arms long', 'Curl without swinging'], poses: [{ ...stand, equipment: weights }, { ...stand, arms: 'M80 40L65 58L69 39M80 40L95 58L91 39', equipment: 'M63 37H75M85 37H97' }] },
  { id: 'triceps', name: 'Light dumbbell triceps kickback', match: /light dumbbell triceps kickback/i, equipment: 'Light dumbbells, start at 1 kg', prescription: '1-2 sets of 8-12 reps; rest 45-60 s.', cue: 'Hinge with elbows tucked near your ribs. Keeping upper arms still, straighten elbows gently behind you then return. Do not lock forcefully or swing the weights.', labels: ['Elbows bent by ribs', 'Straighten elbows gently'], poses: [row, { ...hinge, arms: 'M103 57L83 75L52 84M99 58L78 75L44 83', equipment: 'M46 86H58M38 85H50' }] },
  { id: 'band-pull', name: 'Band pull-apart', match: /band pull-apart/i, equipment: 'Light long resistance band', prescription: '1-2 sets of 8-12 reps; rest 45 s.', cue: 'Hold a light band in front at chest height with soft elbows. Gently separate hands without shrugging or arching; return slowly. Inspect the band first and keep it below face height.', labels: ['Light tension in front', 'Pull hands apart'], poses: [{ ...stand, arms: 'M80 40L66 48L61 52M80 40L94 48L99 52', equipment: 'M61 52H99' }, { ...stand, arms: 'M80 40L52 45L25 50M80 40L108 45L135 50', equipment: 'M25 50H135' }] },
  { id: 'band-rotation', name: 'Band shoulder external rotation', match: /band shoulder external rotation/i, equipment: 'Light long resistance band', prescription: '1-2 sets of 8-12 reps; rest 45 s.', cue: 'Hold a light band between hands, elbows bent and tucked at your sides. Rotate forearms out a small distance without moving elbows or flaring ribs; return slowly.', labels: ['Elbows tucked', 'Rotate forearms out'], poses: [{ ...stand, arms: 'M80 40L65 58L72 66M80 40L95 58L88 66', equipment: 'M72 66H88' }, { ...stand, arms: 'M80 40L65 58L44 61M80 40L95 58L116 61', equipment: 'M44 61H116' }] },
  { id: 'wall-push', name: 'Wall push-up', match: /wall push-up/i, equipment: 'Solid wall', prescription: '1-2 sets of 8-12 reps; rest 60 s.', cue: 'Place hands on a solid wall around chest height and step back slightly. Keep body in a straight line as you bend elbows, then push away; avoid shrugging and start close to the wall.', labels: ['Body long, hands on wall', 'Bend elbows, then press'], poses: [{ ...stand, head: [93, 22], body: 'M90 33L73 74', arms: 'M87 42L113 48L145 48', legs: 'M73 74L65 94L57 116M73 74L82 94L75 116', equipment: 'M145 5V120' }, { ...stand, head: [116, 22], body: 'M110 33L88 74', arms: 'M105 42L125 67L145 48', legs: 'M88 74L72 94L57 116M88 74L90 94L75 116', equipment: 'M145 5V120' }] },
];

export function guidesForNotes(notes: string): MoveGuide[] {
  return MOVE_GUIDES.filter(move => move.match.test(notes)
    || notes.split('\n').some(line => line.toLowerCase().startsWith(`${move.name.toLowerCase()}:`)));
}

export function workoutFlowSteps(notes: string): { text: string; moves: MoveGuide[] }[] {
  const lines = notes.split(/\n\s*\n|\n/).map(text => text.trim()).filter(text =>
    text && !/^(Heavy|Light) \d+:|^Five-week rotation:|^Heavy means the main resistance session/.test(text),
  );
  const steps: { text: string; moves: MoveGuide[] }[] = [];
  const cooldown: string[] = [];
  const guidance: string[] = [];
  const transition = notes.match(/rest (\d+(?:-\d+)?) s (?:when changing|between) exercises/i)?.[1];
  for (const original of lines) {
    let text = original.replace(/(?:Cool[- ]down:|Cool down with|Finish with) ([^.]+)\./gi, (_, content: string) => {
      cooldown.push(content);
      return '';
    }).trim();
    text = text.replace(/(?:rest |;\s*rest )\d+(?:-\d+)? s (?:when changing|between) exercises\./gi, '').trim();
    if (/^(?:Allow )?about \d+(?:[-–]\d+)? min/i.test(text)) continue;
    text = text.replace(/\b(?:Allow )?about \d+(?:[-–]\d+)? min(?:utes)?[^.]*\./gi, '').trim();
    if (!text) continue;
    if (/^Warm-up:/i.test(text)) {
      steps.push({ text: `${text} Alternatives: gentle side steps or seated heel lifts for the same time.`, moves: guidesForNotes(text) });
      continue;
    }
    const moves = guidesForNotes(text);
    if (!moves.length) {
      if (/^(Bodyweight only|Move slowly|Taper:)/i.test(text)) guidance.push(text);
      else steps.push({ text, moves });
      continue;
    }
    if (transition && steps.some(step => step.moves.length && !/^Warm-up:/i.test(step.text))) {
      steps.push({ text: `Rest ${transition}s before the next exercise.`, moves: [] });
    }
    const sets = text.match(/\b(\d+) sets? x /i);
    const rest = text.match(/(\d+(?:-\d+)?) s between sets/i);
    if (sets && rest) {
      const sideRest = text.match(/(\d+) s between sides/i)?.[1];
      text = text.replace(/(?:[.;]\s*)?rest [^.]*between sets\./i, sideRest ? `. Rest ${sideRest} s between sides.` : '.');
      const singleSet = text.replace(/\b\d+ sets? x /i, '');
      for (let set = 1; set <= Number(sets[1]); set++) {
        if (set > 1) steps.push({ text: `Rest ${rest[1]}s between sets.`, moves: [] });
        steps.push({ text: `Set ${set} of ${sets[1]} - ${singleSet}`, moves });
      }
    } else {
      const afterRest = text.match(/(?:;\s*rest |,\s*then )(\d+) s\.$/i);
      steps.push({ text: afterRest ? text.replace(afterRest[0], '.') : text, moves });
      if (afterRest) steps.push({ text: `Rest ${afterRest[1]}s.`, moves: [] });
    }
  }
  if (cooldown.length || steps.some(step => /^Warm-up:/i.test(step.text))) {
    steps.push({
      text: `Cool-down: ${cooldown.length ? cooldown.join('. ') : '2 min easy walking'}.${cooldown.some(text => /alternativ| or /i.test(text)) ? '' : ' Alternatives: gentle side steps or seated ankle circles for the same time.'} Keep it gentle.`,
      moves: guidesForNotes(cooldown.join('. ')),
    });
  }
  return [...steps, ...guidance.map(text => ({ text, moves: [] }))];
}

export function strengthDurationLabel(notes: string): string {
  const match = notes.match(/(?:about\s+|^)(\d+)(?:[-–](\d+))?\s*min(?:utes)?\b/i);
  if (!match) return 'Duration not specified';
  const duration = `${match[1]}${match[2] ? `–${match[2]}` : ''} min`;
  return /^Taper: 1 easy set/m.test(notes) ? `${duration} standard; shorter with taper sets` : `Approx. ${duration}`;
}
