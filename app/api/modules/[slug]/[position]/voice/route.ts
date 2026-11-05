import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { requireUser } from '@/lib/adminAuth';
import { apiError, schemaMissingResponse } from '@/lib/apiError';
import { isPlayableLesson, loadModule, speechFromSlide } from '@/lib/modules';
import { rateLimit } from '@/lib/rateLimiter';
import { synthesizeSpeech, VOICE_BUCKET_UNAVAILABLE } from '@/lib/voiceover';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ slug: string; position: string }> }
) {
  const userResult = await requireUser(request);
  if (userResult instanceof NextResponse) return userResult;
  if (!userResult) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const rl = await rateLimit(`${userResult.user.id}:voice`, 'voice');
  if (!rl.success) {
    return NextResponse.json({ error: 'Please wait a moment before playing again.' }, { status: 429 });
  }

  try {
    const { slug, position } = await context.params;
    const slideIndex = Number(request.nextUrl.searchParams.get('slide') ?? '0');
    const result = await loadModule(slug);
    if ('missing' in result) return schemaMissingResponse('Module', 'supabase/010_learning_modules.sql');
    if (!result.module) return NextResponse.json({ error: 'Module not found.' }, { status: 404 });
    const lesson = result.module.lessons.find(
      (item) => item.position === Number(position) && isPlayableLesson(item.kind)
    );
    if (!lesson || lesson.kind !== 'presentation') {
      return NextResponse.json({ error: 'Introduction not found.' }, { status: 404 });
    }
    const slide = lesson.steps[slideIndex];
    if (!slide) return NextResponse.json({ error: 'Slide not found.' }, { status: 404 });

    const spoken = speechFromSlide(slide);
    const audio = await synthesizeSpeech(spoken);
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
    return apiError(err, '[api/modules/voice] GET');
  }
}
