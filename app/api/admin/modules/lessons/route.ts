import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { supabaseServer } from '@/lib/supabaseClient';
import { requireAdmin } from '@/lib/adminAuth';
import { apiError } from '@/lib/apiError';
import { isPlayableLesson, parseGuideSteps, parseLessonKind, type LessonKind } from '@/lib/modules';

const TAG = '[api/admin/modules/lessons]';

function lessonPayload(body: Record<string, unknown>, kind: LessonKind) {
  const title = typeof body.title === 'string' ? body.title.trim() : '';
  const description = typeof body.description === 'string' ? body.description.trim() : '';
  const assessmentId = typeof body.assessmentId === 'string' && body.assessmentId ? body.assessmentId : null;
  const steps = isPlayableLesson(kind) ? parseGuideSteps(body.steps) : [];
  return { title, description: description || null, assessmentId, steps };
}

function kindRejected(error: { code?: string; message?: string } | null): boolean {
  if (!error) return false;
  const message = (error.message ?? '').toLowerCase();
  return error.code === '23514' || message.includes('module_lessons_kind_check');
}

export async function POST(request: NextRequest) {
  const authCheck = await requireAdmin(request);
  if (authCheck) return authCheck;

  try {
    const body = (await request.json()) as Record<string, unknown>;
    const moduleId = typeof body.moduleId === 'string' ? body.moduleId : '';
    const kind: LessonKind = parseLessonKind(body.kind);
    const fields = lessonPayload(body, kind);
    if (!moduleId || !fields.title) return NextResponse.json({ error: 'Title is required.' }, { status: 400 });
    if (kind === 'assessment' && !fields.assessmentId) {
      return NextResponse.json({ error: 'Choose an assessment for this lesson.' }, { status: 400 });
    }
    if (isPlayableLesson(kind) && fields.steps.length === 0) {
      return NextResponse.json({ error: 'Add at least one slide.' }, { status: 400 });
    }

    const { data: existing } = await supabaseServer
      .from('module_lessons')
      .select('position')
      .eq('module_id', moduleId);
    const position = (existing ?? []).reduce((max, row) => Math.max(max, Number(row.position) || 0), 0) + 1;

    const row = {
      module_id: moduleId,
      position,
      title: fields.title,
      description: fields.description,
      kind,
      assessment_id: kind === 'assessment' ? fields.assessmentId : null,
      steps: fields.steps,
      is_active: body.isActive !== false,
    };
    let { error } = await supabaseServer.from('module_lessons').insert(row);
    if (error && kind === 'presentation' && kindRejected(error)) {
      const retry = await supabaseServer.from('module_lessons').insert({ ...row, kind: 'guide' });
      error = retry.error;
    }
    if (error) return apiError(error, `${TAG} POST`);
    return NextResponse.json({ success: true }, { status: 201 });
  } catch (err) {
    return apiError(err, `${TAG} POST`);
  }
}

export async function PUT(request: NextRequest) {
  const authCheck = await requireAdmin(request);
  if (authCheck) return authCheck;

  try {
    const body = (await request.json()) as Record<string, unknown>;
    const id = typeof body.id === 'string' ? body.id : '';
    const kind: LessonKind = parseLessonKind(body.kind);
    const fields = lessonPayload(body, kind);
    if (!id || !fields.title) return NextResponse.json({ error: 'Title is required.' }, { status: 400 });
    if (kind === 'assessment' && !fields.assessmentId) {
      return NextResponse.json({ error: 'Choose an assessment for this lesson.' }, { status: 400 });
    }
    if (isPlayableLesson(kind) && fields.steps.length === 0) {
      return NextResponse.json({ error: 'Add at least one slide.' }, { status: 400 });
    }

    const patch = {
      title: fields.title,
      description: fields.description,
      kind,
      assessment_id: kind === 'assessment' ? fields.assessmentId : null,
      steps: fields.steps,
      is_active: body.isActive !== false,
      updated_at: new Date().toISOString(),
    };
    let { error } = await supabaseServer.from('module_lessons').update(patch).eq('id', id);
    if (error && kind === 'presentation' && kindRejected(error)) {
      const retry = await supabaseServer.from('module_lessons').update({ ...patch, kind: 'guide' }).eq('id', id);
      error = retry.error;
    }
    if (error) return apiError(error, `${TAG} PUT`);
    return NextResponse.json({ success: true });
  } catch (err) {
    return apiError(err, `${TAG} PUT`);
  }
}

export async function PATCH(request: NextRequest) {
  const authCheck = await requireAdmin(request);
  if (authCheck) return authCheck;

  try {
    const body = await request.json();
    const id = typeof body?.id === 'string' ? body.id : '';
    const direction = body?.direction === 'up' || body?.direction === 'down' ? body.direction : null;
    if (!id || !direction) return NextResponse.json({ error: 'Invalid move.' }, { status: 400 });

    const { data: lesson, error: readError } = await supabaseServer
      .from('module_lessons')
      .select('id, module_id, position')
      .eq('id', id)
      .single();
    if (readError || !lesson) return NextResponse.json({ error: 'Lesson not found.' }, { status: 404 });

    const nextPosition = lesson.position + (direction === 'up' ? -1 : 1);
    if (nextPosition < 1) return NextResponse.json({ success: true });

    const { data: other } = await supabaseServer
      .from('module_lessons')
      .select('id, position')
      .eq('module_id', lesson.module_id)
      .eq('position', nextPosition)
      .maybeSingle();
    if (!other) return NextResponse.json({ success: true });

    const temp = 100000 + lesson.position;
    const now = new Date().toISOString();
    const first = await supabaseServer.from('module_lessons').update({ position: temp, updated_at: now }).eq('id', lesson.id);
    if (first.error) return apiError(first.error, `${TAG} PATCH`);
    const second = await supabaseServer
      .from('module_lessons')
      .update({ position: lesson.position, updated_at: now })
      .eq('id', other.id);
    if (second.error) return apiError(second.error, `${TAG} PATCH`);
    const third = await supabaseServer
      .from('module_lessons')
      .update({ position: nextPosition, updated_at: now })
      .eq('id', lesson.id);
    if (third.error) return apiError(third.error, `${TAG} PATCH`);
    return NextResponse.json({ success: true });
  } catch (err) {
    return apiError(err, `${TAG} PATCH`);
  }
}

export async function DELETE(request: NextRequest) {
  const authCheck = await requireAdmin(request);
  if (authCheck) return authCheck;

  try {
    const body = await request.json();
    const id = typeof body?.id === 'string' ? body.id : '';
    if (!id) return NextResponse.json({ error: 'Missing lesson.' }, { status: 400 });
    const { error } = await supabaseServer.from('module_lessons').delete().eq('id', id);
    if (error) return apiError(error, `${TAG} DELETE`);
    return NextResponse.json({ success: true });
  } catch (err) {
    return apiError(err, `${TAG} DELETE`);
  }
}
