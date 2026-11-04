import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { requireUser } from '@/lib/adminAuth';
import { apiError, schemaMissingResponse } from '@/lib/apiError';
import { isReflectionDomain, lifeTransitionThemeRows } from '@/lib/reflection';
import { REFLECTION_SCHEMA, listReflectionThemes } from '@/lib/reflectionStore';

export async function GET(request: NextRequest) {
  const userResult = await requireUser(request);
  if (userResult instanceof NextResponse) return userResult;
  if (!userResult) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const locale = request.nextUrl.searchParams.get('locale')?.trim() || 'en';
    const domain = request.nextUrl.searchParams.get('domain')?.trim() || 'SLEEP';
    if (!isReflectionDomain(domain)) {
      return NextResponse.json({ error: 'That lesson does not have reflection themes.' }, { status: 400 });
    }
    const result = await listReflectionThemes({ locale, domain, includeDisabled: false });
    if ('missing' in result) {
      if (domain === 'LIFE_TRANSITIONS') return NextResponse.json({ themes: lifeTransitionThemeRows() });
      return schemaMissingResponse('Reflection theme', REFLECTION_SCHEMA);
    }
    return NextResponse.json({ themes: result.themes });
  } catch (err) {
    return apiError(err, '[api/reflection/themes] GET');
  }
}
