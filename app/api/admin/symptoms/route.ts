import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { supabaseServer } from '@/lib/supabaseClient';
import { requireAdmin } from '@/lib/adminAuth';
import { apiError } from '@/lib/apiError';

// ---------------------------------------------------------------------------
// GET — list symptoms (optionally filtered by condition_id)
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest) {
  const authCheck = await requireAdmin(request);
  if (authCheck) return authCheck;

  try {
    const { searchParams } = new URL(request.url);
    const conditionId = searchParams.get('conditionId');
    const search = searchParams.get('search')?.trim() ?? '';

    let query = supabaseServer.from('condition_symptoms').select(`
        *,
        conditions (id, name)
      `);

    if (conditionId) {
      query = query.eq('condition_id', conditionId);
    }
    if (search) {
      query = query.ilike('symptom_name', `%${search}%`);
    }

    query = query.order('display_order', { ascending: true });

    const { data, error } = await query;

    if (error) {
      return apiError(error, '[api/admin/symptoms] GET');
    }

    return NextResponse.json({ symptoms: data ?? [] }, { status: 200 });
  } catch (err) {
    console.error('[api/admin/symptoms] GET error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// POST — create a new symptom
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  const authCheck = await requireAdmin(request);
  if (authCheck) return authCheck;

  try {
    const body = await request.json();
    const { condition_id, symptom_name, display_order } = body as {
      condition_id?: string;
      symptom_name?: string;
      display_order?: number;
    };

    if (!condition_id || !symptom_name?.trim()) {
      return NextResponse.json(
        { error: 'condition_id and symptom_name are required' },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseServer
      .from('condition_symptoms')
      .insert({
        condition_id,
        symptom_name: symptom_name.trim(),
        display_order: display_order ?? 0,
      })
      .select()
      .single();

    if (error) {
      return apiError(error, '[api/admin/symptoms] POST');
    }

    return NextResponse.json({ success: true, symptom: data }, { status: 201 });
  } catch (err) {
    console.error('[api/admin/symptoms] POST error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// PATCH — update a symptom  ({ id, ...fields })
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
    if (body.symptom_name !== undefined) update.symptom_name = body.symptom_name.trim();
    if (body.display_order !== undefined) update.display_order = body.display_order;
    if (body.is_active !== undefined) update.is_active = body.is_active;
    update.updated_at = new Date().toISOString();

    const { data, error } = await supabaseServer
      .from('condition_symptoms')
      .update(update)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return apiError(error, '[api/admin/symptoms] PATCH');
    }

    return NextResponse.json({ success: true, symptom: data }, { status: 200 });
  } catch (err) {
    console.error('[api/admin/symptoms] PATCH error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// DELETE — delete a symptom  ({ id })
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

    const { error } = await supabaseServer.from('condition_symptoms').delete().eq('id', id);

    if (error) {
      return apiError(error, '[api/admin/symptoms] DELETE');
    }

    return NextResponse.json({ success: true, message: 'Symptom deleted' }, { status: 200 });
  } catch (err) {
    console.error('[api/admin/symptoms] DELETE error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
