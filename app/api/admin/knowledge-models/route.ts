import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { supabaseServer } from '@/lib/supabaseClient';
import { requireAdmin } from '@/lib/adminAuth';
import { apiError } from '@/lib/apiError';

// ---------------------------------------------------------------------------
// GET — list knowledge models
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest) {
  const authCheck = await requireAdmin(request);
  if (authCheck) return authCheck;

  try {
    const { searchParams } = new URL(request.url);
    const activeOnly = searchParams.get('activeOnly') === 'true';
    const search = searchParams.get('search')?.trim() ?? '';

    let query = supabaseServer.from('knowledge_models').select('*');

    if (activeOnly) {
      query = query.eq('is_active', true);
    }
    if (search) {
      query = query.ilike('name', `%${search}%`);
    }

    query = query.order('name', { ascending: true });

    const { data, error } = await query;

    if (error) {
      return apiError(error, '[api/admin/knowledge-models] GET');
    }

    return NextResponse.json({ knowledge_models: data ?? [] }, { status: 200 });
  } catch (err) {
    console.error('[api/admin/knowledge-models] GET error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// POST — create a new knowledge model
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  const authCheck = await requireAdmin(request);
  if (authCheck) return authCheck;

  try {
    const body = await request.json();
    const { name, description, version } = body as {
      name?: string;
      description?: string;
      version?: string;
    };

    if (!name?.trim()) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 });
    }

    const { data, error } = await supabaseServer
      .from('knowledge_models')
      .insert({
        name: name.trim(),
        description: description ?? null,
        version: version ?? '1.0',
      })
      .select()
      .single();

    if (error) {
      return apiError(error, '[api/admin/knowledge-models] POST');
    }

    return NextResponse.json({ success: true, knowledge_model: data }, { status: 201 });
  } catch (err) {
    console.error('[api/admin/knowledge-models] POST error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
