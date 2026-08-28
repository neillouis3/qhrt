import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { supabaseServer } from '@/lib/supabaseClient';
import { requireAdmin } from '@/lib/adminAuth';
import { apiError } from '@/lib/apiError';
import { rateLimit } from '@/lib/rateLimiter';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface UserEntry {
  id: string;
  email: string;
  role: string;
  intake_completed: boolean;
  sessions_completed: number;
  created_at: string;
}

// ---------------------------------------------------------------------------
// GET — list users with pagination, search, filter & sort
// ---------------------------------------------------------------------------

export async function GET(request: NextRequest) {
  const authCheck = await requireAdmin(request);
  if (authCheck) return authCheck;

  try {
    const { searchParams } = new URL(request.url);
    // Cap at 1000 — the admin users page fetches the full dataset client-side
    // (limit=1000) and filters/sorts/paginates in the browser.
    const limit = Math.min(parseInt(searchParams.get('limit') ?? '10', 10) || 10, 1000);
    const page = parseInt(searchParams.get('page') ?? '1', 10) || 1;
    const offset = (page - 1) * limit;
    const search = searchParams.get('search') ?? '';
    const roleFilter = searchParams.get('role') ?? 'all';
    const intakeFilter = searchParams.get('intake') ?? 'all';
    const sortBy = searchParams.get('sortBy') ?? 'created_at';
    const sortOrder = searchParams.get('sortOrder') ?? 'desc';

    // 1. Fetch ALL user_roles (we filter in JS for search — auth users aren't in the same table)
    const { data: allRoles, error: rolesErr } = await supabaseServer
      .from('user_roles')
      .select('user_id, role');

    if (rolesErr) {
      return apiError(rolesErr, '[api/admin/users] GET roles');
    }

    // 2. Fetch ALL auth users (admin API — needed for email search)
    const { data: adminUsersData } = await supabaseServer.auth.admin.listUsers({
      perPage: 1000,
    });
    const allAuthUsers = adminUsersData?.users ?? [];

    // Build a lookup map for auth info
    const authMap: Record<string, { email: string; created_at: string }> = {};
    for (const u of allAuthUsers as Array<{ id: string; email?: string; created_at?: string }>) {
      authMap[u.id] = {
        email: u.email ?? '',
        created_at: u.created_at ?? new Date().toISOString(),
      };
    }

    // 3. Fetch ALL progress data
    const { data: allProgress } = await supabaseServer
      .from('user_progress')
      .select('user_id, intake_completed, sessions_completed');

    const progressMap: Record<string, { intake_completed?: boolean; sessions_completed?: number }> =
      {};
    if (allProgress) {
      for (const p of allProgress as Array<{
        user_id: string;
        intake_completed?: boolean;
        sessions_completed?: number;
      }>) {
        progressMap[p.user_id] = p;
      }
    }

    // 4. Merge into flat user objects
    let users: UserEntry[] = ((allRoles as Array<{ user_id: string; role: string }>) ?? []).map(
      (r) => {
        const info = authMap[r.user_id] ?? { email: '', created_at: new Date().toISOString() };
        const progress = progressMap[r.user_id] ?? {};
        return {
          id: r.user_id,
          email: info.email,
          role: r.role,
          intake_completed: progress.intake_completed ?? false,
          sessions_completed: progress.sessions_completed ?? 0,
          created_at: info.created_at,
        };
      }
    );

    // 5. Apply filters (role, intake)
    if (roleFilter !== 'all') {
      users = users.filter((u) => u.role === roleFilter);
    }
    if (intakeFilter === 'completed') {
      users = users.filter((u) => u.intake_completed);
    } else if (intakeFilter === 'pending') {
      users = users.filter((u) => !u.intake_completed);
    }

    // 6. Apply search (email substring match, case-insensitive)
    if (search.trim()) {
      const term = search.trim().toLowerCase();
      users = users.filter((u) => u.email.toLowerCase().includes(term));
    }

    // 7. Sort
    users.sort((a, b) => {
      let cmp = 0;
      if (sortBy === 'email') {
        cmp = a.email.localeCompare(b.email);
      } else if (sortBy === 'role') {
        cmp = a.role.localeCompare(b.role);
      } else if (sortBy === 'intake_completed') {
        cmp = Number(a.intake_completed) - Number(b.intake_completed);
      } else if (sortBy === 'sessions_completed') {
        cmp = a.sessions_completed - b.sessions_completed;
      } else {
        // default: created_at
        cmp = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      }
      return sortOrder === 'asc' ? cmp : -cmp;
    });

    // 8. Paginate
    const totalUsers = users.length;
    const totalPages = Math.ceil(totalUsers / limit);
    const paginated = users.slice(offset, offset + limit);

    return NextResponse.json(
      { users: paginated, pagination: { page, limit, totalUsers, totalPages } },
      { status: 200 }
    );
  } catch (err) {
    console.error('[api/admin/users] GET error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// PATCH — update a user's role  ({ userId, role })
// ---------------------------------------------------------------------------

export async function PATCH(request: NextRequest) {
  const authCheck = await requireAdmin(request);
  if (authCheck) return authCheck;

  try {
    const body = await request.json();
    const { userId, role } = body as { userId: string; role: string };

    if (!userId || !role) {
      return NextResponse.json({ error: 'userId and role are required' }, { status: 400 });
    }

    if (!['admin', 'user'].includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role. Must be "admin" or "user".' },
        { status: 400 }
      );
    }

    const { error: updateErr } = await supabaseServer
      .from('user_roles')
      .update({ role })
      .eq('user_id', userId);

    if (updateErr) {
      return apiError(updateErr, '[api/admin/users] PATCH');
    }

    return NextResponse.json(
      { success: true, message: `Role updated to "${role}"` },
      { status: 200 }
    );
  } catch (err) {
    console.error('[api/admin/users] PATCH error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// DELETE — delete a user from Supabase Auth + clean up related rows
//   body: { userId }
// ---------------------------------------------------------------------------

export async function DELETE(request: NextRequest) {
  const authCheck = await requireAdmin(request);
  if (authCheck) return authCheck;

  try {
    const body = await request.json();
    const { userId } = body as { userId: string };

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    // Delete from auth (cascades via trigger ideally, but we clean up manually too)
    const { error: authErr } = await supabaseServer.auth.admin.deleteUser(userId);
    if (authErr) {
      return apiError(authErr, '[api/admin/users] DELETE');
    }

    // Clean up related rows
    await Promise.all([
      supabaseServer.from('user_roles').delete().eq('user_id', userId),
      supabaseServer.from('user_progress').delete().eq('user_id', userId),
    ]);

    return NextResponse.json({ success: true, message: 'User deleted' }, { status: 200 });
  } catch (err) {
    console.error('[api/admin/users] DELETE error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

// ---------------------------------------------------------------------------
// POST — send password-reset email  ({ userId })
// ---------------------------------------------------------------------------

export async function POST(request: NextRequest) {
  const authCheck = await requireAdmin(request);
  if (authCheck) return authCheck;

  // Rate-limit password-reset requests (abuse vector: spamming recovery emails).
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? 'unknown';
  const rl = await rateLimit(ip, 'auth');
  if (!rl.success) {
    const retryAfter = rl.reset ? Math.max(1, Math.ceil((rl.reset - Date.now()) / 1000)) : 60;
    return NextResponse.json(
      { error: 'Too many requests. Please try again later.' },
      { status: 429, headers: { 'Retry-After': String(retryAfter) } }
    );
  }

  try {
    const body = await request.json();
    const { userId } = body as { userId: string };

    if (!userId) {
      return NextResponse.json({ error: 'userId is required' }, { status: 400 });
    }

    // Look up the user's email first
    const { data: userData, error: userErr } = await supabaseServer.auth.admin.getUserById(userId);

    if (userErr || !userData?.user?.email) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Send password-reset email (Supabase "recovery" link = password reset)
    const { error: resetErr } = await supabaseServer.auth.admin.generateLink({
      type: 'recovery',
      email: userData.user.email,
    });

    if (resetErr) {
      return apiError(resetErr, '[api/admin/users] POST reset');
    }

    return NextResponse.json(
      { success: true, message: `Password reset email sent to ${userData.user.email}` },
      { status: 200 }
    );
  } catch (err) {
    console.error('[api/admin/users] POST error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
