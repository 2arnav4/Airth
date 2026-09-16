import { ApiError, readErrorMessage } from "./api-error";
import type { CreateJobInput, Job, JobStats, JobStatus } from "../types";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3000";

/** One place where every response is checked, so callers only handle data. */
async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;

  try {
    response = await fetch(`${API_URL}${path}`, {
      headers: { "Content-Type": "application/json", ...init?.headers },
      ...init,
    });
  } catch {
    // fetch only rejects when the network itself failed.
    throw new ApiError(0, "Could not reach the API.");
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const body: unknown = await response.json().catch(() => null);

  if (!response.ok) {
    throw new ApiError(
      response.status,
      readErrorMessage(body, `Request failed with status ${response.status}`),
    );
  }

  return body as T;
}

export function fetchJobs(status?: JobStatus): Promise<Job[]> {
  return request<Job[]>(status ? `/jobs?status=${status}` : "/jobs");
}

export function fetchStats(): Promise<JobStats> {
  return request<JobStats>("/jobs/stats");
}

export function createJob(input: CreateJobInput): Promise<Job> {
  return request<Job>("/jobs", {
    method: "POST",
    body: JSON.stringify(input),
  });
}

export function updateJobStatus(
  id: string,
  status: JobStatus,
  version?: number,
): Promise<Job> {
  return request<Job>(`/jobs/${id}/status`, {
    method: "PATCH",
    // If-Match carries the version this tab last saw, so a stale tab gets 412.
    headers: version === undefined ? {} : { "If-Match": String(version) },
    body: JSON.stringify({ status }),
  });
}

export function deleteJob(id: string): Promise<void> {
  return request<void>(`/jobs/${id}`, { method: "DELETE" });
}
