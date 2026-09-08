import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { requireUser } from '@/lib/adminAuth';
import { apiError } from '@/lib/apiError';
import { createUserClient } from '@/lib/supabaseClient';
import { parseDiaryPayload } from '@/lib/diary';

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const userResult = await requireUser(request);
  if (userResult instanceof NextResponse) return userResult;
  if (!userResult) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  if (!id) return NextResponse.json({ error: 'Missing note' }, { status: 400 });

  try {
    const parsed = parseDiaryPayload(await request.json());
    if ('error' in parsed) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    const { data, error } = await createUserClient(request)
      .from('diary_entries')
      .update({
        entry_date: parsed.entryDate,
        title: parsed.title,
        body: parsed.body,
        mood: parsed.mood,
        updated_at: new Date().toISOString(),
      })
      .eq('id', id)
      .eq('user_id', userResult.user.id)
      .select('*')
      .maybeSingle();

    if (error) return apiError(error, '[api/diary] PATCH');
    if (!data) return NextResponse.json({ error: 'Note not found' }, { status: 404 });
    return NextResponse.json({ entry: data });
  } catch (err) {
    return apiError(err, '[api/diary] PATCH');
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const userResult = await requireUser(request);
  if (userResult instanceof NextResponse) return userResult;
  if (!userResult) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  if (!id) return NextResponse.json({ error: 'Missing note' }, { status: 400 });

  try {
    const { data, error } = await createUserClient(request)
      .from('diary_entries')
      .delete()
      .eq('id', id)
      .eq('user_id', userResult.user.id)
      .select('id')
      .maybeSingle();

    if (error) return apiError(error, '[api/diary] DELETE');
    if (!data) return NextResponse.json({ error: 'Note not found' }, { status: 404 });
    return NextResponse.json({ success: true });
  } catch (err) {
    return apiError(err, '[api/diary] DELETE');
  }
}
