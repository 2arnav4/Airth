import type { Job, JobStatus } from '../types';
import { JobCard } from './JobCard';

interface Props {
  jobs?: Job[];
  isLoading: boolean;
  busyJobId?: string;
  onChangeStatus: (job: Job, next: JobStatus) => void;
  onDelete: (job: Job) => void;
}

export function JobList({
  jobs,
  isLoading,
  busyJobId,
  onChangeStatus,
  onDelete,
}: Props) {
  if (isLoading) {
    return (
      <ul className="space-y-3">
        {[0, 1, 2].map((row) => (
          <li
            key={row}
            className="h-20 animate-pulse rounded-lg border border-slate-200 bg-white"
          />
        ))}
      </ul>
    );
  }

  if (!jobs || jobs.length === 0) {
    return (
      <p className="rounded-lg border border-dashed border-slate-300 p-8 text-center text-sm text-slate-500">
        No jobs here yet.
      </p>
    );
  }

  return (
    <ul className="space-y-3">
      {jobs.map((job) => (
        <JobCard
          key={job.id}
          job={job}
          onChangeStatus={onChangeStatus}
          onDelete={onDelete}
          isBusy={busyJobId === job.id}
        />
      ))}
    </ul>
  );
}
