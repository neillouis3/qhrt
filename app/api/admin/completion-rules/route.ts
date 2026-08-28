import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { supabaseServer } from '@/lib/supabaseClient';
import { requireAdmin } from '@/lib/adminAuth';
import { apiError } from '@/lib/apiError';

// ---------------------------------------------------------------------------
// GET — list completion rules (optionally filtered by evidence_dimension_id)
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest) {
  const authCheck = await requireAdmin(request);
  if (authCheck) return authCheck;

  try {
    const { searchParams } = new URL(request.url);
    const evidenceDimensionId = searchParams.get('evidence_dimension_id');
    const search = searchParams.get('search')?.trim() ?? '';

    let query = supabaseServer.from('completion_rules').select('*');

    if (evidenceDimensionId) {
      query = query.eq('evidence_dimension_id', evidenceDimensionId);
    }
    if (search) {
      // No natural text column — search by id (partial match)
      query = query.ilike('id', `%${search}%`);
    }

    const { data, error } = await query;

    if (error) {
      return apiError(error, '[api/admin/completion-rules] GET');
    }

    return NextResponse.json({ completion_rules: data ?? [] }, { status: 200 });
  } catch (err) {
    console.error('[api/admin/completion-rules] GET error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// POST — create a new completion rule
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  const authCheck = await requireAdmin(request);
  if (authCheck) return authCheck;

  try {
    const body = await request.json();
    const { evidence_dimension_id, rule_expression } = body as {
      evidence_dimension_id?: string;
      rule_expression?: object;
    };

    if (!evidence_dimension_id || !rule_expression) {
      return NextResponse.json(
        { error: 'evidence_dimension_id and rule_expression are required' },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseServer
      .from('completion_rules')
      .insert({
        evidence_dimension_id,
        rule_expression,
      })
      .select()
      .single();

    if (error) {
      return apiError(error, '[api/admin/completion-rules] POST');
    }

    return NextResponse.json({ success: true, completion_rule: data }, { status: 201 });
  } catch (err) {
    console.error('[api/admin/completion-rules] POST error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// PATCH — update a completion rule
// ---------------------------------------------------------------------------

export async function PATCH(request: NextRequest) {
  const authCheck = await requireAdmin(request);
  if (authCheck) return authCheck;

  try {
    const body = await request.json();
    const { id } = body as {
      id?: string;
      rule_expression?: object;
      is_active?: boolean;
    };

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    // Explicit allow-list — only these columns may be updated (prevents mass-assignment).
    const update: Record<string, unknown> = {};
    if (body.rule_expression !== undefined) update.rule_expression = body.rule_expression;
    if (body.is_active !== undefined) update.is_active = body.is_active;
    update.updated_at = new Date().toISOString();

    const { data, error } = await supabaseServer
      .from('completion_rules')
      .update(update)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return apiError(error, '[api/admin/completion-rules] PATCH');
    }

    return NextResponse.json({ success: true, completion_rule: data });
  } catch (err) {
    return apiError(err, '[api/admin/completion-rules] PATCH');
  }
}

// ---------------------------------------------------------------------------
// DELETE — delete a completion rule
// ---------------------------------------------------------------------------

export async function DELETE(request: NextRequest) {
  const authCheck = await requireAdmin(request);
  if (authCheck) return authCheck;

  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    const { error } = await supabaseServer.from('completion_rules').delete().eq('id', id);

    if (error) {
      return apiError(error, '[api/admin/completion-rules] DELETE');
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[api/admin/completion-rules] DELETE error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
