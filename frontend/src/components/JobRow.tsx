import { NEXT_STATUSES, type Job, type JobStatus } from '../types';
import {
  ACTION_LABELS,
  ACTION_STYLES,
  DELETE_STYLE,
  STATUS_STYLES,
  relativeTime,
} from './status-styles';

interface Props {
  job: Job;
  onChangeStatus: (job: Job, next: JobStatus) => void;
  onDelete: (job: Job) => void;
  isBusy: boolean;
}

/** One row of the queue. Dividers come from the list, not from a card. */
export function JobRow({ job, onChangeStatus, onDelete, isBusy }: Props) {
  const nextStatuses = NEXT_STATUSES[job.status];
  const style = STATUS_STYLES[job.status];

  return (
    <li
      className={`grid gap-3 px-5 py-4 transition sm:grid-cols-[140px_minmax(0,1fr)_auto] sm:items-center sm:gap-5 ${
        isBusy ? 'opacity-50' : 'hover:bg-raised/60'
      }`}
    >
      <span
        className={`inline-flex w-fit items-center gap-2 rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-wide ${style.chip}`}
      >
        <span className={`h-2 w-2 rounded-full ${style.dot}`} />
        {job.status}
      </span>

      <div className="min-w-0">
        <p className="truncate text-[17px] font-medium text-ink">{job.title}</p>

        <p className="mt-1 flex flex-wrap items-center gap-x-2 text-[13px] text-faint">
          <span className="rounded bg-raised px-2 py-0.5 font-mono text-muted">
            {job.type}
          </span>
          <span title={new Date(job.createdAt).toLocaleString()}>
            {relativeTime(job.createdAt)}
          </span>
          <span>·</span>
          <span title="Version, used for optimistic locking">v{job.version}</span>
          {job.priority > 0 && (
            <>
              <span>·</span>
              <span className="font-medium text-signal">
                priority {job.priority}
              </span>
            </>
          )}
        </p>
      </div>

      <div className="flex shrink-0 flex-wrap items-center gap-2 sm:justify-end">
        {nextStatuses.length === 0 ? (
          <span className="px-2 text-[13px] italic text-faint">
            final state
          </span>
        ) : (
          nextStatuses.map((next) => (
            <button
              key={next}
              type="button"
              disabled={isBusy}
              onClick={() => onChangeStatus(job, next)}
              className={ACTION_STYLES[next]}
            >
              {ACTION_LABELS[next]}
            </button>
          ))
        )}

        <button
          type="button"
          disabled={isBusy}
          onClick={() => {
            // Deleting is the only irreversible action here, and a running job
            // is work in progress, so make the operator say it twice.
            if (
              window.confirm(
                `Delete "${job.title}"? This cannot be undone.`,
              )
            ) {
              onDelete(job);
            }
          }}
          aria-label={`Delete ${job.title}`}
          className={DELETE_STYLE}
        >
          Delete
        </button>
      </div>
    </li>
  );
}
