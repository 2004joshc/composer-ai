// ─── User Input Types ─────────────────────────────────────────────────────────

export type Complexity = 'simple' | 'intermediate' | 'advanced';
export type AppMode = 'simple' | 'advanced';

export interface MusicParams {
  genre: string;
  mood: string;
  lengthMin: number;   // minutes
  lengthMax: number;   // minutes
  instruments: string[] | 'ai';
  tempo?: number;      // BPM, optional — AI fills if absent
  complexity: Complexity;
  customPrompt?: string;
  mode: AppMode;
}

// ─── Internal Generation Types ────────────────────────────────────────────────

export interface ResolvedParams {
  key: number;           // MIDI root note (e.g., 60 = C4)
  keyName: string;       // e.g., "C", "G#"
  scale: number[];       // semitone offsets from root
  scaleName: string;     // e.g., "minor", "dorian"
  genre: string;         // normalized genre string
  tempo: number;         // BPM
  timeSignature: [number, number]; // [4, 4]
  measuresTotal: number;
  chordProgression: ChordDef[];  // repeated to fill measures
  instruments: InstrumentDef[];
  complexity: Complexity;
  durationSeconds: number;
}

export interface ChordDef {
  root: number;       // semitone offset from key (0–11)
  type: ChordType;
  name: string;       // e.g., "Cm7", "F#maj"
}

export type ChordType = 'maj' | 'min' | 'maj7' | 'min7' | 'dom7' | 'dim' | 'aug' | 'sus4';

export interface InstrumentDef {
  name: string;
  gmProgram: number;    // General MIDI program number (0-127)
  channel: number;
  role: 'melody' | 'chords' | 'bass' | 'rhythm';
  octave: number;       // base octave for this instrument
}

// ─── MIDI Output Types ─────────────────────────────────────────────────────────

export interface MidiEvent {
  absoluteTick: number;
  type: MidiEventType;
  channel?: number;
  note?: number;
  velocity?: number;
  program?: number;
  tempoMicros?: number;  // microseconds per beat
  timeSigNum?: number;
  timeSigDenom?: number;
  name?: string;
}

export type MidiEventType =
  | 'noteOn' | 'noteOff'
  | 'programChange'
  | 'tempo'
  | 'timeSig'
  | 'trackName'
  | 'endOfTrack';

// ─── API Response Types ────────────────────────────────────────────────────────

export interface GenerateResponse {
  midiBase64: string;
  noteSchedule: PlaybackNote[];
  metadata: GenerationMetadata;
}

export interface PlaybackNote {
  time: number;       // seconds from start
  note: number;       // MIDI note (0–127)
  duration: number;   // seconds
  velocity: number;   // 0–127
  channel: number;    // 0–15
}

export interface GenerationMetadata {
  tempo: number;
  keyName: string;
  scaleName: string;
  timeSignature: string;
  durationSeconds: number;
  chordProgression: string[];
  instruments: string[];
  measures: number;
}

// ─── Preset Types ─────────────────────────────────────────────────────────────

export interface Preset {
  id: string;
  label: string;
  icon: string;
  params: Partial<MusicParams>;
}
