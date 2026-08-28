import { useState, useEffect, useCallback } from 'react';
import Modal from '@/components/Modal';
import ContentErrorBoundary from '@/components/admin/ContentErrorBoundary';
import { ConfirmModal } from './shared/ConfirmModal';
import { loadConditions } from './shared/loadConditions';
import { SearchBox } from './shared/SearchBox';
import type { Condition } from './types';

export function QHRTMappingsTab({
  showToast,
}: {
  showToast: (msg: string, type: 'success' | 'error') => void;
}) {
  const [mappings, setMappings] = useState<any[]>([]);
  const [conditions, setConditions] = useState<Condition[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterConditionId, setFilterConditionId] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formValues, setFormValues] = useState<Record<string, string>>({});
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
        fetch(`/api/admin/qhrt-mappings${qs}`),
        loadConditions(),
      ]);
      setMappings((await res.json()).mappings ?? []);
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

  const openEdit = (m: any) => {
    setFormValues({
      condition_id: m.condition_id,
      primary_emotional_theme: m.primary_emotional_theme ?? '',
      secondary_emotional_theme: m.secondary_emotional_theme ?? '',
      organ_system: m.organ_system ?? '',
      gland_system: m.gland_system ?? '',
      qhrt_focus: m.qhrt_focus ?? '',
      internal_notes: m.internal_notes ?? '',
    });
    setEditingId(m.id);
    setModalOpen(true);
  };

  const openCreateForCondition = (conditionId: string) => {
    const existing = mappings.find((m) => m.condition_id === conditionId);
    if (existing) {
      openEdit(existing);
      return;
    }
    setFormValues({
      condition_id: conditionId,
      primary_emotional_theme: '',
      secondary_emotional_theme: '',
      organ_system: '',
      gland_system: '',
      qhrt_focus: '',
      internal_notes: '',
    });
    setEditingId(null);
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    if (!formValues.condition_id) return;
    try {
      const body: Record<string, any> = { ...formValues };
      for (const key of Object.keys(body)) {
        if (body[key] === '') body[key] = null;
      }
      if (editingId) {
        body.id = editingId;
        await fetch('/api/admin/qhrt-mappings', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
      } else {
        await fetch('/api/admin/qhrt-mappings', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
      }
      showToast('QHRT mapping saved', 'success');
      setModalOpen(false);
      fetchData();
    } catch {
      showToast('Failed to save mapping', 'error');
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    try {
      await fetch('/api/admin/qhrt-mappings', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: confirmDelete }),
      });
      showToast('Mapping deleted', 'success');
      fetchData();
    } catch {
      showToast('Failed to delete mapping', 'error');
    }
    setConfirmDelete(null);
  };

  const condNameMap = Object.fromEntries(conditions.map((c) => [c.id, c.name]));

  return (
    <ContentErrorBoundary fallbackTitle="QHRT Mappings failed to load">
      <div>
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="text-lg font-semibold">QHRT Mappings</h3>
            <p className="text-sm text-muted mt-0.5">
              Internal clinical framework data — not visible to users.
            </p>
          </div>
          <SearchBox placeholder="Search by condition…" onSearch={setSearch} />
        </div>

        <div className="mb-4 flex gap-3">
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
          <select
            onChange={(e) => {
              if (e.target.value) openCreateForCondition(e.target.value);
            }}
            className="px-3 py-2 text-sm rounded-lg border border-border bg-background dark:bg-navy dark:border-navy focus:outline-none focus:ring-2 focus:ring-primary/50"
          >
            <option value="">Quick-edit condition...</option>
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
                  <th className="text-left py-2.5 px-3 font-medium hidden md:table-cell">
                    Primary Theme
                  </th>
                  <th className="text-left py-2.5 px-3 font-medium hidden lg:table-cell">
                    Organ System
                  </th>
                  <th className="text-left py-2.5 px-3 font-medium hidden lg:table-cell">
                    QHRT Focus
                  </th>
                  <th className="text-right py-2.5 px-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {mappings.map((m) => (
                  <tr
                    key={m.id}
                    className="border-b border-border/50 hover:bg-muted/3 transition-colors"
                  >
                    <td className="py-2.5 px-3 font-medium">
                      {condNameMap[m.condition_id] || m.condition_id}
                    </td>
                    <td className="py-2.5 px-3 text-muted hidden md:table-cell max-w-xs truncate">
                      {m.primary_emotional_theme || '—'}
                    </td>
                    <td className="py-2.5 px-3 text-muted hidden lg:table-cell max-w-xs truncate">
                      {m.organ_system || '—'}
                    </td>
                    <td className="py-2.5 px-3 text-muted hidden lg:table-cell max-w-xs truncate">
                      {m.qhrt_focus || '—'}
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      <button
                        onClick={() => openEdit(m)}
                        className="text-primary hover:underline text-xs mr-3"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => setConfirmDelete(m.id)}
                        className="text-red-500 hover:underline text-xs"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
                {mappings.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-muted">
                      No mappings yet. Select a condition above to create one.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Edit Modal */}
        <Modal
          isOpen={modalOpen}
          onClose={() => {
            setModalOpen(false);
            setFormValues({});
            setEditingId(null);
          }}
          title={editingId ? 'Edit QHRT Mapping' : 'New QHRT Mapping'}
          size="lg"
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">Condition</label>
              <select
                value={formValues.condition_id}
                onChange={(e) => setFormValues({ ...formValues, condition_id: e.target.value })}
                disabled={!!editingId}
                className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background dark:bg-navy dark:border-navy focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50"
              >
                <option value="">Select condition</option>
                {conditions.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">Primary Emotional Theme</label>
                <input
                  type="text"
                  value={formValues.primary_emotional_theme}
                  onChange={(e) =>
                    setFormValues({ ...formValues, primary_emotional_theme: e.target.value })
                  }
                  className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background dark:bg-navy dark:border-navy focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">
                  Secondary Emotional Theme
                </label>
                <input
                  type="text"
                  value={formValues.secondary_emotional_theme}
                  onChange={(e) =>
                    setFormValues({ ...formValues, secondary_emotional_theme: e.target.value })
                  }
                  className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background dark:bg-navy dark:border-navy focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">Organ System</label>
                <input
                  type="text"
                  value={formValues.organ_system}
                  onChange={(e) => setFormValues({ ...formValues, organ_system: e.target.value })}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background dark:bg-navy dark:border-navy focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Gland System</label>
                <input
                  type="text"
                  value={formValues.gland_system}
                  onChange={(e) => setFormValues({ ...formValues, gland_system: e.target.value })}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background dark:bg-navy dark:border-navy focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">QHRT Focus</label>
              <input
                type="text"
                value={formValues.qhrt_focus}
                onChange={(e) => setFormValues({ ...formValues, qhrt_focus: e.target.value })}
                className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background dark:bg-navy dark:border-navy focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Internal Notes</label>
              <textarea
                value={formValues.internal_notes}
                onChange={(e) => setFormValues({ ...formValues, internal_notes: e.target.value })}
                rows={2}
                className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background dark:bg-navy dark:border-navy focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <button
              onClick={() => {
                setModalOpen(false);
                setFormValues({});
                setEditingId(null);
              }}
              className="px-4 py-2 text-sm font-medium rounded-lg border border-border text-muted hover:bg-muted/5 transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              className="px-4 py-2 text-sm font-medium rounded-lg bg-primary text-white hover:bg-primary-dark transition-colors"
            >
              {editingId ? 'Update' : 'Create'}
            </button>
          </div>
        </Modal>

        <ConfirmModal
          isOpen={!!confirmDelete}
          onClose={() => setConfirmDelete(null)}
          onConfirm={handleDelete}
          title="Delete Mapping"
          message="Are you sure you want to delete this mapping? This cannot be undone."
          confirmLabel="Delete"
        />
      </div>
    </ContentErrorBoundary>
  );
}
