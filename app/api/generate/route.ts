/**
 * POST /api/generate
 *
 * Accepts MusicParams, runs prompt-builder → MIDI generator,
 * returns GenerateResponse (MIDI as base64 + playback schedule + metadata).
 */

import { NextRequest, NextResponse } from 'next/server';
import { MusicParams } from '@/lib/types';
import { buildResolvedParams } from '@/lib/promptBuilder';
import { generateMusic } from '@/lib/midiGenerator';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as MusicParams;

    // ── Validate required fields ──────────────────────────────────────────────
    if (!body.genre || !body.mood) {
      return NextResponse.json(
        { error: 'Genre and mood are required.' },
        { status: 400 },
      );
    }

    // Clamp length to sensible bounds (0.5–10 minutes)
    const lengthMin = Math.max(0.5, Math.min(10, body.lengthMin ?? 2));
    const lengthMax = Math.max(lengthMin, Math.min(10, body.lengthMax ?? lengthMin + 1));

    const params: MusicParams = {
      genre:        body.genre.trim(),
      mood:         body.mood.trim(),
      lengthMin,
      lengthMax,
      instruments:  body.instruments ?? 'ai',
      tempo:        body.tempo ? Number(body.tempo) : undefined,
      complexity:   body.complexity ?? 'intermediate',
      customPrompt: body.customPrompt?.trim(),
      mode:         body.mode ?? 'simple',
    };

    // ── Generate ──────────────────────────────────────────────────────────────
    const resolved = buildResolvedParams(params);
    const result   = generateMusic(resolved);

    return NextResponse.json(result);
  } catch (err) {
    console.error('[generate]', err);
    return NextResponse.json(
      { error: 'Music generation failed. Please try again.' },
      { status: 500 },
    );
  }
}
