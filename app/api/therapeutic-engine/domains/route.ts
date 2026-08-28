// ============================================================================
// GET /api/therapeutic-engine/domains
// Returns active functional domain protocols for the current authenticated user.
// ============================================================================

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { requireUser } from '@/lib/adminAuth';
import { createUserClient } from '@/lib/supabaseClient';
import { apiError } from '@/lib/apiError';

export async function GET(request: NextRequest) {
  const userResult = await requireUser(request);
  if (userResult instanceof NextResponse) return userResult;
  if (!userResult) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const { data, error } = await createUserClient(request)
      .from('functional_domain_protocols')
      .select('*')
      .eq('is_active', true)
      .order('name', { ascending: true });

    if (error) {
      return apiError(error, '[api/therapeutic-engine/domains] GET');
    }

    return NextResponse.json({ functional_domain_protocols: data ?? [] }, { status: 200 });
  } catch (err) {
    console.error('[api/therapeutic-engine/domains] GET error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
