'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { GenerateResponse, PlaybackNote } from '@/lib/types';

interface Props {
  result: GenerateResponse;
  onRegenerate: () => void;
  onReset: () => void;
}

// GM instrument name → Tone.js synth config
function getSynthConfig(channel: number) {
  // Channel 0 = melody, 1 = chords, 2 = bass
  if (channel === 2) {
    // Bass: sine wave, lower octave
    return {
      oscillator: { type: 'triangle' as const },
      envelope: { attack: 0.02, decay: 0.3, sustain: 0.4, release: 0.8 },
    };
  }
  if (channel === 1) {
    // Chords: soft, slightly detuned
    return {
      oscillator: { type: 'sine' as const },
      envelope: { attack: 0.05, decay: 0.5, sustain: 0.6, release: 1.2 },
    };
  }
  // Melody: bright
  return {
    oscillator: { type: 'triangle' as const },
    envelope: { attack: 0.01, decay: 0.1, sustain: 0.7, release: 0.5 },
  };
}

function midiNoteToFreq(note: number): number {
  return 440 * Math.pow(2, (note - 69) / 12);
}

export default function ResultSection({ result, onRegenerate, onReset }: Props) {
  const { metadata, midiBase64, noteSchedule } = result;

  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);   // 0–1
  const [elapsed, setElapsed] = useState(0);

  // Web Audio context + scheduled nodes
  const audioCtxRef = useRef<AudioContext | null>(null);
  const scheduledNodesRef = useRef<AudioBufferSourceNode[]>([]);
  const oscillatorsRef = useRef<{ osc: OscillatorNode; gain: GainNode }[]>([]);
  const startTimeRef = useRef<number>(0);
  const durationRef = useRef<number>(metadata.durationSeconds);
  const rafRef = useRef<number>(0);

  // Clean up on unmount
  useEffect(() => () => { stopPlayback(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Update duration ref when metadata changes
  useEffect(() => { durationRef.current = metadata.durationSeconds; }, [metadata.durationSeconds]);

  // ── Playback via Web Audio API ────────────────────────────────────────────

  const stopPlayback = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    oscillatorsRef.current.forEach(({ osc, gain }) => {
      try { osc.stop(); } catch {}
      try { gain.disconnect(); } catch {}
    });
    oscillatorsRef.current = [];
    setIsPlaying(false);
  }, []);

  const startPlayback = useCallback(async () => {
    stopPlayback();

    // Resume or create AudioContext (browsers require user gesture)
    if (!audioCtxRef.current || audioCtxRef.current.state === 'closed') {
      audioCtxRef.current = new AudioContext();
    }
    const ctx = audioCtxRef.current;
    if (ctx.state === 'suspended') await ctx.resume();

    const now = ctx.currentTime;
    startTimeRef.current = now;
    setIsPlaying(true);
    setProgress(0);

    // Volume by channel
    const channelVolumes: Record<number, number> = { 0: 0.45, 1: 0.3, 2: 0.35 };

    // Schedule every note
    for (const note of noteSchedule) {
      const freq = midiNoteToFreq(note.note);
      const vol  = (note.velocity / 127) * (channelVolumes[note.channel] ?? 0.3);
      const start = now + note.time;
      const dur   = Math.max(0.05, note.duration);

      const osc  = ctx.createOscillator();
      const gain = ctx.createGain();

      // Waveform by channel
      osc.type = note.channel === 0 ? 'triangle' : note.channel === 1 ? 'sine' : 'sine';
      osc.frequency.setValueAtTime(freq, start);

      // Envelope
      gain.gain.setValueAtTime(0, start);
      gain.gain.linearRampToValueAtTime(vol, start + Math.min(0.02, dur * 0.1));
      gain.gain.setValueAtTime(vol, start + dur * 0.7);
      gain.gain.linearRampToValueAtTime(0, start + dur);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(start);
      osc.stop(start + dur + 0.05);

      oscillatorsRef.current.push({ osc, gain });
    }

    // Progress ticker — use a flag to avoid stale closure on isPlaying
    let active = true;
    const tick = () => {
      if (!active) return;
      const elapsed = ctx.currentTime - now;
      const dur = durationRef.current;
      const p = Math.min(1, elapsed / dur);
      setProgress(p);
      setElapsed(elapsed);
      if (p < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        active = false;
        setIsPlaying(false);
        setProgress(1);
      }
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => { active = false; };
  }, [noteSchedule, stopPlayback]);

  const handlePlayPause = useCallback(() => {
    if (isPlaying) {
      stopPlayback();
    } else {
      startPlayback();
    }
  }, [isPlaying, startPlayback, stopPlayback]);

  // ── MIDI Download ──────────────────────────────────────────────────────────

  const handleDownloadMidi = useCallback(() => {
    const bytes = atob(midiBase64);
    const arr = new Uint8Array(bytes.length);
    for (let i = 0; i < bytes.length; i++) arr[i] = bytes.charCodeAt(i);
    const blob = new Blob([arr], { type: 'audio/midi' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `composer-ai-${metadata.keyName}-${metadata.scaleName}.mid`;
    a.click();
    URL.revokeObjectURL(url);
  }, [midiBase64, metadata]);

  // ── Formatters ─────────────────────────────────────────────────────────────

  const fmtTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${sec.toString().padStart(2, '0')}`;
  };

  const playIcon = isPlaying
    ? (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
        <rect x="6" y="5" width="4" height="14" rx="1"/>
        <rect x="14" y="5" width="4" height="14" rx="1"/>
      </svg>
    ) : (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 ml-0.5">
        <path d="M8 5.14v14l11-7-11-7z"/>
      </svg>
    );

  return (
    <div className="card p-6 space-y-5 animate-slide-up">

      {/* Title row */}
      <div className="flex items-start justify-between">
        <div>
          <h2 className="font-serif text-xl text-ink">Your Composition</h2>
          <p className="text-sm text-ink/50 mt-0.5">
            {metadata.keyName} {metadata.scaleName} · {metadata.tempo} BPM · {metadata.timeSignature}
          </p>
        </div>
        <span className="text-xs bg-warm-100 text-warm-700 px-2 py-1 rounded-full border border-warm-200">
          {fmtTime(metadata.durationSeconds)}
        </span>
      </div>

      {/* Chord progression chips */}
      <div>
        <p className="text-xs text-ink/40 uppercase tracking-widest mb-1.5 font-medium">Chord Progression</p>
        <div className="flex flex-wrap gap-2">
          {metadata.chordProgression.map((chord, i) => (
            <span key={i} className="px-2.5 py-1 rounded-lg bg-warm-100 text-warm-800 text-sm font-medium border border-warm-200">
              {chord}
            </span>
          ))}
        </div>
      </div>

      {/* Instruments */}
      <div>
        <p className="text-xs text-ink/40 uppercase tracking-widest mb-1.5 font-medium">Instruments</p>
        <div className="flex flex-wrap gap-2">
          {metadata.instruments.map((inst, i) => (
            <span key={i} className="px-2.5 py-1 rounded-lg bg-cream-200 text-ink/70 text-sm border border-warm-100">
              {inst}
            </span>
          ))}
        </div>
      </div>

      {/* Player */}
      <div className="bg-warm-50 rounded-xl border border-warm-100 p-4 space-y-3">
        {/* Progress bar */}
        <div className="relative h-1.5 bg-warm-100 rounded-full overflow-hidden">
          <div
            className="absolute inset-y-0 left-0 bg-warm-500 rounded-full progress-fill"
            style={{ width: `${progress * 100}%` }}
          />
        </div>

        {/* Time */}
        <div className="flex justify-between text-xs text-ink/40">
          <span>{fmtTime(elapsed)}</span>
          <span>{fmtTime(metadata.durationSeconds)}</span>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={handlePlayPause}
            className="
              w-11 h-11 rounded-full bg-warm-600 hover:bg-warm-700 active:bg-warm-800
              text-cream-50 flex items-center justify-center
              transition-all duration-150 shadow-sm hover:shadow-md
            "
            aria-label={isPlaying ? 'Pause' : 'Play'}
          >
            {playIcon}
          </button>
        </div>

        <p className="text-xs text-center text-ink/30">
          {isPlaying ? 'Playing via Web Audio…' : 'Click play to preview'}
        </p>
      </div>

      {/* Download + actions */}
      <div className="flex flex-col sm:flex-row gap-2.5">
        <button
          onClick={handleDownloadMidi}
          className="btn-primary flex-1"
        >
          <svg viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
            <path d="M10 2a1 1 0 011 1v9.586l2.293-2.293a1 1 0 011.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L9 12.586V3a1 1 0 011-1z"/>
            <path d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"/>
          </svg>
          Download MIDI
        </button>
        <button
          onClick={onRegenerate}
          className="btn-secondary"
          title="Generate a variation with the same parameters"
        >
          ↺ Variation
        </button>
        <button
          onClick={onReset}
          className="btn-secondary"
        >
          New
        </button>
      </div>

      {/* Measures info */}
      <p className="text-xs text-ink/30 text-center">
        {metadata.measures} measures · Valid MIDI Type 1 file
      </p>
    </div>
  );
}
