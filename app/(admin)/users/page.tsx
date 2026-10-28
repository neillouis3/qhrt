/**
 * Admin users — account funnel, KPIs, and the full user table.
 */

'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  Button,
  Dropdown,
  Input,
  Label,
  Pagination,
  Table,
  Typography,
} from '@heroui/react';
import type { SortDescriptor } from '@heroui/react';
import Modal from '@/components/ui/Modal';
import AppCard from '@/components/ui/AppCard';
import FieldSelect from '@/components/ui/FieldSelect';
import { PageHeader } from '@/components/layout/UserPageShell';
import { DashboardBodySkeleton } from '@/components/layout/PageSkeleton';
import UserPageShell from '@/components/layout/UserPageShell';

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

interface PaginationInfo {
  page: number;
  limit: number;
  totalUsers: number;
  totalPages: number;
}

interface ApiResponse {
  users: UserEntry[];
  pagination: PaginationInfo;
}

type SortField = 'email' | 'role' | 'intake_completed' | 'sessions_completed' | 'created_at';

interface AdminStats {
  totalUsers: number;
  intakeCompleted: number;
  sessionsCompleted: number;
  avgStressBefore: number | null;
  avgStressAfter: number | null;
  avgRating: number | null;
  activeUsers7d: number;
}

const EMPTY_STATS: AdminStats = {
  totalUsers: 0,
  intakeCompleted: 0,
  sessionsCompleted: 0,
  avgStressBefore: null,
  avgStressAfter: null,
  avgRating: null,
  activeUsers7d: 0,
};

function pct(part: number, whole: number): string {
  if (whole <= 0) return '—';
  return `${Math.round((part / whole) * 100)}%`;
}

function formatNum(value: number | null | undefined, digits = 0): string {
  if (value == null || Number.isNaN(value)) return '—';
  return value.toLocaleString(undefined, {
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  });
}

function Sparkline({ values }: { values: number[] }) {
  if (values.length < 2) return null;
  const max = Math.max(...values, 1);
  const min = Math.min(...values, 0);
  const width = 88;
  const height = 28;
  const span = max - min || 1;
  const points = values
    .map((value, index) => {
      const x = (index / (values.length - 1)) * width;
      const y = height - ((value - min) / span) * height;
      return `${x},${y}`;
    })
    .join(' ');
  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="h-7 w-[5.5rem] text-foreground" aria-hidden>
      <polyline
        points={points}
        fill="none"
        stroke="currentColor"
        strokeWidth="1.75"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}

function StatCard({
  label,
  value,
  hint,
  spark,
  active,
  onPress,
}: {
  label: string;
  value: string;
  hint?: string;
  spark?: number[];
  active?: boolean;
  onPress?: () => void;
}) {
  const className = `flex w-full flex-col gap-3 rounded-lg bg-default/30 p-5 text-left transition-colors ${
    active ? 'ring-1 ring-foreground/25' : onPress ? 'hover:bg-default/45' : ''
  }`;
  const inner = (
    <>
      <div className="flex items-start justify-between gap-3">
        <Typography type="body-xs" color="muted">
          {label}
        </Typography>
        {spark && spark.length > 1 ? <Sparkline values={spark} /> : null}
      </div>
      <Typography type="h3" weight="normal">
        {value}
      </Typography>
      {hint ? (
        <Typography type="body-xs" color="muted">
          {hint}
        </Typography>
      ) : null}
    </>
  );
  if (!onPress) {
    return <div className={className}>{inner}</div>;
  }
  return (
    <button type="button" onClick={onPress} className={className}>
      {inner}
    </button>
  );
}

function StatusChip({
  label,
  muted,
  onPress,
}: {
  label: string;
  muted?: boolean;
  onPress?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onPress}
      className={`rounded-full px-2 py-0.5 text-xs transition-opacity hover:opacity-70 ${
        muted ? 'bg-muted/15 text-muted' : 'bg-foreground/10 text-foreground'
      }`}
    >
      {label}
    </button>
  );
}

function FunnelRow({ label, value, max }: { label: string; value: number; max: number }) {
  const width = max > 0 ? Math.max(8, Math.round((value / max) * 100)) : 8;
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-baseline justify-between gap-3">
        <Typography type="body-sm">{label}</Typography>
        <Typography type="body-sm">{value}</Typography>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-muted/15">
        <div className="h-full rounded-full bg-foreground/80" style={{ width: `${width}%` }} />
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Confirm Modal (reusable)
// ---------------------------------------------------------------------------

function ConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirm',
  variant = 'danger',
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  variant?: 'danger' | 'primary';
}) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} size="sm">
      <Typography type="body-sm" color="muted" className="mb-6">
        {message}
      </Typography>
      <div className="flex justify-end gap-2">
        <Button size="sm" variant="outline" onPress={onClose}>
          Cancel
        </Button>
        <Button
          size="sm"
          variant={variant === 'danger' ? 'danger' : 'primary'}
          onPress={() => {
            onConfirm();
            onClose();
          }}
        >
          {confirmLabel}
        </Button>
      </div>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// Toast notification
// ---------------------------------------------------------------------------

function Toast({
  message,
  type,
  onClose,
}: {
  message: string;
  type: 'success' | 'error';
  onClose: () => void;
}) {
  useEffect(() => {
    const timer = setTimeout(onClose, 4000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <div
      className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-xl border px-5 py-3.5 shadow-lg animate-in fade-in slide-in-from-bottom-4 duration-300 ${
        type === 'success'
          ? 'border-emerald-200 bg-emerald-50 text-emerald-800 dark:border-emerald-900/50 dark:bg-emerald-950/80 dark:text-emerald-300'
          : 'border-red-200 bg-red-50 text-red-800 dark:border-red-900/50 dark:bg-red-950/80 dark:text-red-300'
      }`}
    >
      {type === 'success' ? (
        <svg
          className="h-5 w-5 shrink-0"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ) : (
        <svg
          className="h-5 w-5 shrink-0"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
          />
        </svg>
      )}
      <span className="text-sm font-medium">{message}</span>
      <button onClick={onClose} className="ml-2 opacity-60 hover:opacity-100 transition-opacity">
        <svg
          className="h-4 w-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}

function SortableHeader({ label, sortDirection }: { label: string; sortDirection?: string }) {
  return (
    <Table.SortableColumnHeader
      sortDirection={sortDirection === 'ascending' || sortDirection === 'descending' ? sortDirection : undefined}
    >
      {label}
    </Table.SortableColumnHeader>
  );
}

function UserRowActions({
  user,
  onReset,
  onRole,
  onDelete,
}: {
  user: UserEntry;
  onReset: (user: UserEntry) => void;
  onRole: (user: UserEntry, role: string) => void;
  onDelete: (user: UserEntry) => void;
}) {
  return (
    <Dropdown>
      <Button isIconOnly size="sm" variant="ghost" aria-label={`Actions for ${user.email}`}>
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M12 6.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 12.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 18.75a.75.75 0 110-1.5.75.75 0 010 1.5z"
          />
        </svg>
      </Button>
      <Dropdown.Popover placement="bottom end" className="min-w-48">
        <Dropdown.Menu
          aria-label="User actions"
          onAction={(key) => {
            if (key === 'reset') onReset(user);
            if (key === 'promote') onRole(user, 'admin');
            if (key === 'demote') onRole(user, 'user');
            if (key === 'delete') onDelete(user);
          }}
        >
          <Dropdown.Item id="reset" textValue="Reset password">
            <Label>Reset password</Label>
          </Dropdown.Item>
          {user.role === 'user' ? (
            <Dropdown.Item id="promote" textValue="Promote to admin">
              <Label>Promote to admin</Label>
            </Dropdown.Item>
          ) : (
            <Dropdown.Item id="demote" textValue="Demote to user">
              <Label>Demote to user</Label>
            </Dropdown.Item>
          )}
          <Dropdown.Item id="delete" textValue="Delete account" variant="danger">
            <Label>Delete account</Label>
          </Dropdown.Item>
        </Dropdown.Menu>
      </Dropdown.Popover>
    </Dropdown>
  );
}

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------

export default function AdminUsersPage() {
  // State — full dataset fetched once; everything else is client-side derived
  const [allUsers, setAllUsers] = useState<UserEntry[]>([]);
  const [stats, setStats] = useState<AdminStats>(EMPTY_STATS);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false); // brief processing indicator during filter changes

  // Filters
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [intakeFilter, setIntakeFilter] = useState('all');
  const [joinedFilter, setJoinedFilter] = useState<'all' | '7d'>('all');

  // Pagination (client-side)
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [sortDescriptor, setSortDescriptor] = useState<SortDescriptor>({
    column: 'created_at',
    direction: 'descending',
  });

  // Confirm modals
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    onConfirm: () => void;
    confirmLabel: string;
    variant: 'danger' | 'primary';
  }>({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
    confirmLabel: '',
    variant: 'danger',
  });

  // Toast
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(timer);
  }, [search]);

  // Fetch ALL users once when filters change (client-side handles the rest)
  useEffect(() => {
    let cancelled = false;
    const fetchAll = async () => {
      // Only show full-page loader on initial load; use table overlay for re-fetches
      if (allUsers.length === 0) {
        setLoading(true);
      } else {
        setProcessing(true);
      }
      try {
        const res = await fetch('/api/admin/users?limit=1000&page=1');
        if (!res.ok) throw new Error('Failed to fetch users');
        const data: ApiResponse = await res.json();
        if (!cancelled) setAllUsers(data.users);
      } catch (err) {
        console.error('[AdminUsers] Fetch error:', err);
        setToast({ message: 'Failed to load users.', type: 'error' });
      } finally {
        if (!cancelled) {
          setLoading(false);
          // Brief processing indicator during filter debounce
          setTimeout(() => setProcessing(false), 250);
        }
      }
    };
    fetchAll();
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/admin/stats')
      .then(async (res) => {
        if (!res.ok) return;
        const statsData = (await res.json()) as Partial<AdminStats>;
        if (cancelled) return;
        setStats({
          totalUsers: statsData.totalUsers ?? 0,
          intakeCompleted: statsData.intakeCompleted ?? 0,
          sessionsCompleted: statsData.sessionsCompleted ?? 0,
          avgStressBefore: statsData.avgStressBefore ?? null,
          avgStressAfter: statsData.avgStressAfter ?? null,
          avgRating: statsData.avgRating ?? null,
          activeUsers7d: statsData.activeUsers7d ?? 0,
        });
      })
      .catch((err) => {
        console.error('[AdminUsers] Stats error:', err);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const handlePageChange = (newPage: number) => {
    setCurrentPage(newPage);
  };

  const handleLimitChange = (newLimit: number) => {
    setPageSize(newLimit);
    setCurrentPage(1); // reset to first page on page size change
  };

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type });
  };

  // ---------------------------------------------------------------------------
  // Derived data — filtered, sorted, paginated (all client-side via useMemo)
  // ---------------------------------------------------------------------------

  const displayedUsers = useMemo(() => {
    let result = [...allUsers];

    // Filter by role
    if (roleFilter !== 'all') {
      result = result.filter((u) => u.role === roleFilter);
    }

    // Filter by intake status
    if (intakeFilter === 'completed') {
      result = result.filter((u) => u.intake_completed);
    } else if (intakeFilter === 'pending') {
      result = result.filter((u) => !u.intake_completed);
    }

    // Search by email (case-insensitive substring)
    if (debouncedSearch.trim()) {
      const term = debouncedSearch.trim().toLowerCase();
      result = result.filter((u) => u.email.toLowerCase().includes(term));
    }

    if (joinedFilter === '7d') {
      const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
      result = result.filter((u) => new Date(u.created_at).getTime() >= cutoff);
    }

    const sortBy = (sortDescriptor.column as SortField) || 'created_at';
    result.sort((a, b) => {
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
        cmp = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      }
      return sortDescriptor.direction === 'ascending' ? cmp : -cmp;
    });

    const totalUsers = result.length;
    const totalPages = Math.max(1, Math.ceil(totalUsers / pageSize));
    const safePage = Math.min(currentPage, totalPages);
    const start = (safePage - 1) * pageSize;
    const paginated = result.slice(start, start + pageSize);

    return {
      users: paginated,
      pagination: { page: safePage, limit: pageSize, totalUsers, totalPages },
    };
  }, [
    allUsers,
    roleFilter,
    intakeFilter,
    joinedFilter,
    debouncedSearch,
    sortDescriptor,
    currentPage,
    pageSize,
  ]);

  const handleResetPassword = async (user: UserEntry) => {
    setConfirmModal({
      isOpen: true,
      title: 'Send Password Reset',
      message: `A password reset email will be sent to ${user.email}. This link will expire after 1 hour.`,
      confirmLabel: 'Send Reset Email',
      variant: 'primary',
      onConfirm: async () => {
        try {
          const res = await fetch('/api/admin/users', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: user.id }),
          });
          if (!res.ok) throw new Error('Failed');
          showToast(`Password reset email sent to ${user.email}`, 'success');
        } catch {
          showToast('Failed to send password reset email.', 'error');
        }
      },
    });
  };

  const handleChangeRole = async (user: UserEntry, newRole: string) => {
    const roleLabel = newRole === 'admin' ? 'Admin' : 'User';
    setConfirmModal({
      isOpen: true,
      title: `Change Role to ${roleLabel}`,
      message: `Are you sure you want to change ${user.email}'s role to "${roleLabel}"?`,
      confirmLabel: newRole === 'admin' ? 'Promote to Admin' : 'Demote to User',
      variant: 'primary',
      onConfirm: async () => {
        try {
          const res = await fetch('/api/admin/users', {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: user.id, role: newRole }),
          });
          if (!res.ok) throw new Error('Failed');
          showToast(`Role updated to "${roleLabel}" for ${user.email}`, 'success');
          setAllUsers((prev) =>
            prev.map((entry) => (entry.id === user.id ? { ...entry, role: newRole } : entry))
          );
        } catch {
          showToast('Failed to update role.', 'error');
        }
      },
    });
  };

  const handleDeleteUser = async (user: UserEntry) => {
    setConfirmModal({
      isOpen: true,
      title: 'Delete User Account',
      message: `This will permanently delete ${user.email}'s account and all associated data. This action cannot be undone.`,
      confirmLabel: 'Delete Account',
      variant: 'danger',
      onConfirm: async () => {
        try {
          const res = await fetch('/api/admin/users', {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: user.id }),
          });
          if (!res.ok) throw new Error('Failed');
          showToast(`Account deleted for ${user.email}`, 'success');
          setAllUsers((prev) => prev.filter((u) => u.id !== user.id));
        } catch {
          showToast('Failed to delete user.', 'error');
        }
      },
    });
  };

  const live = useMemo(() => {
    const total = allUsers.length;
    const admins = allUsers.filter((user) => user.role === 'admin').length;
    const intake = allUsers.filter((user) => user.intake_completed).length;
    const withSessions = allUsers.filter((user) => user.sessions_completed > 0).length;
    const cutoff = Date.now() - 7 * 24 * 60 * 60 * 1000;
    const new7d = allUsers.filter((user) => new Date(user.created_at).getTime() >= cutoff).length;
    const days = Array.from({ length: 14 }, (_, index) => {
      const date = new Date();
      date.setHours(0, 0, 0, 0);
      date.setDate(date.getDate() - (13 - index));
      return date.getTime();
    });
    const spark = days.map((start) => {
      const end = start + 24 * 60 * 60 * 1000;
      return allUsers.filter((user) => {
        const joined = new Date(user.created_at).getTime();
        return joined >= start && joined < end;
      }).length;
    });
    return { total, admins, intake, pending: Math.max(0, total - intake), withSessions, new7d, spark };
  }, [allUsers]);

  const stressDelta =
    stats.avgStressBefore != null && stats.avgStressAfter != null
      ? stats.avgStressAfter - stats.avgStressBefore
      : null;
  const hasFilters =
    roleFilter !== 'all' || intakeFilter !== 'all' || joinedFilter !== 'all' || Boolean(search);
  const clearFilters = () => {
    setRoleFilter('all');
    setIntakeFilter('all');
    setJoinedFilter('all');
    setSearch('');
  };

  const pageNumbers = useMemo(() => {
    const pages: number[] = [];
    const total = displayedUsers.pagination.totalPages;
    const current = displayedUsers.pagination.page;
    if (total <= 7) {
      for (let i = 1; i <= total; i++) pages.push(i);
    } else {
      pages.push(1);
      if (current > 3) pages.push(-1);
      for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i++) {
        pages.push(i);
      }
      if (current < total - 2) pages.push(-1);
      pages.push(total);
    }
    return pages;
  }, [displayedUsers]);

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  if (loading) {
    return (
      <UserPageShell wide="75">
        <PageHeader title="Users" />
        <DashboardBodySkeleton />
      </UserPageShell>
    );
  }

  return (
    <UserPageShell wide="75">
      <PageHeader
        title="Users"
        subtitle="Click a card to filter the table. Chips in the list do the same."
      />

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Accounts"
          value={formatNum(live.total)}
          hint={`${live.admins} admin${live.admins === 1 ? '' : 's'}`}
          spark={live.spark}
          active={!hasFilters}
          onPress={clearFilters}
        />
        <StatCard
          label="New this week"
          value={formatNum(live.new7d)}
          hint="Joined in the last 7 days"
          active={joinedFilter === '7d'}
          onPress={() => {
            setJoinedFilter('7d');
            setCurrentPage(1);
          }}
        />
        <StatCard
          label="Intake pending"
          value={formatNum(live.pending)}
          hint={`${pct(live.pending, live.total)} of accounts`}
          active={intakeFilter === 'pending'}
          onPress={() => {
            setIntakeFilter('pending');
            setCurrentPage(1);
          }}
        />
        <StatCard
          label="Active (7 days)"
          value={formatNum(stats.activeUsers7d)}
          hint={`${pct(stats.activeUsers7d, live.total || stats.totalUsers)} of accounts`}
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        <AppCard className="flex flex-col gap-5 p-5 lg:col-span-2">
          <div>
            <Typography type="body">In the list</Typography>
            <Typography type="body-xs" color="muted">
              Counts from everyone loaded, not just this page.
            </Typography>
          </div>
          <FunnelRow label="Accounts" value={live.total} max={live.total} />
          <FunnelRow label="Finished intake" value={live.intake} max={Math.max(live.total, 1)} />
          <FunnelRow label="Has sessions" value={live.withSessions} max={Math.max(live.total, 1)} />
          {stressDelta != null ? (
            <Typography type="body-xs" color="muted">
              Average stress {formatNum(stats.avgStressBefore, 2)} → {formatNum(stats.avgStressAfter, 2)}
            </Typography>
          ) : null}
        </AppCard>

        <div className="flex flex-col gap-4 lg:col-span-3">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
            <div className="min-w-0 flex-1">
              <Input
                fullWidth
                placeholder="Search by email"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-2 gap-3 lg:w-[22rem]">
              <FieldSelect
                placeholder="All roles"
                selectedKey={roleFilter}
                onChange={(key) => {
                  setRoleFilter(key);
                  setCurrentPage(1);
                }}
                items={[
                  { id: 'all', name: 'All roles' },
                  { id: 'user', name: 'User' },
                  { id: 'admin', name: 'Admin' },
                ]}
              />
              <FieldSelect
                placeholder="All intake"
                selectedKey={intakeFilter}
                onChange={(key) => {
                  setIntakeFilter(key);
                  setCurrentPage(1);
                }}
                items={[
                  { id: 'all', name: 'All intake' },
                  { id: 'completed', name: 'Completed' },
                  { id: 'pending', name: 'Pending' },
                ]}
              />
            </div>
            {hasFilters ? (
              <Button size="sm" variant="ghost" onPress={clearFilters}>
                Clear
              </Button>
            ) : null}
          </div>
          {processing ? (
            <Typography type="body-xs" color="muted">
              Updating…
            </Typography>
          ) : (
            <Typography type="body-xs" color="muted">
              {displayedUsers.pagination.totalUsers} matching
              {joinedFilter === '7d' ? ' · joined this week' : ''}
            </Typography>
          )}
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <Table>
        <Table.ScrollContainer>
          <Table.Content
            aria-label="Users"
            sortDescriptor={sortDescriptor}
            onSortChange={setSortDescriptor}
          >
            <Table.Header>
              <Table.Column allowsSorting isRowHeader id="email">
                {({ sortDirection }) => <SortableHeader label="Email" sortDirection={sortDirection} />}
              </Table.Column>
              <Table.Column allowsSorting id="role">
                {({ sortDirection }) => <SortableHeader label="Role" sortDirection={sortDirection} />}
              </Table.Column>
              <Table.Column allowsSorting id="intake_completed">
                {({ sortDirection }) => (
                  <SortableHeader label="Intake" sortDirection={sortDirection} />
                )}
              </Table.Column>
              <Table.Column allowsSorting id="sessions_completed">
                {({ sortDirection }) => (
                  <SortableHeader label="Sessions" sortDirection={sortDirection} />
                )}
              </Table.Column>
              <Table.Column allowsSorting id="created_at">
                {({ sortDirection }) => <SortableHeader label="Joined" sortDirection={sortDirection} />}
              </Table.Column>
              <Table.Column>Actions</Table.Column>
            </Table.Header>
            <Table.Body
              renderEmptyState={() => (
                <div className="flex flex-col items-center gap-3 py-8">
                  <Typography type="body-sm" color="muted">
                    No users match your filters.
                  </Typography>
                  <Button size="sm" variant="ghost" onPress={clearFilters}>
                    Clear all filters
                  </Button>
                </div>
              )}
            >
              {displayedUsers.users.map((u) => (
                <Table.Row key={u.id} id={u.id}>
                  <Table.Cell>{u.email}</Table.Cell>
                  <Table.Cell>
                    <StatusChip
                      label={u.role === 'admin' ? 'Admin' : 'User'}
                      onPress={() => {
                        setRoleFilter(u.role);
                        setCurrentPage(1);
                      }}
                    />
                  </Table.Cell>
                  <Table.Cell>
                    <StatusChip
                      label={u.intake_completed ? 'Done' : 'Pending'}
                      muted={!u.intake_completed}
                      onPress={() => {
                        setIntakeFilter(u.intake_completed ? 'completed' : 'pending');
                        setCurrentPage(1);
                      }}
                    />
                  </Table.Cell>
                  <Table.Cell>{u.sessions_completed}</Table.Cell>
                  <Table.Cell>
                    {new Date(u.created_at).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'short',
                      day: 'numeric',
                    })}
                  </Table.Cell>
                  <Table.Cell>
                    <UserRowActions
                      user={u}
                      onReset={handleResetPassword}
                      onRole={handleChangeRole}
                      onDelete={handleDeleteUser}
                    />
                  </Table.Cell>
                </Table.Row>
              ))}
            </Table.Body>
          </Table.Content>
        </Table.ScrollContainer>
        <Table.Footer>
          <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
            <div className="flex items-center gap-2">
              <Typography type="body-xs" color="muted">
                Rows
              </Typography>
              {[10, 25, 50].map((n) => (
                <Button
                  key={n}
                  size="sm"
                  variant={displayedUsers.pagination.limit === n ? 'primary' : 'ghost'}
                  onPress={() => handleLimitChange(n)}
                >
                  {n}
                </Button>
              ))}
            </div>
            <Pagination size="sm">
              <Pagination.Summary>
                Page {displayedUsers.pagination.page} of {displayedUsers.pagination.totalPages || 1}
              </Pagination.Summary>
              <Pagination.Content>
                <Pagination.Item>
                  <Pagination.Previous
                    isDisabled={displayedUsers.pagination.page <= 1}
                    onPress={() => handlePageChange(displayedUsers.pagination.page - 1)}
                  >
                    <Pagination.PreviousIcon />
                    Prev
                  </Pagination.Previous>
                </Pagination.Item>
                {pageNumbers.map((num, idx) =>
                  num === -1 ? (
                    <Pagination.Item key={`sep-${idx}`}>
                      <Pagination.Ellipsis />
                    </Pagination.Item>
                  ) : (
                    <Pagination.Item key={num}>
                      <Pagination.Link
                        isActive={displayedUsers.pagination.page === num}
                        onPress={() => handlePageChange(num)}
                      >
                        {num}
                      </Pagination.Link>
                    </Pagination.Item>
                  )
                )}
                <Pagination.Item>
                  <Pagination.Next
                    isDisabled={
                      displayedUsers.pagination.page >= displayedUsers.pagination.totalPages
                    }
                    onPress={() => handlePageChange(displayedUsers.pagination.page + 1)}
                  >
                    Next
                    <Pagination.NextIcon />
                  </Pagination.Next>
                </Pagination.Item>
              </Pagination.Content>
            </Pagination>
          </div>
        </Table.Footer>
      </Table>
      </div>

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmLabel={confirmModal.confirmLabel}
        variant={confirmModal.variant}
      />

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </UserPageShell>
  );
}
