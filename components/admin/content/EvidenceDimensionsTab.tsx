import { useState, useEffect, useCallback } from 'react';
import Modal from '@/components/Modal';
import ContentErrorBoundary from '@/components/admin/ContentErrorBoundary';
import { ConfirmModal } from './shared/ConfirmModal';
import { SearchBox } from './shared/SearchBox';
import type { EvidenceDimension, KnowledgeModel } from './types';

export function EvidenceDimensionsTab({
  showToast,
}: {
  showToast: (msg: string, type: 'success' | 'error') => void;
}) {
  const [dimensions, setDimensions] = useState<EvidenceDimension[]>([]);
  const [models, setModels] = useState<KnowledgeModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterModelId, setFilterModelId] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formValues, setFormValues] = useState<Record<string, string | number | boolean>>({});
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (filterModelId) params.set('knowledge_model_id', filterModelId);
      if (search) params.set('search', search);
      const qs = params.toString() ? `?${params.toString()}` : '';
      const [res, modelRes] = await Promise.all([
        fetch(`/api/admin/evidence-dimensions${qs}`),
        fetch('/api/admin/knowledge-models'),
      ]);
      setDimensions((await res.json()).evidence_dimensions ?? []);
      setModels((await modelRes.json()).knowledge_models ?? []);
    } catch (err) {
      console.error(err);
      showToast('Failed to load data', 'error');
    } finally {
      setLoading(false);
    }
  }, [filterModelId, search, showToast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const openCreate = () => {
    setFormValues({});
    setEditingId(null);
    setModalOpen(true);
  };

  const openEdit = (item: EvidenceDimension) => {
    setFormValues({
      knowledge_model_id: item.knowledge_model_id,
      name: item.name,
      description: item.description ?? '',
      priority: item.priority,
      is_required: item.is_required,
    });
    setEditingId(item.id);
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    if (!String(formValues.name ?? '').trim() || !formValues.knowledge_model_id) return;
    try {
      const body: Record<string, any> = { ...formValues };
      if (body.description === '') body.description = null;
      if (editingId) {
        body.id = editingId;
        await fetch('/api/admin/evidence-dimensions', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
      } else {
        await fetch('/api/admin/evidence-dimensions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
      }
      showToast(editingId ? 'Updated' : 'Created', 'success');
      setModalOpen(false);
      fetchData();
    } catch {
      showToast('Operation failed', 'error');
    }
  };

  const handleDelete = async () => {
    if (!confirmDelete) return;
    try {
      await fetch('/api/admin/evidence-dimensions', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: confirmDelete }),
      });
      showToast('Deleted', 'success');
      fetchData();
    } catch {
      showToast('Failed to delete', 'error');
    }
    setConfirmDelete(null);
  };

  const modelNameMap = Object.fromEntries(models.map((m) => [m.id, m.name]));

  return (
    <ContentErrorBoundary fallbackTitle="Evidence Dimensions failed to load">
      <div>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Evidence Dimensions</h3>
          <div className="flex items-center gap-3">
            <SearchBox placeholder="Search dimensions…" onSearch={setSearch} />
            <button
              onClick={openCreate}
              disabled={models.length === 0}
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
              Add Dimension
            </button>
          </div>
        </div>

        <div className="mb-3">
          <select
            value={filterModelId}
            onChange={(e) => setFilterModelId(e.target.value)}
            className="px-3 py-2 text-sm rounded-lg border border-border bg-background dark:bg-navy dark:border-navy focus:outline-none focus:ring-2 focus:ring-primary/50"
          >
            <option value="">All models</option>
            {models.map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
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
                  <th className="text-left py-2.5 px-3 font-medium">Name</th>
                  <th className="text-left py-2.5 px-3 font-medium hidden md:table-cell">Model</th>
                  <th className="text-center py-2.5 px-3 font-medium">Priority</th>
                  <th className="text-center py-2.5 px-3 font-medium">Required</th>
                  <th className="text-right py-2.5 px-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {dimensions.map((d) => (
                  <tr
                    key={d.id}
                    className="border-b border-border/50 hover:bg-muted/3 transition-colors"
                  >
                    <td className="py-2.5 px-3 font-medium">{d.name}</td>
                    <td className="py-2.5 px-3 text-muted hidden md:table-cell">
                      {modelNameMap[d.knowledge_model_id] || d.knowledge_model_id}
                    </td>
                    <td className="py-2.5 px-3 text-center">{d.priority}</td>
                    <td className="py-2.5 px-3 text-center">{d.is_required ? '✓' : '—'}</td>
                    <td className="py-2.5 px-3 text-right">
                      <button
                        onClick={() => openEdit(d)}
                        className="text-primary hover:underline text-xs mr-3"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => setConfirmDelete(d.id)}
                        className="text-red-500 hover:underline text-xs"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
                {dimensions.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-muted">
                      No evidence dimensions yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        <Modal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          title={editingId ? 'Edit Dimension' : 'New Evidence Dimension'}
          size="md"
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1.5">
                Knowledge Model <span className="text-red-500">*</span>
              </label>
              <select
                value={String(formValues.knowledge_model_id ?? '')}
                onChange={(e) =>
                  setFormValues({ ...formValues, knowledge_model_id: e.target.value })
                }
                disabled={!!editingId}
                className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background dark:bg-navy dark:border-navy focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50"
              >
                <option value="">Select model</option>
                {models.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">
                Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={String(formValues.name ?? '')}
                onChange={(e) => setFormValues({ ...formValues, name: e.target.value })}
                placeholder="Dimension name"
                className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background dark:bg-navy dark:border-navy focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">Description</label>
              <textarea
                value={String(formValues.description ?? '')}
                onChange={(e) => setFormValues({ ...formValues, description: e.target.value })}
                placeholder="Optional"
                rows={2}
                className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background dark:bg-navy dark:border-navy focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">Priority</label>
                <input
                  type="number"
                  value={String(formValues.priority ?? 0)}
                  onChange={(e) =>
                    setFormValues({ ...formValues, priority: Number(e.target.value) })
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
              disabled={!String(formValues.name ?? '').trim() || !formValues.knowledge_model_id}
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
          title="Delete Dimension"
          message="Are you sure? This will also delete associated prompts and rules."
          confirmLabel="Delete"
        />
      </div>
    </ContentErrorBoundary>
  );
}
