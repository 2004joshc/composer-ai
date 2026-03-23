'use client';

import { useState, useCallback } from 'react';
import { MusicParams, GenerateResponse, AppMode } from '@/lib/types';
import ModeToggle from './ModeToggle';
import SimpleMode from './SimpleMode';
import AdvancedMode from './AdvancedMode';
import PresetStyles from './PresetStyles';
import LoadingAnimation from './LoadingAnimation';
import ResultSection from './ResultSection';

// ─── Default state ─────────────────────────────────────────────────────────────

const defaultParams: MusicParams = {
  genre: '',
  mood: '',
  lengthMin: 2,
  lengthMax: 3,
  instruments: 'ai',
  tempo: undefined,
  complexity: 'intermediate',
  customPrompt: '',
  mode: 'simple',
};

// ─── Component ─────────────────────────────────────────────────────────────────

export default function ComposerApp() {
  const [mode, setMode] = useState<AppMode>('simple');
  const [params, setParams] = useState<MusicParams>(defaultParams);
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<GenerateResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  // ── Param updates ─────────────────────────────────────────────────────────

  const updateParam = useCallback(<K extends keyof MusicParams>(key: K, value: MusicParams[K]) => {
    setParams(prev => ({ ...prev, [key]: value }));
  }, []);

  const applyPreset = useCallback((preset: Partial<MusicParams>) => {
    setParams(prev => ({ ...prev, ...preset }));
  }, []);

  // ── Generation ────────────────────────────────────────────────────────────

  const handleGenerate = useCallback(async () => {
    const genre = params.genre.trim() || 'classical';
    const mood  = params.mood.trim()  || 'peaceful';

    setIsGenerating(true);
    setResult(null);
    setError(null);

    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...params, genre, mood, mode }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? 'Generation failed');
      }

      const data: GenerateResponse = await res.json();
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setIsGenerating(false);
    }
  }, [params, mode]);

  // ── Surprise Me ────────────────────────────────────────────────────────────

  const handleSurpriseMe = useCallback(() => {
    const genres  = ['jazz', 'classical', 'lofi', 'cinematic', 'blues', 'ambient', 'piano'];
    const moods   = ['peaceful', 'melancholic', 'romantic', 'mysterious', 'uplifting', 'calm', 'dark'];
    const lengths: [number, number][] = [[1.5, 2.5], [2, 3], [3, 4], [4, 5]];
    const r = (arr: unknown[]) => arr[Math.floor(Math.random() * arr.length)];

    const [lMin, lMax] = r(lengths) as [number, number];
    const newParams = {
      ...params,
      genre: r(genres) as string,
      mood:  r(moods)  as string,
      lengthMin: lMin,
      lengthMax: lMax,
      instruments: 'ai' as const,
      complexity: r(['simple', 'intermediate', 'advanced']) as MusicParams['complexity'],
    };
    setParams(newParams);

    // Auto-generate after a short delay
    setTimeout(() => {
      setIsGenerating(true);
      setResult(null);
      setError(null);
      fetch('/api/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...newParams, mode }),
      })
        .then(r => r.json())
        .then(data => setResult(data))
        .catch(err => setError(err.message))
        .finally(() => setIsGenerating(false));
    }, 300);
  }, [params, mode]);

  // ── Reset ──────────────────────────────────────────────────────────────────

  const handleReset = useCallback(() => {
    setResult(null);
    setError(null);
  }, []);

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F9F3E6' }}>
      {/* ── Header ── */}
      <header className="pt-10 pb-6 text-center px-4">
        <div className="inline-flex items-center gap-2 mb-3">
          {/* Music staff logo mark */}
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none" aria-hidden>
            <rect x="4"  y="7"  width="20" height="1.5" rx="0.75" fill="#8B6340"/>
            <rect x="4"  y="11" width="20" height="1.5" rx="0.75" fill="#8B6340"/>
            <rect x="4"  y="15" width="20" height="1.5" rx="0.75" fill="#8B6340"/>
            <rect x="4"  y="19" width="20" height="1.5" rx="0.75" fill="#8B6340"/>
            <circle cx="11" cy="18" r="2.5" fill="#8B6340"/>
            <rect x="13.2" y="10" width="1.5" height="8" rx="0.75" fill="#8B6340"/>
            <circle cx="18" cy="14" r="2.5" fill="#A67C52"/>
            <rect x="20.2" y="6"  width="1.5" height="8" rx="0.75" fill="#A67C52"/>
          </svg>
          <h1 className="text-3xl font-serif text-ink tracking-tight">Composer AI</h1>
        </div>
        <p className="text-ink/50 text-sm max-w-sm mx-auto leading-relaxed">
          Describe your music — AI composes, produces, and delivers a MIDI piece.
        </p>
      </header>

      {/* ── Main content ── */}
      <main className="max-w-2xl mx-auto px-4 pb-20 space-y-6">

        {/* Preset styles */}
        <PresetStyles onSelect={applyPreset} />

        {/* Mode toggle */}
        <ModeToggle mode={mode} onChange={m => { setMode(m); updateParam('mode', m); }} />

        {/* Input panel */}
        <div className="card p-6 animate-fade-in">
          {mode === 'simple'
            ? <SimpleMode params={params} onChange={updateParam} />
            : <AdvancedMode params={params} onChange={updateParam} />
          }
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl px-4 py-3 text-sm animate-fade-in">
            {error}
          </div>
        )}

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row gap-3">
          <button
            className="btn-primary flex-1 text-base py-3.5"
            onClick={handleGenerate}
            disabled={isGenerating}
          >
            {isGenerating ? 'Composing…' : 'Generate'}
          </button>
          <button
            className="btn-secondary px-5 py-3.5"
            onClick={handleSurpriseMe}
            disabled={isGenerating}
            title="Pick random parameters and generate"
          >
            ✦ Surprise Me
          </button>
        </div>

        {/* Loading */}
        {isGenerating && <LoadingAnimation />}

        {/* Result */}
        {result && !isGenerating && (
          <ResultSection result={result} onRegenerate={handleGenerate} onReset={handleReset} />
        )}
      </main>

      {/* Footer */}
      <footer className="text-center py-8 text-ink/30 text-xs">
        Composer AI · MIDI generation · {new Date().getFullYear()}
      </footer>
    </div>
  );
}
