import { useState } from 'react';
import { ApiError } from './api/api-error';
import { CreateJobForm } from './components/CreateJobForm';
import { JobList } from './components/JobList';
import { Notice } from './components/Notice';
import { StatusCounts } from './components/StatusCounts';
import { GHOST_STYLE } from './components/status-styles';
import {
  useCreateJob,
  useDeleteJob,
  useJobStats,
  useJobs,
  useUpdateJobStatus,
} from './hooks/useJobs';
import type { CreateJobInput, Job, JobStatus } from './types';

export default function App() {
  const [filter, setFilter] = useState<JobStatus | 'all'>('all');
  const [notice, setNotice] = useState<
    { tone: 'error' | 'warning'; message: string } | undefined
  >();
  // Several rows can be mid-flight at once, so track ids rather than one id.
  const [busyIds, setBusyIds] = useState<ReadonlySet<string>>(new Set());

  const jobsQuery = useJobs(filter === 'all' ? undefined : filter);
  const statsQuery = useJobStats();

  const createJob = useCreateJob();
  const updateStatus = useUpdateJobStatus();
  const deleteJob = useDeleteJob();

  const loadError = jobsQuery.error ?? statsQuery.error;
  const isRefreshing = jobsQuery.isFetching || statsQuery.isFetching;

  /** Conflicts are expected, not crashes: explain, and let the refetch show the truth. */
  function reportFailure(error: unknown, fallback: string) {
    if (error instanceof ApiError && error.isConflict) {
      // 409/412: someone else got there first. Expected, not a crash.
      setNotice({
        tone: 'warning',
        message: `${error.message} The queue has been refreshed.`,
      });
      return;
    }

    setNotice({
      tone: 'error',
      message: error instanceof ApiError ? error.message : fallback,
    });
  }

  function markBusy(id: string, busy: boolean) {
    setBusyIds((current) => {
      const next = new Set(current);
      if (busy) {
        next.add(id);
      } else {
        next.delete(id);
      }

      return next;
    });
  }

  /** Returns true when the job was created, so the form knows whether to clear. */
  async function handleCreate(input: CreateJobInput): Promise<boolean> {
    setNotice(undefined);

    try {
      await createJob.mutateAsync(input);
      return true;
    } catch (error) {
      reportFailure(error, 'Could not create the job.');
      return false;
    }
  }

  async function handleChangeStatus(job: Job, next: JobStatus) {
    setNotice(undefined);
    markBusy(job.id, true);

    try {
      await updateStatus.mutateAsync({
        id: job.id,
        status: next,
        version: job.version,
      });
    } catch (error) {
      reportFailure(error, 'Could not update the job.');
    } finally {
      markBusy(job.id, false);
    }
  }

  async function handleDelete(job: Job) {
    setNotice(undefined);
    markBusy(job.id, true);

    try {
      await deleteJob.mutateAsync(job.id);
    } catch (error) {
      reportFailure(error, 'Could not delete the job.');
    } finally {
      markBusy(job.id, false);
    }
  }

  return (
    <div className="min-h-screen bg-canvas text-ink">
      <header className="border-b border-edge bg-surface">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 px-4 py-5">
          <div className="flex items-baseline gap-3">
            <h1 className="text-2xl font-bold tracking-tight">
              Conveyor
            </h1>
            <span className="hidden text-sm text-faint sm:inline">
              job queue control
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span className="flex items-center gap-2 text-[13px] text-faint">
              <span
                className={`h-1.5 w-1.5 rounded-full ${
                  loadError ? 'bg-rose-400' : 'bg-emerald-400'
                }`}
              />
              {loadError ? 'api unreachable' : 'api connected'}
            </span>

            <button
              type="button"
              onClick={() => {
                void jobsQuery.refetch();
                void statsQuery.refetch();
              }}
              disabled={isRefreshing}
              className={GHOST_STYLE}
            >
              {isRefreshing ? 'Syncing…' : 'Refresh'}
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-5xl space-y-4 px-4 py-8">
        <StatusCounts
          stats={statsQuery.data}
          isLoading={statsQuery.isLoading}
          active={filter}
          onSelect={setFilter}
        />

        {loadError && (
          <Notice
            tone="error"
            message={
              loadError instanceof ApiError
                ? loadError.message
                : 'Could not reach the API. Is the backend running?'
            }
          />
        )}

        {notice && (
          <Notice
            tone={notice.tone}
            message={notice.message}
            onDismiss={() => setNotice(undefined)}
          />
        )}

        <CreateJobForm
          onSubmit={handleCreate}
          isSubmitting={createJob.isPending}
        />

        <JobList
          jobs={jobsQuery.data}
          isLoading={jobsQuery.isLoading}
          busyIds={busyIds}
          filterLabel={filter}
          onChangeStatus={handleChangeStatus}
          onDelete={handleDelete}
        />
      </main>
    </div>
  );
}
