import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { requireUser } from '@/lib/adminAuth';
import { apiError, schemaMissingResponse } from '@/lib/apiError';
import { REFLECTION_SCHEMA, readReflectionSession, updateReflectionSession } from '@/lib/reflectionStore';

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const userResult = await requireUser(request);
  if (userResult instanceof NextResponse) return userResult;
  if (!userResult) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { id } = await context.params;
    const result = await readReflectionSession(userResult.user.id, id);
    if ('missing' in result) return schemaMissingResponse('Reflection session', REFLECTION_SCHEMA);
    if ('error' in result) return NextResponse.json({ error: result.error }, { status: result.status });
    return NextResponse.json({ session: result.session });
  } catch (err) {
    return apiError(err, '[api/reflection/sessions/id] GET');
  }
}

export async function PATCH(
  request: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  const userResult = await requireUser(request);
  if (userResult instanceof NextResponse) return userResult;
  if (!userResult) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { id } = await context.params;
    const body = (await request.json()) as {
      state?: string;
      breathPhase?: string;
      ratings?: number[];
      perspectiveText?: string;
      observationChoice?: string;
      observationNote?: string;
      nextStep?: string;
      status?: string;
    };
    const result = await updateReflectionSession(userResult.user.id, id, body);
    if ('missing' in result) return schemaMissingResponse('Reflection session', REFLECTION_SCHEMA);
    if ('error' in result) return NextResponse.json({ error: result.error }, { status: result.status });
    return NextResponse.json({ session: result.session });
  } catch (err) {
    return apiError(err, '[api/reflection/sessions/id] PATCH');
  }
}
