import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { requireUser } from '@/lib/adminAuth';
import { apiError } from '@/lib/apiError';
import { createUserClient, supabaseServer } from '@/lib/supabaseClient';
import { parseDiaryPayload } from '@/lib/diary';
import { buildCheckInByDate, checkInsFromMap } from '@/lib/checkInDiaryMerge';
import { backfillCheckInsToDiary } from '@/lib/homeCheckInDiary';
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

    const [entriesRes, conversationsRes, enginesRes, domainsRes, assessmentsRes, submissionsRes] = await Promise.all([
      db
        .from('diary_entries')
        .select('*')
        .eq('user_id', userId)
        .order('entry_date', { ascending: false })
        .order('created_at', { ascending: false }),
      db
        .from('conversations')
        .select('id, completed_at, knowledge_models(name)')
        .eq('user_id', userId)
        .eq('status', 'completed')
        .not('completed_at', 'is', null),
      db
        .from('therapeutic_engines')
        .select('id, status, updated_at, functional_domain_protocol_id')
        .eq('user_id', userId)
        .eq('status', 'completed'),
      db.from('functional_domain_protocols').select('id, name'),
      db
        .from('assessment_results')
        .select('id, condition_id, answered_at, conditions(name)')
        .eq('user_id', userId)
        .order('answered_at', { ascending: false }),
      db
        .from('assessment_submissions')
        .select('id, created_at, assessments(title)')
        .eq('user_id', userId)
        .order('created_at', { ascending: false }),
    ]);

    if (entriesRes.error) {
      const code = entriesRes.error.code;
      const message = entriesRes.error.message ?? '';
      const tableMissing =
        code === 'PGRST205' || code === '42P01' || message.includes('diary_entries');
      if (!tableMissing) return apiError(entriesRes.error, '[api/diary] entries');
    }

    const domainNames = new Map(
      (domainsRes.data ?? []).map((row: { id: string; name: string }) => [row.id, row.name])
    );

    const completions: DiaryCompletion[] = [];

    for (const conv of conversationsRes.data ?? []) {
      const nested = conv.knowledge_models as { name?: string } | { name?: string }[] | null;
      const name = Array.isArray(nested) ? nested[0]?.name : nested?.name;
      completions.push({
        id: conv.id,
        kind: 'conversation',
        title: name || 'Conversation',
        at: conv.completed_at as string,
      });
    }

    for (const engine of enginesRes.data ?? []) {
      const domainName = engine.functional_domain_protocol_id
        ? domainNames.get(engine.functional_domain_protocol_id)
        : null;
      completions.push({
        id: engine.id,
        kind: 'journey',
        title: domainName || 'Wellness journey',
        at: engine.updated_at as string,
      });
    }

    const seenAssessments = new Set<string>();
    for (const row of assessmentsRes.data ?? []) {
      const stamp = row.answered_at as string;
      const key = `${row.condition_id}:${stamp}`;
      if (seenAssessments.has(key)) continue;
      seenAssessments.add(key);
      const nested = row.conditions as { name?: string } | { name?: string }[] | null;
      const name = Array.isArray(nested) ? nested[0]?.name : nested?.name;
      completions.push({
        id: row.id,
        kind: 'assessment',
        title: name ? `${name} assessment` : 'Assessment',
        at: stamp,
      });
    }

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
