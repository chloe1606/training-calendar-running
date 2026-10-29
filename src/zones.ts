import { DEFAULT_TRAINING_ZONES, RUN_TYPES, formatPace, isRun, paceInUnits, type HRZone, type RunType, type Settings, type TrainingZones, type Workout } from './model';

export const HR_USES = ['Recovery, warm-up', 'Easy and long runs', 'Steady and tempo', 'Threshold, hard intervals', 'Max efforts'];

export function validTrainingZones(value: unknown): value is TrainingZones {
  if (typeof value !== 'object' || value === null) return false;
  const { hrBoundaries, paceBoundaries, hrTargets } = value as Partial<TrainingZones>;
  return Array.isArray(hrBoundaries) && hrBoundaries.length === 4
    && hrBoundaries.every((n, i) => Number.isInteger(n) && n >= 60 && n <= 220 && (i === 0 || n > hrBoundaries[i - 1]))
    && Array.isArray(paceBoundaries) && paceBoundaries.length === 5
    && paceBoundaries.every((n, i) => Number.isFinite(n) && n >= 0.1 && n <= 120 && (i === 0 || n < paceBoundaries[i - 1]))
    && typeof hrTargets === 'object' && hrTargets !== null
    && RUN_TYPES.every(type => Number.isInteger(hrTargets[type]) && hrTargets[type] >= 1 && hrTargets[type] <= 5);
}
export function hrRangeLabel(zone: HRZone, boundaries: TrainingZones['hrBoundaries']): string {
  if (zone === 1) return `Under ${boundaries[0]} bpm`;
  if (zone === 5) return `${boundaries[3]}+ bpm`;
  return `${boundaries[zone - 2]}–${boundaries[zone - 1] - 1} bpm`;
}
export function paceZoneFor(pace: number, boundaries: TrainingZones['paceBoundaries']): number {
  const index = boundaries.findIndex(boundary => pace > boundary + 1e-9);
  return index < 0 ? 6 : index + 1;
}
export function paceZoneLabel(workout: Workout, zones: TrainingZones): string {
  const low = paceZoneFor(workout.paceMinPerMile.max, zones.paceBoundaries);
  const high = paceZoneFor(workout.paceMinPerMile.min, zones.paceBoundaries);
  return low === high ? `Z${low}` : `Z${low}–Z${high}`;
}
export function paceZoneRangeLabel(zone: number, boundaries: TrainingZones['paceBoundaries'], units: Settings['units']): string {
  const pace = (index: number) => formatPace(paceInUnits(boundaries[index], units));
  if (zone === 1) return `Slower than ${pace(0)}`;
  if (zone === 6) return `Faster than ${pace(4)}`;
  return `${pace(zone - 2)}–${pace(zone - 1)}`;
}
export function runTargets(workout: Workout, settings: Settings) {
  if (!isRun(workout)) return null;
  const zones = settings.trainingZones ?? DEFAULT_TRAINING_ZONES;
  const hrZone = workout.hrZone ?? zones.hrTargets[workout.type as RunType];
  return { paceZone: paceZoneLabel(workout, zones), hrZone, hrRange: hrRangeLabel(hrZone, zones.hrBoundaries) };
}
