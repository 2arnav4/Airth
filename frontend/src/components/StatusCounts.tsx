import { JOB_STATUSES, type JobStats, type JobStatus } from '../types';
import { STATUS_STYLES } from './status-styles';

interface Props {
  stats?: JobStats;
  isLoading: boolean;
  active: JobStatus | 'all';
  onSelect: (status: JobStatus | 'all') => void;
}

/** Counts double as the filter: clicking a tile narrows the queue below. */
export function StatusCounts({ stats, isLoading, active, onSelect }: Props) {
  const total = stats
    ? JOB_STATUSES.reduce((sum, status) => sum + stats[status], 0)
    : undefined;

  return (
    <section
      aria-label="Job counts by status"
      className="grid grid-cols-2 gap-3 sm:grid-cols-5"
    >
      <Tile
        label="Total"
        value={total}
        isLoading={isLoading}
        isActive={active === 'all'}
        onSelect={() => onSelect('all')}
      />

      {JOB_STATUSES.map((status) => (
        <Tile
          key={status}
          label={status}
          value={stats?.[status]}
          isLoading={isLoading}
          isActive={active === status}
          accent={STATUS_STYLES[status].text}
          dot={STATUS_STYLES[status].dot}
          onSelect={() => onSelect(status)}
        />
      ))}
    </section>
  );
}

interface TileProps {
  label: string;
  value?: number;
  isLoading: boolean;
  isActive: boolean;
  accent?: string;
  dot?: string;
  onSelect: () => void;
}

function Tile({
  label,
  value,
  isLoading,
  isActive,
  accent = 'text-ink',
  dot,
  onSelect,
}: TileProps) {
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={isActive}
      className={`rounded-xl border px-4 py-3 text-left transition-transform active:translate-y-[3px] active:shadow-none ${
        isActive
          ? 'border-sky-500/60 bg-raised shadow-[0_3px_0_0_#0b4a6f]'
          : 'border-edge bg-surface shadow-[0_3px_0_0_#11151c] hover:bg-raised'
      }`}
    >
      <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-faint">
        {dot && <span className={`h-2 w-2 rounded-full ${dot}`} />}
        {label}
      </span>

      {isLoading ? (
        <span className="mt-2 block h-8 w-10 animate-pulse rounded bg-edge" />
      ) : (
        <span className={`mt-1 block text-3xl font-bold tabular-nums ${accent}`}>
          {value ?? 0}
        </span>
      )}
    </button>
  );
}
