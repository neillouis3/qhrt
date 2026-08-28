import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { supabaseServer } from '@/lib/supabaseClient';
import { requireAdmin } from '@/lib/adminAuth';
import { apiError } from '@/lib/apiError';

// ---------------------------------------------------------------------------
// GET — list assessment questions (optionally filtered by condition_id)
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest) {
  const authCheck = await requireAdmin(request);
  if (authCheck) return authCheck;

  try {
    const { searchParams } = new URL(request.url);
    const conditionId = searchParams.get('conditionId');
    const search = searchParams.get('search')?.trim() ?? '';

    let query = supabaseServer.from('assessment_questions').select(`
        *,
        conditions (id, name)
      `);

    if (conditionId) {
      query = query.eq('condition_id', conditionId);
    }
    if (search) {
      query = query.ilike('question_text', `%${search}%`);
    }

    query = query.order('display_order', { ascending: true });

    const { data, error } = await query;

    if (error) {
      return apiError(error, '[api/admin/assessment-questions] GET');
    }

    return NextResponse.json({ questions: data ?? [] }, { status: 200 });
  } catch (err) {
    console.error('[api/admin/assessment-questions] GET error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// POST — create a new assessment question
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  const authCheck = await requireAdmin(request);
  if (authCheck) return authCheck;

  try {
    const body = await request.json();
    const { condition_id, question_text, scale_type, minimum_value, maximum_value, display_order } =
      body as {
        condition_id?: string;
        question_text?: string;
        scale_type?: string;
        minimum_value?: number;
        maximum_value?: number;
        display_order?: number;
      };

    if (!condition_id || !question_text?.trim()) {
      return NextResponse.json(
        { error: 'condition_id and question_text are required' },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseServer
      .from('assessment_questions')
      .insert({
        condition_id,
        question_text: question_text.trim(),
        scale_type: scale_type ?? '0-10',
        minimum_value: minimum_value ?? 0,
        maximum_value: maximum_value ?? 10,
        display_order: display_order ?? 0,
      })
      .select()
      .single();

    if (error) {
      return apiError(error, '[api/admin/assessment-questions] POST');
    }

    return NextResponse.json({ success: true, question: data }, { status: 201 });
  } catch (err) {
    console.error('[api/admin/assessment-questions] POST error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// PATCH — update an assessment question  ({ id, ...fields })
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
    if (body.question_text !== undefined) update.question_text = body.question_text.trim();
    if (body.scale_type !== undefined) update.scale_type = body.scale_type;
    if (body.minimum_value !== undefined) update.minimum_value = body.minimum_value;
    if (body.maximum_value !== undefined) update.maximum_value = body.maximum_value;
    if (body.display_order !== undefined) update.display_order = body.display_order;
    if (body.is_active !== undefined) update.is_active = body.is_active;
    update.updated_at = new Date().toISOString();

    const { data, error } = await supabaseServer
      .from('assessment_questions')
      .update(update)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      return apiError(error, '[api/admin/assessment-questions] PATCH');
    }

    return NextResponse.json({ success: true, question: data }, { status: 200 });
  } catch (err) {
    console.error('[api/admin/assessment-questions] PATCH error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// DELETE — delete an assessment question  ({ id })
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

    const { error } = await supabaseServer.from('assessment_questions').delete().eq('id', id);

    if (error) {
      return apiError(error, '[api/admin/assessment-questions] DELETE');
    }

    return NextResponse.json(
      { success: true, message: 'Assessment question deleted' },
      { status: 200 }
    );
  } catch (err) {
    console.error('[api/admin/assessment-questions] DELETE error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
