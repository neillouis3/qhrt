import { NextResponse } from 'next/server';
import { apiError, missingRelation, schemaMissingResponse } from '@/lib/apiError';
import { getActiveReadinessAssessment, toPublicAssessment } from '@/lib/assessments';

export async function GET() {
  const { assessment, error } = await getActiveReadinessAssessment();
  if (error) {
    if (missingRelation(error) || error.code === '42703' || error.code === 'PGRST204') {
      return schemaMissingResponse('Readiness', 'supabase/017_assessment_kind_and_readiness.sql');
    }
    return apiError(error, '[api/readiness] GET');
  }
  if (!assessment) {
    return NextResponse.json(
      { error: 'No active readiness check. Add one in Content with type Program readiness.' },
      { status: 404 }
    );
  }
  return NextResponse.json({ assessment: toPublicAssessment(assessment) });
}
