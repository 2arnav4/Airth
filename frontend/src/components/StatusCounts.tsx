import { JOB_STATUSES, type JobStats } from '../types';
import { STATUS_STYLES } from './status-styles';

interface Props {
  stats?: JobStats;
  isLoading: boolean;
}

export function StatusCounts({ stats, isLoading }: Props) {
  return (
    <section
      aria-label="Job counts by status"
      className="grid grid-cols-2 gap-3 sm:grid-cols-4"
    >
      {JOB_STATUSES.map((status) => (
        <div
          key={status}
          className={`rounded-xl border border-l-4 border-slate-200 bg-white px-4 py-3 shadow-sm ${STATUS_STYLES[status].tile}`}
        >
          <p className="text-[11px] font-semibold uppercase tracking-wider text-slate-500">
            {status}
          </p>

          {isLoading ? (
            <span className="mt-1 block h-8 w-10 animate-pulse rounded bg-slate-100" />
          ) : (
            <p className="mt-0.5 text-3xl font-semibold tabular-nums text-slate-900">
              {stats?.[status] ?? 0}
            </p>
          )}
        </div>
      ))}
    </section>
  );
}
