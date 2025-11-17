import type { AvailabilityStatus } from '../../types/index.ts';

type StatusBadgeProps = {
  status: AvailabilityStatus;
};

const styles: Record<AvailabilityStatus, string> = {
  open: 'bg-emerald-400/20 text-emerald-300 ring-1 ring-emerald-500/50',
  limited: 'bg-amber-400/20 text-amber-200 ring-1 ring-amber-400/50',
  full: 'bg-rose-500/30 text-rose-100 ring-1 ring-rose-500/50',
};

export const StatusBadge = ({ status }: StatusBadgeProps) => (
  <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold ${styles[status]}`}>
    <span className="h-2 w-2 rounded-full bg-current" />
    {status === 'open' ? 'Open' : status === 'limited' ? 'Limited' : 'Full'}
  </span>
);
