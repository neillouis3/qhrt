// ============================================================================
// GET /api/therapeutic-engine/[engineId]
// Returns full engine session state for a user's therapeutic engine.
// ============================================================================

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { requireUser } from '@/lib/adminAuth';
import { createUserClient } from '@/lib/supabaseClient';
import { getEngineSessionState } from '@/lib/therapeuticEngine';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ engineId: string }> }
) {
  const userResult = await requireUser(request);
  if (userResult instanceof NextResponse) return userResult;
  if (!userResult) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { engineId } = await params;
    const db = createUserClient(request);

    // Get engine state (RLS scopes to caller's own engines)
    const state = await getEngineSessionState(engineId, db);
    if (!state) {
      return NextResponse.json({ error: 'Engine not found.' }, { status: 404 });
    }

    // Verify ownership
    if (state.engine.user_id !== userResult.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json({ state });
  } catch (err) {
    console.error('[API] GET /therapeutic-engine/[engineId] error:', err);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
