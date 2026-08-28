// ============================================================================
// POST /api/therapeutic-engine/[engineId]/transition
// Transitions to the next phase (with rule validation).
// ============================================================================

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { requireUser } from '@/lib/adminAuth';
import { createUserClient } from '@/lib/supabaseClient';
import { getEngineSessionState, transitionToNextPhase } from '@/lib/therapeuticEngine';

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

    // Verify ownership (RLS scopes to caller's own engines)
    const state = await getEngineSessionState(engineId, db);
    if (!state) {
      return NextResponse.json({ error: 'Engine not found.' }, { status: 404 });
    }
    if (state.engine.user_id !== userResult.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Check engine is not paused or completed
    if (state.engine.status === 'completed') {
      return NextResponse.json({ error: 'Engine has already been completed.' }, { status: 400 });
    }
    if (state.engine.status === 'paused') {
      return NextResponse.json(
        { error: 'Engine is paused. Resume before transitioning.' },
        { status: 400 }
      );
    }

    // Transition
    const result = await transitionToNextPhase(engineId, db);
    if (!result.success) {
      return NextResponse.json({ error: result.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, message: result.message, state: result.newState });
  } catch (err) {
    console.error('[API] POST /therapeutic-engine/[engineId]/transition error:', err);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
