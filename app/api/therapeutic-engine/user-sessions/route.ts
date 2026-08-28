// ============================================================================
// GET /api/therapeutic-engine/user-sessions
// Returns all therapeutic engine sessions for the current authenticated user.
// ============================================================================

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { requireUser } from '@/lib/adminAuth';
import { createUserClient } from '@/lib/supabaseClient';
import { getEnginesByUserId } from '@/lib/therapeuticEngine';

export async function GET(request: NextRequest) {
  const userResult = await requireUser(request);
  if (userResult instanceof NextResponse) return userResult;
  if (!userResult) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const engines = await getEnginesByUserId(userResult.user.id, createUserClient(request));
    return NextResponse.json({ therapeutic_engines: engines }, { status: 200 });
  } catch (err) {
    console.error('[api/therapeutic-engine/user-sessions] GET error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
