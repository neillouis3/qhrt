// ============================================================================
// GET /api/admin/personal-programs — list personal implementation programs (admin)
// POST /api/admin/personal-programs — create a new program
// ============================================================================

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { requireAdmin } from '@/lib/adminAuth';
import { supabaseServer } from '@/lib/supabaseClient';
import { apiError } from '@/lib/apiError';

export async function GET(request: NextRequest) {
  const authCheck = await requireAdmin(request);
  if (authCheck) return authCheck;

  try {
    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get('activeOnly') === 'true';
    const search = searchParams.get('search')?.trim() ?? '';

    let query = supabaseServer.from('personal_implementation_programs').select('*');
    if (activeOnly) {
      query = query.eq('is_active', true);
    }
    if (search) {
      query = query.ilike('name', `%${search}%`);
    }
    query = query.order('name', { ascending: true });

    const { data, error } = await query;
    if (error) {
      return apiError(error, '[api/admin/personal-programs] GET');
    }

    return NextResponse.json({ personal_programs: data ?? [] }, { status: 200 });
  } catch (err) {
    console.error('[api/admin/personal-programs] GET error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const authCheck = await requireAdmin(request);
  if (authCheck) return authCheck;

  try {
    const body = await request.json();
    const { name, description, functional_domain_id, delivery_content } = body as {
      name?: string;
      description?: string;
      functional_domain_id?: string;
      delivery_content?: Record<string, unknown>;
    };

    if (!name?.trim()) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    const { data, error } = await supabaseServer
      .from('personal_implementation_programs')
      .insert({
        name: name.trim(),
        description: description ?? null,
        functional_domain_id: functional_domain_id ?? null,
        delivery_content: delivery_content ?? {},
      })
      .select()
      .single();

    if (error) {
      return apiError(error, '[api/admin/personal-programs] POST');
    }

    return NextResponse.json({ success: true, program: data }, { status: 201 });
  } catch (err) {
    console.error('[api/admin/personal-programs] POST error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
