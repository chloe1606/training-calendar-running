import { fromUnits, inUnits, type Settings, type Workout } from './model';

export interface RaceEntry { id: string; date: string; distance: string }

export function raceEntries(workouts: Workout[], units: Settings['units']): RaceEntry[] {
  return workouts.map(w => ({ id: w.id, date: w.date, distance: Number(inUnits(w.distanceMiles, units).toFixed(2)).toString() }));
}

export function saveRaces(entries: RaceEntry[], originals: Workout[], settings: Settings): Workout[] {
  return entries.map((entry, index) => {
    const date = new Date(`${entry.date}T00:00:00Z`);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(entry.date) || entry.date < '2020-01-01' || entry.date > '2100-12-31'
      || Number.isNaN(date.getTime()) || date.toISOString().slice(0, 10) !== entry.date) {
      throw new Error(`Race ${index + 1}: enter a valid date between 2020 and 2100.`);
    }
    const original = originals.find(w => w.id === entry.id);
    const originalDistance = original && Number(inUnits(original.distanceMiles, settings.units).toFixed(2)).toString();
    const distanceMiles = original && entry.distance === originalDistance
      ? original.distanceMiles : fromUnits(Number(entry.distance), settings.units);
    if (!entry.distance.trim() || !Number.isFinite(distanceMiles) || distanceMiles <= 0 || distanceMiles > 200) {
      throw new Error(`Race ${index + 1}: enter a distance greater than zero and no more than ${Number(inUnits(200, settings.units).toFixed(2))} ${settings.units}.`);
    }
    return original ? { ...original, date: entry.date, distanceMiles } : {
      id: entry.id, date: entry.date, type: 'race', distanceMiles,
      paceMinPerMile: { ...settings.paceZones.marathonPace }, notes: '', completed: false,
    };
  });
}
