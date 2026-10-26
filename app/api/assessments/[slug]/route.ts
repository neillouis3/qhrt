import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { requireUser } from '@/lib/adminAuth';
import { apiError } from '@/lib/apiError';
import { supabaseServer } from '@/lib/supabaseClient';
import {
  getActiveAssessmentBySlug,
  toPublicAssessment,
  withWorkbooks,
  type AssessmentEvaluation,
} from '@/lib/assessments';

/** GET — assessment questions (without scores) plus the caller's latest result. */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const userResult = await requireUser(request);
  if (userResult instanceof NextResponse) return userResult;
  if (!userResult) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { slug } = await params;
  const { assessment, error } = await getActiveAssessmentBySlug(slug);
  if (error) return apiError(error, '[api/assessments/slug] GET');
  if (!assessment) return NextResponse.json({ error: 'Assessment not found' }, { status: 404 });

  const { data: last } = await supabaseServer
    .from('assessment_submissions')
    .select('result, created_at')
    .eq('user_id', userResult.user.id)
    .eq('assessment_id', assessment.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  const lastResult = last
    ? await withWorkbooks(last.result as AssessmentEvaluation, last.created_at)
    : null;

  return NextResponse.json({ assessment: toPublicAssessment(assessment), lastResult });
}
