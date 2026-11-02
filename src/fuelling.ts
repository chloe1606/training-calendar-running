export interface FuellingEntry {
  minute: number;
  product: string;
  carbsGrams: number;
  fluidsMl: number;
}
export interface FuellingLog {
  entries: FuellingEntry[];
  notes: string;
}
export function validFuellingLog(value: unknown): value is FuellingLog {
  if (!value || typeof value !== 'object') return false;
  const log = value as FuellingLog;
  const number = (value: number, min: number, max: number) => Number.isFinite(value) && value >= min && value <= max;
  return typeof log.notes === 'string' && log.notes.length <= 10000
    && Array.isArray(log.entries) && log.entries.length <= 100
    && log.entries.every(entry => entry && typeof entry === 'object'
      && number(entry.minute, -240, 1440)
      && typeof entry.product === 'string' && entry.product.length <= 200
      && number(entry.carbsGrams, 0, 1000) && number(entry.fluidsMl, 0, 10000));
}
export function fuellingTotals(log: FuellingLog) {
  return log.entries.reduce((total, entry) => ({
    carbsGrams: total.carbsGrams + entry.carbsGrams,
    fluidsMl: total.fluidsMl + entry.fluidsMl,
  }), { carbsGrams: 0, fluidsMl: 0 });
}
export function fuellingDetails(log: FuellingLog): string[] {
  const total = fuellingTotals(log);
  return [
    `Fuelling log: ${Number(total.carbsGrams.toFixed(2))} g carbs, ${Number(total.fluidsMl.toFixed(2))} ml fluids.`,
    ...[...log.entries].sort((a, b) => a.minute - b.minute).map(entry =>
      `${entry.minute < 0 ? `${Math.abs(entry.minute)} min before start` : `${entry.minute} min from start`}: ${entry.product || 'Unspecified product'}; ${entry.carbsGrams} g carbs; ${entry.fluidsMl} ml fluids.`),
    ...(log.notes.trim() ? [`What worked / stomach & recovery notes: ${log.notes}`] : []),
  ];
}
