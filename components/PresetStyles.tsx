'use client';

import { MusicParams } from '@/lib/types';

interface Preset {
  id: string;
  icon: string;
  label: string;
  params: Partial<MusicParams>;
}

const PRESETS: Preset[] = [
  {
    id: 'lofi',
    icon: '☕',
    label: 'Lo-fi',
    params: { genre: 'lofi', mood: 'relaxed', lengthMin: 2, lengthMax: 4, complexity: 'simple', instruments: 'ai' },
  },
  {
    id: 'jazz',
    icon: '🎷',
    label: 'Jazz',
    params: { genre: 'jazz', mood: 'calm', lengthMin: 2, lengthMax: 4, complexity: 'intermediate', instruments: 'ai' },
  },
  {
    id: 'cinematic',
    icon: '🎬',
    label: 'Cinematic',
    params: { genre: 'cinematic', mood: 'epic', lengthMin: 3, lengthMax: 5, complexity: 'advanced', instruments: 'ai' },
  },
  {
    id: 'classical',
    icon: '🎻',
    label: 'Classical',
    params: { genre: 'classical', mood: 'romantic', lengthMin: 2, lengthMax: 4, complexity: 'intermediate', instruments: 'ai' },
  },
  {
    id: 'blues',
    icon: '🎸',
    label: 'Blues',
    params: { genre: 'blues', mood: 'melancholic', lengthMin: 2, lengthMax: 3, complexity: 'intermediate', instruments: 'ai' },
  },
];

interface Props {
  onSelect: (params: Partial<MusicParams>) => void;
}

export default function PresetStyles({ onSelect }: Props) {
  return (
    <div>
      <p className="text-xs text-ink/40 uppercase tracking-widest mb-2.5 font-medium">Quick Presets</p>
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {PRESETS.map(preset => (
          <button
            key={preset.id}
            onClick={() => onSelect(preset.params)}
            className="
              flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-xl
              border border-warm-200 bg-cream-50 hover:bg-cream-100
              hover:border-warm-400 text-ink/70 hover:text-ink
              transition-all duration-150 text-sm font-medium whitespace-nowrap
            "
          >
            <span className="text-base leading-none">{preset.icon}</span>
            <span>{preset.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
