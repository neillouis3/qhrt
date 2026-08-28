/**
 * Admin User Management Page
 * Paginated table with search, filtering, sorting, and per-user actions.
 */

'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import Modal from '@/components/Modal';
import { useSession } from '@/hooks/useSession';

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
type SortDirection = 'asc' | 'desc';

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
      <p className="text-sm text-muted mb-6">{message}</p>
      <div className="flex justify-end gap-3">
        <button
          onClick={onClose}
          className="px-4 py-2 text-sm font-medium rounded-lg border border-border text-muted hover:bg-muted/5 transition-colors dark:border-navy"
        >
          Cancel
        </button>
        <button
          onClick={() => {
            onConfirm();
            onClose();
          }}
          className={`px-4 py-2 text-sm font-medium rounded-lg text-white transition-colors ${
            variant === 'danger'
              ? 'bg-red-600 hover:bg-red-700'
              : 'bg-primary hover:bg-primary-dark'
          }`}
        >
          {confirmLabel}
        </button>
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

// ---------------------------------------------------------------------------
// Main Page
// ---------------------------------------------------------------------------

export default function AdminUsersPage() {
  const { session } = useSession();

  // State — full dataset fetched once; everything else is client-side derived
  const [allUsers, setAllUsers] = useState<UserEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false); // brief processing indicator during filter changes

  // Filters
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');
  const [intakeFilter, setIntakeFilter] = useState('all');

  // Pagination (client-side)
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Sort
  const [sortBy, setSortBy] = useState<SortField>('created_at');
  const [sortOrder, setSortOrder] = useState<SortDirection>('desc');

  // Actions dropdown
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);

  // Refs for positioning portal dropdowns
  const buttonRefs = useRef<Record<string, HTMLButtonElement | undefined>>({});

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
  }, [debouncedSearch, roleFilter, intakeFilter]);

  // Handlers — all client-side, instant response
  const handleSort = (field: SortField) => {
    if (sortBy === field) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

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

    // Sort
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
        // default: created_at
        cmp = new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      }
      return sortOrder === 'asc' ? cmp : -cmp;
    });

    // Paginate
    const totalUsers = result.length;
    const totalPages = Math.max(1, Math.ceil(totalUsers / pageSize));
    const safePage = Math.min(currentPage, totalPages);
    setCurrentPage(safePage);
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
    debouncedSearch,
    sortBy,
    sortOrder,
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
          setAllUsers((prev) => prev.filter((u) => u.id !== user.id));
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

  // Close dropdown on outside click
  useEffect(() => {
    const handler = () => setOpenDropdownId(null);
    if (openDropdownId) {
      document.addEventListener('click', handler);
      return () => document.removeEventListener('click', handler);
    }
  }, [openDropdownId]);

  // Sort indicator SVG
  const sortIcon = (field: SortField) => {
    if (sortBy !== field) {
      return (
        <svg
          className="h-4 w-4 opacity-30"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M8.25 15L12 18.75 15.75 15m-7.5-6L12 5.25 15.75 9"
          />
        </svg>
      );
    }
    return sortOrder === 'asc' ? (
      <svg
        className="h-4 w-4 text-primary"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 15.75l7.5-7.5 7.5 7.5" />
      </svg>
    ) : (
      <svg
        className="h-4 w-4 text-primary"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={2}
      >
        <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 8.25l-7.5 7.5-7.5-7.5" />
      </svg>
    );
  };

  // Pagination page numbers
  const pageNumbers = useMemo(() => {
    const pages: number[] = [];
    const total = displayedUsers.pagination.totalPages;
    const current = displayedUsers.pagination.page;
    if (total <= 7) {
      for (let i = 1; i <= total; i++) pages.push(i);
    } else {
      pages.push(1);
      if (current > 3) pages.push(-1); // separator
      for (let i = Math.max(2, current - 1); i <= Math.min(total - 1, current + 1); i++) {
        pages.push(i);
      }
      if (current < total - 2) pages.push(-1);
      pages.push(total);
    }
    return pages;
  }, [displayedUsers]);

  const displayName = session?.user?.email?.split('@')[0] ?? 'Admin';

  // Portal-rendered dropdown content (computed before render to avoid IIFE-in-JSX issues)
  const dropdownPortal = useMemo(() => {
    if (!openDropdownId || typeof window === 'undefined') return null;
    const activeUser = displayedUsers.users.find((u) => u.id === openDropdownId);
    const btnEl = buttonRefs.current[openDropdownId];
    if (!activeUser || !btnEl) return null;
    const rect = btnEl.getBoundingClientRect();
    const dropdownContent = (
      <div
        className="fixed z-50 mt-1 w-52 rounded-xl border border-border bg-white shadow-lg dark:border-navy dark:bg-navy-light"
        style={{ top: rect.bottom + window.scrollY, right: window.innerWidth - rect.right - 4 }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="py-1">
          {/* Password Reset */}
          <button
            onClick={() => {
              setOpenDropdownId(null);
              handleResetPassword(activeUser);
            }}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-navy hover:bg-accent-lighter/50 transition-colors dark:text-white"
          >
            <svg
              className="h-4 w-4 text-muted"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z"
              />
            </svg>
            Reset Password
          </button>

          {/* Role change */}
          {activeUser.role === 'user' && (
            <button
              onClick={() => {
                setOpenDropdownId(null);
                handleChangeRole(activeUser, 'admin');
              }}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-navy hover:bg-accent-lighter/50 transition-colors dark:text-white"
            >
              <svg
                className="h-4 w-4 text-muted"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z"
                />
              </svg>
              Promote to Admin
            </button>
          )}
          {activeUser.role === 'admin' && (
            <button
              onClick={() => {
                setOpenDropdownId(null);
                handleChangeRole(activeUser, 'user');
              }}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-navy hover:bg-accent-lighter/50 transition-colors dark:text-white"
            >
              <svg
                className="h-4 w-4 text-muted"
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
              Demote to User
            </button>
          )}

          {/* Divider */}
          <div className="my-1 border-t border-border dark:border-navy" />

          {/* Delete */}
          <button
            onClick={() => {
              setOpenDropdownId(null);
              handleDeleteUser(activeUser);
            }}
            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors dark:text-red-400 dark:hover:bg-red-950/30"
          >
            <svg
              className="h-4 w-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0"
              />
            </svg>
            Delete Account
          </button>
        </div>
      </div>
    );
    return createPortal(dropdownContent, document.body);
  }, [displayedUsers, openDropdownId]);

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  if (loading) {
    return (
      <div className="flex flex-col flex-1 items-center justify-center bg-zinc-50 font-sans dark:bg-navy">
        <div className="flex flex-col items-center gap-4 py-32">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-primary border-t-transparent" />
          <p className="text-muted">Loading users...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col flex-1 bg-zinc-50 font-sans dark:bg-navy">
      {/* Top gradient bar */}
      <div className="h-1 w-full bg-gradient-to-r from-primary via-accent to-primary-light" />

      <div className="flex flex-1 w-full max-w-7xl mx-auto px-6 py-10">
        <div className="w-full">
          {/* Header */}
          <div className="mb-8 flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-semibold text-navy dark:text-white tracking-tight">
                User Management
              </h1>
              <p className="mt-1 text-muted">
                {displayedUsers.pagination.totalUsers} user
                {displayedUsers.pagination.totalUsers !== 1 ? 's ' : ' '} total — manage roles,
                accounts &amp; access
              </p>
            </div>
          </div>

          {/* Filters Bar */}
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between rounded-xl border border-border bg-white p-4 shadow-sm dark:border-navy/50 dark:bg-navy-light/20">
            {/* Search */}
            <div className="relative flex-1 max-w-md">
              <svg
                className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
                />
              </svg>
              <input
                type="text"
                placeholder="Search by email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-lg border border-border bg-accent-lighter/20 pl-10 pr-4 py-2.5 text-sm text-navy placeholder-muted focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary dark:border-navy dark:bg-navy/30 dark:text-white"
              />
            </div>

            {/* Filters */}
            <div className="flex items-center gap-3">
              <label className="text-xs font-medium uppercase tracking-wider text-muted">
                Role
              </label>
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="rounded-lg border border-border bg-accent-lighter/20 px-3 py-2.5 text-sm text-navy focus:border-primary focus:outline-none dark:border-navy dark:bg-navy/30 dark:text-white"
              >
                <option value="all">All Roles</option>
                <option value="user">User</option>
                <option value="admin">Admin</option>
              </select>

              <label className="text-xs font-medium uppercase tracking-wider text-muted ml-2">
                Intake
              </label>
              <select
                value={intakeFilter}
                onChange={(e) => setIntakeFilter(e.target.value)}
                className="rounded-lg border border-border bg-accent-lighter/20 px-3 py-2.5 text-sm text-navy focus:border-primary focus:outline-none dark:border-navy dark:bg-navy/30 dark:text-white"
              >
                <option value="all">All</option>
                <option value="completed">Completed</option>
                <option value="pending">Pending</option>
              </select>

              {/* Clear filters button */}
              {(roleFilter !== 'all' || intakeFilter !== 'all' || search) && (
                <button
                  onClick={() => {
                    setRoleFilter('all');
                    setIntakeFilter('all');
                    setSearch('');
                  }}
                  className="ml-1 text-xs font-medium text-primary hover:text-primary-dark dark:hover:text-primary-light transition-colors"
                >
                  Clear
                </button>
              )}
            </div>
          </div>

          {/* Table */}
          <div className="relative rounded-2xl border border-border bg-white shadow-sm dark:border-navy/50 dark:bg-navy-light/20">
            {/* Processing overlay — dims table with centered spinner */}
            {processing && (
              <div className="absolute inset-0 z-10 flex items-center justify-center rounded-2xl bg-white/60 backdrop-blur-[1px] transition-opacity dark:bg-navy/60">
                <div className="flex flex-col items-center gap-3">
                  <div className="h-8 w-8 animate-spin rounded-full border-3 border-primary border-t-transparent" />
                  <span className="text-xs font-medium text-muted">Updating...</span>
                </div>
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-accent-lighter/30 dark:border-navy dark:bg-navy/30">
                    {[
                      { field: 'email' as SortField, label: 'Email' },
                      { field: 'role' as SortField, label: 'Role' },
                      { field: 'intake_completed' as SortField, label: 'Intake' },
                      { field: 'sessions_completed' as SortField, label: 'Sessions' },
                      { field: 'created_at' as SortField, label: 'Joined' },
                    ].map((col) => (
                      <th
                        key={col.field}
                        className="text-left px-6 py-3.5 text-xs font-medium uppercase tracking-wider text-muted cursor-pointer select-none hover:text-primary transition-colors"
                        onClick={() => handleSort(col.field)}
                      >
                        <span className="inline-flex items-center gap-1.5">
                          {col.label}
                          {sortIcon(col.field)}
                        </span>
                      </th>
                    ))}
                    <th className="text-left px-6 py-3.5 text-xs font-medium uppercase tracking-wider text-muted">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border dark:divide-navy">
                  {displayedUsers.users.length > 0 ? (
                    displayedUsers.users.map((u: UserEntry) => (
                      <tr
                        key={u.id}
                        className="hover:bg-accent-lighter/30 dark:hover:bg-primary/5 transition-colors"
                      >
                        {/* Email */}
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary-light text-xs font-semibold text-white shadow-sm">
                              {u.email.charAt(0).toUpperCase()}
                            </div>
                            <span className="font-medium text-navy dark:text-white truncate max-w-[240px]">
                              {u.email}
                            </span>
                          </div>
                        </td>

                        {/* Role */}
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${
                              u.role === 'admin'
                                ? 'bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary-light'
                                : 'bg-muted/10 text-muted dark:bg-navy dark:text-muted'
                            }`}
                          >
                            {u.role}
                          </span>
                        </td>

                        {/* Intake */}
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
                            <span className="inline-flex items-center gap-1 text-amber-600 dark:text-amber-400">
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
                                  d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
                                />
                              </svg>
                              Pending
                            </span>
                          )}
                        </td>

                        {/* Sessions */}
                        <td className="px-6 py-4 text-muted dark:text-muted">
                          {u.sessions_completed}
                        </td>

                        {/* Joined */}
                        <td className="px-6 py-4 text-muted dark:text-muted whitespace-nowrap">
                          {new Date(u.created_at).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                          })}
                        </td>

                        {/* Actions Button (dropdown rendered via portal to avoid overflow clipping) */}
                        <td className="px-6 py-4">
                          <button
                            ref={(el) => {
                              if (el) buttonRefs.current[u.id] = el;
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenDropdownId((prev) => (prev === u.id ? null : u.id));
                            }}
                            className="inline-flex items-center justify-center rounded-lg p-2 text-muted hover:text-navy hover:bg-muted/10 transition-colors dark:hover:text-white dark:hover:bg-navy/30"
                            title="Actions"
                          >
                            <svg
                              className="h-5 w-5"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                              strokeWidth={2}
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M12 6.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 12.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 18.75a.75.75 0 110-1.5.75.75 0 010 1.5z"
                              />
                            </svg>
                          </button>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={6} className="px-6 py-16 text-center">
                        <svg
                          className="mx-auto h-10 w-10 text-muted/40"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                          strokeWidth={1}
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z"
                          />
                        </svg>
                        <p className="mt-3 text-muted">No users match your filters</p>
                        <button
                          onClick={() => {
                            setRoleFilter('all');
                            setIntakeFilter('all');
                            setSearch('');
                          }}
                          className="mt-2 text-sm font-medium text-primary hover:text-primary-dark dark:hover:text-primary-light transition-colors"
                        >
                          Clear all filters
                        </button>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination Footer */}
            <div className="flex flex-col items-center justify-between gap-4 border-t border-border px-6 py-4 sm:flex-row dark:border-navy">
              {/* Rows per page */}
              <div className="flex items-center gap-2 text-sm text-muted">
                <span>Rows per page:</span>
                {[10, 25, 50].map((n) => (
                  <button
                    key={n}
                    onClick={() => handleLimitChange(n)}
                    className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                      displayedUsers.pagination.limit === n
                        ? 'bg-primary/10 text-primary dark:bg-primary/20 dark:text-primary-light'
                        : 'text-muted hover:bg-muted/10'
                    }`}
                  >
                    {n}
                  </button>
                ))}
              </div>

              {/* Page info */}
              <span className="text-sm text-muted">
                Page {displayedUsers.pagination.page} of {displayedUsers.pagination.totalPages || 1}
              </span>

              {/* Page buttons */}
              <div className="flex items-center gap-1">
                {/* Prev */}
                <button
                  onClick={() => handlePageChange(displayedUsers.pagination.page - 1)}
                  disabled={displayedUsers.pagination.page <= 1}
                  className="inline-flex items-center justify-center rounded-lg p-2 text-muted hover:text-navy hover:bg-muted/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors dark:hover:text-white"
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
                      d="M15.75 19.5L8.25 12l7.5-7.5"
                    />
                  </svg>
                </button>

                {pageNumbers.map((num, idx) =>
                  num === -1 ? (
                    <span key={`sep-${idx}`} className="px-1 text-muted">
                      …
                    </span>
                  ) : (
                    <button
                      key={num}
                      onClick={() => handlePageChange(num)}
                      className={`inline-flex items-center justify-center rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                        displayedUsers.pagination.page === num
                          ? 'bg-primary text-white shadow-sm'
                          : 'text-muted hover:text-navy hover:bg-muted/10 dark:hover:text-white'
                      }`}
                    >
                      {num}
                    </button>
                  )
                )}

                {/* Next */}
                <button
                  onClick={() => handlePageChange(displayedUsers.pagination.page + 1)}
                  disabled={displayedUsers.pagination.page >= displayedUsers.pagination.totalPages}
                  className="inline-flex items-center justify-center rounded-lg p-2 text-muted hover:text-navy hover:bg-muted/10 disabled:opacity-30 disabled:cursor-not-allowed transition-colors dark:hover:text-white"
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
                      d="M8.25 4.5l7.5 7.5-7.5 7.5"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-12 pb-6 text-center text-xs text-muted">
            &copy; {new Date().getFullYear()} QHRT Admin Panel — User Management
          </div>
        </div>
      </div>

      {/* Portal-rendered dropdowns (escapes overflow clipping) */}
      {dropdownPortal}

      {/* Confirm Modal */}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        onClose={() => setConfirmModal((prev) => ({ ...prev, isOpen: false }))}
        onConfirm={confirmModal.onConfirm}
        title={confirmModal.title}
        message={confirmModal.message}
        confirmLabel={confirmModal.confirmLabel}
        variant={confirmModal.variant}
      />

      {/* Toast */}
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  );
}
