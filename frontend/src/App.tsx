import { useState } from 'react';
import { ApiError } from './api/api-error';
import { CreateJobForm } from './components/CreateJobForm';
import { FilterTabs } from './components/FilterTabs';
import { JobList } from './components/JobList';
import { Notice } from './components/Notice';
import { StatusCounts } from './components/StatusCounts';
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
          ? `${error.message} The list has been refreshed.`
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
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <header className="border-b border-slate-200 bg-white">
        <div className="mx-auto flex max-w-4xl flex-wrap items-center justify-between gap-2 px-4 py-4">
          <div>
            <h1 className="text-xl font-semibold tracking-tight">Conveyor</h1>
            <p className="text-sm text-slate-600">
              A queue of background jobs: create one, start it, and record
              whether it finished or failed.
            </p>
          </div>

          <button
            type="button"
            onClick={() => {
              void jobsQuery.refetch();
              void statsQuery.refetch();
            }}
            disabled={isRefreshing}
            className="rounded-lg border border-slate-300 px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
          >
            {isRefreshing ? 'Refreshing…' : 'Refresh'}
          </button>
        </div>
      </header>

      <main className="mx-auto max-w-4xl space-y-6 px-4 py-8">
        <StatusCounts stats={statsQuery.data} isLoading={statsQuery.isLoading} />

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

        <div className="flex flex-wrap items-center justify-between gap-3">
          <FilterTabs value={filter} onChange={setFilter} />

          <p className="text-xs text-slate-500">
            {jobsQuery.data?.length ?? 0} shown
          </p>
        </div>

        <JobList
          jobs={jobsQuery.data}
          isLoading={jobsQuery.isLoading}
          busyJobId={busyJobId}
          onChangeStatus={handleChangeStatus}
          onDelete={handleDelete}
        />
      </main>
    </div>
  );
}
