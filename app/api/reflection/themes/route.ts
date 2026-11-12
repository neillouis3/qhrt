import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { requireUser } from '@/lib/adminAuth';
import { apiError } from '@/lib/apiError';
import { builtinThemeRows, isReflectionDomain } from '@/lib/reflection';
import { listReflectionThemes } from '@/lib/reflectionStore';

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
    const themes = 'missing' in result || result.themes.length === 0
      ? builtinThemeRows(domain)
      : result.themes;
    return NextResponse.json({ themes });
  } catch (err) {
    return apiError(err, '[api/reflection/themes] GET');
  }
}
