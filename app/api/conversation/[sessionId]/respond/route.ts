import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { requireUser } from '@/lib/adminAuth';
import { createUserClient } from '@/lib/supabaseClient';
import { processResponse } from '@/lib/conversationEngine';

/**
 * POST — Submit a response and receive the next prompt.
 * body: { prompt_id: string, response_value: string }
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
      .select('id, knowledge_model_id, user_id, status')
      .eq('id', sessionId)
      .single();

    if (convError || !conversation) {
      return NextResponse.json({ error: 'Conversation not found' }, { status: 404 });
    }

    if (conversation.user_id !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (conversation.status === 'completed') {
      return NextResponse.json({ error: 'Conversation is already completed' }, { status: 400 });
    }

    const body = await request.json();
    const { prompt_id, response_value } = body as {
      prompt_id?: string;
      response_value?: string;
    };

    if (!prompt_id || !response_value) {
      return NextResponse.json(
        { error: 'prompt_id and response_value are required' },
        { status: 400 }
      );
    }

    const state = await processResponse(sessionId, prompt_id, response_value, db);

    if (!state) {
      return NextResponse.json({ error: 'Failed to process response' }, { status: 500 });
    }

    return NextResponse.json({ state });
  } catch (err) {
    console.error('[api/conversation/respond] POST error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
