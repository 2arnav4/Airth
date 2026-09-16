interface Props {
  tone: 'error' | 'warning';
  message: string;
  onDismiss?: () => void;
}

const TONES = {
  error: 'border-rose-200 bg-rose-50 text-rose-800',
  warning: 'border-amber-200 bg-amber-50 text-amber-900',
} as const;

export function Notice({ tone, message, onDismiss }: Props) {
  return (
    <div
      role="alert"
      className={`flex items-start justify-between gap-4 rounded-lg border px-4 py-3 text-sm ${TONES[tone]}`}
    >
      <p>{message}</p>

      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          className="shrink-0 text-xs font-medium underline underline-offset-2"
        >
          Dismiss
        </button>
      )}
    </div>
  );
}
