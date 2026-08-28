import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { requireUser } from '@/lib/adminAuth';
import { createUserClient } from '@/lib/supabaseClient';
import { getConversationState, loadKnowledgeModel } from '@/lib/conversationEngine';

/**
 * GET — Get the current state of a conversation.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const userResult = await requireUser(request);
  if (userResult instanceof NextResponse) return userResult;
  if (!userResult) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const userId = userResult.user.id;
  const { sessionId } = await params;
  const db = createUserClient(request);

  try {
    // Verify ownership (RLS scopes this to the caller's own conversations)
    const { data: conversation, error: convError } = await db
      .from('conversations')
      .select('id, knowledge_model_id, user_id')
      .eq('id', sessionId)
      .single();

    if (convError || !conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    if (conversation.user_id !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const km = await loadKnowledgeModel(conversation.knowledge_model_id, db);
    if (!km) {
      return NextResponse.json({ error: 'Knowledge Model not found' }, { status: 404 });
    }

    const state = await getConversationState(sessionId, km, db);

    if (!state) {
      return NextResponse.json({ error: 'Failed to load conversation state' }, { status: 500 });
    }

    return NextResponse.json({ state });
  } catch (err) {
    console.error('[api/conversation/state] GET error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
