interface Props {
  tone: 'error' | 'warning';
  message: string;
  onDismiss?: () => void;
}

const TONES = {
  error: 'border-rose-500/40 bg-rose-500/10 text-rose-200',
  warning: 'border-signal/40 bg-signal/10 text-signal',
} as const;

const LABELS = {
  error: 'Error',
  warning: 'Conflict',
} as const;

export function Notice({ tone, message, onDismiss }: Props) {
  return (
    <div
      role="alert"
      className={`flex items-start justify-between gap-4 rounded-xl border px-5 py-4 text-[15px] ${TONES[tone]}`}
    >
      <p className="flex flex-wrap items-baseline gap-2">
        <span className="text-xs font-bold uppercase tracking-wider opacity-80">
          {LABELS[tone]}
        </span>
        <span>{message}</span>
      </p>

      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          className="shrink-0 text-sm font-medium underline underline-offset-4 opacity-80 hover:opacity-100"
        >
          Dismiss
        </button>
      )}
    </div>
  );
}
