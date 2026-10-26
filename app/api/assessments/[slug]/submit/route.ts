import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { requireUser } from '@/lib/adminAuth';
import { apiError } from '@/lib/apiError';
import { supabaseServer } from '@/lib/supabaseClient';
import {
  evaluateAssessment,
  getActiveAssessmentBySlug,
  validateAnswers,
  withWorkbooks,
} from '@/lib/assessments';

/** POST — score answers, save the submission, and return workbook routing. */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const userResult = await requireUser(request);
  if (userResult instanceof NextResponse) return userResult;
  if (!userResult) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { slug } = await params;
  const { assessment, error } = await getActiveAssessmentBySlug(slug);
  if (error) return apiError(error, '[api/assessments/submit] load');
  if (!assessment) return NextResponse.json({ error: 'Assessment not found' }, { status: 404 });

  const body = (await request.json().catch(() => null)) as { answers?: unknown } | null;
  const { answers, errors } = validateAnswers(assessment.questions, body?.answers);
  if (errors.length > 0) {
    return NextResponse.json({ error: errors[0], errors }, { status: 400 });
  }

  const evaluation = evaluateAssessment(assessment, answers);

  const { data: saved, error: insertError } = await supabaseServer
    .from('assessment_submissions')
    .insert({
      user_id: userResult.user.id,
      assessment_id: assessment.id,
      answers,
      result: evaluation,
    })
    .select('created_at')
    .single();
  if (insertError) return apiError(insertError, '[api/assessments/submit] insert');

  const result = await withWorkbooks(evaluation, saved.created_at);
  return NextResponse.json({ result }, { status: 201 });
}
