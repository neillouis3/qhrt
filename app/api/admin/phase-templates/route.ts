// ============================================================================
// GET /api/admin/phase-templates — list phase templates (admin)
// POST /api/admin/phase-templates — create/update a phase template
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

    let query = supabaseServer.from('phase_templates').select('*');
    if (activeOnly) {
      query = query.eq('is_active', true);
    }
    if (search) {
      query = query.ilike('name', `%${search}%`);
    }
    query = query.order('phase_order', { ascending: true });

    const { data, error } = await query;
    if (error) {
      return apiError(error, '[api/admin/phase-templates] GET');
    }

    return NextResponse.json({ phase_templates: data ?? [] }, { status: 200 });
  } catch (err) {
    console.error('[api/admin/phase-templates] GET error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const authCheck = await requireAdmin(request);
  if (authCheck) return authCheck;

  try {
    const body = await request.json();
    const {
      id,
      phase_order,
      phase_key,
      name,
      description,
      client_script,
      practitioner_protocol,
      transition_rule_description,
      is_active,
    } = body as {
      id?: string;
      phase_order?: number;
      phase_key?: string;
      name?: string;
      description?: string;
      client_script?: string;
      practitioner_protocol?: string;
      transition_rule_description?: string;
      is_active?: boolean;
    };

    // If id provided, update existing template
    if (id) {
      const { data, error } = await supabaseServer
        .from('phase_templates')
        .update({
          phase_order,
          phase_key,
          name: name?.trim() || null,
          description: description ?? null,
          client_script: client_script ?? null,
          practitioner_protocol: practitioner_protocol ?? null,
          transition_rule_description: transition_rule_description ?? null,
          is_active: is_active ?? true,
        })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        return apiError(error, '[api/admin/phase-templates] POST (update)');
      }

      return NextResponse.json({ success: true, template: data }, { status: 200 });
    }

    // Otherwise create new
    if (!name?.trim() || !phase_order || !phase_key) {
      return NextResponse.json(
        { error: 'Name, phase_order, and phase_key are required' },
        { status: 400 }
      );
    }

    const { data, error } = await supabaseServer
      .from('phase_templates')
      .insert({
        phase_order,
        phase_key: phase_key.trim(),
        name: name.trim(),
        description: description ?? null,
        client_script: client_script ?? null,
        practitioner_protocol: practitioner_protocol ?? null,
        transition_rule_description: transition_rule_description ?? null,
      })
      .select()
      .single();

    if (error) {
      return apiError(error, '[api/admin/phase-templates] POST (create)');
    }

    return NextResponse.json({ success: true, template: data }, { status: 201 });
  } catch (err) {
    console.error('[api/admin/phase-templates] POST error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
