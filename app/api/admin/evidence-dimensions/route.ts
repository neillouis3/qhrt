import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { supabaseServer } from '@/lib/supabaseClient';
import { requireAdmin } from '@/lib/adminAuth';
import { apiError } from '@/lib/apiError';

// ---------------------------------------------------------------------------
// GET — list evidence dimensions (optionally filtered by knowledge_model_id)
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest) {
  const authCheck = await requireAdmin(request);
  if (authCheck) return authCheck;

  try {
    const { searchParams } = new URL(request.url);
    const knowledgeModelId = searchParams.get('knowledge_model_id');
    const search = searchParams.get('search')?.trim() ?? '';

    let query = supabaseServer.from('evidence_dimensions').select('*');

    if (knowledgeModelId) {
      query = query.eq('knowledge_model_id', knowledgeModelId);
    }
    if (search) {
      query = query.ilike('name', `%${search}%`);
    }

    query = query.order('priority', { ascending: true });

    const { data, error } = await query;

    if (error) {
      return apiError(error, '[api/admin/evidence-dimensions] GET');
    }

    return NextResponse.json({ evidence_dimensions: data ?? [] }, { status: 200 });
  } catch (err) {
    console.error('[api/admin/evidence-dimensions] GET error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// POST — create a new evidence dimension
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  const authCheck = await requireAdmin(request);
  if (authCheck) return authCheck;

  try {
    const body = await request.json();
    const { knowledge_model_id, name, description, priority, is_required } = body as {
      knowledge_model_id?: string;
      name?: string;
      description?: string;
      priority?: number;
      is_required?: boolean;
    };

    if (!knowledge_model_id || !name?.trim()) {
      return NextResponse.json(
        { error: 'knowledge_model_id and name are required' },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseServer
      .from('evidence_dimensions')
      .insert({
        knowledge_model_id,
        name: name.trim(),
        description: description ?? null,
        priority: priority ?? 0,
        is_required: is_required ?? true,
      })
      .select()
      .single();

    if (error) {
      return apiError(error, '[api/admin/evidence-dimensions] POST');
    }

    return NextResponse.json({ success: true, evidence_dimension: data }, { status: 201 });
  } catch (err) {
    console.error('[api/admin/evidence-dimensions] POST error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// PATCH — update an evidence dimension
// ---------------------------------------------------------------------------

export async function PATCH(request: NextRequest) {
  const authCheck = await requireAdmin(request);
  if (authCheck) return authCheck;

  try {
    const body = await request.json();
    const { id } = body as {
      id?: string;
      name?: string;
      description?: string;
      priority?: number;
      is_required?: boolean;
      is_active?: boolean;
    };

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    // Explicit allow-list — only these columns may be updated (prevents mass-assignment).
    const update: Record<string, unknown> = {};
    if (body.name !== undefined) update.name = body.name;
    if (body.description !== undefined) update.description = body.description;
    if (body.priority !== undefined) update.priority = body.priority;
    if (body.is_required !== undefined) update.is_required = body.is_required;
    if (body.is_active !== undefined) update.is_active = body.is_active;
    update.updated_at = new Date().toISOString();

    const { data, error } = await supabaseServer
      .from('evidence_dimensions')
      .update(update)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return apiError(error, '[api/admin/evidence-dimensions] PATCH');
    }

    return NextResponse.json({ success: true, evidence_dimension: data });
  } catch (err) {
    return apiError(err, '[api/admin/evidence-dimensions] PATCH');
  }
}

// ---------------------------------------------------------------------------
// DELETE — delete an evidence dimension
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

    const { error } = await supabaseServer.from('evidence_dimensions').delete().eq('id', id);

    if (error) {
      return apiError(error, '[api/admin/evidence-dimensions] DELETE');
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[api/admin/evidence-dimensions] DELETE error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
