import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { requireUser } from '@/lib/adminAuth';
import { apiError, schemaMissingResponse } from '@/lib/apiError';
import { REFLECTION_SCHEMA, listReflectionThemes } from '@/lib/reflectionStore';

export async function GET(request: NextRequest) {
  const userResult = await requireUser(request);
  if (userResult instanceof NextResponse) return userResult;
  if (!userResult) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const locale = request.nextUrl.searchParams.get('locale')?.trim() || 'en';
    const result = await listReflectionThemes({ locale, includeDisabled: false });
    if ('missing' in result) return schemaMissingResponse('Reflection theme', REFLECTION_SCHEMA);
    return NextResponse.json({ themes: result.themes });
  } catch (err) {
    return apiError(err, '[api/reflection/themes] GET');
  }
}
