/**
 * Prompt Builder
 * Converts raw user input into structured ResolvedParams that the MIDI generator consumes.
 * This is the "AI brain" layer — it fills gaps intelligently when inputs are vague.
 */

import {
  MusicParams, ResolvedParams, ChordDef, InstrumentDef,
} from './types';
import {
  SCALES, NOTE_NAMES, GENRE_PROFILES, getGenreProfile, getMoodModifiers,
  GENRE_INSTRUMENTS, INSTRUMENT_MAP, scaleDegreeToMidi, makePRNG,
} from './musicTheory';

const TICKS_PER_QUARTER = 480;

// ─── Key Selection ────────────────────────────────────────────────────────────

// Common keys — weighted toward "comfortable" keys
const COMMON_ROOTS = [0, 2, 3, 5, 7, 9, 10]; // C, D, Eb, F, G, A, Bb in semitones

function chooseKey(mood: string, seed: number): number {
  const rng = makePRNG(seed);
  return COMMON_ROOTS[Math.floor(rng() * COMMON_ROOTS.length)] + 60; // Midi octave 4
}

// ─── Tempo Resolution ─────────────────────────────────────────────────────────

function resolveTempo(params: MusicParams, seed: number): number {
  if (params.tempo) return params.tempo;

  const profile = getGenreProfile(params.genre);
  const moodMod = getMoodModifiers(params.mood);
  const rng = makePRNG(seed + 1);

  const [minT, maxT] = profile.tempoRange;
  const midT = (minT + maxT) / 2;
  const rawTempo = midT + (rng() - 0.5) * (maxT - minT) * 0.4;
  return Math.round(rawTempo * moodMod.tempoMultiplier);
}

// ─── Measures Calculation ─────────────────────────────────────────────────────

function calcMeasures(lengthMin: number, lengthMax: number, tempo: number): { measures: number; durationSeconds: number } {
  // Average of user-specified range
  const avgMinutes = (lengthMin + lengthMax) / 2;
  const totalSeconds = avgMinutes * 60;
  const secondsPerMeasure = (4 * 60) / tempo; // 4/4 time
  const measures = Math.max(8, Math.round(totalSeconds / secondsPerMeasure));
  return { measures, durationSeconds: measures * secondsPerMeasure };
}

// ─── Scale Selection ──────────────────────────────────────────────────────────

function resolveScale(params: MusicParams): { scaleName: string; scale: number[] } {
  const moodMod = getMoodModifiers(params.mood);
  const profile = getGenreProfile(params.genre);

  // Mood can override genre scale preference
  let scaleName = moodMod.scalePreference ?? profile.scales[0];

  // Validate it exists, fallback if not
  if (!SCALES[scaleName]) scaleName = 'major';

  return { scaleName, scale: SCALES[scaleName] };
}

// ─── Chord Progression ────────────────────────────────────────────────────────

function resolveChords(
  keyRoot: number,
  scale: number[],
  genre: string,
  seed: number,
): ChordDef[] {
  const profile = getGenreProfile(genre);
  const rng = makePRNG(seed + 2);
  const progressionTemplate = profile.chordProgressions[
    Math.floor(rng() * profile.chordProgressions.length)
  ];

  return progressionTemplate.map(([degree, type]) => {
    const chordRoot = scaleDegreeToMidi(keyRoot, scale, degree) % 12; // 0-11 offset from C
    const rootOffset = ((chordRoot - (keyRoot % 12)) + 12) % 12;
    const rootClass = (keyRoot % 12 + rootOffset) % 12;
    const name = `${NOTE_NAMES[rootClass]}${type}`;
    return { root: rootOffset, type, name };
  });
}

// ─── Instrument Resolution ────────────────────────────────────────────────────

function resolveInstruments(params: MusicParams, genre: string): InstrumentDef[] {
  const defaults = GENRE_INSTRUMENTS[genre.toLowerCase()] ?? GENRE_INSTRUMENTS.piano;

  // If user specified instruments, map them
  let melodyProgram = defaults.melody;
  let chordsProgram = defaults.chords;
  const bassProgram = defaults.bass;
  let melodyName = defaults.melodyName;
  let chordsName = defaults.chordsName;
  const bassName = defaults.bassName;

  if (Array.isArray(params.instruments) && params.instruments.length > 0) {
    const first = params.instruments[0].toLowerCase();
    const second = params.instruments[1]?.toLowerCase();

    if (INSTRUMENT_MAP[first] !== undefined) {
      melodyProgram = INSTRUMENT_MAP[first];
      melodyName = params.instruments[0];
    }
    if (second && INSTRUMENT_MAP[second] !== undefined) {
      chordsProgram = INSTRUMENT_MAP[second];
      chordsName = params.instruments[1];
    }
  }

  return [
    { name: melodyName, gmProgram: melodyProgram, channel: 0, role: 'melody',  octave: 5 },
    { name: chordsName, gmProgram: chordsProgram, channel: 1, role: 'chords',  octave: 4 },
    { name: bassName,   gmProgram: bassProgram,   channel: 2, role: 'bass',    octave: 3 },
  ];
}

// ─── Main Builder ─────────────────────────────────────────────────────────────

export function buildResolvedParams(params: MusicParams): ResolvedParams {
  // Deterministic seed based on genre + mood for reproducible results
  const seedStr = `${params.genre}${params.mood}${params.customPrompt ?? ''}`;
  let seed = 0;
  for (let i = 0; i < seedStr.length; i++) seed = (seed * 31 + seedStr.charCodeAt(i)) >>> 0;

  const genre = params.genre.toLowerCase().trim() || 'classical';
  const tempo = resolveTempo(params, seed);
  const keyRoot = chooseKey(params.mood, seed);
  const { scaleName, scale } = resolveScale(params);
  const chordProgression = resolveChords(keyRoot, scale, genre, seed);
  const { measures, durationSeconds } = calcMeasures(params.lengthMin, params.lengthMax, tempo);
  const instruments = resolveInstruments(params, genre);

  return {
    key: keyRoot,
    keyName: NOTE_NAMES[keyRoot % 12],
    scale,
    scaleName,
    genre,
    tempo,
    timeSignature: [4, 4] as [number, number],
    measuresTotal: measures,
    chordProgression,
    instruments,
    complexity: params.complexity,
    durationSeconds,
  };
}
