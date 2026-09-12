import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { requireUser } from '@/lib/adminAuth';
import { createUserClient } from '@/lib/supabaseClient';
import { apiError } from '@/lib/apiError';

/**
 * DELETE — Remove a conversation session and its responses.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ sessionId: string }> }
) {
  const userResult = await requireUser(request);
  if (userResult instanceof NextResponse) return userResult;
  if (!userResult) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const userId = userResult.user.id;
  const { sessionId } = await params;
  if (!sessionId) return NextResponse.json({ error: 'Missing session' }, { status: 400 });

  try {
    const db = createUserClient(request);
    const { data, error } = await db
      .from('conversations')
      .delete()
      .eq('id', sessionId)
      .eq('user_id', userId)
      .select('id')
      .maybeSingle();

    if (error) return apiError(error, '[api/conversation] DELETE');
    if (!data) return NextResponse.json({ error: 'Session not found' }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (err) {
    return apiError(err, '[api/conversation] DELETE');
  }
}
