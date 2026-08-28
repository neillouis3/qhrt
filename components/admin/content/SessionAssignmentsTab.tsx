import { useState, useEffect, useCallback } from 'react';
import Modal from '@/components/Modal';
import ContentErrorBoundary from '@/components/admin/ContentErrorBoundary';
import { ConfirmModal } from './shared/ConfirmModal';
import { loadConditions } from './shared/loadConditions';
import { SearchBox } from './shared/SearchBox';
import type { Condition } from './types';

export function SessionAssignmentsTab({
  showToast,
}: {
  showToast: (msg: string, type: 'success' | 'error') => void;
}) {
  const [assignments, setAssignments] = useState<any[]>([]);
  const [conditions, setConditions] = useState<Condition[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterConditionId, setFilterConditionId] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formValues, setFormValues] = useState<Record<string, string | number | boolean>>({});
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterConditionId) params.set('conditionId', filterConditionId);
      if (search) params.set('search', search);
      const qs = params.toString() ? `?${params.toString()}` : '';
      const [res, condRes] = await Promise.all([
        fetch(`/api/admin/session-assignments${qs}`),
        loadConditions(),
      ]);
      setAssignments((await res.json()).assignments ?? []);
      setConditions(condRes);
    } catch (err) {
      console.error(err);
      showToast('Failed to load data', 'error');
    } finally {
      setLoading(false);
    }
  }, [filterConditionId, search, showToast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const openCreate = () => {
    setFormValues({});
    setEditingId(null);
    setModalOpen(true);
  };

  const openEdit = (item: any) => {
    setFormValues({
      condition_id: item.condition_id,
      session_id: item.session_id,
      session_number: item.session_number,
      is_required: item.is_required,
      display_order: item.display_order,
    });
    setEditingId(item.id);
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    if (!formValues.condition_id || !formValues.session_id) return;
    try {
      const body: Record<string, any> = { ...formValues };
      if (editingId) {
        body.id = editingId;
        await fetch('/api/admin/session-assignments', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
      } else {
        await fetch('/api/admin/session-assignments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
      }
      showToast('Session assignment saved', 'success');
      setModalOpen(false);
      fetchData();
    } catch {
      showToast('Failed to save', 'error');
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    try {
      await fetch('/api/admin/session-assignments', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: confirmDelete }),
      });
      showToast('Assignment deleted', 'success');
      fetchData();
    } catch {
      showToast('Failed to delete', 'error');
    }
    setConfirmDelete(null);
  };

  const condNameMap = Object.fromEntries(conditions.map((c) => [c.id, c.name]));

  return (
    <ContentErrorBoundary fallbackTitle="Session Assignments failed to load">
      <div>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Session Assignments</h3>
          <div className="flex items-center gap-3">
            <SearchBox placeholder="Search by condition…" onSearch={setSearch} />
            <button
              onClick={openCreate}
              disabled={conditions.length === 0}
              className="px-4 py-2 text-sm font-medium rounded-lg bg-primary text-white hover:bg-primary-dark transition-colors flex items-center gap-2 disabled:opacity-50"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
              </svg>
              Add Assignment
            </button>
          </div>
        </div>

        <div className="mb-3">
          <select
            value={filterConditionId}
            onChange={(e) => setFilterConditionId(e.target.value)}
            className="px-3 py-2 text-sm rounded-lg border border-border bg-background dark:bg-navy dark:border-navy focus:outline-none focus:ring-2 focus:ring-primary/50"
          >
            <option value="">All conditions</option>
            {conditions.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-muted bg-muted/3 dark:bg-navy-light/5">
                  <th className="text-left py-2.5 px-3 font-medium">Condition</th>
                  <th className="text-left py-2.5 px-3 font-medium">Session ID</th>
                  <th className="text-center py-2.5 px-3 font-medium">#</th>
                  <th className="text-center py-2.5 px-3 font-medium">Required</th>
                  <th className="text-right py-2.5 px-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {assignments.map((a) => (
                  <tr
                    key={a.id}
                    className="border-b border-border/50 hover:bg-muted/3 transition-colors"
                  >
                    <td className="py-2.5 px-3 font-medium">
                      {condNameMap[a.condition_id] || a.condition_id}
                    </td>
                    <td className="py-2.5 px-3 text-muted">{a.session_id}</td>
                    <td className="py-2.5 px-3 text-center">{a.session_number}</td>
                    <td className="py-2.5 px-3 text-center">{a.is_required ? '✓' : '—'}</td>
                    <td className="py-2.5 px-3 text-right">
                      <button
                        onClick={() => openEdit(a)}
                        className="text-primary hover:underline text-xs mr-3"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => setConfirmDelete(a.id)}
                        className="text-red-500 hover:underline text-xs"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
                {assignments.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-muted">
                      No session assignments yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Create/Edit Modal */}
        <Modal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          title={editingId ? 'Edit Assignment' : 'New Assignment'}
          size="md"
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">
                Condition <span className="text-red-500">*</span>
              </label>
              <select
                value={String(formValues.condition_id ?? '')}
                onChange={(e) => setFormValues({ ...formValues, condition_id: e.target.value })}
                className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background dark:bg-navy dark:border-navy focus:outline-none focus:ring-2 focus:ring-primary/50"
              >
                <option value="">Select condition</option>
                {conditions.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">
                Session ID <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={String(formValues.session_id ?? '')}
                onChange={(e) => setFormValues({ ...formValues, session_id: e.target.value })}
                placeholder="Session identifier"
                className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background dark:bg-navy dark:border-navy focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">Session Number</label>
                <input
                  type="number"
                  value={String(formValues.session_number ?? 0)}
                  onChange={(e) =>
                    setFormValues({ ...formValues, session_number: Number(e.target.value) })
                  }
                  className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background dark:bg-navy dark:border-navy focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
              <div className="flex items-end pb-2">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={Boolean(formValues.is_required)}
                    onChange={(e) =>
                      setFormValues({ ...formValues, is_required: e.target.checked })
                    }
                    className="rounded border-border"
                  />
                  Required
                </label>
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <button
              onClick={() => setModalOpen(false)}
              className="px-4 py-2 text-sm font-medium rounded-lg border border-border text-muted hover:bg-muted/5 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={!formValues.condition_id || !formValues.session_id}
              className="px-4 py-2 text-sm font-medium rounded-lg bg-primary text-white hover:bg-primary-dark transition-colors disabled:opacity-50"
            >
              {editingId ? 'Update' : 'Create'}
            </button>
          </div>
        </Modal>

        <ConfirmModal
          isOpen={!!confirmDelete}
          onClose={() => setConfirmDelete(null)}
          onConfirm={handleDelete}
          title="Delete Assignment"
          message="Are you sure you want to delete this assignment? This cannot be undone."
          confirmLabel="Delete"
        />
      </div>
    </ContentErrorBoundary>
  );
}
