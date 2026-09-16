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
  const [notice, setNotice] = useState<string | undefined>();

  const jobsQuery = useJobs(filter === 'all' ? undefined : filter);
  const statsQuery = useJobStats();

  const createJob = useCreateJob();
  const updateStatus = useUpdateJobStatus();
  const deleteJob = useDeleteJob();

  const loadError = jobsQuery.error ?? statsQuery.error;
  const isRefreshing = jobsQuery.isFetching || statsQuery.isFetching;

  /** Conflicts are expected, not crashes: explain, and let the refetch show the truth. */
  function reportFailure(error: unknown, fallback: string) {
    if (error instanceof ApiError) {
      setNotice(
        error.isConflict
          ? `${error.message} The queue has been refreshed.`
          : error.message,
      );
      return;
    }

    setNotice(fallback);
  }

  async function handleCreate(input: CreateJobInput) {
    setNotice(undefined);

    try {
      await createJob.mutateAsync(input);
    } catch (error) {
      reportFailure(error, 'Could not create the job.');
    }
  }

  async function handleChangeStatus(job: Job, next: JobStatus) {
    setNotice(undefined);

    try {
      await updateStatus.mutateAsync({
        id: job.id,
        status: next,
        version: job.version,
      });
    } catch (error) {
      reportFailure(error, 'Could not update the job.');
    }
  }

  async function handleDelete(job: Job) {
    setNotice(undefined);

    try {
      await deleteJob.mutateAsync(job.id);
    } catch (error) {
      reportFailure(error, 'Could not delete the job.');
    }
  }

  const busyJobId = updateStatus.isPending
    ? updateStatus.variables?.id
    : deleteJob.isPending
      ? deleteJob.variables
      : undefined;

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
            tone="warning"
            message={notice}
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
          busyJobId={busyJobId}
          filterLabel={filter}
          onChangeStatus={handleChangeStatus}
          onDelete={handleDelete}
        />
      </main>
    </div>
  );
}
