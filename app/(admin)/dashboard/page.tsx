/**
 * Admin Dashboard
 * Overview stats, recent users, and quick actions.
 * Filtering/sorting/pagination for the full user list lives on /users.
 */

'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useSession, clearSessionCache } from '@/hooks/useSession';

interface AdminStats {
  totalUsers: number;
  intakeCompleted: number;
  sessionsCompleted: number;
}

interface RecentUser {
  id: string;
  email: string;
  role: string;
  intake_completed: boolean;
  sessions_completed: number;
  created_at: string;
}

export default function AdminDashboard() {
  // Use shared session hook - no redundant /api/auth/session fetch
  const { session } = useSession();
  const router = useRouter();
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 0,
    intakeCompleted: 0,
    sessionsCompleted: 0,
  });
  const [recentUsers, setRecentUsers] = useState<RecentUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [loggingOut, setLoggingOut] = useState(false);

  const handleLogout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      await fetch('/api/auth/logout', { method: 'POST' });
    } catch {
      // Even if the request fails, clear the local cache and redirect.
    } finally {
      clearSessionCache();
      router.push('/auth/login');
      router.refresh();
    }
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch admin stats and recent users in parallel (session already handled by useSession)
        const [statsRes, usersRes] = await Promise.all([
          fetch('/api/admin/stats'),
          fetch('/api/admin/users?limit=5'),
        ]);

        if (statsRes.ok) {
          const statsData = await statsRes.json();
          setStats(statsData);
        }

        if (usersRes.ok) {
          const usersData = await usersRes.json();
          setRecentUsers(usersData.users ?? []);
        }
      } catch (err) {
        console.error('[AdminDashboard] Error fetching data:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Prefer the user's display name from Supabase user_metadata (set at signup
  // or via profile update); fall back to the local part of the email.
  const metaName =
    typeof session?.user?.user_metadata?.full_name === 'string'
      ? (session.user.user_metadata.full_name as string)
      : typeof session?.user?.user_metadata?.name === 'string'
        ? (session.user.user_metadata.name as string)
        : null;
  const displayName = metaName || session?.user?.email?.split('@')[0] || 'Admin';
  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening';

  const statCards = [
    {
      label: 'Total Users',
      value: stats.totalUsers,
      icon: (
        <svg
          className="h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z"
          />
        </svg>
      ),
      color: 'from-primary to-primary-light',
    },
    {
      label: 'Intake Completed',
      value: `${stats.intakeCompleted}`,
      icon: (
        <svg
          className="h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
      color: 'from-accent to-emerald-400',
    },
    {
      label: 'Sessions Completed',
      value: stats.sessionsCompleted,
      icon: (
        <svg
          className="h-6 w-6"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={1.5}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
      color: 'from-blue-500 to-indigo-500',
    },
  ];

  if (loading) {
    return (
      <div className="flex flex-col flex-1 items-center justify-center bg-zinc-50 font-sans dark:bg-navy">
        <div className="flex flex-col items-center gap-4 py-32">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-muted">Loading dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 bg-zinc-50 font-sans dark:bg-navy">
      {/* Top gradient bar */}
      <div className="h-1 w-full bg-gradient-to-r from-primary via-accent to-primary-light" />

      <div className="flex flex-1 w-full max-w-6xl mx-auto px-6 py-10">
        <div className="w-full">
          {/* Header */}
          <div className="mb-10 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-semibold text-navy dark:text-white tracking-tight">
                {greeting}, {displayName}
              </h1>
              <p className="mt-1 text-muted">
                QHRT Admin Dashboard — Overview &amp; user management
              </p>
            </div>
            <button
              onClick={handleLogout}
              disabled={loggingOut}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-lg border border-border bg-white px-5 text-sm font-medium text-muted transition-all hover:border-primary hover:text-primary disabled:opacity-60 dark:border-navy dark:bg-navy-light/30 dark:text-muted dark:hover:border-primary/60 dark:hover:text-primary-light"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18"
                />
              </svg>
              {loggingOut ? 'Logging out…' : 'Logout'}
            </button>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-3 gap-5 mb-10">
            {statCards.map((stat) => (
              <div
                key={stat.label}
                className="group relative overflow-hidden rounded-2xl border border-border bg-white p-6 shadow-sm transition-all duration-300 hover:shadow-lg hover:shadow-primary/10 dark:border-navy/50 dark:bg-navy-light/20 dark:hover:border-primary/40"
              >
                {/* Gradient accent */}
                <div className={`absolute inset-x-0 top-0 h-1 bg-gradient-to-r ${stat.color}`} />

                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs font-medium uppercase tracking-wider text-muted">
                      {stat.label}
                    </p>
                    <p className="mt-2 text-4xl font-bold text-navy dark:text-white tracking-tight">
                      {typeof stat.value === 'number' ? stat.value : stat.value}
                    </p>
                  </div>
                  <div
                    className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${stat.color} text-white shadow-sm`}
                  >
                    {stat.icon}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Recent Users Table */}
            <div className="lg:col-span-2 rounded-2xl border border-border bg-white shadow-sm dark:border-navy/50 dark:bg-navy-light/20">
              <div className="flex items-center justify-between px-6 py-5 border-b border-border dark:border-navy">
                <h2 className="text-lg font-semibold text-navy dark:text-white">Recent Users</h2>
                <Link
                  href="/users"
                  className="text-sm font-medium text-primary hover:text-primary-light dark:text-primary-light dark:hover:text-primary transition-colors"
                >
                  View all &rarr;
                </Link>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border dark:border-navy">
                      <th className="text-left px-6 py-3 text-xs font-medium uppercase tracking-wider text-muted">
                        Email
                      </th>
                      <th className="text-left px-6 py-3 text-xs font-medium uppercase tracking-wider text-muted">
                        Role
                      </th>
                      <th className="text-left px-6 py-3 text-xs font-medium uppercase tracking-wider text-muted">
                        Intake
                      </th>
                      <th className="text-left px-6 py-3 text-xs font-medium uppercase tracking-wider text-muted">
                        Sessions
                      </th>
                      <th className="text-left px-6 py-3 text-xs font-medium uppercase tracking-wider text-muted">
                        Joined
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border dark:divide-navy">
                    {recentUsers.length > 0 ? (
                      recentUsers.map((u) => (
                        <tr
                          key={u.id}
                          className="hover:bg-accent-lighter/30 dark:hover:bg-primary/5 transition-colors"
                        >
                          <td className="px-6 py-4 font-medium text-navy dark:text-white">
                            {u.email}
                          </td>
                          <td className="px-6 py-4">
                            <span
                              className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                                u.role === 'admin'
                                  ? 'bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary-light'
                                  : 'bg-muted/10 text-muted dark:bg-navy dark:text-muted'
                              }`}
                            >
                              {u.role}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            {u.intake_completed ? (
                              <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
                                <svg
                                  className="h-4 w-4"
                                  fill="none"
                                  viewBox="0 0 24 24"
                                  stroke="currentColor"
                                  strokeWidth={2}
                                >
                                  <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    d="M5 13l4 4L19 7"
                                  />
                                </svg>
                                Done
                              </span>
                            ) : (
                              <span className="text-amber-600 dark:text-amber-400">Pending</span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-muted dark:text-muted">
                            {u.sessions_completed}
                          </td>
                          <td className="px-6 py-4 text-muted dark:text-muted">
                            {new Date(u.created_at).toLocaleDateString()}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan={5} className="px-6 py-12 text-center text-muted">
                          No users found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="rounded-2xl border border-border bg-white shadow-sm dark:border-navy/50 dark:bg-navy-light/20">
              <div className="px-6 py-5 border-b border-border dark:border-navy">
                <h2 className="text-lg font-semibold text-navy dark:text-white">Quick Actions</h2>
              </div>
              <div className="p-6 flex flex-col gap-3">
                {[
                  {
                    label: 'Manage Users',
                    href: '/users',
                    icon: (
                      <svg
                        className="h-5 w-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={1.5}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z"
                        />
                      </svg>
                    ),
                  },
                  {
                    label: 'Manage Content',
                    href: '/content',
                    icon: (
                      <svg
                        className="h-5 w-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={1.5}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z"
                        />
                      </svg>
                    ),
                  },
                  {
                    label: 'View Analytics',
                    href: '/analytics',
                    icon: (
                      <svg
                        className="h-5 w-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={1.5}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z"
                        />
                      </svg>
                    ),
                  },
                ].map((action) => (
                  <Link
                    key={action.label}
                    href={action.href}
                    className="flex items-center gap-3 rounded-xl border border-border bg-accent-lighter/20 px-4 py-3.5 text-sm font-medium text-navy transition-all hover:border-primary hover:bg-accent-lighter hover:text-primary dark:border-navy dark:text-white dark:hover:border-primary/60 dark:hover:bg-primary/10"
                  >
                    <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary-light text-white shadow-sm">
                      {action.icon}
                    </span>
                    {action.label}
                  </Link>
                ))}
              </div>

              {/* System status */}
              <div className="mx-6 mb-6 mt-2 rounded-xl border border-border bg-accent-lighter/40 p-4 dark:border-navy dark:bg-primary/5">
                <div className="flex items-center gap-2">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
                  </span>
                  <span className="text-sm font-medium text-emerald-700 dark:text-emerald-400">
                    System Operational
                  </span>
                </div>
                <p className="mt-1 ml-[14px] text-xs text-muted">All services responding</p>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-12 pb-6 text-center text-xs text-muted">
            &copy; {new Date().getFullYear() + ' '} QHRT Admin Panel — Built with Next.js &amp;
            Supabase
          </div>
        </div>
      </div>
    </div>
  );
}
