import { format, parseISO } from 'date-fns';
import { dayOffset, formatPace, isRun, workoutLabel, type Plan } from './model';
import { hrRangeLabel, runTargets } from './zones';
import { mainSetMiles, qualityDetails } from './quality';

export function download(contents: string, filename: string, type: string) {
  const url = URL.createObjectURL(new Blob([contents], { type }));
  const link = document.createElement('a');
  link.href = url; link.download = filename;
  document.body.append(link); link.click(); link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
const escapeICS = (text: string) => text.replace(/\\/g, '\\\\').replace(/\r?\n/g, '\\n').replace(/;/g, '\\;').replace(/,/g, '\\,');
function foldLine(line: string): string {
  let result = '', bytes = 0;
  for (const character of line) {
    const length = new TextEncoder().encode(character).length;
    if (bytes + length > 75) { result += '\r\n '; bytes = 1; }
    result += character; bytes += length;
  }
  return result;
}
export function exportICS(plan: Plan, now = new Date()): string {
  const lines = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Marathon Planner//Training Calendar//EN', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH', 'X-WR-CALNAME:Marathon Planner'];
  const timestamp = now.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}Z/, 'Z');
  for (const w of plan.workouts) {
    const targets = runTargets(w, plan.settings);
    const description = [
      isRun(w) ? `${w.distanceMiles} miles; ${w.qualityStyle === 'hills' ? 'Flat-equivalent reference: ' : w.qualityStyle === 'progression' ? 'Threshold portion: ' : mainSetMiles(w) !== null ? 'Work portion: ' : ''}${formatPace(w.paceMinPerMile.min)}–${formatPace(w.paceMinPerMile.max)}/mi` : 'Non-running session',
      ...(targets ? [`Pace ${targets.paceZone}; HR Z${targets.hrZone}: ${targets.hrRange}`] : []),
      ...qualityDetails(w, plan.settings),
      ...(w.marathonFinish ? [`MP finish (hard day): first ${w.distanceMiles - w.marathonFinish.distanceMiles} mi easy, last ${w.marathonFinish.distanceMiles} mi at ${formatPace(w.marathonFinish.paceMinPerMile.min)}–${formatPace(w.marathonFinish.paceMinPerMile.max)}/mi. Easy HR above applies before the finish; finish HR Z${plan.settings.trainingZones.hrTargets.marathonPace}.`] : []),
      ...(w.marathonFinish ? [`Finish HR: ${hrRangeLabel(plan.settings.trainingZones.hrTargets.marathonPace, plan.settings.trainingZones.hrBoundaries)}`] : []),
      ...(w.hrCapBpm ? [`${w.marathonFinish ? 'Easy portion: ' : ''}HR under ${w.hrCapBpm} bpm`] : []), w.completed ? 'Completed' : 'Planned', w.notes,
    ].join('\n');
    lines.push('BEGIN:VEVENT', `UID:${escapeICS(w.id)}@marathon-planner.local`, `DTSTAMP:${timestamp}`,
      `DTSTART;VALUE=DATE:${format(parseISO(w.date), 'yyyyMMdd')}`,
      `DTEND;VALUE=DATE:${format(parseISO(dayOffset(w.date, 1)), 'yyyyMMdd')}`,
      `SUMMARY:${escapeICS(`${workoutLabel(w)}${w.distanceMiles ? ` · ${w.distanceMiles} mi` : ''}`)}`,
      `DESCRIPTION:${escapeICS(description)}`, 'END:VEVENT');
  }
  lines.push('END:VCALENDAR');
  return lines.map(foldLine).join('\r\n') + '\r\n';
}
