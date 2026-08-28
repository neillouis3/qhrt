// ============================================================================
// GET /api/admin/aee — list AEE entries (admin)
// POST /api/admin/aee — create a new AEE entry
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

    let query = supabaseServer.from('archetypal_emotional_energetics').select('*');
    if (activeOnly) {
      query = query.eq('is_active', true);
    }
    if (search) {
      query = query.ilike('name', `%${search}%`);
    }
    query = query.order('name', { ascending: true });

    const { data, error } = await query;
    if (error) {
      return apiError(error, '[api/admin/aee] GET');
    }

    return NextResponse.json({ aee_entries: data ?? [] }, { status: 200 });
  } catch (err) {
    console.error('[api/admin/aee] GET error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const authCheck = await requireAdmin(request);
  if (authCheck) return authCheck;

  try {
    const body = await request.json();
    const { name, description, resolution_prompts } = body as {
      name?: string;
      description?: string;
      resolution_prompts?: Record<string, unknown>;
    };

    if (!name?.trim()) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    const { data, error } = await supabaseServer
      .from('archetypal_emotional_energetics')
      .insert({
        name: name.trim(),
        description: description ?? null,
        resolution_prompts: resolution_prompts ?? {},
      })
      .select()
      .single();

    if (error) {
      return apiError(error, '[api/admin/aee] POST');
    }

    return NextResponse.json({ success: true, aee_entry: data }, { status: 201 });
  } catch (err) {
    console.error('[api/admin/aee] POST error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
