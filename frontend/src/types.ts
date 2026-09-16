export const JOB_STATUSES = [
  'pending',
  'running',
  'completed',
  'failed',
] as const;

export type JobStatus = (typeof JOB_STATUSES)[number];

export interface Job {
  id: string;
  title: string;
  type: string;
  priority: number;
  status: JobStatus;
  version: number;
  createdAt: string;
}

export type JobStats = Record<JobStatus, number>;

export interface CreateJobInput {
  title: string;
  type: string;
  priority?: number;
}

/** Which statuses a job may move to next. Mirrors the backend's rules. */
export const NEXT_STATUSES: Record<JobStatus, JobStatus[]> = {
  pending: ['running'],
  running: ['completed', 'failed'],
  completed: [],
  failed: [],
};
