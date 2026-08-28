// ============================================================================
// GET /api/therapeutic-engine/personal-programs
// Returns active personal implementation programs for the current authenticated user.
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
    const { searchParams } = new URL(request.url);
    const functionalDomainId = searchParams.get('functionalDomainId');

    let query = createUserClient(request)
      .from('personal_implementation_programs')
      .select('*')
      .eq('is_active', true)
      .order('name', { ascending: true });

    if (functionalDomainId) {
      query = query.eq('functional_domain_id', functionalDomainId);
    }

    const { data, error } = await query;

    if (error) {
      return apiError(error, '[api/therapeutic-engine/personal-programs] GET');
    }

    return NextResponse.json({ personal_programs: data ?? [] }, { status: 200 });
  } catch (err) {
    console.error('[api/therapeutic-engine/personal-programs] GET error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
