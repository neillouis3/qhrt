import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { requireUser } from '@/lib/adminAuth';
import { apiError } from '@/lib/apiError';
import { createUserClient, supabaseServer } from '@/lib/supabaseClient';
import { parseDiaryPayload } from '@/lib/diary';
import { backfillCheckInsToDiary, buildCheckInByDate, checkInsFromMap } from '@/lib/homeCheckIn';
import type { DiaryCompletion, DiaryEntry } from '@/lib/types/diary';

export async function GET(request: NextRequest) {
  const userResult = await requireUser(request);
  if (userResult instanceof NextResponse) return userResult;
  if (!userResult) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const userId = userResult.user.id;
  const db = createUserClient(request);
  const userMeta = (userResult.user.user_metadata ?? {}) as Record<string, unknown>;

  try {
    if (userMeta.check_in_diary_backfill !== true) {
      try {
        await backfillCheckInsToDiary(db, userId, userMeta);
        await supabaseServer.auth.admin.updateUserById(userId, {
          user_metadata: { ...userMeta, check_in_diary_backfill: true },
        });
      } catch (backfillErr) {
        console.error('[api/diary] check-in backfill failed:', backfillErr);
      }
    }

    const [entriesRes, submissionsRes, moduleRes] = await Promise.all([
      db
        .from('diary_entries')
        .select('*')
        .eq('user_id', userId)
        .order('entry_date', { ascending: false })
        .order('created_at', { ascending: false }),
      db
        .from('assessment_submissions')
        .select('id, created_at, assessments(title)')
        .eq('user_id', userId)
        .order('created_at', { ascending: false }),
      db
        .from('module_lesson_completions')
        .select('id, completed_at, module_lessons(title, learning_modules(title))')
        .eq('user_id', userId)
        .order('completed_at', { ascending: false }),
    ]);

    if (entriesRes.error) {
      const code = entriesRes.error.code;
      const message = entriesRes.error.message ?? '';
      const tableMissing =
        code === 'PGRST205' || code === '42P01' || message.includes('diary_entries');
      if (!tableMissing) return apiError(entriesRes.error, '[api/diary] entries');
    }

    const completions: DiaryCompletion[] = [];

    for (const row of submissionsRes.error ? [] : (submissionsRes.data ?? [])) {
      const nested = row.assessments as { title?: string } | { title?: string }[] | null;
      const title = Array.isArray(nested) ? nested[0]?.title : nested?.title;
      completions.push({
        id: row.id,
        kind: 'assessment',
        title: title || 'Assessment',
        at: row.created_at as string,
      });
    }

    if (!moduleRes.error) {
      for (const row of moduleRes.data ?? []) {
        const nested = row.module_lessons as
          | { title?: string; learning_modules?: { title?: string } | { title?: string }[] }
          | { title?: string; learning_modules?: { title?: string } | { title?: string }[] }[]
          | null;
        const lesson = Array.isArray(nested) ? nested[0] : nested;
        const moduleNested = lesson?.learning_modules;
        const moduleTitle = Array.isArray(moduleNested) ? moduleNested[0]?.title : moduleNested?.title;
        completions.push({
          id: row.id,
          kind: 'module',
          title: lesson?.title || moduleTitle || 'Module',
          at: row.completed_at as string,
        });
      }
    }

    completions.sort((a, b) => b.at.localeCompare(a.at));

    const entries = ((entriesRes.error ? [] : entriesRes.data) ?? []) as DiaryEntry[];
    const checkInMap = buildCheckInByDate(userMeta, entries);

    return NextResponse.json({
      entries,
      completions,
      checkIns: checkInsFromMap(checkInMap),
    });
  } catch (err) {
    return apiError(err, '[api/diary] GET');
  }
}

export async function POST(request: NextRequest) {
  const userResult = await requireUser(request);
  if (userResult instanceof NextResponse) return userResult;
  if (!userResult) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  try {
    const parsed = parseDiaryPayload(await request.json());
    if ('error' in parsed) {
      return NextResponse.json({ error: parsed.error }, { status: 400 });
    }

    const { data, error } = await createUserClient(request)
      .from('diary_entries')
      .insert({
        user_id: userResult.user.id,
        entry_date: parsed.entryDate,
        title: parsed.title,
        body: parsed.body,
        mood: parsed.mood,
      })
      .select('*')
      .single();

    if (error) return apiError(error, '[api/diary] POST');
    return NextResponse.json({ entry: data }, { status: 201 });
  } catch (err) {
    return apiError(err, '[api/diary] POST');
  }
}
