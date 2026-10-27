import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { supabaseServer } from '@/lib/supabaseClient';
import { requireAdmin } from '@/lib/adminAuth';
import { apiError, schemaMissingResponse } from '@/lib/apiError';
import { loadModules, slugify } from '@/lib/modules';

const TAG = '[api/admin/modules]';

function slugConflict(error: { code?: string }) {
  return error.code === '23505'
    ? NextResponse.json({ error: 'Another module already uses that slug.' }, { status: 409 })
    : null;
}

export async function GET(request: NextRequest) {
  const authCheck = await requireAdmin(request);
  if (authCheck) return authCheck;

  try {
    const result = await loadModules({ includeInactive: true });
    if ('missing' in result) return schemaMissingResponse('Module', 'supabase/010_learning_modules.sql');
    return NextResponse.json({ modules: result.modules });
  } catch (err) {
    return apiError(err, `${TAG} GET`);
  }
}

export async function POST(request: NextRequest) {
  const authCheck = await requireAdmin(request);
  if (authCheck) return authCheck;

  try {
    const body = await request.json();
    const title = typeof body?.title === 'string' ? body.title.trim() : '';
    if (!title) return NextResponse.json({ error: 'Title is required.' }, { status: 400 });
    const slug = slugify(typeof body?.slug === 'string' && body.slug.trim() ? body.slug : title);
    if (!slug) return NextResponse.json({ error: 'Slug is required.' }, { status: 400 });
    const description = typeof body?.description === 'string' ? body.description.trim() : '';
    const { data: existing } = await supabaseServer.from('learning_modules').select('display_order');
    const nextOrder =
      (existing ?? []).reduce((max, row) => Math.max(max, Number(row.display_order) || 0), 0) + 1;

    const { data, error } = await supabaseServer
      .from('learning_modules')
      .insert({
        title,
        slug,
        description: description || null,
        display_order: nextOrder,
        is_active: body?.isActive !== false,
      })
      .select('id')
      .single();

    if (error) return slugConflict(error) ?? apiError(error, `${TAG} POST`);
    const loaded = await loadModules({ includeInactive: true });
    const module = 'modules' in loaded ? loaded.modules.find((item) => item.id === data.id) : null;
    return NextResponse.json({ module }, { status: 201 });
  } catch (err) {
    return apiError(err, `${TAG} POST`);
  }
}

export async function PUT(request: NextRequest) {
  const authCheck = await requireAdmin(request);
  if (authCheck) return authCheck;

  try {
    const body = await request.json();
    const id = typeof body?.id === 'string' ? body.id : '';
    const title = typeof body?.title === 'string' ? body.title.trim() : '';
    if (!id || !title) return NextResponse.json({ error: 'Title is required.' }, { status: 400 });
    const slug = slugify(typeof body?.slug === 'string' && body.slug.trim() ? body.slug : title);
    if (!slug) return NextResponse.json({ error: 'Slug is required.' }, { status: 400 });

    const { error } = await supabaseServer
      .from('learning_modules')
      .update({
        title,
        slug,
        description: typeof body?.description === 'string' && body.description.trim() ? body.description.trim() : null,
        is_active: body?.isActive !== false,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id);

    if (error) return slugConflict(error) ?? apiError(error, `${TAG} PUT`);
    const loaded = await loadModules({ includeInactive: true });
    const module = 'modules' in loaded ? loaded.modules.find((item) => item.id === id) : null;
    return NextResponse.json({ module });
  } catch (err) {
    return apiError(err, `${TAG} PUT`);
  }
}

export async function PATCH(request: NextRequest) {
  const authCheck = await requireAdmin(request);
  if (authCheck) return authCheck;

  try {
    const body = await request.json();
    const id = typeof body?.id === 'string' ? body.id : '';
    if (!id || typeof body?.isActive !== 'boolean') {
      return NextResponse.json({ error: 'Invalid update.' }, { status: 400 });
    }
    const { error } = await supabaseServer
      .from('learning_modules')
      .update({ is_active: body.isActive, updated_at: new Date().toISOString() })
      .eq('id', id);
    if (error) return apiError(error, `${TAG} PATCH`);
    return NextResponse.json({ success: true });
  } catch (err) {
    return apiError(err, `${TAG} PATCH`);
  }
}

export async function DELETE(request: NextRequest) {
  const authCheck = await requireAdmin(request);
  if (authCheck) return authCheck;

  try {
    const body = await request.json();
    const id = typeof body?.id === 'string' ? body.id : '';
    if (!id) return NextResponse.json({ error: 'Missing module.' }, { status: 400 });
    const { error } = await supabaseServer.from('learning_modules').delete().eq('id', id);
    if (error) return apiError(error, `${TAG} DELETE`);
    return NextResponse.json({ success: true });
  } catch (err) {
    return apiError(err, `${TAG} DELETE`);
  }
}
