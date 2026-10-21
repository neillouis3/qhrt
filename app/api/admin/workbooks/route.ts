import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { supabaseServer } from '@/lib/supabaseClient';
import { requireAdmin } from '@/lib/adminAuth';
import { apiError } from '@/lib/apiError';

const TAG = '[api/admin/workbooks]';
const COLUMNS = 'id, title, description, url, display_order, is_active, created_at, updated_at';

function isValidUrl(url: string): boolean {
  if (url.startsWith('/')) return !url.startsWith('//');
  try {
    const parsed = new URL(url);
    return parsed.protocol === 'https:' || parsed.protocol === 'http:';
  } catch {
    return false;
  }
}

function readFields(body: Record<string, unknown>) {
  const title = typeof body.title === 'string' ? body.title.trim() : '';
  const url = typeof body.url === 'string' ? body.url.trim() : '';
  const description =
    typeof body.description === 'string' && body.description.trim() ? body.description.trim() : null;
  return { title, url, description };
}

function fieldError(title: string, url: string) {
  if (!title) return 'Title is required';
  if (!isValidUrl(url)) return 'Link must be an in-app path like /diary or a full https:// URL';
  return null;
}

export async function GET(request: NextRequest) {
  const authCheck = await requireAdmin(request);
  if (authCheck) return authCheck;

  const { data, error } = await supabaseServer
    .from('workbooks')
    .select(COLUMNS)
    .order('display_order', { ascending: true })
    .order('title', { ascending: true });

  if (error) return apiError(error, `${TAG} GET`);
  return NextResponse.json({ workbooks: data ?? [] });
}

export async function POST(request: NextRequest) {
  const authCheck = await requireAdmin(request);
  if (authCheck) return authCheck;

  try {
    const body = (await request.json()) as Record<string, unknown>;
    const { title, url, description } = readFields(body);
    const invalid = fieldError(title, url);
    if (invalid) return NextResponse.json({ error: invalid }, { status: 400 });

    const { data, error } = await supabaseServer
      .from('workbooks')
      .insert({
        title,
        url,
        description,
        display_order: typeof body.display_order === 'number' ? body.display_order : 0,
        is_active: body.is_active !== false,
      })
      .select(COLUMNS)
      .single();

    if (error) return apiError(error, `${TAG} POST`);
    return NextResponse.json({ success: true, workbook: data }, { status: 201 });
  } catch (err) {
    return apiError(err, `${TAG} POST`);
  }
}

export async function PATCH(request: NextRequest) {
  const authCheck = await requireAdmin(request);
  if (authCheck) return authCheck;

  try {
    const body = (await request.json()) as Record<string, unknown>;
    const id = typeof body.id === 'string' ? body.id : '';
    if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 });

    const update: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (body.title !== undefined || body.url !== undefined) {
      const { title, url, description } = readFields(body);
      const invalid = fieldError(title, url);
      if (invalid) return NextResponse.json({ error: invalid }, { status: 400 });
      Object.assign(update, { title, url, description });
    }
    if (typeof body.is_active === 'boolean') update.is_active = body.is_active;
    if (typeof body.display_order === 'number') update.display_order = body.display_order;

    const { data, error } = await supabaseServer
      .from('workbooks')
      .update(update)
      .eq('id', id)
      .select(COLUMNS)
      .single();

    if (error) return apiError(error, `${TAG} PATCH`);
    return NextResponse.json({ success: true, workbook: data });
  } catch (err) {
    return apiError(err, `${TAG} PATCH`);
  }
}

export async function DELETE(request: NextRequest) {
  const authCheck = await requireAdmin(request);
  if (authCheck) return authCheck;

  try {
    const { id } = (await request.json()) as { id?: string };
    if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 });

    const { data: users, error: usageError } = await supabaseServer
      .from('assessments')
      .select('title')
      .contains('outcomes', [{ workbookIds: [id] }]);
    if (usageError) return apiError(usageError, `${TAG} DELETE usage`);
    if (users && users.length > 0) {
      const titles = users.map((a) => a.title).join(', ');
      return NextResponse.json(
        { error: `Still used by: ${titles}. Remove it from those outcomes first.` },
        { status: 409 }
      );
    }

    const { error } = await supabaseServer.from('workbooks').delete().eq('id', id);
    if (error) return apiError(error, `${TAG} DELETE`);
    return NextResponse.json({ success: true });
  } catch (err) {
    return apiError(err, `${TAG} DELETE`);
  }
}
