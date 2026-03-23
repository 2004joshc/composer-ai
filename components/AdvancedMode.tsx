'use client';

import { useState } from 'react';
import { MusicParams, Complexity } from '@/lib/types';
import SimpleMode from './SimpleMode';

const INSTRUMENT_OPTIONS = [
  'Piano', 'Grand Piano', 'Electric Piano',
  'Violin', 'Cello', 'Strings',
  'Guitar', 'Acoustic Guitar', 'Electric Bass',
  'Flute', 'Oboe', 'Clarinet',
  'Trumpet', 'Vibraphone',
  'Choir', 'Pad',
];

const COMPLEXITY_OPTS: { value: Complexity; label: string; desc: string }[] = [
  { value: 'simple',       label: 'Simple',       desc: 'Sparse, clear lines' },
  { value: 'intermediate', label: 'Intermediate', desc: 'Rich melodies & chords' },
  { value: 'advanced',     label: 'Advanced',     desc: 'Complex rhythms & voicings' },
];

interface Props {
  params: MusicParams;
  onChange: <K extends keyof MusicParams>(key: K, value: MusicParams[K]) => void;
}

export default function AdvancedMode({ params, onChange }: Props) {
  const [instrumentMode, setInstrumentMode] = useState<'ai' | 'custom'>(
    Array.isArray(params.instruments) ? 'custom' : 'ai',
  );

  const toggleInstrument = (name: string) => {
    const current = Array.isArray(params.instruments) ? params.instruments : [];
    const lc = name.toLowerCase();
    const next = current.includes(lc)
      ? current.filter(i => i !== lc)
      : [...current, lc];
    onChange('instruments', next.length === 0 ? 'ai' : next);
  };

  const selectedInstruments = Array.isArray(params.instruments) ? params.instruments : [];

  return (
    <div className="space-y-6">
      {/* Reuse simple mode fields */}
      <SimpleMode params={params} onChange={onChange} />

      {/* Divider */}
      <div className="border-t border-warm-100 pt-5 space-y-5">

        {/* Instruments */}
        <div>
          <label className="input-label">Instruments</label>
          <div className="flex rounded-lg border border-warm-200 overflow-hidden mb-3 text-sm">
            <button
              onClick={() => { setInstrumentMode('ai'); onChange('instruments', 'ai'); }}
              className={`flex-1 py-2 transition-colors ${
                instrumentMode === 'ai'
                  ? 'bg-warm-600 text-cream-50'
                  : 'text-ink/60 hover:bg-warm-50'
              }`}
            >
              Let AI Decide
            </button>
            <button
              onClick={() => { setInstrumentMode('custom'); if (params.instruments === 'ai') onChange('instruments', []); }}
              className={`flex-1 py-2 transition-colors ${
                instrumentMode === 'custom'
                  ? 'bg-warm-600 text-cream-50'
                  : 'text-ink/60 hover:bg-warm-50'
              }`}
            >
              Choose Manually
            </button>
          </div>

          {instrumentMode === 'custom' && (
            <div className="flex flex-wrap gap-2">
              {INSTRUMENT_OPTIONS.map(inst => {
                const lc = inst.toLowerCase();
                const sel = selectedInstruments.includes(lc);
                return (
                  <button
                    key={inst}
                    onClick={() => toggleInstrument(inst)}
                    className={`
                      px-3 py-1.5 rounded-lg text-sm border transition-all duration-150
                      ${sel
                        ? 'bg-warm-600 text-cream-50 border-warm-600'
                        : 'border-warm-200 text-ink/70 hover:border-warm-400 hover:text-ink'}
                    `}
                  >
                    {inst}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Tempo */}
        <div>
          <label className="input-label">
            Tempo
            {params.tempo
              ? <span className="font-normal text-ink/50 ml-1">— {params.tempo} BPM</span>
              : <span className="font-normal text-ink/40 ml-1">— AI decides</span>
            }
          </label>
          <div className="flex items-center gap-3">
            <input
              type="range"
              min={40} max={200} step={1}
              value={params.tempo ?? 100}
              onChange={e => onChange('tempo', parseInt(e.target.value))}
              className="flex-1 accent-warm-600"
            />
            <button
              onClick={() => onChange('tempo', undefined)}
              className="text-xs text-ink/40 hover:text-warm-600 transition-colors whitespace-nowrap"
            >
              Reset
            </button>
          </div>
          <div className="flex justify-between text-xs text-ink/30 mt-0.5">
            <span>40 Adagio</span><span>120 Allegro</span><span>200 Presto</span>
          </div>
        </div>

        {/* Complexity */}
        <div>
          <label className="input-label">Complexity</label>
          <div className="grid grid-cols-3 gap-2">
            {COMPLEXITY_OPTS.map(opt => (
              <button
                key={opt.value}
                onClick={() => onChange('complexity', opt.value)}
                className={`
                  flex flex-col items-center p-3 rounded-xl border text-center transition-all duration-150
                  ${params.complexity === opt.value
                    ? 'bg-warm-600 text-cream-50 border-warm-600'
                    : 'border-warm-200 hover:border-warm-400 text-ink/70 hover:text-ink'}
                `}
              >
                <span className="font-medium text-sm">{opt.label}</span>
                <span className="text-xs mt-0.5 opacity-70">{opt.desc}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Custom Prompt */}
        <div>
          <label className="input-label">Custom Description <span className="font-normal text-ink/30">(optional)</span></label>
          <textarea
            rows={3}
            className="input-field resize-none leading-relaxed"
            placeholder="E.g. 'Reminiscent of a rainy evening in Paris, featuring a solo piano with light reverb…'"
            value={params.customPrompt ?? ''}
            onChange={e => onChange('customPrompt', e.target.value)}
          />
        </div>
      </div>
    </div>
  );
}
