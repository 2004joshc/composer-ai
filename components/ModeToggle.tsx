'use client';

import { AppMode } from '@/lib/types';

interface Props {
  mode: AppMode;
  onChange: (m: AppMode) => void;
}

export default function ModeToggle({ mode, onChange }: Props) {
  return (
    <div className="flex rounded-xl border border-warm-200 overflow-hidden bg-cream-100 p-1 gap-1">
      {(['simple', 'advanced'] as AppMode[]).map(m => (
        <button
          key={m}
          onClick={() => onChange(m)}
          className={`
            flex-1 py-2 text-sm font-medium rounded-lg transition-all duration-200
            ${mode === m
              ? 'bg-warm-600 text-cream-50 shadow-sm'
              : 'text-ink/60 hover:text-ink hover:bg-warm-100'}
          `}
        >
          {m === 'simple' ? 'Simple' : 'Advanced'}
        </button>
      ))}
    </div>
  );
}
