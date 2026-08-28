import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { requireUser } from '@/lib/adminAuth';
import { createUserClient } from '@/lib/supabaseClient';
import { completeConversation } from '@/lib/conversationEngine';

/**
 * POST — Complete a conversation explicitly.
 */
export async function POST(
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
      .select('id, user_id')
      .eq('id', sessionId)
      .single();

    if (convError || !conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    if (conversation.user_id !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const result = await completeConversation(sessionId, db);

    if (!result) {
      return NextResponse.json({ error: 'Failed to complete conversation' }, { status: 500 });
    }

    return NextResponse.json(result);
  } catch (err) {
    console.error('[api/conversation/complete] POST error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
