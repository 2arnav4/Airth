import type { Job, JobStatus } from '../types';
import { JobRow } from './JobRow';

interface Props {
  jobs?: Job[];
  isLoading: boolean;
  busyIds: ReadonlySet<string>;
  filterLabel: string;
  onChangeStatus: (job: Job, next: JobStatus) => void;
  onDelete: (job: Job) => void;
}

export function JobList({
  jobs,
  isLoading,
  busyIds,
  filterLabel,
  onChangeStatus,
  onDelete,
}: Props) {
  return (
    <section className="overflow-hidden rounded-xl border border-edge bg-surface">
      <header className="flex items-center justify-between border-b border-edge px-5 py-3">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted">
          Queue · {filterLabel}
        </h2>
        <span className="text-[13px] text-faint">
          {isLoading ? '—' : `${jobs?.length ?? 0} rows`}
        </span>
      </header>

      {isLoading ? (
        <ul className="divide-y divide-edge-soft">
          {[0, 1, 2].map((row) => (
            <li key={row} className="px-5 py-6">
              <span className="block h-4 w-1/3 animate-pulse bg-edge" />
            </li>
          ))}
        </ul>
      ) : !jobs || jobs.length === 0 ? (
        <p className="px-5 py-12 text-center text-sm text-faint">
          No jobs in this view
        </p>
      ) : (
        <ul className="divide-y divide-edge-soft">
          {jobs.map((job) => (
            <JobRow
              key={job.id}
              job={job}
              onChangeStatus={onChangeStatus}
              onDelete={onDelete}
              isBusy={busyIds.has(job.id)}
            />
          ))}
        </ul>
      )}
    </section>
  );
}
