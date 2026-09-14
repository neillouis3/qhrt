// ============================================================================
// GET /api/therapeutic-engine/[engineId]
// Returns full engine session state for a user's therapeutic engine.
// ============================================================================

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { requireUser } from '@/lib/adminAuth';
import { createUserClient } from '@/lib/supabaseClient';
import { apiError } from '@/lib/apiError';
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

/**
 * DELETE — Remove a journey and its phases/observations.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ engineId: string }> }
) {
  const userResult = await requireUser(request);
  if (userResult instanceof NextResponse) return userResult;
  if (!userResult) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const userId = userResult.user.id;
  const { engineId } = await params;
  if (!engineId) return NextResponse.json({ error: 'Missing journey' }, { status: 400 });

  try {
    const db = createUserClient(request);
    const { data, error } = await db
      .from('therapeutic_engines')
      .delete()
      .eq('id', engineId)
      .eq('user_id', userId)
      .select('id')
      .maybeSingle();

    if (error) return apiError(error, '[api/therapeutic-engine] DELETE');
    if (!data) return NextResponse.json({ error: 'Journey not found' }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (err) {
    return apiError(err, '[api/therapeutic-engine] DELETE');
  }
}
