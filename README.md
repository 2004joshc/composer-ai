# Composer AI

A web app that generates MIDI music from text descriptions using AI-powered algorithmic composition.

## Quick Start

### 1. Install Node.js (if not installed)

```bash
# macOS (recommended via Homebrew)
brew install node

# Or download from: https://nodejs.org
```

### 2. Install dependencies & run

```bash
cd "music ai"
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Features

- **Simple Mode** — Genre, mood, length → generate
- **Advanced Mode** — Full control: instruments, tempo, complexity, custom description
- **Preset Styles** — Lo-fi, Jazz, Cinematic, Classical, Blues (one-click)
- **Surprise Me** — Random parameters + instant generation
- **Web Audio playback** — Preview in browser (no plugins needed)
- **Download MIDI** — Valid Type 1 MIDI file, import into any DAW

## Architecture

```
composer-ai/
├── app/
│   ├── page.tsx              ← Entry point
│   ├── globals.css           ← Warm, minimal styling
│   └── api/generate/route.ts ← POST endpoint
├── components/
│   ├── ComposerApp.tsx       ← Root client component
│   ├── SimpleMode.tsx        ← Basic input form
│   ├── AdvancedMode.tsx      ← Full parameter control
│   ├── PresetStyles.tsx      ← Quick-select presets
│   ├── LoadingAnimation.tsx  ← Animated music bars
│   └── ResultSection.tsx     ← Player + downloads
└── lib/
    ├── types.ts              ← All TypeScript types
    ├── musicTheory.ts        ← Scales, chords, GM instruments
    ├── promptBuilder.ts      ← User input → ResolvedParams
    └── midiGenerator.ts      ← ResolvedParams → MIDI bytes
```

## Music Generation Pipeline

1. **Prompt Builder** — Maps genre + mood to scale, chord progression, tempo, instruments
2. **MIDI Generator** — Three voices (melody / chords / bass) with music-theory-correct voicings
3. **MIDI Writer** — Raw Type 1 MIDI file (no external dependencies)
4. **Web Audio** — Browser playback via oscillators with ADSR envelopes

## Supported Genres

Jazz · Classical · Lo-fi · Cinematic · Blues · Ambient · Piano

## Supported Moods

Sad · Melancholic · Dark · Happy · Uplifting · Energetic · Calm · Relaxed · Mysterious · Romantic · Epic · Peaceful
