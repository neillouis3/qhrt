import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { requireUser } from '@/lib/adminAuth';
import { createUserClient } from '@/lib/supabaseClient';
import { startConversation } from '@/lib/conversationEngine';

/**
 * POST — Start a new conversation with a Knowledge Model.
 * body: { knowledge_model_id: string }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ modelId: string }> }
) {
  const userResult = await requireUser(request);
  if (userResult instanceof NextResponse) return userResult;
  if (!userResult) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const userId = userResult.user.id;
  const { modelId } = await params;

  try {
    // Allow body override, but default to the URL param
    let knowledgeModelId = modelId;
    try {
      const body = await request.json();
      if (body?.knowledge_model_id) {
        knowledgeModelId = body.knowledge_model_id;
      }
    } catch {
      // No body — use URL param
    }

    if (!knowledgeModelId) {
      return NextResponse.json({ error: 'knowledge_model_id is required' }, { status: 400 });
    }

    const result = await startConversation(userId, knowledgeModelId, createUserClient(request));

    if (!result) {
      return NextResponse.json(
        { error: 'Failed to start conversation. Knowledge Model may not exist or be inactive.' },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        conversation_id: result.conversationId,
        state: result.state,
      },
      { status: 201 }
    );
  } catch (err) {
    console.error('[api/conversation/start] POST error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
