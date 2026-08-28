import { useState, useEffect, useCallback } from 'react';
import Modal from '@/components/Modal';
import ContentErrorBoundary from '@/components/admin/ContentErrorBoundary';
import { ConfirmModal } from './shared/ConfirmModal';
import { SearchBox } from './shared/SearchBox';
import type { Prompt, KnowledgeModel } from './types';

export function PromptsTab({
  showToast,
}: {
  showToast: (msg: string, type: 'success' | 'error') => void;
}) {
  const [prompts, setPrompts] = useState<Prompt[]>([]);
  const [models, setModels] = useState<KnowledgeModel[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterModelId, setFilterModelId] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formValues, setFormValues] = useState<Record<string, string | number>>({});
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
        fetch(`/api/admin/prompts${qs}`),
        fetch('/api/admin/knowledge-models'),
      ]);
      setPrompts((await res.json()).prompts ?? []);
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

  const openEdit = (item: Prompt) => {
    setFormValues({
      knowledge_model_id: item.knowledge_model_id,
      prompt_key: item.prompt_key,
      prompt_text: item.prompt_text,
      response_type: item.response_type,
      display_order: item.display_order,
    });
    setEditingId(item.id);
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    if (
      !String(formValues.prompt_key ?? '').trim() ||
      !String(formValues.prompt_text ?? '').trim() ||
      !formValues.knowledge_model_id
    )
      return;
    try {
      const body: Record<string, any> = { ...formValues };
      if (editingId) {
        body.id = editingId;
        await fetch('/api/admin/prompts', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(body),
        });
      } else {
        await fetch('/api/admin/prompts', {
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
      await fetch(`/api/admin/prompts?id=${confirmDelete}`, { method: 'DELETE' });
      showToast('Deleted', 'success');
      fetchData();
    } catch {
      showToast('Failed to delete', 'error');
    }
    setConfirmDelete(null);
  };

  const modelNameMap = Object.fromEntries(models.map((m) => [m.id, m.name]));

  return (
    <ContentErrorBoundary fallbackTitle="Prompts failed to load">
      <div>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Prompts</h3>
          <div className="flex items-center gap-3">
            <SearchBox placeholder="Search prompts…" onSearch={setSearch} />
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
              Add Prompt
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
                  <th className="text-left py-2.5 px-3 font-medium">Key</th>
                  <th className="text-left py-2.5 px-3 font-medium hidden md:table-cell">Model</th>
                  <th className="text-left py-2.5 px-3 font-medium hidden lg:table-cell">
                    Response Type
                  </th>
                  <th className="text-center py-2.5 px-3 font-medium">Order</th>
                  <th className="text-right py-2.5 px-3 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {prompts.map((p) => (
                  <tr
                    key={p.id}
                    className="border-b border-border/50 hover:bg-muted/3 transition-colors"
                  >
                    <td className="py-2.5 px-3 font-medium max-w-xs truncate">{p.prompt_key}</td>
                    <td className="py-2.5 px-3 text-muted hidden md:table-cell">
                      {modelNameMap[p.knowledge_model_id] || p.knowledge_model_id}
                    </td>
                    <td className="py-2.5 px-3 text-muted hidden lg:table-cell">
                      <span className="px-2 py-0.5 text-xs rounded-full bg-primary/10 text-primary">
                        {p.response_type}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-center">{p.display_order}</td>
                    <td className="py-2.5 px-3 text-right">
                      <button
                        onClick={() => openEdit(p)}
                        className="text-primary hover:underline text-xs mr-3"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => setConfirmDelete(p.id)}
                        className="text-red-500 hover:underline text-xs"
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
                {prompts.length === 0 && (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-muted">
                      No prompts yet.
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
          title={editingId ? 'Edit Prompt' : 'New Prompt'}
          size="lg"
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
                Prompt Key <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={String(formValues.prompt_key ?? '')}
                onChange={(e) => setFormValues({ ...formValues, prompt_key: e.target.value })}
                placeholder="e.g. opening_question"
                className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background dark:bg-navy dark:border-navy focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1.5">
                Prompt Text <span className="text-red-500">*</span>
              </label>
              <textarea
                value={String(formValues.prompt_text ?? '')}
                onChange={(e) => setFormValues({ ...formValues, prompt_text: e.target.value })}
                placeholder="The actual prompt text"
                rows={4}
                className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background dark:bg-navy dark:border-navy focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-1.5">Response Type</label>
                <select
                  value={String(formValues.response_type ?? 'free_text')}
                  onChange={(e) => setFormValues({ ...formValues, response_type: e.target.value })}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background dark:bg-navy dark:border-navy focus:outline-none focus:ring-2 focus:ring-primary/50"
                >
                  <option value="free_text">Free Text</option>
                  <option value="scale">Scale</option>
                  <option value="multiple_choice">Multiple Choice</option>
                  <option value="yes_no">Yes / No</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1.5">Display Order</label>
                <input
                  type="number"
                  value={String(formValues.display_order ?? 0)}
                  onChange={(e) =>
                    setFormValues({ ...formValues, display_order: Number(e.target.value) })
                  }
                  className="w-full px-3 py-2 text-sm rounded-lg border border-border bg-background dark:bg-navy dark:border-navy focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
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
              disabled={
                !String(formValues.prompt_key ?? '').trim() ||
                !String(formValues.prompt_text ?? '').trim() ||
                !formValues.knowledge_model_id
              }
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
          title="Delete Prompt"
          message="Are you sure? This will also delete associated branch rules."
          confirmLabel="Delete"
        />
      </div>
    </ContentErrorBoundary>
  );
}
