import type { JobStatus } from '../types';

export const STATUS_STYLES: Record<
  JobStatus,
  { badge: string; dot: string; bar: string; tile: string }
> = {
  pending: {
    badge: 'bg-slate-100 text-slate-700 ring-slate-200',
    dot: 'bg-slate-400',
    bar: 'bg-slate-400',
    tile: 'border-l-slate-300',
  },
  running: {
    badge: 'bg-blue-50 text-blue-700 ring-blue-200',
    dot: 'bg-blue-500',
    bar: 'bg-blue-500',
    tile: 'border-l-blue-500',
  },
  completed: {
    badge: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
    dot: 'bg-emerald-500',
    bar: 'bg-emerald-500',
    tile: 'border-l-emerald-500',
  },
  failed: {
    badge: 'bg-rose-50 text-rose-700 ring-rose-200',
    dot: 'bg-rose-500',
    bar: 'bg-rose-500',
    tile: 'border-l-rose-500',
  },
};

/** Colour for the button that moves a job INTO this status. */
export const ACTION_STYLES: Record<JobStatus, string> = {
  pending: 'border-slate-300 text-slate-700 hover:bg-slate-50',
  running: 'border-blue-300 text-blue-700 hover:bg-blue-50',
  completed: 'border-emerald-300 text-emerald-700 hover:bg-emerald-50',
  failed: 'border-rose-300 text-rose-700 hover:bg-rose-50',
};

export const ACTION_LABELS: Record<JobStatus, string> = {
  pending: 'Reset',
  running: 'Start',
  completed: 'Complete',
  failed: 'Mark failed',
};

/** "3 minutes ago" for recent jobs, falling back to a date for old ones. */
export function relativeTime(iso: string): string {
  const then = new Date(iso).getTime();
  const seconds = Math.round((Date.now() - then) / 1000);

  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;

  return new Date(iso).toLocaleDateString();
}
