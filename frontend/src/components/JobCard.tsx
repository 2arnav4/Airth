import { NEXT_STATUSES, type Job, type JobStatus } from '../types';
import {
  ACTION_LABELS,
  ACTION_STYLES,
  STATUS_STYLES,
  relativeTime,
} from './status-styles';

interface Props {
  job: Job;
  onChangeStatus: (job: Job, next: JobStatus) => void;
  onDelete: (job: Job) => void;
  isBusy: boolean;
}

export function JobCard({ job, onChangeStatus, onDelete, isBusy }: Props) {
  const nextStatuses = NEXT_STATUSES[job.status];
  const style = STATUS_STYLES[job.status];

  return (
    <li
      className={`flex flex-col gap-3 rounded-xl border border-l-4 border-slate-200 bg-white px-4 py-3 shadow-sm transition sm:flex-row sm:items-center sm:justify-between ${
        style.tile
      } ${isBusy ? 'opacity-60' : 'hover:shadow-md'}`}
    >
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="truncate font-medium text-slate-900">{job.title}</h3>

          <span
            className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium capitalize ring-1 ${style.badge}`}
          >
            <span className={`h-1.5 w-1.5 rounded-full ${style.dot}`} />
            {job.status}
          </span>

          {job.priority > 0 && (
            <span className="rounded-full bg-amber-50 px-2 py-0.5 text-[11px] font-medium text-amber-700 ring-1 ring-amber-200">
              P{job.priority}
            </span>
          )}
        </div>

        <p className="mt-1 flex flex-wrap items-center gap-x-2 text-xs text-slate-500">
          <span className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[11px] text-slate-600">
            {job.type}
          </span>
          <span title={new Date(job.createdAt).toLocaleString()}>
            {relativeTime(job.createdAt)}
          </span>
          <span className="text-slate-300">·</span>
          <span title="Version, used for optimistic locking">v{job.version}</span>
        </p>
      </div>

      <div className="flex shrink-0 flex-wrap items-center gap-2">
        {nextStatuses.length === 0 ? (
          <span className="text-xs italic text-slate-400">Final state</span>
        ) : (
          nextStatuses.map((next) => (
            <button
              key={next}
              type="button"
              disabled={isBusy}
              onClick={() => onChangeStatus(job, next)}
              className={`rounded-lg border px-3 py-1.5 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-50 ${ACTION_STYLES[next]}`}
            >
              {ACTION_LABELS[next]}
            </button>
          ))
        )}

        <button
          type="button"
          disabled={isBusy}
          onClick={() => onDelete(job)}
          aria-label={`Delete ${job.title}`}
          className="rounded-lg px-2.5 py-1.5 text-sm font-medium text-slate-400 transition hover:bg-rose-50 hover:text-rose-600 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Delete
        </button>
      </div>
    </li>
  );
}
