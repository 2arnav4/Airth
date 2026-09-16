/**
 * A failed API call, carrying the status code so the UI can react to a
 * conflict (409) or a stale version (412) differently from a real error.
 */
export class ApiError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }

  /** Someone else changed this job first. */
  get isConflict(): boolean {
    return this.status === 409 || this.status === 412;
  }
}

/** The backend's error shape, from HttpExceptionFilter. */
interface ApiErrorBody {
  message?: string | string[];
}

/** Turns the backend's error body into one readable sentence. */
export function readErrorMessage(body: unknown, fallback: string): string {
  const message = (body as ApiErrorBody | null)?.message;

  if (Array.isArray(message)) {
    return message.join(', ');
  }

  return typeof message === 'string' && message.length > 0 ? message : fallback;
}
