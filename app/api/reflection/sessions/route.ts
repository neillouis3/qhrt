import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { requireUser } from '@/lib/adminAuth';
import { apiError, schemaMissingResponse } from '@/lib/apiError';
import { REFLECTION_SCHEMA, createReflectionSession, listReflectionSessions } from '@/lib/reflectionStore';

export async function GET(request: NextRequest) {
  const userResult = await requireUser(request);
  if (userResult instanceof NextResponse) return userResult;
  if (!userResult) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const result = await listReflectionSessions(userResult.user.id);
    if ('missing' in result) return schemaMissingResponse('Reflection session', REFLECTION_SCHEMA);
    return NextResponse.json({ sessions: result.sessions });
  } catch (err) {
    return apiError(err, '[api/reflection/sessions] GET');
  }
}

export async function POST(request: NextRequest) {
  const userResult = await requireUser(request);
  if (userResult instanceof NextResponse) return userResult;
  if (!userResult) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const body = (await request.json()) as {
      themeId?: string;
      clarifierId?: string;
      customClarifierText?: string;
      locale?: string;
      sleepPatternId?: string;
      sourceModuleProgressId?: string;
    };
    if (!body.themeId) {
      return NextResponse.json({ error: 'Choose a theme from Sleep Education.' }, { status: 400 });
    }
    const result = await createReflectionSession({
      userId: userResult.user.id,
      themeId: body.themeId,
      clarifierId: body.clarifierId,
      customClarifierText: body.customClarifierText,
      locale: body.locale,
      sleepPatternId: body.sleepPatternId,
      sourceModuleProgressId: body.sourceModuleProgressId,
    });
    if ('missing' in result) return schemaMissingResponse('Reflection session', REFLECTION_SCHEMA);
    if ('error' in result) return NextResponse.json({ error: result.error }, { status: result.status });
    return NextResponse.json({ session: result.session }, { status: 201 });
  } catch (err) {
    return apiError(err, '[api/reflection/sessions] POST');
  }
}
