import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createUserClient } from '@/lib/supabaseClient';
import { requireUser } from '@/lib/adminAuth';
import { apiError } from '@/lib/apiError';
/**
 * POST — save assessment results for a user's selected condition.
 * body: { conditionId, answers: [{ questionId, answerValue }] }
 */
export async function POST(request: NextRequest) {
  const userResult = await requireUser(request);
  if (userResult instanceof NextResponse) return userResult;
  if (!userResult) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const userId = userResult.user.id;
  const db = createUserClient(request);

  try {
    const body = await request.json();
    const { conditionId, answers } = body as {
      conditionId?: string;
      answers?: Array<{ questionId: string; answerValue: number }>;
    };

    if (!conditionId || !answers || !Array.isArray(answers) || answers.length === 0) {
      return NextResponse.json(
        { error: 'conditionId and answers array are required' },
        { status: 400 }
      );
    }

    // Validate each answer has required fields
    for (const ans of answers) {
      if (!ans.questionId || ans.answerValue === undefined || ans.answerValue === null) {
        return NextResponse.json(
          { error: 'Each answer must have questionId and answerValue' },
          { status: 400 }
        );
      }
    }

    const now = new Date().toISOString();
    const insertRows = answers.map((ans) => ({
      user_id: userId,
      condition_id: conditionId,
      question_id: ans.questionId,
      answer_value: ans.answerValue,
      answered_at: now,
    }));

    const { data, error } = await db.from('assessment_results').insert(insertRows).select(`
        *,
        assessment_questions (id, question_text, minimum_value, maximum_value)
      `);

    if (error) {
      return apiError(error, '[api/user/assessment-results] POST');
    }

    return NextResponse.json({ success: true, results: data ?? [] }, { status: 201 });
  } catch (err) {
    console.error('[api/user/assessment-results] POST error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
