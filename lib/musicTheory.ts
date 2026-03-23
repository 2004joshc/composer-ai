/**
 * Music theory constants and helpers.
 * All intervals are semitone offsets from the root (0 = unison, 12 = octave up).
 */

import { ChordType } from './types';

// ─── Scales ───────────────────────────────────────────────────────────────────

export const SCALES: Record<string, number[]> = {
  major:           [0, 2, 4, 5, 7, 9, 11],
  minor:           [0, 2, 3, 5, 7, 8, 10],
  dorian:          [0, 2, 3, 5, 7, 9, 10],
  mixolydian:      [0, 2, 4, 5, 7, 9, 10],
  pentatonicMajor: [0, 2, 4, 7, 9],
  pentatonicMinor: [0, 3, 5, 7, 10],
  blues:           [0, 3, 5, 6, 7, 10],
  harmonicMinor:   [0, 2, 3, 5, 7, 8, 11],
};

// ─── Chord Intervals ──────────────────────────────────────────────────────────

export const CHORD_INTERVALS: Record<ChordType, number[]> = {
  maj:  [0, 4, 7],
  min:  [0, 3, 7],
  maj7: [0, 4, 7, 11],
  min7: [0, 3, 7, 10],
  dom7: [0, 4, 7, 10],
  dim:  [0, 3, 6],
  aug:  [0, 4, 8],
  sus4: [0, 5, 7],
};

// ─── Note Names ───────────────────────────────────────────────────────────────

export const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];

export function midiNoteToName(midi: number): string {
  const octave = Math.floor(midi / 12) - 1;
  const name = NOTE_NAMES[midi % 12];
  return `${name}${octave}`;
}

// ─── Genre → Musical DNA ──────────────────────────────────────────────────────

interface GenreProfile {
  scales: string[];          // preferred scale names (first = default)
  chordProgressions: Array<Array<[number, ChordType]>>; // scale-degree index + chord type
  tempoRange: [number, number];
  defaultKey: number;        // MIDI root (usually C = 0)
  melodyStyle: 'smooth' | 'jazz' | 'pentatonic' | 'arpeggiated';
  bassStyle: 'roots' | 'walking' | 'pumping' | 'simple';
  chordStyle: 'block' | 'arpeggio' | 'comping' | 'sustained';
}

// Chord progressions use scale-degree indices (0-based) + chord type
// Index 0 = I, 1 = II, 2 = III, 3 = IV, 4 = V, 5 = VI, 6 = VII
export const GENRE_PROFILES: Record<string, GenreProfile> = {
  jazz: {
    scales: ['dorian', 'mixolydian', 'minor'],
    chordProgressions: [
      [[1, 'min7'], [4, 'dom7'], [0, 'maj7'], [0, 'maj7']],  // ii-V-I
      [[0, 'maj7'], [5, 'min7'], [3, 'maj7'], [4, 'dom7']],  // I-vi-IV-V
      [[1, 'min7'], [4, 'dom7'], [0, 'maj7'], [5, 'min7']],  // ii-V-I-vi
    ],
    tempoRange: [90, 160],
    defaultKey: 0,
    melodyStyle: 'jazz',
    bassStyle: 'walking',
    chordStyle: 'comping',
  },
  classical: {
    scales: ['major', 'minor', 'harmonicMinor'],
    chordProgressions: [
      [[0, 'maj'], [3, 'maj'], [4, 'maj'], [0, 'maj']],       // I-IV-V-I
      [[0, 'maj'], [5, 'min'], [3, 'maj'], [4, 'maj']],       // I-vi-IV-V
      [[0, 'min'], [5, 'maj'], [3, 'min'], [4, 'maj']],       // i-VI-iv-V
    ],
    tempoRange: [60, 120],
    defaultKey: 0,
    melodyStyle: 'smooth',
    bassStyle: 'roots',
    chordStyle: 'block',
  },
  lofi: {
    scales: ['pentatonicMinor', 'minor', 'dorian'],
    chordProgressions: [
      [[0, 'maj7'], [2, 'min7'], [5, 'min7'], [3, 'maj7']],   // Imaj7-IIIm7-VIm7-IVmaj7
      [[0, 'min7'], [5, 'maj7'], [3, 'min7'], [4, 'min7']],
      [[0, 'maj7'], [4, 'dom7'], [5, 'min7'], [3, 'maj7']],
    ],
    tempoRange: [65, 90],
    defaultKey: 0,
    melodyStyle: 'pentatonic',
    bassStyle: 'simple',
    chordStyle: 'sustained',
  },
  cinematic: {
    scales: ['minor', 'harmonicMinor', 'major'],
    chordProgressions: [
      [[5, 'min'], [3, 'maj'], [0, 'maj'], [4, 'maj']],       // vi-IV-I-V
      [[0, 'min'], [5, 'maj'], [2, 'maj'], [6, 'maj']],       // i-VI-III-VII
      [[0, 'min'], [3, 'min'], [5, 'maj'], [4, 'maj']],       // i-iv-VI-V
    ],
    tempoRange: [55, 90],
    defaultKey: 0,
    melodyStyle: 'smooth',
    bassStyle: 'roots',
    chordStyle: 'sustained',
  },
  blues: {
    scales: ['blues', 'pentatonicMinor'],
    chordProgressions: [
      [[0, 'dom7'], [3, 'dom7'], [0, 'dom7'], [4, 'dom7']],   // I7-IV7-I7-V7 (12-bar compressed)
      [[0, 'dom7'], [3, 'dom7'], [4, 'dom7'], [0, 'dom7']],
    ],
    tempoRange: [70, 130],
    defaultKey: 0,
    melodyStyle: 'pentatonic',
    bassStyle: 'simple',
    chordStyle: 'comping',
  },
  piano: {
    scales: ['major', 'minor'],
    chordProgressions: [
      [[0, 'maj'], [5, 'min'], [3, 'maj'], [4, 'maj']],
      [[0, 'min'], [5, 'maj'], [3, 'min'], [4, 'maj']],
      [[0, 'maj7'], [3, 'maj7'], [5, 'min7'], [4, 'dom7']],
    ],
    tempoRange: [60, 110],
    defaultKey: 0,
    melodyStyle: 'smooth',
    bassStyle: 'roots',
    chordStyle: 'arpeggio',
  },
  ambient: {
    scales: ['major', 'pentatonicMajor'],
    chordProgressions: [
      [[0, 'maj7'], [5, 'min7'], [3, 'maj7'], [3, 'maj7']],
      [[0, 'sus4'], [0, 'maj'], [5, 'min7'], [3, 'maj7']],
    ],
    tempoRange: [55, 80],
    defaultKey: 0,
    melodyStyle: 'smooth',
    bassStyle: 'simple',
    chordStyle: 'sustained',
  },
};

// Fallback for unrecognized genres
const DEFAULT_PROFILE = GENRE_PROFILES.classical;

export function getGenreProfile(genre: string): GenreProfile {
  const key = genre.toLowerCase().trim();
  // Direct match
  if (GENRE_PROFILES[key]) return GENRE_PROFILES[key];
  // Fuzzy match
  for (const [k, v] of Object.entries(GENRE_PROFILES)) {
    if (key.includes(k) || k.includes(key)) return v;
  }
  return DEFAULT_PROFILE;
}

// ─── Mood → Modifiers ─────────────────────────────────────────────────────────

interface MoodModifiers {
  scalePreference?: string;   // override genre scale preference
  tempoMultiplier: number;    // multiply genre's tempo range
  keyOffset: number;          // shift key up/down (semitones)
  velocityBase: number;       // 0–127, average note velocity
  useMinor: boolean;
}

const MOOD_PROFILES: Record<string, MoodModifiers> = {
  sad:        { scalePreference: 'minor',    tempoMultiplier: 0.75, keyOffset: 0,  velocityBase: 55, useMinor: true  },
  melancholic:{ scalePreference: 'minor',    tempoMultiplier: 0.80, keyOffset: 0,  velocityBase: 58, useMinor: true  },
  dark:       { scalePreference: 'harmonicMinor', tempoMultiplier: 0.85, keyOffset: 0, velocityBase: 60, useMinor: true },
  happy:      { scalePreference: 'major',    tempoMultiplier: 1.10, keyOffset: 0,  velocityBase: 80, useMinor: false },
  uplifting:  { scalePreference: 'major',    tempoMultiplier: 1.15, keyOffset: 0,  velocityBase: 82, useMinor: false },
  energetic:  { scalePreference: 'mixolydian', tempoMultiplier: 1.30, keyOffset: 0, velocityBase: 90, useMinor: false },
  calm:       { scalePreference: 'major',    tempoMultiplier: 0.80, keyOffset: 0,  velocityBase: 60, useMinor: false },
  relaxed:    { scalePreference: 'pentatonicMajor', tempoMultiplier: 0.85, keyOffset: 0, velocityBase: 62, useMinor: false },
  mysterious: { scalePreference: 'dorian',   tempoMultiplier: 0.90, keyOffset: 0,  velocityBase: 55, useMinor: true  },
  romantic:   { scalePreference: 'major',    tempoMultiplier: 0.90, keyOffset: 0,  velocityBase: 68, useMinor: false },
  epic:       { scalePreference: 'minor',    tempoMultiplier: 0.95, keyOffset: 0,  velocityBase: 85, useMinor: true  },
  peaceful:   { scalePreference: 'pentatonicMajor', tempoMultiplier: 0.75, keyOffset: 0, velocityBase: 58, useMinor: false },
};

const DEFAULT_MOOD: MoodModifiers = { tempoMultiplier: 1.0, keyOffset: 0, velocityBase: 70, useMinor: false };

export function getMoodModifiers(mood: string): MoodModifiers {
  const key = mood.toLowerCase().trim();
  if (MOOD_PROFILES[key]) return MOOD_PROFILES[key];
  for (const [k, v] of Object.entries(MOOD_PROFILES)) {
    if (key.includes(k) || k.includes(key)) return v;
  }
  return DEFAULT_MOOD;
}

// ─── Instrument Definitions ───────────────────────────────────────────────────

// General MIDI program numbers (0-indexed)
export const GM_INSTRUMENTS: Record<string, number> = {
  grandPiano:    0,
  brightPiano:   1,
  electricPiano: 4,
  harpsichord:   6,
  vibraphone:    11,
  marimba:       12,
  acousticGuitar:24,
  electricGuitar:26,
  cleanGuitar:   27,
  mutedGuitar:   28,
  acousticBass:  32,
  electricBass:  33,
  fretlessBass:  35,
  violin:        40,
  viola:         41,
  cello:         42,
  contrabass:    43,
  stringEnsemble:48,
  slowStrings:   49,
  synStrings:    50,
  choir:         52,
  trumpet:       56,
  trombone:      57,
  frenchHorn:    60,
  brassFanfare:  61,
  soprano:       64,
  flute:         73,
  recorder:      74,
  panFlute:      75,
  oboe:          68,
  clarinet:      71,
  pad1:          88,   // new age pad
  pad4:          91,   // choir pad
};

// Map user-facing instrument names to GM programs
export const INSTRUMENT_MAP: Record<string, number> = {
  'piano':         GM_INSTRUMENTS.grandPiano,
  'grand piano':   GM_INSTRUMENTS.grandPiano,
  'electric piano':GM_INSTRUMENTS.electricPiano,
  'strings':       GM_INSTRUMENTS.stringEnsemble,
  'violin':        GM_INSTRUMENTS.violin,
  'cello':         GM_INSTRUMENTS.cello,
  'guitar':        GM_INSTRUMENTS.acousticGuitar,
  'acoustic guitar':GM_INSTRUMENTS.acousticGuitar,
  'bass':          GM_INSTRUMENTS.acousticBass,
  'electric bass': GM_INSTRUMENTS.electricBass,
  'flute':         GM_INSTRUMENTS.flute,
  'trumpet':       GM_INSTRUMENTS.trumpet,
  'vibraphone':    GM_INSTRUMENTS.vibraphone,
  'choir':         GM_INSTRUMENTS.choir,
  'pad':           GM_INSTRUMENTS.pad1,
  'oboe':          GM_INSTRUMENTS.oboe,
  'clarinet':      GM_INSTRUMENTS.clarinet,
};

// Genre → default instrument layout
export const GENRE_INSTRUMENTS: Record<string, {
  melody: number; chords: number; bass: number; melodyName: string; chordsName: string; bassName: string;
}> = {
  jazz:      { melody: GM_INSTRUMENTS.electricGuitar, chords: GM_INSTRUMENTS.grandPiano,   bass: GM_INSTRUMENTS.acousticBass,  melodyName: 'Jazz Guitar', chordsName: 'Piano',  bassName: 'Double Bass' },
  classical: { melody: GM_INSTRUMENTS.violin,         chords: GM_INSTRUMENTS.grandPiano,   bass: GM_INSTRUMENTS.cello,         melodyName: 'Violin',      chordsName: 'Piano',  bassName: 'Cello'       },
  lofi:      { melody: GM_INSTRUMENTS.grandPiano,     chords: GM_INSTRUMENTS.grandPiano,   bass: GM_INSTRUMENTS.electricBass,  melodyName: 'Piano',       chordsName: 'Piano',  bassName: 'Electric Bass'},
  cinematic: { melody: GM_INSTRUMENTS.stringEnsemble, chords: GM_INSTRUMENTS.stringEnsemble, bass: GM_INSTRUMENTS.cello,       melodyName: 'Strings',     chordsName: 'Strings',bassName: 'Cello'       },
  blues:     { melody: GM_INSTRUMENTS.electricGuitar, chords: GM_INSTRUMENTS.grandPiano,   bass: GM_INSTRUMENTS.electricBass,  melodyName: 'Electric Guitar', chordsName: 'Piano', bassName: 'Electric Bass'},
  piano:     { melody: GM_INSTRUMENTS.grandPiano,     chords: GM_INSTRUMENTS.grandPiano,   bass: GM_INSTRUMENTS.grandPiano,    melodyName: 'Piano',       chordsName: 'Piano',  bassName: 'Piano'       },
  ambient:   { melody: GM_INSTRUMENTS.pad1,           chords: GM_INSTRUMENTS.pad4,         bass: GM_INSTRUMENTS.stringEnsemble, melodyName: 'Pad',        chordsName: 'Choir Pad', bassName: 'Strings'  },
};

// ─── Helper: Build Scale Notes ────────────────────────────────────────────────

/**
 * Returns all MIDI note numbers within the given range belonging to the scale.
 * root: MIDI note (e.g. 60 = C4), scale: array of semitone offsets
 */
export function buildScaleNotes(root: number, scale: number[], minMidi = 48, maxMidi = 84): number[] {
  const notes: number[] = [];
  const rootClass = root % 12;
  for (let n = minMidi; n <= maxMidi; n++) {
    const offset = ((n % 12) - rootClass + 12) % 12;
    if (scale.includes(offset)) notes.push(n);
  }
  return notes;
}

/**
 * Build the MIDI notes of a chord starting at `rootMidi`.
 */
export function buildChordNotes(rootMidi: number, type: ChordType): number[] {
  return CHORD_INTERVALS[type].map(i => rootMidi + i);
}

/**
 * Map a scale-degree index (0 = I, 1 = II…) to a MIDI root note, given the key root and scale.
 */
export function scaleDegreeToMidi(keyRoot: number, scaleIntervals: number[], degree: number): number {
  return keyRoot + (scaleIntervals[degree % scaleIntervals.length] ?? 0);
}

/** Random integer in [min, max] inclusive */
export function randInt(min: number, max: number, rng = Math.random): number {
  return Math.floor(rng() * (max - min + 1)) + min;
}

/** Seeded pseudo-random (simple LCG) — deterministic for same seed */
export function makePRNG(seed: number) {
  let s = seed;
  return function () {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };
}
