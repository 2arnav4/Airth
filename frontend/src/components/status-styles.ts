import type { JobStatus } from '../types';

/** Status colours are semantic (state of work), not branding. */
export const STATUS_STYLES: Record<
  JobStatus,
  { text: string; dot: string; chip: string }
> = {
  pending: {
    text: 'text-muted',
    dot: 'bg-slate-400',
    chip: 'border-edge bg-raised text-muted',
  },
  running: {
    text: 'text-sky-300',
    dot: 'bg-sky-400',
    chip: 'border-sky-500/40 bg-sky-500/15 text-sky-300',
  },
  completed: {
    text: 'text-emerald-300',
    dot: 'bg-emerald-400',
    chip: 'border-emerald-500/40 bg-emerald-500/15 text-emerald-300',
  },
  failed: {
    text: 'text-rose-300',
    dot: 'bg-rose-400',
    chip: 'border-rose-500/40 bg-rose-500/15 text-rose-300',
  },
};

/**
 * Solid buttons with a hard bottom edge, so they read as physical keys:
 * pressing one drops it onto its own shadow.
 */
const PRESSABLE =
  'rounded-lg px-4 py-2 text-sm font-semibold text-white transition-transform active:translate-y-[3px] active:shadow-none disabled:cursor-not-allowed disabled:opacity-40 disabled:active:translate-y-0';

/** Colour for the button that moves a job INTO this status. */
export const ACTION_STYLES: Record<JobStatus, string> = {
  pending: `${PRESSABLE} bg-slate-600 shadow-[0_3px_0_0_#334155] hover:bg-slate-500`,
  running: `${PRESSABLE} bg-sky-600 shadow-[0_3px_0_0_#075985] hover:bg-sky-500`,
  completed: `${PRESSABLE} bg-emerald-600 shadow-[0_3px_0_0_#065f46] hover:bg-emerald-500`,
  failed: `${PRESSABLE} bg-rose-600 shadow-[0_3px_0_0_#881337] hover:bg-rose-500`,
};

export const DELETE_STYLE = `${PRESSABLE} bg-raised text-muted shadow-[0_3px_0_0_#11151c] hover:bg-rose-600 hover:text-white`;

export const PRIMARY_STYLE = `${PRESSABLE} bg-sky-600 shadow-[0_3px_0_0_#075985] hover:bg-sky-500 disabled:bg-raised disabled:text-faint disabled:shadow-[0_3px_0_0_#11151c]`;

export const GHOST_STYLE =
  'rounded-lg border border-edge bg-raised px-4 py-2 text-sm font-medium text-muted shadow-[0_3px_0_0_#11151c] transition-transform hover:text-ink active:translate-y-[3px] active:shadow-none disabled:opacity-40';

export const ACTION_LABELS: Record<JobStatus, string> = {
  pending: 'Reset',
  running: 'Start',
  completed: 'Complete',
  failed: 'Fail',
};

/** "3m ago" for recent jobs, falling back to a date for old ones. */
export function relativeTime(iso: string): string {
  const seconds = Math.round((Date.now() - new Date(iso).getTime()) / 1000);

  if (seconds < 60) return 'just now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;

  return new Date(iso).toLocaleDateString();
}
