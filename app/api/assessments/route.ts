import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { requireUser } from '@/lib/adminAuth';
import { apiError } from '@/lib/apiError';
import { supabaseServer } from '@/lib/supabaseClient';
import type { AssessmentSummary } from '@/lib/assessments/types';

/** GET — active assessments with the caller's latest completion date. */
export async function GET(request: NextRequest) {
  const userResult = await requireUser(request);
  if (userResult instanceof NextResponse) return userResult;
  if (!userResult) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const [assessmentsRes, submissionsRes] = await Promise.all([
    supabaseServer
      .from('assessments')
      .select('id, slug, title, description, cover_image, questions')
      .eq('is_active', true)
      .order('display_order', { ascending: true })
      .order('created_at', { ascending: true }),
    supabaseServer
      .from('assessment_submissions')
      .select('assessment_id, created_at')
      .eq('user_id', userResult.user.id)
      .order('created_at', { ascending: false }),
  ]);

  if (assessmentsRes.error) return apiError(assessmentsRes.error, '[api/assessments] GET');

  const lastByAssessment = new Map<string, string>();
  for (const s of submissionsRes.data ?? []) {
    if (!lastByAssessment.has(s.assessment_id)) lastByAssessment.set(s.assessment_id, s.created_at);
  }

  const assessments: AssessmentSummary[] = (assessmentsRes.data ?? []).map((a) => ({
    id: a.id,
    slug: a.slug,
    title: a.title,
    description: a.description,
    cover_image: a.cover_image,
    questionCount: Array.isArray(a.questions) ? a.questions.length : 0,
    lastCompletedAt: lastByAssessment.get(a.id) ?? null,
  }));

  return NextResponse.json({ assessments });
}
