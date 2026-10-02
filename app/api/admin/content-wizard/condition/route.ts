import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { supabaseServer } from '@/lib/supabaseClient';
import { requireAdmin } from '@/lib/adminAuth';
import { apiError } from '@/lib/apiError';
import type { ConditionWizardPayload } from '@/lib/admin/contentWizardTypes';

export async function POST(request: NextRequest) {
  const authCheck = await requireAdmin(request);
  if (authCheck) return authCheck;

  let conditionId: string | null = null;

  try {
    const body = (await request.json()) as ConditionWizardPayload;
    const conditionName = body.condition?.name?.trim();
    if (!conditionName) {
      return NextResponse.json({ error: 'Condition name is required' }, { status: 400 });
    }
    if (!Array.isArray(body.questions) || body.questions.length === 0) {
      return NextResponse.json({ error: 'Add at least one assessment question' }, { status: 400 });
    }

    let categoryId = body.category_id?.trim() || '';
    if (!categoryId && body.new_category?.name?.trim()) {
      const { data: category, error: catError } = await supabaseServer
        .from('condition_categories')
        .insert({
          name: body.new_category.name.trim(),
          description: body.new_category.description?.trim() || null,
          display_order: 0,
        })
        .select('id')
        .single();
      if (catError) throw catError;
      categoryId = category.id;
    }

    if (!categoryId) {
      return NextResponse.json(
        { error: 'Select a category or provide a new category name' },
        { status: 400 }
      );
    }

    const { data: condition, error: conditionError } = await supabaseServer
      .from('conditions')
      .insert({
        category_id: categoryId,
        name: conditionName,
        short_description: body.condition.short_description?.trim() || null,
        long_description: body.condition.long_description?.trim() || null,
        display_order: body.condition.display_order ?? 0,
        is_featured: body.condition.is_featured ?? false,
        is_active: true,
      })
      .select()
      .single();

    if (conditionError || !condition) {
      return apiError(conditionError, '[content-wizard/condition] condition');
    }
    conditionId = condition.id;

    const rows = body.questions.map((q, index) => {
      if (!q.question_text?.trim()) {
        throw new Error('Every question needs text');
      }
      return {
        condition_id: condition.id,
        question_text: q.question_text.trim(),
        scale_type: q.scale_type?.trim() || '0-10',
        minimum_value: q.minimum_value ?? 0,
        maximum_value: q.maximum_value ?? 10,
        display_order: q.display_order ?? index,
      };
    });

    const { error: questionsError } = await supabaseServer.from('assessment_questions').insert(rows);
    if (questionsError) throw questionsError;

    return NextResponse.json(
      {
        success: true,
        category_id: categoryId,
        condition,
        questions_created: rows.length,
      },
      { status: 201 }
    );
  } catch (err) {
    if (conditionId) {
      await supabaseServer.from('conditions').delete().eq('id', conditionId);
    }
    console.error('[content-wizard/condition] POST error:', err);
    const message = err instanceof Error ? err.message : 'Internal server error';
    if (message === 'Every question needs text') {
      return NextResponse.json({ error: message }, { status: 400 });
    }
    return apiError(err, '[content-wizard/condition] POST');
  }
}
