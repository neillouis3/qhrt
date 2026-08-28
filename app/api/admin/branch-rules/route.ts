import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { supabaseServer } from '@/lib/supabaseClient';
import { requireAdmin } from '@/lib/adminAuth';
import { apiError } from '@/lib/apiError';

// ---------------------------------------------------------------------------
// GET — list branch rules (optionally filtered by prompt_id)
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest) {
  const authCheck = await requireAdmin(request);
  if (authCheck) return authCheck;

  try {
    const { searchParams } = new URL(request.url);
    const promptId = searchParams.get('prompt_id');
    const search = searchParams.get('search')?.trim() ?? '';

    let query = supabaseServer.from('branch_rules').select('*');

    if (promptId) {
      query = query.eq('prompt_id', promptId);
    }
    if (search) {
      // No natural text column — search by id (partial match)
      query = query.ilike('id', `%${search}%`);
    }

    query = query.order('priority', { ascending: true });

    const { data, error } = await query;

    if (error) {
      return apiError(error, '[api/admin/branch-rules] GET');
    }

    return NextResponse.json({ branch_rules: data ?? [] }, { status: 200 });
  } catch (err) {
    console.error('[api/admin/branch-rules] GET error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// POST — create a new branch rule
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  const authCheck = await requireAdmin(request);
  if (authCheck) return authCheck;

  try {
    const body = await request.json();
    const { prompt_id, condition_expression, target_prompt_id, priority } = body as {
      prompt_id?: string;
      condition_expression?: object;
      target_prompt_id?: string;
      priority?: number;
    };

    if (!prompt_id || !condition_expression || !target_prompt_id) {
      return NextResponse.json(
        { error: 'prompt_id, condition_expression, and target_prompt_id are required' },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseServer
      .from('branch_rules')
      .insert({
        prompt_id,
        condition_expression,
        target_prompt_id,
        priority: priority ?? 0,
      })
      .select()
      .single();

    if (error) {
      return apiError(error, '[api/admin/branch-rules] POST');
    }

    return NextResponse.json({ success: true, branch_rule: data }, { status: 201 });
  } catch (err) {
    console.error('[api/admin/branch-rules] POST error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// PATCH — update a branch rule
// ---------------------------------------------------------------------------

export async function PATCH(request: NextRequest) {
  const authCheck = await requireAdmin(request);
  if (authCheck) return authCheck;

  try {
    const body = await request.json();
    const { id } = body as {
      id?: string;
      condition_expression?: object;
      target_prompt_id?: string;
      priority?: number;
      is_active?: boolean;
    };

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    // Explicit allow-list — only these columns may be updated (prevents mass-assignment).
    const update: Record<string, unknown> = {};
    if (body.condition_expression !== undefined)
      update.condition_expression = body.condition_expression;
    if (body.target_prompt_id !== undefined) update.target_prompt_id = body.target_prompt_id;
    if (body.priority !== undefined) update.priority = body.priority;
    if (body.is_active !== undefined) update.is_active = body.is_active;
    update.updated_at = new Date().toISOString();

    const { data, error } = await supabaseServer
      .from('branch_rules')
      .update(update)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return apiError(error, '[api/admin/branch-rules] PATCH');
    }

    return NextResponse.json({ success: true, branch_rule: data });
  } catch (err) {
    return apiError(err, '[api/admin/branch-rules] PATCH');
  }
}

// ---------------------------------------------------------------------------
// DELETE — delete a branch rule
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

    const { error } = await supabaseServer.from('branch_rules').delete().eq('id', id);

    if (error) {
      return apiError(error, '[api/admin/branch-rules] DELETE');
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[api/admin/branch-rules] DELETE error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
