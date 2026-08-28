import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { supabaseServer } from '@/lib/supabaseClient';
import { requireAdmin } from '@/lib/adminAuth';
import { apiError } from '@/lib/apiError';

// ---------------------------------------------------------------------------
// GET — list conditions with optional filtering
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest) {
  const authCheck = await requireAdmin(request);
  if (authCheck) return authCheck;

  try {
    const { searchParams } = new URL(request.url);
    const categoryId = searchParams.get('categoryId');
    const activeOnly = searchParams.get('activeOnly') === 'true';
    const featuredOnly = searchParams.get('featuredOnly') === 'true';
    const search = searchParams.get('search')?.trim() ?? '';

    let query = supabaseServer.from('conditions').select(`
        *,
        condition_categories (id, name)
      `);

    if (categoryId) {
      query = query.eq('category_id', categoryId);
    }
    if (activeOnly) {
      query = query.eq('is_active', true);
    }
    if (featuredOnly) {
      query = query.eq('is_featured', true);
    }
    if (search) {
      query = query.or(`name.ilike.%${search}%,short_description.ilike.%${search}%`);
    }

    query = query.order('display_order', { ascending: true });

    const { data, error } = await query;

    if (error) {
      return apiError(error, '[api/admin/conditions] GET');
    }

    return NextResponse.json({ conditions: data ?? [] }, { status: 200 });
  } catch (err) {
    console.error('[api/admin/conditions] GET error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// POST — create a new condition
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  const authCheck = await requireAdmin(request);
  if (authCheck) return authCheck;

  try {
    const body = await request.json();
    const { name, category_id, short_description, full_description, is_featured, display_order } =
      body as {
        name?: string;
        category_id?: string;
        short_description?: string;
        full_description?: string;
        is_featured?: boolean;
        display_order?: number;
      };

    if (!name?.trim() || !category_id) {
      return NextResponse.json({ error: 'Name and category_id are required' }, { status: 400 });
    }

    const { data, error } = await supabaseServer
      .from('conditions')
      .insert({
        name: name.trim(),
        category_id,
        short_description: short_description ?? null,
        full_description: full_description ?? null,
        is_featured: is_featured ?? false,
        display_order: display_order ?? 0,
      })
      .select()
      .single();

    if (error) {
      return apiError(error, '[api/admin/conditions] POST');
    }

    return NextResponse.json({ success: true, condition: data }, { status: 201 });
  } catch (err) {
    console.error('[api/admin/conditions] POST error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// PATCH — update a condition  ({ id, ...fields })
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

    const update: Record<string, any> = {};
    if (body.name !== undefined) update.name = body.name.trim();
    if (body.category_id !== undefined) update.category_id = body.category_id;
    if (body.short_description !== undefined) update.short_description = body.short_description;
    if (body.full_description !== undefined) update.full_description = body.full_description;
    if (body.is_featured !== undefined) update.is_featured = body.is_featured;
    if (body.display_order !== undefined) update.display_order = body.display_order;
    if (body.is_active !== undefined) update.is_active = body.is_active;
    update.updated_at = new Date().toISOString();

    const { data, error } = await supabaseServer
      .from('conditions')
      .update(update)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return apiError(error, '[api/admin/conditions] PATCH');
    }

    return NextResponse.json({ success: true, condition: data }, { status: 200 });
  } catch (err) {
    console.error('[api/admin/conditions] PATCH error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// DELETE — delete a condition  ({ id })
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

    const { error } = await supabaseServer.from('conditions').delete().eq('id', id);

    if (error) {
      return apiError(error, '[api/admin/conditions] DELETE');
    }

    return NextResponse.json({ success: true, message: 'Condition deleted' }, { status: 200 });
  } catch (err) {
    console.error('[api/admin/conditions] DELETE error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
