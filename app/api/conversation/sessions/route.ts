import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { requireUser } from '@/lib/adminAuth';
import { createUserClient } from '@/lib/supabaseClient';
import { listUserConversations } from '@/lib/conversationEngine';

/**
 * GET — List all conversations for the authenticated user.
 */
export async function GET(request: NextRequest) {
  const userResult = await requireUser(request);
  if (userResult instanceof NextResponse) return userResult;
  if (!userResult) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const userId = userResult.user.id;

  try {
    const conversations = await listUserConversations(userId, createUserClient(request));
    return NextResponse.json({ conversations });
  } catch (err) {
    console.error('[api/conversation/sessions] GET error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
