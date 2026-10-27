import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createUserClient } from '@/lib/supabaseClient';
import { requireUser } from '@/lib/adminAuth';
import { buildHomeActivity, buildHomeTutorial, pickHomeNext } from '@/lib/home';
import { buildHomeDiaryStats } from '@/lib/diaryStats';
import { practiceTimeFromUser, homeCheckInFromUser } from '@/lib/userSettings';
import { buildGentlePresence } from '@/lib/gentlePresence';
import { pinnedFromUserMetadata } from '@/lib/pinnedPractices';
import { buildCheckInWeek, homeCheckInDayFromUser, presenceDaysFromUserMetadata } from '@/lib/homeCheckIn';

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
    const [progressRes, assessmentsRes, submissionsRes, diaryRes] = await Promise.all([
      db.from('user_progress').select('intake_completed').eq('user_id', userId).maybeSingle(),
      db
        .from('assessments')
        .select('id, slug, title, description')
        .eq('is_active', true)
        .order('display_order', { ascending: true }),
      db
        .from('assessment_submissions')
        .select('id, created_at, assessment_id, assessments(slug, title)')
        .eq('user_id', userId)
        .order('created_at', { ascending: false }),
      db
        .from('diary_entries')
        .select('entry_date, mood, created_at')
        .eq('user_id', userId)
        .order('entry_date', { ascending: false })
        .limit(120),
    ]);

    const submissions = submissionsRes.error ? [] : (submissionsRes.data ?? []);
    const takenIds = new Set(submissions.map((s: { assessment_id: string }) => s.assessment_id));
    const nextAssessment =
      (assessmentsRes.error ? [] : (assessmentsRes.data ?? [])).find(
        (a: { id: string }) => !takenIds.has(a.id)
      ) ?? null;

    const intakeCompleted = Boolean(progressRes.data?.intake_completed);
    const next = pickHomeNext({
      intakeCompleted,
      nextAssessment,
      practiceTime: practiceTimeFromUser(userResult.user) || null,
    });

    const activityRows = submissions.map((row) => {
      const nested = row.assessments as { slug?: string; title?: string } | { slug?: string; title?: string }[] | null;
      const meta = Array.isArray(nested) ? nested[0] : nested;
      return {
        id: row.id as string,
        slug: meta?.slug || '',
        title: meta?.title || 'Assessment',
        created_at: row.created_at as string,
      };
    }).filter((row) => row.slug);

    const activity = buildHomeActivity({
      submissions: activityRows,
      excludeHref: next.kind === 'assessment' ? next.href : null,
    });

    const diaryEntries = diaryRes.error ? [] : (diaryRes.data ?? []);
    const diaryStats = buildHomeDiaryStats(diaryEntries);

    const tutorial = buildHomeTutorial({
      intakeCompleted,
      assessmentsCompleted: submissions.length,
      diaryCount: diaryStats.totalEntries,
    });

    const userMeta = (userResult.user.user_metadata ?? {}) as Record<string, unknown>;
    const gentlePresence = buildGentlePresence({
      diaryEntryDates: diaryEntries.map((row: { entry_date: string }) => row.entry_date),
      activityTimestamps: activityRows.map((row) => row.created_at),
      extraDates: presenceDaysFromUserMetadata(userMeta),
    });
    const pins = pinnedFromUserMetadata(userMeta);
    const checkInWeek = homeCheckInFromUser(userResult.user)
      ? buildCheckInWeek(userMeta)
      : [];
    const checkIn = homeCheckInDayFromUser(userResult.user);

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
        checkIn,
      },
      { status: 200 }
    );
  } catch (err) {
    console.error('[api/user/dashboard] GET error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
