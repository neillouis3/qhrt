import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { supabaseServer } from '@/lib/supabaseClient';
import { apiError } from '@/lib/apiError';

/**
 * Public endpoint — returns a single condition with its symptoms and assessment questions.
 * No auth required.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ conditionId: string }> }
) {
  try {
    const { conditionId } = await params;

    // Fetch the condition with category info
    const { data: condition, error: condError } = await supabaseServer
      .from('conditions')
      .select(
        `
        *,
        condition_categories (id, name, description)
      `
      )
      .eq('id', conditionId)
      .single();

    if (condError || !condition) {
      return NextResponse.json({ error: 'Condition not found' }, { status: 404 });
    }

    // Fetch active symptoms for this condition
    const { data: symptoms, error: sympError } = await supabaseServer
      .from('condition_symptoms')
      .select('*')
      .eq('condition_id', conditionId)
      .eq('is_active', true)
      .order('display_order', { ascending: true });

    if (sympError) {
      return apiError(sympError, '[api/conditions/:id] symptoms');
    }

    // Fetch active assessment questions for this condition
    const { data: questions, error: qError } = await supabaseServer
      .from('assessment_questions')
      .select('*')
      .eq('condition_id', conditionId)
      .eq('is_active', true)
      .order('display_order', { ascending: true });

    if (qError) {
      return apiError(qError, '[api/conditions/:id] questions');
    }

    // Fetch progress metrics for this condition
    const { data: metrics, error: mError } = await supabaseServer
      .from('progress_metrics')
      .select('*')
      .eq('condition_id', conditionId)
      .eq('is_active', true)
      .order('display_order', { ascending: true });

    if (mError) {
      return apiError(mError, '[api/conditions/:id] metrics');
    }

    return NextResponse.json(
      {
        condition: {
          ...condition,
          symptoms: symptoms ?? [],
          assessment_questions: questions ?? [],
          progress_metrics: metrics ?? [],
        },
      },
      { status: 200 }
    );
  } catch (err) {
    console.error('[api/conditions/[id]] GET error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
