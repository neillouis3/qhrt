// ============================================================================
// GET /api/admin/therapeutic-engines — list all engines (admin)
// POST /api/admin/therapeutic-engines — not used (engines are created by users)
// ============================================================================

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { requireAdmin } from '@/lib/adminAuth';
import { getAllEngines } from '@/lib/therapeuticEngine';

export async function GET(request: NextRequest) {
  const authCheck = await requireAdmin(request);
  if (authCheck) return authCheck;

  try {
    const search = new URL(request.url).searchParams.get('search')?.trim() ?? '';
    let engines = await getAllEngines();

    if (search) {
      // No natural text column — filter by id (partial match)
      const term = search.toLowerCase();
      engines = engines.filter((e) => e.id.toLowerCase().includes(term));
    }

    return NextResponse.json({ therapeutic_engines: engines }, { status: 200 });
  } catch (err) {
    console.error('[api/admin/therapeutic-engines] GET error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
