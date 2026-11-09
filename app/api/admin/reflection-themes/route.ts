import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { requireAdmin } from '@/lib/adminAuth';
import { apiError, schemaMissingResponse } from '@/lib/apiError';
import {
  REFLECTION_SCHEMA,
  listReflectionThemes,
  saveReflectionClarifier,
  saveReflectionTheme,
} from '@/lib/reflectionStore';

export async function GET(request: NextRequest) {
  const denied = await requireAdmin(request);
  if (denied) return denied;

  try {
    const locale = request.nextUrl.searchParams.get('locale')?.trim() || 'en';
    const result = await listReflectionThemes({ locale, includeDisabled: true });
    if ('missing' in result) return schemaMissingResponse('Reflection theme', REFLECTION_SCHEMA);
    return NextResponse.json({ themes: result.themes });
  } catch (err) {
    return apiError(err, '[api/admin/reflection-themes] GET');
  }
}

export async function POST(request: NextRequest) {
  const denied = await requireAdmin(request);
  if (denied) return denied;

  try {
    const body = (await request.json()) as {
      kind?: 'theme' | 'clarifier';
      id?: string;
      themeId?: string;
      themeKey?: string;
      clarifierKey?: string;
      label?: string;
      body?: string;
      locale?: string;
      displayOrder?: number;
      enabled?: boolean;
      allowsCustom?: boolean;
      domain?: string;
    };
    if (body.kind === 'clarifier') {
      const result = await saveReflectionClarifier({
        id: body.id,
        themeId: body.themeId ?? '',
        clarifierKey: body.clarifierKey ?? '',
        body: body.body ?? '',
        allowsCustom: Boolean(body.allowsCustom),
        locale: body.locale ?? 'en',
        displayOrder: Number(body.displayOrder),
        enabled: body.enabled !== false,
      });
      if ('missing' in result) return schemaMissingResponse('Reflection theme', REFLECTION_SCHEMA);
      if ('error' in result) return NextResponse.json({ error: result.error }, { status: result.status });
      return NextResponse.json({ clarifier: result.clarifier });
    }
    const result = await saveReflectionTheme({
      id: body.id,
      themeKey: body.themeKey ?? '',
      label: body.label ?? '',
      locale: body.locale ?? 'en',
      displayOrder: Number(body.displayOrder),
      enabled: body.enabled !== false,
      domain: body.domain,
    });
    if ('missing' in result) return schemaMissingResponse('Reflection theme', REFLECTION_SCHEMA);
    if ('error' in result) return NextResponse.json({ error: result.error }, { status: result.status });
    return NextResponse.json({ theme: result.theme });
  } catch (err) {
    return apiError(err, '[api/admin/reflection-themes] POST');
  }
}
