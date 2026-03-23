/**
 * MIDI Generator
 *
 * Takes ResolvedParams and produces:
 *   1. Raw MIDI file bytes (Uint8Array)
 *   2. PlaybackNote[] schedule for in-browser Tone.js playback
 *
 * Architecture:
 *   generateMusic()
 *     ├── generateMelody()     → melody events
 *     ├── generateChords()     → accompaniment events
 *     ├── generateBass()       → bass line events
 *     └── assembleMidi()       → raw bytes
 */

import {
  ResolvedParams, MidiEvent, PlaybackNote, GenerateResponse, GenerationMetadata,
} from './types';
import {
  buildScaleNotes, buildChordNotes, makePRNG,
  getGenreProfile,
} from './musicTheory';

// ─── Timing Constants ─────────────────────────────────────────────────────────

const TPQ = 480; // ticks per quarter note

// Note length helpers (in ticks)
const T = {
  whole:    TPQ * 4,
  half:     TPQ * 2,
  quarter:  TPQ,
  eighth:   TPQ / 2,
  sixteenth:TPQ / 4,
  dottedHalf:   TPQ * 3,
  dottedQuarter:TPQ * 3 / 2,
  dottedEighth: TPQ * 3 / 4,
};

// ─── Seeded RNG per role ───────────────────────────────────────────────────────

function makeRNGs(seed: number) {
  return {
    melody: makePRNG(seed),
    chords: makePRNG(seed + 1000),
    bass:   makePRNG(seed + 2000),
  };
}

// ─── Melody Generator ─────────────────────────────────────────────────────────

interface NoteOn { absoluteTick: number; note: number; velocity: number; durationTicks: number; channel: number }

function generateMelody(
  p: ResolvedParams,
  scaleNotes: number[],
  chordPerMeasure: number[], // chord index for each measure
  rng: () => number,
): NoteOn[] {
  const notes: NoteOn[] = [];
  const { complexity, tempo } = p;

  // Melody range: upper register
  const melodyNotes = scaleNotes.filter(n => n >= 60 && n <= 84);
  if (melodyNotes.length === 0) return notes;

  // Note length palette by complexity
  const rhythmPalette: number[] = ({
    simple:       [T.quarter, T.quarter, T.half, T.dottedQuarter, T.eighth],
    intermediate: [T.quarter, T.eighth, T.eighth, T.dottedQuarter, T.sixteenth, T.sixteenth, T.half],
    advanced:     [T.eighth, T.sixteenth, T.eighth, T.dottedEighth, T.sixteenth, T.quarter, T.eighth, T.eighth],
  } as Record<string, number[]>)[complexity];

  // Use a neutral velocity base (70) — mood info isn't forwarded here
  const velocityBase = 70;
  const measureTicks = TPQ * 4;

  let currentNote = melodyNotes[Math.floor(melodyNotes.length / 2)]; // start mid-range

  for (let measure = 0; measure < p.measuresTotal; measure++) {
    const measureStart = measure * measureTicks;
    let tickInMeasure = 0;

    // Sometimes add a rest at the start (phrase breathing)
    if (measure > 0 && rng() < 0.25) {
      tickInMeasure += T.eighth;
    }

    while (tickInMeasure < measureTicks - T.sixteenth) {
      const remaining = measureTicks - tickInMeasure;

      // Pick note duration
      const eligible = rhythmPalette.filter(l => l <= remaining);
      const len = eligible.length > 0
        ? eligible[Math.floor(rng() * eligible.length)]
        : T.quarter;

      // Sometimes rest (silence)
      if (rng() < 0.12) {
        tickInMeasure += len;
        continue;
      }

      // Move to a nearby note (stepwise > leaps); wider range for advanced complexity
      const maxStep = complexity === 'simple' ? 3 : complexity === 'intermediate' ? 5 : 7;
      const eligible_notes = melodyNotes.filter(n =>
        Math.abs(n - currentNote) <= maxStep * 2 && n !== currentNote,
      );
      const pool = eligible_notes.length > 0 ? eligible_notes : melodyNotes;
      const nextNote = pool[Math.floor(rng() * pool.length)];
      currentNote = nextNote;

      const velocity = Math.min(127, Math.max(40,
        velocityBase + Math.floor((rng() - 0.5) * 20),
      ));

      notes.push({
        absoluteTick: measureStart + tickInMeasure,
        note: currentNote,
        velocity,
        durationTicks: Math.max(T.sixteenth, Math.floor(len * 0.9)), // slight gap
        channel: 0,
      });

      tickInMeasure += len;
    }
  }

  return notes;
}

// ─── Chord Generator ──────────────────────────────────────────────────────────

function generateChords(
  p: ResolvedParams,
  chordRoots: number[], // MIDI note number for chord root per measure
  chordTypes: ReturnType<typeof buildChordNotes>[],
  rng: () => number,
): NoteOn[] {
  const notes: NoteOn[] = [];
  const measureTicks = TPQ * 4;
  const profile = getGenreProfile(p.genre);
  const style = profile?.chordStyle ?? 'block';

  for (let measure = 0; measure < p.measuresTotal; measure++) {
    const measureStart = measure * measureTicks;
    const chordIdx = measure % chordRoots.length;
    const chordNotes = chordTypes[chordIdx];

    // Velocity slightly softer than melody
    const velocity = 55 + Math.floor(rng() * 15);

    if (style === 'arpeggio' || (style === 'comping' && rng() < 0.5)) {
      // Arpeggiate chord across the measure
      const noteLen = T.quarter;
      chordNotes.forEach((n, i) => {
        if (measureStart + i * noteLen < measureStart + measureTicks) {
          notes.push({
            absoluteTick: measureStart + i * noteLen,
            note: n,
            velocity,
            durationTicks: T.dottedQuarter,
            channel: 1,
          });
        }
      });
      // Repeat if room left
      if (chordNotes.length < 4) {
        chordNotes.forEach((n, i) => {
          const t = measureStart + 2 * TPQ + i * T.eighth;
          if (t < measureStart + measureTicks) {
            notes.push({ absoluteTick: t, note: n, velocity: velocity - 5, durationTicks: T.eighth, channel: 1 });
          }
        });
      }
    } else if (style === 'sustained') {
      // Hold chord for entire measure
      chordNotes.forEach(n => {
        notes.push({
          absoluteTick: measureStart,
          note: n,
          velocity,
          durationTicks: measureTicks - TPQ / 4,
          channel: 1,
        });
      });
    } else {
      // Block chords on beats 1 and 3 (or 1 only if sustained feel)
      const beats = complexity_beats(p.complexity);
      beats.forEach(beat => {
        const t = measureStart + beat * TPQ;
        if (t < measureStart + measureTicks) {
          chordNotes.forEach(n => {
            notes.push({
              absoluteTick: t,
              note: n,
              velocity,
              durationTicks: T.quarter + T.eighth,
              channel: 1,
            });
          });
        }
      });
    }
  }

  return notes;
}

function complexity_beats(c: string): number[] {
  if (c === 'simple') return [0, 2];
  if (c === 'intermediate') return [0, 2];
  return [0, 1.5, 2, 3.5];
}

// ─── Bass Generator ───────────────────────────────────────────────────────────

function generateBass(
  p: ResolvedParams,
  chordRoots: number[],
  rng: () => number,
): NoteOn[] {
  const notes: NoteOn[] = [];
  const measureTicks = TPQ * 4;
  const profile = getGenreProfile(p.genre);
  const style = profile?.bassStyle ?? 'roots';

  for (let measure = 0; measure < p.measuresTotal; measure++) {
    const measureStart = measure * measureTicks;
    const chordIdx = measure % chordRoots.length;
    const root = chordRoots[chordIdx] - 12; // one octave down

    const velocity = 65 + Math.floor(rng() * 15);

    if (style === 'walking') {
      // Walking bass: 4 quarter notes moving toward next chord root
      const nextRoot = chordRoots[(chordIdx + 1) % chordRoots.length] - 12;
      const step = Math.sign(nextRoot - root);
      const walk = [root, root + step * 2, root + step, nextRoot];
      walk.forEach((n, i) => {
        notes.push({
          absoluteTick: measureStart + i * TPQ,
          note: Math.max(36, Math.min(60, n)),
          velocity,
          durationTicks: TPQ - T.sixteenth,
          channel: 2,
        });
      });
    } else if (style === 'pumping') {
      // Eighth-note pumping bass
      for (let i = 0; i < 8; i++) {
        notes.push({
          absoluteTick: measureStart + i * T.eighth,
          note: Math.max(36, Math.min(60, root)),
          velocity: i % 2 === 0 ? velocity : velocity - 10,
          durationTicks: T.eighth - T.sixteenth,
          channel: 2,
        });
      }
    } else {
      // Simple roots: beat 1 + beat 3
      [0, 2].forEach(beat => {
        notes.push({
          absoluteTick: measureStart + beat * TPQ,
          note: Math.max(36, Math.min(60, root)),
          velocity,
          durationTicks: T.half - T.eighth,
          channel: 2,
        });
      });
    }
  }

  return notes;
}

// ─── MIDI File Builder ────────────────────────────────────────────────────────

/** Variable-length quantity encoding */
function vlq(value: number): number[] {
  if (value < 0x80) return [value];
  const bytes: number[] = [];
  bytes.unshift(value & 0x7F);
  value >>= 7;
  while (value > 0) {
    bytes.unshift((value & 0x7F) | 0x80);
    value >>= 7;
  }
  return bytes;
}

function uint32(n: number): number[] {
  return [(n >> 24) & 0xFF, (n >> 16) & 0xFF, (n >> 8) & 0xFF, n & 0xFF];
}

function uint16(n: number): number[] {
  return [(n >> 8) & 0xFF, n & 0xFF];
}

function buildTempoTrack(tempoMicros: number, timeSigNum: number, timeSigDenomPow: number): number[] {
  const events: number[] = [
    // Time signature
    ...vlq(0), 0xFF, 0x58, 0x04,
    timeSigNum, timeSigDenomPow, 24, 8,
    // Tempo
    ...vlq(0), 0xFF, 0x51, 0x03,
    (tempoMicros >> 16) & 0xFF, (tempoMicros >> 8) & 0xFF, tempoMicros & 0xFF,
    // End of track
    ...vlq(0), 0xFF, 0x2F, 0x00,
  ];
  return [...uint32(0x4D54726B), ...uint32(events.length), ...events];
}

function buildNoteTrack(
  trackName: string,
  gmProgram: number,
  channel: number,
  noteOns: NoteOn[],
): number[] {
  // Sort by start time, then note off before note on at same tick
  const events: MidiEvent[] = [];

  // Program change at tick 0
  events.push({ absoluteTick: 0, type: 'programChange', channel, program: gmProgram });

  // Expand each NoteOn into a noteOn + noteOff pair
  for (const n of noteOns) {
    events.push({ absoluteTick: n.absoluteTick, type: 'noteOn', channel, note: n.note, velocity: n.velocity });
    events.push({ absoluteTick: n.absoluteTick + n.durationTicks, type: 'noteOff', channel, note: n.note, velocity: 0 });
  }

  // Sort: earlier ticks first; noteOff before noteOn at same tick
  events.sort((a, b) => {
    if (a.absoluteTick !== b.absoluteTick) return a.absoluteTick - b.absoluteTick;
    const order = { noteOff: 0, noteOn: 1, programChange: 2, endOfTrack: 3 } as Record<string, number>;
    return (order[a.type] ?? 9) - (order[b.type] ?? 9);
  });

  // Build raw bytes with delta times
  const bytes: number[] = [];
  let lastTick = 0;

  for (const ev of events) {
    const delta = ev.absoluteTick - lastTick;
    bytes.push(...vlq(delta));
    lastTick = ev.absoluteTick;

    if (ev.type === 'programChange') {
      bytes.push(0xC0 | (ev.channel! & 0x0F), ev.program! & 0x7F);
    } else if (ev.type === 'noteOn') {
      bytes.push(0x90 | (ev.channel! & 0x0F), ev.note! & 0x7F, ev.velocity! & 0x7F);
    } else if (ev.type === 'noteOff') {
      bytes.push(0x80 | (ev.channel! & 0x0F), ev.note! & 0x7F, 0);
    }
  }

  // End of track
  bytes.push(...vlq(0), 0xFF, 0x2F, 0x00);

  return [...uint32(0x4D54726B), ...uint32(bytes.length), ...bytes];
}

function buildMidiHeader(numTracks: number): number[] {
  return [
    0x4D, 0x54, 0x68, 0x64, // "MThd"
    ...uint32(6),            // header length
    ...uint16(1),            // format 1 (multi-track)
    ...uint16(numTracks),
    ...uint16(TPQ),          // ticks per quarter note
  ];
}

// ─── Note-schedule builder (for Tone.js playback) ─────────────────────────────

function noteOnsToPlayback(
  noteOns: NoteOn[],
  channel: number,
  tempo: number,
): PlaybackNote[] {
  const secondsPerTick = 60 / (tempo * TPQ);
  return noteOns.map(n => ({
    time: n.absoluteTick * secondsPerTick,
    note: n.note,
    duration: n.durationTicks * secondsPerTick,
    velocity: n.velocity,
    channel,
  }));
}

// ─── Main Entry Point ─────────────────────────────────────────────────────────

export function generateMusic(p: ResolvedParams): GenerateResponse {
  // Seed for determinism
  const seed = p.key * 1000 + p.tempo;
  const rngs = makeRNGs(seed);

  // Build scale note pool
  const scaleNotes = buildScaleNotes(p.key, p.scale, 48, 84);

  // Resolve chord roots and voicings for each progression slot
  const chordRootsRaw = p.chordProgression.map(cd => p.key + cd.root);

  // Chord voicings in mid register (4th octave)
  const chordVoicings = p.chordProgression.map(cd => {
    const root = p.key + cd.root;
    // Place chord root in octave 4 range (48–72)
    let base = root;
    while (base < 48) base += 12;
    while (base > 60) base -= 12;
    return buildChordNotes(base, cd.type);
  });

  // Chord per measure (cycle through progression)
  const chordPerMeasure = Array.from({ length: p.measuresTotal }, (_, i) =>
    i % p.chordProgression.length,
  );

  // Generate each voice
  const melodyNotes = generateMelody(p, scaleNotes, chordPerMeasure, rngs.melody);
  const chordNotes  = generateChords(p, chordRootsRaw, chordVoicings, rngs.chords);
  const bassNotes   = generateBass(p, chordRootsRaw, rngs.bass);

  // Get instrument defs
  const [melodyInst, chordsInst, bassInst] = p.instruments;

  // Build MIDI tracks
  const tempoMicros = Math.round(60_000_000 / p.tempo);
  const tempoTrack  = buildTempoTrack(tempoMicros, p.timeSignature[0], 2); // denom power: 2 = quarter
  const melodyTrack = buildNoteTrack(melodyInst.name, melodyInst.gmProgram, 0, melodyNotes);
  const chordTrack  = buildNoteTrack(chordsInst.name, chordsInst.gmProgram, 1, chordNotes);
  const bassTrack   = buildNoteTrack(bassInst.name,   bassInst.gmProgram,   2, bassNotes);

  const header = buildMidiHeader(4); // tempo + 3 note tracks

  const allBytes = [
    ...header,
    ...tempoTrack,
    ...melodyTrack,
    ...chordTrack,
    ...bassTrack,
  ];

  const midiBytes = new Uint8Array(allBytes);
  const midiBase64 = Buffer.from(midiBytes).toString('base64');

  // Build playback schedule
  const playback: PlaybackNote[] = [
    ...noteOnsToPlayback(melodyNotes, 0, p.tempo),
    ...noteOnsToPlayback(chordNotes,  1, p.tempo),
    ...noteOnsToPlayback(bassNotes,   2, p.tempo),
  ].sort((a, b) => a.time - b.time);

  const metadata: GenerationMetadata = {
    tempo:           p.tempo,
    keyName:         p.keyName,
    scaleName:       p.scaleName,
    timeSignature:   `${p.timeSignature[0]}/${p.timeSignature[1]}`,
    durationSeconds: p.durationSeconds,
    chordProgression:p.chordProgression.map(c => c.name),
    instruments:     p.instruments.map(i => i.name),
    measures:        p.measuresTotal,
  };

  return { midiBase64, noteSchedule: playback, metadata };
}
