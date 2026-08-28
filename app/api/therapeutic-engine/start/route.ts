// ============================================================================
// POST /api/therapeutic-engine/start
// Starts a new therapeutic engine session with modular content composition.
// body: { functional_domain_protocol_id, aee_id?, personal_program_id? }
// ============================================================================

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { requireUser } from '@/lib/adminAuth';
import { createUserClient } from '@/lib/supabaseClient';
import { initializeEngine } from '@/lib/therapeuticEngine';

export async function POST(request: NextRequest) {
  const userResult = await requireUser(request);
  if (userResult instanceof NextResponse) return userResult;
  if (!userResult) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const userId = userResult.user.id;

  try {
    const body = await request.json();
    const { functional_domain_protocol_id, aee_id, personal_program_id } = body as {
      functional_domain_protocol_id?: string;
      aee_id?: string;
      personal_program_id?: string;
    };

    if (!functional_domain_protocol_id) {
      return NextResponse.json(
        { error: 'functional_domain_protocol_id is required' },
        { status: 400 }
      );
    }

    const result = await initializeEngine(
      userId,
      {
        functional_domain_protocol_id,
        aee_id,
        personal_program_id,
      },
      createUserClient(request)
    );

    if (!result) {
      return NextResponse.json(
        {
          error:
            'Failed to initialize engine. Check that all referenced content exists and is active.',
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      {
        engine_id: result.id,
        engine: result,
      },
      { status: 201 }
    );
  } catch (err) {
    console.error('[api/therapeutic-engine/start] POST error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
