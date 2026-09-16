import {
  useMutation,
  useQuery,
  useQueryClient,
  type QueryClient,
} from "@tanstack/react-query";
import {
  createJob,
  deleteJob,
  fetchJobs,
  fetchStats,
  updateJobStatus,
} from "../api/client";
import type { CreateJobInput, JobStatus } from "../types";

const JOBS_KEY = "jobs";
const STATS_KEY = "job-stats";

/** After any change the server is the truth, so refetch both lists. */
function refreshAll(queryClient: QueryClient) {
  return Promise.all([
    queryClient.invalidateQueries({ queryKey: [JOBS_KEY] }),
    queryClient.invalidateQueries({ queryKey: [STATS_KEY] }),
  ]);
}

export function useJobs(status?: JobStatus) {
  return useQuery({
    queryKey: [JOBS_KEY, status ?? "all"],
    queryFn: () => fetchJobs(status),
  });
}

export function useJobStats() {
  return useQuery({
    queryKey: [STATS_KEY],
    queryFn: fetchStats,
  });
}

export function useCreateJob() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateJobInput) => createJob(input),
    onSuccess: () => refreshAll(queryClient),
  });
}

export function useUpdateJobStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (input: { id: string; status: JobStatus; version?: number }) =>
      updateJobStatus(input.id, input.status, input.version),
    // Refetch on failure too: a 409 or 412 means this tab's data is stale.
    onSettled: () => refreshAll(queryClient),
  });
}

export function useDeleteJob() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => deleteJob(id),
    onSettled: () => refreshAll(queryClient),
  });
}
