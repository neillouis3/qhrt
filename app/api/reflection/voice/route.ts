import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { requireUser } from '@/lib/adminAuth';
import { apiError } from '@/lib/apiError';
import { rateLimit } from '@/lib/rateLimiter';
import {
  REFLECTION_CUES,
  cleanReflectionField,
  reflectionSpeech,
  type ReflectionCue,
} from '@/lib/reflection';
import { synthesizeSpeech, VOICE_BUCKET_UNAVAILABLE } from '@/lib/voiceover';

function isCue(value: string): value is ReflectionCue {
  return (REFLECTION_CUES as readonly string[]).includes(value);
}

export async function GET(request: NextRequest) {
  const userResult = await requireUser(request);
  if (userResult instanceof NextResponse) return userResult;
  if (!userResult) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const rl = await rateLimit(`${userResult.user.id}:reflection-voice`, 'voice');
  if (!rl.success) {
    return NextResponse.json({ error: 'Please wait a moment before playing again.' }, { status: 429 });
  }

  try {
    const cue = request.nextUrl.searchParams.get('cue')?.trim() ?? '';
    const theme = cleanReflectionField(request.nextUrl.searchParams.get('theme') ?? '');
    const statement = cleanReflectionField(request.nextUrl.searchParams.get('statement') ?? '');
    if (!isCue(cue) || !theme || !statement) {
      return NextResponse.json({ error: 'That guidance line is not available.' }, { status: 400 });
    }

    const audio = await synthesizeSpeech(reflectionSpeech(cue, theme, statement), { pace: 'slow' });
    if ('error' in audio) {
      if (audio.status === 204 || audio.error === VOICE_BUCKET_UNAVAILABLE) {
        return new NextResponse(null, { status: 204 });
      }
      return NextResponse.json({ error: audio.error }, { status: audio.status });
    }

    return new NextResponse(new Uint8Array(audio.buffer), {
      status: 200,
      headers: {
        'Content-Type': audio.mime,
        'Cache-Control': 'private, max-age=86400',
      },
    });
  } catch (err) {
    return apiError(err, '[api/reflection/voice] GET');
  }
}
