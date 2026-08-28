// ============================================================================
// POST /api/therapeutic-engine/[engineId]/observations
// Saves structured observations for a specific phase.
// ============================================================================

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { requireUser } from '@/lib/adminAuth';
import { createUserClient } from '@/lib/supabaseClient';
import { getEngineSessionState, saveObservation } from '@/lib/therapeuticEngine';
import type { SaveObservationRequest } from '@/lib/types/therapeutic-engine';

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

    // Parse request body
    const body = await request.json();
    const requestData: SaveObservationRequest = {
      phase_order: body.phase_order ?? state.engine.current_phase_order,
      immediate_expression_change: body.immediate_expression_change || null,
      implementation_status: body.implementation_status || null,
      remaining_organizational_uncertainty: body.remaining_organizational_uncertainty || null,
      another_cycle_required: body.another_cycle_required ?? false,
      domain_specific_observations: body.domain_specific_observations || null,
      client_reflection: body.client_reflection || null,
    };

    // Save observation
    const result = await saveObservation(engineId, requestData, db);
    if (!result.success) {
      return NextResponse.json({ error: result.message }, { status: 400 });
    }

    return NextResponse.json({ success: true, message: result.message });
  } catch (err) {
    console.error('[API] POST /therapeutic-engine/[engineId]/observations error:', err);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}
