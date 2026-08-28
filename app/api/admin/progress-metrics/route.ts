import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { supabaseServer } from '@/lib/supabaseClient';
import { requireAdmin } from '@/lib/adminAuth';
import { apiError } from '@/lib/apiError';

// ---------------------------------------------------------------------------
// GET — list progress metrics (optionally filtered by condition_id)
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest) {
  const authCheck = await requireAdmin(request);
  if (authCheck) return authCheck;

  try {
    const { searchParams } = new URL(request.url);
    const conditionId = searchParams.get('conditionId');
    const search = searchParams.get('search')?.trim() ?? '';

    let query = supabaseServer.from('progress_metrics').select(`
        *,
        conditions (id, name)
      `);

    if (conditionId) {
      query = query.eq('condition_id', conditionId);
    }
    if (search) {
      query = query.ilike('metric_name', `%${search}%`);
    }

    query = query.order('display_order', { ascending: true });

    const { data, error } = await query;

    if (error) {
      return apiError(error, '[api/admin/progress-metrics] GET');
    }

    return NextResponse.json({ metrics: data ?? [] }, { status: 200 });
  } catch (err) {
    console.error('[api/admin/progress-metrics] GET error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// POST — create a new progress metric
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  const authCheck = await requireAdmin(request);
  if (authCheck) return authCheck;

  try {
    const body = await request.json();
    const {
      condition_id,
      metric_name,
      metric_description,
      scale_type,
      minimum_value,
      maximum_value,
      display_order,
    } = body as {
      condition_id?: string;
      metric_name?: string;
      metric_description?: string;
      scale_type?: string;
      minimum_value?: number;
      maximum_value?: number;
      display_order?: number;
    };

    if (!condition_id || !metric_name?.trim()) {
      return NextResponse.json(
        { error: 'condition_id and metric_name are required' },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseServer
      .from('progress_metrics')
      .insert({
        condition_id,
        metric_name: metric_name.trim(),
        metric_description: metric_description ?? null,
        scale_type: scale_type ?? '0-10',
        minimum_value: minimum_value ?? 0,
        maximum_value: maximum_value ?? 10,
        display_order: display_order ?? 0,
      })
      .select()
      .single();

    if (error) {
      return apiError(error, '[api/admin/progress-metrics] POST');
    }

    return NextResponse.json({ success: true, metric: data }, { status: 201 });
  } catch (err) {
    console.error('[api/admin/progress-metrics] POST error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// PATCH — update a progress metric  ({ id, ...fields })
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
    if (body.metric_name !== undefined) update.metric_name = body.metric_name.trim();
    if (body.metric_description !== undefined) update.metric_description = body.metric_description;
    if (body.scale_type !== undefined) update.scale_type = body.scale_type;
    if (body.minimum_value !== undefined) update.minimum_value = body.minimum_value;
    if (body.maximum_value !== undefined) update.maximum_value = body.maximum_value;
    if (body.display_order !== undefined) update.display_order = body.display_order;
    if (body.is_active !== undefined) update.is_active = body.is_active;
    update.updated_at = new Date().toISOString();

    const { data, error } = await supabaseServer
      .from('progress_metrics')
      .update(update)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return apiError(error, '[api/admin/progress-metrics] PATCH');
    }

    return NextResponse.json({ success: true, metric: data }, { status: 200 });
  } catch (err) {
    console.error('[api/admin/progress-metrics] PATCH error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// DELETE — delete a progress metric  ({ id })
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

    const { error } = await supabaseServer.from('progress_metrics').delete().eq('id', id);

    if (error) {
      return apiError(error, '[api/admin/progress-metrics] DELETE');
    }

    return NextResponse.json(
      { success: true, message: 'Progress metric deleted' },
      { status: 200 }
    );
  } catch (err) {
    console.error('[api/admin/progress-metrics] DELETE error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
