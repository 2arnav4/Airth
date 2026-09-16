import { useState, type FormEvent } from 'react';
import type { CreateJobInput } from '../types';

interface Props {
  onSubmit: (input: CreateJobInput) => Promise<unknown>;
  isSubmitting: boolean;
}

export function CreateJobForm({ onSubmit, isSubmitting }: Props) {
  const [title, setTitle] = useState('');
  const [type, setType] = useState('');
  const [priority, setPriority] = useState(0);

  const canSubmit =
    title.trim().length > 0 && type.trim().length > 0 && !isSubmitting;

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();

    if (!canSubmit) {
      return;
    }

    // The server validates too; this only avoids an obviously doomed request.
    await onSubmit({ title: title.trim(), type: type.trim(), priority });

    setTitle('');
    setType('');
    setPriority(0);
  }

  const field =
    'w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-slate-900 focus:ring-2 focus:ring-slate-900/10';

  return (
    <form
      onSubmit={handleSubmit}
      className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
    >
      <div className="flex items-baseline justify-between">
        <h2 className="text-sm font-semibold text-slate-900">New job</h2>
        <p className="text-xs text-slate-500">Every job starts as pending</p>
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-[minmax(0,2fr)_minmax(0,1fr)_auto_auto]">
        <label className="block">
          <span className="sr-only">Title</span>
          <input
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
            value={type}
            onChange={(event) => setType(event.target.value)}
            placeholder="email"
            maxLength={50}
            className={field}
          />
        </label>

        <label className="flex items-center gap-2 text-sm text-slate-600">
          <span className="whitespace-nowrap">Priority</span>
          <input
            type="number"
            min={0}
            max={10}
            value={priority}
            onChange={(event) => setPriority(Number(event.target.value))}
            className={`${field} w-20`}
          />
        </label>

        <button
          type="submit"
          disabled={!canSubmit}
          className="rounded-lg bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700 disabled:cursor-not-allowed disabled:bg-slate-200 disabled:text-slate-400"
        >
          {isSubmitting ? 'Creating…' : 'Create job'}
        </button>
      </div>
    </form>
  );
}
