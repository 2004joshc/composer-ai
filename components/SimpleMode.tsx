'use client';

import { MusicParams } from '@/lib/types';

const GENRES = ['Jazz', 'Classical', 'Lo-fi', 'Cinematic', 'Blues', 'Ambient', 'Piano'];
const MOODS  = ['Peaceful', 'Melancholic', 'Happy', 'Mysterious', 'Romantic', 'Energetic', 'Calm', 'Dark'];

interface Props {
  params: MusicParams;
  onChange: <K extends keyof MusicParams>(key: K, value: MusicParams[K]) => void;
}

export default function SimpleMode({ params, onChange }: Props) {
  return (
    <div className="space-y-5">

      {/* Genre */}
      <div>
        <label className="input-label">Genre</label>
        <div className="flex flex-wrap gap-2 mb-2">
          {GENRES.map(g => (
            <button
              key={g}
              onClick={() => onChange('genre', params.genre === g.toLowerCase() ? '' : g.toLowerCase())}
              className={`
                px-3 py-1.5 rounded-lg text-sm border transition-all duration-150
                ${params.genre === g.toLowerCase()
                  ? 'bg-warm-600 text-cream-50 border-warm-600'
                  : 'border-warm-200 text-ink/70 hover:border-warm-400 hover:text-ink'}
              `}
            >
              {g}
            </button>
          ))}
        </div>
        <input
          type="text"
          className="input-field"
          placeholder="Or type a genre…"
          value={params.genre}
          onChange={e => onChange('genre', e.target.value)}
        />
      </div>

      {/* Mood */}
      <div>
        <label className="input-label">Mood</label>
        <div className="flex flex-wrap gap-2 mb-2">
          {MOODS.map(m => (
            <button
              key={m}
              onClick={() => onChange('mood', params.mood === m.toLowerCase() ? '' : m.toLowerCase())}
              className={`
                px-3 py-1.5 rounded-lg text-sm border transition-all duration-150
                ${params.mood === m.toLowerCase()
                  ? 'bg-warm-600 text-cream-50 border-warm-600'
                  : 'border-warm-200 text-ink/70 hover:border-warm-400 hover:text-ink'}
              `}
            >
              {m}
            </button>
          ))}
        </div>
        <input
          type="text"
          className="input-field"
          placeholder="Or describe the mood…"
          value={params.mood}
          onChange={e => onChange('mood', e.target.value)}
        />
      </div>

      {/* Length */}
      <div>
        <label className="input-label">
          Length — <span className="font-normal text-ink/50">{params.lengthMin}–{params.lengthMax} minutes</span>
        </label>
        <div className="flex items-center gap-3">
          <input
            type="range"
            min={0.5} max={8} step={0.5}
            value={params.lengthMin}
            onChange={e => {
              const v = parseFloat(e.target.value);
              onChange('lengthMin', v);
              if (v > params.lengthMax) onChange('lengthMax', v + 0.5);
            }}
            className="flex-1 accent-warm-600"
          />
          <span className="text-sm text-ink/50 w-20 text-right">
            {params.lengthMin}–{params.lengthMax} min
          </span>
        </div>
        {/* Range max slider */}
        <input
          type="range"
          min={params.lengthMin} max={10} step={0.5}
          value={params.lengthMax}
          onChange={e => onChange('lengthMax', parseFloat(e.target.value))}
          className="w-full accent-warm-400 mt-1"
        />
        <div className="flex justify-between text-xs text-ink/30 mt-0.5">
          <span>min {params.lengthMin}</span>
          <span>max {params.lengthMax}</span>
        </div>
      </div>
    </div>
  );
}
