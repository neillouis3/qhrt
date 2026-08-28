import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { supabaseServer } from '@/lib/supabaseClient';
import { requireAdmin } from '@/lib/adminAuth';
import { apiError } from '@/lib/apiError';

// ---------------------------------------------------------------------------
// GET — list prompts (optionally filtered by knowledge_model_id)
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest) {
  const authCheck = await requireAdmin(request);
  if (authCheck) return authCheck;

  try {
    const { searchParams } = new URL(request.url);
    const knowledgeModelId = searchParams.get('knowledge_model_id');
    const search = searchParams.get('search')?.trim() ?? '';

    let query = supabaseServer.from('prompts').select('*');

    if (knowledgeModelId) {
      query = query.eq('knowledge_model_id', knowledgeModelId);
    }
    if (search) {
      query = query.ilike('prompt_text', `%${search}%`);
    }

    query = query.order('display_order', { ascending: true });

    const { data, error } = await query;

    if (error) {
      return apiError(error, '[api/admin/prompts] GET');
    }

    return NextResponse.json({ prompts: data ?? [] }, { status: 200 });
  } catch (err) {
    console.error('[api/admin/prompts] GET error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// POST — create a new prompt
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  const authCheck = await requireAdmin(request);
  if (authCheck) return authCheck;

  try {
    const body = await request.json();
    const {
      knowledge_model_id,
      evidence_dimension_id,
      prompt_key,
      prompt_text,
      response_type,
      display_order,
    } = body as {
      knowledge_model_id?: string;
      evidence_dimension_id?: string | null;
      prompt_key?: string;
      prompt_text?: string;
      response_type?: string;
      display_order?: number;
    };

    if (!knowledge_model_id || !prompt_key?.trim() || !prompt_text?.trim()) {
      return NextResponse.json(
        { error: 'knowledge_model_id, prompt_key, and prompt_text are required' },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseServer
      .from('prompts')
      .insert({
        knowledge_model_id,
        evidence_dimension_id: evidence_dimension_id ?? null,
        prompt_key: prompt_key.trim(),
        prompt_text: prompt_text.trim(),
        response_type: response_type ?? 'free_text',
        display_order: display_order ?? 0,
      })
      .select()
      .single();

    if (error) {
      return apiError(error, '[api/admin/prompts] POST');
    }

    return NextResponse.json({ success: true, prompt: data }, { status: 201 });
  } catch (err) {
    console.error('[api/admin/prompts] POST error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// PATCH — update a prompt
// ---------------------------------------------------------------------------

export async function PATCH(request: NextRequest) {
  const authCheck = await requireAdmin(request);
  if (authCheck) return authCheck;

  try {
    const body = await request.json();
    const { id } = body as {
      id?: string;
      prompt_text?: string;
      response_type?: string;
      display_order?: number;
      is_active?: boolean;
    };

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    // Explicit allow-list — only these columns may be updated (prevents mass-assignment).
    const update: Record<string, unknown> = {};
    if (body.prompt_text !== undefined) update.prompt_text = body.prompt_text;
    if (body.response_type !== undefined) update.response_type = body.response_type;
    if (body.display_order !== undefined) update.display_order = body.display_order;
    if (body.is_active !== undefined) update.is_active = body.is_active;
    update.updated_at = new Date().toISOString();

    const { data, error } = await supabaseServer
      .from('prompts')
      .update(update)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return apiError(error, '[api/admin/prompts] PATCH');
    }

    return NextResponse.json({ success: true, prompt: data });
  } catch (err) {
    return apiError(err, '[api/admin/prompts] PATCH');
  }
}

// ---------------------------------------------------------------------------
// DELETE — delete a prompt
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

    const { error } = await supabaseServer.from('prompts').delete().eq('id', id);

    if (error) {
      return apiError(error, '[api/admin/prompts] DELETE');
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[api/admin/prompts] DELETE error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
