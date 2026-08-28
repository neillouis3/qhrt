import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { supabaseServer } from '@/lib/supabaseClient';
import { requireAdmin } from '@/lib/adminAuth';
import { apiError } from '@/lib/apiError';

// ---------------------------------------------------------------------------
// GET — list session assignments (optionally filtered by condition_id)
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest) {
  const authCheck = await requireAdmin(request);
  if (authCheck) return authCheck;

  try {
    const { searchParams } = new URL(request.url);
    const conditionId = searchParams.get('conditionId');
    const search = searchParams.get('search')?.trim() ?? '';

    let query = supabaseServer.from('condition_session_assignments').select(`
        *,
        conditions (id, name)
      `);

    if (conditionId) {
      query = query.eq('condition_id', conditionId);
    }
    if (search) {
      // Search by linked condition name (embedded resource filter)
      query = query.ilike('conditions.name', `%${search}%`);
    }

    query = query.order('display_order', { ascending: true });

    const { data, error } = await query;

    if (error) {
      return apiError(error, '[api/admin/session-assignments] GET');
    }

    return NextResponse.json({ assignments: data ?? [] }, { status: 200 });
  } catch (err) {
    console.error('[api/admin/session-assignments] GET error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// POST — create a new session assignment
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  const authCheck = await requireAdmin(request);
  if (authCheck) return authCheck;

  try {
    const body = await request.json();
    const { condition_id, session_id, session_number, is_required, display_order } = body as {
      condition_id?: string;
      session_id?: string;
      session_number?: number;
      is_required?: boolean;
      display_order?: number;
    };

    if (!condition_id || !session_id) {
      return NextResponse.json(
        { error: 'condition_id and session_id are required' },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseServer
      .from('condition_session_assignments')
      .insert({
        condition_id,
        session_id,
        session_number: session_number ?? 0,
        is_required: is_required ?? false,
        display_order: display_order ?? 0,
      })
      .select()
      .single();

    if (error) {
      return apiError(error, '[api/admin/session-assignments] POST');
    }

    return NextResponse.json({ success: true, assignment: data }, { status: 201 });
  } catch (err) {
    console.error('[api/admin/session-assignments] POST error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// PATCH — update a session assignment  ({ id, ...fields })
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
    if (body.session_id !== undefined) update.session_id = body.session_id;
    if (body.session_number !== undefined) update.session_number = body.session_number;
    if (body.is_required !== undefined) update.is_required = body.is_required;
    if (body.display_order !== undefined) update.display_order = body.display_order;
    if (body.is_active !== undefined) update.is_active = body.is_active;
    update.updated_at = new Date().toISOString();

    const { data, error } = await supabaseServer
      .from('condition_session_assignments')
      .update(update)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return apiError(error, '[api/admin/session-assignments] PATCH');
    }

    return NextResponse.json({ success: true, assignment: data }, { status: 200 });
  } catch (err) {
    console.error('[api/admin/session-assignments] PATCH error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// DELETE — delete a session assignment  ({ id })
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

    const { error } = await supabaseServer
      .from('condition_session_assignments')
      .delete()
      .eq('id', id);

    if (error) {
      return apiError(error, '[api/admin/session-assignments] DELETE');
    }

    return NextResponse.json(
      { success: true, message: 'Session assignment deleted' },
      { status: 200 }
    );
  } catch (err) {
    console.error('[api/admin/session-assignments] DELETE error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
