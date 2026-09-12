import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { requireUser } from '@/lib/adminAuth';
import { createUserClient } from '@/lib/supabaseClient';
import { goBackToPreviousPrompt } from '@/lib/conversationEngine';

/**
 * POST — Undo the latest response and return to the previous prompt.
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
    const { data: conversation, error: convError } = await db
      .from('conversations')
      .select('id, user_id, status')
      .eq('id', sessionId)
      .single();

    if (convError || !conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    if (conversation.user_id !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const state = await goBackToPreviousPrompt(sessionId, db);
    if (!state) {
      return NextResponse.json({ error: 'Failed to go back' }, { status: 500 });
    }

    return NextResponse.json({ state });
  } catch (err) {
    console.error('[api/conversation/back] POST error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
