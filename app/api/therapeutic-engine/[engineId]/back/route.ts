// ============================================================================
// POST /api/therapeutic-engine/[engineId]/back
// Returns to the previous phase.
// ============================================================================

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { requireUser } from '@/lib/adminAuth';
import { createUserClient } from '@/lib/supabaseClient';
import { getEngineSessionState, transitionToPreviousPhase } from '@/lib/therapeuticEngine';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ engineId: string }> }
) {
  const userResult = await requireUser(request);
  if (userResult instanceof NextResponse) return userResult;
  if (!userResult) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { engineId } = await params;
    const db = createUserClient(request);

    const state = await getEngineSessionState(engineId, db);
    if (!state) {
      return NextResponse.json({ error: 'Engine not found.' }, { status: 404 });
    }
    if (state.engine.user_id !== userResult.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    if (state.engine.status === 'paused') {
      return NextResponse.json(
        { error: 'Engine is paused. Resume before going back.' },
        { status: 400 }
      );
    }

    const result = await transitionToPreviousPhase(engineId, db);
    if (!result.success) {
      return NextResponse.json({ error: result.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, message: result.message, state: result.newState });
  } catch (err) {
    console.error('[API] POST /therapeutic-engine/[engineId]/back error:', err);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
