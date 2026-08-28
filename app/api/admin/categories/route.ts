import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { supabaseServer } from '@/lib/supabaseClient';
import { requireAdmin } from '@/lib/adminAuth';
import { apiError } from '@/lib/apiError';

// ---------------------------------------------------------------------------
// GET — list categories with optional filtering
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest) {
  const authCheck = await requireAdmin(request);
  if (authCheck) return authCheck;

  try {
    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get('activeOnly') === 'true';
    const search = searchParams.get('search')?.trim() ?? '';

    let query = supabaseServer.from('condition_categories').select('*');

    if (activeOnly) {
      query = query.eq('is_active', true);
    }
    if (search) {
      query = query.ilike('name', `%${search}%`);
    }

    query = query.order('display_order', { ascending: true });

    const { data, error } = await query;

    if (error) {
      return apiError(error, '[api/admin/categories] GET');
    }

    return NextResponse.json({ categories: data ?? [] }, { status: 200 });
  } catch (err) {
    console.error('[api/admin/categories] GET error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// POST — create a new category
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  const authCheck = await requireAdmin(request);
  if (authCheck) return authCheck;

  try {
    const body = await request.json();
    const { name, description, display_order } = body as {
      name?: string;
      description?: string;
      display_order?: number;
    };

    if (!name?.trim()) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    const { data, error } = await supabaseServer
      .from('condition_categories')
      .insert({
        name: name.trim(),
        description: description ?? null,
        display_order: display_order ?? 0,
      })
      .select()
      .single();

    if (error) {
      return apiError(error, '[api/admin/categories] POST');
    }

    return NextResponse.json({ success: true, category: data }, { status: 201 });
  } catch (err) {
    console.error('[api/admin/categories] POST error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// PATCH — update a category  ({ id, ...fields })
// ---------------------------------------------------------------------------

export async function PATCH(request: NextRequest) {
  const authCheck = await requireAdmin(request);
  if (authCheck) return authCheck;

  try {
    const body = await request.json();
    const { id } = body as { id?: string };

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    // Build update object from allowed fields
    const update: Record<string, any> = {};
    if (body.name !== undefined) update.name = body.name.trim();
    if (body.description !== undefined) update.description = body.description;
    if (body.display_order !== undefined) update.display_order = body.display_order;
    if (body.is_active !== undefined) update.is_active = body.is_active;
    update.updated_at = new Date().toISOString();

    const { data, error } = await supabaseServer
      .from('condition_categories')
      .update(update)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return apiError(error, '[api/admin/categories] PATCH');
    }

    return NextResponse.json({ success: true, category: data }, { status: 200 });
  } catch (err) {
    console.error('[api/admin/categories] PATCH error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// DELETE — delete a category  ({ id })
// ---------------------------------------------------------------------------

export async function DELETE(request: NextRequest) {
  const authCheck = await requireAdmin(request);
  if (authCheck) return authCheck;

  try {
    const body = await request.json();
    const { id } = body as { id?: string };

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    const { error } = await supabaseServer.from('condition_categories').delete().eq('id', id);

    if (error) {
      return apiError(error, '[api/admin/categories] DELETE');
    }

    return NextResponse.json({ success: true, message: 'Category deleted' }, { status: 200 });
  } catch (err) {
    console.error('[api/admin/categories] DELETE error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
