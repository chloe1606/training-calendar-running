import { create } from 'zustand';
import { ACTIVITIES, TYPES, SCHEDULE_TYPES, DEFAULT_DAYS, DEFAULT_TRAINING_ZONES, type Plan } from './model';
import { validTrainingZones } from './zones';
import { scheduleStrength, unassignPlannedStrength } from './strength';
import { createDefaultPlan } from './seed';
import { addMarathonFinishes } from './finishes';
import { addQualityVariety } from './quality';
import { refineThresholdPlan } from './threshold';

const STORAGE_KEY = 'marathon-planner-v1';
const validDate = (v: unknown): v is string => typeof v === 'string'
  && /^\d{4}-\d{2}-\d{2}$/.test(v) && v >= '2020-01-01' && v <= '2100-12-31'
  && !Number.isNaN(Date.parse(v)) && new Date(v).toISOString().slice(0, 10) === v;
const number = (v: unknown, min: number, max: number): v is number =>
  typeof v === 'number' && Number.isFinite(v) && v >= min && v <= max;
const object = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v);
const validPace = (v: unknown) => object(v) && number(v.min, 0.1, 120) && number(v.max, v.min, 120);
function assertValidPlan(value: unknown): asserts value is Plan {
  if (!object(value) || !Array.isArray(value.workouts) || !object(value.settings)) throw new Error('Expected a plan with workouts and settings.');
  const s = value.settings;
  if (!validDate(s.raceDate) || typeof s.goalTime !== 'string' || !/^\d{1,2}:[0-5]\d:[0-5]\d$/.test(s.goalTime)
    || !s.goalTime.split(':').some(v => Number(v) > 0) || !['mi', 'km'].includes(String(s.units)) || !number(s.maxEasyHR, 60, 220)
    || typeof s.darkMode !== 'boolean' || !object(s.paceZones)) throw new Error('Invalid settings in plan file.');
  for (const zone of ['easy', 'long', 'threshold', 'marathonPace', 'parkrun']) {
    if (!validPace(s.paceZones[zone])) throw new Error(`Invalid ${zone} pace zone.`);
  }
  if (s.defaultDays !== undefined) {
    if (!object(s.defaultDays)) throw new Error('Invalid default activity days.');
    for (const type of SCHEDULE_TYPES) {
      const day = s.defaultDays[type];
      if (day !== null && (!number(day, 0, 6) || !Number.isInteger(day))) {
        throw new Error(`Invalid default day for ${type}.`);
      }
      if (s.trainingZones !== undefined && !validTrainingZones(s.trainingZones)) throw new Error('Invalid HR or pace training zones. Boundaries must be ordered and all run types need an HR target.');
      if (s.strengthDays !== undefined && (!Array.isArray(s.strengthDays) || s.strengthDays.length !== 2
        || !s.strengthDays.every(day => number(day, 0, 6) && Number.isInteger(day)) || s.strengthDays[0] === s.strengthDays[1])) {
        throw new Error('Choose two different strength weekdays.');
      }
    }
  }
  if (value.workouts.length > 10000) throw new Error('Plan exceeds the 10,000-workout import limit.');
  const ids = new Set<string>();
  for (const w of value.workouts) {
    if (!object(w) || typeof w.id !== 'string' || !w.id || ids.has(w.id) || !validDate(w.date)
      || !TYPES.some(type => type === w.type) || !number(w.distanceMiles, 0, 200)
      || !validPace(w.paceMinPerMile) || typeof w.notes !== 'string' || typeof w.completed !== 'boolean'
      || (w.hrCapBpm !== undefined && !number(w.hrCapBpm, 60, 220))
      || (w.hrZone !== undefined && (!number(w.hrZone, 1, 5) || !Number.isInteger(w.hrZone)))
      || (w.activity !== undefined && !ACTIVITIES.some(activity => activity === w.activity))) {
      throw new Error('Invalid workout or duplicate workout ID in plan file.');
    }
    ids.add(w.id);
    if (w.qualityStyle !== undefined && (w.type !== 'threshold' || (w.qualityStyle !== 'hills' && w.qualityStyle !== 'progression'))) throw new Error('Invalid quality session style.');
    if (w.marathonFinish !== undefined && (w.type !== 'long' || !object(w.marathonFinish)
      || !number(w.marathonFinish.distanceMiles, 0.001, w.distanceMiles)
      || !validPace(w.marathonFinish.paceMinPerMile))) throw new Error('Invalid marathon-pace finish.');
  }
  if (value.marathonFinishesVersion !== undefined && value.marathonFinishesVersion !== 1) throw new Error('Invalid marathon finish version.');
  if (value.qualityVarietyVersion !== undefined && value.qualityVarietyVersion !== 1) throw new Error('Invalid quality variety version.');
}
export function validatePlan(value: unknown): Plan {
  assertValidPlan(value);
  const needsStrength = value.settings.strengthDays === undefined;
  const plan: Plan = { ...value, settings: {
    ...value.settings, defaultDays: { ...(value.settings.defaultDays ?? DEFAULT_DAYS) },
    trainingZones: structuredClone(value.settings.trainingZones ?? DEFAULT_TRAINING_ZONES),
    strengthDays: value.settings.strengthDays ?? [1, 4],
  } };
  if (needsStrength) {
    plan.settings.defaultDays.strength = 1;
    plan.workouts = scheduleStrength(plan, plan.settings.strengthDays, true);
  }
  return unassignPlannedStrength(refineThresholdPlan(addQualityVariety(addMarathonFinishes(plan))));
}

function load(): { plan: Plan; error: string | null } {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const plan = raw ? validatePlan(JSON.parse(raw)) : createDefaultPlan();
    return { plan, error: raw && raw !== JSON.stringify(plan) ? save(plan) : null };
  } catch (error) {
    console.error('Unable to load saved Marathon Planner data', error);
    return { plan: createDefaultPlan(), error: 'Your saved plan could not be loaded. A default plan is displayed; export it before making changes if you need a backup. Check browser storage permissions.' };
  }
}
interface PlannerStore {
  plan: Plan;
  past: Plan[];
  future: Plan[];
  error: string | null;
  change: (update: (plan: Plan) => Plan) => void;
  undo: () => void;
  redo: () => void;
  retrySave: () => void;
}
function save(plan: Plan): string | null {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(plan)); return null; }
  catch (error) {
    console.error('Unable to save Marathon Planner data', error);
    return 'Changes are in memory but could not be saved to this browser. Export JSON to keep a backup.';
  }
}
export const usePlanner = create<PlannerStore>((set, get) => ({
  ...load(), past: [], future: [],
  change: update => {
    const { plan, past } = get();
    const next = update(structuredClone(plan));
    set({ plan: next, past: [...past.slice(-99), plan], future: [], error: save(next) });
  },
  undo: () => {
    const { past, plan, future } = get();
    if (!past.length) return;
    const previous = past[past.length - 1];
    set({ plan: previous, past: past.slice(0, -1), future: [plan, ...future], error: save(previous) });
  },
  redo: () => {
    const { past, plan, future } = get();
    if (!future.length) return;
    set({ plan: future[0], past: [...past, plan], future: future.slice(1), error: save(future[0]) });
  },
  retrySave: () => set({ error: save(get().plan) }),
}));
