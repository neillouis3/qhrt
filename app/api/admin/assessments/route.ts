import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { supabaseServer } from '@/lib/supabaseClient';
import { requireAdmin } from '@/lib/adminAuth';
import { apiError } from '@/lib/apiError';
import { ASSESSMENT_COLUMNS, toDefinition } from '@/lib/assessments/server';
import { validateAssessmentInput } from '@/lib/assessments/validate';

const TAG = '[api/admin/assessments]';

async function workbookIds(): Promise<Set<string>> {
  const { data } = await supabaseServer.from('workbooks').select('id');
  return new Set((data ?? []).map((w) => w.id));
}

function slugConflict(error: { code?: string }) {
  return error.code === '23505'
    ? NextResponse.json({ error: 'Another assessment already uses that slug.' }, { status: 409 })
    : null;
}

// ---------------------------------------------------------------------------
// GET — list all assessments (full definitions)
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest) {
  const authCheck = await requireAdmin(request);
  if (authCheck) return authCheck;

  const { data, error } = await supabaseServer
    .from('assessments')
    .select(ASSESSMENT_COLUMNS)
    .order('display_order', { ascending: true })
    .order('created_at', { ascending: true });

  if (error) return apiError(error, `${TAG} GET`);
  return NextResponse.json({ assessments: (data ?? []).map(toDefinition) });
}

// ---------------------------------------------------------------------------
// POST — create an assessment
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  const authCheck = await requireAdmin(request);
  if (authCheck) return authCheck;

  try {
    const body = await request.json();
    const { value, errors } = validateAssessmentInput(body, await workbookIds());
    if (errors.length > 0) return NextResponse.json({ error: errors[0], errors }, { status: 400 });

    const { data, error } = await supabaseServer
      .from('assessments')
      .insert(value)
      .select(ASSESSMENT_COLUMNS)
      .single();

    if (error) return slugConflict(error) ?? apiError(error, `${TAG} POST`);
    return NextResponse.json({ success: true, assessment: toDefinition(data) }, { status: 201 });
  } catch (err) {
    return apiError(err, `${TAG} POST`);
  }
}

// ---------------------------------------------------------------------------
// PUT — replace an assessment document (details, questions, outcomes)
// ---------------------------------------------------------------------------

export async function PUT(request: NextRequest) {
  const authCheck = await requireAdmin(request);
  if (authCheck) return authCheck;

  try {
    const body = await request.json();
    const id = typeof body?.id === 'string' ? body.id : '';
    if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 });

    const { value, errors } = validateAssessmentInput(body, await workbookIds());
    if (errors.length > 0) return NextResponse.json({ error: errors[0], errors }, { status: 400 });

    const { data, error } = await supabaseServer
      .from('assessments')
      .update({ ...value, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select(ASSESSMENT_COLUMNS)
      .single();

    if (error) return slugConflict(error) ?? apiError(error, `${TAG} PUT`);
    return NextResponse.json({ success: true, assessment: toDefinition(data) });
  } catch (err) {
    return apiError(err, `${TAG} PUT`);
  }
}

// ---------------------------------------------------------------------------
// PATCH — toggle visibility / reorder
// ---------------------------------------------------------------------------

export async function PATCH(request: NextRequest) {
  const authCheck = await requireAdmin(request);
  if (authCheck) return authCheck;

  try {
    const body = await request.json();
    const { id } = body as { id?: string };
    if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 });

    const update: Record<string, unknown> = { updated_at: new Date().toISOString() };
    if (typeof body.is_active === 'boolean') update.is_active = body.is_active;
    if (typeof body.display_order === 'number') update.display_order = body.display_order;

    const { data, error } = await supabaseServer
      .from('assessments')
      .update(update)
      .eq('id', id)
      .select(ASSESSMENT_COLUMNS)
      .single();

    if (error) return apiError(error, `${TAG} PATCH`);
    return NextResponse.json({ success: true, assessment: toDefinition(data) });
  } catch (err) {
    return apiError(err, `${TAG} PATCH`);
  }
}

// ---------------------------------------------------------------------------
// DELETE — remove an assessment (and its submissions)
// ---------------------------------------------------------------------------

export async function DELETE(request: NextRequest) {
  const authCheck = await requireAdmin(request);
  if (authCheck) return authCheck;

  try {
    const { id } = (await request.json()) as { id?: string };
    if (!id) return NextResponse.json({ error: 'id is required' }, { status: 400 });

    const { error } = await supabaseServer.from('assessments').delete().eq('id', id);
    if (error) return apiError(error, `${TAG} DELETE`);
    return NextResponse.json({ success: true });
  } catch (err) {
    return apiError(err, `${TAG} DELETE`);
  }
}
