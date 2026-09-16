import { useState, type FormEvent } from 'react';
import type { CreateJobInput } from '../types';
import { PRIMARY_STYLE } from './status-styles';

interface Props {
  /** Resolves true when the job was created; false leaves the form filled in. */
  onSubmit: (input: CreateJobInput) => Promise<boolean>;
  isSubmitting: boolean;
}

export function CreateJobForm({ onSubmit, isSubmitting }: Props) {
  const [title, setTitle] = useState('');
  const [type, setType] = useState('');
  // Kept as a string so the field can be emptied while typing; "" would
  // otherwise become Number("") === 0 and snap back under the cursor.
  const [priority, setPriority] = useState('0');

  const priorityValue = priority === '' ? 0 : Number(priority);
  const priorityIsValid =
    Number.isInteger(priorityValue) && priorityValue >= 0 && priorityValue <= 10;

  const canSubmit =
    title.trim().length > 0 &&
    type.trim().length > 0 &&
    priorityIsValid &&
    !isSubmitting;

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();

    if (!canSubmit) {
      return;
    }

    // The server validates too; this only avoids an obviously doomed request.
    const created = await onSubmit({
      title: title.trim(),
      type: type.trim(),
      priority: priorityValue,
    });

    // Only clear on success: a rejected job would otherwise lose the typing.
    if (created) {
      setTitle('');
      setType('');
      setPriority('0');
    }
  }

  const field =
    'w-full rounded-lg border border-edge bg-canvas px-3 py-2.5 text-[15px] text-ink outline-none transition placeholder:text-faint focus:border-sky-500/70 focus:ring-2 focus:ring-sky-500/20';

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl border border-edge bg-surface"
    >
      <header className="flex items-center justify-between border-b border-edge px-5 py-3">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-muted">
          New job
        </h2>
        <span className="text-[13px] text-faint">
          {priorityIsValid ? 'starts as pending' : 'priority must be 0–10'}
        </span>
      </header>

      <div className="grid gap-3 px-5 py-4 sm:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_auto_auto] sm:items-center">
        <label className="block">
          <span className="sr-only">Title</span>
          <input
            id="job-title"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Send welcome email"
            maxLength={200}
            className={field}
          />
        </label>

        <label className="block">
          <span className="sr-only">Type</span>
          <input
            id="job-type"
            value={type}
            onChange={(event) => setType(event.target.value)}
            placeholder="email"
            maxLength={50}
            className={field}
          />
        </label>

        <label className="flex items-center gap-2 text-sm text-muted">
          <span className="whitespace-nowrap">Priority</span>
          <input
            id="job-priority"
            type="number"
            min={0}
            max={10}
            value={priority}
            onChange={(event) => setPriority(event.target.value)}
            aria-invalid={!priorityIsValid}
            className={`${field} w-20 tabular-nums ${
              priorityIsValid ? '' : 'border-rose-500/70'
            }`}
          />
        </label>

        <button type="submit" disabled={!canSubmit} className={PRIMARY_STYLE}>
          {isSubmitting ? 'Adding…' : 'Add job'}
        </button>
      </div>
    </form>
  );
}
