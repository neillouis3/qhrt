import { useState, useEffect, useCallback } from 'react';
import Modal from '@/components/Modal';
import ContentErrorBoundary from '@/components/admin/ContentErrorBoundary';
import { SearchBox } from './shared/SearchBox';

interface AeeEntry {
  id: string;
  name: string;
  description: string | null;
  resolution_prompts: any;
  is_active: boolean;
}

export function AeeCatalogTab({
  showToast,
}: {
  showToast: (msg: string, type: 'success' | 'error') => void;
}) {
  const [entries, setEntries] = useState<AeeEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formValues, setFormValues] = useState<Record<string, string>>({});
  const [search, setSearch] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const url = search ? `/api/admin/aee?search=${encodeURIComponent(search)}` : '/api/admin/aee';
      const res = await fetch(url);
      setEntries((await res.json()).aee_entries ?? []);
    } catch (err) {
      console.error(err);
      showToast('Failed to load AEE entries', 'error');
    } finally {
      setLoading(false);
    }
  }, [showToast, search]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const openCreate = () => {
    setFormValues({});
    setEditingId(null);
    setModalOpen(true);
  };

  const openEdit = (item: AeeEntry) => {
    setFormValues({
      id: item.id,
      name: item.name || '',
      description: item.description || '',
      resolution_prompts:
        typeof item.resolution_prompts === 'string'
          ? item.resolution_prompts
          : JSON.stringify(item.resolution_prompts || {}),
    });
    setEditingId(item.id);
    setModalOpen(true);
  };

  const handleSubmit = async () => {
    try {
      const body: Record<string, any> = { ...formValues };
      try {
        body.resolution_prompts = JSON.parse(String(formValues.resolution_prompts));
      } catch {
        body.resolution_prompts = {};
      }
      if (editingId) body.id = editingId;
      await fetch('/api/admin/aee', {
        method: editingId ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      showToast(editingId ? 'AEE entry updated' : 'AEE entry created', 'success');
      setModalOpen(false);
      fetchData();
    } catch {
      showToast('Operation failed', 'error');
    }
  };

  return (
    <ContentErrorBoundary fallbackTitle="AEE Catalog failed to load">
      <div>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Archetypal Emotional Energetics</h3>
          <div className="flex items-center gap-3">
            <SearchBox placeholder="Search AEE entries…" onSearch={setSearch} />
            <button
              onClick={openCreate}
              className="px-4 py-2 text-sm font-medium rounded-lg bg-primary text-white hover:bg-primary-dark transition-colors flex items-center gap-2"
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
              Add AEE Entry
            </button>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
          </div>
        ) : entries.length === 0 ? (
          <div className="rounded-xl border border-border bg-background p-8 text-center dark:bg-navy">
            <p className="text-muted dark:text-gray-400">No AEE entries configured yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-xl border border-border dark:border-gray-700">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 dark:bg-navy-light">
                <tr>
                  <th className="px-4 py-3 text-left font-medium">Name</th>
                  <th className="px-4 py-3 text-left font-medium">Description</th>
                  <th className="px-4 py-3 text-center font-medium">Active</th>
                  <th className="px-4 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((e) => (
                  <tr key={e.id} className="border-t border-border dark:border-gray-700">
                    <td className="px-4 py-3 font-medium">{e.name}</td>
                    <td className="px-4 py-3 max-w-xs truncate text-muted dark:text-gray-400">
                      {e.description || '—'}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`px-2 py-1 rounded-full text-xs ${e.is_active ? 'bg-green-500/10 text-green-600 dark:text-green-400' : 'bg-red-500/10 text-red-600 dark:text-red-400'}`}
                      >
                        {e.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => openEdit(e)}
                        className="px-2 py-1 text-xs text-muted hover:text-foreground transition-colors"
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        <Modal
          isOpen={modalOpen}
          onClose={() => setModalOpen(false)}
          title={editingId ? 'Edit AEE Entry' : 'Add AEE Entry'}
          size="lg"
        >
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-muted dark:text-gray-400">Name</label>
              <input
                type="text"
                value={formValues.name || ''}
                onChange={(e) => setFormValues({ ...formValues, name: e.target.value })}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm dark:bg-navy dark:text-white"
                placeholder="e.g. Grief / Loss"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-muted dark:text-gray-400">
                Description
              </label>
              <textarea
                value={formValues.description || ''}
                onChange={(e) => setFormValues({ ...formValues, description: e.target.value })}
                rows={2}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm dark:bg-navy dark:text-white"
              />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-sm font-medium text-muted dark:text-gray-400">
                Resolution Prompts (JSON)
              </label>
              <textarea
                value={formValues.resolution_prompts || '{}'}
                onChange={(e) =>
                  setFormValues({ ...formValues, resolution_prompts: e.target.value })
                }
                rows={6}
                className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm font-mono dark:bg-navy dark:text-white"
                placeholder='{"resolution_intro": "...", "resolution_prompts": [...]}'
              />
            </div>
            <div className="flex gap-3 justify-end mt-2">
              <button
                onClick={() => setModalOpen(false)}
                className="px-4 py-2 border border-border rounded-lg text-sm text-muted hover:text-foreground transition-colors dark:border-gray-700"
              >
                Cancel
              </button>
              <button
                onClick={handleSubmit}
                className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-primary-dark transition-colors"
              >
                {editingId ? 'Update' : 'Create'}
              </button>
            </div>
          </div>
        </Modal>
      </div>
    </ContentErrorBoundary>
  );
}
