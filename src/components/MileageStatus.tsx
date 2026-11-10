import { CalendarClock, CircleCheck, Clock, History } from 'lucide-react';

export function MileageStatus({ status, achieved }: { status: string; achieved: boolean }) {
  const label = achieved ? 'Planned mileage achieved' : status;
  const Icon = achieved ? CircleCheck : status === 'Past week' ? History : status === 'Upcoming' ? CalendarClock : Clock;
  return <span className={`mileage-status${achieved ? ' mileage-achieved' : ''}`} role="img" aria-label={label} title={label}>
    <Icon size={18} aria-hidden="true" />
  </span>;
}
