/**
 * Admin Analytics API
 * Extended stats for the /analytics dashboard — user engagement, ratings, stress trends, etc.
 */

import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { supabaseServer } from '@/lib/supabaseClient';
import { requireAdmin } from '@/lib/adminAuth';

// ---------------------------------------------------------------------------
// Helper: build a date range array (ISO date strings)
// ---------------------------------------------------------------------------

function getDateRange(days: number): string[] {
  const dates: string[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    dates.push(d.toISOString().slice(0, 10));
  }
  return dates;
}

// ---------------------------------------------------------------------------
// GET — full analytics payload
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest) {
  const authCheck = await requireAdmin(request);
  if (authCheck) return authCheck;

  try {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    // ---- Parallelise ALL independent queries --------------------------------
    // First, get all admin user IDs to exclude them from stats
    const { data: adminUsers } = await supabaseServer
      .from('user_roles')
      .select('user_id')
      .eq('role', 'admin');

    const adminUserIds = new Set(adminUsers?.map((u: { user_id: string }) => u.user_id) ?? []);

    // Helper to filter out admin rows from user_progress data
    const excludeAdmins = <T extends Record<string, unknown>>(rows: T[]): T[] =>
      rows.filter((r) => !adminUserIds.has(r['user_id'] as string));

    // Fetch ALL auth users via admin API (same pattern as /api/admin/users)
    // This gives us created_at which lives in auth.users, not user_roles
    const { data: allAuthUsersData } = await supabaseServer.auth.admin.listUsers({
      perPage: 1000,
    });
    const allAuthUsers = allAuthUsersData?.users ?? [];

    // Build a role lookup so we can filter out admins from auth users
    const { data: allRoles } = await supabaseServer.from('user_roles').select('user_id, role');
    const roleMap: Record<string, string> = {};
    for (const r of allRoles ?? []) {
      roleMap[r.user_id as string] = r.role as string;
    }

    // Filter auth users: exclude admins
    const nonAdminAuthUsers = allAuthUsers.filter(
      (u: { id: string; created_at?: string }) => roleMap[u.id] !== 'admin'
    );

    const [
      sessions30d,
      moodLogs30d,
      ratingsData,
      stressData,
      activeUsers7d,
      activeUsers30d,
      intakeCompleted,
      sessionsCompleted,
    ] = await Promise.all([
      // Sessions completed per day (last 30 days) — filter admins client-side
      (async () => {
        const { data, error } = await supabaseServer
          .from('user_progress')
          .select('user_id, last_session_date, sessions_completed')
          .not('last_session_date', 'is', null)
          .gte('last_session_date', thirtyDaysAgo.toISOString());
        return error ? [] : excludeAdmins(data);
      })(),

      // Mood logs (last 30 days) — filter admins client-side
      (async () => {
        try {
          const { data, error } = await supabaseServer
            .from('mood_logs')
            .select('mood_score, logged_at, user_id')
            .gte('logged_at', thirtyDaysAgo.toISOString())
            .order('logged_at', { ascending: true });
          if (error || !data) return null;
          return excludeAdmins(data);
        } catch {
          return null;
        }
      })(),

      // Session ratings distribution — filter admins client-side
      (async () => {
        try {
          const { data, error } = await supabaseServer
            .from('session_ratings')
            .select('rating, user_id')
            .not('rating', 'is', null);
          if (error || !data) return null;
          return excludeAdmins(data);
        } catch {
          return null;
        }
      })(),

      // Stress metrics (avg before/after per user) — filter admins client-side
      (async () => {
        const { data, error } = await supabaseServer
          .from('user_progress')
          .select('user_id, avg_stress_before, avg_stress_after')
          .not('avg_stress_before', 'is', null);
        if (error || !data) return [];
        return excludeAdmins(data);
      })(),

      // Active users last 7 days — filter admins client-side
      (async () => {
        try {
          const { data, error } = await supabaseServer
            .from('user_progress')
            .select('user_id')
            .gte('last_session_date', sevenDaysAgo.toISOString());
          if (error || !data) return 0;
          return excludeAdmins(data).length;
        } catch {
          return 0;
        }
      })(),

      // Active users last 30 days — filter admins client-side
      (async () => {
        try {
          const { data, error } = await supabaseServer
            .from('user_progress')
            .select('user_id')
            .gte('last_session_date', thirtyDaysAgo.toISOString());
          if (error || !data) return 0;
          return excludeAdmins(data).length;
        } catch {
          return 0;
        }
      })(),

      // Intake completed — filter admins client-side
      (async () => {
        const { data, error } = await supabaseServer
          .from('user_progress')
          .select('user_id')
          .eq('intake_completed', true);
        if (error || !data) return 0;
        return excludeAdmins(data).length;
      })(),

      // Total sessions completed (sum) — filter admins client-side
      (async () => {
        const { data, error } = await supabaseServer
          .from('user_progress')
          .select('user_id, sessions_completed')
          .not('sessions_completed', 'is', null);
        if (error || !data) return 0;
        const filtered = excludeAdmins(data) as Array<{
          user_id: string;
          sessions_completed: number;
        }>;
        return filtered.reduce((sum, r) => sum + (r.sessions_completed ?? 0), 0);
      })(),
    ]);

    // Flatten results from async wrappers
    const sessions30dFlat = sessions30d as Array<{
      user_id: string;
      last_session_date: string;
      sessions_completed: number;
    }>;
    const stressDataFlat = stressData as Array<{
      user_id: string;
      avg_stress_before: number | null;
      avg_stress_after: number | null;
    }>;

    // ---- Process signups per day (from auth.users.created_at) ---------------
    const signupDates = getDateRange(30);
    const signupsByDay = signupDates.map((date) => {
      const count = nonAdminAuthUsers.filter((u: { id: string; created_at?: string }) => {
        if (!u.created_at) return false;
        const userDate = new Date(u.created_at).toISOString().slice(0, 10);
        return userDate === date;
      }).length;
      return { date, count };
    });

    // ---- Process sessions per day ------------------------------------------
    const sessionDates = getDateRange(30);
    const sessionsByDay = sessionDates.map((date) => {
      const count = sessions30dFlat.filter(
        (r: { last_session_date: string }) =>
          new Date(r.last_session_date).toISOString().slice(0, 10) === date
      ).length;
      return { date, count };
    });

    // ---- Process mood trend (daily avg over 30 days) -----------------------
    const moodByDay = (() => {
      if (!moodLogs30d || !Array.isArray(moodLogs30d)) return null;
      const grouped: Record<string, number[]> = {};
      for (const row of moodLogs30d as Array<{ mood_score: number; logged_at: string }>) {
        const date = new Date(row.logged_at).toISOString().slice(0, 10);
        if (!grouped[date]) grouped[date] = [];
        grouped[date].push(row.mood_score as number);
      }
      return signupDates.map((date) => {
        const scores = grouped[date] ?? [];
        const avg = scores.length
          ? Math.round((scores.reduce((a, b) => a + b, 0) / scores.length) * 100) / 100
          : null;
        return { date, avg_mood: avg };
      });
    })();

    // ---- Process ratings distribution --------------------------------------
    const ratingDistribution = (() => {
      if (!ratingsData || !Array.isArray(ratingsData)) return null;
      const typedRatings = ratingsData as Array<{ rating: number; user_id: string }>;
      const dist: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
      let total = 0;
      for (const row of typedRatings) {
        const r = Math.round(row.rating);
        if (r >= 1 && r <= 5) {
          dist[r] = (dist[r] ?? 0) + 1;
          total++;
        }
      }
      if (total === 0) return null;
      const avgRating = typedRatings.reduce((sum, r) => sum + r.rating, 0) / typedRatings.length;
      return { distribution: dist, total, avgRating: Math.round(avgRating * 100) / 100 };
    })();

    // ---- Process stress reduction ------------------------------------------
    const stressReduction = (() => {
      if (!stressDataFlat.length) return null;
      const valid = stressDataFlat.filter(
        (r: { avg_stress_before: number | null; avg_stress_after: number | null }) =>
          r.avg_stress_before != null && r.avg_stress_after != null
      );
      if (!valid.length) return null;
      const avgBefore =
        valid.reduce((sum, r) => sum + (r.avg_stress_before as number), 0) / valid.length;
      const avgAfter =
        valid.reduce((sum, r) => sum + (r.avg_stress_after as number), 0) / valid.length;
      const reductionPercent = Math.round(((avgBefore - avgAfter) / avgBefore) * 10000) / 100;
      return {
        avgBefore: Math.round(avgBefore * 100) / 100,
        avgAfter: Math.round(avgAfter * 100) / 100,
        reductionPercent,
        userCount: valid.length,
      };
    })();

    // ---- Total sessions sum (already computed as a number) ------------------
    const totalSessionsSum = sessionsCompleted as number;

    return NextResponse.json(
      {
        // Overview
        totalUsers: nonAdminAuthUsers.length,
        totalSessions: totalSessionsSum,
        intakeCompleted: intakeCompleted as number,
        activeUsers7d,
        activeUsers30d,

        // Trends (last 30 days)
        signupsByDay,
        sessionsByDay,
        moodByDay,

        // Ratings & feedback
        ratingDistribution,

        // Stress metrics
        stressReduction,
      },
      { status: 200 }
    );
  } catch (err) {
    console.error('[admin/analytics] Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
