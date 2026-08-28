import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { supabaseServer } from '@/lib/supabaseClient';
import { requireAdmin } from '@/lib/adminAuth';
import { apiError } from '@/lib/apiError';

// ---------------------------------------------------------------------------
// GET — list QHRT mappings (optionally filtered by condition_id)
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest) {
  const authCheck = await requireAdmin(request);
  if (authCheck) return authCheck;

  try {
    const { searchParams } = new URL(request.url);
    const conditionId = searchParams.get('conditionId');
    const search = searchParams.get('search')?.trim() ?? '';

    let query = supabaseServer.from('qhrt_mappings').select(`
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

    const { data, error } = await query;

    if (error) {
      return apiError(error, '[api/admin/qhrt-mappings] GET');
    }

    return NextResponse.json({ mappings: data ?? [] }, { status: 200 });
  } catch (err) {
    console.error('[api/admin/qhrt-mappings] GET error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// POST — create or update a QHRT mapping (upsert on condition_id)
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  const authCheck = await requireAdmin(request);
  if (authCheck) return authCheck;

  try {
    const body = await request.json();
    const {
      condition_id,
      primary_emotional_theme,
      secondary_emotional_theme,
      organ_system,
      gland_system,
      qhrt_focus,
      internal_notes,
    } = body as {
      condition_id?: string;
      primary_emotional_theme?: string;
      secondary_emotional_theme?: string;
      organ_system?: string;
      gland_system?: string;
      qhrt_focus?: string;
      internal_notes?: string;
    };

    if (!condition_id) {
      return NextResponse.json({ error: 'condition_id is required' }, { status: 400 });
    }

    const { data, error } = await supabaseServer
      .from('qhrt_mappings')
      .upsert(
        {
          condition_id,
          primary_emotional_theme: primary_emotional_theme ?? null,
          secondary_emotional_theme: secondary_emotional_theme ?? null,
          organ_system: organ_system ?? null,
          gland_system: gland_system ?? null,
          qhrt_focus: qhrt_focus ?? null,
          internal_notes: internal_notes ?? null,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'condition_id' }
      )
      .select()
      .single();

    if (error) {
      return apiError(error, '[api/admin/qhrt-mappings] POST');
    }

    return NextResponse.json({ success: true, mapping: data }, { status: 201 });
  } catch (err) {
    console.error('[api/admin/qhrt-mappings] POST error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// PATCH — update a QHRT mapping  ({ id, ...fields })
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
    if (body.primary_emotional_theme !== undefined)
      update.primary_emotional_theme = body.primary_emotional_theme;
    if (body.secondary_emotional_theme !== undefined)
      update.secondary_emotional_theme = body.secondary_emotional_theme;
    if (body.organ_system !== undefined) update.organ_system = body.organ_system;
    if (body.gland_system !== undefined) update.gland_system = body.gland_system;
    if (body.qhrt_focus !== undefined) update.qhrt_focus = body.qhrt_focus;
    if (body.internal_notes !== undefined) update.internal_notes = body.internal_notes;
    update.updated_at = new Date().toISOString();

    const { data, error } = await supabaseServer
      .from('qhrt_mappings')
      .update(update)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return apiError(error, '[api/admin/qhrt-mappings] PATCH');
    }

    return NextResponse.json({ success: true, mapping: data }, { status: 200 });
  } catch (err) {
    console.error('[api/admin/qhrt-mappings] PATCH error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// DELETE — delete a QHRT mapping  ({ id })
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

    const { error } = await supabaseServer.from('qhrt_mappings').delete().eq('id', id);

    if (error) {
      return apiError(error, '[api/admin/qhrt-mappings] DELETE');
    }

    return NextResponse.json({ success: true, message: 'QHRT mapping deleted' }, { status: 200 });
  } catch (err) {
    console.error('[api/admin/qhrt-mappings] DELETE error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
