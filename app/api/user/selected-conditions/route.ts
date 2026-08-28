import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createUserClient } from '@/lib/supabaseClient';
import { requireUser } from '@/lib/adminAuth';
import { apiError } from '@/lib/apiError';

/**
 * GET — list the authenticated user's selected conditions.
 * POST — select one or more conditions for the user.
 * PATCH — update a selection (e.g. deactivate).
 */

// ---------------------------------------------------------------------------
// GET — user's active selected conditions
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest) {
  const userResult = await requireUser(request);
  if (userResult instanceof NextResponse) return userResult;
  if (!userResult) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const userId = userResult.user.id;
  const db = createUserClient(request);

  try {
    const { data, error } = await db
      .from('user_selected_conditions')
      .select(
        `
        *,
        conditions (
          id,
          name,
          short_description,
          is_featured,
          condition_categories (id, name)
        )
      `
      )
      .eq('user_id', userId)
      .eq('is_active', true)
      .order('date_selected', { ascending: false });

    if (error) {
      return apiError(error, '[api/user/selected-conditions] GET');
    }

    return NextResponse.json({ selectedConditions: data ?? [] }, { status: 200 });
  } catch (err) {
    console.error('[api/user/selected-conditions] GET error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// POST — select conditions for the user
// body: { conditionIds: string[] }
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  const userResult = await requireUser(request);
  if (userResult instanceof NextResponse) return userResult;
  if (!userResult) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const userId = userResult.user.id;
  const db = createUserClient(request);

  try {
    const body = await request.json();
    const { conditionIds } = body as { conditionIds?: string[] };

    if (!conditionIds || !Array.isArray(conditionIds) || conditionIds.length === 0) {
      return NextResponse.json(
        { error: 'conditionIds array is required and must not be empty' },
        { status: 400 }
      );
    }

    // Upsert each condition selection
    const now = new Date().toISOString();
    const insertRows = conditionIds.map((conditionId: string) => ({
      user_id: userId,
      condition_id: conditionId,
      is_active: true,
      date_selected: now,
    }));

    const { data, error } = await db
      .from('user_selected_conditions')
      .upsert(insertRows, { onConflict: 'user_id,condition_id' }).select(`
        *,
        conditions (id, name, condition_categories (id, name))
      `);

    if (error) {
      return apiError(error, '[api/user/selected-conditions] POST');
    }

    // Mark intake as completed since user has selected conditions
    await db
      .from('user_progress')
      .upsert(
        { user_id: userId, intake_completed: true, intake_date: now },
        { onConflict: 'user_id' }
      );

    return NextResponse.json({ success: true, selectedConditions: data ?? [] }, { status: 200 });
  } catch (err) {
    console.error('[api/user/selected-conditions] POST error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// PATCH — update a selection (e.g. deactivate)
// body: { id: string, is_active: boolean }
// ---------------------------------------------------------------------------

export async function PATCH(request: NextRequest) {
  const userResult = await requireUser(request);
  if (userResult instanceof NextResponse) return userResult;
  if (!userResult) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const userId = userResult.user.id;
  const db = createUserClient(request);

  try {
    const body = await request.json();
    const { id, is_active } = body as { id?: string; is_active?: boolean };

    if (!id) {
      return NextResponse.json({ error: 'id is required' }, { status: 400 });
    }

    const update: Record<string, unknown> = {};
    if (is_active !== undefined) update.is_active = is_active;
    update.updated_at = new Date().toISOString();

    // Ensure user can only update their own selections
    const { data, error } = await db
      .from('user_selected_conditions')
      .update(update)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) {
      return apiError(error, '[api/user/selected-conditions] PATCH');
    }

    if (!data) {
      return NextResponse.json({ error: 'Selection not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true, selection: data }, { status: 200 });
  } catch (err) {
    console.error('[api/user/selected-conditions] PATCH error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
