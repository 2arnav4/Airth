import { JobStatus } from './job-status.enum';

export const ALLOWED_TRANSITIONS: Record<JobStatus, JobStatus[]> = {
  [JobStatus.PENDING]: [JobStatus.RUNNING],
  [JobStatus.RUNNING]: [JobStatus.COMPLETED, JobStatus.FAILED],
  [JobStatus.COMPLETED]: [],
  [JobStatus.FAILED]: [],
};

export function statusesThatCanBecome(target: JobStatus): JobStatus[] {
  return (Object.keys(ALLOWED_TRANSITIONS) as JobStatus[]).filter((from) =>
    ALLOWED_TRANSITIONS[from].includes(target),
  );
}
