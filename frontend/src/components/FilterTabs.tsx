import { JOB_STATUSES, type JobStatus } from '../types';

interface Props {
  value: JobStatus | 'all';
  onChange: (value: JobStatus | 'all') => void;
}

const OPTIONS: (JobStatus | 'all')[] = ['all', ...JOB_STATUSES];

export function FilterTabs({ value, onChange }: Props) {
  return (
    <div className="flex flex-wrap gap-2" role="tablist" aria-label="Filter jobs by status">
      {OPTIONS.map((option) => {
        const isActive = option === value;

        return (
          <button
            key={option}
            type="button"
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(option)}
            className={`rounded-full px-3 py-1.5 text-sm font-medium capitalize transition ${
              isActive
                ? 'bg-slate-900 text-white'
                : 'bg-white text-slate-600 ring-1 ring-slate-200 hover:bg-slate-50'
            }`}
          >
            {option}
          </button>
        );
      })}
    </div>
  );
}
