import { describe, expect, it } from 'bun:test';
import { JobStatus } from './job-status.enum';
import { ALLOWED_TRANSITIONS, statusesThatCanBecome } from './job-transitions';

describe('job transitions', () => {
  it('allows pending to running', () => {
    expect(ALLOWED_TRANSITIONS[JobStatus.PENDING]).toContain(JobStatus.RUNNING);
  });

  it('allows running to finish either way', () => {
    expect(ALLOWED_TRANSITIONS[JobStatus.RUNNING]).toEqual([
      JobStatus.COMPLETED,
      JobStatus.FAILED,
    ]);
  });

  it('treats completed and failed as terminal', () => {
    expect(ALLOWED_TRANSITIONS[JobStatus.COMPLETED]).toEqual([]);
    expect(ALLOWED_TRANSITIONS[JobStatus.FAILED]).toEqual([]);
  });

  it('does not allow a job to skip running', () => {
    expect(ALLOWED_TRANSITIONS[JobStatus.PENDING]).not.toContain(
      JobStatus.COMPLETED,
    );
    expect(ALLOWED_TRANSITIONS[JobStatus.PENDING]).not.toContain(
      JobStatus.FAILED,
    );
  });

  it('says only pending can become running', () => {
    expect(statusesThatCanBecome(JobStatus.RUNNING)).toEqual([
      JobStatus.PENDING,
    ]);
  });

  it('says nothing can become pending', () => {
    expect(statusesThatCanBecome(JobStatus.PENDING)).toEqual([]);
  });

  it('says only running can become completed or failed', () => {
    expect(statusesThatCanBecome(JobStatus.COMPLETED)).toEqual([
      JobStatus.RUNNING,
    ]);
    expect(statusesThatCanBecome(JobStatus.FAILED)).toEqual([
      JobStatus.RUNNING,
    ]);
  });
});
