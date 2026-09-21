import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createUserClient } from '@/lib/supabaseClient';
import { requireUser } from '@/lib/adminAuth';
import { listUserConversations } from '@/lib/conversationEngine';
import { getEnginesByUserId } from '@/lib/therapeuticEngine';
import { buildHomeActivity } from '@/lib/homeActivity';
import { buildHomeDiaryStats } from '@/lib/diaryStats';
import { buildHomeTutorial } from '@/lib/homeTutorial';
import { pickHomeNext } from '@/lib/homeNext';
import { practiceTimeFromUser } from '@/lib/userSettings';
import { buildGentlePresence } from '@/lib/gentlePresence';
import { pinnedFromUserMetadata } from '@/lib/pinnedPractices';
import { presenceDaysFromUserMetadata } from '@/lib/presenceDays';
import { buildCheckInWeek } from '@/lib/homeCheckInHistory';
import { homeCheckInFromUser } from '@/lib/userSettings';

/**
 * GET — next step for Home, plus intake progress.
 */
export async function GET(request: NextRequest) {
  const userResult = await requireUser(request);
  if (userResult instanceof NextResponse) return userResult;
  if (!userResult) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const userId = userResult.user.id;
  const db = createUserClient(request);

  try {
    const [progressRes, conversations, engines, assessmentsRes, submissionsRes, diaryRes] = await Promise.all([
      db.from('user_progress').select('intake_completed').eq('user_id', userId).maybeSingle(),
      listUserConversations(userId, db),
      getEnginesByUserId(userId, db),
      db
        .from('assessments')
        .select('id, slug, title, description')
        .eq('is_active', true)
        .order('display_order', { ascending: true }),
      db.from('assessment_submissions').select('assessment_id').eq('user_id', userId),
      db
        .from('diary_entries')
        .select('entry_date, mood, created_at')
        .eq('user_id', userId)
        .order('entry_date', { ascending: false })
        .limit(120),
    ]);

    const domainIds = [
      ...new Set(
        engines
          .map((engine) => engine.functional_domain_protocol_id)
          .filter((id): id is string => Boolean(id))
      ),
    ];
    const domainsRes =
      domainIds.length > 0
        ? await db.from('functional_domain_protocols').select('id, name').in('id', domainIds)
        : { data: [] as Array<{ id: string; name: string }> };

    const domainName = new Map(
      (domainsRes.data ?? []).map((row: { id: string; name: string }) => [row.id, row.name])
    );

    const submissions = submissionsRes.error ? [] : (submissionsRes.data ?? []);
    const takenIds = new Set(submissions.map((s: { assessment_id: string }) => s.assessment_id));
    const nextAssessment =
      (assessmentsRes.error ? [] : (assessmentsRes.data ?? [])).find(
        (a: { id: string }) => !takenIds.has(a.id)
      ) ?? null;

    const intakeCompleted = Boolean(progressRes.data?.intake_completed);
    const journeyRows = engines.map((engine) => ({
      id: engine.id,
      status: engine.status,
      current_phase_order: engine.current_phase_order,
      created_at: engine.created_at,
      updated_at: engine.updated_at,
      domain_name: engine.functional_domain_protocol_id
        ? domainName.get(engine.functional_domain_protocol_id) ?? null
        : null,
    }));
    const next = pickHomeNext({
      intakeCompleted,
      conversations,
      journeys: journeyRows,
      nextAssessment,
      practiceTime: practiceTimeFromUser(userResult.user) || null,
    });

    const activity = buildHomeActivity({
      conversations,
      journeys: journeyRows,
      excludeHref: next.kind === 'resume-session' || next.kind === 'resume-journey' ? next.href : null,
    });

    const diaryEntries = diaryRes.error ? [] : (diaryRes.data ?? []);
    const diaryStats = buildHomeDiaryStats(diaryEntries);

    const tutorial = buildHomeTutorial({
      intakeCompleted,
      assessmentsCompleted: submissions.length,
      journeys: journeyRows,
      diaryCount: diaryStats.totalEntries,
    });

    const userMeta = (userResult.user.user_metadata ?? {}) as Record<string, unknown>;
    const gentlePresence = buildGentlePresence({
      diaryEntryDates: diaryEntries.map((row: { entry_date: string }) => row.entry_date),
      sessionTimestamps: conversations.flatMap((conv) => [conv.updated_at, conv.started_at]),
      journeyTimestamps: journeyRows.flatMap((j) => [j.updated_at, j.created_at]),
      extraDates: presenceDaysFromUserMetadata(userMeta),
    });
    const pins = pinnedFromUserMetadata(userMeta);
    const checkInWeek = homeCheckInFromUser(userResult.user)
      ? buildCheckInWeek(userMeta)
      : [];

    return NextResponse.json(
      {
        progress: progressRes.data ?? null,
        next,
        activity,
        tutorial,
        diaryStats,
        gentlePresence,
        pins,
        checkInWeek,
      },
      { status: 200 }
    );
  } catch (err) {
    console.error('[api/user/dashboard] GET error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
